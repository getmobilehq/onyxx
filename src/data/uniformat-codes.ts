// Uniformat Building Element Codes based on ASTM E1557
// This data structure should be updated with the actual data from the Excel file

export interface UniformatElement {
  id: string;
  name: string;
  description?: string;
  usefulLife: number; // in years
  category: string;
  group: string;
  majorGroup: string;
}

export interface UniformatGroup {
  id: string;
  name: string;
  description?: string;
  elements: UniformatElement[];
}

export interface UniformatMajorGroup {
  id: string;
  name: string;
  description?: string;
  groups: UniformatGroup[];
}

// Complete Uniformat classification structure
export const uniformatData: UniformatMajorGroup[] = [
  {
    id: 'A',
    name: 'A - SUBSTRUCTURE',
    description: 'Elements below ground level and structural elements that primarily support the building',
    groups: [
      {
        id: 'A10',
        name: 'A10 Foundations',
        description: 'Elements that transfer building loads to the earth',
        elements: [
          {
            id: 'A1010',
            name: 'Standard Foundations',
            description: 'Spread footings, strip footings, combined footings',
            usefulLife: 75,
            category: 'Foundations',
            group: 'A10 Foundations',
            majorGroup: 'A - SUBSTRUCTURE'
          },
          {
            id: 'A1020',
            name: 'Special Foundations',
            description: 'Pile caps, caissons, underpinning',
            usefulLife: 75,
            category: 'Foundations',
            group: 'A10 Foundations',
            majorGroup: 'A - SUBSTRUCTURE'
          },
          {
            id: 'A1030',
            name: 'Slab on Grade',
            description: 'Ground supported slabs, vapor barriers',
            usefulLife: 50,
            category: 'Foundations',
            group: 'A10 Foundations',
            majorGroup: 'A - SUBSTRUCTURE'
          }
        ]
      },
      {
        id: 'A20',
        name: 'A20 Basement Construction',
        description: 'Below grade construction elements',
        elements: [
          {
            id: 'A2010',
            name: 'Basement Excavation',
            description: 'Earth support, excavation',
            usefulLife: 100,
            category: 'Basement Construction',
            group: 'A20 Basement Construction',
            majorGroup: 'A - SUBSTRUCTURE'
          },
          {
            id: 'A2020',
            name: 'Basement Walls',
            description: 'Foundation walls, retaining walls',
            usefulLife: 75,
            category: 'Basement Construction',
            group: 'A20 Basement Construction',
            majorGroup: 'A - SUBSTRUCTURE'
          }
        ]
      }
    ]
  },
  {
    id: 'B',
    name: 'B - SHELL',
    description: 'Structural and enclosure elements',
    groups: [
      {
        id: 'B10',
        name: 'B10 Superstructure',
        description: 'Structural elements above foundation',
        elements: [
          {
            id: 'B1010',
            name: 'Floor Construction',
            description: 'Floor framing, decking, structural slabs',
            usefulLife: 75,
            category: 'Superstructure',
            group: 'B10 Superstructure',
            majorGroup: 'B - SHELL'
          },
          {
            id: 'B1020',
            name: 'Roof Construction',
            description: 'Roof framing, decking, structural roof slabs',
            usefulLife: 50,
            category: 'Superstructure',
            group: 'B10 Superstructure',
            majorGroup: 'B - SHELL'
          }
        ]
      },
      {
        id: 'B20',
        name: 'B20 Exterior Enclosure',
        description: 'Elements that separate interior from exterior environment',
        elements: [
          {
            id: 'B2010',
            name: 'Exterior Walls',
            description: 'Exterior wall construction, curtain walls, storefronts',
            usefulLife: 50,
            category: 'Exterior Enclosure',
            group: 'B20 Exterior Enclosure',
            majorGroup: 'B - SHELL'
          },
          {
            id: 'B2020',
            name: 'Exterior Windows',
            description: 'Windows, glazed doors, window hardware',
            usefulLife: 30,
            category: 'Exterior Enclosure',
            group: 'B20 Exterior Enclosure',
            majorGroup: 'B - SHELL'
          },
          {
            id: 'B2030',
            name: 'Exterior Doors',
            description: 'Exterior doors, overhead doors, entrance doors',
            usefulLife: 25,
            category: 'Exterior Enclosure',
            group: 'B20 Exterior Enclosure',
            majorGroup: 'B - SHELL'
          }
        ]
      },
      {
        id: 'B30',
        name: 'B30 Roofing',
        description: 'Roof system elements',
        elements: [
          {
            id: 'B3010',
            name: 'Roof Coverings',
            description: 'Membrane roofing, shingles, tiles',
            usefulLife: 20,
            category: 'Roofing',
            group: 'B30 Roofing',
            majorGroup: 'B - SHELL'
          },
          {
            id: 'B3020',
            name: 'Roof Openings',
            description: 'Skylights, roof hatches, smoke vents',
            usefulLife: 25,
            category: 'Roofing',
            group: 'B30 Roofing',
            majorGroup: 'B - SHELL'
          }
        ]
      }
    ]
  },
  {
    id: 'C',
    name: 'C - INTERIORS',
    description: 'Interior construction and finishing elements',
    groups: [
      {
        id: 'C10',
        name: 'C10 Interior Construction',
        description: 'Interior construction elements',
        elements: [
          {
            id: 'C1010',
            name: 'Partitions',
            description: 'Fixed partitions, demountable partitions',
            usefulLife: 30,
            category: 'Interior Construction',
            group: 'C10 Interior Construction',
            majorGroup: 'C - INTERIORS'
          },
          {
            id: 'C1020',
            name: 'Interior Doors',
            description: 'Interior doors, door frames, hardware',
            usefulLife: 30,
            category: 'Interior Construction',
            group: 'C10 Interior Construction',
            majorGroup: 'C - INTERIORS'
          },
          {
            id: 'C1030',
            name: 'Fittings',
            description: 'Fixed casework, built-in furniture',
            usefulLife: 20,
            category: 'Interior Construction',
            group: 'C10 Interior Construction',
            majorGroup: 'C - INTERIORS'
          }
        ]
      },
      {
        id: 'C20',
        name: 'C20 Stairs',
        description: 'Stair construction and finishes',
        elements: [
          {
            id: 'C2010',
            name: 'Stair Construction',
            description: 'Stair structure, stair railings',
            usefulLife: 50,
            category: 'Stairs',
            group: 'C20 Stairs',
            majorGroup: 'C - INTERIORS'
          },
          {
            id: 'C2020',
            name: 'Stair Finishes',
            description: 'Stair treads, risers, handrails',
            usefulLife: 15,
            category: 'Stairs',
            group: 'C20 Stairs',
            majorGroup: 'C - INTERIORS'
          }
        ]
      },
      {
        id: 'C30',
        name: 'C30 Interior Finishes',
        description: 'Interior finish materials',
        elements: [
          {
            id: 'C3010',
            name: 'Wall Finishes',
            description: 'Paint, wallpaper, wall coverings, tile',
            usefulLife: 15,
            category: 'Interior Finishes',
            group: 'C30 Interior Finishes',
            majorGroup: 'C - INTERIORS'
          },
          {
            id: 'C3020',
            name: 'Floor Finishes',
            description: 'Carpet, resilient flooring, tile, wood flooring',
            usefulLife: 15,
            category: 'Interior Finishes',
            group: 'C30 Interior Finishes',
            majorGroup: 'C - INTERIORS'
          },
          {
            id: 'C3030',
            name: 'Ceiling Finishes',
            description: 'Suspended ceilings, ceiling finishes',
            usefulLife: 20,
            category: 'Interior Finishes',
            group: 'C30 Interior Finishes',
            majorGroup: 'C - INTERIORS'
          }
        ]
      }
    ]
  },
  {
    id: 'D',
    name: 'D - SERVICES',
    description: 'Mechanical, electrical, and other building service systems',
    groups: [
      {
        id: 'D10',
        name: 'D10 Conveying',
        description: 'Vertical and horizontal transportation systems',
        elements: [
          {
            id: 'D1010',
            name: 'Elevators & Lifts',
            description: 'Passenger elevators, freight elevators, lifts',
            usefulLife: 25,
            category: 'Conveying',
            group: 'D10 Conveying',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D1020',
            name: 'Escalators & Moving Walks',
            description: 'Escalators, moving walkways',
            usefulLife: 20,
            category: 'Conveying',
            group: 'D10 Conveying',
            majorGroup: 'D - SERVICES'
          }
        ]
      },
      {
        id: 'D20',
        name: 'D20 Plumbing',
        description: 'Plumbing systems',
        elements: [
          {
            id: 'D2010',
            name: 'Plumbing Fixtures',
            description: 'Fixtures, faucets, accessories',
            usefulLife: 25,
            category: 'Plumbing',
            group: 'D20 Plumbing',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D2020',
            name: 'Domestic Water Distribution',
            description: 'Hot and cold water systems, piping',
            usefulLife: 40,
            category: 'Plumbing',
            group: 'D20 Plumbing',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D2030',
            name: 'Sanitary Waste',
            description: 'Waste and vent systems, floor drains',
            usefulLife: 50,
            category: 'Plumbing',
            group: 'D20 Plumbing',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D2040',
            name: 'Rain Water Drainage',
            description: 'Roof drains, downspouts, gutters',
            usefulLife: 30,
            category: 'Plumbing',
            group: 'D20 Plumbing',
            majorGroup: 'D - SERVICES'
          }
        ]
      },
      {
        id: 'D30',
        name: 'D30 HVAC',
        description: 'Heating, ventilating, and air conditioning systems',
        elements: [
          {
            id: 'D3010',
            name: 'Energy Supply',
            description: 'Boilers, furnaces, heat pumps',
            usefulLife: 25,
            category: 'HVAC',
            group: 'D30 HVAC',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D3020',
            name: 'Heat Generating Systems',
            description: 'Heating equipment, heat exchangers',
            usefulLife: 25,
            category: 'HVAC',
            group: 'D30 HVAC',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D3030',
            name: 'Cooling Generating Systems',
            description: 'Chillers, cooling towers, condensers',
            usefulLife: 20,
            category: 'HVAC',
            group: 'D30 HVAC',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D3040',
            name: 'Distribution Systems',
            description: 'Ductwork, piping, terminals, controls',
            usefulLife: 30,
            category: 'HVAC',
            group: 'D30 HVAC',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D3050',
            name: 'Terminal & Package Units',
            description: 'Unit heaters, fan coil units, VAV boxes',
            usefulLife: 20,
            category: 'HVAC',
            group: 'D30 HVAC',
            majorGroup: 'D - SERVICES'
          }
        ]
      },
      {
        id: 'D40',
        name: 'D40 Fire Protection',
        description: 'Fire protection and life safety systems',
        elements: [
          {
            id: 'D4010',
            name: 'Sprinklers',
            description: 'Automatic sprinkler systems, dry systems',
            usefulLife: 30,
            category: 'Fire Protection',
            group: 'D40 Fire Protection',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D4020',
            name: 'Standpipes',
            description: 'Standpipe systems, fire hose cabinets',
            usefulLife: 50,
            category: 'Fire Protection',
            group: 'D40 Fire Protection',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D4030',
            name: 'Fire Protection Specialties',
            description: 'Fire extinguishers, fire pumps, alarm systems',
            usefulLife: 25,
            category: 'Fire Protection',
            group: 'D40 Fire Protection',
            majorGroup: 'D - SERVICES'
          }
        ]
      },
      {
        id: 'D50',
        name: 'D50 Electrical',
        description: 'Electrical power and lighting systems',
        elements: [
          {
            id: 'D5010',
            name: 'Electrical Service/Distribution',
            description: 'Service entrance, panels, transformers',
            usefulLife: 30,
            category: 'Electrical',
            group: 'D50 Electrical',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D5020',
            name: 'Lighting and Branch Wiring',
            description: 'Fixtures, lamps, switches, receptacles',
            usefulLife: 20,
            category: 'Electrical',
            group: 'D50 Electrical',
            majorGroup: 'D - SERVICES'
          },
          {
            id: 'D5030',
            name: 'Communications and Security',
            description: 'Telephone, data, security, fire alarm',
            usefulLife: 15,
            category: 'Electrical',
            group: 'D50 Electrical',
            majorGroup: 'D - SERVICES'
          }
        ]
      }
    ]
  },
  {
    id: 'E',
    name: 'E - EQUIPMENT & FURNISHINGS',
    description: 'Equipment and furnishing elements',
    groups: [
      {
        id: 'E10',
        name: 'E10 Equipment',
        description: 'Built-in equipment and appliances',
        elements: [
          {
            id: 'E1010',
            name: 'Commercial Equipment',
            description: 'Kitchen equipment, laundry equipment',
            usefulLife: 15,
            category: 'Equipment',
            group: 'E10 Equipment',
            majorGroup: 'E - EQUIPMENT & FURNISHINGS'
          },
          {
            id: 'E1020',
            name: 'Institutional Equipment',
            description: 'Medical equipment, laboratory equipment',
            usefulLife: 20,
            category: 'Equipment',
            group: 'E10 Equipment',
            majorGroup: 'E - EQUIPMENT & FURNISHINGS'
          },
          {
            id: 'E1030',
            name: 'Vehicular Equipment',
            description: 'Loading dock equipment, parking equipment',
            usefulLife: 15,
            category: 'Equipment',
            group: 'E10 Equipment',
            majorGroup: 'E - EQUIPMENT & FURNISHINGS'
          }
        ]
      },
      {
        id: 'E20',
        name: 'E20 Furnishings',
        description: 'Fixed and movable furnishings',
        elements: [
          {
            id: 'E2010',
            name: 'Fixed Furnishings',
            description: 'Fixed seating, window treatments',
            usefulLife: 20,
            category: 'Furnishings',
            group: 'E20 Furnishings',
            majorGroup: 'E - EQUIPMENT & FURNISHINGS'
          },
          {
            id: 'E2020',
            name: 'Movable Furnishings',
            description: 'Furniture, artwork, plants',
            usefulLife: 10,
            category: 'Furnishings',
            group: 'E20 Furnishings',
            majorGroup: 'E - EQUIPMENT & FURNISHINGS'
          }
        ]
      }
    ]
  },
  {
    id: 'F',
    name: 'F - SPECIAL CONSTRUCTION & DEMOLITION',
    description: 'Special construction systems and demolition',
    groups: [
      {
        id: 'F10',
        name: 'F10 Special Construction',
        description: 'Specialized building systems',
        elements: [
          {
            id: 'F1010',
            name: 'Special Structures',
            description: 'Pre-engineered structures, tension structures',
            usefulLife: 30,
            category: 'Special Construction',
            group: 'F10 Special Construction',
            majorGroup: 'F - SPECIAL CONSTRUCTION & DEMOLITION'
          },
          {
            id: 'F1020',
            name: 'Integrated Construction',
            description: 'Clean rooms, swimming pools',
            usefulLife: 25,
            category: 'Special Construction',
            group: 'F10 Special Construction',
            majorGroup: 'F - SPECIAL CONSTRUCTION & DEMOLITION'
          }
        ]
      },
      {
        id: 'F20',
        name: 'F20 Selective Building Demolition',
        description: 'Demolition and removal of building elements',
        elements: [
          {
            id: 'F2010',
            name: 'Building Elements Demolition',
            description: 'Selective demolition of building components',
            usefulLife: 0,
            category: 'Demolition',
            group: 'F20 Selective Building Demolition',
            majorGroup: 'F - SPECIAL CONSTRUCTION & DEMOLITION'
          }
        ]
      }
    ]
  },
  {
    id: 'G',
    name: 'G - BUILDING SITEWORK',
    description: 'Site preparation and site improvements',
    groups: [
      {
        id: 'G10',
        name: 'G10 Site Preparation',
        description: 'Site clearing and earthwork',
        elements: [
          {
            id: 'G1010',
            name: 'Site Clearing',
            description: 'Tree removal, demolition, clearing',
            usefulLife: 100,
            category: 'Site Preparation',
            group: 'G10 Site Preparation',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G1020',
            name: 'Site Earthwork',
            description: 'Excavation, grading, compaction',
            usefulLife: 100,
            category: 'Site Preparation',
            group: 'G10 Site Preparation',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G1030',
            name: 'Site Drainage',
            description: 'Dewatering, drainage systems',
            usefulLife: 50,
            category: 'Site Preparation',
            group: 'G10 Site Preparation',
            majorGroup: 'G - BUILDING SITEWORK'
          }
        ]
      },
      {
        id: 'G20',
        name: 'G20 Site Improvements',
        description: 'Paving, landscaping, and site amenities',
        elements: [
          {
            id: 'G2010',
            name: 'Roadways',
            description: 'Paved roads, curbs, traffic control',
            usefulLife: 25,
            category: 'Site Improvements',
            group: 'G20 Site Improvements',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G2020',
            name: 'Parking Lots',
            description: 'Parking surfaces, striping, bumpers',
            usefulLife: 20,
            category: 'Site Improvements',
            group: 'G20 Site Improvements',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G2030',
            name: 'Pedestrian Paving',
            description: 'Sidewalks, plazas, walkways',
            usefulLife: 20,
            category: 'Site Improvements',
            group: 'G20 Site Improvements',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G2040',
            name: 'Site Development',
            description: 'Fencing, retaining walls, signs',
            usefulLife: 20,
            category: 'Site Improvements',
            group: 'G20 Site Improvements',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G2050',
            name: 'Landscaping',
            description: 'Planting, irrigation, lawn areas',
            usefulLife: 15,
            category: 'Site Improvements',
            group: 'G20 Site Improvements',
            majorGroup: 'G - BUILDING SITEWORK'
          }
        ]
      },
      {
        id: 'G30',
        name: 'G30 Site Mechanical Utilities',
        description: 'Site mechanical utility systems',
        elements: [
          {
            id: 'G3010',
            name: 'Water Supply',
            description: 'Water mains, meters, hydrants',
            usefulLife: 50,
            category: 'Site Mechanical Utilities',
            group: 'G30 Site Mechanical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G3020',
            name: 'Sanitary Sewer',
            description: 'Sewer mains, manholes, lift stations',
            usefulLife: 50,
            category: 'Site Mechanical Utilities',
            group: 'G30 Site Mechanical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G3030',
            name: 'Storm Sewer',
            description: 'Storm drains, catch basins, culverts',
            usefulLife: 50,
            category: 'Site Mechanical Utilities',
            group: 'G30 Site Mechanical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G3040',
            name: 'Heating Distribution',
            description: 'Steam/hot water distribution, manholes',
            usefulLife: 40,
            category: 'Site Mechanical Utilities',
            group: 'G30 Site Mechanical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G3050',
            name: 'Cooling Distribution',
            description: 'Chilled water distribution systems',
            usefulLife: 40,
            category: 'Site Mechanical Utilities',
            group: 'G30 Site Mechanical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G3060',
            name: 'Fuel Distribution',
            description: 'Gas distribution, fuel oil systems',
            usefulLife: 40,
            category: 'Site Mechanical Utilities',
            group: 'G30 Site Mechanical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          }
        ]
      },
      {
        id: 'G40',
        name: 'G40 Site Electrical Utilities',
        description: 'Site electrical utility systems',
        elements: [
          {
            id: 'G4010',
            name: 'Electrical Distribution',
            description: 'Site electrical distribution, transformers',
            usefulLife: 30,
            category: 'Site Electrical Utilities',
            group: 'G40 Site Electrical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G4020',
            name: 'Site Lighting',
            description: 'Exterior lighting, poles, controls',
            usefulLife: 20,
            category: 'Site Electrical Utilities',
            group: 'G40 Site Electrical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          },
          {
            id: 'G4030',
            name: 'Site Communications & Security',
            description: 'Site telephone, data, security systems',
            usefulLife: 15,
            category: 'Site Electrical Utilities',
            group: 'G40 Site Electrical Utilities',
            majorGroup: 'G - BUILDING SITEWORK'
          }
        ]
      }
    ]
  }
];

// Helper functions for working with Uniformat data
export const getAllElements = (): UniformatElement[] => {
  return uniformatData.flatMap(majorGroup => 
    majorGroup.groups.flatMap(group => group.elements)
  );
};

export const findElementById = (id: string): UniformatElement | undefined => {
  return getAllElements().find(element => element.id === id);
};

export const findElementsByGroup = (groupId: string): UniformatElement[] => {
  for (const majorGroup of uniformatData) {
    for (const group of majorGroup.groups) {
      if (group.id === groupId) {
        return group.elements;
      }
    }
  }
  return [];
};

export const findElementsByMajorGroup = (majorGroupId: string): UniformatElement[] => {
  const majorGroup = uniformatData.find(mg => mg.id === majorGroupId);
  return majorGroup ? majorGroup.groups.flatMap(group => group.elements) : [];
};

export const searchElements = (query: string): UniformatElement[] => {
  const lowercaseQuery = query.toLowerCase();
  return getAllElements().filter(element =>
    element.id.toLowerCase().includes(lowercaseQuery) ||
    element.name.toLowerCase().includes(lowercaseQuery) ||
    element.description?.toLowerCase().includes(lowercaseQuery)
  );
};

export const getElementsByUsefulLife = (minLife: number, maxLife?: number): UniformatElement[] => {
  return getAllElements().filter(element => {
    if (maxLife) {
      return element.usefulLife >= minLife && element.usefulLife <= maxLife;
    }
    return element.usefulLife >= minLife;
  });
};

// Export for use in React components
export default uniformatData;