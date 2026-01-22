-- SQL for creating Supabase tables for AI Calling Agent
-- NOTE: If you already created these tables and need to update them, 
-- you can uncomment the lines below to drop them first (WARNING: deletes all data).
-- DROP TABLE IF EXISTS appointments; DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS feedbacks; 
-- DROP TABLE IF EXISTS restaurant_bookings; DROP TABLE IF EXISTS companies; DROP TABLE IF EXISTS doctors;

-- 1. Create Appoinments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    type TEXT, -- 'doctor', 'table', 'personal', etc.
    person_name TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    user_info JSONB DEFAULT '{}',
    user_email TEXT, -- Added for user-specific tracking
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, -- e.g. ORD-1234
    company_id TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'placed',
    customer_name TEXT,
    customer_phone TEXT,
    user_email TEXT, -- Added for user-specific tracking
    total_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT,
    user_email TEXT, -- Added for user-specific tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Restaurant Bookings (Can reuse appointments or have specific table)
-- For simplicity, we'll use a specific table if needed, but the current code maps it to appointments.
-- However, let's create a dedicated one for better organization.
CREATE TABLE IF NOT EXISTS restaurant_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    restaurant_name TEXT,
    customer_name TEXT,
    party_size INTEGER DEFAULT 1,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    special_requests TEXT,
    user_email TEXT, -- Added for user-specific tracking
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) - Optional for internal demo, but good practice
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE restaurant_bookings ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (since it's a demo/POC)
CREATE POLICY "Allow public access" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow public access" ON orders FOR ALL USING (true);
CREATE POLICY "Allow public access" ON feedbacks FOR ALL USING (true);
CREATE POLICY "Allow public access" ON restaurant_bookings FOR ALL USING (true);

-- 5. Create Companies Table (Required for entity info)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    nlp_context TEXT,
    context_summary TEXT,
    api_linked BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Doctors Table (For hospitals)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hospital_id TEXT NOT NULL,
    name TEXT NOT NULL,
    specialization TEXT,
    experience TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policy for new tables
CREATE POLICY "Allow public access" ON companies FOR ALL USING (true);
CREATE POLICY "Allow public access" ON doctors FOR ALL USING (true);
