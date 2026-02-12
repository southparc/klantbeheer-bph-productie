import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsTable } from "@/components/ClientsTable";
import { AdminLogin } from "@/components/AdminLogin";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, LogOut } from 'lucide-react';
const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Laden...</span>
        </div>
      </div>;
  }
  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }
  return <div className="min-h-screen bg-background">
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
                <p className="text-xs text-muted-foreground">Productie</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/add-client')} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm shadow-teal-500/20 h-9 px-4 text-sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Klant toevoegen
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground h-9 w-9 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <ClientsTable />
      </div>
    </div>;
};
export default Index;