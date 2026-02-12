import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const updateClientSchema = z.object({
  clientId: z.string().uuid(),
  updatedData: z.object({
    // Client fields
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(50).optional(),
    company: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    zip: z.string().max(20).optional(),
    prefix: z.string().max(20).optional(),
    initials: z.string().max(20).optional(),
    gender: z.enum(['male', 'female', 'other', 'M', 'F', 'O', '']).optional().nullable(),
    birth_date: z.string().max(50).optional().nullable(),
    age: z.number().int().min(0).max(150).optional().nullable(),
    employment_type: z.string().max(100).optional().nullable(),
    risk_profile: z.string().max(100).optional().nullable(),
    planning_status: z.string().max(100).optional().nullable(),
    gross_income: z.number().min(0).optional().nullable(),
    net_monthly_income: z.number().optional().nullable(),
    net_monthly_spending: z.number().optional().nullable(),
    monthly_fixed_costs: z.number().optional().nullable(),
    monthly_variable_costs: z.number().optional().nullable(),
    pension_income: z.number().optional().nullable(),
    saving_balance: z.number().optional().nullable(),
    investment_balance: z.number().optional().nullable(),
    consumer_credit_amount: z.number().optional().nullable(),
    retirement_target_age: z.number().int().min(0).max(150).optional().nullable(),
    advisor_id: z.number().int().optional().nullable(),
    
    // House fields
    house_id: z.number().int().optional(),
    is_owner_occupied: z.boolean().optional(),
    home_value: z.number().min(0).optional().nullable(),
    mortgage_amount: z.number().min(0).optional().nullable(),
    mortgage_remaining: z.number().min(0).optional().nullable(),
    mortgage_interest_rate: z.number().min(0).max(100).optional().nullable(),
    annuity_amount: z.number().optional().nullable(),
    annuity_target_amount: z.number().optional().nullable(),
    energy_label: z.string().max(10).optional().nullable(),
    current_rent: z.number().min(0).optional().nullable(),
    
    // Contract fields
    contract_id: z.number().int().optional(),
    dvo: z.number().optional().nullable(),
    max_loan: z.number().optional().nullable(),
    is_damage_client: z.boolean().optional(),
    
    // Insurance fields
    insurance_id: z.number().int().optional(),
    disability_percentage: z.number().min(0).max(100).optional().nullable(),
    death_risk_assurance_amount: z.number().min(0).optional().nullable(),
    insurance_premiums_total: z.number().optional().nullable(),
    
    // Goal fields
    financial_goal_id: z.number().int().optional(),
    financial_goal_description: z.string().max(500).optional().nullable(),
    financial_goal_amount: z.number().optional().nullable(),
    goal_priority: z.string().max(50).optional().nullable(),
    
    // Investment fields
    investment_id: z.number().int().optional(),
    investment_current_value: z.number().optional().nullable(),
    
    // Liability fields
    liability_id: z.number().int().optional(),
    liability_total_amount: z.number().optional().nullable(),
    
    // Computed/readonly fields (ignored but allowed in input)
    advisor_name: z.string().optional(),
    advisor_email: z.string().optional(),
    partner_gross_income: z.number().optional().nullable(),
  }).passthrough(), // Allow extra fields but they'll be filtered
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // Validate input with zod
    const parseResult = updateClientSchema.safeParse(requestBody);
    if (!parseResult.success) {
      console.error('Validation error:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { clientId, updatedData } = parseResult.data;

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from authorization header
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('SERVICE_ROLE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify JWT token and get user info
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

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

    if (!isAdmin && !isClientOwner) {
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

    // --- Upsert helper: update existing record or insert new one ---
    async function upsertChild(
      table: string,
      clientId: string,
      updates: Record<string, unknown>,
      existingId?: number,
      extraFilter?: { column: string; value: unknown }
    ) {
      if (existingId) {
        const { error } = await serviceClient
          .from(table)
          .update(updates)
          .eq('id', existingId);
        if (error) console.error(`${table} update error:`, error);
      } else {
        let query = serviceClient.from(table).select('id').eq('client_id', clientId);
        if (extraFilter) query = query.eq(extraFilter.column, extraFilter.value);
        const { data: existing } = await query.limit(1);

        if (existing && existing.length > 0) {
          const { error } = await serviceClient
            .from(table)
            .update(updates)
            .eq('id', existing[0].id);
          if (error) console.error(`${table} update error:`, error);
        } else {
          const { error } = await serviceClient
            .from(table)
            .insert({ client_id: clientId, ...updates });
          if (error) console.error(`${table} insert error:`, error);
        }
      }
    }

    // Update insurance records if insurance fields are provided
    if (disability_percentage !== undefined || death_risk_assurance_amount !== undefined) {
      const insuranceUpdates: Record<string, unknown> = {};
      if (disability_percentage !== undefined) insuranceUpdates.disability_percentage = disability_percentage;
      if (death_risk_assurance_amount !== undefined) insuranceUpdates.death_risk_assurance_amount = death_risk_assurance_amount;
      await upsertChild('insurances', clientId, insuranceUpdates, insurance_id);
    }

    // Update insurance premiums (separate record with type=total_premiums)
    if (insurance_premiums_total !== undefined) {
      await upsertChild('insurances', clientId,
        { value: insurance_premiums_total, type: 'total_premiums', display_name: 'Totaal premies' },
        undefined,
        { column: 'type', value: 'total_premiums' }
      );
    }

    // Update house record if house fields are provided
    if (is_owner_occupied !== undefined || home_value !== undefined || mortgage_amount !== undefined ||
        mortgage_remaining !== undefined || mortgage_interest_rate !== undefined || annuity_amount !== undefined ||
        annuity_target_amount !== undefined || energy_label !== undefined || current_rent !== undefined) {

      const houseUpdates: Record<string, unknown> = {};
      if (is_owner_occupied !== undefined) houseUpdates.is_owner_occupied = is_owner_occupied;
      if (home_value !== undefined) houseUpdates.home_value = home_value;
      if (mortgage_amount !== undefined) houseUpdates.mortgage_amount = mortgage_amount;
      if (mortgage_remaining !== undefined) houseUpdates.mortgage_remaining = mortgage_remaining;
      if (mortgage_interest_rate !== undefined) houseUpdates.mortgage_interest_rate = mortgage_interest_rate;
      if (annuity_amount !== undefined) houseUpdates.annuity_amount = annuity_amount;
      if (annuity_target_amount !== undefined) houseUpdates.annuity_target_amount = annuity_target_amount;
      if (energy_label !== undefined) houseUpdates.energy_label = energy_label;
      if (current_rent !== undefined) houseUpdates.current_rent = current_rent;
      await upsertChild('house_objects', clientId, houseUpdates, house_id);
    }

    // Update contract record if contract fields are provided
    if (dvo !== undefined || max_loan !== undefined || is_damage_client !== undefined) {
      const contractUpdates: Record<string, unknown> = {};
      if (dvo !== undefined) contractUpdates.dvo = dvo;
      if (max_loan !== undefined) contractUpdates.max_loan = max_loan;
      if (is_damage_client !== undefined) contractUpdates.is_damage_client = is_damage_client;
      await upsertChild('contracts', clientId, contractUpdates, contract_id);
    }

    // Update financial goals if goal fields are provided
    if (financial_goal_description !== undefined || financial_goal_amount !== undefined || goal_priority !== undefined) {
      const goalUpdates: Record<string, unknown> = {};
      if (financial_goal_description !== undefined) goalUpdates.description = financial_goal_description;
      if (financial_goal_amount !== undefined) goalUpdates.amount = financial_goal_amount;
      if (goal_priority !== undefined) goalUpdates.goal_priority = goal_priority;
      await upsertChild('financial_goals', clientId, goalUpdates, financial_goal_id);
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
