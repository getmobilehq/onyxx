import pool from '../config/database';

export interface BuildingAnalytics {
  id: string;
  name: string;
  type: string;
  year_built: number;
  age: number;
  square_footage: number;
  cost_per_sqft: number;
  latest_fci: number | null;
  fci_trend: 'improving' | 'declining' | 'stable' | 'no_data';
  total_assessments: number;
  avg_repair_cost: number;
  cost_per_sqft_actual: number;
  efficiency_rating: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface FCIAgeCorrelation {
  age_range: string;
  avg_fci: number;
  building_count: number;
  avg_cost_per_sqft: number;
}

export interface CostEfficiencyAnalysis {
  building_id: string;
  building_name: string;
  cost_per_sqft: number;
  repair_cost_per_sqft: number;
  efficiency_score: number;
  fci: number;
  age: number;
}

export class AnalyticsService {
  /**
   * Get detailed building analytics with cost and FCI metrics
   */
  static async getBuildingAnalytics(): Promise<BuildingAnalytics[]> {
    try {
      const query = `
        WITH assessment_data AS (
          SELECT 
            a.building_id,
            COUNT(a.id) as total_assessments,
            AVG(
              CASE 
                WHEN a.notes IS NOT NULL AND a.notes ~ 'Total Repair Cost: \\$([0-9,]+)'
                THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'Total Repair Cost: \\$([0-9,]+)'), '[^0-9]', '', 'g')::numeric
                ELSE 0
              END
            ) as avg_repair_cost,
            ARRAY_AGG(
              CASE 
                WHEN a.notes IS NOT NULL AND a.notes ~ 'FCI Score: ([0-9.]+)'
                THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
                ELSE NULL
              END
              ORDER BY a.created_at DESC
            ) FILTER (WHERE a.notes IS NOT NULL) as fci_history
          FROM assessments a
          WHERE a.status = 'completed'
          GROUP BY a.building_id
        ),
        fci_trends AS (
          SELECT 
            building_id,
            fci_history[1] as latest_fci,
            CASE 
              WHEN array_length(fci_history, 1) >= 2 THEN
                CASE 
                  WHEN fci_history[1] < fci_history[2] THEN 'improving'
                  WHEN fci_history[1] > fci_history[2] THEN 'declining'
                  ELSE 'stable'
                END
              ELSE 'no_data'
            END as fci_trend
          FROM assessment_data
        )
        SELECT 
          b.id,
          b.name,
          b.building_type as type,
          b.year_built,
          EXTRACT(YEAR FROM CURRENT_DATE) - COALESCE(b.year_built, EXTRACT(YEAR FROM CURRENT_DATE) - 30) as age,
          b.square_footage,
          CASE 
            WHEN b.square_footage > 0 AND b.replacement_value > 0 
            THEN b.replacement_value / b.square_footage
            ELSE 150 
          END as cost_per_sqft,
          ft.latest_fci,
          ft.fci_trend,
          COALESCE(ad.total_assessments, 0) as total_assessments,
          COALESCE(ad.avg_repair_cost, 0) as avg_repair_cost,
          CASE 
            WHEN b.square_footage > 0 
            THEN COALESCE(ad.avg_repair_cost, 0) / b.square_footage
            ELSE 0
          END as cost_per_sqft_actual,
          CASE 
            WHEN ft.latest_fci IS NULL THEN 'fair'
            WHEN ft.latest_fci <= 0.05 THEN 'excellent'
            WHEN ft.latest_fci <= 0.10 THEN 'good'
            WHEN ft.latest_fci <= 0.30 THEN 'fair'
            ELSE 'poor'
          END as efficiency_rating
        FROM buildings b
        LEFT JOIN assessment_data ad ON b.id = ad.building_id
        LEFT JOIN fci_trends ft ON b.id = ft.building_id
        ORDER BY b.name
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching building analytics:', error);
      throw error;
    }
  }

  /**
   * Analyze correlation between building age and FCI scores
   */
  static async getFCIAgeCorrelation(): Promise<FCIAgeCorrelation[]> {
    try {
      const query = `
        WITH building_fci AS (
          SELECT 
            b.id,
            b.name,
            EXTRACT(YEAR FROM CURRENT_DATE) - b.year_built as age,
            CASE 
              WHEN b.square_footage > 0 AND b.replacement_value > 0 
              THEN b.replacement_value / b.square_footage
              ELSE 150 
            END as cost_per_sqft,
            CASE 
              WHEN a.notes IS NOT NULL AND a.notes ~ 'FCI Score: ([0-9.]+)'
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
              ELSE NULL
            END as fci
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
        ),
        age_groups AS (
          SELECT 
            CASE 
              WHEN age < 10 THEN '0-9 years'
              WHEN age < 20 THEN '10-19 years'
              WHEN age < 30 THEN '20-29 years'
              WHEN age < 40 THEN '30-39 years'
              WHEN age < 50 THEN '40-49 years'
              ELSE '50+ years'
            END as age_range,
            fci,
            cost_per_sqft
          FROM building_fci
          WHERE fci IS NOT NULL
        )
        SELECT 
          age_range,
          AVG(fci) as avg_fci,
          COUNT(*) as building_count,
          AVG(cost_per_sqft) as avg_cost_per_sqft
        FROM age_groups
        GROUP BY age_range
        ORDER BY 
          CASE age_range
            WHEN '0-9 years' THEN 1
            WHEN '10-19 years' THEN 2
            WHEN '20-29 years' THEN 3
            WHEN '30-39 years' THEN 4
            WHEN '40-49 years' THEN 5
            ELSE 6
          END
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching FCI age correlation:', error);
      throw error;
    }
  }

  /**
   * Analyze cost efficiency across buildings
   */
  static async getCostEfficiencyAnalysis(): Promise<CostEfficiencyAnalysis[]> {
    try {
      const query = `
        WITH building_costs AS (
          SELECT 
            b.id as building_id,
            b.name as building_name,
            CASE 
              WHEN b.square_footage > 0 AND b.replacement_value > 0 
              THEN b.replacement_value / b.square_footage
              ELSE 150 
            END as cost_per_sqft,
            EXTRACT(YEAR FROM CURRENT_DATE) - b.year_built as age,
            CASE 
              WHEN a.notes IS NOT NULL AND a.notes ~ 'FCI Score: ([0-9.]+)'
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
              ELSE 0.15
            END as fci,
            CASE 
              WHEN a.notes IS NOT NULL AND a.notes ~ 'Total Repair Cost: \\$([0-9,]+)' AND b.square_footage > 0
              THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'Total Repair Cost: \\$([0-9,]+)'), '[^0-9]', '', 'g')::numeric / b.square_footage
              ELSE 0
            END as repair_cost_per_sqft
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
          WHERE b.square_footage > 0
        )
        SELECT 
          building_id,
          building_name,
          cost_per_sqft,
          repair_cost_per_sqft,
          age,
          fci,
          -- Efficiency score based on low FCI and reasonable costs
          CASE 
            WHEN fci <= 0.05 AND repair_cost_per_sqft <= 50 THEN 95
            WHEN fci <= 0.10 AND repair_cost_per_sqft <= 75 THEN 85
            WHEN fci <= 0.20 AND repair_cost_per_sqft <= 100 THEN 75
            WHEN fci <= 0.30 AND repair_cost_per_sqft <= 150 THEN 65
            ELSE 50
          END as efficiency_score
        FROM building_costs
        ORDER BY efficiency_score DESC, fci ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching cost efficiency analysis:', error);
      throw error;
    }
  }

  /**
   * Get maintenance cost trends over time
   */
  static async getMaintenanceCostTrends(months: number = 12): Promise<any[]> {
    try {
      const query = `
        WITH monthly_costs AS (
          SELECT 
            DATE_TRUNC('month', a.created_at) as month,
            COUNT(a.id) as assessment_count,
            AVG(
              CASE 
                WHEN a.notes IS NOT NULL AND a.notes ~ 'Total Repair Cost: \\$([0-9,]+)'
                THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'Total Repair Cost: \\$([0-9,]+)'), '[^0-9]', '', 'g')::numeric
                ELSE 0
              END
            ) as avg_repair_cost,
            SUM(
              CASE 
                WHEN a.notes IS NOT NULL AND a.notes ~ 'Total Repair Cost: \\$([0-9,]+)'
                THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'Total Repair Cost: \\$([0-9,]+)'), '[^0-9]', '', 'g')::numeric
                ELSE 0
              END
            ) as total_repair_cost,
            AVG(
              CASE 
                WHEN a.notes IS NOT NULL AND a.notes ~ 'FCI Score: ([0-9.]+)'
                THEN REGEXP_REPLACE(REGEXP_SUBSTR(a.notes, 'FCI Score: ([0-9.]+)'), '[^0-9.]', '', 'g')::numeric
                ELSE NULL
              END
            ) as avg_fci
          FROM assessments a
          WHERE a.status = 'completed'
            AND a.created_at >= CURRENT_DATE - INTERVAL '${months} months'
          GROUP BY DATE_TRUNC('month', a.created_at)
        )
        SELECT 
          TO_CHAR(month, 'YYYY-MM') as period,
          assessment_count,
          ROUND(avg_repair_cost::numeric, 2) as avg_repair_cost,
          total_repair_cost,
          ROUND(avg_fci::numeric, 4) as avg_fci
        FROM monthly_costs
        ORDER BY month
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching maintenance cost trends:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics summary
   */
  static async getAnalyticsSummary(): Promise<any> {
    try {
      const [
        buildingAnalytics,
        fciAgeCorrelation,
        costEfficiency,
        costTrends
      ] = await Promise.all([
        this.getBuildingAnalytics(),
        this.getFCIAgeCorrelation(),
        this.getCostEfficiencyAnalysis(),
        this.getMaintenanceCostTrends()
      ]);

      // Calculate summary metrics
      const totalBuildings = buildingAnalytics.length;
      const avgAge = buildingAnalytics.reduce((sum, b) => sum + b.age, 0) / totalBuildings;
      const avgFCI = buildingAnalytics
        .filter(b => b.latest_fci !== null)
        .reduce((sum, b) => sum + (b.latest_fci || 0), 0) / 
        buildingAnalytics.filter(b => b.latest_fci !== null).length;
      
      const avgCostPerSqft = buildingAnalytics
        .reduce((sum, b) => sum + b.cost_per_sqft, 0) / totalBuildings;
      
      const avgRepairCostPerSqft = buildingAnalytics
        .reduce((sum, b) => sum + b.cost_per_sqft_actual, 0) / totalBuildings;

      return {
        summary: {
          total_buildings: totalBuildings,
          avg_age: Math.round(avgAge),
          avg_fci: Number(avgFCI.toFixed(4)),
          avg_cost_per_sqft: Math.round(avgCostPerSqft),
          avg_repair_cost_per_sqft: Math.round(avgRepairCostPerSqft)
        },
        building_analytics: buildingAnalytics,
        fci_age_correlation: fciAgeCorrelation,
        cost_efficiency: costEfficiency,
        cost_trends: costTrends
      };
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  }
}

export default AnalyticsService;