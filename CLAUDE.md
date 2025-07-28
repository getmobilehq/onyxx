# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - TypeScript compilation + Vite production build  
- `npm run lint` - ESLint code linting
- `npm run preview` - Preview production build locally

## Backend Commands

- `cd backend && npm run dev` - Start backend development server on port 5001
- `cd backend && npm run build` - Compile TypeScript backend
- `cd backend && npm start` - Start production backend server

## Project Architecture

**Onyx** is a multi-tenant SaaS application for building condition assessment and lifecycle reporting for capital planning. The application is built with React + TypeScript frontend and Node.js + Express + PostgreSQL backend.

### Current Development Status

**Frontend**: ✅ FULLY IMPLEMENTED
- Complete UI with ShadCN components
- Full authentication system with JWT tokens
- Assessment workflow (pre-assessment → field assessment → completion)
- Building management (CRUD operations)
- Real-time API integration
- Dashboard with statistics
- Reports and analytics

**Backend**: ✅ FULLY IMPLEMENTED  
- Node.js + Express + TypeScript API server
- PostgreSQL database with complete schema
- JWT authentication with refresh tokens
- Full CRUD APIs for buildings, assessments, elements, users
- Deployed to Render.com (https://onyxx.onrender.com)
- Database hosted on Render PostgreSQL

### Core Application Structure

- **Context-based State Management**: Authentication (`auth-context.tsx`) and organization (`org-context.tsx`) contexts provide global state
- **Multi-tenant Architecture**: Organization-scoped data access with role-based permissions (admin, manager, assessor)
- **Layout System**: Separate layouts for authentication (`auth-layout.tsx`) and dashboard (`dashboard-layout.tsx`) views
- **ShadCN UI Components**: Comprehensive component library in `src/components/ui/` following Radix UI patterns

### Implemented Features

1. **Authentication System**: ✅ COMPLETE
   - JWT-based authentication with refresh tokens
   - User registration, login, logout
   - Protected routes and token management
   - Login: admin@onyx.com / password123

2. **Buildings Management**: ✅ COMPLETE
   - Complete CRUD operations (Create, Read, Update, Delete)
   - Building listing with search and filtering
   - Building details pages with assessment history
   - Form validation with Zod schemas

3. **Assessment System**: ✅ COMPLETE
   - Two-phase assessment workflow implemented
   - Pre-Assessment: Building selection, element selection, checklist validation
   - Field Assessment: Element-by-element condition rating, photo upload, deficiency tracking with categorization
   - Deficiency Categories: Life Safety & Code Compliance, Critical Systems, Energy Efficiency, Asset Life Cycle, User Experience, Equity & Accessibility
   - Assessment status tracking (pending → in_progress → completed)
   - Assessment list with real-time updates (fixed flickering issue)
   - FCI (Facility Condition Index) calculation with updated interpretation ranges:
     - 0.00-0.1: Excellent (new building)
     - 0.1-0.4: Good (light investment)
     - 0.4-0.7: Fair (renovation needed)
     - 0.7+: Critical (consider demolition)

4. **Elements System**: ✅ COMPLETE
   - Uniformat II building elements classification (64 standard elements)
   - Element seeding system for database population
   - Element selection and management in assessments

5. **User Management**: ✅ COMPLETE
   - User CRUD operations with role-based access
   - Team member management within organizations

### Database Configuration

**PostgreSQL Database (Production)**:
- Hosted on Render.com PostgreSQL service
- Connected via DATABASE_URL environment variable
- Schema: 7 core tables supporting multi-tenancy (Organizations, Users, Buildings, Elements, Assessments, Assessment_Elements, Reports)
- Sample data populated for testing

**API Configuration**:
- Production API: https://onyxx.onrender.com/api
- Local Development: http://localhost:5001/api
- Auto-fallback configured in frontend

### Import Patterns

- Use `@/` path alias for `src/` directory imports
- UI components imported from `@/components/ui/`
- Utilities from `@/lib/utils`
- Context providers from `@/context/`

### Technology Stack

- **Frontend**: React 18.3 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom theming and dark mode
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v6
- **Charts**: Recharts for data visualization
- **UI**: ShadCN components built on Radix UI primitives

### Recent Fixes and Improvements

**Assessment List Page Flickering (RESOLVED)**:
- Fixed infinite re-render loop in `/src/pages/assessments/index.tsx`
- Changed useEffect dependency array from `[fetchAssessments]` to `[]`
- Assessment list now stable and shows completed assessments correctly

**API Integration**:
- Full end-to-end assessment workflow tested and working
- Pre-assessment data persistence via localStorage and backend API
- Field assessment with element condition ratings and deficiency tracking
- Assessment completion saves to backend with FCI calculation

### Testing Status

- **Manual Testing**: ✅ Extensive end-to-end testing completed
- **Authentication Flow**: ✅ Login/logout/token refresh working
- **Assessment Workflow**: ✅ Complete pre-assessment → field assessment → completion workflow tested
- **Data Persistence**: ✅ Backend integration fully functional
- **Frontend Stability**: ✅ No flickering or infinite render issues

**Automated Testing**: Not yet implemented (Jest/Cypress planned for future)