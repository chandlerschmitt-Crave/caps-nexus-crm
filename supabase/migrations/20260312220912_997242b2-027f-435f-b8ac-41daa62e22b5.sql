
-- Add parsing columns to documents table
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS parsed_at timestamptz,
  ADD COLUMN IF NOT EXISTS extracted_data jsonb,
  ADD COLUMN IF NOT EXISTS parse_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parse_confidence numeric;

-- Create parse_field_mappings table
CREATE TABLE IF NOT EXISTS public.parse_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_path text NOT NULL,
  extracted_value text,
  suggested_value text,
  confidence_pct numeric,
  status text NOT NULL DEFAULT 'Pending_Review',
  final_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parse_field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "All authenticated users have full access"
  ON public.parse_field_mappings
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create a storage bucket for parsed documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Storage RLS: authenticated users can read
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
