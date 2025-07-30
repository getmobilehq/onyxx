-- Test the full analytics query step by step
WITH assessment_data AS (
  SELECT 
    a.building_id,
    COUNT(a.id) as total_assessments,
    AVG(COALESCE(a.total_deficiency_cost, 0)) as avg_repair_cost,
    ARRAY_AGG(a.fci_score ORDER BY a.created_at DESC) FILTER (WHERE a.fci_score IS NOT NULL) as fci_history
  FROM assessments a
  WHERE a.status = 'completed' AND a.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
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
WHERE b.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ORDER BY b.name;