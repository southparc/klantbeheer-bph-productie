import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, updatedData } = await req.json();

    if (!clientId || !updatedData) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId or updatedData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create regular client to verify user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const regularClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is authenticated and get their info
    const { data: { user }, error: authError } = await regularClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

    // Create service role client for elevated database access
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('SERVICE_ROLE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if user has permission to update this client
    // For now, we'll check if the user is an admin or if they're associated with this client
    const { data: userRoles, error: roleError } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(role => role.role === 'admin');

    // Also check if user is the client's assigned advisor or the client themselves
    const { data: clientData, error: clientError } = await serviceClient
      .from('clients')
      .select('supabase_auth_id, advisor_id')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to update this client
    const isClientOwner = clientData.supabase_auth_id === user.id;
    const isAssignedAdvisor = clientData.advisor_id && (await serviceClient
      .from('advisors')
      .select('user_id')
      .eq('id', clientData.advisor_id)
      .single()).data?.user_id === user.id;

    if (!isAdmin && !isClientOwner && !isAssignedAdvisor) {
      console.log('Permission denied for user:', user.id, 'on client:', clientId);
      return new Response(
        JSON.stringify({ error: 'Permission denied: You are not authorized to update this client' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Permission granted for user:', user.id, 'to update client:', clientId);

    // Perform the update with service role client (bypasses RLS)
    const { data: updateResult, error: updateError } = await serviceClient
      .from('clients')
      .update(updatedData)
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Update failed: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully updated client:', clientId);

    return new Response(
      JSON.stringify({ data: updateResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in update-client-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});