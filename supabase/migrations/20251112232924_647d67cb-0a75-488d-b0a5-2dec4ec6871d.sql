-- Assign Admin role and grant all authenticated users full access
-- Drop ALL existing policies first, then create fresh ones

-- Assign Admin role to all existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'Admin'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop ALL existing RLS policies on all tables (comprehensive cleanup)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on public schema tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;

    -- Drop all policies on storage.objects
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Create comprehensive full-access policies for all tables
CREATE POLICY "All authenticated users have full access" ON public.profiles
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.accounts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.contacts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.projects
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.properties
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.deals
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.activities
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.tasks
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.documents
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.notes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.emails
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.parcels
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.parcel_images
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.parcel_utilities
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.parcel_zoning
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.parcel_rights
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.parcel_topography
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.listing_jsonld
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.construction_packages
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.budget_lines
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.commitments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.commitment_lines
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.invoices
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.draws
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.draw_lines
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.change_orders
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.progress_updates
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access" ON public.construction_files
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Keep existing read-only policies for reference tables
CREATE POLICY "Authenticated users can read" ON public.geocode_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read" ON public.poi_reference
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read" ON public.ops_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage" ON public.ops_settings
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Authenticated users can view picklists" ON public.picklists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage picklists" ON public.picklists
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- Storage bucket policies
CREATE POLICY "All authenticated users can access construction files" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'construction-files' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'construction-files' AND auth.role() = 'authenticated');