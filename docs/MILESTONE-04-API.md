# Milestone 4: API Endpoints & Authentication

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
**Part of:** The Onyx Bible - Complete Platform Documentation

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Authentication APIs](#authentication-apis)
4. [User Management APIs](#user-management-apis)
5. [Organization APIs](#organization-apis)
6. [Building APIs](#building-apis)
7. [Element APIs](#element-apis)
8. [Assessment APIs](#assessment-apis)
9. [Pre-Assessment APIs](#pre-assessment-apis)
10. [Report APIs](#report-apis)
11. [Analytics APIs](#analytics-apis)
12. [Error Handling](#error-handling)

---

## API Overview

### Base URLs
- **Production:** `https://manage.onyxreport.com/api`
- **Local Development:** `http://localhost:5001/api`

### API Design Principles
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON**: All requests/responses use JSON format
- **Stateless**: No server-side session storage
- **Token-Based Auth**: JWT bearer tokens
- **Versioned**: Currently v1 (implicit)

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET, PUT requests
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Authentication & Authorization

### JWT Token System

**Access Token:**
- Duration: 1 hour
- Storage: localStorage
- Header: `Authorization: Bearer <token>`
- Payload: `{ id, email, role, organization_id, name }`

**Refresh Token:**
- Duration: 7 days
- Storage: localStorage
- Used to obtain new access tokens
- Rotated on each refresh

### Authentication Flow

```
1. POST /api/auth/login
   { email, password }

2. Server Response
   { user, accessToken, refreshToken }

3. Store tokens in localStorage

4. Include token in subsequent requests
   Authorization: Bearer <accessToken>

5. On 401 error, use refresh token
   POST /api/auth/refresh
   { refreshToken }

6. Receive new tokens
   { accessToken, refreshToken }
```

### Authorization Roles

| Role | Permissions |
|------|------------|
| **admin** | Full access to all organization resources |
| **manager** | Create/edit buildings and assessments |
| **assessor** | Conduct assessments, view buildings |
| **platform_admin** | Super admin, cross-organization access |

### Rate Limiting

**Authentication Endpoints:**
- 5 requests per 15 minutes per IP
- Endpoints: `/auth/login`, `/auth/register`

**API Endpoints:**
- 100 requests per 15 minutes per IP
- All other endpoints

---

## Authentication APIs

### POST /api/auth/register
**Create new user account**

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "manager",
  "organizationName": "Acme Facilities"
}
```

**Validation:**
- `email`: Valid email format
- `password`: Minimum 6 characters
- `name`: Minimum 2 characters
- `role`: One of [admin, manager, assessor]
- `organizationName`: Required (new in MVP)

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "manager",
      "organization_id": "uuid",
      "organization_name": "Acme Facilities"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

---

### POST /api/auth/login
**Authenticate user and receive tokens**

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "organization_id": "uuid",
      "is_platform_admin": false
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `429`: Too many login attempts

---

### POST /api/auth/refresh
**Get new access token using refresh token**

**Authentication:** None (uses refresh token)

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

---

### GET /api/auth/me
**Get current authenticated user**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "organization_id": "uuid",
      "organization_name": "Acme Facilities",
      "created_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

## User Management APIs

### GET /api/users
**Get all users in organization**

**Authentication:** Required (admin or manager)

**Query Parameters:**
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "manager",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/users/:id
**Get user by ID**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "manager",
      "organization_id": "uuid",
      "created_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

### PUT /api/users/:id
**Update user**

**Authentication:** Required (admin)

**Request Body:**
```json
{
  "name": "Jane Doe",
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { "user": { /* updated user */ } }
}
```

---

### PUT /api/users/profile
**Update own profile**

**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Name",
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**Validation:**
- `newPassword`: Minimum 8 characters (if changing password)
- `currentPassword`: Required if changing password

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### DELETE /api/users/:id
**Delete user**

**Authentication:** Required (admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### POST /api/users/invite
**Invite new user to organization**

**Authentication:** Required (admin or manager)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "assessor"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User invited successfully",
  "data": {
    "user": { /* user details */ },
    "inviteToken": "uuid"
  }
}
```

---

## Organization APIs

### GET /api/organizations/current
**Get current user's organization**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "uuid",
      "name": "Acme Facilities",
      "subscription_tier": "professional",
      "subscription_status": "active",
      "max_users": 50,
      "max_buildings": 100,
      "created_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

### GET /api/organizations
**Get all organizations (platform admin only)**

**Authentication:** Required (platform admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "uuid",
        "name": "Acme Facilities",
        "subscription_tier": "professional",
        "subscription_status": "active",
        "user_count": 12,
        "building_count": 45
      }
    ]
  }
}
```

---

### GET /api/organizations/:id
**Get organization by ID**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organization": { /* organization details */ }
  }
}
```

---

### POST /api/organizations
**Create new organization**

**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Organization",
  "subscription_tier": "professional"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "organization": { /* organization details */ }
  }
}
```

---

## Building APIs

### GET /api/buildings
**Get all buildings in organization**

**Authentication:** Required

**Query Parameters:**
- `type` (optional): Filter by building type
- `search` (optional): Search by name
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "buildings": [
      {
        "id": "uuid",
        "name": "Main Office Building",
        "type": "Office",
        "year_built": 2010,
        "square_footage": 50000,
        "replacement_value": 12500000.00,
        "street_address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "image_url": "https://cloudinary.com/...",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### GET /api/buildings/:id
**Get building by ID**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "building": {
      "id": "uuid",
      "name": "Main Office Building",
      "type": "Office",
      "year_built": 2010,
      "square_footage": 50000,
      "replacement_value": 12500000.00,
      "cost_per_sqft": 250.00,
      "street_address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "description": "Primary headquarters building",
      "image_url": "https://cloudinary.com/...",
      "assessments": [
        {
          "id": "uuid",
          "assessment_date": "2025-06-15T00:00:00Z",
          "fci": 0.25,
          "status": "completed"
        }
      ]
    }
  }
}
```

---

### POST /api/buildings
**Create new building**

**Authentication:** Required (admin or manager)

**Request Body:**
```json
{
  "name": "New Building",
  "type": "Office",
  "year_built": 2015,
  "square_footage": 30000,
  "cost_per_sqft": 250.00,
  "street_address": "456 Oak Ave",
  "city": "Boston",
  "state": "MA",
  "zip_code": "02101",
  "description": "Branch office"
}
```

**Validation:**
- `name`: Minimum 2 characters, required
- `type`: Required
- `year_built`: 1800 to current year + 5
- `square_footage`: Positive integer
- `zip_code`: Format 12345 or 12345-6789

**Response (201):**
```json
{
  "success": true,
  "message": "Building created successfully",
  "data": {
    "building": { /* building details */ }
  }
}
```

---

### PUT /api/buildings/:id
**Update building**

**Authentication:** Required (admin or manager)

**Request Body:** (same as POST, all fields optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Building updated successfully",
  "data": {
    "building": { /* updated building */ }
  }
}
```

---

### DELETE /api/buildings/:id
**Delete building**

**Authentication:** Required (admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "Building deleted successfully"
}
```

---

### POST /api/buildings/upload-image
**Upload building image**

**Authentication:** Required (admin or manager)

**Request:** Multipart form data
- `image`: Image file (JPEG, PNG, max 10MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg"
  }
}
```

---

## Element APIs

### GET /api/elements
**Get all Uniformat II elements**

**Authentication:** Required

**Query Parameters:**
- `category` (optional): Filter by category (A, B, C, D, E, F, G)
- `search` (optional): Search by name or code

**Response (200):**
```json
{
  "success": true,
  "data": {
    "elements": [
      {
        "id": "uuid",
        "code": "B2010",
        "name": "Exterior Walls",
        "category": "B - Shell",
        "description": "Exterior wall systems including cladding",
        "typical_lifespan_years": 50
      },
      {
        "id": "uuid",
        "code": "B3010",
        "name": "Roof Coverings",
        "category": "B - Shell",
        "description": "Roof covering systems",
        "typical_lifespan_years": 25
      }
    ]
  }
}
```

---

### GET /api/elements/:id
**Get element by ID**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "element": {
      "id": "uuid",
      "code": "B2010",
      "name": "Exterior Walls",
      "category": "B - Shell",
      "description": "Exterior wall systems including cladding, structure, insulation, and finishes",
      "typical_lifespan_years": 50
    }
  }
}
```

---

### POST /api/elements/seed
**Seed database with standard Uniformat II elements**

**Authentication:** Required (admin only)

**Response (201):**
```json
{
  "success": true,
  "message": "Elements seeded successfully",
  "data": {
    "count": 64
  }
}
```

---

## Assessment APIs

### GET /api/assessments
**Get all assessments for organization**

**Authentication:** Required

**Query Parameters:**
- `building_id` (optional): Filter by building
- `status` (optional): Filter by status (pending/in_progress/completed)
- `assigned_to` (optional): Filter by assigned user

**Response (200):**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": "uuid",
        "building_id": "uuid",
        "building_name": "Main Office",
        "assessment_type": "comprehensive",
        "status": "completed",
        "fci": 0.25,
        "total_repair_cost": 150000.00,
        "replacement_value": 600000.00,
        "assessment_date": "2025-06-15T00:00:00Z",
        "assigned_to": "John Doe",
        "created_at": "2025-06-01T00:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/assessments/:id
**Get assessment by ID with full details**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "uuid",
      "building_id": "uuid",
      "building": { /* building details */ },
      "assessment_type": "comprehensive",
      "status": "completed",
      "fci": 0.25,
      "total_repair_cost": 150000.00,
      "replacement_value": 600000.00,
      "assessment_date": "2025-06-15T00:00:00Z",
      "notes": "Annual facility assessment",
      "assigned_to_user_id": "uuid",
      "assigned_to": { /* user details */ },
      "elements": [
        {
          "id": "uuid",
          "element_id": "uuid",
          "element_name": "Exterior Walls",
          "condition_rating": 4,
          "repair_cost": 25000.00,
          "notes": "Minor cracks in northwest corner"
        }
      ]
    }
  }
}
```

---

### POST /api/assessments
**Create new assessment**

**Authentication:** Required

**Request Body:**
```json
{
  "building_id": "uuid",
  "assessment_type": "comprehensive",
  "assigned_to_user_id": "uuid",
  "notes": "Annual assessment"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "assessment": {
      "id": "uuid",
      "building_id": "uuid",
      "status": "pending",
      "created_at": "2025-06-01T00:00:00Z"
    }
  }
}
```

---

### PUT /api/assessments/:id
**Update assessment**

**Authentication:** Required

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Assessment in progress"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment updated successfully"
}
```

---

### DELETE /api/assessments/:id
**Delete assessment**

**Authentication:** Required (admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment deleted successfully"
}
```

---

### GET /api/assessments/:id/elements
**Get elements for assessment**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "elements": [
      {
        "id": "uuid",
        "element_id": "uuid",
        "element_code": "B2010",
        "element_name": "Exterior Walls",
        "condition_rating": 4,
        "repair_cost": 25000.00,
        "replacement_cost": 500000.00,
        "priority": "medium",
        "notes": "Minor maintenance needed",
        "photos": ["https://cloudinary.com/..."]
      }
    ]
  }
}
```

---

### POST /api/assessments/:id/elements
**Save assessment elements (bulk)**

**Authentication:** Required

**Request Body:**
```json
{
  "elements": [
    {
      "element_id": "uuid",
      "condition_rating": 4,
      "repair_cost": 25000.00,
      "notes": "Minor issues"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Elements saved successfully"
}
```

---

### PUT /api/assessments/:assessmentId/elements/:elementId
**Update specific assessment element**

**Authentication:** Required

**Request Body:**
```json
{
  "condition_rating": 3,
  "repair_cost": 30000.00,
  "notes": "Updated assessment findings",
  "photos": ["url1", "url2"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Element updated successfully"
}
```

---

### GET /api/assessments/:id/calculate-fci
**Calculate FCI for assessment**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fci": 0.25,
    "total_repair_cost": 150000.00,
    "replacement_value": 600000.00,
    "condition_category": "Good"
  }
}
```

---

### POST /api/assessments/:id/complete
**Mark assessment as complete**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment completed successfully",
  "data": {
    "assessment": {
      "id": "uuid",
      "status": "completed",
      "fci": 0.25,
      "completed_at": "2025-06-15T00:00:00Z"
    }
  }
}
```

---

### POST /api/assessments/:id/generate-report
**Generate PDF report for assessment**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "report": {
      "id": "uuid",
      "assessment_id": "uuid",
      "file_url": "https://cloudinary.com/report.pdf",
      "generated_at": "2025-06-15T00:00:00Z"
    }
  }
}
```

---

## Pre-Assessment APIs

### GET /api/pre-assessments
**Get all pre-assessments**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "preAssessments": [
      {
        "id": "uuid",
        "assessment_id": "uuid",
        "building_id": "uuid",
        "selected_elements": ["uuid1", "uuid2"],
        "checklist_completed": true,
        "created_at": "2025-06-01T00:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/pre-assessments/assessment/:assessmentId
**Get pre-assessment by assessment ID**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "preAssessment": {
      "id": "uuid",
      "assessment_id": "uuid",
      "building_id": "uuid",
      "assessment_type": "Annual",
      "assessment_date": "2025-06-15",
      "assessment_scope": "comprehensive",
      "building_size": 50000,
      "replacement_value": 12500000.00,
      "selected_elements": ["uuid1", "uuid2"],
      "checklist": {
        "safety_equipment": true,
        "building_access": true,
        "documentation": true
      },
      "notes": "Pre-assessment notes"
    }
  }
}
```

---

### POST /api/pre-assessments
**Create or update pre-assessment**

**Authentication:** Required

**Request Body:**
```json
{
  "assessment_id": "uuid",
  "building_id": "uuid",
  "assessment_type": "Annual",
  "assessment_date": "2025-06-15",
  "assessment_scope": "comprehensive",
  "building_size": 50000,
  "building_type": "Office",
  "replacement_value": 12500000.00,
  "selected_elements": ["uuid1", "uuid2", "uuid3"],
  "checklist": {
    "safety_equipment": true,
    "building_access": true,
    "documentation": true,
    "weather_conditions": true
  },
  "additional_notes": "Pre-assessment notes",
  "status": "completed"
}
```

**Validation:**
- `assessment_type`: One of [Annual, Condition, Compliance, Insurance, Due Diligence, Capital Planning]
- `selected_elements`: Array with at least 1 element
- `building_size`: Positive integer

**Response (200):**
```json
{
  "success": true,
  "message": "Pre-assessment saved successfully",
  "data": {
    "preAssessment": { /* pre-assessment details */ }
  }
}
```

---

### DELETE /api/pre-assessments/:id
**Delete pre-assessment**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Pre-assessment deleted successfully"
}
```

---

## Report APIs

### GET /api/reports
**Get all reports for organization**

**Authentication:** Required

**Query Parameters:**
- `building_id` (optional): Filter by building
- `assessment_id` (optional): Filter by assessment

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "assessment_id": "uuid",
        "building_id": "uuid",
        "building_name": "Main Office",
        "title": "FCI Assessment Report - Main Office",
        "report_type": "FCI",
        "file_url": "https://cloudinary.com/report.pdf",
        "generated_at": "2025-06-15T00:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/reports/:id
**Get report by ID**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "uuid",
      "assessment_id": "uuid",
      "building_id": "uuid",
      "title": "FCI Assessment Report",
      "report_type": "FCI",
      "file_url": "https://cloudinary.com/report.pdf",
      "assessment": { /* assessment details */ },
      "building": { /* building details */ },
      "generated_at": "2025-06-15T00:00:00Z"
    }
  }
}
```

---

### POST /api/reports/generate/:assessmentId
**Generate report from assessment**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "report": {
      "id": "uuid",
      "file_url": "https://cloudinary.com/report.pdf"
    }
  }
}
```

---

### GET /api/reports/download/assessment/:assessmentId
**Download PDF report for assessment**

**Authentication:** Required

**Response:** PDF file stream

---

## Analytics APIs

### GET /api/analytics/summary
**Get comprehensive analytics summary**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_buildings": 45,
      "total_assessments": 120,
      "completed_assessments": 98,
      "average_fci": 0.32,
      "total_repair_costs": 4500000.00,
      "total_replacement_value": 15000000.00,
      "buildings_by_condition": {
        "Excellent": 5,
        "Good": 28,
        "Fair": 10,
        "Critical": 2
      }
    }
  }
}
```

---

### GET /api/analytics/buildings
**Get building analytics with FCI data**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "buildings": [
      {
        "id": "uuid",
        "name": "Main Office",
        "type": "Office",
        "year_built": 2010,
        "square_footage": 50000,
        "latest_fci": 0.25,
        "condition_category": "Good",
        "assessment_count": 8,
        "total_repair_cost": 150000.00
      }
    ]
  }
}
```

---

### GET /api/analytics/fci-age-correlation
**Get FCI vs building age correlation data**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "correlation": [
      {
        "age_group": "0-10 years",
        "average_fci": 0.15,
        "building_count": 12
      },
      {
        "age_group": "11-20 years",
        "average_fci": 0.28,
        "building_count": 18
      }
    ]
  }
}
```

---

### GET /api/analytics/cost-efficiency
**Get cost efficiency analysis**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "efficiency": [
      {
        "building_id": "uuid",
        "building_name": "Main Office",
        "cost_per_sqft": 3.00,
        "efficiency_score": 85
      }
    ]
  }
}
```

---

### GET /api/analytics/cost-trends
**Get maintenance cost trends over time**

**Authentication:** Required

**Query Parameters:**
- `period` (optional): "month", "quarter", "year"

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2025-Q1",
        "total_cost": 250000.00,
        "assessment_count": 12
      },
      {
        "period": "2025-Q2",
        "total_cost": 180000.00,
        "assessment_count": 10
      }
    ]
  }
}
```

---

### GET /api/analytics/predictions
**Get predictive maintenance predictions (backend ready)**

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "building_id": "uuid",
        "element_code": "B3010",
        "element_name": "Roof Coverings",
        "predicted_failure_date": "2027-08-15",
        "confidence": 0.85,
        "recommended_action": "Plan replacement in 24 months"
      }
    ]
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details"
}
```

### Common Error Scenarios

**401 Unauthorized - Missing Token:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**401 Unauthorized - Token Expired:**
```json
{
  "success": false,
  "message": "Token expired"
}
```

**403 Forbidden - Insufficient Permissions:**
```json
{
  "success": false,
  "message": "Forbidden. Insufficient permissions."
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Building not found"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error for debugging (dev only)"
}
```

---

**Next Steps:**
- Proceed to **Milestone 5: Core Features**

---

**Document Control:**
- Created: November 3, 2025
- Version: 1.0
- Status: Complete ✅
