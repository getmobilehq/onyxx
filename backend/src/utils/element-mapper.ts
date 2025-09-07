/**
 * Element ID Management Service
 * Maps string codes to UUIDs and handles element lookups
 */

import pool from '../config/database';

/**
 * Maps element code (string) to UUID
 * @param elementCode - String code like "A1010", "B1010", etc.
 * @returns UUID string or null if not found
 */
export async function mapElementCodeToUuid(elementCode: string): Promise<string | null> {
  try {
    const result = await pool.query(
      'SELECT id FROM elements WHERE element_code = $1 OR uniformat_code = $1 LIMIT 1',
      [elementCode]
    );
    
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('Error mapping element code to UUID:', error);
    return null;
  }
}

/**
 * Maps UUID to element code
 * @param uuid - Element UUID
 * @returns Element code string or null if not found
 */
export async function mapUuidToElementCode(uuid: string): Promise<string | null> {
  try {
    const result = await pool.query(
      'SELECT element_code, uniformat_code FROM elements WHERE id = $1 LIMIT 1',
      [uuid]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].element_code || result.rows[0].uniformat_code || null;
    }
    return null;
  } catch (error) {
    console.error('Error mapping UUID to element code:', error);
    return null;
  }
}

/**
 * Gets element details by code or UUID
 * @param identifier - Either element code or UUID
 * @returns Element object or null if not found
 */
export async function getElementByIdentifier(identifier: string): Promise<any | null> {
  try {
    // Try as UUID first (if it's a valid UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    let result;
    if (uuidRegex.test(identifier)) {
      // Query by UUID
      result = await pool.query(
        'SELECT * FROM elements WHERE id = $1 LIMIT 1',
        [identifier]
      );
    } else {
      // Query by code
      result = await pool.query(
        'SELECT * FROM elements WHERE element_code = $1 OR uniformat_code = $1 LIMIT 1',
        [identifier]
      );
    }
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting element by identifier:', error);
    return null;
  }
}

/**
 * Validates element identifier (code or UUID)
 * @param identifier - Element identifier to validate
 * @returns true if valid, false otherwise
 */
export async function isValidElementIdentifier(identifier: string): Promise<boolean> {
  if (!identifier || typeof identifier !== 'string') {
    return false;
  }
  
  const element = await getElementByIdentifier(identifier);
  return element !== null;
}

/**
 * Batch process element identifiers - converts codes to UUIDs
 * @param identifiers - Array of element codes or UUIDs
 * @returns Array of UUIDs corresponding to the identifiers
 */
export async function batchMapElementIdentifiers(identifiers: string[]): Promise<(string | null)[]> {
  const promises = identifiers.map(identifier => {
    // If already UUID, return as is
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      return Promise.resolve(identifier);
    }
    
    // Otherwise map code to UUID
    return mapElementCodeToUuid(identifier);
  });
  
  return Promise.all(promises);
}

/**
 * Processes element data for assessment, handling both codes and UUIDs
 * @param elementData - Raw element data from frontend
 * @returns Processed element data with UUIDs
 */
export async function processElementDataForAssessment(elementData: any): Promise<any> {
  const processedElement = { ...elementData };
  
  // Convert element_id to UUID if it's a code
  if (processedElement.element_id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(processedElement.element_id)) {
      // It's a code, convert to UUID
      const uuid = await mapElementCodeToUuid(processedElement.element_id);
      if (!uuid) {
        throw new Error(`Invalid element identifier: ${processedElement.element_id}`);
      }
      processedElement.element_id = uuid;
    }
  }
  
  return processedElement;
}