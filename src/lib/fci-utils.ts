/**
 * FCI (Facility Condition Index) Utilities
 * Updated with corrected interpretation ranges
 */

export interface FCIStatus {
  label: string;
  color: string;
  description: string;
  recommendation: string;
}

/**
 * Get the FCI status based on the FCI value
 * @param fci The Facility Condition Index value (0-1)
 * @returns FCIStatus object with label, color, description, and recommendation
 */
export function getFCIStatus(fci: number): FCIStatus {
  if (fci >= 0 && fci <= 0.1) {
    return {
      label: 'Excellent',
      color: '#10B981', // Green
      description: 'Representative of new building',
      recommendation: 'Routine maintenance only'
    };
  } else if (fci > 0.1 && fci <= 0.4) {
    return {
      label: 'Good',
      color: '#22C55E', // Light Green
      description: 'Light investment needed',
      recommendation: 'Continue preventive maintenance program'
    };
  } else if (fci > 0.4 && fci <= 0.7) {
    return {
      label: 'Fair',
      color: '#F59E0B', // Amber
      description: 'Need strong plan for renovation',
      recommendation: 'Develop comprehensive renovation plan and budget'
    };
  } else if (fci > 0.7) {
    return {
      label: 'Critical',
      color: '#EF4444', // Red
      description: 'Consider demolition',
      recommendation: 'Cost of repair/replacement is at or close to 100% of new build'
    };
  }
  
  // Default fallback (should not reach here with valid input)
  return {
    label: 'Unknown',
    color: '#6B7280',
    description: 'Invalid FCI value',
    recommendation: 'Recalculate FCI'
  };
}

/**
 * Get the FCI color based on the FCI value
 * @param fci The Facility Condition Index value (0-1)
 * @returns Hex color code
 */
export function getFCIColor(fci: number): string {
  return getFCIStatus(fci).color;
}

/**
 * Format FCI value for display
 * @param fci The Facility Condition Index value (0-1)
 * @returns Formatted string (e.g., "0.049" or "N/A" if invalid)
 */
export function formatFCI(fci: number | null | undefined): string {
  if (fci === null || fci === undefined || isNaN(fci)) {
    return 'N/A';
  }
  return fci.toFixed(3);
}

/**
 * Calculate FCI from deficiency cost and replacement value
 * @param deficiencyCost Total cost of all deficiencies
 * @param replacementValue Current replacement value of the building
 * @returns FCI value (0-1) or null if invalid inputs
 */
export function calculateFCI(deficiencyCost: number, replacementValue: number): number | null {
  if (replacementValue <= 0) {
    return null;
  }
  return deficiencyCost / replacementValue;
}

/**
 * Get progress percentage for FCI visualization
 * @param fci The Facility Condition Index value (0-1)
 * @returns Progress percentage (0-100)
 */
export function getFCIProgress(fci: number): number {
  // Invert the FCI for progress (lower FCI = better condition = higher progress)
  return Math.max(0, Math.min(100, (1 - fci) * 100));
}

/**
 * Deficiency category types
 */
export const DEFICIENCY_CATEGORIES = {
  'life-safety': 'Life Safety & Code Compliance',
  'critical-systems': 'Critical Systems & Operational Continuity',
  'energy-efficiency': 'Energy Efficiency & Sustainability',
  'asset-lifecycle': 'Asset Life Cycle & Deferred Maintenance',
  'user-experience': 'User Experience & Aesthetic Enhancement',
  'equity-accessibility': 'Equity & Accessibility',
  'other': 'Other'
} as const;

export type DeficiencyCategory = keyof typeof DEFICIENCY_CATEGORIES;