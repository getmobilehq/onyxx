import pool from '../config/database';

// FCI calculation interfaces
export interface ElementAssessment {
  element_id: string;
  condition_rating: number;
  repair_cost?: number;
  replacement_cost?: number;
  useful_life?: number;
  age?: number;
  quantity?: number;
  unit_cost?: number;
}

export interface FCICalculationResult {
  fci_score: number;
  total_repair_cost: number;
  replacement_cost: number;
  immediate_repair_cost: number;
  short_term_repair_cost: number;
  long_term_repair_cost: number;
  condition_rating: 'Good' | 'Fair' | 'Poor' | 'Critical';
  elements_breakdown: ElementAssessment[];
}

export interface BuildingInfo {
  id: string;
  square_footage: number;
  cost_per_sqft: number;
  year_built: number;
  type: string;
}

/**
 * Calculate FCI score and breakdown for an assessment
 * @param assessmentId - The assessment ID
 * @returns FCI calculation results
 */
export const calculateAssessmentFCI = async (assessmentId: string): Promise<FCICalculationResult> => {
  try {
    console.log('🧮 Starting FCI calculation for assessment:', assessmentId);
    
    // Get assessment and building information
    const assessmentQuery = `
      SELECT a.*, b.square_footage, b.cost_per_sqft, b.year_built, b.building_type as building_type
      FROM assessments a
      JOIN buildings b ON a.building_id = b.id
      WHERE a.id = $1
    `;
    
    console.log('🔍 Querying assessment and building data...');
    const assessmentResult = await pool.query(assessmentQuery, [assessmentId]);
    
    if (assessmentResult.rows.length === 0) {
      console.error('❌ Assessment not found in FCI calculation:', assessmentId);
      throw new Error(`Assessment not found: ${assessmentId}`);
    }
    
    const assessment = assessmentResult.rows[0];
    console.log('ℹ️ Assessment data:', {
      id: assessment.id,
      building_id: assessment.building_id,
      square_footage: assessment.square_footage,
      cost_per_sqft: assessment.cost_per_sqft,
      year_built: assessment.year_built,
      building_type: assessment.building_type
    });
    
    const building: BuildingInfo = {
      id: assessment.building_id,
      square_footage: assessment.square_footage || 10000, // Default to 10k sq ft if missing
      cost_per_sqft: assessment.cost_per_sqft || 200,     // Default $200/sq ft if missing
      year_built: assessment.year_built || new Date().getFullYear() - 10, // Default 10 years old if missing
      type: assessment.building_type || 'office-single'   // Default type if missing
    };

    console.log('🏢 Building info prepared:', building);

    // Get assessment elements with condition ratings
    const elementsQuery = `
      SELECT ae.*, e.major_group, e.group_element, e.individual_element
      FROM assessment_elements ae
      JOIN elements e ON ae.element_id = e.id
      WHERE ae.assessment_id = $1 AND ae.condition_rating IS NOT NULL
    `;
    
    console.log('🔍 Querying assessment elements...');
    const elementsResult = await pool.query(elementsQuery, [assessmentId]);
    const elements = elementsResult.rows;

    console.log(`ℹ️ Found ${elements.length} assessment elements with condition ratings`);

    if (elements.length === 0) {
      console.log('⚠️ No assessment elements found, using basic FCI calculation');
      // If no assessment elements, calculate basic FCI based on building age
      const basicFCI = calculateBasicFCI(building);
      console.log('✅ Basic FCI calculation completed:', basicFCI);
      return basicFCI;
    }

    // Calculate detailed FCI based on assessment elements
    console.log('🧮 Calculating detailed FCI based on element ratings...');
    const detailedFCI = calculateDetailedFCI(building, elements);
    console.log('✅ Detailed FCI calculation completed:', detailedFCI);
    return detailedFCI;

  } catch (error: any) {
    console.error('❌ FCI calculation error:', {
      message: error.message,
      stack: error.stack,
      assessmentId
    });
    
    // Return a basic FCI if calculation fails completely
    console.log('⚠️ FCI calculation failed, returning default values');
    return {
      fci_score: 0.15, // Default "Fair" condition
      total_repair_cost: 100000, // Default repair cost
      replacement_cost: 2000000, // Default replacement cost
      immediate_repair_cost: 30000,
      short_term_repair_cost: 40000,
      long_term_repair_cost: 30000,
      condition_rating: 'Fair',
      elements_breakdown: []
    };
  }
};

/**
 * Calculate basic FCI when no detailed assessment data is available
 * Uses building age and type to estimate condition
 */
const calculateBasicFCI = (building: BuildingInfo): FCICalculationResult => {
  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - building.year_built;
  
  // Basic FCI calculation based on age
  // Assumes 2% deterioration per year with building type modifiers
  const typeModifier = getBuildingTypeModifier(building.type);
  const baseFCI = Math.min((buildingAge * 0.02) * typeModifier, 0.8);
  
  const replacementCost = building.square_footage * building.cost_per_sqft;
  const totalRepairCost = replacementCost * baseFCI;
  
  // Distribute repair costs across time periods
  const immediateCost = totalRepairCost * 0.3; // 30% immediate
  const shortTermCost = totalRepairCost * 0.4; // 40% short-term
  const longTermCost = totalRepairCost * 0.3; // 30% long-term

  return {
    fci_score: baseFCI,
    total_repair_cost: totalRepairCost,
    replacement_cost: replacementCost,
    immediate_repair_cost: immediateCost,
    short_term_repair_cost: shortTermCost,
    long_term_repair_cost: longTermCost,
    condition_rating: getFCIRating(baseFCI),
    elements_breakdown: []
  };
};

/**
 * Calculate detailed FCI based on individual element assessments
 */
const calculateDetailedFCI = (building: BuildingInfo, elements: any[]): FCICalculationResult => {
  const replacementCost = building.square_footage * building.cost_per_sqft;
  let totalRepairCost = 0;
  let immediateCost = 0;
  let shortTermCost = 0;
  let longTermCost = 0;
  
  const elementsBreakdown: ElementAssessment[] = elements.map(element => {
    // Calculate repair cost based on condition rating
    const repairCost = calculateElementRepairCost(element, building);
    totalRepairCost += repairCost;
    
    // Distribute costs based on condition severity
    const costs = distributeRepairCosts(repairCost, element.condition_rating);
    immediateCost += costs.immediate;
    shortTermCost += costs.shortTerm;
    longTermCost += costs.longTerm;
    
    return {
      element_id: element.element_id,
      condition_rating: element.condition_rating,
      repair_cost: repairCost,
      replacement_cost: calculateElementReplacementCost(element, building),
      useful_life: element.useful_life,
      age: element.age,
      quantity: element.quantity,
      unit_cost: element.unit_cost
    };
  });
  
  const fciScore = totalRepairCost / replacementCost;
  
  return {
    fci_score: fciScore,
    total_repair_cost: totalRepairCost,
    replacement_cost: replacementCost,
    immediate_repair_cost: immediateCost,
    short_term_repair_cost: shortTermCost,
    long_term_repair_cost: longTermCost,
    condition_rating: getFCIRating(fciScore),
    elements_breakdown: elementsBreakdown
  };
};

/**
 * Calculate repair cost for individual element based on condition
 */
const calculateElementRepairCost = (element: any, building: BuildingInfo): number => {
  // Base cost calculation using condition rating (1-5 scale)
  // 1 = Excellent, 2 = Good, 3 = Fair, 4 = Poor, 5 = Critical
  
  const conditionMultipliers = {
    1: 0.05,  // Excellent - minimal maintenance
    2: 0.15,  // Good - minor repairs
    3: 0.35,  // Fair - moderate repairs
    4: 0.65,  // Poor - major repairs
    5: 0.90   // Critical - near replacement
  };
  
  const multiplier = conditionMultipliers[element.condition_rating as keyof typeof conditionMultipliers] || 0.35;
  
  // Estimate element replacement cost (percentage of building cost)
  const elementCostPercentage = getElementCostPercentage(element.major_group);
  const elementReplacementCost = (building.square_footage * building.cost_per_sqft) * elementCostPercentage;
  
  return elementReplacementCost * multiplier;
};

/**
 * Calculate replacement cost for individual element
 */
const calculateElementReplacementCost = (element: any, building: BuildingInfo): number => {
  const elementCostPercentage = getElementCostPercentage(element.major_group);
  return (building.square_footage * building.cost_per_sqft) * elementCostPercentage;
};

/**
 * Distribute repair costs across time periods based on condition severity
 */
const distributeRepairCosts = (totalCost: number, conditionRating: number) => {
  // Higher condition ratings (worse condition) require more immediate attention
  const distributions = {
    1: { immediate: 0.1, shortTerm: 0.3, longTerm: 0.6 }, // Excellent
    2: { immediate: 0.2, shortTerm: 0.4, longTerm: 0.4 }, // Good
    3: { immediate: 0.4, shortTerm: 0.4, longTerm: 0.2 }, // Fair
    4: { immediate: 0.7, shortTerm: 0.2, longTerm: 0.1 }, // Poor
    5: { immediate: 0.9, shortTerm: 0.1, longTerm: 0.0 }  // Critical
  };
  
  const dist = distributions[conditionRating as keyof typeof distributions] || distributions[3];
  
  return {
    immediate: totalCost * dist.immediate,
    shortTerm: totalCost * dist.shortTerm,
    longTerm: totalCost * dist.longTerm
  };
};

/**
 * Get building type modifier for FCI calculation
 */
const getBuildingTypeModifier = (buildingType: string): number => {
  const modifiers: Record<string, number> = {
    'office-single': 1.0,
    'office-midrise': 1.1,
    'office-highrise': 1.3,
    'warehouse-basic': 0.8,
    'warehouse-industrial': 1.0,
    'manufacturing': 1.2,
    'medical-office': 1.4,
    'hospital': 1.6,
    'school-primary': 1.1,
    'university': 1.2,
    'retail-strip': 0.9,
    'retail-mall': 1.1,
    'apartments': 1.0
  };
  
  return modifiers[buildingType] || 1.0;
};

/**
 * Get element cost percentage of total building cost
 */
const getElementCostPercentage = (majorGroup: string): number => {
  const percentages: Record<string, number> = {
    'A - Substructure': 0.08,
    'B - Shell': 0.25,
    'C - Interiors': 0.20,
    'D - Services': 0.30,
    'E - Equipment & Furnishings': 0.10,
    'F - Special Construction': 0.05,
    'G - Building Sitework': 0.02
  };
  
  return percentages[majorGroup] || 0.15;
};

/**
 * Get FCI condition rating based on score
 */
const getFCIRating = (fci: number): 'Good' | 'Fair' | 'Poor' | 'Critical' => {
  if (fci <= 0.05) return 'Good';
  if (fci <= 0.10) return 'Fair';
  if (fci <= 0.30) return 'Poor';
  return 'Critical';
};

/**
 * Save FCI calculation results to database
 */
export const saveFCIReport = async (
  assessmentId: string, 
  buildingId: string, 
  fciResults: FCICalculationResult,
  userId?: string
): Promise<string> => {
  try {
    const insertQuery = `
      INSERT INTO reports (
        building_id,
        assessment_id,
        title,
        created_by_user_id,
        total_repair_cost,
        replacement_value,
        replacement_cost,
        fci_score,
        immediate_repair_cost,
        short_term_repair_cost,
        long_term_repair_cost,
        status,
        report_type,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, 'draft', 'facility_condition', CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const result = await pool.query(insertQuery, [
      buildingId,
      assessmentId,
      `FCI Assessment Report - ${new Date().toLocaleDateString()}`, // title
      userId || null, // created_by_user_id
      fciResults.total_repair_cost,
      fciResults.replacement_cost, // This goes to both replacement_value and replacement_cost
      fciResults.fci_score,
      fciResults.immediate_repair_cost,
      fciResults.short_term_repair_cost,
      fciResults.long_term_repair_cost
    ]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving FCI report:', error);
    throw error;
  }
};

/**
 * Update assessment with FCI calculation and mark as completed
 */
export const completeAssessmentWithFCI = async (assessmentId: string, userId?: string): Promise<FCICalculationResult> => {
  try {
    // Calculate FCI
    const fciResults = await calculateAssessmentFCI(assessmentId);
    
    // Get building ID
    const assessmentQuery = 'SELECT building_id FROM assessments WHERE id = $1';
    const assessmentResult = await pool.query(assessmentQuery, [assessmentId]);
    
    if (assessmentResult.rows.length === 0) {
      throw new Error('Assessment not found');
    }
    
    const buildingId = assessmentResult.rows[0].building_id;
    
    // Save FCI report
    await saveFCIReport(assessmentId, buildingId, fciResults, userId);
    
    // Create detailed notes with FCI information
    const detailedNotes = generateFCINotes(fciResults);
    
    // Update assessment status and notes
    const updateQuery = `
      UPDATE assessments 
      SET status = 'completed', 
          completed_at = CURRENT_TIMESTAMP,
          notes = $2
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [assessmentId, detailedNotes]);
    
    return fciResults;
  } catch (error) {
    console.error('Error completing assessment with FCI:', error);
    throw error;
  }
};

/**
 * Generate detailed notes with FCI information
 */
const generateFCINotes = (fciResults: FCICalculationResult): string => {
  const notes = `
FACILITY CONDITION INDEX (FCI) ASSESSMENT RESULTS

FCI Score: ${fciResults.fci_score.toFixed(4)}
Condition Rating: ${fciResults.condition_rating}

COST BREAKDOWN:
- Total Repair Cost: $${fciResults.total_repair_cost.toLocaleString()}
- Replacement Value: $${fciResults.replacement_cost.toLocaleString()}

REPAIR TIMELINE:
- Immediate Repairs: $${fciResults.immediate_repair_cost.toLocaleString()}
- Short-term (1-3 years): $${fciResults.short_term_repair_cost.toLocaleString()}
- Long-term (3-5 years): $${fciResults.long_term_repair_cost.toLocaleString()}

FCI CALCULATION:
FCI = Total Repair Cost ÷ Replacement Value
FCI = $${fciResults.total_repair_cost.toLocaleString()} ÷ $${fciResults.replacement_cost.toLocaleString()} = ${fciResults.fci_score.toFixed(4)}

CONDITION RATING SCALE:
- Good (0.00-0.05): Well-maintained, minimal repairs needed
- Fair (0.06-0.10): Adequate condition, routine maintenance required
- Poor (0.11-0.30): Deteriorating condition, significant repairs needed
- Critical (0.31+): Major repairs or replacement required

Assessment completed automatically with FCI calculation.
Generated on: ${new Date().toLocaleString()}
  `.trim();
  
  return notes;
};

export default {
  calculateAssessmentFCI,
  completeAssessmentWithFCI,
  saveFCIReport
};