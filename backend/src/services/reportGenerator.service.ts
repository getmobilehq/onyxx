import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import pool from '../config/database';

interface AssessmentReportData {
  assessment: any;
  building: any;
  elements: any[];
  organization: any;
  fci: number;
  totalDeficiencyCost: number;
}

interface DeficiencyCategory {
  name: string;
  items: any[];
  totalCost: number;
}

class ReportGeneratorService {
  private doc!: PDFKit.PDFDocument;
  private primaryColor = '#1e40af';
  private secondaryColor = '#64748b';
  private accentColor = '#059669';
  private dangerColor = '#dc2626';
  private warningColor = '#f59e0b';

  async generateAssessmentReport(assessmentId: string): Promise<Buffer> {
    try {
      const reportData = await this.fetchAssessmentData(assessmentId);
      
      this.doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        },
        info: {
          Title: `Assessment Report - ${reportData.building.name}`,
          Author: 'Onyx Assessment Platform',
          Subject: 'Building Condition Assessment Report',
          Keywords: 'assessment, FCI, building, condition',
          CreationDate: new Date()
        }
      });

      const chunks: Buffer[] = [];
      this.doc.on('data', (chunk) => chunks.push(chunk));
      
      await this.addCoverPage(reportData);
      await this.addExecutiveSummary(reportData);
      await this.addBuildingOverview(reportData);
      await this.addFCIAnalysis(reportData);
      await this.addElementAssessment(reportData);
      await this.addDeficienciesByCategory(reportData);
      await this.addRecommendations(reportData);
      await this.addAppendix(reportData);
      
      this.doc.end();
      
      return new Promise((resolve) => {
        this.doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });
    } catch (error) {
      console.error('Error generating assessment report:', error);
      throw error;
    }
  }

  private async fetchAssessmentData(assessmentId: string): Promise<AssessmentReportData> {
    const client = await pool.connect();
    try {
      const assessmentQuery = `
        SELECT a.*, 
               u.name as assessor_name,
               u.email as assessor_email
        FROM assessments a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        WHERE a.id = $1
      `;
      const assessmentResult = await client.query(assessmentQuery, [assessmentId]);
      const assessment = assessmentResult.rows[0];

      const buildingQuery = `
        SELECT b.*, o.name as organization_name
        FROM buildings b
        JOIN organizations o ON b.organization_id = o.id
        WHERE b.id = $1
      `;
      const buildingResult = await client.query(buildingQuery, [assessment.building_id]);
      const building = buildingResult.rows[0];

      const orgQuery = `SELECT * FROM organizations WHERE id = $1`;
      const orgResult = await client.query(orgQuery, [building.organization_id]);
      const organization = orgResult.rows[0];

      const elementsQuery = `
        SELECT ae.*, e.name, e.major_group, e.group_element as minor_group
        FROM assessment_elements ae
        JOIN elements e ON ae.element_id = e.id
        WHERE ae.assessment_id = $1
        ORDER BY e.major_group, e.group_element
      `;
      const elementsResult = await client.query(elementsQuery, [assessmentId]);
      const elements = elementsResult.rows;

      const totalDeficiencyCost = elements.reduce((sum, el) => {
        const deficiencies = el.deficiencies || [];
        return sum + deficiencies.reduce((defSum: number, def: any) => defSum + (def.cost || 0), 0);
      }, 0);

      const replacementValue = building.replacement_value || 1000000;
      const fci = totalDeficiencyCost / replacementValue;

      return {
        assessment,
        building,
        elements,
        organization,
        fci,
        totalDeficiencyCost
      };
    } finally {
      client.release();
    }
  }

  private async addCoverPage(data: AssessmentReportData) {
    this.doc.fillColor(this.primaryColor)
      .fontSize(32)
      .text('BUILDING CONDITION', { align: 'center' })
      .fontSize(28)
      .text('ASSESSMENT REPORT', { align: 'center' })
      .moveDown(2);

    this.doc.fillColor('#000000')
      .fontSize(24)
      .text(data.building.name, { align: 'center' })
      .moveDown();

    this.doc.fontSize(16)
      .text(`${data.building.street_address}, ${data.building.city}, ${data.building.state}`, { align: 'center' })
      .moveDown(3);

    const qrData = `onyx://assessment/${data.assessment.id}`;
    const qrCode = await QRCode.toDataURL(qrData, { width: 150 });
    const qrImage = Buffer.from(qrCode.split(',')[1], 'base64');
    this.doc.image(qrImage, this.doc.page.width / 2 - 75, this.doc.y, { width: 150 });
    
    this.doc.moveDown(8);

    this.doc.fontSize(14)
      .text(`Assessment Date: ${format(new Date(data.assessment.completed_at || Date.now()), 'MMMM dd, yyyy')}`, { align: 'center' })
      .text(`Assessor: ${data.assessment.assessor_name}`, { align: 'center' })
      .moveDown(2);

    this.doc.fontSize(12)
      .fillColor(this.secondaryColor)
      .text(`Prepared for: ${data.organization.name}`, { align: 'center' })
      .text(`Report Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, { align: 'center' });

    this.doc.addPage();
  }

  private async addExecutiveSummary(data: AssessmentReportData) {
    this.addSectionHeader('EXECUTIVE SUMMARY');

    const fciScore = (data.fci * 100).toFixed(2);
    const fciStatus = this.getFCIStatus(data.fci);
    
    this.doc.fontSize(12)
      .fillColor('#000000')
      .text(`This report presents the findings of the facility condition assessment conducted for ${data.building.name}. `)
      .text(`The assessment evaluated the condition of building systems and identified deficiencies requiring attention.`)
      .moveDown();

    this.addKeyMetric('Facility Condition Index (FCI)', `${fciScore}%`, fciStatus.color);
    this.addKeyMetric('Building Condition', fciStatus.label, fciStatus.color);
    this.addKeyMetric('Total Deficiency Cost', `$${data.totalDeficiencyCost.toLocaleString()}`, this.dangerColor);
    this.addKeyMetric('Replacement Value', `$${data.building.replacement_value?.toLocaleString() || 'N/A'}`, this.primaryColor);
    this.addKeyMetric('Building Size', `${data.building.square_footage?.toLocaleString() || 'N/A'} sq ft`, this.secondaryColor);
    
    this.doc.moveDown();
    
    const deficienciesByCategory = this.groupDeficienciesByCategory(data.elements);
    
    this.doc.fontSize(14)
      .fillColor(this.primaryColor)
      .text('Deficiencies by Priority', { underline: true })
      .moveDown(0.5);

    deficienciesByCategory.forEach(category => {
      this.doc.fontSize(11)
        .fillColor('#000000')
        .text(`• ${category.name}: `, { continued: true })
        .fillColor(this.dangerColor)
        .text(`$${category.totalCost.toLocaleString()} (${category.items.length} items)`);
    });

    this.doc.addPage();
  }

  private async addBuildingOverview(data: AssessmentReportData) {
    this.addSectionHeader('BUILDING OVERVIEW');

    const details = [
      { label: 'Building Name', value: data.building.name },
      { label: 'Address', value: `${data.building.street_address}, ${data.building.city}, ${data.building.state}` },
      { label: 'Year Built', value: data.building.year_built || 'N/A' },
      { label: 'Building Type', value: data.building.type || 'N/A' },
      { label: 'Construction Type', value: data.building.construction_type || 'N/A' },
      { label: 'Total Size', value: `${data.building.square_footage?.toLocaleString() || 'N/A'} sq ft` },
      { label: 'Cost per Sq Ft', value: `$${data.building.cost_per_sqft || 'N/A'}` },
      { label: 'Replacement Value', value: `$${data.building.replacement_value?.toLocaleString() || 'N/A'}` }
    ];

    details.forEach(detail => {
      this.doc.fontSize(12)
        .fillColor(this.secondaryColor)
        .text(`${detail.label}: `, { continued: true })
        .fillColor('#000000')
        .text(detail.value);
    });

    this.doc.moveDown(2);
  }

  private async addFCIAnalysis(data: AssessmentReportData) {
    this.addSectionHeader('FACILITY CONDITION INDEX ANALYSIS');

    const fciScore = data.fci * 100;
    const status = this.getFCIStatus(data.fci);

    this.doc.fontSize(12)
      .fillColor('#000000')
      .text('The Facility Condition Index (FCI) is calculated as the ratio of deferred maintenance costs to the current replacement value of the facility.')
      .moveDown();

    this.doc.fontSize(14)
      .fillColor(status.color)
      .text(`FCI Score: ${fciScore.toFixed(2)}% - ${status.label}`, { align: 'center' })
      .moveDown();

    this.doc.fontSize(11)
      .fillColor('#000000')
      .text('FCI Interpretation Scale:')
      .text('• 0.00% - 10.00%: Excellent - New or like-new condition')
      .text('• 10.01% - 40.00%: Good - Light capital investment needed')
      .text('• 40.01% - 70.00%: Fair - Significant renovation required')
      .text('• 70.01% +: Critical - Consider replacement or demolition')
      .moveDown();

    this.doc.text(status.description)
      .moveDown(2);
  }

  private async addElementAssessment(data: AssessmentReportData) {
    this.addSectionHeader('BUILDING SYSTEMS ASSESSMENT');

    const groupedElements = this.groupElementsByMajorGroup(data.elements);

    Object.entries(groupedElements).forEach(([majorGroup, elements]) => {
      this.doc.fontSize(14)
        .fillColor(this.primaryColor)
        .text(majorGroup, { underline: true })
        .moveDown(0.5);

      elements.forEach((element: any) => {
        const rating = element.condition_rating || 'Not Assessed';
        const ratingColor = this.getConditionColor(rating);
        
        this.doc.fontSize(11)
          .fillColor('#000000')
          .text(`${element.name}: `, { continued: true })
          .fillColor(ratingColor)
          .text(`Condition ${rating}/5`);

        if (element.notes) {
          this.doc.fontSize(10)
            .fillColor(this.secondaryColor)
            .text(`  Notes: ${element.notes}`);
        }

        const deficiencies = element.deficiencies || [];
        if (deficiencies.length > 0) {
          const totalCost = deficiencies.reduce((sum: number, def: any) => sum + (def.cost || 0), 0);
          this.doc.fontSize(10)
            .fillColor(this.dangerColor)
            .text(`  Deficiencies: ${deficiencies.length} items - $${totalCost.toLocaleString()}`);
        }
      });

      this.doc.moveDown();
    });

    this.doc.addPage();
  }

  private async addDeficienciesByCategory(data: AssessmentReportData) {
    this.addSectionHeader('DEFICIENCIES BY CATEGORY');

    const categories = this.groupDeficienciesByCategory(data.elements);

    categories.forEach(category => {
      this.doc.fontSize(14)
        .fillColor(this.primaryColor)
        .text(`${category.name} - $${category.totalCost.toLocaleString()}`, { underline: true })
        .moveDown(0.5);

      category.items.forEach((item: any) => {
        this.doc.fontSize(11)
          .fillColor('#000000')
          .text(`• ${item.element}: ${item.description}`)
          .fillColor(this.dangerColor)
          .text(`  Cost: $${item.cost.toLocaleString()}`);
      });

      this.doc.moveDown();
    });
  }

  private async addRecommendations(data: AssessmentReportData) {
    this.addSectionHeader('RECOMMENDATIONS');

    const categories = this.groupDeficienciesByCategory(data.elements);
    
    this.doc.fontSize(14)
      .fillColor(this.primaryColor)
      .text('Immediate Actions (0-1 Year)', { underline: true })
      .moveDown(0.5);

    const immediate = categories.find(c => c.name === 'Life Safety & Code Compliance');
    if (immediate && immediate.items.length > 0) {
      immediate.items.forEach((item: any) => {
        this.doc.fontSize(11)
          .fillColor('#000000')
          .text(`• ${item.description} - $${item.cost.toLocaleString()}`);
      });
    } else {
      this.doc.fontSize(11)
        .fillColor(this.secondaryColor)
        .text('• No immediate life safety concerns identified');
    }

    this.doc.moveDown()
      .fontSize(14)
      .fillColor(this.primaryColor)
      .text('Short-Term Actions (1-3 Years)', { underline: true })
      .moveDown(0.5);

    const shortTerm = categories.filter(c => 
      c.name === 'Critical Systems' || c.name === 'Energy Efficiency'
    );
    
    shortTerm.forEach(category => {
      category.items.slice(0, 5).forEach((item: any) => {
        this.doc.fontSize(11)
          .fillColor('#000000')
          .text(`• ${item.description} - $${item.cost.toLocaleString()}`);
      });
    });

    this.doc.moveDown()
      .fontSize(14)
      .fillColor(this.primaryColor)
      .text('Long-Term Planning (3-5 Years)', { underline: true })
      .moveDown(0.5);

    const longTerm = categories.filter(c => 
      c.name === 'Asset Life Cycle' || c.name === 'User Experience'
    );
    
    longTerm.forEach(category => {
      category.items.slice(0, 5).forEach((item: any) => {
        this.doc.fontSize(11)
          .fillColor('#000000')
          .text(`• ${item.description} - $${item.cost.toLocaleString()}`);
      });
    });
  }

  private async addAppendix(data: AssessmentReportData) {
    this.doc.addPage();
    this.addSectionHeader('APPENDIX');

    this.doc.fontSize(12)
      .fillColor(this.primaryColor)
      .text('Assessment Methodology', { underline: true })
      .moveDown(0.5)
      .fontSize(11)
      .fillColor('#000000')
      .text('This assessment was conducted using the Uniformat II classification system for building elements. Each element was evaluated on a 1-5 scale:')
      .text('• 5 - Excellent: New or like-new condition')
      .text('• 4 - Good: Minor wear, fully functional')
      .text('• 3 - Fair: Moderate wear, functional with minor issues')
      .text('• 2 - Poor: Significant wear, major repairs needed')
      .text('• 1 - Critical: Failed or imminent failure')
      .moveDown();

    this.doc.fontSize(12)
      .fillColor(this.primaryColor)
      .text('Disclaimer', { underline: true })
      .moveDown(0.5)
      .fontSize(10)
      .fillColor(this.secondaryColor)
      .text('This report is based on visual observations and available documentation. It does not constitute a warranty or guarantee. Professional evaluation may be required for specific systems.')
      .moveDown();

    this.doc.fontSize(12)
      .fillColor(this.primaryColor)
      .text('Contact Information', { underline: true })
      .moveDown(0.5)
      .fontSize(11)
      .fillColor('#000000')
      .text(`Organization: ${data.organization.name}`)
      .text(`Assessor: ${data.assessment.assessor_name}`)
      .text(`Email: ${data.assessment.assessor_email}`)
      .text(`Report Date: ${format(new Date(), 'MMMM dd, yyyy')}`);
  }

  private addSectionHeader(title: string) {
    this.doc.fontSize(18)
      .fillColor(this.primaryColor)
      .text(title, { align: 'left' })
      .moveDown()
      .strokeColor(this.primaryColor)
      .lineWidth(2)
      .moveTo(72, this.doc.y)
      .lineTo(this.doc.page.width - 72, this.doc.y)
      .stroke()
      .moveDown();
  }

  private addKeyMetric(label: string, value: string, color: string) {
    this.doc.fontSize(12)
      .fillColor(this.secondaryColor)
      .text(`${label}: `, { continued: true })
      .fontSize(14)
      .fillColor(color)
      .text(value);
  }

  private getFCIStatus(fci: number): { label: string; color: string; description: string } {
    if (fci <= 0.1) {
      return {
        label: 'Excellent',
        color: this.accentColor,
        description: 'The building is in excellent condition with minimal deferred maintenance. Continue with preventive maintenance program.'
      };
    } else if (fci <= 0.4) {
      return {
        label: 'Good',
        color: this.primaryColor,
        description: 'The building is in good condition but requires some capital investment to address deferred maintenance items.'
      };
    } else if (fci <= 0.7) {
      return {
        label: 'Fair',
        color: this.warningColor,
        description: 'The building requires significant renovation. A comprehensive capital improvement plan should be developed.'
      };
    } else {
      return {
        label: 'Critical',
        color: this.dangerColor,
        description: 'The building is in critical condition. Consider major renovation or replacement options.'
      };
    }
  }

  private getConditionColor(rating: number): string {
    if (rating >= 4) return this.accentColor;
    if (rating >= 3) return this.primaryColor;
    if (rating >= 2) return this.warningColor;
    return this.dangerColor;
  }

  private groupElementsByMajorGroup(elements: any[]): Record<string, any[]> {
    return elements.reduce((groups, element) => {
      const group = element.major_group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(element);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private groupDeficienciesByCategory(elements: any[]): DeficiencyCategory[] {
    const categoryMap: Record<string, DeficiencyCategory> = {};

    elements.forEach(element => {
      const deficiencies = element.deficiencies || [];
      deficiencies.forEach((def: any) => {
        const category = def.category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            name: category,
            items: [],
            totalCost: 0
          };
        }
        categoryMap[category].items.push({
          element: element.name,
          description: def.description,
          cost: def.cost || 0
        });
        categoryMap[category].totalCost += def.cost || 0;
      });
    });

    const priorityOrder = [
      'Life Safety & Code Compliance',
      'Critical Systems',
      'Energy Efficiency',
      'Asset Life Cycle',
      'User Experience',
      'Equity & Accessibility'
    ];

    return priorityOrder
      .map(name => categoryMap[name])
      .filter(Boolean)
      .concat(Object.values(categoryMap).filter(c => !priorityOrder.includes(c.name)))
      .sort((a, b) => b.totalCost - a.totalCost);
  }
}

export default new ReportGeneratorService();