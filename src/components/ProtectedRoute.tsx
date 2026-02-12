import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLogin } from '@/components/AdminLogin';
import { useDashboardUser } from '@/hooks/useDashboardUser';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { dashboardUser, isLoading: dashLoading, isSuperAdmin } = useDashboardUser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading || dashLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Laden...</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  if (!dashboardUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-2">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-lg font-semibold">Geen toegang</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Je account heeft geen dashboard-toegang. Neem contact op met je beheerder.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-teal-600 hover:text-teal-700 underline"
          >
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 mb-2">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold">Alleen voor beheerders</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Deze pagina is alleen toegankelijk voor super admins.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
