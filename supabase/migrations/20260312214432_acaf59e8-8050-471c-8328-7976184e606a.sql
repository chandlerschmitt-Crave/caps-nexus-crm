
-- Create compliance_items table
CREATE TABLE public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  vertical text,
  item_type text NOT NULL,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  completed_date date,
  status text NOT NULL DEFAULT 'Not_Started',
  assigned_to_user_id uuid REFERENCES public.profiles(id),
  jurisdiction text,
  filing_authority text,
  document_url text,
  reminder_days_before integer DEFAULT 14,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.compliance_items FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create decision_log table
CREATE TABLE public.decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  decision_made text NOT NULL,
  rationale text,
  decision_type text NOT NULL,
  made_by_user_id uuid REFERENCES public.profiles(id),
  decision_date date NOT NULL DEFAULT CURRENT_DATE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  vertical text,
  related_investor_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  outcome text,
  tags text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.decision_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.decision_log FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
