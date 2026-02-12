import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'office_admin';
  office_id: number | null;
  office_name: string | null;
}

interface UseDashboardUserReturn {
  dashboardUser: DashboardUser | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isOfficeAdmin: boolean;
  refetch: () => Promise<void>;
}

export function useDashboardUser(): UseDashboardUserReturn {
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDashboardUser(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_dashboard_user');

      if (error) {
        console.error('Error fetching dashboard user:', error);
        setDashboardUser(null);
      } else if (data && data.length > 0) {
        setDashboardUser(data[0] as DashboardUser);
      } else {
        setDashboardUser(null);
      }
    } catch (err) {
      console.error('Error in useDashboardUser:', err);
      setDashboardUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchDashboardUser();
      } else {
        setDashboardUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    dashboardUser,
    isLoading,
    isSuperAdmin: dashboardUser?.role === 'super_admin',
    isOfficeAdmin: dashboardUser?.role === 'office_admin',
    refetch: fetchDashboardUser,
  };
}
