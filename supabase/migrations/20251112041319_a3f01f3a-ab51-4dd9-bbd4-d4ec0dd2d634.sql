-- Drop existing restrictive policies and create open policies for all authenticated users

-- ACCOUNTS
DROP POLICY IF EXISTS "Admin users can delete accounts" ON public.accounts;
DROP POLICY IF EXISTS "All authenticated users can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Standard and Admin users can insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Standard and Admin users can update accounts" ON public.accounts;

CREATE POLICY "All authenticated users have full access to accounts"
ON public.accounts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ACTIVITIES
DROP POLICY IF EXISTS "Admin users can delete activities" ON public.activities;
DROP POLICY IF EXISTS "All authenticated users can insert activities" ON public.activities;
DROP POLICY IF EXISTS "All authenticated users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Owners and Admins can update activities" ON public.activities;

CREATE POLICY "All authenticated users have full access to activities"
ON public.activities FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- CONTACTS
DROP POLICY IF EXISTS "Admin users can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "All authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Standard and Admin users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Standard and Admin users can update contacts" ON public.contacts;

CREATE POLICY "All authenticated users have full access to contacts"
ON public.contacts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- DEALS
DROP POLICY IF EXISTS "Admin users can delete deals" ON public.deals;
DROP POLICY IF EXISTS "All authenticated users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Owners and Admins can update deals" ON public.deals;
DROP POLICY IF EXISTS "Standard and Admin users can insert deals" ON public.deals;

CREATE POLICY "All authenticated users have full access to deals"
ON public.deals FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- DOCUMENTS
DROP POLICY IF EXISTS "Admin users can delete documents" ON public.documents;
DROP POLICY IF EXISTS "All authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "All authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Uploaders and Admins can update documents" ON public.documents;

CREATE POLICY "All authenticated users have full access to documents"
ON public.documents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- EMAILS
DROP POLICY IF EXISTS "Admin users can delete emails" ON public.emails;
DROP POLICY IF EXISTS "All authenticated users can insert emails" ON public.emails;
DROP POLICY IF EXISTS "All authenticated users can update emails" ON public.emails;
DROP POLICY IF EXISTS "All authenticated users can view emails" ON public.emails;

CREATE POLICY "All authenticated users have full access to emails"
ON public.emails FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- NOTES
DROP POLICY IF EXISTS "All authenticated users can insert notes" ON public.notes;
DROP POLICY IF EXISTS "All authenticated users can view notes" ON public.notes;
DROP POLICY IF EXISTS "Creators and Admins can delete notes" ON public.notes;
DROP POLICY IF EXISTS "Creators and Admins can update notes" ON public.notes;

CREATE POLICY "All authenticated users have full access to notes"
ON public.notes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PROJECTS
DROP POLICY IF EXISTS "Admin users can delete projects" ON public.projects;
DROP POLICY IF EXISTS "All authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Standard and Admin users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Standard and Admin users can update projects" ON public.projects;

CREATE POLICY "All authenticated users have full access to projects"
ON public.projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PROPERTIES
DROP POLICY IF EXISTS "Admin users can delete properties" ON public.properties;
DROP POLICY IF EXISTS "All authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Standard and Admin users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Standard and Admin users can update properties" ON public.properties;

CREATE POLICY "All authenticated users have full access to properties"
ON public.properties FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- TASKS
DROP POLICY IF EXISTS "All authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Owners and Admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Owners and Admins can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view own tasks or all if Admin" ON public.tasks;

CREATE POLICY "All authenticated users have full access to tasks"
ON public.tasks FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);