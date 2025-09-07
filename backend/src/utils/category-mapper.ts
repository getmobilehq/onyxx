/**
 * Category Mapping Service
 * Maps frontend kebab-case categories to database Title Case categories
 */

// Database categories (Title Case as stored in DB constraints)
export const DB_CATEGORIES = {
  'Life Safety & Code Compliance': 'Life Safety & Code Compliance',
  'Critical Systems': 'Critical Systems', 
  'Energy Efficiency': 'Energy Efficiency',
  'Asset Life Cycle': 'Asset Life Cycle',
  'User Experience': 'User Experience',
  'Equity & Accessibility': 'Equity & Accessibility'
} as const;

// Frontend categories (kebab-case as used in frontend)
export const FRONTEND_CATEGORIES = {
  'life-safety': 'Life Safety & Code Compliance',
  'critical-systems': 'Critical Systems & Operational Continuity',
  'energy-efficiency': 'Energy Efficiency & Sustainability', 
  'asset-lifecycle': 'Asset Life Cycle & Deferred Maintenance',
  'user-experience': 'User Experience & Aesthetic Enhancement',
  'equity-accessibility': 'Equity & Accessibility'
} as const;

// Reverse mapping (Title Case to kebab-case)
export const DB_TO_FRONTEND_CATEGORIES = {
  'Life Safety & Code Compliance': 'life-safety',
  'Critical Systems': 'critical-systems',
  'Energy Efficiency': 'energy-efficiency',
  'Asset Life Cycle': 'asset-lifecycle',
  'User Experience': 'user-experience', 
  'Equity & Accessibility': 'equity-accessibility'
} as const;

/**
 * Maps frontend category to database category
 * @param frontendCategory - kebab-case category from frontend
 * @returns Title Case category for database or null if invalid
 */
export function mapFrontendToDbCategory(frontendCategory: string): string | null {
  // Direct mapping from frontend categories
  if (frontendCategory in FRONTEND_CATEGORIES) {
    const fullTitle = FRONTEND_CATEGORIES[frontendCategory as keyof typeof FRONTEND_CATEGORIES];
    // Map full titles to DB categories (some have abbreviated names in DB)
    switch (fullTitle) {
      case 'Critical Systems & Operational Continuity':
        return 'Critical Systems';
      case 'Energy Efficiency & Sustainability':
        return 'Energy Efficiency';
      case 'Asset Life Cycle & Deferred Maintenance':
        return 'Asset Life Cycle';
      case 'User Experience & Aesthetic Enhancement':
        return 'User Experience';
      default:
        return fullTitle;
    }
  }

  // Check if it's already in the correct format
  if (Object.values(DB_CATEGORIES).includes(frontendCategory as any)) {
    return frontendCategory;
  }

  // Fallback: try to match partial strings
  const lowerInput = frontendCategory.toLowerCase();
  
  if (lowerInput.includes('life') || lowerInput.includes('safety')) {
    return 'Life Safety & Code Compliance';
  }
  if (lowerInput.includes('critical') || lowerInput.includes('systems')) {
    return 'Critical Systems';
  }
  if (lowerInput.includes('energy') || lowerInput.includes('efficiency')) {
    return 'Energy Efficiency';
  }
  if (lowerInput.includes('asset') || lowerInput.includes('lifecycle') || lowerInput.includes('life cycle')) {
    return 'Asset Life Cycle';
  }
  if (lowerInput.includes('user') || lowerInput.includes('experience')) {
    return 'User Experience';
  }
  if (lowerInput.includes('equity') || lowerInput.includes('accessibility')) {
    return 'Equity & Accessibility';
  }

  return null;
}

/**
 * Maps database category to frontend category
 * @param dbCategory - Title Case category from database  
 * @returns kebab-case category for frontend
 */
export function mapDbToFrontendCategory(dbCategory: string): string {
  return DB_TO_FRONTEND_CATEGORIES[dbCategory as keyof typeof DB_TO_FRONTEND_CATEGORIES] || 'other';
}

/**
 * Validates if a category is valid for database storage
 * @param category - Category to validate
 * @returns true if valid, false otherwise
 */
export function isValidDbCategory(category: string): boolean {
  return Object.values(DB_CATEGORIES).includes(category as any);
}

/**
 * Gets all valid database categories
 * @returns Array of valid database category strings
 */
export function getValidDbCategories(): string[] {
  return Object.values(DB_CATEGORIES);
}