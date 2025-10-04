import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { calculateAssessmentFCI, completeAssessmentWithFCI } from '../services/fci.service';
import { mapFrontendToDbCategory } from '../utils/category-mapper';
import { processElementDataForAssessment } from '../utils/element-mapper';

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
      assigned_to
    } = req.body;

    const user = (req as any).user;

    console.log('🎯 Creating assessment with data:', {
      building_id,
      type,
      user_id: user?.id,
      organization_id: user?.organization_id,
      full_user_object: user
    });

    // Validate user has organization
    if (!user || !user.organization_id) {
      console.error('❌ User missing organization_id:', user);
      return res.status(400).json({
        success: false,
        message: 'User must be associated with an organization to create assessments'
      });
    }

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
        organization_id, building_id, name, assessment_type, status, assessment_date,
        assigned_to_user_id, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        user.organization_id,
        building_id,
        description || `${type} Assessment`,
        type,
        'pending',
        scheduled_date || null,
        assigned_to || user.id,
        user.id
      ]
    );

    console.log('✅ Assessment inserted into database:', {
      id: result.rows[0].id,
      building_id: result.rows[0].building_id,
      assessment_type: result.rows[0].assessment_type,
      status: result.rows[0].status
    });

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
    const user = (req as any).user;

    // If user has no organization, return empty array
    if (!user.organization_id) {
      return res.json({
        success: true,
        data: {
          assessments: [],
          count: 0,
        },
        message: 'No organization associated with this account. Please join or create an organization to manage assessments.',
      });
    }

    let query = `
      SELECT 
        a.*,
        b.name as building_name,
        b.street_address as street_address,
        b.city,
        b.state,
        u2.name as created_by_name
      FROM assessments a
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN users u2 ON a.created_by_user_id = u2.id
      WHERE a.organization_id = $1
    `;
    const params: any[] = [user.organization_id];

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

    // Assigned_to column doesn't exist - commented out
    // if (assigned_to) {
    //   params.push(assigned_to);
    //   query += ` AND a.assigned_to = $${params.length}`;
    // }

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

    // Assigned_to column doesn't exist - commented out
    // if (assigned_to) {
    //   countParams.push(assigned_to);
    //   countQuery += ` AND a.assigned_to = $${countParams.length}`;
    // }

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
    const user = (req as any).user;

    const result = await pool.query(
      `SELECT 
        a.*,
        b.name as building_name,
        b.street_address as street_address,
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
      WHERE a.id = $1 AND a.organization_id = $2`,
      [id, user.organization_id]
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
      assigned_to,
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

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramCount}`);
      params.push(assigned_to);
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

    // Get deficiencies for each assessment element
    const elementsWithDeficiencies = await Promise.all(
      result.rows.map(async (element) => {
        if (element.assessment_element_id) {
          const deficienciesResult = await pool.query(
            `SELECT id, description, cost, category, photos, created_at, updated_at
             FROM assessment_deficiencies 
             WHERE assessment_element_id = $1
             ORDER BY created_at ASC`,
            [element.assessment_element_id]
          );
          
          return {
            ...element,
            deficiencies: deficienciesResult.rows
          };
        }
        return {
          ...element,
          deficiencies: []
        };
      })
    );

    res.json({
      success: true,
      data: {
        elements: elementsWithDeficiencies
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update assessment element rating with deficiencies
export const updateAssessmentElement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assessmentId, elementId } = req.params;
    const { condition_rating, notes, photo_urls, deficiencies } = req.body;

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

    // Start transaction for element and deficiencies
    await pool.query('BEGIN');

    try {
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

      const assessmentElementId = result.rows[0].id;

      // Delete existing deficiencies for this assessment element
      await pool.query(
        'DELETE FROM assessment_deficiencies WHERE assessment_element_id = $1',
        [assessmentElementId]
      );

      // Insert new deficiencies if provided
      if (deficiencies && Array.isArray(deficiencies) && deficiencies.length > 0) {
        for (const deficiency of deficiencies) {
          if (deficiency.description && deficiency.description.trim()) {
            await pool.query(
              `INSERT INTO assessment_deficiencies (
                assessment_element_id, description, cost, category, photos, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
              [
                assessmentElementId,
                deficiency.description,
                deficiency.cost || 0,
                deficiency.category || '',
                deficiency.photos ? JSON.stringify(deficiency.photos) : null
              ]
            );
          }
        }
      }

      await pool.query('COMMIT');

      res.json({
        success: true,
        data: {
          assessment_element: result.rows[0]
        }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Bulk save assessment elements with deficiencies
export const saveAssessmentElements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { elements } = req.body;
    const user = (req as any).user;

    console.log('🔍 Looking for assessment with ID:', id);
    console.log('👤 User context:', { user_id: user?.id, organization_id: user?.organization_id });
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('❌ Invalid UUID format for assessment ID:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID format'
      });
    }
    
    // Check if assessment exists and belongs to user's organization
    const assessmentCheck = await pool.query(
      'SELECT id, building_id, status, organization_id FROM assessments WHERE id = $1 AND organization_id = $2',
      [id, user?.organization_id]
    );

    console.log('📊 Assessment query result:', {
      found: assessmentCheck.rows.length > 0,
      assessment: assessmentCheck.rows[0] || null
    });

    if (assessmentCheck.rows.length === 0) {
      console.error('❌ Assessment not found in database or access denied:', id);
      
      // Check if assessment exists but belongs to different org
      const globalCheck = await pool.query('SELECT id, organization_id FROM assessments WHERE id = $1', [id]);
      if (globalCheck.rows.length > 0) {
        console.error('⚠️ Assessment exists but belongs to different organization:', globalCheck.rows[0]);
      } else {
        console.error('⚠️ Assessment does not exist at all in database');
      }
      
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({
        success: false,
        message: 'Elements array is required'
      });
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      const savedElements = [];

      for (const rawElement of elements) {
        console.log('Processing element:', rawElement);
        
        if (!rawElement.element_id || !rawElement.condition_rating) {
          console.warn('Skipping invalid element - missing element_id or condition_rating:', rawElement);
          continue; // Skip invalid elements
        }

        // Process element data to handle code-to-UUID mapping
        const element = await processElementDataForAssessment(rawElement);
        console.log('Processed element:', element);
        
        // Skip if element processing returned null (invalid element identifier)
        if (!element) {
          console.warn('Skipping element with invalid identifier:', rawElement.element_id);
          continue;
        }

        // Upsert assessment element
        const elementResult = await pool.query(
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
            id,
            element.element_id,
            element.condition_rating,
            element.notes || null,
            element.photo_urls ? JSON.stringify(element.photo_urls) : null
          ]
        );

        const assessmentElementId = elementResult.rows[0].id;

        // Delete existing deficiencies
        await pool.query(
          'DELETE FROM assessment_deficiencies WHERE assessment_element_id = $1',
          [assessmentElementId]
        );

        // Insert new deficiencies
        if (element.deficiencies && Array.isArray(element.deficiencies)) {
          for (const deficiency of element.deficiencies) {
            if (deficiency.description && deficiency.description.trim()) {
              // Map frontend category to database category
              const dbCategory = mapFrontendToDbCategory(deficiency.category || '');
              
              if (!dbCategory) {
                console.warn(`Invalid category: ${deficiency.category}, skipping deficiency`);
                continue;
              }

              await pool.query(
                `INSERT INTO assessment_deficiencies (
                  assessment_element_id, description, cost, category, photos, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [
                  assessmentElementId,
                  deficiency.description,
                  deficiency.cost || 0,
                  dbCategory,
                  deficiency.photos ? JSON.stringify(deficiency.photos) : null
                ]
              );
            }
          }
        }

        savedElements.push(elementResult.rows[0]);
      }

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Assessment elements saved successfully',
        data: {
          saved_elements: savedElements
        }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
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
    
    console.log('🧮 Calculating FCI for assessment:', id);

    // Validate UUID format
    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      console.error('❌ Invalid assessment ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID format'
      });
    }

    // Check if assessment exists
    const assessmentCheck = await pool.query(
      'SELECT id, status, building_id FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      console.error('❌ Assessment not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentCheck.rows[0];
    console.log('ℹ️ Assessment found:', { id: assessment.id, status: assessment.status, building_id: assessment.building_id });

    // Calculate FCI with detailed error handling
    const fciResults = await calculateAssessmentFCI(id);
    
    console.log('✅ FCI calculation completed:', {
      fci_score: fciResults.fci_score,
      total_repair_cost: fciResults.total_repair_cost,
      condition_rating: fciResults.condition_rating
    });

    res.json({
      success: true,
      data: {
        fci_results: fciResults
      }
    });
  } catch (error: any) {
    console.error('❌ FCI calculation error:', {
      message: error.message,
      stack: error.stack,
      assessmentId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to calculate FCI',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        details: error.stack 
      })
    });
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
    
    console.log('🏁 Completing assessment:', id);

    // Validate UUID format
    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      console.error('❌ Invalid assessment ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID format'
      });
    }

    // Check if assessment exists and is not already completed
    const assessmentCheck = await pool.query(
      'SELECT id, status, building_id FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      console.error('❌ Assessment not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentCheck.rows[0];
    console.log('ℹ️ Assessment status check:', { id: assessment.id, status: assessment.status });
    
    if (assessment.status === 'completed') {
      console.log('⚠️ Assessment already completed, returning existing data:', id);
      
      // Get existing FCI data and return it instead of erroring
      const existingData = await pool.query(
        `SELECT a.*, b.name as building_name, u.name as assigned_to_name
         FROM assessments a
         LEFT JOIN buildings b ON a.building_id = b.id
         LEFT JOIN users u ON a.assigned_to = u.id
         WHERE a.id = $1`,
        [id]
      );
      
      // Get FCI results from assessment or calculate if missing
      let fciResults = null;
      try {
        fciResults = await calculateAssessmentFCI(id);
      } catch (fciError) {
        console.log('Could not calculate FCI for completed assessment:', fciError);
        // Use default FCI results if calculation fails
        fciResults = {
          fci_score: existingData.rows[0]?.fci_score || 0,
          total_repair_cost: existingData.rows[0]?.total_repair_cost || 0,
          condition_rating: 'fair'
        };
      }
      
      return res.json({
        success: true,
        message: 'Assessment already completed',
        data: {
          assessment: existingData.rows[0],
          fci_results: fciResults
        }
      });
    }

    // Simple assessment completion - just update status and timestamp
    console.log('✅ Marking assessment as completed...');
    
    await pool.query(
      `UPDATE assessments 
       SET status = 'completed', 
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    console.log('✅ Assessment completed successfully:', id);

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
      message: 'Assessment completed successfully',
      data: {
        assessment: updatedAssessment.rows[0]
      }
    });
  } catch (error: any) {
    console.error('❌ Assessment completion error:', {
      message: error.message,
      stack: error.stack,
      assessmentId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete assessment',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        details: error.stack 
      })
    });
  }
};

// Generate FCI report for completed assessment
export const generateAssessmentReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    console.log('📊 Generating report for assessment:', id);

    // Validate UUID format
    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      console.error('❌ Invalid assessment ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID format'
      });
    }

    // Check if assessment exists and is completed
    const assessmentCheck = await pool.query(
      'SELECT id, status, building_id FROM assessments WHERE id = $1',
      [id]
    );

    if (assessmentCheck.rows.length === 0) {
      console.error('❌ Assessment not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentCheck.rows[0];
    console.log('ℹ️ Assessment status for report:', assessment.status);

    if (assessment.status !== 'completed') {
      console.log('⚠️ Assessment not completed yet:', id);
      return res.status(400).json({
        success: false,
        message: 'Assessment must be completed before generating report'
      });
    }

    // Calculate FCI and generate report
    console.log('🧮 Calculating FCI for report generation...');
    const user = (req as any).user;
    const fciResults = await completeAssessmentWithFCI(id, user?.id);
    
    console.log('✅ FCI calculation and report generation successful:', {
      fci_score: fciResults.fci_score,
      condition_rating: fciResults.condition_rating
    });

    // Get assessment details with building info
    const assessmentDetails = await pool.query(
      `SELECT a.*, b.name as building_name, b.square_footage, b.cost_per_sqft, 
              b.replacement_value, b.year_built, b.type as building_type,
              u.name as assigned_to_name
       FROM assessments a
       LEFT JOIN buildings b ON a.building_id = b.id
       LEFT JOIN users u ON a.assigned_to_user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    // Get assessment elements with details
    const elementsDetails = await pool.query(
      `SELECT ae.*, e.individual_element, e.major_group
       FROM assessment_elements ae
       JOIN elements e ON ae.element_id = e.id
       WHERE ae.assessment_id = $1`,
      [id]
    );

    const reportData = {
      assessment: assessmentDetails.rows[0],
      fci_results: fciResults,
      elements: elementsDetails.rows,
      generated_at: new Date().toISOString(),
      generated_by: user?.name || 'System'
    };

    console.log('📋 Report data compiled successfully');

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        report: reportData
      }
    });
  } catch (error: any) {
    console.error('❌ Report generation error:', {
      message: error.message,
      stack: error.stack,
      assessmentId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate report. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};