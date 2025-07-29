import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { validationResult } from 'express-validator';
import { uploadImageToCloudinary } from '../services/cloudinary.service';

// Get all buildings
export const getAllBuildings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, status, search } = req.query;

    const user = (req as any).user;
    
    let query = `
      SELECT b.id, b.name, b.building_type as type, b.construction_type, b.year_built, b.square_footage,
             b.state, b.city, b.zip_code, b.address as street_address, b.image_url, b.status, b.created_at, b.updated_at,
             (
               SELECT a.fci_score 
               FROM assessments a 
               WHERE a.building_id = b.id 
                 AND a.status = 'completed' 
                 AND a.fci_score IS NOT NULL
               ORDER BY a.completion_date DESC 
               LIMIT 1
             ) as latest_fci_score
      FROM buildings b
      WHERE b.organization_id = $1
    `;
    const params: any[] = [user.organization_id];

    // Add filters
    if (type) {
      params.push(type);
      query += ` AND building_type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR address ILIKE $${params.length} OR city ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        buildings: result.rows,
        count: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get building by ID
export const getBuildingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const result = await pool.query(
      `SELECT id, name, building_type as type, construction_type, year_built, square_footage,
              state, city, zip_code, address as street_address, 
              image_url, status, created_by as created_by_user_id, created_at, updated_at
       FROM buildings
       WHERE id = $1 AND organization_id = $2`,
      [id, user.organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    res.json({
      success: true,
      data: {
        building: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new building
export const createBuilding = async (
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

    const {
      name,
      type,
      construction_type,
      year_built,
      square_footage,
      state,
      city,
      zip_code,
      street_address,
      cost_per_sqft,
      image_url
    } = req.body;

    const user = (req as any).user;

    const result = await pool.query(
      `INSERT INTO buildings (
        organization_id, name, building_type, construction_type, year_built, square_footage,
        state, city, zip_code, address, 
        image_url, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, building_type as type, construction_type, year_built, square_footage,
                state, city, zip_code, address as street_address, 
                image_url, status, created_at`,
      [
        user.organization_id, name, type, construction_type, year_built, square_footage,
        state, city, zip_code, street_address,
        image_url, user.id, 'active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: {
        building: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update building
export const updateBuilding = async (
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
    const updateFields = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'building_type', 'construction_type', 'year_built', 'square_footage',
      'state', 'city', 'zip_code', 'address',
      'image_url', 'status'
    ];

    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        const dbField = field === 'type' ? 'building_type' : field === 'street_address' ? 'address' : field;
        updates.push(`${dbField} = $${paramCount}`);
        values.push(updateFields[field]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE buildings 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, building_type as type, construction_type, year_built, square_footage,
                 state, city, zip_code, address as street_address, 
                 image_url, status, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    res.json({
      success: true,
      message: 'Building updated successfully',
      data: {
        building: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete building
export const deleteBuilding = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if building exists
    const checkResult = await pool.query(
      'SELECT id FROM buildings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    // Check if building has assessments
    const assessmentCheck = await pool.query(
      'SELECT COUNT(*) FROM assessments WHERE building_id = $1',
      [id]
    );

    if (parseInt(assessmentCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete building with existing assessments. Please delete all assessments first.',
      });
    }

    // Check if building has reports
    const reportCheck = await pool.query(
      'SELECT COUNT(*) FROM reports WHERE building_id = $1',
      [id]
    );

    if (parseInt(reportCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete building with existing reports. Please delete all reports first.',
      });
    }

    await pool.query('DELETE FROM buildings WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Building deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Upload building image to Cloudinary
export const uploadBuildingImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(
      req.file.buffer,
      'onyx/buildings', // Cloudinary folder
      undefined // Let Cloudinary generate the public_id
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: uploadResult.error || 'Failed to upload image',
      });
    }

    // Return the Cloudinary URL
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    next(error);
  }
};