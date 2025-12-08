// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StaffManagement } from './pages/admin/StaffManagement';
import { AdminTimeEntry } from './pages/admin/AdminTimeEntry';
import { AdminOvertime } from './pages/admin/AdminOvertime';
import { AdminLeave } from './pages/admin/AdminLeave';
import { SiteManagement } from './pages/admin/SiteManagement';
import { PayrollManagement } from './pages/admin/PayrollManagement';
import { SettingsPage } from './pages/admin/SettingsPage';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Reports } from './pages/admin/Reports';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffTimeEntry } from './pages/staff/StaffTimeEntry';
import { StaffOvertime } from './pages/staff/StaffOvertime';
import { StaffLeave } from './pages/staff/StaffLeave';
import { StaffReports } from './pages/staff/StaffReports';
import { NotificationsPage } from './pages/common/NotificationsPage';
import { ProfilePage } from './pages/common/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import './index.css';

// Placeholder components for routes
/* const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="fade-in">
    <h1>{title}</h1>
    <p className="text-muted">This page is under development.</p>
  </div>
); */

import { ThemeProvider } from './contexts/ThemeContext';
// ...
function App() {
  console.log('App.tsx: Rendering App component');
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="staff" element={<StaffManagement />} />
                    <Route path="time-entries" element={<AdminTimeEntry />} />
                    <Route path="overtime" element={<AdminOvertime />} />
                    <Route path="leave" element={<AdminLeave />} />
                    <Route path="sites" element={<SiteManagement />} />
                    <Route path="payroll" element={<PayrollManagement />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Staff Routes */}
            <Route path="/staff/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<StaffDashboard />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="time-entries" element={<StaffTimeEntry />} />
                    <Route path="overtime" element={<StaffOvertime />} />
                    <Route path="leave" element={<StaffLeave />} />
                    <Route path="reports" element={<StaffReports />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
