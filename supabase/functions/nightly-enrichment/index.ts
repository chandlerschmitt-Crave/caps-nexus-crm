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

    console.log('Starting nightly enrichment job...');

    // Get settings
    const { data: settings } = await supabase.from('ops_settings').select('*');
    const settingsMap = (settings || []).reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const LIMIT = parseInt(settingsMap.GEOCODE_NIGHTLY_LIMIT || '200', 10);
    console.log(`Processing max ${LIMIT} parcels tonight`);

    // Find parcels needing enrichment
    const { data: parcels } = await supabase
      .from('parcels')
      .select('id')
      .or('latitude.is.null,longitude.is.null,force_refresh.eq.true,enrichment_status.eq.pending')
      .order('created_at', { ascending: true })
      .limit(LIMIT);

    if (!parcels || parcels.length === 0) {
      console.log('No parcels need enrichment');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No parcels need enrichment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${parcels.length} parcels to enrich`);

    let successCount = 0;
    let errorCount = 0;

    for (const parcel of parcels) {
      try {
        console.log(`Enriching parcel ${parcel.id}`);
        
        const { error } = await supabase.functions.invoke('enrich-parcel', {
          body: { parcel_id: parcel.id }
        });

        if (error) {
          console.error(`Error enriching ${parcel.id}:`, error);
          errorCount++;
          
          // Mark as error
          await supabase
            .from('parcels')
            .update({
              enrichment_status: 'error',
              last_enriched_at: new Date().toISOString()
            })
            .eq('id', parcel.id);
        } else {
          successCount++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Exception enriching ${parcel.id}:`, error);
        errorCount++;
      }
    }

    // Stale prospect detection (7 days no activity)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: staleParcels } = await supabase
      .from('parcels')
      .select('id, name, address, prospect_owner')
      .in('status', ['Prospecting', 'Qualified'])
      .order('created_at', { ascending: true });

    if (staleParcels && staleParcels.length > 0) {
      for (const parcel of staleParcels) {
        // Check for recent activities
        const { data: recentActivities } = await supabase
          .from('activities')
          .select('id')
          .eq('what_type', 'parcel')
          .eq('what_id', parcel.id)
          .gte('activity_date', sevenDaysAgo)
          .limit(1);

        if (!recentActivities || recentActivities.length === 0) {
          // No recent activity - create nudge task
          const nextBusinessDay = new Date();
          nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
          
          await supabase.from('tasks').insert({
            subject: `Nudge: Confirm utilities/zoning for ${parcel.name || parcel.address}`,
            related_type: 'parcel',
            related_id: parcel.id,
            status: 'Not_Started',
            priority: 'Med',
            owner_user_id: parcel.prospect_owner,
            due_date: nextBusinessDay.toISOString().split('T')[0]
          });
          
          console.log(`Created nudge task for stale parcel ${parcel.id}`);
        }
      }
    }

    console.log(`Nightly enrichment complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: parcels.length,
        successCount,
        errorCount,
        staleParcelsProcessed: staleParcels?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Nightly enrichment error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
