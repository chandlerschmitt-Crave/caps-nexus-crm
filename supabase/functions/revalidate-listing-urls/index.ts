import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL normalization by source
function normalizeListing(inputUrl: string, source: string): string {
  try {
    const u = new URL(inputUrl);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'lid', 'tracking', 'ref'];
    trackingParams.forEach(param => u.searchParams.delete(param));
    return u.origin + u.pathname;
  } catch {
    return inputUrl;
  }
}

// Verify listing URL
async function verifyListingUrl(rawUrl: string, source: string): Promise<{
  ok: boolean;
  status: 'valid' | 'invalid' | 'gone' | 'unknown';
}> {
  try {
    const normalized = normalizeListing(rawUrl, source);

    const resp = await fetch(normalized, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 CAPS Prospector' },
      signal: AbortSignal.timeout(10000),
    });

    const status = resp.status;

    if (status === 404 || status === 410) {
      return { ok: false, status: 'gone' };
    }
    if (status >= 400) {
      return { ok: false, status: 'invalid' };
    }

    return { ok: true, status: 'valid' };
  } catch (error) {
    console.error('URL verification error:', error);
    return { ok: false, status: 'invalid' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { parcel_id, limit = 300 } = await req.json();

    // Single parcel revalidation (e.g., user clicked "Report broken link")
    if (parcel_id) {
      console.log(`Revalidating parcel: ${parcel_id}`);
      
      const { data: parcel } = await supabase
        .from('parcels')
        .select('source_name, canonical_url')
        .eq('id', parcel_id)
        .single();

      if (!parcel || !parcel.canonical_url) {
        return new Response(
          JSON.stringify({ error: 'Parcel not found or no URL' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const verification = await verifyListingUrl(parcel.canonical_url, parcel.source_name || 'other');
      
      await supabase
        .from('parcels')
        .update({
          url_status: verification.status,
          url_last_checked: new Date().toISOString(),
        })
        .eq('id', parcel_id);

      console.log(`Parcel ${parcel_id} revalidated: ${verification.status}`);

      return new Response(
        JSON.stringify({
          success: true,
          parcel_id,
          status: verification.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch revalidation (weekly cron job)
    console.log(`Starting batch revalidation (limit: ${limit})`);

    const { data: parcels } = await supabase
      .from('parcels')
      .select('id, source_name, canonical_url, url_last_checked, created_at')
      .in('url_status', ['valid', 'unknown'])
      .not('canonical_url', 'is', null)
      .order('url_last_checked', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (!parcels || parcels.length === 0) {
      console.log('No parcels to revalidate');
      return new Response(
        JSON.stringify({ success: true, revalidated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let revalidated = 0;
    let failed = 0;

    for (const parcel of parcels) {
      try {
        const verification = await verifyListingUrl(parcel.canonical_url!, parcel.source_name || 'other');
        
        await supabase
          .from('parcels')
          .update({
            url_status: verification.status,
            url_last_checked: new Date().toISOString(),
          })
          .eq('id', parcel.id);

        revalidated++;
        
        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to revalidate parcel ${parcel.id}:`, error);
        failed++;
      }
    }

    console.log(`Batch revalidation complete: ${revalidated} success, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        revalidated,
        failed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in revalidate-listing-urls:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
