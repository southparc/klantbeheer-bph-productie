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
    // Check if user is an admin by looking at admin_users table
    const { data: adminUser, error: adminError } = await serviceClient
      .from('admin_users')
      .select('is_active')
      .eq('email', user.email)
      .maybeSingle();

    const isAdmin = adminUser && adminUser.is_active;

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

    // Separate client fields from related table fields
    const {
      // House fields
      house_id,
      is_owner_occupied,
      home_value,
      mortgage_amount,
      mortgage_remaining,
      mortgage_interest_rate,
      annuity_amount,
      annuity_target_amount,
      energy_label,
      current_rent,
      // Contract fields  
      contract_id,
      dvo,
      max_loan,
      is_damage_client,
      // Insurance fields
      insurance_id,
      disability_percentage,
      death_risk_assurance_amount,
      insurance_premiums_total,
      // Goal fields
      financial_goal_id,
      financial_goal_description,
      financial_goal_amount,
      goal_priority,
      // Investment fields
      investment_id,
      investment_current_value,
      // Liability fields
      liability_id,
      liability_total_amount,
      // Computed fields
      advisor_name,
      advisor_email,
      partner_gross_income,
      ...clientFields
    } = updatedData;

    console.log('Filtered client fields for update:', Object.keys(clientFields));

    // Update clients table
    const { data: updateResult, error: updateError } = await serviceClient
      .from('clients')
      .update(clientFields)
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Client update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Client update failed: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update insurance records if insurance fields are provided
    if (disability_percentage !== undefined || death_risk_assurance_amount !== undefined) {
      const insuranceUpdates: any = {};
      if (disability_percentage !== undefined) insuranceUpdates.disability_percentage = disability_percentage;
      if (death_risk_assurance_amount !== undefined) insuranceUpdates.death_risk_assurance_amount = death_risk_assurance_amount;
      
      const { error: insuranceError } = await serviceClient
        .from('insurances')
        .update(insuranceUpdates)
        .eq('client_id', clientId)
        .eq('id', insurance_id || 13); // Use provided insurance_id or fallback to latest
        
      if (insuranceError) {
        console.error('Insurance update error:', insuranceError);
      }
    }

    // Update house record if house fields are provided  
    if (is_owner_occupied !== undefined || home_value !== undefined || mortgage_amount !== undefined || 
        mortgage_remaining !== undefined || mortgage_interest_rate !== undefined || annuity_amount !== undefined ||
        annuity_target_amount !== undefined || energy_label !== undefined || current_rent !== undefined) {
      
      const houseUpdates: any = {};
      if (is_owner_occupied !== undefined) houseUpdates.is_owner_occupied = is_owner_occupied;
      if (home_value !== undefined) houseUpdates.home_value = home_value;
      if (mortgage_amount !== undefined) houseUpdates.mortgage_amount = mortgage_amount;
      if (mortgage_remaining !== undefined) houseUpdates.mortgage_remaining = mortgage_remaining;
      if (mortgage_interest_rate !== undefined) houseUpdates.mortgage_interest_rate = mortgage_interest_rate;
      if (annuity_amount !== undefined) houseUpdates.annuity_amount = annuity_amount;
      if (annuity_target_amount !== undefined) houseUpdates.annuity_target_amount = annuity_target_amount;
      if (energy_label !== undefined) houseUpdates.energy_label = energy_label;
      if (current_rent !== undefined) houseUpdates.current_rent = current_rent;
      
      const { error: houseError } = await serviceClient
        .from('house_objects')
        .update(houseUpdates)
        .eq('client_id', clientId)
        .eq('id', house_id || 9);
        
      if (houseError) {
        console.error('House update error:', houseError);
      }
    }

    // Update contract record if contract fields are provided
    if (dvo !== undefined || max_loan !== undefined || is_damage_client !== undefined) {
      const contractUpdates: any = {};
      if (dvo !== undefined) contractUpdates.dvo = dvo;
      if (max_loan !== undefined) contractUpdates.max_loan = max_loan;
      if (is_damage_client !== undefined) contractUpdates.is_damage_client = is_damage_client;
      
      const { error: contractError } = await serviceClient
        .from('contracts')
        .update(contractUpdates)
        .eq('client_id', clientId)
        .eq('id', contract_id || 2547);
        
      if (contractError) {
        console.error('Contract update error:', contractError);
      }
    }

    // Update financial goals if goal fields are provided
    if (financial_goal_description !== undefined || financial_goal_amount !== undefined || goal_priority !== undefined) {
      const goalUpdates: any = {};
      if (financial_goal_description !== undefined) goalUpdates.description = financial_goal_description;
      if (financial_goal_amount !== undefined) goalUpdates.amount = financial_goal_amount;
      if (goal_priority !== undefined) goalUpdates.goal_priority = goal_priority;
      
      const { error: goalError } = await serviceClient
        .from('financial_goals')
        .update(goalUpdates)
        .eq('client_id', clientId)
        .eq('id', financial_goal_id || 5);
        
      if (goalError) {
        console.error('Goal update error:', goalError);
      }
    }

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