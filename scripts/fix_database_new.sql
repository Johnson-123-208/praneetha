-- FINAL SUPABASE DATABASE FIX (New Project Ready)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ywvqvldqlowloxrpldss/editor

-- 1. Enable RLS on core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 2. Clean start: Drop existing visibility policies to prevent duplication errors
DO $$ 
BEGIN 
    -- Companies policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public companies view' AND tablename = 'companies') THEN
        DROP POLICY "Public companies view" ON companies;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public lookup' AND tablename = 'companies') THEN
        DROP POLICY "Public lookup" ON companies;
    END IF;
    
    -- Generic SuperAdmin policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'SuperAdmin SELECT' AND tablename = 'companies') THEN
        DROP POLICY "SuperAdmin SELECT" ON companies;
    END IF;
END $$;

-- 3. COMPANY VIEW POLICIES
-- Allow ANYONE (including guests) to see active companies
CREATE POLICY "Public companies view" ON companies 
  FOR SELECT USING (true);

-- 4. PROFILE POLICIES (Privacy First)
DROP POLICY IF EXISTS "Own profile view" ON profiles;
CREATE POLICY "Own profile view" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 5. BOOKING POLICIES
DROP POLICY IF EXISTS "Public booking create" ON bookings;
CREATE POLICY "Public booking create" ON bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Own bookings view" ON bookings;
CREATE POLICY "Own bookings view" ON bookings
  FOR SELECT TO authenticated USING (user_email = auth.jwt() ->> 'email' OR user_email = 'Guest');

-- 6. FEEDBACK POLICIES
DROP POLICY IF EXISTS "Public feedback create" ON feedback;
CREATE POLICY "Public feedback create" ON feedback
  FOR INSERT WITH CHECK (true);

-- 7. SUPERADMIN ACCESS (God Mode)
-- The SuperAdmin needs global visibility
DROP POLICY IF EXISTS "SuperAdmin SELECT" ON companies;
CREATE POLICY "SuperAdmin SELECT" ON companies FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

DROP POLICY IF EXISTS "SuperAdmin SELECT" ON profiles;
CREATE POLICY "SuperAdmin SELECT" ON profiles FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

DROP POLICY IF EXISTS "SuperAdmin SELECT" ON bookings;
CREATE POLICY "SuperAdmin SELECT" ON bookings FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

DROP POLICY IF EXISTS "SuperAdmin SELECT" ON feedback;
CREATE POLICY "SuperAdmin SELECT" ON feedback FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

-- Also allow SuperAdmin to update/delete companies
DROP POLICY IF EXISTS "SuperAdmin UPDATE" ON companies;
CREATE POLICY "SuperAdmin UPDATE" ON companies FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

DROP POLICY IF EXISTS "SuperAdmin DELETE" ON companies;
CREATE POLICY "SuperAdmin DELETE" ON companies FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'praneethasudi@gmail.com');

-- 8. PROJECT MIGRATION TROUBLESHOOTING
-- If you see 'Failed to fetch/ETIMEDOUT' in developer tools:
-- 1. Check if you can access https://ywvqvldqlowloxrpldss.supabase.co in your browser.
-- 2. If it's blocked by your ISP, please USE A VPN or your internal network proxy.
-- 3. Run this in your browser console to clear session cache: localStorage.clear(); location.reload();
