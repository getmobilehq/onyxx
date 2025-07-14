import { Request, Response, NextFunction } from 'express';
import ReportGeneratorService from '../services/report-generator.service';

// Generate PDF report for an assessment
export const generatePDFReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assessmentId } = req.params;
    
    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }
    
    const pdfBuffer = await ReportGeneratorService.generatePDFReport(assessmentId);
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-report-${assessmentId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate PDF report'
    });
  }
};

// Generate Excel report with filters
export const generateExcelReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { building_id, status, start_date, end_date } = req.query;
    
    const filters: any = {};
    
    if (building_id) filters.building_id = building_id as string;
    if (status) filters.status = status as string;
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);
    
    const excelBuffer = await ReportGeneratorService.generateExcelReport(filters);
    
    // Set response headers for Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());
    
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Excel generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate Excel report'
    });
  }
};