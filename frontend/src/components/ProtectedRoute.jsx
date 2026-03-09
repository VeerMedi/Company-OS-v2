import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [], permissions = [], requireAll = false }) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If client tries to access employee routes, redirect to client dashboard
  if (user && (user.role === 'client' || user.isClient)) {
    if (location.pathname !== '/client-dashboard' && !location.pathname.startsWith('/client-dashboard')) {
      return <Navigate to="/client-dashboard" replace />;
    }
  }

  // If employee tries to access client routes, redirect to employee dashboard
  if (user && user.role !== 'client' && !user.isClient) {
    if (location.pathname === '/client-dashboard' || location.pathname.startsWith('/client-dashboard')) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check role-based access
  if (roles.length > 0) {
    const hasRequiredRole = requireAll
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission));

    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;