# Uniformat Building Element Classification System

This implementation provides a comprehensive TypeScript-based Uniformat II classification system for building elements, based on ASTM E1557 Standard Classification.

## Overview

The Uniformat system organizes building components into a hierarchical structure:
- **Major Groups** (A, B, C, D, E, F, G) - Top-level categories
- **Groups** (A10, B20, etc.) - Subcategories within major groups  
- **Elements** (A1010, B2010, etc.) - Specific building components
- **Sub-elements** (optional further breakdown)

## Files Structure

### `/src/data/uniformat-codes.ts`
Core data file containing:
- `UniformatElement` interface definition
- Complete `uniformatCodes` array with all elements
- Helper functions for working with the codes
- Tree-building utilities

### `/src/components/uniformat-selector.tsx`
React components for UI interaction:
- `UniformatSelector` - Full tree view with search
- `UniformatDropdown` - Simple dropdown selector

### `/src/components/uniformat-usage-example.tsx`
Example implementations showing:
- Building component assessment form
- Quick assessment with multiple components

## Key Features

### 1. Hierarchical Structure
```typescript
// Major Groups (7 total)
A - Substructure
B - Shell  
C - Interiors
D - Services
E - Equipment & Furnishings
F - Special Construction & Demolition
G - Building Sitework
```

### 2. Useful Life Data
Each element includes typical useful life spans:
```typescript
{
  code: 'B3010',
  name: 'Roof Coverings',
  usefulLife: 20, // years
  level: 'element'
}
```

### 3. Search and Navigation
- Search by code or name
- Hierarchical tree navigation
- Breadcrumb path display
- Expandable/collapsible structure

## Usage Examples

### Basic Element Lookup
```typescript
import { getElementByCode } from '@/data/uniformat-codes';

const element = getElementByCode('D3020');
// Returns: Heat Generating Systems
```

### Building Tree Structure
```typescript
import { buildUniformatTree } from '@/data/uniformat-codes';

const tree = buildUniformatTree();
// Returns hierarchical structure for navigation
```

### Component Integration
```tsx
import { UniformatSelector } from '@/components/uniformat-selector';

function AssessmentForm() {
  const [selectedCode, setSelectedCode] = useState('');
  
  return (
    <UniformatSelector
      value={selectedCode}
      onChange={(code, element) => {
        setSelectedCode(code);
        console.log('Selected:', element);
      }}
      showUsefulLife={true}
    />
  );
}
```

## Major Groups Breakdown

### A - Substructure
- A10: Foundations
- A20: Basement Construction

### B - Shell  
- B10: Superstructure
- B20: Exterior Enclosure
- B30: Roofing

### C - Interiors
- C10: Interior Construction
- C20: Stairs
- C30: Interior Finishes

### D - Services
- D10: Conveying
- D20: Plumbing
- D30: HVAC
- D40: Fire Protection
- D50: Electrical

### E - Equipment & Furnishings
- E10: Equipment
- E20: Furnishings

### F - Special Construction & Demolition
- F10: Special Construction
- F20: Selective Building Demolition

### G - Building Sitework
- G10: Site Preparation
- G20: Site Improvements
- G30: Site Mechanical Utilities
- G40: Site Electrical Utilities
- G90: Other Site Construction

## Typical Useful Life Ranges

| Component Type | Useful Life (Years) |
|---|---|
| Structural Elements | 75 |
| Building Envelope | 20-50 |
| Interior Finishes | 15-20 |
| HVAC Systems | 15-30 |
| Electrical Systems | 15-30 |
| Plumbing Systems | 20-30 |
| Site Work | 15-40 |

## Integration with Assessment Forms

The Uniformat system integrates seamlessly with building assessment workflows:

1. **Component Selection**: Use the selector to choose building elements
2. **Condition Assessment**: Rate condition (Excellent/Good/Fair/Poor/Critical)
3. **Cost Estimation**: Leverage useful life data for replacement planning
4. **Reporting**: Generate structured reports using hierarchical codes

## Best Practices

1. **Always use the full code hierarchy** for proper classification
2. **Include useful life data** in cost projections
3. **Use search functionality** for quick element location
4. **Maintain consistency** in code usage across assessments
5. **Document custom sub-elements** if extending the system

## Customization

To extend the system:

1. Add new elements to the `uniformatCodes` array
2. Follow the hierarchical naming convention
3. Include appropriate useful life data
4. Update parent-child relationships
5. Test with the tree navigation components

This implementation provides a robust foundation for building assessment applications with standardized element classification.