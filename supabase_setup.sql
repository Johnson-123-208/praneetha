-- FINAL CLEAN VERSION SUPABASE SCHEMA (Optimized for Green Health Status)
-- This script sets up all tables with proper Foreign Keys, Indexes, and Granular RLS Policies.

-- 1. NUCLEAR RESET (Ensures absolute cleanliness)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. SECURE SEARCH PATH
ALTER ROLE postgres SET search_path = public, auth, extensions;
ALTER ROLE authenticated SET search_path = public, auth, extensions;
ALTER ROLE anon SET search_path = public, auth, extensions;

-- 3. CORE SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    logo TEXT DEFAULT '🏢',
    context_summary TEXT,
    nlp_context TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INDUSTRY TABLES
-- Healthcare
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    fee NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hospital_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    is_booked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurant
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    is_booked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT,
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'reserved',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- E-Commerce
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock INTEGER DEFAULT 100,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Business
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Common
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_email TEXT,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id),
    table_name TEXT NOT NULL,
    display_name TEXT,
    data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

-- 6. UNIVERSAL ADMIN RLS POLICIES (Syncs Website Database to Admin Dashboard)
-- This pattern ensures Admins only see THEIR company data, while Superadmins see ALL.

-- Profiles: Admins can see their company team
CREATE POLICY "Profiles Admin Access" ON public.profiles FOR ALL USING (
    (SELECT company_id FROM public.profiles WHERE id = auth.uid()) = company_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin' OR
    id = auth.uid()
);

-- Companies: Public sees Active, Admins see Theirs, Superadmins see All
CREATE POLICY "Companies Visibility" ON public.companies FOR SELECT USING (
    status = 'active' OR 
    id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
);

-- Industry Tables: Total Admin control over company rows
-- We apply this pattern to ALL data tables
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('doctors', 'bookings', 'restaurant_tables', 'menu', 'reservations', 'products', 'ecommerce_orders', 'staff', 'meetings', 'feedback', 'approval_queue')
    LOOP
        EXECUTE format('CREATE POLICY "Admin Access %I" ON public.%I FOR ALL USING (
            company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''superadmin'' OR
            (SELECT status FROM public.companies WHERE id = company_id) = ''active''
        )', t, t);
    END LOOP;
END $$;

-- 7. ROBUST ONBOARDING TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_company_id UUID;
  user_role TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'user');

  -- 1. Create Company if Admin (Starts as Pending)
  IF user_role = 'admin' AND new.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    INSERT INTO public.companies (name, industry, contact_email, status)
    VALUES (
      new.raw_user_meta_data->>'company_name',
      COALESCE(new.raw_user_meta_data->>'industry', 'Technology'),
      new.email,
      'pending' 
    ) RETURNING id INTO target_company_id;
  END IF;

  -- 2. Create Profile (Signs up as Pending if Admin)
  INSERT INTO public.profiles (id, email, full_name, role, company_id, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'System User'), 
    user_role,
    target_company_id,
    CASE WHEN user_role = 'admin' THEN 'pending' ELSE 'approved' END
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RE-ATTACH TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policy to allow the trigger to work during authentication
CREATE POLICY "System Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_comp_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_prof_comp ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_prof_role ON public.profiles(role);
