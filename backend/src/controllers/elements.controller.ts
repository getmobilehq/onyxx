import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

// Get all Uniformat elements
export const getAllElements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { major_group, search } = req.query;

    let query = `
      SELECT id, major_group, group_element, individual_element
      FROM elements
      WHERE 1=1
    `;
    const params: any[] = [];

    if (major_group) {
      params.push(major_group);
      query += ` AND major_group = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (group_element ILIKE $${params.length} OR individual_element ILIKE $${params.length})`;
    }

    query += ' ORDER BY major_group, group_element, individual_element';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        elements: result.rows,
        count: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get element by ID
export const getElementById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM elements WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Element not found',
      });
    }

    res.json({
      success: true,
      data: {
        element: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Seed Uniformat elements (run once)
export const seedElements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if elements already exist
    const checkResult = await pool.query('SELECT COUNT(*) FROM elements');
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.json({
        success: true,
        message: 'Elements already seeded',
        count: checkResult.rows[0].count,
      });
    }

    // Common building elements based on Uniformat II
    const elements = [
      // A - Substructure
      { major_group: 'A - Substructure', group_element: 'A10 - Foundations', individual_element: 'A1010 - Standard Foundations' },
      { major_group: 'A - Substructure', group_element: 'A10 - Foundations', individual_element: 'A1020 - Special Foundations' },
      { major_group: 'A - Substructure', group_element: 'A20 - Basement Construction', individual_element: 'A2010 - Basement Excavation' },
      { major_group: 'A - Substructure', group_element: 'A20 - Basement Construction', individual_element: 'A2020 - Basement Walls' },
      
      // B - Shell
      { major_group: 'B - Shell', group_element: 'B10 - Superstructure', individual_element: 'B1010 - Floor Construction' },
      { major_group: 'B - Shell', group_element: 'B10 - Superstructure', individual_element: 'B1020 - Roof Construction' },
      { major_group: 'B - Shell', group_element: 'B20 - Exterior Enclosure', individual_element: 'B2010 - Exterior Walls' },
      { major_group: 'B - Shell', group_element: 'B20 - Exterior Enclosure', individual_element: 'B2020 - Exterior Windows' },
      { major_group: 'B - Shell', group_element: 'B20 - Exterior Enclosure', individual_element: 'B2030 - Exterior Doors' },
      { major_group: 'B - Shell', group_element: 'B30 - Roofing', individual_element: 'B3010 - Roof Coverings' },
      { major_group: 'B - Shell', group_element: 'B30 - Roofing', individual_element: 'B3020 - Roof Openings' },
      
      // C - Interiors
      { major_group: 'C - Interiors', group_element: 'C10 - Interior Construction', individual_element: 'C1010 - Partitions' },
      { major_group: 'C - Interiors', group_element: 'C10 - Interior Construction', individual_element: 'C1020 - Interior Doors' },
      { major_group: 'C - Interiors', group_element: 'C10 - Interior Construction', individual_element: 'C1030 - Fittings' },
      { major_group: 'C - Interiors', group_element: 'C20 - Stairs', individual_element: 'C2010 - Stair Construction' },
      { major_group: 'C - Interiors', group_element: 'C20 - Stairs', individual_element: 'C2020 - Stair Finishes' },
      { major_group: 'C - Interiors', group_element: 'C30 - Interior Finishes', individual_element: 'C3010 - Wall Finishes' },
      { major_group: 'C - Interiors', group_element: 'C30 - Interior Finishes', individual_element: 'C3020 - Floor Finishes' },
      { major_group: 'C - Interiors', group_element: 'C30 - Interior Finishes', individual_element: 'C3030 - Ceiling Finishes' },
      
      // D - Services
      { major_group: 'D - Services', group_element: 'D10 - Conveying', individual_element: 'D1010 - Elevators & Lifts' },
      { major_group: 'D - Services', group_element: 'D10 - Conveying', individual_element: 'D1020 - Escalators' },
      { major_group: 'D - Services', group_element: 'D20 - Plumbing', individual_element: 'D2010 - Plumbing Fixtures' },
      { major_group: 'D - Services', group_element: 'D20 - Plumbing', individual_element: 'D2020 - Domestic Water Distribution' },
      { major_group: 'D - Services', group_element: 'D20 - Plumbing', individual_element: 'D2030 - Sanitary Drainage' },
      { major_group: 'D - Services', group_element: 'D30 - HVAC', individual_element: 'D3010 - Energy Supply' },
      { major_group: 'D - Services', group_element: 'D30 - HVAC', individual_element: 'D3020 - Heat Generating Systems' },
      { major_group: 'D - Services', group_element: 'D30 - HVAC', individual_element: 'D3030 - Cooling Generating Systems' },
      { major_group: 'D - Services', group_element: 'D30 - HVAC', individual_element: 'D3040 - Distribution Systems' },
      { major_group: 'D - Services', group_element: 'D30 - HVAC', individual_element: 'D3050 - Terminal & Package Units' },
      { major_group: 'D - Services', group_element: 'D40 - Fire Protection', individual_element: 'D4010 - Sprinklers' },
      { major_group: 'D - Services', group_element: 'D40 - Fire Protection', individual_element: 'D4020 - Standpipes' },
      { major_group: 'D - Services', group_element: 'D50 - Electrical', individual_element: 'D5010 - Electrical Service & Distribution' },
      { major_group: 'D - Services', group_element: 'D50 - Electrical', individual_element: 'D5020 - Lighting & Branch Wiring' },
      { major_group: 'D - Services', group_element: 'D50 - Electrical', individual_element: 'D5030 - Communications & Security' },
      
      // E - Equipment & Furnishings
      { major_group: 'E - Equipment & Furnishings', group_element: 'E10 - Equipment', individual_element: 'E1010 - Commercial Equipment' },
      { major_group: 'E - Equipment & Furnishings', group_element: 'E10 - Equipment', individual_element: 'E1020 - Institutional Equipment' },
      { major_group: 'E - Equipment & Furnishings', group_element: 'E20 - Furnishings', individual_element: 'E2010 - Fixed Furnishings' },
      
      // F - Special Construction
      { major_group: 'F - Special Construction', group_element: 'F10 - Special Construction', individual_element: 'F1010 - Special Structures' },
      { major_group: 'F - Special Construction', group_element: 'F20 - Selective Demolition', individual_element: 'F2010 - Building Elements Demolition' },
      
      // G - Building Sitework
      { major_group: 'G - Building Sitework', group_element: 'G10 - Site Preparation', individual_element: 'G1010 - Site Clearing' },
      { major_group: 'G - Building Sitework', group_element: 'G20 - Site Improvements', individual_element: 'G2010 - Roadways' },
      { major_group: 'G - Building Sitework', group_element: 'G20 - Site Improvements', individual_element: 'G2020 - Parking Lots' },
      { major_group: 'G - Building Sitework', group_element: 'G20 - Site Improvements', individual_element: 'G2030 - Pedestrian Paving' },
      { major_group: 'G - Building Sitework', group_element: 'G20 - Site Improvements', individual_element: 'G2040 - Site Development' },
      { major_group: 'G - Building Sitework', group_element: 'G20 - Site Improvements', individual_element: 'G2050 - Landscaping' },
      { major_group: 'G - Building Sitework', group_element: 'G30 - Site Civil/Mechanical Utilities', individual_element: 'G3010 - Water Supply' },
      { major_group: 'G - Building Sitework', group_element: 'G30 - Site Civil/Mechanical Utilities', individual_element: 'G3020 - Sanitary Sewer' },
      { major_group: 'G - Building Sitework', group_element: 'G30 - Site Civil/Mechanical Utilities', individual_element: 'G3030 - Storm Sewer' },
      { major_group: 'G - Building Sitework', group_element: 'G40 - Site Electrical Utilities', individual_element: 'G4010 - Electrical Distribution' },
      { major_group: 'G - Building Sitework', group_element: 'G40 - Site Electrical Utilities', individual_element: 'G4020 - Site Lighting' },
    ];

    // Insert elements
    for (const element of elements) {
      // Extract code from individual_element (e.g., "A1010" from "A1010 - Standard Foundations")
      const code = element.individual_element.split(' - ')[0];
      // Use individual_element as the name field
      const name = element.individual_element;
      
      await pool.query(
        `INSERT INTO elements (code, name, major_group, group_element, individual_element) 
         VALUES ($1, $2, $3, $4, $5)`,
        [code, name, element.major_group, element.group_element, element.individual_element]
      );
    }

    res.json({
      success: true,
      message: 'Elements seeded successfully',
      count: elements.length,
    });
  } catch (error) {
    next(error);
  }
};