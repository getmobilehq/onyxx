// Building Cost Data - Cost per Square Foot
// This data should be updated with the actual data from the Building_Cost.docx file

export interface BuildingCostData {
  buildingType: string;
  category: string;
  costPerSqFt: number;
  description?: string;
  source?: string;
  lastUpdated?: string;
}

// Building type costs organized by category
export const buildingCosts: BuildingCostData[] = [
  // Office Buildings
  {
    buildingType: 'Single-story Office',
    category: 'Office',
    costPerSqFt: 297.50,
    description: 'Single-story office building with standard finishes',
  },
  {
    buildingType: 'Mid-rise Office',
    category: 'Office',
    costPerSqFt: 605.00,
    description: 'Mid-rise office building (4-10 stories)',
  },
  {
    buildingType: 'High-rise Office',
    category: 'Office',
    costPerSqFt: 737.50,
    description: 'High-rise office building (10+ stories)',
  },
  {
    buildingType: 'High-end Executive Office',
    category: 'Office',
    costPerSqFt: 300.00,
    description: 'Premium office space with high-end finishes',
  },

  // Industrial/Warehouse
  {
    buildingType: 'Basic Warehouse',
    category: 'Industrial',
    costPerSqFt: 140.00,
    description: 'Basic warehouse structure with minimal finishes',
  },
  {
    buildingType: 'Light Industrial Warehouse',
    category: 'Industrial',
    costPerSqFt: 280.00,
    description: 'Light industrial facility with office components',
  },
  {
    buildingType: 'Manufacturing Facility',
    category: 'Industrial',
    costPerSqFt: 545.00,
    description: 'Manufacturing facility with specialized systems',
  },
  {
    buildingType: 'Laboratory Facility',
    category: 'Industrial',
    costPerSqFt: 800.00,
    description: 'Laboratory building with specialized MEP systems',
  },

  // Healthcare
  {
    buildingType: 'Medical Office Building',
    category: 'Healthcare',
    costPerSqFt: 750.50,
    description: 'Medical office building with specialized systems',
  },
  {
    buildingType: 'Specialty Clinic',
    category: 'Healthcare',
    costPerSqFt: 704.50,
    description: 'Specialty medical clinic facility',
  },
  {
    buildingType: 'Acute Care Hospital',
    category: 'Healthcare',
    costPerSqFt: 1086.50,
    description: 'Full-service hospital with all specialized systems',
  },

  // Hospitality
  {
    buildingType: 'Motel (2–3 stories)',
    category: 'Hospitality',
    costPerSqFt: 160.00,
    description: 'Basic motel facility',
  },
  {
    buildingType: '3-star Hotel',
    category: 'Hospitality',
    costPerSqFt: 559.00,
    description: 'Mid-range hotel with standard amenities',
  },
  {
    buildingType: '5-star Hotel',
    category: 'Hospitality',
    costPerSqFt: 802.50,
    description: 'Luxury hotel with premium finishes and amenities',
  },

  // Education
  {
    buildingType: 'Primary/Secondary School',
    category: 'Education',
    costPerSqFt: 362.50,
    description: 'K-12 school building',
  },
  {
    buildingType: 'University Classroom/Lab',
    category: 'Education',
    costPerSqFt: 675.00,
    description: 'University academic building with labs',
  },
  {
    buildingType: 'Dormitories',
    category: 'Education',
    costPerSqFt: 353.50,
    description: 'Student housing facility',
  },

  // Retail
  {
    buildingType: 'Neighborhood Strip Center',
    category: 'Retail',
    costPerSqFt: 409.50,
    description: 'Small retail strip center',
  },
  {
    buildingType: 'Shopping Mall',
    category: 'Retail',
    costPerSqFt: 526.00,
    description: 'Enclosed shopping mall',
  },
  {
    buildingType: 'Standalone Retail Store',
    category: 'Retail',
    costPerSqFt: 331.50,
    description: 'Single retail store building',
  },

  // Residential
  {
    buildingType: 'Standard Apartments',
    category: 'Residential',
    costPerSqFt: 295.00,
    description: 'Multi-family apartment building',
  },

  // Civic/Community
  {
    buildingType: 'Community Centers',
    category: 'Civic',
    costPerSqFt: 913.50,
    description: 'Community center with recreational facilities',
  },
  {
    buildingType: 'Museums/Performing Arts Centers',
    category: 'Civic',
    costPerSqFt: 1010.00,
    description: 'Cultural facility with specialized systems',
  },
  {
    buildingType: 'Police Stations',
    category: 'Civic',
    costPerSqFt: 580.00,
    description: 'Public safety facility',
  },

  // Parking
  {
    buildingType: 'Multi-level Garage (Basic)',
    category: 'Parking',
    costPerSqFt: 150.50,
    description: 'Basic parking garage structure',
  },
  {
    buildingType: 'Low-grade Parking Garage',
    category: 'Parking',
    costPerSqFt: 143.00,
    description: 'Economy parking garage',
  },
];

// Helper functions for working with building cost data
export const getBuildingTypesByCategory = (category: string): BuildingCostData[] => {
  return buildingCosts.filter(cost => cost.category === category);
};

export const getCostByBuildingType = (buildingType: string): number => {
  const cost = buildingCosts.find(cost => cost.buildingType === buildingType);
  return cost ? cost.costPerSqFt : 300; // Default fallback cost
};

export const getAllCategories = (): string[] => {
  return [...new Set(buildingCosts.map(cost => cost.category))];
};

export const getBuildingTypesForDropdown = (): Array<{value: string, label: string, cost: number}> => {
  return buildingCosts.map(cost => ({
    value: cost.buildingType,
    label: `${cost.buildingType} ($${cost.costPerSqFt}/sq ft)`,
    cost: cost.costPerSqFt
  }));
};

export const getCostsByCategory = (): Record<string, BuildingCostData[]> => {
  return buildingCosts.reduce((acc, cost) => {
    if (!acc[cost.category]) {
      acc[cost.category] = [];
    }
    acc[cost.category].push(cost);
    return acc;
  }, {} as Record<string, BuildingCostData[]>);
};

// Calculate replacement value
export const calculateReplacementValue = (buildingType: string, buildingSize: number): number => {
  const costPerSqFt = getCostByBuildingType(buildingType);
  return buildingSize * costPerSqFt;
};

// For backwards compatibility with existing code
export const buildingTypeCosts = buildingCosts.reduce((acc, cost) => {
  acc[cost.buildingType] = cost.costPerSqFt;
  return acc;
}, {} as Record<string, number>);

export default buildingCosts;