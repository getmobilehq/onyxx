# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - TypeScript compilation + Vite production build  
- `npm run lint` - ESLint code linting
- `npm run preview` - Preview production build locally

## Project Architecture

**Onyx** is a multi-tenant SaaS application for building condition assessment and lifecycle reporting. The frontend is built with React + TypeScript, while the backend and database integration are still in development.

### Current Development Status

**Frontend**: Basic structure implemented with mock data
- UI components and layouts established
- Page structures created but not fully functional
- Context providers set up for future state management
- No backend integration yet

**Backend**: Not implemented yet
- Database schema designed (see ONYX.sql)
- API endpoints need to be built
- Authentication system needs implementation

### Core Application Structure

- **Context-based State Management**: Authentication (`auth-context.tsx`) and organization (`org-context.tsx`) contexts provide global state
- **Multi-tenant Architecture**: Organization-scoped data access with role-based permissions (admin, manager, assessor)
- **Layout System**: Separate layouts for authentication (`auth-layout.tsx`) and dashboard (`dashboard-layout.tsx`) views
- **ShadCN UI Components**: Comprehensive component library in `src/components/ui/` following Radix UI patterns

### Planned Modules (Per readme.txt)

1. **Buildings**: Facility management with condition tracking
2. **Assessments**: Two-phase assessment workflow
   - Pre-Assessment: Initial data collection
   - Field Assessment: Detailed on-site evaluation
3. **Reports**: FCI (Facility Condition Index) calculation and PDF generation
4. **User Management**: Role-based access within organizations

### Database Configuration

**PostgreSQL Database**:
- Database name: `onyx`
- Username: `jojo`
- Password: `M0ntg0m3r!`
- Schema: 7 core tables supporting multi-tenancy (Organizations, Users, Buildings, Elements, Assessments, Assessment_Items, Reports)

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

### Testing

No testing framework currently configured. Planned implementation with Jest (unit) + Cypress (e2e).