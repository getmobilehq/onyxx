import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { validationResult } from 'express-validator';

// Get pre-assessment by assessment ID
export const getPreAssessmentByAssessmentId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('ℹ️ Getting pre-assessment by assessment ID:', req.params.assessmentId);
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required',
      });
    }

    const result = await pool.query(
      `SELECT * FROM pre_assessments WHERE assessment_id = $1`,
      [assessmentId]
    );

    if (result.rows.length === 0) {
      console.log('❌ Pre-assessment not found for assessment ID:', assessmentId);
      return res.status(404).json({
        success: false,
        message: 'Pre-assessment not found',
      });
    }

    console.log('✅ Pre-assessment found:', result.rows[0].id);
    res.json({
      success: true,
      data: {
        preAssessment: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('❌ Error getting pre-assessment by assessment ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-assessment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get pre-assessment by building ID
export const getPreAssessmentByBuildingId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { buildingId } = req.params;

    const result = await pool.query(
      `SELECT * FROM pre_assessments 
       WHERE building_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [buildingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-assessment not found',
      });
    }

    res.json({
      success: true,
      data: {
        preAssessment: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create or update pre-assessment
export const savePreAssessment = async (
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
      assessment_id,
      building_id,
      assessment_type,
      assessment_date,
      assessment_scope,
      building_size,
      building_type,
      replacement_value,
      selected_elements,
      checklist,
      additional_notes,
      assessor_name,
      status = 'draft'
    } = req.body;

    const userId = (req as any).user?.id;
    
    if (!userId) {
      console.error('❌ No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    console.log('ℹ️ Saving pre-assessment for user:', userId);

    // Check if pre-assessment already exists for this assessment
    const existingResult = await pool.query(
      'SELECT id FROM pre_assessments WHERE assessment_id = $1',
      [assessment_id]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing pre-assessment
      result = await pool.query(
        `UPDATE pre_assessments 
         SET assessment_type = $1,
             assessment_date = $2,
             assessment_scope = $3,
             building_size = $4,
             building_type = $5,
             replacement_value = $6,
             selected_elements = $7,
             checklist = $8,
             additional_notes = $9,
             assessor_name = $10,
             status = $11,
             completed_at = CASE WHEN $11 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE assessment_id = $12
         RETURNING *`,
        [
          assessment_type,
          assessment_date,
          assessment_scope,
          building_size,
          building_type,
          replacement_value,
          JSON.stringify(selected_elements),
          JSON.stringify(checklist),
          additional_notes,
          assessor_name,
          status,
          assessment_id
        ]
      );
    } else {
      // Create new pre-assessment
      result = await pool.query(
        `INSERT INTO pre_assessments (
          assessment_id,
          building_id,
          assessment_type,
          assessment_date,
          assessment_scope,
          building_size,
          building_type,
          replacement_value,
          selected_elements,
          checklist,
          additional_notes,
          assessor_name,
          status,
          completed_at,
          created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          assessment_id,
          building_id,
          assessment_type,
          assessment_date,
          assessment_scope,
          building_size,
          building_type,
          replacement_value,
          JSON.stringify(selected_elements),
          JSON.stringify(checklist),
          additional_notes,
          assessor_name,
          status,
          status === 'completed' ? new Date() : null,
          userId
        ]
      );
    }

    res.status(existingResult.rows.length > 0 ? 200 : 201).json({
      success: true,
      message: existingResult.rows.length > 0 ? 'Pre-assessment updated successfully' : 'Pre-assessment created successfully',
      data: {
        preAssessment: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete pre-assessment
export const deletePreAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if pre-assessment exists
    const checkResult = await pool.query(
      'SELECT id FROM pre_assessments WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-assessment not found',
      });
    }

    await pool.query('DELETE FROM pre_assessments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Pre-assessment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get all pre-assessments for a user (with pagination)
export const getAllPreAssessments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('ℹ️ Getting all pre-assessments with query:', req.query);
    const { page = 1, limit = 10, status, building_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const user = (req as any).user;
    if (!user || !user.organization_id) {
      console.error('❌ User or organization not found in getAllPreAssessments');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let query = `
      SELECT pa.*, 
             b.name as building_name,
             b.building_type as building_type_name,
             u.name as created_by_name
      FROM pre_assessments pa
      LEFT JOIN buildings b ON pa.building_id = b.id AND b.organization_id = $1
      LEFT JOIN users u ON pa.created_by_user_id = u.id
      WHERE b.organization_id = $1
    `;
    const params: any[] = [user.organization_id];
    let paramCount = 1;

    // Add filters
    if (status) {
      paramCount++;
      params.push(status);
      query += ` AND pa.status = $${paramCount}`;
    }

    if (building_id) {
      paramCount++;
      params.push(building_id);
      query += ` AND pa.building_id = $${paramCount}`;
    }

    query += ` ORDER BY pa.created_at DESC`;
    
    // Add pagination
    paramCount++;
    params.push(Number(limit));
    query += ` LIMIT $${paramCount}`;
    
    paramCount++;
    params.push(offset);
    query += ` OFFSET $${paramCount}`;

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM pre_assessments pa
      LEFT JOIN buildings b ON pa.building_id = b.id
      WHERE b.organization_id = $1
    `;
    const countParams: any[] = [user.organization_id];
    let countParamCount = 1;

    if (status) {
      countParamCount++;
      countParams.push(status);
      countQuery += ` AND pa.status = $${countParamCount}`;
    }

    if (building_id) {
      countParamCount++;
      countParams.push(building_id);
      countQuery += ` AND pa.building_id = $${countParamCount}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    console.log('✅ Found', result.rows.length, 'pre-assessments');
    
    res.json({
      success: true,
      data: {
        preAssessments: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error getting all pre-assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-assessments',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};