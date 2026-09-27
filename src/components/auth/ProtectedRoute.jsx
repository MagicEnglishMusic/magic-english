import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AccessBlockedView from './AccessBlockedView';

export default function ProtectedRoute({ children, requiredRole = 'student', onRedirect }) {
  const { isAuthenticated, role, accessStatus, logout, refreshSession } = useAuth();

  // 1. Verificação de Autenticação
  if (!isAuthenticated) {
    if (onRedirect) {
      onRedirect(requiredRole === 'admin' ? 'admin-login' : 'login');
    }
    return null;
  }

  // 2. Verificação de Papel (Role)
  if (requiredRole && role !== requiredRole) {
    if (onRedirect) {
      if (role === 'student' && requiredRole === 'admin') {
        onRedirect('dashboard');
      } else if (role === 'admin' && requiredRole === 'student') {
        onRedirect('admin');
      } else {
        onRedirect(requiredRole === 'admin' ? 'admin-login' : 'login');
      }
    }
    return null;
  }

  // 3. Administradores têm acesso irrestrito garantido
  if (role === 'admin') {
    return <>{children}</>;
  }

  // 4. Verificação de Status Comercial (Kiwify) para Alunos
  if (role === 'student' && accessStatus && accessStatus !== 'active') {
    return (
      <AccessBlockedView 
        status={accessStatus}
        onRefresh={refreshSession}
        onLogout={logout}
      />
    );
  }

  return <>{children}</>;
}

