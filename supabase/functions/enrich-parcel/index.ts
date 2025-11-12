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
  formatted_address: string;
}

function normalizeAddress(p: any): string {
  return `${(p.address||'').trim()}|${(p.city||'').trim()}|${(p.state||'').trim()}|${(p.zip||'').trim()}`.toLowerCase();
}

async function sha1(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function geocodeAddress(supabase: any, parcel: any): Promise<GeocodeResult | null> {
  const apiKey = Deno.env.get('GOOGLE_MAPS_KEY');
  if (!apiKey) {
    console.error('GOOGLE_MAPS_KEY not configured');
    return null;
  }

  // Check cache first
  const addr = normalizeAddress(parcel);
  const addressHash = await sha1(addr);
  
  const { data: cached } = await supabase
    .from('geocode_cache')
    .select('*')
    .eq('address_hash', addressHash)
    .maybeSingle();

  if (cached && !parcel.force_refresh) {
    console.log('Using cached geocode for:', parcel.address);
    return {
      lat: cached.lat,
      lng: cached.lon,
      county: cached.county,
      zip: cached.zip,
      formatted_address: cached.formatted_address
    };
  }

  try {
    const fullAddress = `${parcel.address}, ${parcel.city}, ${parcel.state} ${parcel.zip || ''}`;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
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

      // Cache the result
      await supabase.from('geocode_cache').upsert({
        address_hash: addressHash,
        formatted_address: result.formatted_address,
        lat: location.lat,
        lon: location.lng,
        county: county || null,
        zip: zip || null,
        raw: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'address_hash' });

      return {
        lat: location.lat,
        lng: location.lng,
        county: county || undefined,
        zip: zip || undefined,
        formatted_address: result.formatted_address
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}

async function enrichUtilitiesByRegion(supabase: any, parcel: any, existingUtilities: any): Promise<any> {
  // Never overwrite explicit listing data
  if (existingUtilities?.available_mw_source === 'listing') {
    console.log('Skipping MW inference - explicit listing data present');
    return {};
  }

  const state = parcel.state;
  const county = parcel.county || '';
  
  // Substation reference data for proximity heuristics
  const substationData: Record<string, any> = {
    'Dallas': { name: 'Oncor Lancaster Sub', distance_mi: 2.5, typical_mw: 50 },
    'Collin': { name: 'Oncor McKinney Sub', distance_mi: 3.0, typical_mw: 40 },
  };

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
        throttling_risk: 'low',
        throttling_source: 'region',
        throttling_confidence: 'medium',
      },
    },
    CA: {
      default: {
        grid_operator: 'CAISO',
        water_provider: 'Local Water District',
        gas_provider: 'SoCal Gas / PG&E',
        fiber_provider: 'AT&T / Frontier',
        throttling_risk: 'high',
        throttling_source: 'region',
        throttling_confidence: 'high',
      },
    },
  };

  const stateRules = rules[state] || {};
  const countyRules = stateRules[county] || {};
  const defaultRules = stateRules.default || {};
  
  const enriched = { ...defaultRules, ...countyRules };

  // Proximity-based MW inference
  if (!existingUtilities?.available_mw_estimate && substationData[county]) {
    const sub = substationData[county];
    enriched.nearest_substation_name = sub.name;
    enriched.nearest_substation_distance_mi = sub.distance_mi;
    enriched.available_mw_estimate = sub.typical_mw;
    enriched.available_mw_source = 'proximity';
    enriched.available_mw_confidence = 'low';
    enriched.available_mw_evidence = `Inferred from ${sub.name} proximity`;
  }

  return enriched;
}

async function enrichZoningRights(supabase: any, parcel_id: string, parcel: any): Promise<void> {
  const zoning_code = parcel.zoning_code;
  
  const zoningRules: any = {
    residential_allowed: true,
    commercial_allowed: false,
    data_center_allowed: false,
    entitlement_speed: 'Unknown - requires research',
  };

  if (zoning_code) {
    if (zoning_code.includes('M') || zoning_code.includes('I')) {
      zoningRules.commercial_allowed = true;
      zoningRules.data_center_allowed = true;
      zoningRules.entitlement_speed = 'Fast (industrial)';
    } else if (zoning_code.includes('C')) {
      zoningRules.commercial_allowed = true;
      zoningRules.entitlement_speed = 'Moderate';
    }
  }

  await supabase
    .from('parcel_zoning')
    .upsert({ parcel_id, ...zoningRules }, { onConflict: 'parcel_id' });

  // Check for explicit mineral rights in listing
  const listingText = parcel.prospect_notes || '';
  const hasMineralRights = /mineral\s+rights\s+(included|conveyed|retained)/i.test(listingText);
  
  const rightsData: any = {
    parcel_id,
    easements: 'Unknown',
    restrictions: 'Unknown',
  };

  if (hasMineralRights) {
    rightsData.mineral_rights_owner = 'Seller/Owner';
    rightsData.mineral_rights_source = 'listing';
    rightsData.mineral_rights_confidence = 'high';
    rightsData.mineral_rights_evidence = 'Explicitly stated in listing text';
  } else {
    rightsData.mineral_rights_owner = 'Unknown - requires title search';
    rightsData.mineral_rights_source = 'default';
    rightsData.mineral_rights_confidence = 'unknown';
    
    // Auto-create verification task
    await supabase.from('tasks').insert({
      subject: `Verify mineral rights: ${parcel.name || parcel.address}`,
      related_type: 'parcel',
      related_id: parcel_id,
      status: 'Not_Started',
      priority: 'Med',
      owner_user_id: parcel.created_by || parcel.prospect_owner,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }

  await supabase
    .from('parcel_rights')
    .upsert(rightsData, { onConflict: 'parcel_id' });
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

    // Check if enrichment needed
    const { data: settings } = await supabase.from('ops_settings').select('*');
    const settingsMap = (settings || []).reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    
    const onlyWhenMissing = settingsMap.ENRICH_ONLY_WHEN_MISSING === 'true';

    // 1. Geocode if missing or forced
    if (!parcel.latitude || !parcel.longitude || parcel.force_refresh) {
      const geocoded = await geocodeAddress(supabase, parcel);
      
      if (geocoded) {
        const addr = normalizeAddress(parcel);
        updates.latitude = geocoded.lat;
        updates.longitude = geocoded.lng;
        updates.address_hash = await sha1(addr);
        if (geocoded.county && !parcel.county) updates.county = geocoded.county;
        if (geocoded.zip && !parcel.zip) updates.zip = geocoded.zip;
      }
    }

    // Update parcel with geocode results
    if (Object.keys(updates).length > 0) {
      await supabase.from('parcels').update(updates).eq('id', parcel_id);
      Object.assign(parcel, updates);
    }

    // 2. Enrich utilities (check existing first)
    const { data: existingUtil } = await supabase
      .from('parcel_utilities')
      .select('*')
      .eq('parcel_id', parcel_id)
      .maybeSingle();

    const utilityData = await enrichUtilitiesByRegion(supabase, parcel, existingUtil);
    if (Object.keys(utilityData).length > 0) {
      await supabase
        .from('parcel_utilities')
        .upsert({ parcel_id, ...utilityData }, { onConflict: 'parcel_id' });
    }

    // 3. Enrich zoning & rights (with smart mineral rights detection)
    await enrichZoningRights(supabase, parcel_id, parcel);

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
      .update({ 
        ...scores, 
        best_use,
        enrichment_status: 'ok',
        last_enriched_at: new Date().toISOString(),
        force_refresh: false
      })
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
