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
import { PreAssessmentPage } from '@/pages/assessments/pre-assessment';
import { FieldAssessmentPage } from '@/pages/assessments/field-assessment';
import { ReportsPage } from '@/pages/reports';
import { NewReportPage } from '@/pages/reports/new';
import { ReportDetailsPage } from '@/pages/reports/report-details';
import { SettingsPage } from '@/pages/settings';
import { ProfilePage } from '@/pages/profile';
import { AnalyticsPage } from '@/pages/analytics';
import { TeamPage } from '@/pages/team';
import { NotFoundPage } from '@/pages/not-found';

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  // Auth route wrapper (redirects to dashboard if already logged in)
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <div>Loading...</div>;
    if (user) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Navigate to="/login\" replace />} />
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
        <Route path="assessments/new" element={<NewAssessmentPage />} />
        <Route path="assessments/pre-assessment" element={<PreAssessmentPage />} />
        <Route path="assessments/field-assessment" element={<FieldAssessmentPage />} />
        
        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/new" element={<NewReportPage />} />
        <Route path="reports/:id" element={<ReportDetailsPage />} />
        
        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsPage />} />
        
        {/* Team Management */}
        <Route path="team" element={<TeamPage />} />
        
        {/* User Settings */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};