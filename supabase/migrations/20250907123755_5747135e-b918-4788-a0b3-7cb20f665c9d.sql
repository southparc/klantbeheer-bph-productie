-- Add new policy to allow admin users to view all clients
-- This only adds SELECT permission, doesn't modify existing functionality
CREATE POLICY "Admin users can view all clients" 
ON public.clients 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM admin_users au 
  WHERE au.email = auth.email() 
  AND au.is_active = true
));