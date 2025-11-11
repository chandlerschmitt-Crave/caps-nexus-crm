-- Create notes table for cross-collaboration on any object
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  related_type TEXT NOT NULL,
  related_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for better query performance
CREATE INDEX idx_notes_related ON public.notes(related_type, related_id);
CREATE INDEX idx_notes_created_by ON public.notes(created_by_user_id);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view notes"
ON public.notes
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can insert notes"
ON public.notes
FOR INSERT
WITH CHECK (auth.role() = 'authenticated'::text AND created_by_user_id = auth.uid());

CREATE POLICY "Creators and Admins can update notes"
ON public.notes
FOR UPDATE
USING (created_by_user_id = auth.uid() OR has_role(auth.uid(), 'Admin'::app_role));

CREATE POLICY "Creators and Admins can delete notes"
ON public.notes
FOR DELETE
USING (created_by_user_id = auth.uid() OR has_role(auth.uid(), 'Admin'::app_role));

COMMENT ON TABLE public.notes IS 'Notes and comments that can be attached to any object type for collaboration';
COMMENT ON COLUMN public.notes.related_type IS 'Type of object: account, deal, project, property, contact, task, etc.';
COMMENT ON COLUMN public.notes.related_id IS 'UUID of the related object';