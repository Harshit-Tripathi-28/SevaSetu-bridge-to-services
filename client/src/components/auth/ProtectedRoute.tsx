import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import type { UserRole } from '@sevasetu/shared';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <span className="text-xs font-medium text-neutral-500">Verifying session credentials...</span>
      </div>
    );
  }

  // Not authenticated -> redirect to login preserving attempted destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Suspended account safeguard
  if (user.status === 'SUSPENDED') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
        <h2 className="text-lg font-bold text-red-900">Account Access Suspended</h2>
        <p className="text-sm text-red-700">
          Your account has been placed under administrative restriction. Please contact platform support for assistance.
        </p>
      </div>
    );
  }

  // Role authorization boundary
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" state={{ attemptedPath: location.pathname, userRole: user.role }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
