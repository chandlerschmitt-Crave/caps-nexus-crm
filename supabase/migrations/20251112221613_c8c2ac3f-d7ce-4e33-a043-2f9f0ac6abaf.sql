-- Add listing provenance & health tracking to parcels
ALTER TABLE parcels
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_listing_id TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS url_status TEXT CHECK (url_status IN ('valid','invalid','gone','unknown')) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS url_last_checked TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS url_title TEXT,
  ADD COLUMN IF NOT EXISTS url_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS address_norm TEXT;

-- Create index for address normalization (deduplication)
CREATE INDEX IF NOT EXISTS parcels_address_norm_idx ON parcels(address_norm);

-- Create index for source deduplication
CREATE INDEX IF NOT EXISTS parcels_source_listing_idx ON parcels(source_name, source_listing_id);

-- Create index for fingerprint deduplication
CREATE INDEX IF NOT EXISTS parcels_fingerprint_idx ON parcels(url_fingerprint);

-- Store structured data from listing sites (JSON-LD)
CREATE TABLE IF NOT EXISTS listing_jsonld (
  parcel_id UUID PRIMARY KEY REFERENCES parcels(id) ON DELETE CASCADE,
  raw JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for listing_jsonld
ALTER TABLE listing_jsonld ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to listing_jsonld"
  ON listing_jsonld
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add extra prospecting signals to parcels
ALTER TABLE parcels
  ADD COLUMN IF NOT EXISTS dom_days_on_market INTEGER,
  ADD COLUMN IF NOT EXISTS last_seen_price NUMERIC,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parcel_polygon TEXT,
  ADD COLUMN IF NOT EXISTS near_highway_miles NUMERIC,
  ADD COLUMN IF NOT EXISTS near_airport_miles NUMERIC,
  ADD COLUMN IF NOT EXISTS flood_zone TEXT,
  ADD COLUMN IF NOT EXISTS wildfire_risk_index INTEGER,
  ADD COLUMN IF NOT EXISTS listing_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS listing_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS listing_contact_email TEXT;

-- Add fiber and comps data to parcel_utilities
ALTER TABLE parcel_utilities
  ADD COLUMN IF NOT EXISTS fiber_distance_miles NUMERIC,
  ADD COLUMN IF NOT EXISTS fiber_providers TEXT,
  ADD COLUMN IF NOT EXISTS comp_price_per_acre NUMERIC;