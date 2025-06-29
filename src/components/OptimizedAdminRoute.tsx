
import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface OptimizedAdminRouteProps {
  children: React.ReactNode;
}

const AdminLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-event-orange mx-auto mb-4"></div>
      <p className="text-xl text-gray-600">Carregando painel administrativo...</p>
      <p className="text-sm text-gray-500 mt-2">Verificando permissões...</p>
    </div>
  </div>
);

const OptimizedAdminRoute: React.FC<OptimizedAdminRouteProps> = ({ children }) => {
  const { isAdmin, loading, user } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return <AdminLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Redirect to login if not admin
  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  // Render admin content with suspense boundary
  return (
    <Suspense fallback={<AdminLoadingScreen />}>
      {children}
    </Suspense>
  );
};

export default OptimizedAdminRoute;
