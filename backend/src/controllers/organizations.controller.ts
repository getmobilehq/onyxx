import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { validationResult } from 'express-validator';

// Get all organizations
export const getAllOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      `SELECT o.*, COUNT(DISTINCT u.id) as member_count
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        organizations: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get organization by ID
export const getOrganizationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, COUNT(DISTINCT u.id) as member_count
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: {
        organization: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's organization
export const getCurrentOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await pool.query(
      `SELECT o.*, u.is_organization_owner, COUNT(DISTINCT u2.id) as member_count
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       LEFT JOIN users u2 ON u2.organization_id = o.id
       WHERE u.id = $1
       GROUP BY o.id, u.is_organization_owner`,
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].id) {
      return res.json({
        success: true,
        data: {
          organization: null,
          isOwner: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        organization: result.rows[0],
        isOwner: result.rows[0].is_organization_owner,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create organization
export const createOrganization = async (
  req: Request,
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

    const userId = req.user?.id;
    const { name, description, industry, size, website, phone, address, city, state, zip_code, country, subscription_plan } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user already has an organization
    const userOrgCheck = await pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (userOrgCheck.rows[0]?.organization_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of an organization. Please leave your current organization first.',
      });
    }

    // Create organization
    const result = await pool.query(
      `INSERT INTO organizations (name, description, industry, size, website, phone, address, city, state, zip_code, country, subscription_plan) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [name, description, industry, size, website, phone, address, city, state, zip_code, country, subscription_plan || 'free']
    );

    const organization = result.rows[0];

    // Update user to be owner of the organization
    await pool.query(
      `UPDATE users 
       SET organization_id = $1, is_organization_owner = true 
       WHERE id = $2`,
      [organization.id, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organization,
        isOwner: true,
      },
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Organization with this name already exists',
      });
    }
    next(error);
  }
};

// Join organization
export const joinOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { organizationId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user already has an organization
    const userOrgCheck = await pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (userOrgCheck.rows[0]?.organization_id) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of an organization. Please leave your current organization first.',
      });
    }

    // Verify organization exists
    const orgCheck = await pool.query(
      'SELECT id, name FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (orgCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Update user's organization
    await pool.query(
      `UPDATE users 
       SET organization_id = $1 
       WHERE id = $2`,
      [organizationId, userId]
    );

    res.json({
      success: true,
      message: 'Joined organization successfully',
      data: {
        organization: orgCheck.rows[0],
        isOwner: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Leave organization
export const leaveOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user is organization owner
    const ownerCheck = await pool.query(
      'SELECT organization_id, is_organization_owner FROM users WHERE id = $1',
      [userId]
    );

    if (ownerCheck.rows[0]?.is_organization_owner) {
      // Check if there are other members
      const memberCount = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND id != $2',
        [ownerCheck.rows[0].organization_id, userId]
      );

      if (parseInt(memberCount.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Organization owner cannot leave while other members exist. Please transfer ownership first.',
        });
      }
    }

    // Remove user from organization
    await pool.query(
      `UPDATE users 
       SET organization_id = NULL, is_organization_owner = false 
       WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Left organization successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update organization (organization owner only)
export const updateOrganization = async (
  req: Request,
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

    const { id } = req.params;
    const userId = req.user?.id;
    const { name, description, industry, size, website, phone, address, city, state, zip_code, country, subscription_plan } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user is platform admin or organization owner
    const userCheck = await pool.query(
      'SELECT is_platform_admin, is_organization_owner, organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userData = userCheck.rows[0];

    // Verify permission: platform admin OR organization owner
    if (!userData.is_platform_admin) {
      if (!userData.is_organization_owner || userData.organization_id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Only organization owners can update their organization',
        });
      }
    }

    // Update organization
    const result = await pool.query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           industry = COALESCE($3, industry),
           size = COALESCE($4, size),
           website = COALESCE($5, website),
           phone = COALESCE($6, phone),
           address = COALESCE($7, address),
           city = COALESCE($8, city),
           state = COALESCE($9, state),
           zip_code = COALESCE($10, zip_code),
           country = COALESCE($11, country),
           subscription_plan = COALESCE($12, subscription_plan),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [name, description, industry, size, website, phone, address, city, state, zip_code, country, subscription_plan, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        organization: result.rows[0],
      },
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Organization with this name already exists',
      });
    }
    next(error);
  }
};

// Delete organization (platform admin only)
export const deleteOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user is platform admin
    const userCheck = await pool.query(
      'SELECT is_platform_admin FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!userCheck.rows[0].is_platform_admin) {
      return res.status(403).json({
        success: false,
        message: 'Only platform admins can delete organizations',
      });
    }

    // Check if organization has members
    const memberCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = $1',
      [id]
    );

    if (parseInt(memberCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete organization with existing members. Please remove all members first.',
      });
    }

    // Delete organization
    const result = await pool.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};