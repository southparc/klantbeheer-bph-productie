import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsTable } from "@/components/ClientsTable";
import { AdminLogin } from "@/components/AdminLogin";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
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
        <div>Laden...</div>
      </div>;
  }
  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Klantenbeheer - bph productie </h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/add-client')}>
              <Plus className="h-4 w-4 mr-2" />
              Klant Toevoegen
            </Button>
            <span className="text-sm text-muted-foreground">
              Ingelogd als: {user.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Uitloggen
            </Button>
          </div>
        </div>
        <ClientsTable />
      </div>
    </div>;
};
export default Index;