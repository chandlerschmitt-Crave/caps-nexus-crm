
-- 1. Create capital_stacks table
CREATE TABLE public.capital_stacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  layer text NOT NULL,
  provider_name text,
  committed_amount numeric DEFAULT 0,
  called_amount numeric DEFAULT 0,
  uncalled_amount numeric DEFAULT 0,
  preferred_return_pct numeric,
  interest_rate_pct numeric,
  maturity_date date,
  ltv_pct numeric,
  ltc_pct numeric,
  promote_pct numeric,
  gp_split_above_hurdle_pct numeric,
  lp_split_above_hurdle_pct numeric,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.capital_stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.capital_stacks
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Create project_financials table
CREATE TABLE public.project_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  target_irr_pct numeric,
  projected_irr_pct numeric,
  actual_irr_pct numeric,
  target_equity_multiple numeric,
  projected_equity_multiple numeric,
  target_yield_on_cost_pct numeric,
  projected_yield_on_cost_pct numeric,
  target_noi numeric,
  projected_noi numeric,
  actual_noi_to_date numeric,
  dscr numeric,
  total_project_cost numeric,
  total_equity_raised numeric,
  total_debt_raised numeric,
  capital_deployed_pct numeric,
  hold_period_years numeric,
  target_close_date date,
  exit_date_projected date,
  exit_strategy text,
  notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.project_financials
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
