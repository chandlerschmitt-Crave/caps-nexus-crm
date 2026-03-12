
-- Create project_stage_history table
CREATE TABLE public.project_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  changed_by_user_id uuid REFERENCES public.profiles(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.project_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users have full access"
  ON public.project_stage_history FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
