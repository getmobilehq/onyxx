# Onyx Mock Data Documentation

This document contains all the mock data currently used in the Onyx application. This data will be replaced with real API calls to the backend.

## 1. Users Mock Data

### Admin User
```javascript
{
  id: '1',
  email: 'admin@onyx.com',
  name: 'Admin User',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z'
}
```

### Manager Users
```javascript
{
  id: '2',
  email: 'john.manager@onyx.com',
  name: 'John Manager',
  role: 'manager',
  created_at: '2024-01-15T00:00:00Z'
}
```

### Assessor Users
```javascript
{
  id: '3',
  email: 'sarah.assessor@onyx.com',
  name: 'Sarah Assessor',
  role: 'assessor',
  created_at: '2024-02-01T00:00:00Z'
},
{
  id: '4',
  email: 'mike.assessor@onyx.com',
  name: 'Mike Assessor',
  role: 'assessor',
  created_at: '2024-02-15T00:00:00Z'
}
```

## 2. Buildings Mock Data

### Building 1: Oak Tower Office Complex
```javascript
{
  id: '1',
  name: 'Oak Tower Office Complex',
  type: 'Office Building',
  yearBuilt: 2010,
  squareFootage: 150000,
  address: '123 Business Ave, Downtown, NY 10001',
  location: { lat: 40.7484, lng: -73.9857 },
  replacementValue: 45000000,
  currentFCI: 0.15,
  lastAssessment: '2024-01-15',
  imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
  status: 'assessed',
  assessments: [
    {
      id: 'a1',
      date: '2024-01-15',
      type: 'Comprehensive',
      fciScore: 0.15,
      totalRepairCost: 6750000,
      criticalRepairs: 2,
      assessor: 'Sarah Johnson'
    },
    {
      id: 'a2',
      date: '2023-07-20',
      type: 'Annual',
      fciScore: 0.12,
      totalRepairCost: 5400000,
      criticalRepairs: 1,
      assessor: 'Mike Chen'
    }
  ],
  maintenanceHistory: [
    {
      id: 'm1',
      date: '2024-02-01',
      type: 'HVAC System Upgrade',
      cost: 250000,
      contractor: 'ProAir Solutions',
      status: 'completed'
    },
    {
      id: 'm2',
      date: '2024-01-20',
      type: 'Roof Repair - Section B',
      cost: 85000,
      contractor: 'SkyHigh Roofing',
      status: 'completed'
    }
  ]
}
```

### Building 2: Riverside Apartments
```javascript
{
  id: '2',
  name: 'Riverside Apartments',
  type: 'Residential Complex',
  yearBuilt: 2015,
  squareFootage: 200000,
  address: '456 River Road, Riverside, CA 92501',
  location: { lat: 33.9533, lng: -117.3962 },
  replacementValue: 60000000,
  currentFCI: 0.08,
  lastAssessment: '2024-02-20',
  imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
  status: 'assessed',
  assessments: [],
  maintenanceHistory: []
}
```

### Building 3: Central Mall
```javascript
{
  id: '3',
  name: 'Central Mall',
  type: 'Retail',
  yearBuilt: 2005,
  squareFootage: 500000,
  address: '789 Shopping Blvd, Commerce City, TX 75001',
  location: { lat: 32.7767, lng: -96.7970 },
  replacementValue: 150000000,
  currentFCI: 0.22,
  lastAssessment: '2024-01-10',
  imageUrl: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6',
  status: 'assessed',
  assessments: [],
  maintenanceHistory: []
}
```

### Building 4: Tech Campus Building A
```javascript
{
  id: '4',
  name: 'Tech Campus Building A',
  type: 'Office Building',
  yearBuilt: 2018,
  squareFootage: 180000,
  address: '321 Innovation Way, Tech Valley, CA 94025',
  location: { lat: 37.3861, lng: -122.0839 },
  replacementValue: 72000000,
  currentFCI: 0.05,
  lastAssessment: '2024-03-01',
  imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
  status: 'pending',
  assessments: [],
  maintenanceHistory: []
}
```

### Building 5: Memorial Hospital - East Wing
```javascript
{
  id: '5',
  name: 'Memorial Hospital - East Wing',
  type: 'Healthcare',
  yearBuilt: 2012,
  squareFootage: 120000,
  address: '555 Health Center Dr, Medical District, IL 60601',
  location: { lat: 41.8781, lng: -87.6298 },
  replacementValue: 90000000,
  currentFCI: 0.18,
  lastAssessment: '2023-12-15',
  imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
  status: 'assessed',
  assessments: [],
  maintenanceHistory: []
}
```

### Building 6: Greenfield Elementary School
```javascript
{
  id: '6',
  name: 'Greenfield Elementary School',
  type: 'Educational',
  yearBuilt: 1998,
  squareFootage: 80000,
  address: '100 Education Lane, Greenfield, OH 43301',
  location: { lat: 39.9612, lng: -82.9988 },
  replacementValue: 32000000,
  currentFCI: 0.28,
  lastAssessment: '2024-02-28',
  imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
  status: 'assessed',
  assessments: [],
  maintenanceHistory: []
}
```

### Building 7: Northside Warehouse
```javascript
{
  id: '7',
  name: 'Northside Warehouse',
  type: 'Industrial',
  yearBuilt: 2008,
  squareFootage: 250000,
  address: '2000 Industrial Pkwy, North District, MI 48201',
  location: { lat: 42.3314, lng: -83.0458 },
  replacementValue: 50000000,
  currentFCI: 0.12,
  lastAssessment: '2024-01-25',
  imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c',
  status: 'pending',
  assessments: [],
  maintenanceHistory: []
}
```

### Building 8: City Hall
```javascript
{
  id: '8',
  name: 'City Hall',
  type: 'Government',
  yearBuilt: 1985,
  squareFootage: 100000,
  address: '1 Civic Center Plaza, Metro City, FL 33101',
  location: { lat: 25.7617, lng: -80.1918 },
  replacementValue: 40000000,
  currentFCI: 0.35,
  lastAssessment: '2023-11-30',
  imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b',
  status: 'assessed',
  assessments: [],
  maintenanceHistory: []
}
```

## 3. Assessment Elements Mock Data

### Uniformat Elements Used in Assessments
```javascript
const selectedElements = [
  {
    code: 'B2010',
    name: 'Exterior Walls',
    majorGroup: 'Shell',
    condition: 'Fair',
    repairCost: 150000,
    notes: 'Cracks visible in northeast corner'
  },
  {
    code: 'B3010',
    name: 'Roof Coverings',
    majorGroup: 'Shell',
    condition: 'Needs Attention',
    repairCost: 280000,
    notes: 'Multiple leaks detected, membrane deteriorating'
  },
  {
    code: 'D2010',
    name: 'Plumbing Fixtures',
    majorGroup: 'Services',
    condition: 'Excellent',
    repairCost: 25000,
    notes: 'Recently updated, minor adjustments needed'
  },
  {
    code: 'D3050',
    name: 'Terminal & Package Units',
    majorGroup: 'Services',
    condition: 'Fair',
    repairCost: 175000,
    notes: 'Units approaching end of life, efficiency declining'
  }
];
```

## 4. Reports Mock Data

### FCI Report Example
```javascript
{
  id: 'report-1',
  buildingId: '1',
  buildingName: 'Oak Tower Office Complex',
  reportDate: '2024-01-15',
  assessmentType: 'Comprehensive',
  
  // Financial Summary
  replacementValue: 45000000,
  totalRepairCost: 6750000,
  immediateRepairs: 2100000,
  shortTermRepairs: 2850000,
  longTermRepairs: 1800000,
  fciScore: 0.15,
  
  // Condition Summary
  overallCondition: 'Fair',
  criticalIssues: 2,
  majorIssues: 5,
  minorIssues: 12,
  
  // System Breakdown
  systemConditions: [
    { system: 'Substructure', rating: 'Good', fci: 0.05 },
    { system: 'Shell', rating: 'Fair', fci: 0.18 },
    { system: 'Interiors', rating: 'Good', fci: 0.08 },
    { system: 'Services', rating: 'Fair', fci: 0.22 },
    { system: 'Equipment', rating: 'Good', fci: 0.10 },
    { system: 'Special Construction', rating: 'Excellent', fci: 0.02 },
    { system: 'Site Work', rating: 'Fair', fci: 0.15 }
  ],
  
  // Recommendations
  recommendations: [
    {
      priority: 'Immediate',
      element: 'B3010 - Roof Coverings',
      issue: 'Multiple leaks causing interior damage',
      action: 'Replace sections 3-5 membrane',
      estimatedCost: 850000
    },
    {
      priority: 'Immediate',
      element: 'D3050 - HVAC Units',
      issue: 'Unit failure in zones 2 and 7',
      action: 'Replace failed units',
      estimatedCost: 425000
    }
  ]
}
```

## 5. Dashboard Statistics Mock Data

```javascript
const dashboardStats = {
  totalBuildings: 8,
  totalSquareFootage: 1480000,
  totalReplacementValue: 639000000,
  averageFCI: 0.16,
  
  buildingsByStatus: {
    assessed: 6,
    pending: 2,
    overdue: 0
  },
  
  buildingsByCondition: {
    excellent: 1,    // FCI < 0.05
    good: 2,         // FCI 0.05-0.10
    fair: 3,         // FCI 0.10-0.30
    poor: 2          // FCI > 0.30
  },
  
  recentAssessments: [
    { buildingName: 'Tech Campus Building A', date: '2024-03-01', fci: 0.05 },
    { buildingName: 'Greenfield Elementary School', date: '2024-02-28', fci: 0.28 },
    { buildingName: 'Riverside Apartments', date: '2024-02-20', fci: 0.08 }
  ],
  
  upcomingAssessments: [
    { buildingName: 'City Hall', dueDate: '2024-05-30', daysUntilDue: 45 },
    { buildingName: 'Memorial Hospital - East Wing', dueDate: '2024-06-15', daysUntilDue: 61 }
  ],
  
  maintenanceTrends: [
    { month: 'Jan 2024', cost: 335000, count: 12 },
    { month: 'Feb 2024', cost: 428000, count: 15 },
    { month: 'Mar 2024', cost: 289000, count: 10 }
  ]
}
```

## 6. Team Members Mock Data

```javascript
const teamMembers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@onyx.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2024-01-01',
    lastActive: '2024-03-15',
    assessmentsCompleted: 0
  },
  {
    id: '2',
    name: 'John Manager',
    email: 'john.manager@onyx.com',
    role: 'manager',
    status: 'active',
    joinedDate: '2024-01-15',
    lastActive: '2024-03-14',
    assessmentsCompleted: 0
  },
  {
    id: '3',
    name: 'Sarah Assessor',
    email: 'sarah.assessor@onyx.com',
    role: 'assessor',
    status: 'active',
    joinedDate: '2024-02-01',
    lastActive: '2024-03-15',
    assessmentsCompleted: 12
  },
  {
    id: '4',
    name: 'Mike Assessor',
    email: 'mike.assessor@onyx.com',
    role: 'assessor',
    status: 'active',
    joinedDate: '2024-02-15',
    lastActive: '2024-03-10',
    assessmentsCompleted: 8
  }
]
```

## 7. Reference Building Costs Mock Data

```javascript
const referenceCosts = {
  'Office Building': 250,
  'Residential Complex': 200,
  'Retail': 180,
  'Healthcare': 450,
  'Educational': 220,
  'Industrial': 120,
  'Government': 280,
  'Mixed Use': 230,
  'Hospitality': 300,
  'Religious': 200
}
```

## API Endpoints to Replace Mock Data

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Buildings
- `GET /api/buildings` - Get all buildings
- `GET /api/buildings/:id` - Get building by ID
- `POST /api/buildings` - Create new building
- `PUT /api/buildings/:id` - Update building
- `DELETE /api/buildings/:id` - Delete building

### Assessments
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/:id` - Get assessment by ID
- `POST /api/assessments` - Create new assessment
- `PUT /api/assessments/:id` - Update assessment

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report by ID
- `POST /api/reports/generate` - Generate new report

### Users/Team
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/invite` - Invite new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reference Data
- `GET /api/reference/building-costs` - Get reference building costs
- `GET /api/reference/elements` - Get Uniformat elements

## Next Steps

1. Create API service layer in frontend
2. Replace mock data calls with API calls
3. Add proper error handling and loading states
4. Implement token refresh logic
5. Add data caching where appropriate