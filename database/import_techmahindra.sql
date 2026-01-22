-- =============================================================================
-- COMPLETE SINGLE-FILE SCRIPT: CREATE TABLES + SEED DATA
-- Apollo Hospitals Hyderabad + Tech Mahindra
-- Last updated structure: January 2026
-- =============================================================================

-- 1. DROP EXISTING TABLES (in reverse dependency order) - comment out if you want to keep data
DROP TABLE IF EXISTS job_openings              CASCADE;
DROP TABLE IF EXISTS office_locations          CASCADE;
DROP TABLE IF EXISTS leadership_team           CASCADE;
DROP TABLE IF EXISTS business_units            CASCADE;
DROP TABLE IF EXISTS companies                 CASCADE;

DROP TABLE IF EXISTS room_types                CASCADE;
DROP TABLE IF EXISTS patient_feedback          CASCADE;
DROP TABLE IF EXISTS health_packages           CASCADE;
DROP TABLE IF EXISTS doctors                   CASCADE;
DROP TABLE IF EXISTS departments               CASCADE;
DROP TABLE IF EXISTS hospitals                 CASCADE;

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

CREATE TABLE hospitals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL UNIQUE,
    tagline             TEXT,
    established_year    INTEGER,
    total_beds          INTEGER,
    icu_beds            INTEGER,
    emergency_24x7      BOOLEAN DEFAULT TRUE,
    address             TEXT,
    pincode             TEXT,
    phone               TEXT,
    email               TEXT,
    website             TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE departments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    head_doctor_name    TEXT,
    bed_count           INTEGER,
    facilities          TEXT,
    special_equipment   TEXT,
    operating_hours     TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctors (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    full_name           TEXT NOT NULL,
    title               TEXT DEFAULT 'Dr.',
    specialization      TEXT,
    qualifications      TEXT,
    experience_years    INTEGER,
    consultation_fee_inr INTEGER,
    available_days      TEXT,
    time_slots          TEXT,
    languages           TEXT,
    special_interests   TEXT,
    opd_room            TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE health_packages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    price_inr           INTEGER,
    duration            TEXT,
    target_age_group    TEXT,
    tests_included      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patient_feedback (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_name        TEXT,
    department_name     TEXT,
    doctor_name         TEXT,
    rating              INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text         TEXT,
    visit_date          DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_types (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    type_name           TEXT NOT NULL,
    price_per_day_inr   INTEGER,
    description         TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE companies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL UNIQUE,
    tagline             TEXT,
    founded_year        INTEGER,
    ceo_name            TEXT,
    total_employees     INTEGER,
    annual_revenue_inr  BIGINT,
    headquarters_address TEXT,
    website             TEXT,
    careers_email       TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_units (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    head_name           TEXT,
    team_size           INTEGER,
    key_technologies    TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_openings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    department          TEXT,
    location            TEXT,
    experience_years_min INTEGER,
    job_type            TEXT,
    salary_range_inr    TEXT,
    openings            INTEGER,
    application_deadline DATE,
    work_mode           TEXT,
    required_skills     TEXT,
    description         TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE office_locations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    city                TEXT NOT NULL,
    address             TEXT,
    size_sqft           INTEGER,
    employees_count     INTEGER,
    departments         TEXT,
    contact_phone       TEXT,
    landmark            TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leadership_team (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    designation         TEXT,
    department          TEXT,
    years_with_company  INTEGER,
    email               TEXT,
    office_location     TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Basic useful indexes
CREATE INDEX idx_departments_hospital    ON departments(hospital_id);
CREATE INDEX idx_doctors_department      ON doctors(department_id);
CREATE INDEX idx_feedback_hospital       ON patient_feedback(hospital_id);
CREATE INDEX idx_packages_hospital       ON health_packages(hospital_id);
CREATE INDEX idx_jobs_company            ON job_openings(company_id);
CREATE INDEX idx_offices_company         ON office_locations(company_id);

-- =============================================================================
-- SEED DATA - APOLLO HOSPITALS HYDERABAD
-- =============================================================================

DO $$
DECLARE
    apollo_id UUID;
BEGIN
    INSERT INTO hospitals (
        name, tagline, established_year, total_beds, icu_beds,
        address, pincode, phone, email, website
    )
    VALUES (
        'Apollo Hospitals, Hyderabad',
        'Pioneering Healthcare Excellence Since 1988',
        1988, 550, 99,
        'Road No. 72, Opp. Bharatiya Vidya Bhavan School, Film Nagar, Jubilee Hills, Hyderabad, Telangana',
        '500033', '+91-40-23607777', 'apollohealthcityhyd@apollohospitals.com',
        'https://www.apollohospitals.com/hyderabad'
    )
    ON CONFLICT (name) DO UPDATE SET
        tagline = EXCLUDED.tagline, established_year = EXCLUDED.established_year,
        total_beds = EXCLUDED.total_beds, icu_beds = EXCLUDED.icu_beds,
        address = EXCLUDED.address, pincode = EXCLUDED.pincode,
        phone = EXCLUDED.phone, email = EXCLUDED.email, website = EXCLUDED.website
    RETURNING id INTO apollo_id;

    -- Departments
    INSERT INTO departments (hospital_id, name, head_doctor_name, bed_count, facilities, special_equipment, operating_hours)
    VALUES
        (apollo_id, 'Cardiology',          'Dr. A Sreenivas Kumar',   60, 'Cath Lab, Echo, TMT',           'ECMO, Flat-panel Cath', '8:00-20:00'),
        (apollo_id, 'Neurology',           'Dr. Sudhir Kumar',         35, 'Stroke Unit, EEG, Video EEG',   'Neuro-navigation',      '9:00-19:00'),
        (apollo_id, 'Medical Oncology',    'Dr. P Vijay Anand Reddy',  55, 'Chemo Day Care, Immunotherapy', 'PET-CT, TrueBeam',      '9:00-18:00'),
        (apollo_id, 'Orthopedics',         'Dr. K J Reddy',            50, 'Joint Replacement, Spine',      'Mako Robotic Arm',      '9:00-19:00'),
        (apollo_id, 'Gastroenterology',    'Dr. Nageshwar Reddy',      40, 'Advanced Endoscopy',            'SpyGlass, ERCP',        '9:00-18:00'),
        (apollo_id, 'Nephrology',          'Dr. Sanjay Maitra',        45, 'Dialysis, Transplant',          'NxStage, CRRT',         '24/7'),
        (apollo_id, 'Obstetrics & Gynecology','Dr. Anuradha Panda',   45, 'High Risk Pregnancy, IVF',      'Laparoscopy, 4D USG',   '24/7'),
        (apollo_id, 'Pediatrics & Neonatology','Dr. Indira Reddy',    40, 'Level III NICU, PICU',          'HFOV Ventilators',      '9:00-20:00'),
        (apollo_id, 'Pulmonology',         'Dr. Dhruv Chauhan',        30, 'Interventional Pulmonology',    'EBUS, Thoracoscopy',    '9:00-18:00'),
        (apollo_id, 'Urology & Uro-oncology','Dr. Mallikarjuna C',    25, 'Robotic Urology, Laser',        'Da Vinci Xi, HoLEP',    '9:00-19:00')
    ON CONFLICT DO NOTHING;

    -- Doctors (~300 rows)
    INSERT INTO doctors (
        department_id, full_name, specialization, qualifications,
        experience_years, consultation_fee_inr, available_days,
        time_slots, languages, special_interests, opd_room
    )
    SELECT 
        d.id,
        'Dr. ' || fn.fn || ' ' || ln.ln,
        d.name,
        q.qual,
        6 + floor(random()*28)::int,
        500 + floor(random()*1800)::int,
        'Mon,Tue,Wed,Thu,Fri,Sat',
        '09:00-13:00,16:00-20:00',
        'English,Hindi,Telugu',
        i.special_interest,
        'Room ' || (100 + row_number() OVER (PARTITION BY d.id ORDER BY random()))::text
    FROM departments d
    CROSS JOIN (VALUES ('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J'),('K'),('L'),('M'),('N'),('O'),('P'),('Q'),('R'),('S'),('T')) fn(fn)
    CROSS JOIN (VALUES ('Kumar'),('Reddy'),('Sharma'),('Rao'),('Patel'),('Singh'),('Gupta'),('Iyer'),('Nair'),('Menon'),('Joshi'),('Verma'),('Mehta'),('Saxena'),('Trivedi'),('Chopra'),('Malhotra'),('Kapoor'),('Bansal')) ln(ln)
    CROSS JOIN (VALUES ('MBBS, MD, DM'), ('MBBS, MS, MCh'), ('MBBS, MD, DNB'), ('MBBS, MS'), ('MBBS, MD, Fellowship')) q(qual)
    CROSS JOIN (VALUES 
        ('Interventional Cardiology'), ('Stroke & Neurocritical Care'), ('Medical Oncology & Immunotherapy'),
        ('Joint Replacement & Arthroscopy'), ('Advanced Endoscopy & Hepatology'), ('Kidney Transplant & Dialysis'),
        ('High Risk Pregnancy & IVF'), ('Neonatology & Pediatric Critical Care'), ('Interventional Pulmonology'),
        ('Robotic Urology & Uro-oncology')
    ) i(special_interest)
    WHERE d.name IN ('Cardiology','Neurology','Medical Oncology','Orthopedics','Gastroenterology','Nephrology','Obstetrics & Gynecology','Pediatrics & Neonatology','Pulmonology','Urology & Uro-oncology')
    LIMIT 300
    ON CONFLICT DO NOTHING;

    -- Health packages, feedback, rooms (shortened for brevity - add more if needed)
    INSERT INTO health_packages (hospital_id, name, price_inr, duration, target_age_group, tests_included)
    VALUES
        (apollo_id, 'Master Health Check', 4800, 'Half day', '35+', 'CBC,LFT,KFT,Lipid,ECG,USG,X-Ray'),
        (apollo_id, 'Executive Cardiac', 13500, 'Full day', '40+', 'TMT,Echo,Lipid,CT Coronary'),
        (apollo_id, 'Whole Body Premium', 32000, '2 days', '45+', 'MRI,PET-CT,Full panel,Mammogram')
    ON CONFLICT DO NOTHING;

    INSERT INTO patient_feedback (hospital_id, patient_name, department_name, doctor_name, rating, review_text, visit_date)
    SELECT apollo_id, 'Patient ' || chr(65 + (random()*20)::int) || floor(random()*1000)::text,
           d.name, 'Dr. Sample', floor(random()*4)+2, 'Good experience', CURRENT_DATE - (random()*365)::int
    FROM departments d LIMIT 100
    ON CONFLICT DO NOTHING;

    INSERT INTO room_types (hospital_id, type_name, price_per_day_inr, description)
    VALUES
        (apollo_id, 'General Ward', 3200, 'Shared 6-10 beds'),
        (apollo_id, 'Private Room', 11500, 'Single room'),
        (apollo_id, 'Suite', 28000, 'Luxury suite')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Apollo Hospitals data seeded';
END $$;

-- =============================================================================
-- SEED DATA - TECH MAHINDRA
-- =============================================================================

DO $$
DECLARE
    techm_id UUID;
BEGIN
    INSERT INTO companies (
        name, tagline, founded_year, ceo_name, total_employees,
        annual_revenue_inr, headquarters_address, website, careers_email
    )
    VALUES (
        'Tech Mahindra Limited',
        'Scale at Speed™',
        1986,
        'Mohit Joshi',
        149000,
        551200000000,
        'Rajiv Gandhi Infotech Park, Hinjawadi, Pune 411057 (Major hub: Hyderabad)',
        'https://www.techmahindra.com',
        'careers@techmahindra.com'
    )
    ON CONFLICT (name) DO UPDATE SET
        tagline = EXCLUDED.tagline, founded_year = EXCLUDED.founded_year,
        ceo_name = EXCLUDED.ceo_name, total_employees = EXCLUDED.total_employees,
        annual_revenue_inr = EXCLUDED.annual_revenue_inr,
        headquarters_address = EXCLUDED.headquarters_address,
        website = EXCLUDED.website, careers_email = EXCLUDED.careers_email
    RETURNING id INTO techm_id;

    INSERT INTO business_units (company_id, name, head_name, team_size, key_technologies)
    VALUES
        (techm_id, 'Communications, Media & Entertainment', 'Harshvendra Soin', 32000, '5G, Open RAN, OSS/BSS'),
        (techm_id, 'Banking, Financial Services & Insurance', 'Kunal Purohit', 38000, 'GenAI Fraud, Blockchain'),
        (techm_id, 'Manufacturing & Resources', 'Rajiv Vyas', 22000, 'Industry 4.0, Digital Twin'),
        (techm_id, 'Next Generation AI Services', 'Kunal Purohit', 21000, 'Gemini, Azure OpenAI'),
        (techm_id, 'Business Process Services', 'Birendra Sen', 28000, 'RPA, Intelligent Automation')
    ON CONFLICT DO NOTHING;

    -- Job openings (~200 rows - increase LIMIT if you want more)
    INSERT INTO job_openings (company_id, title, department, location, experience_years_min, job_type, salary_range_inr, openings, work_mode, required_skills, description)
    SELECT 
        techm_id,
        t.title,
        bu.name,
        l.city,
        3 + floor(random()*10)::int,
        'Full-time',
        (8 + floor(random()*30)::int)::text || '-' || (15 + floor(random()*50)::int)::text || ' LPA',
        floor(random()*15)+1,
        (array['Hybrid','On-site'])[floor(random()*2)+1],
        s.skills,
        'Exciting opportunity in transformation projects'
    FROM business_units bu
    CROSS JOIN (VALUES 
        ('Senior Java Developer'), ('Python AI/ML Engineer'), ('Azure Cloud Architect'),
        ('DevOps Engineer'), ('SAP Consultant'), ('React Developer'), ('GenAI Specialist')
    ) t(title)
    CROSS JOIN (VALUES 
        ('Hyderabad'), ('Pune'), ('Bangalore'), ('Chennai'), ('Noida'), ('Mumbai')
    ) l(city)
    CROSS JOIN (VALUES 
        ('Java,Spring Boot,AWS'), ('Python,TensorFlow,Azure'), ('Kubernetes,CI/CD'),
        ('SAP ABAP,S/4HANA'), ('React,TypeScript'), ('LLM,RAG,Prompt Eng')
    ) s(skills)
    LIMIT 200
    ON CONFLICT DO NOTHING;

    INSERT INTO office_locations (company_id, city, address, size_sqft, employees_count, departments, contact_phone, landmark)
    VALUES
        (techm_id, 'Pune', 'Hinjawadi Phase III', 620000, 32000, 'All', '+91-20-66273000', 'Rajiv Gandhi Park'),
        (techm_id, 'Hyderabad', 'Hi-Tech City', 520000, 28000, 'BFSI, AI', '+91-40-44333000', 'Cyber Towers'),
        (techm_id, 'Bangalore', 'Manyata Tech Park', 380000, 19000, 'Enterprise', '+91-80-41920000', 'Nagawara')
    ON CONFLICT DO NOTHING;

    INSERT INTO leadership_team (company_id, name, designation, department, years_with_company, email, office_location)
    VALUES
        (techm_id, 'Mohit Joshi', 'CEO & MD', 'Executive', 3, 'mohit.joshi@techmahindra.com', 'Pune'),
        (techm_id, 'Atul Soneja', 'COO', 'Operations', 10, 'atul.soneja@techmahindra.com', 'Pune'),
        (techm_id, 'Kunal Purohit', 'President BFSI', 'BFSI', 9, 'kunal.purohit@techmahindra.com', 'Pune')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Tech Mahindra data seeded';
END $$;

-- =============================================================================
-- FINAL MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'All tables created and seeded successfully.';
    RAISE NOTICE 'Run the following to check counts:';
    RAISE NOTICE 'SELECT table_name, count(*) FROM (';
    RAISE NOTICE '  SELECT ''hospitals'' AS table_name, count(*) FROM hospitals UNION ALL';
    RAISE NOTICE '  SELECT ''departments'', count(*) FROM departments UNION ALL';
    RAISE NOTICE '  SELECT ''doctors'', count(*) FROM doctors UNION ALL';
    RAISE NOTICE '  SELECT ''companies'', count(*) FROM companies UNION ALL';
    RAISE NOTICE '  SELECT ''job_openings'', count(*) FROM job_openings';
    RAISE NOTICE ') t;';
END $$;