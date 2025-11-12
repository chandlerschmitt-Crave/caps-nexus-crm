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

async function findNearbySubstations(lat: number, lon: number, radiusKm: number = 25): Promise<any[]> {
  // OpenStreetMap Overpass API query for substations
  const query = `
    [out:json][timeout:25];
    (
      node["power"="substation"](around:${radiusKm * 1000},${lat},${lon});
      way["power"="substation"](around:${radiusKm * 1000},${lat},${lon});
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    });
    
    const data = await response.json();
    
    const substations = (data.elements || []).map((el: any) => {
      const distance = haversineDistance(lat, lon, el.lat || el.center?.lat, el.lon || el.center?.lon);
      return {
        name: el.tags?.name || 'Unknown Substation',
        voltage: el.tags?.voltage || null,
        operator: el.tags?.operator || null,
        distance_mi: distance,
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon
      };
    });

    return substations.sort((a: any, b: any) => a.distance_mi - b.distance_mi);
  } catch (error) {
    console.error('OpenStreetMap query error:', error);
    return [];
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function enrichUtilitiesByRegion(supabase: any, parcel: any, existingUtilities: any): Promise<any> {
  // Never overwrite explicit listing data
  if (existingUtilities?.available_mw_source === 'listing') {
    console.log('Skipping MW inference - explicit listing data present');
    return {};
  }

  const state = parcel.state;
  const county = parcel.county || '';
  
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

  // Use OpenStreetMap to find real substations if we have coordinates
  if (parcel.latitude && parcel.longitude && !existingUtilities?.nearest_substation_name) {
    console.log('Querying OpenStreetMap for nearby substations...');
    const substations = await findNearbySubstations(parcel.latitude, parcel.longitude);
    
    if (substations.length > 0) {
      const nearest = substations[0];
      enriched.nearest_substation_name = nearest.name;
      enriched.nearest_substation_distance_mi = Math.round(nearest.distance_mi * 10) / 10;
      
      // Estimate MW based on voltage
      if (nearest.voltage) {
        const voltage = parseInt(nearest.voltage.split(';')[0]);
        let estimatedMW = 10;
        if (voltage >= 500000) estimatedMW = 200;
        else if (voltage >= 345000) estimatedMW = 150;
        else if (voltage >= 230000) estimatedMW = 100;
        else if (voltage >= 138000) estimatedMW = 50;
        else if (voltage >= 69000) estimatedMW = 25;
        
        enriched.available_mw_estimate = estimatedMW;
        enriched.available_mw_source = 'osm_voltage';
        enriched.available_mw_confidence = 'medium';
        enriched.available_mw_evidence = `Based on ${voltage}V substation within ${nearest.distance_mi.toFixed(1)}mi`;
      }
      
      if (nearest.operator) {
        enriched.grid_operator = nearest.operator;
      }
    }
  }

  return enriched;
}

async function enrichTopographyFromUSGS(lat: number, lon: number): Promise<any> {
  try {
    // USGS Elevation Point Query Service (free)
    const elevationUrl = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&output=json`;
    const response = await fetch(elevationUrl);
    const data = await response.json();
    
    if (data.value && data.value.length > 0) {
      const elevation = data.value[0].value;
      
      // Query surrounding points to calculate slope
      const points = [
        { lat: lat + 0.001, lon },
        { lat: lat - 0.001, lon },
        { lat, lon: lon + 0.001 },
        { lat, lon: lon - 0.001 }
      ];
      
      const elevations = await Promise.all(
        points.map(async (p) => {
          try {
            const res = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${p.lon}&y=${p.lat}&units=Feet&output=json`);
            const d = await res.json();
            return d.value?.[0]?.value || elevation;
          } catch {
            return elevation;
          }
        })
      );
      
      const maxDiff = Math.max(...elevations.map(e => Math.abs(e - elevation)));
      const slope = (maxDiff / 364) * 100; // 364 feet ≈ distance for 0.001 degree
      
      // Estimate view quality based on elevation (higher = better views)
      const viewScore = elevation > 1000 ? 8 : elevation > 500 ? 6 : 4;
      
      // Road access heuristic (flatter = better access)
      const roadScore = slope < 5 ? 9 : slope < 10 ? 7 : slope < 15 ? 5 : 3;
      
      return {
        elevation_ft: Math.round(elevation),
        slope_pct: Math.round(slope * 10) / 10,
        view_quality_score: viewScore,
        road_access_score: roadScore
      };
    }
  } catch (error) {
    console.error('USGS elevation query error:', error);
  }
  
  return null;
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

    // 5. Enrich topography with USGS Elevation API
    if (parcel.latitude && parcel.longitude) {
      const topoData = await enrichTopographyFromUSGS(parcel.latitude, parcel.longitude);
      
      if (topoData) {
        await supabase
          .from('parcel_topography')
          .upsert({ 
            parcel_id,
            ...topoData
          }, { onConflict: 'parcel_id' });
      }
    } else {
      // Create basic record if no coordinates
      await supabase
        .from('parcel_topography')
        .upsert({ 
          parcel_id,
          road_access_score: 5,
          view_quality_score: 5,
        }, { onConflict: 'parcel_id' });
    }

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
