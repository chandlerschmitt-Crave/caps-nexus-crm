import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  state: string;
  county?: string;
  minAcreage?: number;
  maxAcreage?: number;
  bestUse?: string;
}

interface LandListing {
  source: string;
  title: string;
  address: string;
  city: string;
  state: string;
  county?: string;
  acreage?: number;
  price?: number;
  listingUrl: string;
  description?: string;
  zoning?: string;
}

async function searchZillow(params: SearchParams): Promise<LandListing[]> {
  const results: LandListing[] = [];
  
  try {
    // Zillow search URL for land
    const searchUrl = `https://www.zillow.com/homes/for_sale/${params.state}/land_type/`;
    console.log('Searching Zillow:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error('Zillow search failed:', response.status);
      return results;
    }
    
    const html = await response.text();
    
    // Parse listings from HTML (simplified - real implementation would need proper HTML parsing)
    // This is a placeholder that demonstrates the structure
    console.log('Zillow response received, parsing...');
    
    // Note: In production, you'd use a proper HTML parser
    // For now, return placeholder data structure
    
  } catch (error) {
    console.error('Zillow search error:', error);
  }
  
  return results;
}

async function searchLoopNet(params: SearchParams): Promise<LandListing[]> {
  const results: LandListing[] = [];
  
  try {
    // LoopNet search for land
    const searchUrl = `https://www.loopnet.com/search/land/for-sale/${params.state}/`;
    console.log('Searching LoopNet:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error('LoopNet search failed:', response.status);
      return results;
    }
    
    const html = await response.text();
    console.log('LoopNet response received, parsing...');
    
    // Parse LoopNet listings
    
  } catch (error) {
    console.error('LoopNet search error:', error);
  }
  
  return results;
}

async function searchRealtorCom(params: SearchParams): Promise<LandListing[]> {
  const results: LandListing[] = [];
  
  try {
    // Realtor.com search for land
    const searchUrl = `https://www.realtor.com/realestateandhomes-search/${params.state}/type-land`;
    console.log('Searching Realtor.com:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error('Realtor.com search failed:', response.status);
      return results;
    }
    
    const html = await response.text();
    console.log('Realtor.com response received, parsing...');
    
    // Parse Realtor.com listings
    
  } catch (error) {
    console.error('Realtor.com search error:', error);
  }
  
  return results;
}

// Mock results for demonstration since web scraping requires proper HTML parsing libraries
function generateMockResults(params: SearchParams): LandListing[] {
  const baseResults: LandListing[] = [
    {
      source: 'LoopNet',
      title: '80 Acres Industrial Land - Lancaster',
      address: '1234 Industrial Blvd',
      city: 'Lancaster',
      state: params.state,
      county: params.county || 'Dallas',
      acreage: 80,
      price: 6500000,
      listingUrl: 'https://www.loopnet.com/example-1',
      description: 'Prime industrial land with power access, near major highways',
      zoning: 'M-2 Industrial',
    },
    {
      source: 'Zillow',
      title: '240 Acre Development Site',
      address: '5678 County Road 100',
      city: 'Lancaster',
      state: params.state,
      county: params.county || 'Dallas',
      acreage: 240,
      price: 19200000,
      listingUrl: 'https://www.zillow.com/example-2',
      description: 'Large development opportunity with utilities available',
      zoning: 'Agricultural/Industrial',
    },
    {
      source: 'Realtor.com',
      title: '50 Acres Prime Location',
      address: '910 State Highway 45',
      city: 'Celina',
      state: params.state,
      county: params.county || 'Collin',
      acreage: 50,
      price: 4000000,
      listingUrl: 'https://www.realtor.com/example-3',
      description: 'Excellent views, suitable for luxury development',
      zoning: 'Residential',
    },
  ];
  
  // Filter by acreage
  return baseResults.filter(listing => {
    if (params.minAcreage && listing.acreage && listing.acreage < params.minAcreage) return false;
    if (params.maxAcreage && listing.acreage && listing.acreage > params.maxAcreage) return false;
    return true;
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, params, listings } = await req.json();

    if (action === 'search') {
      console.log('Searching land with params:', params);
      
      // In production, these would run actual web scraping
      // For now, using mock data to demonstrate the workflow
      const [zillowResults, loopNetResults, realtorResults] = await Promise.all([
        // searchZillow(params),
        // searchLoopNet(params),
        // searchRealtorCom(params),
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve([]),
      ]);
      
      // Use mock results for demonstration
      const allResults = generateMockResults(params);
      
      console.log(`Found ${allResults.length} listings`);
      
      return new Response(
        JSON.stringify({ success: true, listings: allResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import') {
      console.log('Importing listings:', listings.length);
      
      const importedIds: string[] = [];
      
      for (const listing of listings) {
        try {
          // Create parcel record
          const { data: parcel, error: parcelError } = await supabase
            .from('parcels')
            .insert({
              name: listing.title,
              address: listing.address,
              city: listing.city,
              state: listing.state,
              county: listing.county,
              acreage: listing.acreage,
              asking_price: listing.price,
              price_per_acre: listing.price && listing.acreage 
                ? listing.price / listing.acreage 
                : null,
              zoning_code: listing.zoning,
              listing_url: listing.listingUrl,
              status: 'Sourcing',
              prospect_notes: `Source: ${listing.source}\n${listing.description || ''}`,
            })
            .select()
            .single();

          if (parcelError) {
            console.error('Error creating parcel:', parcelError);
            continue;
          }

          importedIds.push(parcel.id);
          
          // Queue enrichment (will run async)
          console.log('Queueing enrichment for parcel:', parcel.id);
          supabase.functions.invoke('enrich-parcel', {
            body: { parcel_id: parcel.id },
          }).catch(err => console.error('Enrichment queue error:', err));
          
        } catch (error) {
          console.error('Error importing listing:', error);
        }
      }
      
      console.log(`Imported ${importedIds.length} parcels`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: importedIds.length,
          ids: importedIds 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
