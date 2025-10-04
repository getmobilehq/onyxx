# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Last Updated: October 3, 2025

## Development Commands

### Frontend
- `npm run dev` - Start development server with Vite (port 5173)
- `npm run build` - TypeScript compilation + Vite production build
- `npm run lint` - ESLint code linting
- `npm run preview` - Preview production build locally
- `npm test` - Run Vitest tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage report
- `npm run test:watch` - Run tests in watch mode

### Backend
- `cd backend && npm install` - Install backend dependencies
- `cd backend && npm run dev` - Start backend development server with Nodemon (port 5001, proxied at 5002)
- `cd backend && npm run build` - Compile TypeScript backend
- `cd backend && npm start` - Start production backend server
- `cd backend && npm test` - Run Jest unit tests
- `cd backend && npm run test:watch` - Run tests in watch mode
- `cd backend && npm run test:coverage` - Generate test coverage report
- `cd backend && npm run test:ci` - Run tests in CI mode

### Database & Migrations
- `cd backend && npm run migrate` - Run database migrations using custom migrate.ts
- `cd backend && npm run migrate:status` - Check migration status
- `cd backend && npm run migrate:up` - Run pending migrations
- `cd backend && npm run migrate:rollback` - Rollback last migration
- `cd backend && npm run migrate:history` - Show migration history
- `cd backend && npm run migrate:dry-run` - Test migrations without applying
- `cd backend && npm run validate:check` - Run data integrity validation
- `cd backend && npm run validate:fix` - Fix data integrity issues

## Project Architecture

**Onyx** is a multi-tenant SaaS application for building condition assessment and lifecycle reporting for capital planning. The application is built with React + TypeScript frontend and Node.js + Express + PostgreSQL backend.

### Current Development Status (September 4, 2025)

**Frontend**: 90% Complete
- ✅ Complete UI with ShadCN components
- ✅ Full authentication system with JWT tokens
- ✅ **Simplified registration system** (token requirement removed for MVP)
- ✅ Assessment workflow (pre-assessment → field assessment → completion)
- ✅ Building management (CRUD operations)
- ✅ Real-time API integration
- ✅ Dashboard with statistics
- ✅ PDF Report generation
- ✅ Mobile responsive framework
- ✅ Testing infrastructure with Vitest
- ✅ **Building cost management system** (admin controls for replacement values)
- 🚧 Analytics dashboard (partial - needs more visualizations)
- ❌ Predictive Maintenance UI (post-MVP, backend ready)
- ❌ Email Subscriptions UI (component exists, not connected)

**Backend**: 98% Complete  
- ✅ Node.js + Express + TypeScript API server
- ✅ PostgreSQL database with complete schema
- ✅ JWT authentication with refresh tokens
- ✅ Full CRUD APIs for buildings, assessments, elements, users
- ✅ **Hybrid registration system** (supports both token-based and direct signup)
- ✅ **Dynamic building cost management** with database-driven pricing
- ✅ Predictive maintenance algorithms
- ✅ Email system with Mailgun
- ✅ PDF report generation service
- ✅ Analytics engine with complex queries
- ✅ Two-factor authentication system
- ✅ Security enhancements (rate limiting, headers)
- ✅ **Comprehensive error handling** and production stability fixes

**Deployment**: ✅ LIVE
- Frontend: https://onyxreport.com (Render static site)
- Backend: https://manage.onyxreport.com (Render web service)
- Database: Render PostgreSQL
- CI/CD: GitHub Actions → Render auto-deploy

### Core Application Structure

- **Context-based State Management**: Authentication (`auth-context.tsx`) and organization (`org-context.tsx`) contexts provide global state
- **Multi-tenant Architecture**: Organization-scoped data access with role-based permissions (admin, manager, assessor). All database queries must filter by `org_id` to ensure tenant isolation
- **Layout System**: Separate layouts for authentication (`auth-layout.tsx`) and dashboard (`dashboard-layout.tsx`) views
- **ShadCN UI Components**: Comprehensive component library in `src/components/ui/` following Radix UI patterns
- **Backend Architecture**: Express app defined in `backend/src/app.ts`, server entry in `backend/src/server.ts`. Routes are modular and located in `backend/src/routes/`, controllers in `backend/src/controllers/`, services in `backend/src/services/`
- **Middleware Stack**: Authentication (`auth.middleware.ts`), error handling (`error.middleware.ts`), security (`security.middleware.ts`), file upload (`upload.middleware.ts`)
- **Database Layer**: PostgreSQL connection via `backend/src/config/database.ts`. Custom migration system in `backend/src/database/migrate.ts`

### Implemented Features

1. **Authentication System**: ✅ COMPLETE
   - JWT-based authentication with refresh tokens
   - **Simplified user registration** (organization name instead of tokens)
   - User login, logout with session management
   - Protected routes and token management
   - **Backward compatibility** with existing token-based flow
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
- Production API: https://manage.onyxreport.com/api
- Local Development: http://localhost:5001/api
- Auto-fallback configured in frontend
- CORS configured for www.onyxreport.com domain

### Import Patterns & Path Aliases

- Use `@/` path alias for `src/` directory imports (configured in tsconfig.json and vite.config.ts)
- UI components: `@/components/ui/` (ShadCN components)
- Feature components: `@/components/` (assessment-workflow, uniformat-selector, etc.)
- Page components: `@/pages/` (dashboard, buildings, assessments, analytics)
- Utilities: `@/lib/utils`
- Context providers: `@/context/` (auth-context.tsx, org-context.tsx)
- Services: `@/services/` (API integration)
- Backend uses `@/` alias mapped to `backend/src/` in Jest config

### Technology Stack

- **Frontend**: React 18.3 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom theming and dark mode
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v6
- **Charts**: Recharts for data visualization
- **UI**: ShadCN components built on Radix UI primitives
- **Testing**: Vitest + React Testing Library for frontend, Jest + Supertest for backend
- **Error Tracking**: Sentry for production monitoring
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Knex query builder
- **ORM/Query Builder**: Knex.js for migrations and queries
- **File Storage**: Cloudinary for image management
- **Email**: Mailgun for transactional emails
- **Authentication**: JWT tokens with bcrypt password hashing

### Recent Fixes and Improvements

**Token-Free Registration System (NEW - Sep 4, 2025)**:
- ✅ Removed token requirement from signup process for MVP testing
- ✅ Updated frontend registration to collect organization name instead
- ✅ Enhanced backend to support both token-based and direct registration
- ✅ Maintained backward compatibility for existing users
- ✅ Automatic organization creation during signup

**Building Cost Management System (Aug 2025)**:
- ✅ Dynamic replacement value calculation based on building type
- ✅ Admin interface for managing cost per square foot by building type
- ✅ Database-driven pricing with automatic calculation
- ✅ Fixed assessment completion with accurate replacement values

**Assessment Workflow Stability (Aug 2025)**:
- ✅ Fixed assessment list page flickering and infinite re-render issues
- ✅ Resolved double-click problems in assessment completion
- ✅ Improved error handling for assessment creation and completion
- ✅ Enhanced report generation with proper replacement value handling
- ✅ Fixed blank page issues in new assessment creation

**API Integration & Error Handling**:
- ✅ Full end-to-end assessment workflow tested and working
- ✅ Comprehensive error handling for production deployment
- ✅ CORS configuration for multi-domain support
- ✅ Fixed TypeScript compilation issues and type safety improvements

### Testing Status & Configuration

- **Frontend Tests**: Vitest configured with jsdom environment, setup in `vitest.config.ts`
  - Test files: `*.test.ts` or `*.test.tsx` alongside source files
  - Setup file: `src/test/setup.ts`
  - Coverage excludes: `node_modules/`, `src/test/`, config files, `src/components/ui/**`
  - Run: `npm test`, `npm run test:ui`, `npm run test:coverage`

- **Backend Tests**: Jest with ts-jest preset, configured in `backend/jest.config.js`
  - Test files: `**/__tests__/**/*.ts`, `**/*.spec.ts`, `**/*.test.ts`
  - Root directories: `backend/src`, `backend/tests`
  - Setup file: `backend/tests/setup.ts`
  - Coverage excludes: `*.d.ts`, `server.ts`, `config/**`
  - Timeout: 30 seconds
  - Run: `cd backend && npm test`

- **Test Coverage**: ~30% overall, focus on critical paths (auth, assessments, buildings)
- **Manual Testing**: ✅ Extensive end-to-end testing completed
- **Authentication Flow**: ✅ Login/logout/token refresh working
- **Assessment Workflow**: ✅ Complete pre-assessment → field assessment → completion workflow tested
- **Data Persistence**: ✅ Backend integration fully functional
- **Frontend Stability**: ✅ No flickering or infinite render issues

### MVP-Ready Status (September 2025)

**🎯 MVP is Production-Ready for User Testing**
- ✅ Simplified signup process (no tokens required)
- ✅ Complete assessment workflow from building creation to report generation
- ✅ Stable dashboard with real-time statistics
- ✅ Mobile-responsive design
- ✅ Production deployment with CI/CD
- ✅ Error handling and production stability

#### 🔴 Critical Post-MVP Features (Next Phase)
1. **Predictive Maintenance UI** (Commented out for MVP)
   - Backend endpoints ready, UI implementation needed
   - Risk scoring and maintenance timeline visualization
   - Integration with existing assessment data

2. **Enhanced Analytics Dashboard**
   - Cost trend visualizations over time
   - Building efficiency rankings and comparisons
   - Age vs FCI correlation charts
   - Portfolio-wide analytics and insights

3. **Email Subscriptions System**
   - Connect existing UI components to backend API
   - Automated report delivery scheduling
   - Subscription management for stakeholders

#### 🟡 High Priority (Ongoing)
4. **Testing Infrastructure**
   - Expand automated test coverage beyond current 30%
   - Integration tests for critical user workflows
   - Performance testing for large datasets

5. **Mobile Optimization**
   - Real device testing across iOS/Android
   - Tablet-specific UI optimizations
   - Offline capability for field assessments

#### 🟢 Medium Priority (Future Enhancements)
6. **API Documentation**
   - Swagger/OpenAPI specification
   - Developer onboarding guides
   - Integration examples and SDKs

7. **Performance Optimization**
   - Database query optimization
   - CDN implementation for static assets
   - Caching strategies for frequently accessed data

### Progress Tracking

**Overall Completion**: 92% (MVP Ready)
- Core Features: 98% ✅
- Assessment Workflow: 100% ✅
- Authentication & User Management: 100% ✅
- Building Management: 100% ✅
- Advanced Features: 75%
- Testing: 30%
- Mobile: 85%
- Documentation: 60%

**Latest Deployment**: October 3, 2025
- ✅ Removed token requirement for simplified MVP signup
- ✅ Enhanced building cost management system
- ✅ Fixed all critical assessment workflow bugs
- ✅ Improved error handling and production stability
- ✅ Updated documentation and implementation status

**Production URLs**:
- 🌐 Frontend: https://onyxreport.com (Render)
- 🔗 Backend: https://manage.onyxreport.com (Render)
- 📊 Database: Render PostgreSQL (Multi-tenant ready)

**Ready for MVP User Testing** 🚀

### Development Environment Setup

**First-time Setup:**
```bash
# Clone and install frontend
npm install

# Install backend dependencies
cd backend && npm install

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL, JWT_SECRET, CLOUDINARY credentials, etc.

# Run database migrations
cd backend && npm run migrate:up

# Start development servers (in separate terminals)
npm run dev                    # Frontend on port 5173
cd backend && npm run dev      # Backend on port 5001
```

**Important Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `CLOUDINARY_*`: Image upload credentials
- `MAILGUN_*`: Email service credentials
- `SENTRY_DSN`: Error tracking (optional)

### Key Changes in Latest Release (Oct 3, 2025)

**1. Simplified User Registration**
- Frontend: Updated register form to collect organization name instead of token
- Backend: Enhanced auth controller to support both registration methods
- Database: Automatic organization creation during signup
- UI/UX: Improved onboarding flow for new users

**2. Building Cost Management**
- Admin interface for managing building type costs
- Dynamic replacement value calculation
- Database-driven pricing with `cost_per_sqft` column
- Accurate FCI calculations with proper replacement values

**3. Assessment Workflow Fixes**
- Resolved blank page issues in assessment creation
- Fixed double-click problems in assessment completion
- Improved error handling throughout the workflow
- Enhanced report generation reliability

**4. Production Stability**
- Comprehensive error handling for all critical paths
- Fixed TypeScript compilation issues
- CORS configuration for production domain
- Improved logging and debugging capabilities