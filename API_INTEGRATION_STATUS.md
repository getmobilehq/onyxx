# API Integration Status

This document tracks the status of replacing mock data with real API calls in the Onyx application.

## ✅ Completed

### Authentication System
- [x] Login API integration (`/api/auth/login`)
- [x] Register API integration (`/api/auth/register`)
- [x] Token management with refresh logic
- [x] Auth context updated to use real API
- [x] Axios interceptors for automatic token injection
- [x] Token refresh on 401 responses

### API Infrastructure
- [x] Created `src/services/api.ts` with all API endpoints
- [x] Configured axios with base URL from environment variables
- [x] Added error handling and request/response interceptors
- [x] Created `.env` file with API configuration

## 🚧 In Progress

### Buildings Module
- [x] Created `useBuildings` hook with API structure
- [ ] Backend endpoints need to be implemented:
  - `GET /api/buildings`
  - `GET /api/buildings/:id`
  - `POST /api/buildings`
  - `PUT /api/buildings/:id`
  - `DELETE /api/buildings/:id`

## ❌ Pending

### Backend Implementation Needed

1. **Buildings Controller** (`backend/src/controllers/buildings.controller.ts`)
   - CRUD operations for buildings
   - Search and filter functionality
   - Image upload handling

2. **Assessments Controller** (`backend/src/controllers/assessments.controller.ts`)
   - Pre-assessment endpoints
   - Field assessment endpoints
   - Assessment status management

3. **Reports Controller** (`backend/src/controllers/reports.controller.ts`)
   - Report generation
   - FCI calculations
   - PDF export functionality

4. **Elements Controller** (`backend/src/controllers/elements.controller.ts`)
   - Uniformat elements CRUD
   - Element search functionality

5. **Reference Data Controller** (`backend/src/controllers/reference.controller.ts`)
   - Building costs reference data
   - Building types management

### Frontend Components to Update

1. **Dashboard Page** (`src/pages/dashboard/index.tsx`)
   - Replace mock statistics with API calls
   - Real-time data updates

2. **Buildings List** (`src/pages/buildings/index.tsx`)
   - Use `useBuildings` hook
   - Implement search/filter with API

3. **Building Details** (`src/pages/buildings/building-details.tsx`)
   - Fetch building data from API
   - Load assessments and maintenance history

4. **Assessments** (`src/pages/assessments/*.tsx`)
   - Save assessment data to backend
   - Load existing assessments

5. **Reports** (`src/pages/reports/*.tsx`)
   - Generate reports via API
   - Download PDF functionality

6. **Team Management** (`src/pages/team/index.tsx`)
   - User invitation system
   - Role management

## Next Steps

1. **Immediate Priority**: Implement backend controllers
   ```bash
   cd backend
   # Create controllers
   touch src/controllers/buildings.controller.ts
   touch src/controllers/assessments.controller.ts
   touch src/controllers/reports.controller.ts
   touch src/controllers/elements.controller.ts
   touch src/controllers/reference.controller.ts
   ```

2. **Database Schema**: Ensure all tables exist in PostgreSQL
   - Buildings table matches the schema
   - Add any missing columns or indexes

3. **File Upload**: Implement file upload for building images
   - Consider using multer for Node.js
   - Store images in cloud storage (S3, Cloudinary, etc.)

4. **Testing**: Add API tests
   - Unit tests for controllers
   - Integration tests for endpoints

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

### Backend (.env)
```env
DATABASE_URL=postgresql://jojo:Montg0m3r!@localhost:5432/onyx
JWT_SECRET=onyx-secret-key-2025-change-in-production
JWT_REFRESH_SECRET=onyx-refresh-secret-2025-change-in-production
PORT=5000
```

## API Endpoints Summary

### Authentication
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/register`
- ✅ `POST /api/auth/refresh`
- ✅ `GET /api/auth/me`

### Buildings
- ❌ `GET /api/buildings`
- ❌ `GET /api/buildings/:id`
- ❌ `POST /api/buildings`
- ❌ `PUT /api/buildings/:id`
- ❌ `DELETE /api/buildings/:id`

### Assessments
- ❌ `GET /api/assessments`
- ❌ `GET /api/assessments/:id`
- ❌ `GET /api/assessments/building/:buildingId`
- ❌ `POST /api/assessments`
- ❌ `PUT /api/assessments/:id`

### Reports
- ❌ `GET /api/reports`
- ❌ `GET /api/reports/:id`
- ❌ `POST /api/reports/generate`
- ❌ `GET /api/reports/:id/download`

### Users
- ❌ `GET /api/users`
- ❌ `POST /api/users/invite`
- ❌ `PUT /api/users/:id`
- ❌ `DELETE /api/users/:id`

### Reference Data
- ❌ `GET /api/reference/building-costs`
- ❌ `GET /api/reference/elements`