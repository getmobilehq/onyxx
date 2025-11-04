import OpenAI from 'openai';

interface BuildingData {
  name: string;
  type?: string;
  year_built?: number;
  square_footage?: number;
}

interface AssessmentData {
  fci: number;
  totalDeficiencyCost: number;
  replacementValue: number;
  elements: any[];
  deficiencyCategories: { name: string; totalCost: number; items: any[] }[];
}

class AIReportService {
  private openai: OpenAI | null = null;
  private enabled: boolean = false;

  constructor() {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.enabled = true;
      console.log('✅ AI Report Service initialized with OpenAI');
    } else {
      console.log('⚠️ AI Report Service disabled: OPENAI_API_KEY not configured');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate an AI-enhanced executive summary for the assessment report
   */
  async generateExecutiveSummary(
    building: BuildingData,
    assessment: AssessmentData
  ): Promise<string> {
    if (!this.enabled || !this.openai) {
      return this.getFallbackExecutiveSummary(building, assessment);
    }

    try {
      const fciPercentage = (assessment.fci * 100).toFixed(2);
      const buildingAge = building.year_built ? new Date().getFullYear() - building.year_built : 'unknown';

      const prompt = `You are a professional building condition assessment expert. Generate a concise, professional executive summary (2-3 paragraphs) for a facility condition assessment report with the following details:

Building Information:
- Name: ${building.name}
- Type: ${building.type || 'Not specified'}
- Age: ${buildingAge} years
- Size: ${building.square_footage?.toLocaleString() || 'Not specified'} square feet

Assessment Results:
- Facility Condition Index (FCI): ${fciPercentage}%
- Total Deficiency Cost: $${assessment.totalDeficiencyCost.toLocaleString()}
- Replacement Value: $${assessment.replacementValue.toLocaleString()}
- Number of Elements Assessed: ${assessment.elements.length}
- Top Priority Categories: ${assessment.deficiencyCategories.slice(0, 3).map(c => c.name).join(', ')}

The executive summary should:
1. Briefly describe the building and assessment scope
2. Highlight the key findings (FCI score and what it means)
3. Summarize the most critical deficiencies requiring attention
4. Be professional, factual, and actionable

Write in third person, avoid jargon, and focus on actionable insights for facility managers.`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional building condition assessment expert who writes clear, concise, and actionable facility reports.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || this.getFallbackExecutiveSummary(building, assessment);
    } catch (error) {
      console.error('❌ Error generating AI executive summary:', error);
      return this.getFallbackExecutiveSummary(building, assessment);
    }
  }

  /**
   * Generate AI-enhanced recommendations based on assessment findings
   */
  async generateRecommendations(
    building: BuildingData,
    assessment: AssessmentData
  ): Promise<{ immediate: string[]; shortTerm: string[]; longTerm: string[] }> {
    if (!this.enabled || !this.openai) {
      return this.getFallbackRecommendations(assessment);
    }

    try {
      const criticalDeficiencies = assessment.deficiencyCategories
        .filter(c => c.name === 'Life Safety & Code Compliance' || c.name === 'Critical Systems')
        .flatMap(c => c.items.slice(0, 5).map(i => `- ${i.description} ($${i.cost.toLocaleString()})`))
        .join('\n');

      const prompt = `As a facility management expert, provide actionable recommendations for the following building assessment:

Building: ${building.name} (${building.type || 'General'}, ${building.square_footage?.toLocaleString() || 'N/A'} sq ft)
FCI Score: ${(assessment.fci * 100).toFixed(2)}%
Total Deficiency Cost: $${assessment.totalDeficiencyCost.toLocaleString()}

Critical Deficiencies:
${criticalDeficiencies || 'No critical deficiencies identified'}

Provide recommendations in three categories:
1. Immediate Actions (0-1 year) - Safety-critical items
2. Short-Term Actions (1-3 years) - Important repairs and upgrades
3. Long-Term Planning (3-5 years) - Strategic improvements

Format: Return a JSON object with three arrays: "immediate", "shortTerm", and "longTerm". Each array should contain 3-5 specific, actionable recommendations (strings). Focus on practical, cost-effective solutions.

Example format:
{
  "immediate": ["Repair fire alarm system deficiencies to ensure code compliance"],
  "shortTerm": ["Replace aging HVAC units in zones 2 and 3 to improve efficiency"],
  "longTerm": ["Develop a 5-year capital improvement plan for building envelope upgrades"]
}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a facility management expert providing actionable, prioritized recommendations. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const recommendations = JSON.parse(content);
        return {
          immediate: recommendations.immediate || [],
          shortTerm: recommendations.shortTerm || [],
          longTerm: recommendations.longTerm || []
        };
      }

      return this.getFallbackRecommendations(assessment);
    } catch (error) {
      console.error('❌ Error generating AI recommendations:', error);
      return this.getFallbackRecommendations(assessment);
    }
  }

  /**
   * Generate element-specific insights
   */
  async generateElementInsight(
    elementName: string,
    conditionRating: number,
    deficiencies: any[]
  ): Promise<string> {
    if (!this.enabled || !this.openai || deficiencies.length === 0) {
      return '';
    }

    try {
      const defList = deficiencies.slice(0, 3).map(d => d.description).join('; ');

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a building systems expert. Provide brief, actionable insights about building element conditions.'
          },
          {
            role: 'user',
            content: `Element: ${elementName}
Condition Rating: ${conditionRating}/5
Deficiencies: ${defList}

Provide a 1-2 sentence professional insight about the condition and recommended action. Be specific and actionable.`
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ Error generating element insight:', error);
      return '';
    }
  }

  /**
   * Fallback executive summary when AI is disabled or fails
   */
  private getFallbackExecutiveSummary(building: BuildingData, assessment: AssessmentData): string {
    const fciPercentage = (assessment.fci * 100).toFixed(2);
    const fciStatus = this.getFCIStatusDescription(assessment.fci);

    return `This report presents the findings of the facility condition assessment conducted for ${building.name}. The assessment evaluated ${assessment.elements.length} building elements and identified deficiencies requiring attention.

The building has a Facility Condition Index (FCI) of ${fciPercentage}%, indicating ${fciStatus}. The total estimated cost to address identified deficiencies is $${assessment.totalDeficiencyCost.toLocaleString()}, compared to a building replacement value of $${assessment.replacementValue.toLocaleString()}.

Priority areas requiring attention include ${assessment.deficiencyCategories.slice(0, 3).map(c => c.name.toLowerCase()).join(', ')}. Immediate action is recommended for life safety and critical system deficiencies to ensure building code compliance and operational continuity.`;
  }

  /**
   * Fallback recommendations when AI is disabled or fails
   */
  private getFallbackRecommendations(assessment: AssessmentData): { immediate: string[]; shortTerm: string[]; longTerm: string[] } {
    const lifeSafety = assessment.deficiencyCategories.find(c => c.name === 'Life Safety & Code Compliance');
    const critical = assessment.deficiencyCategories.find(c => c.name === 'Critical Systems');
    const energy = assessment.deficiencyCategories.find(c => c.name === 'Energy Efficiency');

    return {
      immediate: lifeSafety && lifeSafety.items.length > 0
        ? lifeSafety.items.slice(0, 3).map(i => `Address ${i.description.toLowerCase()} to ensure code compliance`)
        : ['Conduct detailed inspection of life safety systems', 'Review and update emergency response procedures', 'Ensure all building systems meet current code requirements'],
      shortTerm: critical && critical.items.length > 0
        ? critical.items.slice(0, 3).map(i => `Repair or replace ${i.element.toLowerCase()} to maintain operational reliability`)
        : ['Develop preventive maintenance schedule for critical systems', 'Budget for equipment upgrades and replacements', 'Implement energy efficiency improvements'],
      longTerm: [
        'Develop a comprehensive capital improvement plan',
        'Consider building envelope upgrades to improve energy performance',
        'Plan for major system replacements based on useful life projections',
        'Establish ongoing condition assessment program'
      ]
    };
  }

  private getFCIStatusDescription(fci: number): string {
    if (fci <= 0.05) return 'excellent condition with minimal deferred maintenance';
    if (fci <= 0.10) return 'good condition requiring routine maintenance';
    if (fci <= 0.30) return 'fair condition with moderate repair needs';
    return 'critical condition requiring significant investment';
  }
}

export default new AIReportService();
