import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeResult {
  lat: number;
  lng: number;
  county?: string;
  zip?: string;
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = Deno.env.get('GOOGLE_MAPS_KEY');
  if (!apiKey) {
    console.error('GOOGLE_MAPS_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.results && data.results[0]) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      let county = '';
      let zip = '';
      
      for (const component of result.address_components) {
        if (component.types.includes('administrative_area_level_2')) {
          county = component.long_name.replace(' County', '');
        }
        if (component.types.includes('postal_code')) {
          zip = component.long_name;
        }
      }

      return {
        lat: location.lat,
        lng: location.lng,
        county: county || undefined,
        zip: zip || undefined,
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}

function enrichUtilitiesByRegion(state: string, county: string): any {
  const rules: Record<string, any> = {
    TX: {
      default: {
        grid_operator: 'ERCOT',
        water_provider: 'Local Municipal',
        gas_provider: 'Atmos Energy',
        notes: 'Texas deregulated market - verify local providers',
      },
      Dallas: {
        grid_operator: 'Oncor',
        available_mw_estimate: 50,
        nearest_substation_distance_mi: 2.5,
      },
    },
    CA: {
      default: {
        grid_operator: 'CAISO',
        water_provider: 'Local Water District',
        gas_provider: 'SoCal Gas / PG&E',
        fiber_provider: 'AT&T / Frontier',
      },
    },
  };

  const stateRules = rules[state] || {};
  const countyRules = stateRules[county] || {};
  const defaultRules = stateRules.default || {};

  return { ...defaultRules, ...countyRules };
}

function enrichZoningByRegion(state: string, zoning_code?: string): any {
  const basicRules: any = {
    residential_allowed: true,
    commercial_allowed: false,
    data_center_allowed: false,
    entitlement_speed: 'Unknown - requires research',
  };

  if (zoning_code) {
    if (zoning_code.includes('M') || zoning_code.includes('I')) {
      basicRules.commercial_allowed = true;
      basicRules.data_center_allowed = true;
      basicRules.entitlement_speed = 'Fast (industrial)';
    } else if (zoning_code.includes('C')) {
      basicRules.commercial_allowed = true;
      basicRules.entitlement_speed = 'Moderate';
    }
  }

  return basicRules;
}

function calculateScores(parcel: any, utilities: any, zoning: any, rights: any, topo: any): any {
  let dcScore = 0;
  let luxScore = 0;

  // Data Center scoring
  if (utilities?.available_mw_estimate) {
    dcScore += Math.min(utilities.available_mw_estimate / 100, 1) * 40;
  }
  if (utilities?.fiber_provider) dcScore += 10;
  if (zoning?.data_center_allowed) dcScore += 15;
  if (utilities?.water_provider) dcScore += 10;
  if (topo?.road_access_score) dcScore += topo.road_access_score * 10;
  if (rights?.mineral_rights_owner === 'Owner') dcScore += 5;

  // Luxury scoring
  if (topo?.view_quality_score) luxScore += topo.view_quality_score * 35;
  if (zoning?.residential_allowed) luxScore += 15;
  if (topo?.slope_pct && topo.slope_pct < 15) luxScore += 25;
  if (rights?.easements === 'None' || !rights?.easements) luxScore += 10;
  if (utilities?.water_provider) luxScore += 10;

  return {
    score_data_center: Math.min(dcScore, 100),
    score_luxury: Math.min(luxScore, 100),
    score_updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { parcel_id } = await req.json();

    if (!parcel_id) {
      throw new Error('parcel_id is required');
    }

    console.log('Enriching parcel:', parcel_id);

    // Fetch parcel
    const { data: parcel, error: parcelError } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', parcel_id)
      .single();

    if (parcelError) throw parcelError;

    let updates: any = {};

    // 1. Geocode if missing lat/lon
    if (!parcel.latitude || !parcel.longitude) {
      const fullAddress = `${parcel.address}, ${parcel.city}, ${parcel.state} ${parcel.zip || ''}`;
      const geocoded = await geocodeAddress(fullAddress);
      
      if (geocoded) {
        updates.latitude = geocoded.lat;
        updates.longitude = geocoded.lng;
        if (geocoded.county && !parcel.county) updates.county = geocoded.county;
        if (geocoded.zip && !parcel.zip) updates.zip = geocoded.zip;
      }
    }

    // Update parcel with geocode results
    if (Object.keys(updates).length > 0) {
      await supabase.from('parcels').update(updates).eq('id', parcel_id);
      Object.assign(parcel, updates);
    }

    // 2. Enrich utilities
    const utilityData = enrichUtilitiesByRegion(parcel.state, parcel.county || '');
    const { error: utilError } = await supabase
      .from('parcel_utilities')
      .upsert({ parcel_id, ...utilityData }, { onConflict: 'parcel_id' });
    
    if (utilError) console.error('Utility upsert error:', utilError);

    // 3. Enrich zoning
    const zoningData = enrichZoningByRegion(parcel.state, parcel.zoning_code);
    const { error: zoneError } = await supabase
      .from('parcel_zoning')
      .upsert({ parcel_id, ...zoningData }, { onConflict: 'parcel_id' });
    
    if (zoneError) console.error('Zoning upsert error:', zoneError);

    // 4. Create basic rights record
    const { error: rightsError } = await supabase
      .from('parcel_rights')
      .upsert({ 
        parcel_id,
        mineral_rights_owner: 'Unknown - requires title search',
        easements: 'Unknown',
        restrictions: 'Unknown',
        notes: 'Pending research'
      }, { onConflict: 'parcel_id' });
    
    if (rightsError) console.error('Rights upsert error:', rightsError);

    // 5. Create basic topography record if missing
    const { error: topoError } = await supabase
      .from('parcel_topography')
      .upsert({ 
        parcel_id,
        road_access_score: 5,
        view_quality_score: 5,
        notes: 'Preliminary estimates'
      }, { onConflict: 'parcel_id' });
    
    if (topoError) console.error('Topo upsert error:', topoError);

    // 6. Fetch all enrichment data
    const { data: utilities } = await supabase
      .from('parcel_utilities')
      .select('*')
      .eq('parcel_id', parcel_id)
      .single();

    const { data: zoning } = await supabase
      .from('parcel_zoning')
      .select('*')
      .eq('parcel_id', parcel_id)
      .single();

    const { data: rights } = await supabase
      .from('parcel_rights')
      .select('*')
      .eq('parcel_id', parcel_id)
      .single();

    const { data: topo } = await supabase
      .from('parcel_topography')
      .select('*')
      .eq('parcel_id', parcel_id)
      .single();

    // 7. Calculate scores
    const scores = calculateScores(parcel, utilities, zoning, rights, topo);
    
    // Determine best use
    let best_use = 'Other';
    if (scores.score_data_center >= 70) best_use = 'Data_Center';
    else if (scores.score_luxury >= 70) best_use = 'Luxury';
    else if (scores.score_data_center >= 50 && scores.score_luxury >= 50) best_use = 'Mixed';

    await supabase
      .from('parcels')
      .update({ ...scores, best_use })
      .eq('id', parcel_id);

    console.log('Enrichment complete:', { parcel_id, scores, best_use });

    return new Response(
      JSON.stringify({ success: true, parcel_id, scores, best_use }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
