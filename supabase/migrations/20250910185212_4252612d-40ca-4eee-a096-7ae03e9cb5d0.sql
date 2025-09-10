-- Add missing admin users
INSERT INTO public.admin_users (email, name, is_active) 
VALUES 
  ('judith@southparc.nl', 'judith', true),
  ('diederik.klaassen@mac.com', 'diederik.klaassen', true)
ON CONFLICT (email) DO NOTHING;