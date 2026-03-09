import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FirstLoginPasswordModal from './components/FirstLoginPasswordModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import TaskDetailView from './pages/TaskDetailView';
import HRPerformance from './pages/HRPerformance';
import EmployeeRecords from './pages/EmployeeRecords';
import HRPayroll from './pages/HRPayroll';
import LeaveManagement from './pages/LeaveManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserManagement from './components/UserManagement';
import ChangePassword from './components/ChangePassword';
import ForgotPassword from './components/ForgotPassword';
import HeadOfSalesDashboard from './pages/HeadOfSalesDashboard';
import SalesLeadDetails from './pages/SalesLeadDetails';
import RevenueTargetDetails from './pages/RevenueTargetDetails';
import AnalyticsPage from './pages/AnalyticsPage';
import AIHandbookPage from './pages/AIHandbookPage';
import HandbookManagement from './pages/HandbookManagement';
import HandbookEditor from './pages/HandbookEditor';
import HandbookVersionHistory from './pages/HandbookVersionHistory';
import MeetingManagement from './components/MeetingManagement';
import IncentiveMatrixManager from './components/IncentiveMatrixManager';
import ClientDashboard from './components/ClientDashboard';

// Error Pages
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-600 mb-4">Page not found</p>
      <a href="/dashboard" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
        Go to Dashboard
      </a>
    </div>
  </div>
);

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900">403</h1>
      <p className="text-gray-600 mb-4">Access denied. You don't have permission to view this page.</p>
      <a href="/dashboard" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
        Go to Dashboard
      </a>
    </div>
  </div>
);

// Redirect authenticated users away from login page
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If already authenticated, redirect based on role
  if (isAuthenticated) {
    // Check if user is a client
    if (user?.role === 'client' || user?.isClient) {
      return <Navigate to="/client-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Wrapper component to handle first login password change
const FirstLoginWrapper = ({ children }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Don't show password modal for clients
      if (user.role === 'client' || user.isClient) {
        setShowPasswordModal(false);
        return;
      }
      
      // Check if user needs to change password (non-CEO users who haven't changed password)
      const needsPasswordChange = user.role !== 'ceo' && !user.isPasswordChanged;
      setShowPasswordModal(needsPasswordChange);
    } else {
      setShowPasswordModal(false);
    }
  }, [isAuthenticated, user]);

  const handlePasswordChanged = async () => {
    // Refresh user data to get updated isPasswordChanged status
    // Force refresh since password status changed
    await refreshUser(true);
    setShowPasswordModal(false);
  };

  return (
    <>
      {children}
      <FirstLoginPasswordModal
        isOpen={showPasswordModal}
        onPasswordChanged={handlePasswordChanged}
      />
    </>
  );
};

// Inner component that has access to AuthContext
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <FirstLoginWrapper>
        <AppRoutes />
      </FirstLoginWrapper>



      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <AuthRedirect>
          <Login />
        </AuthRedirect>
      } />

      <Route path="/forgot-password" element={
        <AuthRedirect>
          <ForgotPassword />
        </AuthRedirect>
      } />

      {/* Client Dashboard Route */}
      <Route path="/client-dashboard" element={
        <ProtectedRoute>
          <ClientDashboard />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute>
          <MyTasks />
        </ProtectedRoute>
      } />

      <Route path="/task/:taskId" element={
        <ProtectedRoute>
          <TaskDetailView />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute permissions={['read_all_users']}>
          <UserManagement />
        </ProtectedRoute>
      } />

      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/hr/performance" element={
        <ProtectedRoute roles={['hr', 'ceo', 'co-founder']}>
          <HRPerformance />
        </ProtectedRoute>
      } />

      <Route path="/hr/employees" element={
        <ProtectedRoute roles={['hr', 'ceo', 'co-founder']}>
          <EmployeeRecords />
        </ProtectedRoute>
      } />

      <Route path="/hr/payroll" element={
        <ProtectedRoute roles={['hr', 'ceo', 'co-founder']}>
          <HRPayroll />
        </ProtectedRoute>
      } />

      <Route path="/hr/leave" element={
        <ProtectedRoute roles={['hr', 'ceo', 'co-founder']}>
          <LeaveManagement />
        </ProtectedRoute>
      } />

      {/* Sales Routes */}
      <Route path="/sales/dashboard" element={
        <ProtectedRoute roles={['head-of-sales', 'ceo']}>
          <HeadOfSalesDashboard />
        </ProtectedRoute>
      } />

      <Route path="/sales/lead/:id" element={
        <ProtectedRoute roles={['head-of-sales', 'service-onboarding', 'ceo']}>
          <SalesLeadDetails />
        </ProtectedRoute>
      } />

      <Route path="/sales/member/:id" element={
        <ProtectedRoute roles={['head-of-sales', 'ceo']}>
          <HeadOfSalesDashboard />
        </ProtectedRoute>
      } />

      {/* Revenue & Sales Flow Routes */}
      <Route path="/revenue/dashboard" element={
        <ProtectedRoute roles={['co-founder', 'ceo']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/revenue/target/:id" element={
        <ProtectedRoute roles={['co-founder', 'ceo', 'head-of-sales']}>
          <RevenueTargetDetails />
        </ProtectedRoute>
      } />

      <Route path="/hos/dashboard" element={
        <ProtectedRoute roles={['head-of-sales']}>
          <HeadOfSalesDashboard />
        </ProtectedRoute>
      } />

      <Route path="/sales-rep/dashboard" element={
        <ProtectedRoute roles={['service-onboarding']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/company/:id" element={
        <ProtectedRoute roles={['head-of-sales', 'service-onboarding', 'ceo', 'co-founder']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/lead/:id" element={
        <ProtectedRoute roles={['service-onboarding', 'head-of-sales', 'ceo', 'co-founder']}>
          <SalesLeadDetails />
        </ProtectedRoute>
      } />

      {/* Analytics Route */}
      <Route path="/analytics" element={
        <ProtectedRoute roles={['co-founder', 'ceo']}>
          <AnalyticsPage />
        </ProtectedRoute>
      } />

      {/* AI Handbook for Developers */}
      <Route path="/ai-handbook" element={
        <ProtectedRoute>
          <AIHandbookPage />
        </ProtectedRoute>
      } />

      {/* Incentive Matrix (HR/CEO/Co-founder only) */}
      <Route path="/incentive-matrix" element={
        <ProtectedRoute roles={['hr', 'ceo', 'co-founder']}>
          <IncentiveMatrixManager />
        </ProtectedRoute>
      } />

      {/* Handbook Management (HR/CEO only) */}
      <Route path="/handbooks" element={
        <ProtectedRoute>
          <HandbookManagement />
        </ProtectedRoute>
      } />
      <Route path="/handbooks/new" element={
        <ProtectedRoute>
          <HandbookEditor />
        </ProtectedRoute>
      } />
      <Route path="/handbooks/edit/:id" element={
        <ProtectedRoute>
          <HandbookEditor />
        </ProtectedRoute>
      } />
      <Route path="/handbooks/view/:id" element={
        <ProtectedRoute>
          <HandbookEditor />
        </ProtectedRoute>
      } />
      <Route path="/handbooks/history/:id" element={
        <ProtectedRoute>
          <HandbookVersionHistory />
        </ProtectedRoute>
      } />

      {/* Meetings Route */}
      <Route path="/meetings" element={
        <ProtectedRoute>
          <MeetingManagement />
        </ProtectedRoute>
      } />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;