-- Create storage bucket for construction files
INSERT INTO storage.buckets (id, name, public)
VALUES ('construction-files', 'construction-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for construction files bucket
CREATE POLICY "Authenticated users can upload construction files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'construction-files');

CREATE POLICY "Authenticated users can view construction files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'construction-files');

CREATE POLICY "Authenticated users can update construction files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'construction-files');

CREATE POLICY "Authenticated users can delete construction files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'construction-files');