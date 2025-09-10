-- Grant execute permission on full_client_v2 function to authenticated users
GRANT EXECUTE ON FUNCTION public.full_client_v2(text) TO authenticated;