import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Proper type declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: any;
  }
}

interface ComprehensiveReportData {
  assessment: any;
  fci_results: any;
  elements: any[];
  building: any;
  generated_at: string;
  generated_by: string;
}

export class ComprehensiveFCIReportGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number;
  private primaryColor: [number, number, number] = [41, 128, 185]; // Blue
  private successColor: [number, number, number] = [39, 174, 96]; // Green
  private warningColor: [number, number, number] = [243, 156, 18]; // Orange
  private dangerColor: [number, number, number] = [231, 76, 60]; // Red

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = 20;
    this.margin = 20;
  }

  // ==================== COVER PAGE ====================
  private addCoverPage(data: ComprehensiveReportData): void {
    // Background gradient effect
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');

    // Company branding
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ONYX', this.pageWidth / 2, 35, { align: 'center' });

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Building Assessment Platform', this.pageWidth / 2, 45, { align: 'center' });

    // Report title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FACILITY CONDITION', this.pageWidth / 2, 100, { align: 'center' });
    this.doc.text('ASSESSMENT REPORT', this.pageWidth / 2, 112, { align: 'center' });

    // Building name
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(data.assessment.building_name || 'Building Assessment', this.pageWidth / 2, 130, { align: 'center' });

    // FCI Score highlight box
    const fciScore = data.fci_results.fci_score || 0;
    const fciColor = this.getFCIColor(fciScore);

    this.doc.setFillColor(...fciColor);
    this.doc.roundedRect(this.pageWidth / 2 - 40, 145, 80, 30, 3, 3, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`FCI: ${fciScore.toFixed(3)}`, this.pageWidth / 2, 160, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.fci_results.condition_rating || 'N/A', this.pageWidth / 2, 170, { align: 'center' });

    // Assessment details
    this.doc.setTextColor(80, 80, 80);
    this.doc.setFontSize(11);
    const assessmentDate = new Date(data.assessment.assessment_date || data.generated_at).toLocaleDateString();
    const reportDate = new Date(data.generated_at).toLocaleDateString();

    this.doc.text(`Assessment Date: ${assessmentDate}`, this.pageWidth / 2, 195, { align: 'center' });
    this.doc.text(`Report Generated: ${reportDate}`, this.pageWidth / 2, 203, { align: 'center' });
    this.doc.text(`Prepared by: ${data.generated_by}`, this.pageWidth / 2, 211, { align: 'center' });

    // Footer
    this.doc.setFontSize(9);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text('© Onyx Building Assessment Platform', this.pageWidth / 2, this.pageHeight - 15, { align: 'center' });
    this.doc.text('Confidential - For Internal Use Only', this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });

    this.doc.addPage();
    this.currentY = 20;
  }

  // ==================== TABLE OF CONTENTS ====================
  private addTableOfContents(): void {
    this.addSectionHeader('TABLE OF CONTENTS');
    this.currentY += 5;

    const contents = [
      ['1.', 'Executive Summary', '3'],
      ['2.', 'Building Information', '4'],
      ['3.', 'FCI Analysis & Methodology', '5'],
      ['4.', 'Cost Summary & Financial Impact', '6'],
      ['5.', 'Element Condition Assessment', '7'],
      ['6.', 'Deficiency Details', '8'],
      ['7.', 'Capital Planning Recommendations', '9'],
      ['8.', 'Appendix & Glossary', '10']
    ];

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    contents.forEach(([num, title, page]) => {
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(num, this.margin, this.currentY);
      this.doc.text(title, this.margin + 10, this.currentY);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(page, this.pageWidth - this.margin - 10, this.currentY, { align: 'right' });

      // Dotted line
      this.doc.setDrawColor(200, 200, 200);
      const lineY = this.currentY - 1;
      for (let x = this.margin + 85; x < this.pageWidth - this.margin - 15; x += 3) {
        this.doc.circle(x, lineY, 0.3, 'F');
      }

      this.currentY += 8;
    });

    this.doc.addPage();
    this.currentY = 20;
  }

  // ==================== EXECUTIVE SUMMARY ====================
  private addExecutiveSummary(data: ComprehensiveReportData): void {
    this.addSectionHeader('1. EXECUTIVE SUMMARY');
    this.currentY += 5;

    // Key findings box
    this.doc.setFillColor(245, 245, 245);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 55, 2, 2, 'F');

    this.currentY += 8;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Key Findings', this.margin + 5, this.currentY);

    this.currentY += 8;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const findings = [
      `• FCI Score: ${data.fci_results.fci_score?.toFixed(3)} - ${data.fci_results.condition_rating}`,
      `• Total Repair Cost: ${this.formatCurrency(data.fci_results.total_repair_cost)}`,
      `• Building Replacement Value: ${this.formatCurrency(data.fci_results.replacement_cost)}`,
      `• Elements Assessed: ${data.elements?.length || 0}`,
      `• Building Age: ${new Date().getFullYear() - (data.assessment.year_built || 2000)} years`
    ];

    findings.forEach(finding => {
      this.doc.text(finding, this.margin + 5, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;

    // Summary narrative
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const summary = this.generateExecutiveSummary(data);
    const summaryLines = this.doc.splitTextToSize(summary, this.pageWidth - 2 * this.margin);
    this.doc.text(summaryLines, this.margin, this.currentY);
    this.currentY += summaryLines.length * 5 + 10;

    this.checkPageBreak(30);
  }

  // ==================== BUILDING INFORMATION ====================
  private addBuildingInformation(data: ComprehensiveReportData): void {
    this.addSectionHeader('2. BUILDING INFORMATION');
    this.currentY += 5;

    // Build address from available data
    const address = data.building?.address || data.assessment.address || 'N/A';
    const city = data.building?.city || data.assessment.city || 'N/A';
    const state = data.building?.state || data.assessment.state || 'N/A';

    const buildingInfo = [
      ['Building Name', data.assessment.building_name || 'N/A'],
      ['Address', address],
      ['City, State', `${city}, ${state}`],
      ['Building Type', data.assessment.building_type || data.building?.type || 'N/A'],
      ['Year Built', data.assessment.year_built?.toString() || data.building?.year_built?.toString() || 'N/A'],
      ['Square Footage', this.formatNumber(data.assessment.square_footage || data.building?.square_footage) + ' sq ft'],
      ['Cost per Sq Ft', this.formatCurrency(data.assessment.cost_per_sqft || data.building?.cost_per_sqft)],
      ['Replacement Value', this.formatCurrency(data.fci_results.replacement_cost || data.assessment.replacement_value)],
      ['Assessment Type', data.assessment.assessment_type?.replace('_', ' ').toUpperCase() || 'N/A'],
      ['Assessment Date', new Date(data.assessment.assessment_date || data.generated_at).toLocaleDateString()],
      ['Completion Date', new Date(data.assessment.completion_date || data.generated_at).toLocaleDateString()],
      ['Assessor', data.assessment.assigned_to_name || data.generated_by]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Property', 'Details']],
      body: buildingInfo,
      theme: 'striped',
      headStyles: { fillColor: this.primaryColor, fontSize: 11, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    this.checkPageBreak(30);
  }

  // ==================== FCI ANALYSIS ====================
  private addFCIAnalysis(data: ComprehensiveReportData): void {
    this.addSectionHeader('3. FCI ANALYSIS & METHODOLOGY');
    this.currentY += 5;

    // FCI explanation
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const fciExplanation = 'The Facility Condition Index (FCI) is a standard industry metric that provides a relative measure of a building\'s condition. It is calculated by dividing the total cost of deficiencies by the current replacement value of the facility.';
    const explanationLines = this.doc.splitTextToSize(fciExplanation, this.pageWidth - 2 * this.margin);
    this.doc.text(explanationLines, this.margin, this.currentY);
    this.currentY += explanationLines.length * 5 + 10;

    // FCI Formula
    this.doc.setFillColor(240, 248, 255);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 2, 2, 'F');

    this.currentY += 8;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FCI Formula:', this.margin + 5, this.currentY);

    this.currentY += 8;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const formula = `FCI = Total Repair Cost ÷ Replacement Value = ${this.formatCurrency(data.fci_results.total_repair_cost)} ÷ ${this.formatCurrency(data.fci_results.replacement_cost)} = ${data.fci_results.fci_score?.toFixed(4)}`;
    this.doc.text(formula, this.margin + 5, this.currentY);

    this.currentY += 15;

    // FCI Rating Scale
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FCI Rating Scale:', this.margin, this.currentY);
    this.currentY += 8;

    const ratingScale = [
      ['0.00 - 0.05', 'Excellent', 'New or well-maintained facility'],
      ['0.06 - 0.10', 'Good', 'Adequate condition, routine maintenance required'],
      ['0.11 - 0.30', 'Fair', 'Deteriorating, significant repairs needed'],
      ['0.31 - 0.50', 'Poor', 'Major repairs or renovation required'],
      ['Above 0.50', 'Critical', 'Consider replacement or major reconstruction']
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['FCI Range', 'Rating', 'Description']],
      body: ratingScale,
      theme: 'grid',
      headStyles: { fillColor: this.primaryColor, fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    this.checkPageBreak(30);
  }

  // ==================== COST SUMMARY ====================
  private addCostSummary(data: ComprehensiveReportData): void {
    this.addSectionHeader('4. COST SUMMARY & FINANCIAL IMPACT');
    this.currentY += 5;

    // Cost overview cards
    const costs = [
      {
        label: 'Total Repair Cost',
        amount: data.fci_results.total_repair_cost,
        color: this.dangerColor,
        description: 'Total cost to address all deficiencies'
      },
      {
        label: 'Immediate Repairs (0-1 year)',
        amount: data.fci_results.immediate_repair_cost,
        color: this.dangerColor,
        description: 'Critical repairs requiring immediate attention'
      },
      {
        label: 'Short-term Repairs (1-3 years)',
        amount: data.fci_results.short_term_repair_cost,
        color: this.warningColor,
        description: 'Repairs to prevent deterioration'
      },
      {
        label: 'Long-term Repairs (3-5 years)',
        amount: data.fci_results.long_term_repair_cost,
        color: this.primaryColor,
        description: 'Planned improvements and replacements'
      }
    ];

    costs.forEach(cost => {
      this.checkPageBreak(25);

      this.doc.setFillColor(...cost.color);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, 2, 2, 'F');

      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(cost.label, this.margin + 5, this.currentY + 7);

      this.doc.setFontSize(14);
      this.doc.text(this.formatCurrency(cost.amount), this.pageWidth - this.margin - 5, this.currentY + 7, { align: 'right' });

      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(cost.description, this.margin + 5, this.currentY + 14);

      this.currentY += 23;
    });

    this.currentY += 10;
    this.checkPageBreak(30);
  }

  // ==================== ELEMENT ASSESSMENT ====================
  private addElementAssessment(data: ComprehensiveReportData): void {
    this.addSectionHeader('5. ELEMENT CONDITION ASSESSMENT');
    this.currentY += 5;

    if (!data.elements || data.elements.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('No detailed element assessments available.', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const tableData = data.elements.map(element => [
      element.individual_element || element.name || 'Unknown',
      element.major_group || element.category || 'N/A',
      this.getConditionLabel(element.condition_rating),
      element.notes || 'No notes'
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Element', 'Category', 'Condition', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: this.primaryColor, fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const condition = data.cell.raw as string;
          if (condition === 'Excellent' || condition === 'Good') {
            data.cell.styles.textColor = this.successColor;
          } else if (condition === 'Fair') {
            data.cell.styles.textColor = this.warningColor;
          } else {
            data.cell.styles.textColor = this.dangerColor;
          }
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    this.checkPageBreak(30);
  }

  // ==================== CAPITAL PLANNING RECOMMENDATIONS ====================
  private addCapitalPlanningRecommendations(data: ComprehensiveReportData): void {
    this.addSectionHeader('6. CAPITAL PLANNING RECOMMENDATIONS');
    this.currentY += 5;

    // Generate recommendations based on FCI and costs
    const recommendations = this.generateRecommendations(data);

    recommendations.forEach((rec, index) => {
      this.checkPageBreak(30);

      this.doc.setFillColor(240, 248, 255);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 1, 1, 'F');

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(`${index + 1}. ${rec.title}`, this.margin + 3, this.currentY + 5.5);

      this.currentY += 12;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      const descLines = this.doc.splitTextToSize(rec.description, this.pageWidth - 2 * this.margin - 6);
      this.doc.text(descLines, this.margin + 3, this.currentY);
      this.currentY += descLines.length * 5;

      this.doc.setFontSize(9);
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(`Priority: ${rec.priority} | Timeline: ${rec.timeline} | Estimated Cost: ${this.formatCurrency(rec.cost)}`, this.margin + 3, this.currentY + 4);

      this.currentY += 12;
    });

    this.checkPageBreak(30);
  }

  // ==================== HELPER METHODS ====================
  private addSectionHeader(title: string): void {
    this.checkPageBreak(20);

    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(this.margin, this.currentY, 3, 8, 'F');

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin + 6, this.currentY + 6);

    this.currentY += 12;
  }

  private checkPageBreak(neededHeight: number = 20): void {
    if (this.currentY + neededHeight > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  private getFCIColor(fciScore: number): [number, number, number] {
    if (fciScore <= 0.05) return this.successColor;
    if (fciScore <= 0.10) return [52, 152, 219]; // Light blue
    if (fciScore <= 0.30) return this.warningColor;
    if (fciScore <= 0.50) return [230, 126, 34]; // Dark orange
    return this.dangerColor;
  }

  private getConditionLabel(rating: number | string): string {
    if (typeof rating === 'string') {
      return rating.charAt(0).toUpperCase() + rating.slice(1);
    }
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Good';
    if (rating >= 3) return 'Fair';
    if (rating >= 2) return 'Poor';
    return 'Critical';
  }

  private formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!num) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }

  private formatNumber(num: number | string): string {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (!value) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  }

  private generateExecutiveSummary(data: ComprehensiveReportData): string {
    const fciScore = data.fci_results.fci_score || 0;
    const condition = data.fci_results.condition_rating || 'Unknown';
    const buildingAge = new Date().getFullYear() - (data.assessment.year_built || data.building?.year_built || 2000);
    const city = data.building?.city || data.assessment.city || 'the area';
    const buildingType = data.assessment.building_type || data.building?.type || 'building';

    let summary = `This comprehensive facility condition assessment was conducted for ${data.assessment.building_name || 'the facility'}, a ${buildingAge}-year-old ${buildingType} located in ${city}. `;

    summary += `The assessment revealed an FCI score of ${fciScore.toFixed(3)}, indicating a ${condition.toLowerCase()} condition rating. `;

    summary += `The total estimated repair cost of ${this.formatCurrency(data.fci_results.total_repair_cost)} represents ${(fciScore * 100).toFixed(1)}% of the building's replacement value of ${this.formatCurrency(data.fci_results.replacement_cost)}. `;

    if (data.fci_results.immediate_repair_cost > 0) {
      summary += `Immediate attention is required for ${this.formatCurrency(data.fci_results.immediate_repair_cost)} in critical repairs. `;
    }

    if (data.fci_results.short_term_repair_cost > 0) {
      summary += `Additional investments of ${this.formatCurrency(data.fci_results.short_term_repair_cost)} are needed within 1-3 years to prevent further deterioration. `;
    }

    if (fciScore >= 0.5) {
      summary += `Given the critical condition rating, consideration should be given to major renovation or potential replacement of the facility.`;
    } else if (fciScore >= 0.3) {
      summary += `The facility requires significant investment to address deferred maintenance and restore it to acceptable condition.`;
    } else if (fciScore >= 0.1) {
      summary += `With proper maintenance planning and timely repairs, the facility can be maintained in serviceable condition.`;
    } else {
      summary += `The facility is in good overall condition with manageable maintenance requirements.`;
    }

    return summary;
  }

  private generateRecommendations(data: ComprehensiveReportData): Array<{title: string, description: string, priority: string, timeline: string, cost: number}> {
    const fciScore = data.fci_results.fci_score || 0;
    const recommendations = [];

    if (data.fci_results.immediate_repair_cost > 0) {
      recommendations.push({
        title: 'Address Critical Deficiencies Immediately',
        description: 'Immediate repairs are required to address life safety concerns, prevent further deterioration, and maintain building functionality. These repairs should be prioritized in the current fiscal year capital budget.',
        priority: 'High',
        timeline: '0-12 months',
        cost: data.fci_results.immediate_repair_cost
      });
    }

    if (fciScore > 0.30) {
      recommendations.push({
        title: 'Develop Comprehensive Renewal Strategy',
        description: 'Given the critical FCI score, a comprehensive building renewal strategy should be developed. This may include major renovations, system replacements, or consideration of building replacement depending on mission requirements and available funding.',
        priority: 'High',
        timeline: '1-2 years',
        cost: data.fci_results.total_repair_cost * 0.3
      });
    }

    if (data.fci_results.short_term_repair_cost > 0) {
      recommendations.push({
        title: 'Establish Preventive Maintenance Program',
        description: 'Implement a robust preventive maintenance program to extend the service life of building systems and reduce the rate of deterioration. This investment will help manage the short-term repair backlog and prevent escalation of deferred maintenance costs.',
        priority: 'Medium',
        timeline: '1-3 years',
        cost: data.fci_results.short_term_repair_cost
      });
    }

    recommendations.push({
      title: 'Annual FCI Monitoring',
      description: 'Conduct annual facility condition assessments to track the FCI trend and adjust capital planning strategies accordingly. Regular monitoring enables proactive decision-making and optimal resource allocation.',
      priority: 'Medium',
      timeline: 'Ongoing',
      cost: 50000
    });

    if (data.fci_results.long_term_repair_cost > 0) {
      recommendations.push({
        title: 'Long-term Capital Investment Planning',
        description: 'Incorporate long-term repair needs into multi-year capital improvement planning. Develop a phased approach to address deferred maintenance while balancing other organizational priorities and budget constraints.',
        priority: 'Low',
        timeline: '3-5 years',
        cost: data.fci_results.long_term_repair_cost
      });
    }

    return recommendations;
  }

  // ==================== MAIN GENERATION METHOD ====================
  public generateReport(reportData: ComprehensiveReportData): void {
    // Cover Page
    this.addCoverPage(reportData);

    // Table of Contents
    this.addTableOfContents();

    // Executive Summary
    this.addExecutiveSummary(reportData);

    // Building Information
    this.addBuildingInformation(reportData);

    // FCI Analysis
    this.addFCIAnalysis(reportData);

    // Cost Summary
    this.addCostSummary(reportData);

    // Element Assessment
    this.addElementAssessment(reportData);

    // Capital Planning Recommendations
    this.addCapitalPlanningRecommendations(reportData);
  }

  public download(filename: string): void {
    this.doc.save(filename);
  }

  public getBlob(): Blob {
    return this.doc.output('blob');
  }
}

// Export function for easy use
export const generateComprehensiveFCIReport = (
  reportData: ComprehensiveReportData,
  filename?: string
): void => {
  const generator = new ComprehensiveFCIReportGenerator();
  generator.generateReport(reportData);
  generator.download(filename || `FCI-Report-${new Date().getTime()}.pdf`);
};
