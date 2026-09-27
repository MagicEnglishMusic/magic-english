import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AccessBlockedView from './AccessBlockedView';
import MagicLoadingScreen from '../ui/MagicLoadingScreen';

export default function ProtectedRoute({ children, requiredRole = 'student', onRedirect }) {
  const { isAuthenticated, role, accessStatus, loading, logout, refreshSession } = useAuth();

  // Aguarda o AuthContext terminar de resolver sessão/profile antes de decidir.
  if (loading) {
    return <MagicLoadingScreen message="Verificando permissões..." />;
  }

  // Se autenticado mas o role ainda não foi resolvido, também espera.
  if (isAuthenticated && !role) {
    return <MagicLoadingScreen message="Carregando seu perfil..." />;
  }

  // 1. Verificação de Autenticação
  const normalizedRole = role ? String(role).trim().toLowerCase() : null;
  const normalizedRequiredRole = requiredRole ? String(requiredRole).trim().toLowerCase() : null;

  if (!isAuthenticated) {
    if (onRedirect) {
      onRedirect(normalizedRequiredRole === 'admin' ? 'admin-login' : 'login');
    }
    return null;
  }

  // 2. Verificação de Papel (Role)
  if (normalizedRequiredRole && normalizedRole !== normalizedRequiredRole) {
    if (onRedirect) {
      if (normalizedRole === 'student' && normalizedRequiredRole === 'admin') {
        onRedirect('dashboard');
      } else if (normalizedRole === 'admin' && normalizedRequiredRole === 'student') {
        onRedirect('admin');
      } else {
        onRedirect(normalizedRequiredRole === 'admin' ? 'admin-login' : 'login');
      }
    }
    return null;
  }

  // 3. Administradores têm acesso irrestrito garantido
  if (normalizedRole === 'admin') {
    return <>{children}</>;
  }

  // 4. Verificação de Status Comercial (Kiwify) para Alunos
  if (normalizedRole === 'student' && accessStatus && accessStatus !== 'active') {
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
