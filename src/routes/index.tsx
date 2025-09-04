import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';

// Layouts
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { AuthLayout } from '@/layouts/auth-layout';

// Auth Pages
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';

// Dashboard Pages
import { DashboardPage } from '@/pages/dashboard';
import { BuildingsPage } from '@/pages/buildings';
import { BuildingDetailsPage } from '@/pages/buildings/building-details';
import { NewBuildingPage } from '@/pages/buildings/new-building';
import { EditBuildingPage } from '@/pages/buildings/edit-building';
import { AssessmentsPage } from '@/pages/assessments';
import { NewAssessmentPage } from '@/pages/assessments/new';
import { NewAssessmentPageSimple } from '@/pages/assessments/new-simple';
import { PreAssessmentPage } from '@/pages/assessments/pre-assessment';
import { FieldAssessmentPage } from '@/pages/assessments/field-assessment';
import { AssessmentDetailsPage } from '@/pages/assessments/assessment-details';
import { EditAssessmentPage } from '@/pages/assessments/edit-assessment';
import { ReportsPage } from '@/pages/reports';
import { ReportsDashboard } from '@/pages/reports/reports-dashboard';
import { NewReportPage } from '@/pages/reports/new';
import { ReportDetailsPage } from '@/pages/reports/report-details';
import { SettingsPage } from '@/pages/settings';
import { ProfilePage } from '@/pages/profile';
import { AnalyticsPage } from '@/pages/analytics';
import { AnalyticsTestPage } from '@/pages/analytics/test';
import { SimpleAnalyticsPage } from '@/pages/analytics/simple';
import { DebugAnalyticsPage } from '@/pages/analytics/debug';
import { FixedAnalyticsPage } from '@/pages/analytics/fixed';
// TODO: Fast follow after MVP launch
// import { PredictiveMaintenancePage } from '@/pages/predictive-maintenance';
import { TeamPage } from '@/pages/team';
import { OrganizationPage } from '@/pages/organization';
import { AdminSettingsPage } from '@/pages/admin/settings';
import { AdminDashboard } from '@/pages/admin/dashboard';
import { AdminUsersPage } from '@/pages/admin/users';
import { OrganizationDetailsPage } from '@/pages/admin/organization-details';
import { OrganizationEditPage } from '@/pages/admin/organization-edit';
import { TokensPage } from '@/pages/admin/tokens';
import { BuildingCostsPage } from '@/pages/admin/building-costs';
import { LoadingScreen } from '@/components/loading-screen';
import { NotFoundPage } from '@/pages/not-found';
import { ProtectedRoute } from '@/components/protected-route';

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading screen while authentication is being checked
  if (loading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  // Auth route wrapper (redirects to dashboard if already logged in)
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    if (user) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route 
          path="login" 
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          } 
        />
        <Route 
          path="register" 
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          } 
        />
        <Route 
          path="forgot-password" 
          element={
            <AuthRoute>
              <ForgotPasswordPage />
            </AuthRoute>
          } 
        />
      </Route>

      {/* Dashboard Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Buildings */}
        <Route path="buildings" element={<BuildingsPage />} />
        <Route path="buildings/new" element={<NewBuildingPage />} />
        <Route path="buildings/:id" element={<BuildingDetailsPage />} />
        <Route path="buildings/:id/edit" element={<EditBuildingPage />} />
        
        {/* Assessments */}
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="assessments/new" element={<NewAssessmentPageSimple />} />
        <Route path="assessments/:id" element={<AssessmentDetailsPage />} />
        <Route path="assessments/:id/edit" element={<EditAssessmentPage />} />
        <Route path="assessments/pre-assessment" element={<PreAssessmentPage />} />
        <Route path="assessments/field-assessment" element={<FieldAssessmentPage />} />
        
        {/* Reports */}
        <Route path="reports" element={<ReportsDashboard />} />
        <Route path="reports/list" element={<ReportsPage />} />
        <Route path="reports/new" element={<NewReportPage />} />
        <Route path="reports/:id" element={<ReportDetailsPage />} />
        
        {/* Analytics */}
        <Route path="analytics" element={<FixedAnalyticsPage />} />
        
        {/* Predictive Maintenance */}
        {/* TODO: Fast follow after MVP launch */}
        {/* <Route path="predictive-maintenance" element={<PredictiveMaintenancePage />} /> */}
        
        {/* Team Management */}
        <Route path="team" element={<TeamPage />} />
        
        {/* Organization Management */}
        <Route path="organization" element={<OrganizationPage />} />
        
        {/* Admin Routes */}
        <Route path="admin/dashboard" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute adminOnly>
            <AdminUsersPage />
          </ProtectedRoute>
        } />
        <Route path="admin/organizations/:id" element={
          <ProtectedRoute adminOnly>
            <OrganizationDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="admin/organizations/:id/edit" element={
          <ProtectedRoute adminOnly>
            <OrganizationEditPage />
          </ProtectedRoute>
        } />
        <Route path="admin/settings" element={
          <ProtectedRoute adminOnly>
            <AdminSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="admin/tokens" element={
          <ProtectedRoute platformAdminOnly>
            <TokensPage />
          </ProtectedRoute>
        } />
        <Route path="admin/building-costs" element={
          <ProtectedRoute adminOnly>
            <BuildingCostsPage />
          </ProtectedRoute>
        } />
        
        {/* User Settings */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};