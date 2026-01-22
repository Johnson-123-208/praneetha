-- ============================================
-- AI Calling Agent - Complete Supabase Schema
-- ============================================
-- This schema supports the full AI calling agent system
-- with companies, hospitals, appointments, orders, etc.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES / HOSPITALS TABLE
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    logo VARCHAR(10) DEFAULT '🏢',
    context_summary TEXT,
    nlp_context TEXT,
    api_key VARCHAR(255),
    api_linked BOOLEAN DEFAULT true,
    website_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    social_media JSONB,
    scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);

-- ============================================
-- 2. DOCTORS TABLE (for hospitals)
-- ============================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualifications TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL(10, 2),
    available_days TEXT[], -- Array of days: ['Monday', 'Wednesday', 'Friday']
    available_time_slots JSONB, -- JSON: {"morning": "9:00-13:00", "evening": "16:00-20:00"}
    languages_spoken TEXT[],
    special_interests TEXT,
    opd_room_number VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);

-- ============================================
-- 3. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_of_department VARCHAR(255),
    bed_capacity INTEGER,
    facilities TEXT[],
    special_equipment TEXT[],
    operating_hours VARCHAR(100),
    contact_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_departments_company ON departments(company_id);

-- ============================================
-- 4. JOB VACANCIES TABLE
-- ============================================
CREATE TABLE vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    experience_years INTEGER,
    job_type VARCHAR(50), -- Full-time, Contract, Internship
    required_skills TEXT[],
    preferred_qualifications TEXT,
    description TEXT,
    salary_range_min DECIMAL(12, 2),
    salary_range_max DECIMAL(12, 2),
    salary_currency VARCHAR(10) DEFAULT 'INR',
    number_of_openings INTEGER DEFAULT 1,
    application_deadline DATE,
    reporting_to VARCHAR(255),
    work_mode VARCHAR(50), -- Remote, Hybrid, On-site
    status VARCHAR(50) DEFAULT 'open', -- open, closed, filled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vacancies_company ON vacancies(company_id);
CREATE INDEX idx_vacancies_status ON vacancies(status);
CREATE INDEX idx_vacancies_position ON vacancies(position);

-- ============================================
-- 5. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_name VARCHAR(255),
    appointment_type VARCHAR(50) NOT NULL, -- doctor, ceo, executive, general
    person_name VARCHAR(255),
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_phone VARCHAR(50),
    user_info JSONB,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_entity ON appointments(entity_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id VARCHAR(10) PRIMARY KEY, -- 6-character order ID
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2),
    total_price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    delivery_address TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- pending, processing, completed, cancelled
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- 7. FEEDBACK TABLE
-- ============================================
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category VARCHAR(50), -- service, product, appointment, general
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_entity ON feedback(entity_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_category ON feedback(category);

-- ============================================
-- 8. SERVICES TABLE
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_services_company ON services(company_id);
CREATE INDEX idx_services_category ON services(category);

-- ============================================
-- 9. HEALTH PACKAGES TABLE (for hospitals)
-- ============================================
CREATE TABLE health_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tests_included TEXT[],
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    duration_days INTEGER,
    target_age_group VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_packages_hospital ON health_packages(hospital_id);

-- ============================================
-- 10. CONVERSATION LOGS TABLE
-- ============================================
CREATE TABLE conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    user_message TEXT,
    agent_response TEXT,
    language VARCHAR(50),
    detected_intent VARCHAR(100),
    function_called VARCHAR(100),
    function_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversation_logs_session ON conversation_logs(session_id);
CREATE INDEX idx_conversation_logs_company ON conversation_logs(company_id);
CREATE INDEX idx_conversation_logs_created ON conversation_logs(created_at DESC);

-- ============================================
-- 11. LEADERSHIP TEAM TABLE
-- ============================================
CREATE TABLE leadership_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    years_with_company INTEGER,
    previous_experience TEXT,
    education TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    office_location VARCHAR(100),
    appointment_availability VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leadership_company ON leadership_team(company_id);

-- ============================================
-- 12. OFFICE LOCATIONS TABLE
-- ============================================
CREATE TABLE office_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    size_sqft INTEGER,
    employee_count INTEGER,
    departments TEXT[],
    contact_number VARCHAR(50),
    landmark VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_headquarters BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_office_locations_company ON office_locations(company_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacancies_updated_at BEFORE UPDATE ON vacancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_locations ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON vacancies FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON feedback FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON health_packages FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON conversation_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON leadership_team FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON office_locations FOR SELECT USING (true);

-- Allow insert for authenticated users (you can modify this based on your auth setup)
CREATE POLICY "Allow insert for all" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON vacancies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON health_packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON conversation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON leadership_team FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON office_locations FOR INSERT WITH CHECK (true);

-- Allow update for all (adjust based on your needs)
CREATE POLICY "Allow update for all" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow update for all" ON doctors FOR UPDATE USING (true);
CREATE POLICY "Allow update for all" ON departments FOR UPDATE USING (true);
CREATE POLICY "Allow update for all" ON vacancies FOR UPDATE USING (true);
CREATE POLICY "Allow update for all" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow update for all" ON orders FOR UPDATE USING (true);

-- Allow delete for all (adjust based on your needs)
CREATE POLICY "Allow delete for all" ON companies FOR DELETE USING (true);
CREATE POLICY "Allow delete for all" ON doctors FOR DELETE USING (true);
CREATE POLICY "Allow delete for all" ON departments FOR DELETE USING (true);
CREATE POLICY "Allow delete for all" ON vacancies FOR DELETE USING (true);
CREATE POLICY "Allow delete for all" ON appointments FOR DELETE USING (true);
CREATE POLICY "Allow delete for all" ON orders FOR DELETE USING (true);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Note: You can insert your TechMahindra.json and Apollo_Hospitals.json data here
-- This is just a template. Use the actual data from your JSON files.

-- Example: Insert a sample company
-- INSERT INTO companies (name, industry, context_summary, nlp_context) VALUES
-- ('Tech Mahindra Limited', 'Technology', 'Leading IT services company...', 'Complete context...');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for available doctors
CREATE VIEW available_doctors AS
SELECT 
    d.*,
    c.name as hospital_name,
    c.contact_phone as hospital_phone
FROM doctors d
JOIN companies c ON d.hospital_id = c.id
WHERE d.is_available = true
ORDER BY d.specialization, d.name;

-- View for open vacancies
CREATE VIEW open_vacancies AS
SELECT 
    v.*,
    c.name as company_name,
    c.industry,
    c.contact_email as company_email
FROM vacancies v
JOIN companies c ON v.company_id = c.id
WHERE v.status = 'open'
ORDER BY v.created_at DESC;

-- View for upcoming appointments
CREATE VIEW upcoming_appointments AS
SELECT 
    a.*,
    c.name as company_name,
    d.name as doctor_name,
    d.specialization
FROM appointments a
JOIN companies c ON a.entity_id = c.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE a.date >= CURRENT_DATE AND a.status = 'scheduled'
ORDER BY a.date, a.time;

-- View for recent orders
CREATE VIEW recent_orders AS
SELECT 
    o.*,
    c.name as company_name
FROM orders o
JOIN companies c ON o.company_id = c.id
ORDER BY o.created_at DESC
LIMIT 100;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to get available appointment slots
CREATE OR REPLACE FUNCTION get_available_slots(
    p_entity_id UUID,
    p_date DATE
)
RETURNS TABLE (
    time_slot TIME,
    is_available BOOLEAN
) AS $$
DECLARE
    all_slots TIME[] := ARRAY['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']::TIME[];
    slot TIME;
BEGIN
    FOREACH slot IN ARRAY all_slots
    LOOP
        RETURN QUERY
        SELECT 
            slot,
            NOT EXISTS (
                SELECT 1 FROM appointments 
                WHERE entity_id = p_entity_id 
                AND date = p_date 
                AND time = slot 
                AND status = 'scheduled'
            );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(10) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE companies IS 'Stores company and hospital information';
COMMENT ON TABLE doctors IS 'Stores doctor information for hospitals';
COMMENT ON TABLE departments IS 'Stores department information for companies/hospitals';
COMMENT ON TABLE vacancies IS 'Stores job vacancy information';
COMMENT ON TABLE appointments IS 'Stores appointment bookings';
COMMENT ON TABLE orders IS 'Stores order information';
COMMENT ON TABLE feedback IS 'Stores customer feedback';
COMMENT ON TABLE services IS 'Stores services offered by companies';
COMMENT ON TABLE health_packages IS 'Stores health package information for hospitals';
COMMENT ON TABLE conversation_logs IS 'Stores AI agent conversation history';
COMMENT ON TABLE leadership_team IS 'Stores leadership team information';
COMMENT ON TABLE office_locations IS 'Stores office location information';

-- ============================================
-- END OF SCHEMA
-- ============================================
