import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
          <p className="font-sans text-sm tracking-wider text-slate-400">MEMATANGKAN SESI BIZPILOT AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Session is invalid or absent, show Login panel inline or redirect
    return <LoginRedirectFallback />;
  }

  return <>{children}</>;
};

const LoginRedirectFallback: React.FC = () => {
  React.useEffect(() => {
    // Perform standard client-side state change or fallback to location hashes
    window.location.hash = '/login';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
      <p className="text-sm">Mengarahkan ke halaman login...</p>
    </div>
  );
};
