import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, parcel_id, user_id, reason } = await req.json();

    if (!action || !parcel_id) {
      throw new Error('action and parcel_id are required');
    }

    console.log('Parcel workflow action:', { action, parcel_id, user_id });

    // Fetch parcel with related data
    const { data: parcel, error: parcelError } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', parcel_id)
      .single();

    if (parcelError) throw parcelError;

    switch (action) {
      case 'createProjectDraft': {
        // Determine project type based on best_use
        let project_type = 'AI_Data_Center';
        if (parcel.best_use === 'Luxury') project_type = 'Luxury_Res';

        // Find or create account
        let account_id = null;
        const accountName = parcel.name || 'Land Intelligence';
        
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('name', accountName)
          .single();

        if (existingAccount) {
          account_id = existingAccount.id;
        } else {
          const { data: newAccount, error: accountError } = await supabase
            .from('accounts')
            .insert({ name: accountName, type_of_account: 'Land' })
            .select('id')
            .single();
          
          if (accountError) throw accountError;
          account_id = newAccount.id;
        }

        // Create project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: parcel.name || `${parcel.city} ${parcel.state} Project`,
            project_type,
            stage: 'Ideation',
            market: `${parcel.city}, ${parcel.state}`,
            account_id,
            description: `Generated from parcel: ${parcel.address}`,
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Create deal at Prospecting stage
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .insert({
            name: `${parcel.name || parcel.address} - Prospecting`,
            stage: 'Prospecting',
            instrument: 'Equity',
            source: 'Land Intelligence',
            account_id,
            project_id: project.id,
            owner_user_id: user_id || parcel.prospect_owner,
            notes: `Parcel: ${parcel.apn || parcel.address}`,
          })
          .select()
          .single();

        if (dealError) throw dealError;

        // Update parcel
        await supabase
          .from('parcels')
          .update({
            status: 'Prospecting',
            project_id: project.id,
            deal_id: deal.id,
            prospect_owner: user_id || parcel.prospect_owner,
          })
          .eq('id', parcel_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            project_id: project.id, 
            deal_id: deal.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'qualify': {
        // Update parcel to Qualified
        await supabase
          .from('parcels')
          .update({ status: 'Qualified' })
          .eq('id', parcel_id);

        // Update deal to Intro stage
        if (parcel.deal_id) {
          await supabase
            .from('deals')
            .update({ stage: 'Intro' })
            .eq('id', parcel.deal_id);
        }

        // Create follow-up task
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);

        await supabase
          .from('tasks')
          .insert({
            subject: 'Send intro materials / request utility confirms',
            status: 'Not_Started',
            priority: 'High',
            due_date: dueDate.toISOString().split('T')[0],
            owner_user_id: user_id || parcel.prospect_owner,
            related_type: 'parcel',
            related_id: parcel_id,
          });

        return new Response(
          JSON.stringify({ success: true, status: 'Qualified' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disqualify': {
        // Update parcel to Rejected
        await supabase
          .from('parcels')
          .update({ 
            status: 'Rejected',
            prospect_notes: reason || 'Disqualified'
          })
          .eq('id', parcel_id);

        // Update deal to Closed_Lost
        if (parcel.deal_id) {
          await supabase
            .from('deals')
            .update({ 
              stage: 'Closed_Lost',
              notes: `Disqualified: ${reason || 'No reason provided'}`
            })
            .eq('id', parcel.deal_id);
        }

        return new Response(
          JSON.stringify({ success: true, status: 'Rejected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
