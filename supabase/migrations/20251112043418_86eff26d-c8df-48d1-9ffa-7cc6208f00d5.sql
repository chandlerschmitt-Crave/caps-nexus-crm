-- Add Prospecting to deal_stage enum
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Prospecting';

-- Create parcels table
CREATE TABLE IF NOT EXISTS public.parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  apn text,
  status text CHECK (status IN ('Sourcing','Prospecting','Qualified','Rejected','Under_Contract','Closed')) DEFAULT 'Prospecting',
  address text,
  city text,
  state text,
  county text,
  zip text,
  latitude double precision,
  longitude double precision,
  acreage numeric,
  asking_price numeric,
  price_per_acre numeric,
  zoning_code text,
  zoning_desc text,
  entitlement_notes text,
  listing_url text,
  best_use text CHECK (best_use IN ('Data_Center','Luxury','Mixed','Other')),
  score_data_center numeric,
  score_luxury numeric,
  score_updated_at timestamptz,
  project_id uuid REFERENCES public.projects(id),
  deal_id uuid REFERENCES public.deals(id),
  prospect_owner uuid REFERENCES auth.users(id),
  prospect_confidence_pct numeric,
  prospect_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create parcel_utilities table
CREATE TABLE IF NOT EXISTS public.parcel_utilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES public.parcels(id) ON DELETE CASCADE,
  grid_operator text,
  nearest_substation_name text,
  nearest_substation_distance_mi numeric,
  available_mw_estimate numeric,
  peak_season_constraints text,
  water_provider text,
  gas_provider text,
  fiber_provider text,
  notes text
);

-- Create parcel_zoning table
CREATE TABLE IF NOT EXISTS public.parcel_zoning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES public.parcels(id) ON DELETE CASCADE,
  zoning_type text,
  residential_allowed boolean,
  commercial_allowed boolean,
  data_center_allowed boolean,
  max_height_ft numeric,
  lot_coverage_pct numeric,
  overlay_fire boolean,
  overlay_flood boolean,
  overlay_coastal boolean,
  entitlement_speed text,
  references_url text
);

-- Create parcel_rights table
CREATE TABLE IF NOT EXISTS public.parcel_rights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES public.parcels(id) ON DELETE CASCADE,
  mineral_rights_owner text,
  easements text,
  restrictions text,
  notes text
);

-- Create parcel_topography table
CREATE TABLE IF NOT EXISTS public.parcel_topography (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES public.parcels(id) ON DELETE CASCADE,
  elevation_ft numeric,
  slope_pct numeric,
  road_access_score numeric,
  view_quality_score numeric
);

-- Create parcel_images table
CREATE TABLE IF NOT EXISTS public.parcel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES public.parcels(id) ON DELETE CASCADE,
  kind text CHECK (kind IN ('satellite','outline','zoning','street','substation')),
  url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS parcels_state_county_idx ON public.parcels(state, county);
CREATE INDEX IF NOT EXISTS parcels_status_idx ON public.parcels(status);
CREATE INDEX IF NOT EXISTS parcels_best_use_idx ON public.parcels(best_use);
CREATE INDEX IF NOT EXISTS parcels_project_id_idx ON public.parcels(project_id);
CREATE INDEX IF NOT EXISTS parcels_deal_id_idx ON public.parcels(deal_id);

-- Enable RLS
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_utilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_zoning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_topography ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All authenticated users have full access
CREATE POLICY "All authenticated users have full access to parcels"
ON public.parcels
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users have full access to parcel_utilities"
ON public.parcel_utilities
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users have full access to parcel_zoning"
ON public.parcel_zoning
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users have full access to parcel_rights"
ON public.parcel_rights
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users have full access to parcel_topography"
ON public.parcel_topography
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users have full access to parcel_images"
ON public.parcel_images
FOR ALL
USING (true)
WITH CHECK (true);