import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { validationResult } from 'express-validator';
import { uploadImageToCloudinary, cleanCloudinaryUrl } from '../services/cloudinary.service';

// Get all buildings
export const getAllBuildings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, status, search } = req.query;

    const user = (req as any).user;
    
    // If user has no organization, return empty array
    if (!user.organization_id) {
      return res.json({
        success: true,
        data: {
          buildings: [],
          count: 0,
        },
        message: 'No organization associated with this account. Please join or create an organization to manage buildings.',
      });
    }
    
    let query = `
      SELECT b.id, b.name, b.type as building_type, b.year_built, b.square_footage,
             b.state, b.city, b.zip_code, b.address as street_address, b.image_url, b.status, b.created_at, b.updated_at,
             b.cost_per_sqft, b.replacement_value,
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
      query += ` AND b.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR street_address ILIKE $${params.length} OR city ILIKE $${params.length})`;
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
      `SELECT id, name, type as building_type, year_built, square_footage,
              state, city, zip_code, address as street_address,
              image_url, status, created_by_user_id, created_at, updated_at,
              cost_per_sqft, replacement_value
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
      building_type,
      year_built,
      square_footage,
      size, // Accept both size and square_footage for backward compatibility
      state,
      city,
      zip_code,
      street_address,
      cost_per_sqft: requestCostPerSqft,
      replacement_value: requestReplacementValue, // Accept replacement_value from frontend
      image_url
    } = req.body;

    // Use type parameter for the database column 'type'
    const finalBuildingType = type || building_type || 'office-single';
    // Use square_footage parameter for the database column 'square_footage'
    const finalSquareFootage = square_footage || size;

    // Clean and decode the image URL to fix HTML entity encoding issues
    const cleanImageUrl = cleanCloudinaryUrl(image_url);
    
    if (cleanImageUrl !== image_url) {
      console.log('🖼️ Image URL cleaned:', { original: image_url, cleaned: cleanImageUrl });
    }

    const user = (req as any).user;

    // Validate required user data
    if (!user || !user.id || !user.organization_id) {
      console.error('❌ Invalid user data for building creation:', { userId: user?.id, orgId: user?.organization_id });
      return res.status(401).json({
        success: false,
        message: 'Authentication error. Please log in again.',
      });
    }

    console.log('ℹ️ Creating building for user:', user.id, 'org:', user.organization_id);

    // Get cost_per_sqft from request or use default
    const cost_per_sqft = requestCostPerSqft || 200;
    // Use requestReplacementValue if provided, otherwise calculate from square_footage
    const replacement_value = requestReplacementValue ||
                             (finalSquareFootage ? finalSquareFootage * cost_per_sqft : null);

    const result = await pool.query(
      `INSERT INTO buildings (
        organization_id, name, type, year_built, square_footage,
        state, city, zip_code, address,
        image_url, created_by_user_id, status, cost_per_sqft, replacement_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, name, type as building_type, year_built, square_footage,
                state, city, zip_code, address as street_address,
                image_url, status, created_at, cost_per_sqft, replacement_value`,
      [
        user.organization_id, name, finalBuildingType, year_built, finalSquareFootage,
        state, city, zip_code, street_address,
        cleanImageUrl, user.id, 'active', cost_per_sqft, replacement_value
      ]
    );

    const building = result.rows[0];
    console.log('✅ Building created successfully:', building.id);

    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: {
        building,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating building:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'A building with similar details already exists.',
      });
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid organization or user reference.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create building. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
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
      'name', 'type', 'building_type', 'year_built', 'size', 'square_footage',
      'state', 'city', 'zip_code', 'address', 'street_address',
      'image_url', 'status', 'cost_per_sqft'
    ];

    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        // Map frontend fields to database columns
        let dbField = field;
        if (field === 'building_type') dbField = 'type';
        if (field === 'size') dbField = 'square_footage';
        if (field === 'street_address') dbField = 'address';

        let fieldValue = updateFields[field];

        // Clean image_url if it's being updated
        if (field === 'image_url' && fieldValue && typeof fieldValue === 'string') {
          const cleanedValue = cleanCloudinaryUrl(fieldValue);
          if (cleanedValue !== fieldValue) {
            console.log('🖼️ Image URL cleaned in update:', { original: fieldValue, cleaned: cleanedValue });
          }
          fieldValue = cleanedValue;
        }

        updates.push(`${dbField} = $${paramCount}`);
        values.push(fieldValue);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    // Check if we need to recalculate replacement_value
    if (updateFields.square_footage !== undefined || updateFields.size !== undefined || updateFields.cost_per_sqft !== undefined) {
      // Get current building data to calculate replacement value
      const currentBuilding = await pool.query(
        'SELECT square_footage, cost_per_sqft FROM buildings WHERE id = $1',
        [id]
      );

      if (currentBuilding.rows.length > 0) {
        const current = currentBuilding.rows[0];
        const newSquareFootage = updateFields.square_footage !== undefined ? updateFields.square_footage :
                                updateFields.size !== undefined ? updateFields.size :
                                current.square_footage;
        const newCostPerSqft = updateFields.cost_per_sqft !== undefined ? updateFields.cost_per_sqft : (current.cost_per_sqft || 200);
        const newReplacementValue = newSquareFootage ? newSquareFootage * newCostPerSqft : null;

        updates.push(`replacement_value = $${paramCount}`);
        values.push(newReplacementValue);
        paramCount++;
      }
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE buildings
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, type as building_type, year_built, square_footage,
                 state, city, zip_code, address as street_address,
                 image_url, status, updated_at, cost_per_sqft, replacement_value`,
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
    console.log('ℹ️ Image upload request received');
    
    if (!req.file) {
      console.error('❌ No image file provided in request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }
    
    console.log('ℹ️ Uploading image:', { 
      filename: req.file.originalname, 
      size: req.file.size, 
      mimetype: req.file.mimetype 
    });

    // Upload image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(
      req.file.buffer,
      'onyx/buildings', // Cloudinary folder
      undefined // Let Cloudinary generate the public_id
    );

    if (!uploadResult.success) {
      console.error('❌ Cloudinary upload failed:', uploadResult.error);
      return res.status(500).json({
        success: false,
        message: uploadResult.error || 'Failed to upload image',
      });
    }

    console.log('✅ Image uploaded successfully:', uploadResult.url);

    // Return the Cloudinary URL
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
      },
    });
  } catch (error: any) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};