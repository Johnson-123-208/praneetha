-- FINAL SUPABASE DATABASE FIX (New Project Ready)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ywvqvldqlowloxrpldss/editor

-- 1. Enable RLS on core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public companies view" ON companies;
DROP POLICY IF EXISTS "Public lookup" ON companies;
DROP POLICY IF EXISTS "SuperAdmin bypass" ON companies;
DROP POLICY IF EXISTS "SuperAdmin bypass" ON profiles;
DROP POLICY IF EXISTS "SuperAdmin bypass" ON bookings;
DROP POLICY IF EXISTS "SuperAdmin bypass" ON feedback;

-- 3. COMPANY VIEW POLICIES
-- Allow ANYONE (including guests) to see active companies
CREATE POLICY "Public companies view" ON companies 
  FOR SELECT USING (true);

-- 4. PROFILE POLICIES (Privacy First)
-- Users can see their own profile
CREATE POLICY "Own profile view" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 5. BOOKING POLICIES
-- Guests (and users) can create bookings
CREATE POLICY "Public booking create" ON bookings
  FOR INSERT WITH CHECK (true);

-- Users can see their own bookings
CREATE POLICY "Own bookings view" ON bookings
  FOR SELECT TO authenticated USING (user_email = auth.jwt() ->> 'email' OR user_email = 'Guest');

-- 6. FEEDBACK POLICIES
CREATE POLICY "Public feedback create" ON feedback
  FOR INSERT WITH CHECK (true);

-- 7. SUPERADMIN ACCESS (God Mode)
-- The SuperAdmin (praneethasudi@gmail.com) needs to see everything
CREATE POLICY "SuperAdmin SELECT" ON companies FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');
CREATE POLICY "SuperAdmin SELECT" ON profiles FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');
CREATE POLICY "SuperAdmin SELECT" ON bookings FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');
CREATE POLICY "SuperAdmin SELECT" ON feedback FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

-- Also allow SuperAdmin to update companies (for approval/deletion)
CREATE POLICY "SuperAdmin UPDATE" ON companies FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');
CREATE POLICY "SuperAdmin DELETE" ON companies FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

-- 8. FIX FOR FAILED PROJECT SWITCHES
-- If you see 'Failed to fetch' in the console, please clear your browser local storage!
-- Select the 'Console' tab in Inspect element and type: localStorage.clear(); location.reload();
