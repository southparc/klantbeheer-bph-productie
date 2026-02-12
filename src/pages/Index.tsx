import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsTable } from "@/components/ClientsTable";
import { AdminLogin } from "@/components/AdminLogin";
import { supabase } from '@/integrations/supabase/client';
import { useDashboardUser } from '@/hooks/useDashboardUser';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, Shield, Building2, Users, Settings } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
            onClick={handleLogout}
            className="text-sm text-teal-600 hover:text-teal-700 underline"
          >
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-sm">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">FinnApp Klantbeheer</h1>
                <p className="text-xs text-muted-foreground">
                  {dashboardUser.office_name || 'Alle kantoren'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Admin navigation - only for super_admin */}
              {isSuperAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/offices')}
                    className="text-muted-foreground hover:text-foreground h-9 px-3 text-xs"
                  >
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    Kantoren
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/users')}
                    className="text-muted-foreground hover:text-foreground h-9 px-3 text-xs"
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Gebruikers
                  </Button>
                  <div className="h-6 w-px bg-border" />
                </>
              )}
              <Button
                onClick={() => navigate('/add-client')}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm shadow-teal-500/20 h-9 px-4 text-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Klant toevoegen
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                {dashboardUser.role === 'super_admin' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    <Building2 className="h-3 w-3" />
                    {dashboardUser.office_name || 'Kantoor'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {dashboardUser.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground h-9 w-9 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <ClientsTable officeId={isSuperAdmin ? null : dashboardUser.office_id} />
      </div>
    </div>
  );
};

export default Index;