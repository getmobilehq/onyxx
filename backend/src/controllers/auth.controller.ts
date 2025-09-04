import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { CreateUserDTO, LoginDTO, JWTPayload, AuthTokens } from '../types/user.types';
import { validationResult } from 'express-validator';
import TokensController from './tokens.controller';

// Generate JWT tokens
const generateTokens = (payload: JWTPayload): AuthTokens => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    payload as object,
    jwtSecret,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    payload as object,
    jwtRefreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// Register new user
export const register = async (
  req: Request<{}, {}, CreateUserDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, name, role, token_code, organization_name } = req.body;

    // Support both token-based and direct organization registration
    let token = null;
    let orgNameToUse = organization_name;
    
    // If token_code is provided, validate it (backward compatibility)
    if (token_code) {
      const tokenResult = await pool.query(
        `SELECT * FROM tokens 
         WHERE code = $1 
         AND status = 'active' 
         AND expires_at > NOW()`,
        [token_code]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token code',
        });
      }

      token = tokenResult.rows[0];
      orgNameToUse = token.organization_name || organization_name;
    } else if (!organization_name) {
      // If no token and no organization name, error
      return res.status(400).json({
        success: false,
        message: 'Either a token code or organization name is required',
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Start a transaction
    const client = await pool.connect();
    let organization: any;
    try {
      await client.query('BEGIN');

      // Create organization with appropriate name
      const finalOrgName = orgNameToUse || `${name}'s Organization`;
      const orgResult = await client.query(
        `INSERT INTO organizations (name, subscription_plan, created_at) 
         VALUES ($1, $2, NOW()) 
         RETURNING id, name`,
        [finalOrgName, 'professional']
      );
      organization = orgResult.rows[0];

      // Create user as admin of the new organization
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role, organization_id, is_organization_owner, signup_token) 
         VALUES ($1, $2, $3, 'admin', $4, true, $5) 
         RETURNING id, name, email, role, organization_id, created_at`,
        [name, email, password_hash, organization.id, token ? token.id : null]
      );
      const user = userResult.rows[0];

      // Mark token as used if one was provided
      if (token) {
        const tokensController = new TokensController(pool);
        await tokensController.markTokenAsUsed(token.id, user.id, client);
      }

      await client.query('COMMIT');
      client.release();

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organization_id: user.organization_id,
      is_platform_admin: user.is_platform_admin,
    });

      res.status(201).json({
        success: true,
        message: 'User registered successfully with organization!',
        organization: organization.name,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization_id: user.organization_id, // Should be null
        },
        tokens,
        },
      });
    } catch (innerError) {
      await client.query('ROLLBACK');
      client.release();
      throw innerError;
    }
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack
    });
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    // Let the error middleware handle it to see the real error
    throw error;
  }
};

// Login user
export const login = async (
  req: Request<{}, {}, LoginDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Get user from database with organization info
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, 
              u.organization_id, u.is_organization_owner, u.is_platform_admin,
              o.name as organization_name, o.subscription_plan
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organization_id: user.organization_id,
      is_platform_admin: user.is_platform_admin,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_platform_admin: user.is_platform_admin,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error('JWT refresh secret not configured');
    }
    
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as JWTPayload;

    // Generate new tokens
    const tokens = generateTokens({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      organization_id: decoded.organization_id,
      is_platform_admin: decoded.is_platform_admin,
    });

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
      });
    }
    next(error);
  }
};

// Get current user
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              u.organization_id, u.is_organization_owner, u.is_platform_admin,
              o.name as organization_name, o.subscription_plan
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          organization_id: user.organization_id,
          is_organization_owner: user.is_organization_owner,
          is_platform_admin: user.is_platform_admin,
          organization_name: user.organization_name,
          organization_subscription_plan: user.subscription_plan,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};