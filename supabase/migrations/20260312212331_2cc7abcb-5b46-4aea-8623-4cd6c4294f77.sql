
-- 1. Add EV_Charging to project_type enum
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'EV_Charging';

-- 2. Add vertical column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS vertical text;

-- 3. Add new project_stage values for VoltQore
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Site_Identified';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Underwriting';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'LOI_Ground_Lease';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Permits';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Incentive_Applications';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Shovel_Ready';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Energized';
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'Stabilized_Operations';

-- 4. Create voltqore_site_metrics table
CREATE TABLE public.voltqore_site_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  site_name text,
  location_city text,
  location_state text,
  market_type text,
  total_stalls integer DEFAULT 0,
  stalls_operational integer DEFAULT 0,
  stalls_in_development integer DEFAULT 0,
  gross_capex numeric DEFAULT 0,
  net_capex numeric DEFAULT 0,
  incentives_secured numeric DEFAULT 0,
  utilization_rate_pct numeric DEFAULT 0,
  utilization_target_pct numeric DEFAULT 0,
  avg_session_price_kwh numeric DEFAULT 0.45,
  monthly_gross_revenue numeric DEFAULT 0,
  tesla_om_cost_monthly numeric DEFAULT 0,
  utilities_network_fees_monthly numeric DEFAULT 0,
  ground_lease_monthly numeric DEFAULT 0,
  noi_monthly numeric DEFAULT 0,
  lcfs_credits_monthly numeric DEFAULT 0,
  ebitda_margin_pct numeric DEFAULT 0,
  yield_on_cost_pct numeric DEFAULT 0,
  status text DEFAULT 'Shovel_Ready',
  tesla_om_agreement boolean DEFAULT false,
  ground_lease_executed boolean DEFAULT false,
  itc_application_status text,
  lcfs_registration_status text,
  spv_formed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on voltqore_site_metrics
ALTER TABLE public.voltqore_site_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.voltqore_site_metrics
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
