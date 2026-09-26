import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = 'student', onRedirect }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    if (onRedirect) {
      onRedirect(requiredRole === 'admin' ? 'admin-login' : 'login');
    }
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    if (onRedirect) {
      onRedirect(requiredRole === 'admin' ? 'admin-login' : 'login');
    }
    return null;
  }

  return <>{children}</>;
}
