import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import pool from '../config/database';
import { format } from 'date-fns';

export interface ReportData {
  assessment: any;
  building: any;
  fciResults: any;
  elements?: any[];
}

export class ReportGeneratorService {
  /**
   * Generate PDF report for an assessment with enhanced data structure
   */
  static async generatePDFReport(assessmentId: string): Promise<Buffer> {
    try {
      // Fetch comprehensive assessment data
      const assessmentQuery = `
        SELECT 
          a.id,
          a.organization_id,
          a.building_id,
          a.type,
          a.status,
          a.scheduled_date,
          a.start_date,
          a.completed_at,
          a.assigned_to_user_id,
          a.weather_conditions,
          a.temperature_f,
          a.total_deficiency_cost,
          a.priority_1_cost,
          a.priority_2_cost,
          a.priority_3_cost,
          a.priority_4_cost,
          a.fci_score,
          a.overall_condition,
          a.assessor_notes,
          a.recommendations,
          a.follow_up_required,
          a.follow_up_date,
          a.created_at,
          a.updated_at,
          a.created_by_user_id,
          a.assessment_type,
          a.building_name,
          a.street_address,
          a.city,
          a.state,
          a.building_type,
          a.year_built,
          a.square_footage,
          u.name as assigned_to_name,
          creator.name as created_by_name
        FROM assessments a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        LEFT JOIN users creator ON a.created_by_user_id = creator.id
        WHERE a.id = $1
      `;
      
      const assessmentResult = await pool.query(assessmentQuery, [assessmentId]);
      if (assessmentResult.rows.length === 0) {
        throw new Error('Assessment not found');
      }
      
      const data = assessmentResult.rows[0];
      
      // Calculate comprehensive FCI data
      const totalRepairCost = parseFloat(data.total_deficiency_cost) || 0;
      const immediateCost = parseFloat(data.priority_1_cost) || 0;
      const shortTermCost = parseFloat(data.priority_2_cost) || 0;
      const longTermCost = (parseFloat(data.priority_3_cost) || 0) + (parseFloat(data.priority_4_cost) || 0);
      
      // Calculate replacement cost (high-end executive office typical cost)
      const costPerSqft = data.building_type?.toLowerCase().includes('executive') ? 200 : 150;
      const replacementCost = (data.square_footage || 0) * costPerSqft;
      const fciScore = replacementCost > 0 ? totalRepairCost / replacementCost : 0;
      
      // Build comprehensive report data structure
      const reportData = {
        assessment: {
          id: assessmentId,
          building_name: data.building_name,
          building_type: data.building_type,
          year_built: data.year_built,
          square_footage: data.square_footage,
          replacement_value: replacementCost,
          status: data.status,
          street_address: data.street_address,
          city: data.city,
          state: data.state,
          completed_at: data.completed_at,
          assessment_type: data.assessment_type
        },
        fci_results: {
          fci_score: fciScore,
          condition_rating: ReportGeneratorService.getFCIRating(fciScore),
          total_repair_cost: totalRepairCost,
          replacement_cost: replacementCost,
          immediate_repair_cost: immediateCost,
          short_term_repair_cost: shortTermCost,
          long_term_repair_cost: longTermCost
        },
        assessment_summary: {
          status: data.status,
          type: data.assessment_type,
          scheduled_date: data.scheduled_date,
          completed_at: data.completed_at,
          assessor: data.assigned_to_name || 'Admin User',
          follow_up_required: data.follow_up_required
        },
        generated_at: new Date().toISOString(),
        generated_by: 'System Administrator'
      };
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Title page with enhanced styling
        doc.fontSize(24).text('🏢 BUILDING ASSESSMENT REPORT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('Facility Condition Assessment & Capital Planning', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(18).text(reportData.assessment.building_name, { align: 'center' });
        doc.moveDown(2);
        
        // Building information with enhanced data
        doc.fontSize(14).text('🏢 BUILDING INFORMATION', { underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        doc.text(`Building Name: ${reportData.assessment.building_name}`);
        doc.text(`Type: ${reportData.assessment.building_type}`);
        if (reportData.assessment.street_address) {
          doc.text(`Address: ${reportData.assessment.street_address}, ${reportData.assessment.city}, ${reportData.assessment.state}`);
        }
        doc.text(`Year Built: ${reportData.assessment.year_built}`);
        doc.text(`Square Footage: ${reportData.assessment.square_footage?.toLocaleString()} sq ft`);
        doc.text(`Estimated Replacement Value: $${reportData.assessment.replacement_value?.toLocaleString()}`);
        doc.moveDown();
        
        // Enhanced FCI Results section
        doc.fontSize(14).text('📊 FACILITY CONDITION INDEX', { underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        
        doc.text(`FCI Score: ${(reportData.fci_results.fci_score * 100).toFixed(4)}%`);
        doc.text(`Condition Rating: ${reportData.fci_results.condition_rating}`);
        doc.text(`Total Repair Cost: $${reportData.fci_results.total_repair_cost.toLocaleString()}`);
        doc.text(`Replacement Cost: $${reportData.fci_results.replacement_cost.toLocaleString()}`);
        
        // Add condition interpretation
        const interpretation = ReportGeneratorService.getFCIInterpretation(reportData.fci_results.fci_score);
        doc.moveDown(0.5);
        doc.text(`Assessment: ${interpretation.description}`);
        doc.moveDown();
        
        // Enhanced cost breakdown
        doc.fontSize(14).text('💰 REPAIR COST BREAKDOWN', { underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        doc.text(`Immediate (0-1 year): $${reportData.fci_results.immediate_repair_cost.toLocaleString()}`);
        doc.text(`Short-term (1-3 years): $${reportData.fci_results.short_term_repair_cost.toLocaleString()}`);
        doc.text(`Long-term (3-10 years): $${reportData.fci_results.long_term_repair_cost.toLocaleString()}`);
        doc.moveDown();
        
        // Special handling for excellent condition buildings
        if (reportData.fci_results.fci_score === 0) {
          doc.fontSize(14).text('🎉 EXCELLENT BUILDING CONDITION', { underline: true });
          doc.fontSize(12);
          doc.moveDown(0.5);
          doc.text('This assessment found no significant deficiencies in the building.');
          doc.text(`The FCI score of ${(reportData.fci_results.fci_score * 100).toFixed(4)}% indicates that`);
          doc.text(`${reportData.assessment.building_name} is in excellent condition with minimal`);
          doc.text('to no immediate repair needs. This represents outstanding building');
          doc.text('maintenance and management.');
          doc.moveDown();
        }
        
        // Assessment summary
        doc.fontSize(14).text('📈 ASSESSMENT SUMMARY', { underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        doc.text(`Assessment Type: ${reportData.assessment.assessment_type}`);
        doc.text(`Status: ${reportData.assessment.status}`);
        doc.text(`Assessor: ${reportData.assessment_summary.assessor}`);
        doc.text(`Completed: ${reportData.assessment.completed_at ? new Date(reportData.assessment.completed_at).toLocaleDateString() : 'In progress'}`);
        doc.text(`Follow-up Required: ${reportData.assessment_summary.follow_up_required ? 'Yes' : 'No'}`);
        doc.moveDown();
        
        // Building performance analysis for large buildings
        if (reportData.assessment.square_footage && reportData.assessment.square_footage > 100000) {
          doc.fontSize(14).text('🏆 BUILDING PERFORMANCE ANALYSIS', { underline: true });
          doc.fontSize(12);
          doc.moveDown(0.5);
          doc.text(`${reportData.assessment.building_name} is a large-scale facility`);
          doc.text(`(${reportData.assessment.square_footage?.toLocaleString()} sq ft) representing`);
          doc.text(`significant asset value ($${reportData.assessment.replacement_value?.toLocaleString()}).`);
          
          const buildingAge = new Date().getFullYear() - (reportData.assessment.year_built || 2000);
          doc.text(`At ${buildingAge} years old, the current condition demonstrates`);
          doc.text('the effectiveness of maintenance and capital planning practices.');
          doc.moveDown();
        }
        
        // Footer
        doc.fontSize(8);
        doc.text(`Generated with Onyx Building Assessment System on ${new Date().toLocaleDateString()}`, 
                 50, doc.page.height - 50, { align: 'center' });
        doc.text(`Assessment ID: ${reportData.assessment.id}`, 
                 50, doc.page.height - 40, { align: 'center' });
        
        doc.end();
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Generate Excel report for multiple assessments
   */
  static async generateExcelReport(filters?: { 
    building_id?: string; 
    status?: string; 
    start_date?: Date;
    end_date?: Date;
  }): Promise<Buffer> {
    try {
      // Build query
      let query = `
        SELECT 
          a.id,
          a.type,
          a.status,
          a.created_at,
          a.completed_at,
          a.notes,
          b.name as building_name,
          b.type as building_type,
          b.year_built,
          b.square_footage,
          b.cost_per_sqft,
          b.city,
          b.state,
          u.name as assessor_name
        FROM assessments a
        JOIN buildings b ON a.building_id = b.id
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 0;
      
      if (filters?.building_id) {
        paramCount++;
        query += ` AND a.building_id = $${paramCount}`;
        params.push(filters.building_id);
      }
      
      if (filters?.status) {
        paramCount++;
        query += ` AND a.status = $${paramCount}`;
        params.push(filters.status);
      }
      
      if (filters?.start_date) {
        paramCount++;
        query += ` AND a.created_at >= $${paramCount}`;
        params.push(filters.start_date);
      }
      
      if (filters?.end_date) {
        paramCount++;
        query += ` AND a.created_at <= $${paramCount}`;
        params.push(filters.end_date);
      }
      
      query += ' ORDER BY a.created_at DESC';
      
      const result = await pool.query(query, params);
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Onyx Assessment System';
      workbook.created = new Date();
      
      // Assessment Summary Sheet
      const summarySheet = workbook.addWorksheet('Assessment Summary');
      
      summarySheet.columns = [
        { header: 'Assessment ID', key: 'id', width: 15 },
        { header: 'Building Name', key: 'building_name', width: 25 },
        { header: 'Building Type', key: 'building_type', width: 20 },
        { header: 'Assessment Type', key: 'type', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Year Built', key: 'year_built', width: 12 },
        { header: 'Square Footage', key: 'square_footage', width: 15 },
        { header: 'Cost/SqFt', key: 'cost_per_sqft', width: 12 },
        { header: 'City', key: 'city', width: 20 },
        { header: 'State', key: 'state', width: 10 },
        { header: 'Assessor', key: 'assessor_name', width: 20 },
        { header: 'Created Date', key: 'created_at', width: 15 },
        { header: 'Completed Date', key: 'completed_at', width: 15 },
        { header: 'FCI Score', key: 'fci', width: 12 },
        { header: 'Total Cost', key: 'total_cost', width: 15 },
        { header: 'Immediate Cost', key: 'immediate_cost', width: 15 },
        { header: 'Short-term Cost', key: 'short_term_cost', width: 15 },
        { header: 'Long-term Cost', key: 'long_term_cost', width: 15 },
      ];
      
      // Process data and extract FCI information
      const processedData = result.rows.map(row => {
        let fci = null;
        let totalCost = null;
        let immediateCost = null;
        let shortTermCost = null;
        let longTermCost = null;
        
        if (row.notes) {
          const fciMatch = row.notes.match(/FCI Score: (\d+\.?\d*)/);
          const totalCostMatch = row.notes.match(/Total Repair Cost: \$([0-9,]+)/);
          const immediateCostMatch = row.notes.match(/Immediate Repairs: \$([0-9,]+)/);
          const shortTermMatch = row.notes.match(/Short-term \(1-3 years\): \$([0-9,]+)/);
          const longTermMatch = row.notes.match(/Long-term \(3-5 years\): \$([0-9,]+)/);
          
          if (fciMatch) fci = parseFloat(fciMatch[1]);
          if (totalCostMatch) totalCost = parseInt(totalCostMatch[1].replace(/,/g, ''));
          if (immediateCostMatch) immediateCost = parseInt(immediateCostMatch[1].replace(/,/g, ''));
          if (shortTermMatch) shortTermCost = parseInt(shortTermMatch[1].replace(/,/g, ''));
          if (longTermMatch) longTermCost = parseInt(longTermMatch[1].replace(/,/g, ''));
        }
        
        return {
          ...row,
          fci,
          total_cost: totalCost,
          immediate_cost: immediateCost,
          short_term_cost: shortTermCost,
          long_term_cost: longTermCost,
          created_at: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
          completion_date: row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '',
        };
      });
      
      summarySheet.addRows(processedData);
      
      // Style the header row
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add conditional formatting for FCI scores
      summarySheet.getColumn('fci').eachCell((cell, rowNumber) => {
        if (rowNumber > 1 && cell.value) {
          const fciValue = parseFloat(cell.value.toString());
          if (fciValue <= 0.05) {
            cell.font = { color: { argb: 'FF00FF00' } }; // Green
          } else if (fciValue <= 0.10) {
            cell.font = { color: { argb: 'FF0000FF' } }; // Blue
          } else if (fciValue <= 0.30) {
            cell.font = { color: { argb: 'FFFFA500' } }; // Orange
          } else {
            cell.font = { color: { argb: 'FFFF0000' } }; // Red
          }
        }
      });
      
      // Analytics Sheet
      const analyticsSheet = workbook.addWorksheet('Analytics');
      
      // Calculate summary statistics
      const totalAssessments = processedData.length;
      const completedAssessments = processedData.filter(a => a.status === 'completed').length;
      const assessmentsWithFCI = processedData.filter(a => a.fci !== null).length;
      const avgFCI = assessmentsWithFCI > 0
        ? processedData.reduce((sum, a) => sum + (a.fci || 0), 0) / assessmentsWithFCI
        : 0;
      const totalRepairCost = processedData.reduce((sum, a) => sum + (a.total_cost || 0), 0);
      
      analyticsSheet.addRow(['Summary Statistics']);
      analyticsSheet.addRow(['Total Assessments', totalAssessments]);
      analyticsSheet.addRow(['Completed Assessments', completedAssessments]);
      analyticsSheet.addRow(['Average FCI Score', avgFCI.toFixed(4)]);
      analyticsSheet.addRow(['Total Repair Costs', `$${totalRepairCost.toLocaleString()}`]);
      
      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer as Buffer;
      
    } catch (error) {
      console.error('Excel generation error:', error);
      throw error;
    }
  }

  /**
   * Helper method to get FCI rating based on score
   * STANDARDIZED FCI RATING THRESHOLDS (Industry Standard):
   * - Good: 0.00-0.05 (0-5%)
   * - Fair: 0.05-0.10 (5-10%)
   * - Poor: 0.10-0.30 (10-30%)
   * - Critical: >0.30 (>30%)
   */
  private static getFCIRating(fciScore: number): string {
    if (fciScore <= 0.05) return 'Good';
    if (fciScore <= 0.10) return 'Fair';
    if (fciScore <= 0.30) return 'Poor';
    return 'Critical';
  }

  /**
   * Helper method to get FCI interpretation with detailed description
   * STANDARDIZED FCI RATING THRESHOLDS (Industry Standard)
   */
  private static getFCIInterpretation(fciScore: number) {
    if (fciScore <= 0.05) {
      return {
        status: 'GOOD',
        description: 'Building is in good condition with minimal repair needs'
      };
    } else if (fciScore <= 0.10) {
      return {
        status: 'FAIR',
        description: 'Building is in fair condition with routine maintenance required'
      };
    } else if (fciScore <= 0.30) {
      return {
        status: 'POOR',
        description: 'Building is in poor condition and requires significant repairs'
      };
    } else {
      return {
        status: 'CRITICAL',
        description: 'Building is in critical condition. Major renovation or replacement required'
      };
    }
  }
}

export default ReportGeneratorService;