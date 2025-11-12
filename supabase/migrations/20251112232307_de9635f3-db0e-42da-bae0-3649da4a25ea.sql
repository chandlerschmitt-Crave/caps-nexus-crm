-- Comprehensive Security Remediation Migration
-- This migration implements role-based access control across all tables

-- ============================================================================
-- PART 1: DROP ALL OVERLY PERMISSIVE RLS POLICIES
-- ============================================================================

-- Drop existing overly permissive policies on all tables
DROP POLICY IF EXISTS "All authenticated users have full access to accounts" ON public.accounts;
DROP POLICY IF EXISTS "All authenticated users have full access to contacts" ON public.contacts;
DROP POLICY IF EXISTS "All authenticated users have full access to projects" ON public.projects;
DROP POLICY IF EXISTS "All authenticated users have full access to properties" ON public.properties;
DROP POLICY IF EXISTS "All authenticated users have full access to deals" ON public.deals;
DROP POLICY IF EXISTS "All authenticated users have full access to activities" ON public.activities;
DROP POLICY IF EXISTS "All authenticated users have full access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "All authenticated users have full access to documents" ON public.documents;
DROP POLICY IF EXISTS "All authenticated users have full access to notes" ON public.notes;
DROP POLICY IF EXISTS "All authenticated users have full access to emails" ON public.emails;
DROP POLICY IF EXISTS "All authenticated users have full access to parcels" ON public.parcels;
DROP POLICY IF EXISTS "All authenticated users have full access to parcel_images" ON public.parcel_images;
DROP POLICY IF EXISTS "All authenticated users have full access to parcel_utilities" ON public.parcel_utilities;
DROP POLICY IF EXISTS "All authenticated users have full access to parcel_zoning" ON public.parcel_zoning;
DROP POLICY IF EXISTS "All authenticated users have full access to parcel_rights" ON public.parcel_rights;
DROP POLICY IF EXISTS "All authenticated users have full access to parcel_topography" ON public.parcel_topography;
DROP POLICY IF EXISTS "All authenticated users have full access to listing_jsonld" ON public.listing_jsonld;
DROP POLICY IF EXISTS "All authenticated users have full access to construction_packag" ON public.construction_packages;
DROP POLICY IF EXISTS "All authenticated users have full access to budget_lines" ON public.budget_lines;
DROP POLICY IF EXISTS "All authenticated users have full access to commitments" ON public.commitments;
DROP POLICY IF EXISTS "All authenticated users have full access to commitment_lines" ON public.commitment_lines;
DROP POLICY IF EXISTS "All authenticated users have full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "All authenticated users have full access to draws" ON public.draws;
DROP POLICY IF EXISTS "All authenticated users have full access to draw_lines" ON public.draw_lines;
DROP POLICY IF EXISTS "All authenticated users have full access to change_orders" ON public.change_orders;
DROP POLICY IF EXISTS "All authenticated users have full access to progress_updates" ON public.progress_updates;
DROP POLICY IF EXISTS "All authenticated users have full access to construction_files" ON public.construction_files;

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- ============================================================================
-- PART 2: CREATE ROLE-BASED RLS POLICIES
-- Role hierarchy: Admin > Standard > ReadOnly
-- ============================================================================

-- PROFILES: Users can view own profile, Admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ACCOUNTS: All authenticated users can view, Admin can modify
CREATE POLICY "All users can view accounts" ON public.accounts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert accounts" ON public.accounts
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can update accounts" ON public.accounts
  FOR UPDATE USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can delete accounts" ON public.accounts
  FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- CONTACTS: All authenticated users can view, Admin can modify
CREATE POLICY "All users can view contacts" ON public.contacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage contacts" ON public.contacts
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- PROJECTS: All users can view, Admin can modify
CREATE POLICY "All users can view projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- PROPERTIES: All users can view, Admin can modify
CREATE POLICY "All users can view properties" ON public.properties
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage properties" ON public.properties
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- DEALS: All users can view, Admin can modify
CREATE POLICY "All users can view deals" ON public.deals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage deals" ON public.deals
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- ACTIVITIES: All users can view, Admin and owners can manage
CREATE POLICY "All users can view activities" ON public.activities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage activities" ON public.activities
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Users can manage own activities" ON public.activities
  FOR ALL USING (auth.uid() = owner_user_id);

-- TASKS: Users can view and manage own tasks, Admins can see all
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can view all tasks" ON public.tasks
  FOR SELECT USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can manage all tasks" ON public.tasks
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- DOCUMENTS: All users can view, Admin can manage
CREATE POLICY "All users can view documents" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage documents" ON public.documents
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- NOTES: All users can view, creators and Admins can manage
CREATE POLICY "All users can view notes" ON public.notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Admins can manage notes" ON public.notes
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Users can manage own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = created_by_user_id);

-- EMAILS: All users can view, Admin can manage
CREATE POLICY "All users can view emails" ON public.emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage emails" ON public.emails
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- PARCELS: All users can view, Admin can manage
CREATE POLICY "All users can view parcels" ON public.parcels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage parcels" ON public.parcels
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- PARCEL SUB-TABLES: Follow same pattern as parcels
CREATE POLICY "All users can view parcel_images" ON public.parcel_images
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage parcel_images" ON public.parcel_images
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view parcel_utilities" ON public.parcel_utilities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage parcel_utilities" ON public.parcel_utilities
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view parcel_zoning" ON public.parcel_zoning
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage parcel_zoning" ON public.parcel_zoning
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view parcel_rights" ON public.parcel_rights
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage parcel_rights" ON public.parcel_rights
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view parcel_topography" ON public.parcel_topography
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage parcel_topography" ON public.parcel_topography
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view listing_jsonld" ON public.listing_jsonld
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage listing_jsonld" ON public.listing_jsonld
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- CONSTRUCTION TABLES: All users can view, Admin can manage
CREATE POLICY "All users can view construction_packages" ON public.construction_packages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage construction_packages" ON public.construction_packages
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view budget_lines" ON public.budget_lines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage budget_lines" ON public.budget_lines
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view commitments" ON public.commitments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage commitments" ON public.commitments
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view commitment_lines" ON public.commitment_lines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage commitment_lines" ON public.commitment_lines
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view invoices" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view draws" ON public.draws
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage draws" ON public.draws
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view draw_lines" ON public.draw_lines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage draw_lines" ON public.draw_lines
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view change_orders" ON public.change_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage change_orders" ON public.change_orders
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view progress_updates" ON public.progress_updates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage progress_updates" ON public.progress_updates
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "All users can view construction_files" ON public.construction_files
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage construction_files" ON public.construction_files
  FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- ============================================================================
-- PART 3: STORAGE BUCKET RLS POLICIES
-- ============================================================================

-- Drop any existing policies on construction-files bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload construction files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own construction files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own construction files" ON storage.objects;

-- Construction files: All users can view, Admin can manage
CREATE POLICY "All users can view construction files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'construction-files' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload construction files" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'construction-files' AND public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can update construction files" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'construction-files' AND public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can delete construction files" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'construction-files' AND public.has_role(auth.uid(), 'Admin'));