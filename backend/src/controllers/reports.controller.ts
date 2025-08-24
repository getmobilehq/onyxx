import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Create a new report
export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      assessment_id,
      building_id,
      title,
      description,
      report_type = 'facility_condition',
      status = 'draft',
      assessment_date,
      assessor_name,
      fci_score,
      total_repair_cost,
      replacement_value,
      immediate_repair_cost,
      short_term_repair_cost,
      long_term_repair_cost,
      element_count,
      deficiency_count,
      executive_summary,
      recommendations,
      systems_data
    } = req.body;

    const user = (req as any).user;

    // Validate required fields
    if (!building_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'Building ID and title are required'
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

    // Check if assessment exists (if provided)
    if (assessment_id) {
      const assessmentCheck = await pool.query(
        'SELECT id FROM assessments WHERE id = $1',
        [assessment_id]
      );

      if (assessmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO reports (
        assessment_id, building_id, title, description, report_type, status,
        assessment_date, report_date, generated_by, assessor_name,
        fci_score, total_repair_cost, replacement_value, immediate_repair_cost,
        short_term_repair_cost, long_term_repair_cost, element_count, deficiency_count,
        executive_summary, recommendations, systems_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()) 
      RETURNING *`,
      [
        assessment_id || null,
        building_id,
        title,
        description || null,
        report_type,
        status,
        assessment_date || null,
        new Date(),
        user.id,
        assessor_name || user.name,
        fci_score || null,
        total_repair_cost || null,
        replacement_value || null,
        immediate_repair_cost || null,
        short_term_repair_cost || null,
        long_term_repair_cost || null,
        element_count || 0,
        deficiency_count || 0,
        executive_summary || null,
        recommendations ? JSON.stringify(recommendations) : null,
        systems_data ? JSON.stringify(systems_data) : null
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        report: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all reports with filtering and pagination
export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      building_id, 
      status, 
      report_type, 
      assessor, 
      limit = 50, 
      offset = 0,
      search
    } = req.query;

    let query = `
      SELECT 
        r.*,
        b.name as building_name,
        b.address as street_address,
        b.city,
        b.state,
        b.building_type as building_type,
        u.name as created_by_name,
        a.assessment_type as assessment_type
      FROM reports r
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN users u ON r.generated_by = u.id
      LEFT JOIN assessments a ON r.assessment_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (building_id) {
      params.push(building_id);
      query += ` AND r.building_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    if (report_type) {
      params.push(report_type);
      query += ` AND r.report_type = $${params.length}`;
    }

    if (assessor) {
      params.push(assessor);
      query += ` AND r.assessor_name ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (r.title ILIKE $${params.length} OR b.name ILIKE $${params.length} OR r.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY r.created_at DESC`;

    // Add pagination
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM reports r
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (building_id) {
      countParams.push(building_id);
      countQuery += ` AND r.building_id = $${countParams.length}`;
    }

    if (status) {
      countParams.push(status);
      countQuery += ` AND r.status = $${countParams.length}`;
    }

    if (report_type) {
      countParams.push(report_type);
      countQuery += ` AND r.report_type = $${countParams.length}`;
    }

    if (assessor) {
      countParams.push(assessor);
      countQuery += ` AND r.assessor_name ILIKE $${countParams.length}`;
    }

    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (r.title ILIKE $${countParams.length} OR b.name ILIKE $${countParams.length} OR r.description ILIKE $${countParams.length})`;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        reports: result.rows,
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

// Get report by ID
export const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        r.*,
        b.name as building_name,
        b.address as street_address,
        b.city,
        b.state,
        b.building_type as building_type,
        b.year_built,
        b.square_footage,
        u.name as created_by_name,
        a.assessment_type as assessment_type,
        a.start_date as assessment_started,
        a.completion_date as assessment_completed
      FROM reports r
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN users u ON r.generated_by = u.id
      LEFT JOIN assessments a ON r.assessment_id = a.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: {
        report: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update report
export const updateReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      assessor_name,
      fci_score,
      total_repair_cost,
      replacement_value,
      immediate_repair_cost,
      short_term_repair_cost,
      long_term_repair_cost,
      element_count,
      deficiency_count,
      executive_summary,
      recommendations,
      systems_data,
      pdf_url,
      excel_url
    } = req.body;

    // Check if report exists
    const reportCheck = await pool.query(
      'SELECT id FROM reports WHERE id = $1',
      [id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }

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

    if (assessor_name !== undefined) {
      updates.push(`assessor_name = $${paramCount}`);
      params.push(assessor_name);
      paramCount++;
    }

    if (fci_score !== undefined) {
      updates.push(`fci_score = $${paramCount}`);
      params.push(fci_score);
      paramCount++;
    }

    if (total_repair_cost !== undefined) {
      updates.push(`total_repair_cost = $${paramCount}`);
      params.push(total_repair_cost);
      paramCount++;
    }

    if (replacement_value !== undefined) {
      updates.push(`replacement_value = $${paramCount}`);
      params.push(replacement_value);
      paramCount++;
    }

    if (immediate_repair_cost !== undefined) {
      updates.push(`immediate_repair_cost = $${paramCount}`);
      params.push(immediate_repair_cost);
      paramCount++;
    }

    if (short_term_repair_cost !== undefined) {
      updates.push(`short_term_repair_cost = $${paramCount}`);
      params.push(short_term_repair_cost);
      paramCount++;
    }

    if (long_term_repair_cost !== undefined) {
      updates.push(`long_term_repair_cost = $${paramCount}`);
      params.push(long_term_repair_cost);
      paramCount++;
    }

    if (element_count !== undefined) {
      updates.push(`element_count = $${paramCount}`);
      params.push(element_count);
      paramCount++;
    }

    if (deficiency_count !== undefined) {
      updates.push(`deficiency_count = $${paramCount}`);
      params.push(deficiency_count);
      paramCount++;
    }

    if (executive_summary !== undefined) {
      updates.push(`executive_summary = $${paramCount}`);
      params.push(executive_summary);
      paramCount++;
    }

    if (recommendations !== undefined) {
      updates.push(`recommendations = $${paramCount}`);
      params.push(recommendations ? JSON.stringify(recommendations) : null);
      paramCount++;
    }

    if (systems_data !== undefined) {
      updates.push(`systems_data = $${paramCount}`);
      params.push(systems_data ? JSON.stringify(systems_data) : null);
      paramCount++;
    }

    if (pdf_url !== undefined) {
      updates.push(`pdf_url = $${paramCount}`);
      params.push(pdf_url);
      paramCount++;
    }

    if (excel_url !== undefined) {
      updates.push(`excel_url = $${paramCount}`);
      params.push(excel_url);
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
      UPDATE reports 
      SET ${updates.join(', ')} 
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        report: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete report
export const deleteReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM reports WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Generate report from assessment
export const generateReportFromAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assessmentId } = req.params;
    const user = (req as any).user;

    // Check if assessment exists and is completed
    const assessmentResult = await pool.query(
      `SELECT a.*, b.name as building_name, b.id as building_id, b.square_footage, b.building_type as building_type
       FROM assessments a
       JOIN buildings b ON a.building_id = b.id
       WHERE a.id = $1`,
      [assessmentId]
    );

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentResult.rows[0];

    if (assessment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Assessment must be completed before generating a report'
      });
    }

    // Get FCI data
    const fciResult = await pool.query(
      'SELECT * FROM fci_reports WHERE assessment_id = $1 ORDER BY created_at DESC LIMIT 1',
      [assessmentId]
    );

    // Get assessment elements and deficiencies
    const elementsResult = await pool.query(
      `SELECT ae.*, e.major_group, e.group_element, e.individual_element,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ad.id,
                  'description', ad.description,
                  'cost', ad.cost,
                  'category', ad.category,
                  'photos', ad.photos
                ))
                FROM assessment_deficiencies ad 
                WHERE ad.assessment_element_id = ae.id), '[]'::json
              ) as deficiencies
       FROM assessment_elements ae
       JOIN elements e ON ae.element_id = e.id
       WHERE ae.assessment_id = $1`,
      [assessmentId]
    );

    const fciData = fciResult.rows[0];
    const totalDeficiencies = elementsResult.rows.reduce((sum, el) => 
      sum + (Array.isArray(el.deficiencies) ? el.deficiencies.length : 0), 0
    );

    // Generate report title
    const reportTitle = `Facility Condition Assessment - ${assessment.building_name}`;

    // Create report
    const reportResult = await pool.query(
      `INSERT INTO reports (
        assessment_id, building_id, title, description, report_type, status,
        assessment_date, report_date, generated_by, assessor_name,
        fci_score, total_repair_cost, replacement_value, immediate_repair_cost,
        short_term_repair_cost, long_term_repair_cost, element_count, deficiency_count,
        systems_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()) 
      RETURNING *`,
      [
        assessmentId,
        assessment.building_id,
        reportTitle,
        `Automated report generated from completed assessment`,
        'facility_condition',
        'published',
        assessment.completion_date || assessment.created_at,
        new Date(),
        user.id,
        user.name,
        fciData?.fci_score || null,
        fciData?.total_repair_cost || null,
        fciData?.replacement_cost || null,
        fciData?.immediate_repair_cost || null,
        fciData?.short_term_repair_cost || null,
        fciData?.long_term_repair_cost || null,
        elementsResult.rows.length,
        totalDeficiencies,
        JSON.stringify({
          elements: elementsResult.rows,
          assessment_summary: {
            total_elements: elementsResult.rows.length,
            total_deficiencies: totalDeficiencies,
            avg_condition: elementsResult.rows.reduce((sum, el) => sum + (el.condition_rating || 3), 0) / elementsResult.rows.length
          }
        })
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        report: reportResult.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Download assessment report as PDF
export const downloadAssessmentPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assessmentId } = req.params;
    const user = (req as any).user;
    
    console.log('📄 Generating PDF report for assessment:', assessmentId, 'user:', user?.id);

    // Validate UUID format
    if (!assessmentId || typeof assessmentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assessmentId)) {
      console.error('❌ Invalid assessment ID format for PDF:', assessmentId);
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID format'
      });
    }

    // Check user authentication
    if (!user || !user.organization_id) {
      console.error('❌ User not authenticated for PDF download');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if assessment exists and user has access
    console.log('🔍 Checking assessment access...');
    const assessmentCheck = await pool.query(
      `SELECT a.*, b.organization_id, b.name as building_name
       FROM assessments a 
       JOIN buildings b ON a.building_id = b.id 
       WHERE a.id = $1`,
      [assessmentId]
    );

    if (assessmentCheck.rows.length === 0) {
      console.error('❌ Assessment not found for PDF:', assessmentId);
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessment = assessmentCheck.rows[0];
    console.log('ℹ️ Assessment found:', { 
      id: assessment.id, 
      status: assessment.status, 
      building_name: assessment.building_name,
      organization_id: assessment.organization_id 
    });

    // Check if user has access to this organization's data
    if (assessment.organization_id !== user.organization_id) {
      console.error('❌ Access denied to assessment PDF:', { 
        userOrg: user.organization_id, 
        assessmentOrg: assessment.organization_id 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assessment'
      });
    }

    // Import the report generator service with error handling
    console.log('🔧 Loading report generator service...');
    let reportGeneratorService;
    try {
      reportGeneratorService = require('../services/reportGenerator.service').default;
      if (!reportGeneratorService || !reportGeneratorService.generateAssessmentReport) {
        throw new Error('Report generator service not properly configured');
      }
    } catch (serviceError: any) {
      console.error('❌ Report generator service error:', serviceError);
      return res.status(500).json({
        success: false,
        message: 'PDF generation service unavailable',
        ...(process.env.NODE_ENV === 'development' && { error: serviceError.message })
      });
    }

    // Generate the PDF
    console.log('📄 Generating PDF...');
    const pdfBuffer = await reportGeneratorService.generateAssessmentReport(assessmentId);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ Empty PDF buffer generated');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report'
      });
    }

    console.log('✅ PDF generated successfully:', { size: pdfBuffer.length, 'bytes': true });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-report-${assessmentId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache');

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('❌ PDF generation error:', {
      message: error.message,
      stack: error.stack,
      assessmentId: req.params.assessmentId
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          details: error.stack 
        })
      });
    }
  }
};