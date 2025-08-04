import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { CreateUserDTO, LoginDTO, JWTPayload, AuthTokens } from '../types/user.types';
import { validationResult } from 'express-validator';

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

    const { email, password, name, role } = req.body;

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

    // Users start without organization - they can join/create one after signup
    // This simplifies the signup process and avoids foreign key constraints
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, organization_id, created_at`,
      [name, email, password_hash, role]
    );

    const user = result.rows[0];

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organization_id: user.organization_id,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully - No organization required!',
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
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    // Generic error handler
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
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
              u.organization_id, u.is_organization_owner,
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
              u.organization_id, u.is_organization_owner,
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
          organization_name: user.organization_name,
          organization_subscription_plan: user.subscription_plan,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};