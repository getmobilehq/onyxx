import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { calculateAssessmentFCI, completeAssessmentWithFCI } from '../services/fci.service';

// Create a new assessment
export const createAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      building_id,
      type, // 'pre_assessment' or 'field_assessment'
      description,
      scheduled_date,
      assigned_to_user_id
    } = req.body;

    const user = (req as any).user;

    // Validate required fields
    if (!building_id || !type) {
      return res.status(400).json({
        success: false,
        message: 'Building ID and assessment type are required'
      });
    }

    // Validate assessment type
    if (!['pre_assessment', 'field_assessment'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Assessment type must be either pre_assessment or field_assessment'
      });
    }

    // Check if building exists
    const buildingCheck = await pool.query(
      'SELECT id FROM buildings WHERE id = $1',
      [building_id]
    );

    if (buildingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    const result = await pool.query(
      `INSERT INTO assessments (
        building_id, type, description, status, scheduled_date, 
        assigned_to_user_id, created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
      RETURNING *`,
      [
        building_id,
        type,
        description || null,
        'pending',
        scheduled_date || null,
        assigned_to_user_id || user.id,
        user.id
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        assessment: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all assessments with filtering
export const getAllAssessments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { building_id, type, status, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.*,
        b.name as building_name,
        b.street_address,
        b.city,
        b.state,
        u1.name as assigned_to_name,
        u2.name as created_by_name
      FROM assessments a
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN users u1 ON a.assigned_to_user_id = u1.id
      LEFT JOIN users u2 ON a.created_by_user_id = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (building_id) {
      params.push(building_id);
      query += ` AND a.building_id = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND a.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND a.assigned_to_user_id = $${params.length}`;
    }

    query += ` ORDER BY a.created_at DESC`;

    // Add pagination
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM assessments a
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (building_id) {
      countParams.push(building_id);
      countQuery += ` AND a.building_id = $${countParams.length}`;
    }

    if (type) {
      countParams.push(type);
      countQuery += ` AND a.type = $${countParams.length}`;
    }

    if (status) {
      countParams.push(status);
      countQuery += ` AND a.status = $${countParams.length}`;
    }

    if (assigned_to) {
      countParams.push(assigned_to);
      countQuery += ` AND a.assigned_to_user_id = $${countParams.length}`;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        assessments: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get assessment by ID
export const getAssessmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        a.*,
        b.name as building_name,
        b.street_address,
        b.city,
        b.state,
        b.type as building_type,
        b.year_built,
        b.square_footage,
        u1.name as assigned_to_name,
        u2.name as created_by_name
      FROM assessments a
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN users u1 ON a.assigned_to_user_id = u1.id
      LEFT JOIN users u2 ON a.created_by_user_id = u2.id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: {
        assessment: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update assessment
export const updateAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      description,
      status,
      scheduled_date,
      assigned_to_user_id,
      started_at,
      completed_at,
      notes
    } = req.body;

    // Check if assessment exists
    const assessmentCheck = await pool.query(
      'SELECT id FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (scheduled_date !== undefined) {
      updates.push(`scheduled_date = $${paramCount}`);
      params.push(scheduled_date);
      paramCount++;
    }

    if (assigned_to_user_id !== undefined) {
      updates.push(`assigned_to_user_id = $${paramCount}`);
      params.push(assigned_to_user_id);
      paramCount++;
    }

    if (started_at !== undefined) {
      updates.push(`started_at = $${paramCount}`);
      params.push(started_at);
      paramCount++;
    }

    if (completed_at !== undefined) {
      updates.push(`completed_at = $${paramCount}`);
      params.push(completed_at);
      paramCount++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');

    // Add the ID parameter for WHERE clause
    params.push(id);

    const query = `
      UPDATE assessments 
      SET ${updates.join(', ')} 
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        assessment: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete assessment
export const deleteAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM assessments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get assessment elements (for field assessments)
export const getAssessmentElements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { major_group } = req.query;

    // Check if assessment exists
    const assessmentCheck = await pool.query(
      'SELECT id, type FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get assessment elements with their ratings
    let query = `
      SELECT 
        e.*,
        ae.id as assessment_element_id,
        ae.condition_rating,
        ae.notes as element_notes,
        ae.photo_urls,
        ae.updated_at as element_updated_at
      FROM elements e
      LEFT JOIN assessment_elements ae ON e.id = ae.element_id AND ae.assessment_id = $1
      WHERE 1=1
    `;
    const params: any[] = [id];

    if (major_group) {
      params.push(major_group);
      query += ` AND e.major_group = $${params.length}`;
    }

    query += ' ORDER BY e.major_group, e.group_element, e.individual_element';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        elements: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update assessment element rating
export const updateAssessmentElement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assessmentId, elementId } = req.params;
    const { condition_rating, notes, photo_urls } = req.body;

    // Validate condition rating
    if (condition_rating && ![1, 2, 3, 4, 5].includes(condition_rating)) {
      return res.status(400).json({
        success: false,
        message: 'Condition rating must be between 1 and 5'
      });
    }

    // Check if assessment exists
    const assessmentCheck = await pool.query(
      'SELECT id FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if element exists
    const elementCheck = await pool.query(
      'SELECT id FROM elements WHERE id = $1',
      [elementId]
    );

    if (elementCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Element not found'
      });
    }

    // Upsert assessment element
    const result = await pool.query(
      `INSERT INTO assessment_elements (
        assessment_id, element_id, condition_rating, notes, photo_urls, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (assessment_id, element_id) 
      DO UPDATE SET
        condition_rating = EXCLUDED.condition_rating,
        notes = EXCLUDED.notes,
        photo_urls = EXCLUDED.photo_urls,
        updated_at = NOW()
      RETURNING *`,
      [
        assessmentId,
        elementId,
        condition_rating,
        notes || null,
        photo_urls ? JSON.stringify(photo_urls) : null
      ]
    );

    res.json({
      success: true,
      data: {
        assessment_element: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Calculate FCI for an assessment
export const calculateFCI = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if assessment exists
    const assessmentCheck = await pool.query(
      'SELECT id, status FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Calculate FCI
    const fciResults = await calculateAssessmentFCI(id);

    res.json({
      success: true,
      data: {
        fci_results: fciResults
      }
    });
  } catch (error) {
    console.error('FCI calculation error:', error);
    next(error);
  }
};

// Complete assessment with automatic FCI calculation
export const completeAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if assessment exists and is not already completed
    const assessmentCheck = await pool.query(
      'SELECT id, status FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentCheck.rows[0];
    
    if (assessment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Assessment is already completed'
      });
    }

    // Complete assessment with FCI calculation
    const fciResults = await completeAssessmentWithFCI(id);

    // Get updated assessment
    const updatedAssessment = await pool.query(
      `SELECT a.*, b.name as building_name, u.name as assigned_to_name
       FROM assessments a
       LEFT JOIN buildings b ON a.building_id = b.id
       LEFT JOIN users u ON a.assigned_to_user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Assessment completed successfully with FCI calculation',
      data: {
        assessment: updatedAssessment.rows[0],
        fci_results: fciResults
      }
    });
  } catch (error) {
    console.error('Assessment completion error:', error);
    next(error);
  }
};