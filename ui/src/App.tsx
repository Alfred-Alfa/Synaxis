// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GeofenceProvider } from './contexts/GeofenceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { isAdminPortal, isStaffPortal } from './utils/portalMode';
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
import { LocationRequests } from './pages/admin/LocationRequests';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffTimeEntry } from './pages/staff/StaffTimeEntry';
import { StaffOvertime } from './pages/staff/StaffOvertime';
import { StaffLeave } from './pages/staff/StaffLeave';
import { StaffReports } from './pages/staff/StaffReports';
import { StaffLocationRequests } from './pages/staff/StaffLocationRequests';
import { StaffPayslips } from './pages/staff/StaffPayslips';
import { NotificationsPage } from './pages/common/NotificationsPage';
import { ProfilePage } from './pages/common/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AnnouncementsPage } from './pages/common/AnnouncementsPage';
import './index.css';

// Placeholder components for routes
/* const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="fade-in">
    <h1>{title}</h1>
    <p className="text-muted">This page is under development.</p>
  </div>
); */

import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { ChatPage } from './pages/common/ChatPage';
import { ChatBubble } from './components/chat/ChatBubble';
import { AccountDeletionPolicy } from './pages/AccountDeletionPolicy';

// Component to conditionally render ChatBubble
const ConditionalChatBubble = () => {
  const location = useLocation();
  const publicPaths = ['/login', '/reset-password', '/delete-account'];
  const isPublicPage = publicPaths.some(path => location.pathname.startsWith(path));

  if (isPublicPage) return null;
  return <ChatBubble />;
};

// Wrong portal splash page
const WrongPortalPage = ({ forAdmin }: { forAdmin: boolean }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: forAdmin ? '#0f172a' : '#f8fafc',
    color: forAdmin ? '#f1f5f9' : '#1e293b',
    fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '2rem'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{forAdmin ? '🔐' : '👤'}</div>
    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
      {forAdmin ? 'Admin Portal' : 'Employee Portal'}
    </h1>
    <p style={{ opacity: 0.7, marginBottom: '2rem', maxWidth: '400px' }}>
      {forAdmin
        ? `This is the Admin Portal. Staff members should go to ${window.location.hostname}:3000.`
        : `This is the Employee Portal. Admins should go to ${window.location.hostname}:8000.`}
    </p>
    <a
      href={forAdmin ? `http://${window.location.hostname}:8000/login` : `http://${window.location.hostname}:3000/login`}
      style={{
        padding: '0.75rem 2rem', borderRadius: '8px',
        background: forAdmin ? '#6366f1' : '#3b82f6',
        color: 'white', textDecoration: 'none', fontWeight: 600
      }}
    >
      Go to {forAdmin ? 'Admin' : 'Employee'} Portal →
    </a>
  </div>
);

// ...
function App() {
  console.log('App.tsx: Rendering App component');
  return (
    <GeofenceProvider>
      <AuthProvider>
        <ThemeProvider>
          <ChatProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/delete-account" element={<AccountDeletionPolicy />} />

                {/* Admin Routes - only render on admin portal (port 8000) */}
                {isAdminPortal() ? (
                  <Route path="/admin/*" element={
                    <ProtectedRoute requireAdmin>
                      <Layout>
                        <Routes>
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="staff" element={<ProtectedRoute requireSuperAdmin><StaffManagement /></ProtectedRoute>} />
                          <Route path="time-entries" element={<AdminTimeEntry />} />
                          <Route path="overtime" element={<AdminOvertime />} />
                          <Route path="leave" element={<AdminLeave />} />
                          <Route path="sites" element={<SiteManagement />} />
                          <Route path="location-requests" element={<LocationRequests />} />
                          <Route path="payroll" element={<ProtectedRoute requireSuperAdmin><PayrollManagement /></ProtectedRoute>} />
                          <Route path="reports" element={<ProtectedRoute requireSuperAdmin><Reports /></ProtectedRoute>} />
                          <Route path="settings" element={<ProtectedRoute requireSuperAdmin><SettingsPage /></ProtectedRoute>} />
                          <Route path="audit-logs" element={<ProtectedRoute requireSuperAdmin><AuditLogs /></ProtectedRoute>} />
                          <Route path="notifications" element={<NotificationsPage />} />
                          <Route path="announcements" element={<AnnouncementsPage />} />
                          <Route path="chat" element={<ChatPage />} />
                          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  } />
                ) : (
                  <Route path="/admin/*" element={<WrongPortalPage forAdmin={true} />} />
                )}

                {/* Staff Routes - only render on staff portal (port 3000) */}
                {isStaffPortal() ? (
                  <Route path="/staff/*" element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="dashboard" element={<StaffDashboard />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="time-entries" element={<StaffTimeEntry />} />
                          <Route path="overtime" element={<StaffOvertime />} />
                          <Route path="leave" element={<StaffLeave />} />
                          <Route path="location-requests" element={<StaffLocationRequests />} />
                          <Route path="payslips" element={<StaffPayslips />} />
                          <Route path="reports" element={<StaffReports />} />
                          <Route path="notifications" element={<NotificationsPage />} />
                          <Route path="announcements" element={<AnnouncementsPage />} />
                          <Route path="chat" element={<ChatPage />} />
                          <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  } />
                ) : (
                  <Route path="/staff/*" element={<WrongPortalPage forAdmin={false} />} />
                )}

                {/* Default Route */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              <ConditionalChatBubble />
            </Router>
          </ChatProvider>
        </ThemeProvider>
      </AuthProvider>
    </GeofenceProvider>
  );
}

export default App;
