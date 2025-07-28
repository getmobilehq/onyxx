import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types/auth';

export const organizationsController = {
  // Get all organizations (admin only)
  async getAll(req: AuthRequest, res: Response) {
    try {
      // Only admins can see all organizations
      if (req.user?.role !== 'admin') {
        throw new AppError('Unauthorized - Admin access required', 403);
      }

      const result = await pool.query(`
        SELECT 
          o.*,
          COUNT(DISTINCT u.id) as user_count,
          COUNT(DISTINCT b.id) as building_count,
          COUNT(DISTINCT a.id) as assessment_count
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id
        LEFT JOIN buildings b ON b.organization_id = o.id
        LEFT JOIN assessments a ON a.organization_id = o.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);

      res.json({
        success: true,
        data: {
          organizations: result.rows
        }
      });
    } catch (error) {
      console.error('Get all organizations error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch organizations'
        });
      }
    }
  },

  // Get organization by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if user belongs to this organization or is admin
      const userCheck = await pool.query(
        'SELECT organization_id, role FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows[0]?.role !== 'admin' && userCheck.rows[0]?.organization_id !== id) {
        throw new AppError('Unauthorized - You do not have access to this organization', 403);
      }

      const result = await pool.query(`
        SELECT 
          o.*,
          (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as total_users,
          (SELECT COUNT(*) FROM buildings WHERE organization_id = o.id) as total_buildings,
          (SELECT COUNT(*) FROM assessments WHERE organization_id = o.id) as total_assessments,
          (SELECT COUNT(*) FROM assessments WHERE organization_id = o.id AND status = 'in_progress') as active_assessments
        FROM organizations o
        WHERE o.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        throw new AppError('Organization not found', 404);
      }

      // Transform the data to match frontend expectations
      const org = result.rows[0];
      const transformedOrg = {
        id: org.id,
        name: org.name,
        description: org.description,
        industry: org.industry,
        size: org.size,
        website: org.website,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        zipCode: org.zip_code,
        country: org.country,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        // Include subscription fields at top level for compatibility
        subscription_plan: org.subscription_plan,
        subscription_status: org.subscription_status,
        subscription: {
          plan: org.subscription_plan,
          status: org.subscription_status,
          expiresAt: org.subscription_expires_at
        },
        stats: {
          totalUsers: parseInt(org.total_users) || 0,
          totalBuildings: parseInt(org.total_buildings) || 0,
          totalAssessments: parseInt(org.total_assessments) || 0,
          activeProjects: parseInt(org.active_assessments) || 0
        }
      };

      res.json({
        success: true,
        data: {
          organization: transformedOrg
        }
      });
    } catch (error) {
      console.error('Get organization by id error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch organization'
        });
      }
    }
  },

  // Get current user's organization
  async getCurrent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await pool.query(`
        SELECT 
          o.*,
          (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as total_users,
          (SELECT COUNT(*) FROM buildings WHERE organization_id = o.id) as total_buildings,
          (SELECT COUNT(*) FROM assessments WHERE organization_id = o.id) as total_assessments,
          (SELECT COUNT(*) FROM assessments WHERE organization_id = o.id AND status = 'in_progress') as active_assessments
        FROM organizations o
        INNER JOIN users u ON u.organization_id = o.id
        WHERE u.id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new AppError('Organization not found', 404);
      }

      // Transform the data to match frontend expectations
      const org = result.rows[0];
      const transformedOrg = {
        id: org.id,
        name: org.name,
        description: org.description,
        industry: org.industry,
        size: org.size,
        website: org.website,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        zipCode: org.zip_code,
        country: org.country,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        // Include subscription fields at top level for compatibility
        subscription_plan: org.subscription_plan,
        subscription_status: org.subscription_status,
        subscription: {
          plan: org.subscription_plan,
          status: org.subscription_status,
          expiresAt: org.subscription_expires_at
        },
        stats: {
          totalUsers: parseInt(org.total_users) || 0,
          totalBuildings: parseInt(org.total_buildings) || 0,
          totalAssessments: parseInt(org.total_assessments) || 0,
          activeProjects: parseInt(org.active_assessments) || 0
        }
      };

      res.json({
        success: true,
        data: {
          organization: transformedOrg
        }
      });
    } catch (error) {
      console.error('Get current organization error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch current organization'
        });
      }
    }
  },

  // Create new organization (admin only)
  async create(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Unauthorized - Admin access required', 403);
      }

      const { 
        name, 
        description, 
        industry, 
        size, 
        website, 
        phone, 
        address, 
        city, 
        state, 
        zip_code, 
        country,
        subscription_plan = 'free' 
      } = req.body;

      const result = await pool.query(`
        INSERT INTO organizations (
          name, description, industry, size, website, phone, 
          address, city, state, zip_code, country, subscription_plan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        name, description, industry, size, website, phone,
        address, city, state, zip_code, country, subscription_plan
      ]);

      res.status(201).json({
        success: true,
        data: {
          organization: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create organization'
      });
    }
  },

  // Update organization
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if user is organization owner or admin
      const userCheck = await pool.query(`
        SELECT u.organization_id, u.role, u.is_organization_owner
        FROM users u
        WHERE u.id = $1
      `, [userId]);

      const user = userCheck.rows[0];
      if (!user || (user.role !== 'admin' && (!user.is_organization_owner || user.organization_id !== id))) {
        throw new AppError('Unauthorized - Only organization owners and admins can update organization details', 403);
      }

      const { 
        name, 
        description, 
        industry, 
        size, 
        website, 
        phone, 
        address, 
        city, 
        state, 
        zipCode, 
        country,
        subscription_plan,
        subscription_status
      } = req.body;

      const result = await pool.query(`
        UPDATE organizations 
        SET 
          name = COALESCE($1, name),
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
          subscription_status = COALESCE($13, subscription_status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *
      `, [
        name, description, industry, size, website, phone,
        address, city, state, zipCode, country, subscription_plan, subscription_status, id
      ]);

      if (result.rows.length === 0) {
        throw new AppError('Organization not found', 404);
      }

      // Get updated stats
      const statsResult = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE organization_id = $1) as total_users,
          (SELECT COUNT(*) FROM buildings WHERE organization_id = $1) as total_buildings,
          (SELECT COUNT(*) FROM assessments WHERE organization_id = $1) as total_assessments,
          (SELECT COUNT(*) FROM assessments WHERE organization_id = $1 AND status = 'in_progress') as active_assessments
      `, [id]);

      const org = result.rows[0];
      const stats = statsResult.rows[0];

      const transformedOrg = {
        id: org.id,
        name: org.name,
        description: org.description,
        industry: org.industry,
        size: org.size,
        website: org.website,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        zipCode: org.zip_code,
        country: org.country,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        // Include subscription fields at top level for compatibility
        subscription_plan: org.subscription_plan,
        subscription_status: org.subscription_status,
        subscription: {
          plan: org.subscription_plan,
          status: org.subscription_status,
          expiresAt: org.subscription_expires_at
        },
        stats: stats ? {
          totalUsers: parseInt(stats.total_users) || 0,
          totalBuildings: parseInt(stats.total_buildings) || 0,
          totalAssessments: parseInt(stats.total_assessments) || 0,
          activeProjects: parseInt(stats.active_assessments) || 0
        } : undefined
      };

      res.json({
        success: true,
        data: {
          organization: transformedOrg
        }
      });
    } catch (error) {
      console.error('Update organization error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update organization'
        });
      }
    }
  },

  // Delete organization (admin only)
  async delete(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Unauthorized - Admin access required', 403);
      }

      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM organizations WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Organization not found', 404);
      }

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete organization'
        });
      }
    }
  }
};