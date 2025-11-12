-- Assign Admin role to all existing users and update RLS policies for full access
-- This ensures all authenticated users have unrestricted access to all functionality

-- ============================================================================
-- PART 1: ASSIGN ADMIN ROLE TO ALL EXISTING USERS
-- ============================================================================

-- Insert Admin role for all existing users (ignore if already exists)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'Admin'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- PART 2: UPDATE RLS POLICIES TO GRANT ALL AUTHENTICATED USERS FULL ACCESS
-- ============================================================================

-- Drop the restrictive role-based policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "All users can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can delete accounts" ON public.accounts;

DROP POLICY IF EXISTS "All users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can manage contacts" ON public.contacts;

DROP POLICY IF EXISTS "All users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;

DROP POLICY IF EXISTS "All users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;

DROP POLICY IF EXISTS "All users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Admins can manage deals" ON public.deals;

DROP POLICY IF EXISTS "All users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can manage activities" ON public.activities;
DROP POLICY IF EXISTS "Users can manage own activities" ON public.activities;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;

DROP POLICY IF EXISTS "All users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;

DROP POLICY IF EXISTS "All users can view notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create notes" ON public.notes;
DROP POLICY IF EXISTS "Admins can manage notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

DROP POLICY IF EXISTS "All users can view emails" ON public.emails;
DROP POLICY IF EXISTS "Admins can manage emails" ON public.emails;

DROP POLICY IF EXISTS "All users can view parcels" ON public.parcels;
DROP POLICY IF EXISTS "Admins can manage parcels" ON public.parcels;

DROP POLICY IF EXISTS "All users can view parcel_images" ON public.parcel_images;
DROP POLICY IF EXISTS "Admins can manage parcel_images" ON public.parcel_images;

DROP POLICY IF EXISTS "All users can view parcel_utilities" ON public.parcel_utilities;
DROP POLICY IF EXISTS "Admins can manage parcel_utilities" ON public.parcel_utilities;

DROP POLICY IF EXISTS "All users can view parcel_zoning" ON public.parcel_zoning;
DROP POLICY IF EXISTS "Admins can manage parcel_zoning" ON public.parcel_zoning;

DROP POLICY IF EXISTS "All users can view parcel_rights" ON public.parcel_rights;
DROP POLICY IF EXISTS "Admins can manage parcel_rights" ON public.parcel_rights;

DROP POLICY IF EXISTS "All users can view parcel_topography" ON public.parcel_topography;
DROP POLICY IF EXISTS "Admins can manage parcel_topography" ON public.parcel_topography;

DROP POLICY IF EXISTS "All users can view listing_jsonld" ON public.listing_jsonld;
DROP POLICY IF EXISTS "Admins can manage listing_jsonld" ON public.listing_jsonld;

DROP POLICY IF EXISTS "All users can view construction_packages" ON public.construction_packages;
DROP POLICY IF EXISTS "Admins can manage construction_packages" ON public.construction_packages;

DROP POLICY IF EXISTS "All users can view budget_lines" ON public.budget_lines;
DROP POLICY IF EXISTS "Admins can manage budget_lines" ON public.budget_lines;

DROP POLICY IF EXISTS "All users can view commitments" ON public.commitments;
DROP POLICY IF EXISTS "Admins can manage commitments" ON public.commitments;

DROP POLICY IF EXISTS "All users can view commitment_lines" ON public.commitment_lines;
DROP POLICY IF EXISTS "Admins can manage commitment_lines" ON public.commitment_lines;

DROP POLICY IF EXISTS "All users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

DROP POLICY IF EXISTS "All users can view draws" ON public.draws;
DROP POLICY IF EXISTS "Admins can manage draws" ON public.draws;

DROP POLICY IF EXISTS "All users can view draw_lines" ON public.draw_lines;
DROP POLICY IF EXISTS "Admins can manage draw_lines" ON public.draw_lines;

DROP POLICY IF EXISTS "All users can view change_orders" ON public.change_orders;
DROP POLICY IF EXISTS "Admins can manage change_orders" ON public.change_orders;

DROP POLICY IF EXISTS "All users can view progress_updates" ON public.progress_updates;
DROP POLICY IF EXISTS "Admins can manage progress_updates" ON public.progress_updates;

DROP POLICY IF EXISTS "All users can view construction_files" ON public.construction_files;
DROP POLICY IF EXISTS "Admins can manage construction_files" ON public.construction_files;

DROP POLICY IF EXISTS "All users can view construction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload construction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update construction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete construction files" ON storage.objects;

-- ============================================================================
-- PART 3: CREATE PERMISSIVE POLICIES FOR ALL AUTHENTICATED USERS
-- ============================================================================

-- PROFILES: All authenticated users can manage all profiles
CREATE POLICY "All authenticated users have full access to profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ACCOUNTS
CREATE POLICY "All authenticated users have full access to accounts"
  ON public.accounts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- CONTACTS
CREATE POLICY "All authenticated users have full access to contacts"
  ON public.contacts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PROJECTS
CREATE POLICY "All authenticated users have full access to projects"
  ON public.projects FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PROPERTIES
CREATE POLICY "All authenticated users have full access to properties"
  ON public.properties FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DEALS
CREATE POLICY "All authenticated users have full access to deals"
  ON public.deals FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ACTIVITIES
CREATE POLICY "All authenticated users have full access to activities"
  ON public.activities FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- TASKS
CREATE POLICY "All authenticated users have full access to tasks"
  ON public.tasks FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DOCUMENTS
CREATE POLICY "All authenticated users have full access to documents"
  ON public.documents FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- NOTES
CREATE POLICY "All authenticated users have full access to notes"
  ON public.notes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- EMAILS
CREATE POLICY "All authenticated users have full access to emails"
  ON public.emails FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PARCELS
CREATE POLICY "All authenticated users have full access to parcels"
  ON public.parcels FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PARCEL SUB-TABLES
CREATE POLICY "All authenticated users have full access to parcel_images"
  ON public.parcel_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to parcel_utilities"
  ON public.parcel_utilities FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to parcel_zoning"
  ON public.parcel_zoning FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to parcel_rights"
  ON public.parcel_rights FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to parcel_topography"
  ON public.parcel_topography FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to listing_jsonld"
  ON public.listing_jsonld FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- CONSTRUCTION TABLES
CREATE POLICY "All authenticated users have full access to construction_packages"
  ON public.construction_packages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to budget_lines"
  ON public.budget_lines FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to commitments"
  ON public.commitments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to commitment_lines"
  ON public.commitment_lines FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to invoices"
  ON public.invoices FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to draws"
  ON public.draws FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to draw_lines"
  ON public.draw_lines FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to change_orders"
  ON public.change_orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to progress_updates"
  ON public.progress_updates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users have full access to construction_files"
  ON public.construction_files FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- STORAGE BUCKET POLICIES
CREATE POLICY "All authenticated users can access construction files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'construction-files' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'construction-files' AND auth.role() = 'authenticated');