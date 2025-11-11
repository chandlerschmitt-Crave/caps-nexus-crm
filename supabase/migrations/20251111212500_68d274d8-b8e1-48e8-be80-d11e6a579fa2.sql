-- Create enum types
CREATE TYPE public.app_role AS ENUM ('Admin', 'Standard', 'ReadOnly');
CREATE TYPE public.account_type AS ENUM ('DevCo', 'HoldCo', 'Fund', 'Investor', 'Lender', 'Partner', 'Agency');
CREATE TYPE public.contact_role AS ENUM ('Investor', 'LP', 'GP', 'Broker', 'CIO', 'CTO', 'Advisor', 'GC', 'Vendor', 'Prospect');
CREATE TYPE public.project_type AS ENUM ('AI_Data_Center', 'Luxury_Res', 'Tokenized_Fund');
CREATE TYPE public.project_stage AS ENUM ('Ideation', 'Pre-Dev', 'Raising', 'Entitlements', 'Construction', 'Stabilization', 'Exit');
CREATE TYPE public.property_status AS ENUM ('Sourcing', 'Under_Contract', 'Entitling', 'Building', 'Listed', 'Sold');
CREATE TYPE public.deal_instrument AS ENUM ('Equity', 'Debt', 'Seller_Carry', 'SAFE', 'Rev_Share', 'Token');
CREATE TYPE public.deal_stage AS ENUM ('Sourcing', 'Intro', 'Diligence', 'LOI_Out', 'Negotiation', 'Docs', 'Closed_Won', 'Closed_Lost');
CREATE TYPE public.activity_type AS ENUM ('Call', 'Email', 'Meeting', 'Note', 'Site_Visit');
CREATE TYPE public.task_priority AS ENUM ('Low', 'Med', 'High');
CREATE TYPE public.task_status AS ENUM ('Not_Started', 'In_Progress', 'Blocked', 'Done');
CREATE TYPE public.doc_type AS ENUM ('Deck', 'Model', 'Proforma', 'PPM', 'LOI', 'Contract');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type account_type NOT NULL,
  website TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role contact_role,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  project_type project_type NOT NULL,
  market TEXT,
  description TEXT,
  est_total_cost DECIMAL(15,2),
  stage project_stage NOT NULL DEFAULT 'Ideation',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  apn TEXT,
  land_cost DECIMAL(15,2),
  construction_budget DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  target_resale_value DECIMAL(15,2),
  status property_status NOT NULL DEFAULT 'Sourcing',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount_target DECIMAL(15,2),
  instrument deal_instrument NOT NULL,
  stage deal_stage NOT NULL DEFAULT 'Sourcing',
  close_date DATE,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  source TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  what_type TEXT,
  what_id UUID,
  who_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  next_step TEXT,
  next_step_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  related_type TEXT,
  related_id UUID,
  subject TEXT NOT NULL,
  due_date DATE,
  priority task_priority NOT NULL DEFAULT 'Med',
  status task_status NOT NULL DEFAULT 'Not_Started',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_type TEXT,
  related_id UUID,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type doc_type NOT NULL,
  uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create picklists table
CREATE TABLE public.picklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_name TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  UNIQUE(list_name, value)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'Admin'));
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);

-- RLS Policies for accounts (ReadOnly can read, Standard+ can write)
CREATE POLICY "All authenticated users can view accounts" ON public.accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Standard and Admin users can insert accounts" ON public.accounts FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Standard and Admin users can update accounts" ON public.accounts FOR UPDATE USING (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete accounts" ON public.accounts FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for contacts
CREATE POLICY "All authenticated users can view contacts" ON public.contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Standard and Admin users can insert contacts" ON public.contacts FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Standard and Admin users can update contacts" ON public.contacts FOR UPDATE USING (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete contacts" ON public.contacts FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for projects
CREATE POLICY "All authenticated users can view projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Standard and Admin users can insert projects" ON public.projects FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Standard and Admin users can update projects" ON public.projects FOR UPDATE USING (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete projects" ON public.projects FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for properties
CREATE POLICY "All authenticated users can view properties" ON public.properties FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Standard and Admin users can insert properties" ON public.properties FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Standard and Admin users can update properties" ON public.properties FOR UPDATE USING (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete properties" ON public.properties FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for deals
CREATE POLICY "All authenticated users can view deals" ON public.deals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Standard and Admin users can insert deals" ON public.deals FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'Standard') OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Owners and Admins can update deals" ON public.deals FOR UPDATE USING (
  owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete deals" ON public.deals FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for activities
CREATE POLICY "All authenticated users can view activities" ON public.activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated users can insert activities" ON public.activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners and Admins can update activities" ON public.activities FOR UPDATE USING (
  owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete activities" ON public.activities FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks or all if Admin" ON public.tasks FOR SELECT USING (
  owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "All authenticated users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners and Admins can update tasks" ON public.tasks FOR UPDATE USING (
  owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Owners and Admins can delete tasks" ON public.tasks FOR DELETE USING (
  owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin')
);

-- RLS Policies for documents
CREATE POLICY "All authenticated users can view documents" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated users can insert documents" ON public.documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Uploaders and Admins can update documents" ON public.documents FOR UPDATE USING (
  uploaded_by_user_id = auth.uid() OR public.has_role(auth.uid(), 'Admin')
);
CREATE POLICY "Admin users can delete documents" ON public.documents FOR DELETE USING (public.has_role(auth.uid(), 'Admin'));

-- RLS Policies for picklists
CREATE POLICY "All authenticated users can view picklists" ON public.picklists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin users can manage picklists" ON public.picklists FOR ALL USING (public.has_role(auth.uid(), 'Admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();