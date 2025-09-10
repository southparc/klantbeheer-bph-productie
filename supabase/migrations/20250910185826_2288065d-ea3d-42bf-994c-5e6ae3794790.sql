-- Add policy to allow admin users to view all advisors
CREATE POLICY "Admin users can view all advisors" 
ON public.advisors 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users au 
  WHERE au.email = auth.email() AND au.is_active = true
));