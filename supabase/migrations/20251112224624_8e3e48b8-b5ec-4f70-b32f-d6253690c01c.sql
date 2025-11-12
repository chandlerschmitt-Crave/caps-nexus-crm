-- Construction Management Module

-- A. Construction Packages
CREATE TABLE construction_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phase TEXT CHECK (phase IN ('Precon', 'Active', 'Punchlist', 'Closed')) DEFAULT 'Precon',
  retainage_pct NUMERIC DEFAULT 10,
  start_date DATE,
  substantial_completion DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE construction_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to construction_packages"
ON construction_packages FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- B. Budget Lines with computed columns
CREATE TABLE budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  original_budget NUMERIC DEFAULT 0,
  approved_co NUMERIC DEFAULT 0,
  revised_budget NUMERIC GENERATED ALWAYS AS (original_budget + approved_co) STORED,
  committed NUMERIC DEFAULT 0,
  actuals NUMERIC DEFAULT 0,
  forecast_to_complete NUMERIC DEFAULT 0,
  eac NUMERIC GENERATED ALWAYS AS (actuals + forecast_to_complete) STORED,
  variance NUMERIC GENERATED ALWAYS AS ((original_budget + approved_co) - (actuals + forecast_to_complete)) STORED,
  percent_complete NUMERIC DEFAULT 0,
  notes TEXT
);

ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to budget_lines"
ON budget_lines FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- C. Commitments (Contracts/POs)
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  vendor TEXT NOT NULL,
  number TEXT,
  total_value NUMERIC NOT NULL,
  retainage_pct NUMERIC,
  executed_at DATE,
  status TEXT CHECK (status IN ('Draft', 'Executed', 'Closed')) DEFAULT 'Executed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to commitments"
ON commitments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TABLE commitment_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE NOT NULL,
  budget_line_id UUID REFERENCES budget_lines(id),
  description TEXT,
  value NUMERIC NOT NULL
);

ALTER TABLE commitment_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to commitment_lines"
ON commitment_lines FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- D. Invoices (Pay Apps)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  commitment_id UUID REFERENCES commitments(id),
  invoice_no TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  billed_this_period NUMERIC DEFAULT 0,
  retainage_held NUMERIC DEFAULT 0,
  approved_amount NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('Submitted', 'Approved', 'Paid', 'Rejected')) DEFAULT 'Submitted',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to invoices"
ON invoices FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- E. Draws (Owner Requisitions)
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  draw_no INTEGER NOT NULL,
  period_start DATE,
  period_end DATE,
  requested NUMERIC DEFAULT 0,
  approved NUMERIC DEFAULT 0,
  funded NUMERIC DEFAULT 0,
  bank_reference TEXT,
  status TEXT CHECK (status IN ('In_Prep', 'Submitted', 'Approved', 'Funded', 'Rejected')) DEFAULT 'In_Prep',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to draws"
ON draws FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TABLE draw_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  budget_line_id UUID REFERENCES budget_lines(id),
  this_period NUMERIC DEFAULT 0,
  to_date NUMERIC DEFAULT 0,
  percent_complete NUMERIC DEFAULT 0,
  retainage_this_period NUMERIC DEFAULT 0,
  notes TEXT
);

ALTER TABLE draw_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to draw_lines"
ON draw_lines FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- F. Change Orders
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  co_no TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('Draft', 'Pending_Approval', 'Approved', 'Rejected')) DEFAULT 'Pending_Approval',
  file_url TEXT,
  approved_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to change_orders"
ON change_orders FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- G. Progress Updates
CREATE TABLE progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  stage TEXT,
  percent_overall NUMERIC,
  inspector TEXT,
  photos_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to progress_updates"
ON progress_updates FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- H. Construction Files
CREATE TABLE construction_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES construction_packages(id) ON DELETE CASCADE NOT NULL,
  kind TEXT CHECK (kind IN ('Permit', 'Inspection', 'Pay_App', 'Lien_Release', 'Photo', 'Schedule', 'Spec', 'Other')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE construction_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access to construction_files"
ON construction_files FOR ALL TO authenticated
USING (true) WITH CHECK (true);