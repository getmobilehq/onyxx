import pool from '../config/database';

interface MaintenancePrediction {
  building_id: string;
  building_name: string;
  prediction_type: 'component_failure' | 'major_repair' | 'system_replacement';
  predicted_date: Date;
  confidence_score: number;
  estimated_cost: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
  current_fci: number;
  predicted_fci: number;
  recommendations: string[];
}

interface FailureRiskAnalysis {
  building_id: string;
  building_name: string;
  component: string;
  risk_score: number;
  time_to_failure_months: number;
  failure_probability: number;
  impact_score: number;
  maintenance_history: any[];
}

interface OptimizationSuggestion {
  building_id: string;
  building_name: string;
  suggestion_type: 'preventive' | 'corrective' | 'replacement';
  component: string;
  cost_savings: number;
  timeline: string;
  description: string;
  roi: number;
}

export class PredictiveMaintenanceService {
  /**
   * Generate maintenance predictions based on historical data and building conditions
   */
  static async generateMaintenancePredictions(): Promise<MaintenancePrediction[]> {
    try {
      const query = `
        WITH building_analytics AS (
          SELECT 
            b.id as building_id,
            b.name as building_name,
            EXTRACT(YEAR FROM CURRENT_DATE) - b.year_built as age,
            b.square_footage,
            COALESCE(b.cost_per_sqft, 150) as cost_per_sqft,
            -- Get latest FCI
            CASE 
              WHEN latest_assessment.notes IS NOT NULL AND latest_assessment.notes ~ 'FCI Score: ([0-9.]+)'
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(latest_assessment.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
              ELSE 0.15
            END as current_fci,
            -- Count assessments in last 2 years
            COALESCE(assessment_count.count, 0) as recent_assessment_count,
            -- Average repair cost
            COALESCE(avg_costs.avg_repair_cost, 0) as avg_repair_cost
          FROM buildings b
          LEFT JOIN LATERAL (
            SELECT notes 
            FROM assessments 
            WHERE building_id = b.id 
              AND status = 'completed' 
              AND notes IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT 1
          ) latest_assessment ON true
          LEFT JOIN (
            SELECT 
              building_id,
              COUNT(*) as count
            FROM assessments 
            WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
            GROUP BY building_id
          ) assessment_count ON assessment_count.building_id = b.id
          LEFT JOIN (
            SELECT 
              building_id,
              AVG(
                CASE 
                  WHEN notes IS NOT NULL AND notes ~ 'Total Repair Cost: \\$([0-9,]+)'
                  THEN REGEXP_REPLACE(REGEXP_SUBSTR(notes, 'Total Repair Cost: \\$([0-9,]+)'), '[^0-9]', '', 'g')::numeric
                  ELSE 0
                END
              ) as avg_repair_cost
            FROM assessments
            WHERE status = 'completed'
            GROUP BY building_id
          ) avg_costs ON avg_costs.building_id = b.id
        )
        SELECT *,
          -- Predict component failure based on age and FCI
          CASE 
            WHEN age > 30 AND current_fci > 0.25 THEN 'component_failure'
            WHEN age > 20 AND current_fci > 0.15 THEN 'major_repair'
            WHEN age > 40 OR current_fci > 0.35 THEN 'system_replacement'
            ELSE 'major_repair'
          END as prediction_type,
          
          -- Predict timeline based on deterioration rate
          CASE 
            WHEN current_fci > 0.30 THEN CURRENT_DATE + INTERVAL '3 months'
            WHEN current_fci > 0.20 THEN CURRENT_DATE + INTERVAL '8 months'
            WHEN current_fci > 0.10 THEN CURRENT_DATE + INTERVAL '18 months'
            ELSE CURRENT_DATE + INTERVAL '36 months'
          END as predicted_date,
          
          -- Confidence score based on data availability
          CASE 
            WHEN recent_assessment_count >= 3 THEN 0.9
            WHEN recent_assessment_count >= 2 THEN 0.75
            WHEN recent_assessment_count >= 1 THEN 0.6
            ELSE 0.4
          END as confidence_score,
          
          -- Estimate future FCI
          LEAST(current_fci + (age * 0.003) + 0.05, 0.8) as predicted_fci,
          
          -- Priority based on FCI and age
          CASE 
            WHEN current_fci > 0.25 OR age > 35 THEN 'high'
            WHEN current_fci > 0.15 OR age > 25 THEN 'medium'
            ELSE 'low'
          END as priority
          
        FROM building_analytics
        WHERE current_fci > 0.05  -- Only buildings that need attention
        ORDER BY current_fci DESC, age DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        building_id: row.building_id,
        building_name: row.building_name,
        prediction_type: row.prediction_type,
        predicted_date: row.predicted_date,
        confidence_score: row.confidence_score,
        estimated_cost: this.calculateEstimatedCost(row),
        description: this.generatePredictionDescription(row),
        priority: row.priority,
        current_fci: row.current_fci,
        predicted_fci: row.predicted_fci,
        recommendations: this.generateRecommendations(row)
      }));
      
    } catch (error) {
      console.error('Error generating maintenance predictions:', error);
      throw error;
    }
  }

  /**
   * Analyze failure risk for building components
   */
  static async analyzeFailureRisk(): Promise<FailureRiskAnalysis[]> {
    try {
      const query = `
        WITH building_risk AS (
          SELECT 
            b.id as building_id,
            b.name as building_name,
            EXTRACT(YEAR FROM CURRENT_DATE) - b.year_built as age,
            CASE 
              WHEN a.notes IS NOT NULL AND a.notes ~ 'FCI Score: ([0-9.]+)'
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
              ELSE 0.15
            END as current_fci,
            a.created_at as last_assessment_date
          FROM buildings b
          LEFT JOIN LATERAL (
            SELECT notes, created_at
            FROM assessments 
            WHERE building_id = b.id 
              AND status = 'completed' 
              AND notes IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT 1
          ) a ON true
        ),
        component_analysis AS (
          SELECT 
            *,
            -- HVAC risk (higher in older buildings)
            CASE 
              WHEN age > 20 THEN 0.7 + (age - 20) * 0.02
              ELSE 0.3 + age * 0.02
            END as hvac_risk,
            
            -- Electrical risk
            CASE 
              WHEN age > 25 THEN 0.6 + (age - 25) * 0.025
              ELSE 0.2 + age * 0.015
            END as electrical_risk,
            
            -- Plumbing risk
            CASE 
              WHEN age > 30 THEN 0.8 + (age - 30) * 0.02
              ELSE 0.25 + age * 0.02
            END as plumbing_risk,
            
            -- Structural risk (varies by age significantly)
            CASE 
              WHEN age > 50 THEN 0.4 + (age - 50) * 0.03
              WHEN age > 30 THEN 0.2 + (age - 30) * 0.01
              ELSE 0.1 + age * 0.005
            END as structural_risk
          FROM building_risk
        )
        SELECT 
          building_id,
          building_name,
          'HVAC' as component,
          LEAST(hvac_risk * (1 + current_fci), 1.0) as risk_score,
          GREATEST(12 - (hvac_risk * 24), 1) as time_to_failure_months,
          hvac_risk as failure_probability,
          8 as impact_score
        FROM component_analysis
        
        UNION ALL
        
        SELECT 
          building_id,
          building_name,
          'Electrical' as component,
          LEAST(electrical_risk * (1 + current_fci), 1.0) as risk_score,
          GREATEST(18 - (electrical_risk * 30), 2) as time_to_failure_months,
          electrical_risk as failure_probability,
          9 as impact_score
        FROM component_analysis
        
        UNION ALL
        
        SELECT 
          building_id,
          building_name,
          'Plumbing' as component,
          LEAST(plumbing_risk * (1 + current_fci), 1.0) as risk_score,
          GREATEST(15 - (plumbing_risk * 25), 1) as time_to_failure_months,
          plumbing_risk as failure_probability,
          6 as impact_score
        FROM component_analysis
        
        UNION ALL
        
        SELECT 
          building_id,
          building_name,
          'Structural' as component,
          LEAST(structural_risk * (1 + current_fci), 1.0) as risk_score,
          GREATEST(60 - (structural_risk * 120), 6) as time_to_failure_months,
          structural_risk as failure_probability,
          10 as impact_score
        FROM component_analysis
        
        ORDER BY risk_score DESC, impact_score DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        ...row,
        maintenance_history: [] // Would be populated with actual maintenance records
      }));
      
    } catch (error) {
      console.error('Error analyzing failure risk:', error);
      throw error;
    }
  }

  /**
   * Generate optimization suggestions for maintenance strategies
   */
  static async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    try {
      const query = `
        WITH building_data AS (
          SELECT 
            b.id as building_id,
            b.name as building_name,
            EXTRACT(YEAR FROM CURRENT_DATE) - b.year_built as age,
            b.square_footage,
            COALESCE(b.cost_per_sqft, 150) as cost_per_sqft,
            CASE 
              WHEN a.notes IS NOT NULL AND a.notes ~ 'FCI Score: ([0-9.]+)'
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
              ELSE 0.15
            END as current_fci,
            CASE 
              WHEN a.notes IS NOT NULL AND a.notes ~ 'Total Repair Cost: \\$([0-9,]+)'
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'Total Repair Cost: \\$([0-9,]+)'), '[^0-9]', '', 'g')::numeric
              ELSE square_footage * 50
            END as current_repair_cost
          FROM buildings b
          LEFT JOIN LATERAL (
            SELECT notes 
            FROM assessments 
            WHERE building_id = b.id 
              AND status = 'completed' 
              AND notes IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT 1
          ) a ON true
        )
        SELECT 
          building_id,
          building_name,
          -- Preventive maintenance suggestions
          'preventive' as suggestion_type,
          'HVAC System' as component,
          current_repair_cost * 0.3 as cost_savings,
          CASE 
            WHEN current_fci > 0.2 THEN '3-6 months'
            WHEN current_fci > 0.1 THEN '6-12 months'
            ELSE '12-18 months'
          END as timeline,
          CASE 
            WHEN age > 20 THEN 'Implement quarterly HVAC maintenance to prevent major failures'
            ELSE 'Establish biannual HVAC preventive maintenance schedule'
          END as description,
          CASE 
            WHEN current_fci > 0.2 THEN 3.5
            WHEN current_fci > 0.1 THEN 2.8
            ELSE 2.1
          END as roi
        FROM building_data
        WHERE current_fci > 0.08
        
        UNION ALL
        
        SELECT 
          building_id,
          building_name,
          'corrective' as suggestion_type,
          'Building Envelope' as component,
          current_repair_cost * 0.4 as cost_savings,
          '6-9 months' as timeline,
          'Address minor envelope issues before they become major problems' as description,
          CASE 
            WHEN current_fci > 0.25 THEN 4.2
            WHEN current_fci > 0.15 THEN 3.1
            ELSE 2.3
          END as roi
        FROM building_data
        WHERE current_fci > 0.12 AND age > 15
        
        UNION ALL
        
        SELECT 
          building_id,
          building_name,
          'replacement' as suggestion_type,
          CASE 
            WHEN age > 40 THEN 'Major Systems'
            WHEN age > 30 THEN 'HVAC Equipment'
            ELSE 'Electrical Components'
          END as component,
          current_repair_cost * 0.6 as cost_savings,
          CASE 
            WHEN current_fci > 0.35 THEN '1-2 years'
            WHEN current_fci > 0.25 THEN '2-3 years'
            ELSE '3-5 years'
          END as timeline,
          CASE 
            WHEN current_fci > 0.35 THEN 'Critical system replacement needed to avoid operational failures'
            WHEN current_fci > 0.25 THEN 'Planned system replacement more cost-effective than repairs'
            ELSE 'Consider system replacement for long-term efficiency gains'
          END as description,
          CASE 
            WHEN current_fci > 0.35 THEN 5.2
            WHEN current_fci > 0.25 THEN 3.8
            ELSE 2.5
          END as roi
        FROM building_data
        WHERE current_fci > 0.20 OR age > 25
        
        ORDER BY roi DESC, cost_savings DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive predictive maintenance dashboard data
   */
  static async getPredictiveMaintenanceDashboard(): Promise<any> {
    try {
      const [predictions, riskAnalysis, optimizations] = await Promise.all([
        this.generateMaintenancePredictions(),
        this.analyzeFailureRisk(),
        this.generateOptimizationSuggestions()
      ]);

      // Calculate summary metrics
      const highPriorityPredictions = predictions.filter(p => p.priority === 'high').length;
      const totalEstimatedCost = predictions.reduce((sum, p) => sum + p.estimated_cost, 0);
      const avgConfidenceScore = predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length;
      const potentialSavings = optimizations.reduce((sum, o) => sum + o.cost_savings, 0);

      return {
        summary: {
          high_priority_predictions: highPriorityPredictions,
          total_estimated_cost: Math.round(totalEstimatedCost),
          avg_confidence_score: Number(avgConfidenceScore.toFixed(2)),
          potential_savings: Math.round(potentialSavings),
          total_predictions: predictions.length
        },
        predictions: predictions.slice(0, 20), // Top 20 predictions
        risk_analysis: riskAnalysis.slice(0, 50), // Top 50 risk items
        optimizations: optimizations.slice(0, 15) // Top 15 optimization suggestions
      };
    } catch (error) {
      console.error('Error generating predictive maintenance dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private static calculateEstimatedCost(row: any): number {
    const baseCost = row.square_footage * row.cost_per_sqft * 0.1; // 10% of building value
    const fciMultiplier = Math.max(row.current_fci * 2, 0.5);
    const ageMultiplier = Math.max(row.age * 0.02, 0.8);
    
    return Math.round(baseCost * fciMultiplier * ageMultiplier);
  }

  private static generatePredictionDescription(row: any): string {
    const type = row.prediction_type;
    const months = Math.ceil((new Date(row.predicted_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    
    switch (type) {
      case 'component_failure':
        return `High probability of component failure within ${months} months due to age (${row.age} years) and deteriorating condition (FCI: ${row.current_fci.toFixed(3)})`;
      case 'major_repair':
        return `Major repairs anticipated within ${months} months. Current FCI of ${row.current_fci.toFixed(3)} indicates accelerating deterioration`;
      case 'system_replacement':
        return `System replacement recommended within ${months} months. Building age (${row.age} years) and condition suggest replacement more cost-effective than repairs`;
      default:
        return `Maintenance attention required within ${months} months based on current building condition`;
    }
  }

  private static generateRecommendations(row: any): string[] {
    const recommendations = [];
    
    if (row.current_fci > 0.25) {
      recommendations.push('Immediate assessment of critical systems required');
      recommendations.push('Develop emergency repair budget allocation');
    }
    
    if (row.age > 30) {
      recommendations.push('Consider comprehensive building renovation plan');
      recommendations.push('Evaluate life-cycle cost analysis for major systems');
    }
    
    if (row.recent_assessment_count < 2) {
      recommendations.push('Increase assessment frequency to improve prediction accuracy');
    }
    
    recommendations.push('Implement preventive maintenance schedule');
    recommendations.push('Monitor key performance indicators monthly');
    
    return recommendations;
  }
}

export default PredictiveMaintenanceService;