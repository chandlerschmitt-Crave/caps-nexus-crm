
-- 1. Create investor_obligations table
CREATE TABLE public.investor_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  obligation_type text NOT NULL,
  title text NOT NULL,
  due_date date NOT NULL,
  completed_date date,
  status text NOT NULL DEFAULT 'Upcoming',
  assigned_to_user_id uuid REFERENCES public.profiles(id),
  document_url text,
  notes text,
  recurrence text DEFAULT 'None',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.investor_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.investor_obligations
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Add columns to accounts table
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS last_report_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_report_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS relationship_owner_user_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS investor_tier text,
  ADD COLUMN IF NOT EXISTS total_committed_capital numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_called_capital numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_distributed_capital numeric DEFAULT 0;
