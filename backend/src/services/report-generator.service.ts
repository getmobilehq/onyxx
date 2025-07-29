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
   * Generate PDF report for an assessment
   */
  static async generatePDFReport(assessmentId: string): Promise<Buffer> {
    try {
      // Fetch assessment data
      const assessmentQuery = `
        SELECT a.*, b.*, u.name as assessor_name
        FROM assessments a
        JOIN buildings b ON a.building_id = b.id
        LEFT JOIN users u ON a.assigned_to = u.id
        WHERE a.id = $1
      `;
      
      const assessmentResult = await pool.query(assessmentQuery, [assessmentId]);
      if (assessmentResult.rows.length === 0) {
        throw new Error('Assessment not found');
      }
      
      const data = assessmentResult.rows[0];
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Title page
        doc.fontSize(24).text('FACILITY CONDITION ASSESSMENT REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(data.name, { align: 'center' });
        doc.moveDown(2);
        
        // Building information
        doc.fontSize(14).text('BUILDING INFORMATION', { underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        doc.text(`Building Name: ${data.name}`);
        doc.text(`Type: ${data.type}`);
        doc.text(`Address: ${data.street_address}, ${data.city}, ${data.state} ${data.zip_code}`);
        doc.text(`Year Built: ${data.year_built}`);
        doc.text(`Square Footage: ${data.square_footage?.toLocaleString()} sq ft`);
        doc.text(`Construction Type: ${data.construction_type}`);
        doc.moveDown();
        
        // Assessment information
        doc.fontSize(14).text('ASSESSMENT DETAILS', { underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        doc.text(`Assessment Type: ${data.type}`);
        doc.text(`Status: ${data.status}`);
        doc.text(`Assessor: ${data.assessor_name || 'Not assigned'}`);
        doc.text(`Completed Date: ${data.completed_at ? new Date(data.completed_at).toLocaleDateString() : 'In progress'}`);
        doc.moveDown();
        
        // FCI Results (if available in notes)
        if (data.notes) {
          const fciMatch = data.notes.match(/FCI Score: (\d+\.?\d*)/);
          const totalCostMatch = data.notes.match(/Total Repair Cost: \$([0-9,]+)/);
          const replacementMatch = data.notes.match(/Replacement Value: \$([0-9,]+)/);
          
          if (fciMatch) {
            doc.fontSize(14).text('FACILITY CONDITION INDEX', { underline: true });
            doc.fontSize(12);
            doc.moveDown(0.5);
            
            const fci = parseFloat(fciMatch[1]);
            const condition = fci <= 0.05 ? 'Good' : fci <= 0.10 ? 'Fair' : fci <= 0.30 ? 'Poor' : 'Critical';
            
            doc.text(`FCI Score: ${fci.toFixed(4)}`);
            doc.text(`Condition Rating: ${condition}`);
            
            if (totalCostMatch) {
              doc.text(`Total Repair Cost: $${totalCostMatch[1]}`);
            }
            if (replacementMatch) {
              doc.text(`Replacement Value: $${replacementMatch[1]}`);
            }
            
            doc.moveDown();
            
            // Cost breakdown
            const immediateCostMatch = data.notes.match(/Immediate Repairs: \$([0-9,]+)/);
            const shortTermMatch = data.notes.match(/Short-term \(1-3 years\): \$([0-9,]+)/);
            const longTermMatch = data.notes.match(/Long-term \(3-5 years\): \$([0-9,]+)/);
            
            if (immediateCostMatch || shortTermMatch || longTermMatch) {
              doc.fontSize(14).text('REPAIR COST BREAKDOWN', { underline: true });
              doc.fontSize(12);
              doc.moveDown(0.5);
              
              if (immediateCostMatch) doc.text(`Immediate Repairs: $${immediateCostMatch[1]}`);
              if (shortTermMatch) doc.text(`Short-term (1-3 years): $${shortTermMatch[1]}`);
              if (longTermMatch) doc.text(`Long-term (3-5 years): $${longTermMatch[1]}`);
              
              doc.moveDown();
            }
          }
        }
        
        // Assessment notes
        if (data.notes) {
          doc.addPage();
          doc.fontSize(14).text('ASSESSMENT NOTES', { underline: true });
          doc.fontSize(10);
          doc.moveDown(0.5);
          doc.text(data.notes);
        }
        
        // Footer
        doc.fontSize(8);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 50, doc.page.height - 50, { align: 'center' });
        
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
          a.type as assessment_type,
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
        LEFT JOIN users u ON a.assigned_to = u.id
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
        { header: 'Assessment Type', key: 'assessment_type', width: 20 },
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
          completed_at: row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '',
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
}

export default ReportGeneratorService;