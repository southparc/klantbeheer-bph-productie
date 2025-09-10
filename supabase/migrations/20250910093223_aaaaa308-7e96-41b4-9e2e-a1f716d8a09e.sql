-- Ensure RLS is enabled on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to rebuild them properly
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "Admin users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Only specific emails can insert clients" ON public.clients;

-- 1. SELECT policies (users can read their own data, admins can read all)
CREATE POLICY "clients_select_own" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (supabase_auth_id = auth.uid());

CREATE POLICY "Admin users can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users au 
  WHERE au.email = auth.email() AND au.is_active = true
));

-- 2. INSERT policy (preserve iOS app rules - only specific emails can insert)
CREATE POLICY "Only specific emails can insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (auth.email() IN (
  'teun@bpvdh.nl',
  'jurriaan@bpvdh.nl', 
  'elroy@bpvdh.nl'
));

-- 3. UPDATE policy - block direct updates, force through edge function
CREATE POLICY "Block direct updates for regular users" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (false);

-- 4. Allow service role to update (for edge function)
CREATE POLICY "Service role can update clients" 
ON public.clients 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- 5. DELETE policy - only allow service role (if needed)
CREATE POLICY "Service role can delete clients" 
ON public.clients 
FOR DELETE 
TO service_role
USING (true);