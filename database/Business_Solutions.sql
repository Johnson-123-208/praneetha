-- =========================
-- CLEANUP (safe re-run)
-- =========================
DROP TABLE IF EXISTS biz_profile_core;
DROP TABLE IF EXISTS biz_service_catalog;
DROP TABLE IF EXISTS pricing_plan_matrix;
DROP TABLE IF EXISTS demo_slot_calendar;
DROP TABLE IF EXISTS sales_voice_conversations;

-- =========================
-- TABLE CREATION
-- =========================

CREATE TABLE biz_profile_core (
    id SERIAL PRIMARY KEY,
    company_name TEXT,
    industry TEXT,
    support_email TEXT,
    support_phone TEXT,
    opening_time TIME,
    closing_time TIME
);

CREATE TABLE biz_service_catalog (
    id SERIAL PRIMARY KEY,
    service_name TEXT,
    target_industry TEXT,
    description TEXT
);

CREATE TABLE pricing_plan_matrix (
    id SERIAL PRIMARY KEY,
    plan_name TEXT,
    monthly_price_inr INT,
    max_users INT,
    support_level TEXT
);

CREATE TABLE demo_slot_calendar (
    id SERIAL PRIMARY KEY,
    demo_date DATE,
    demo_time TIME,
    slot_status TEXT
);

CREATE TABLE sales_voice_conversations (
    id SERIAL PRIMARY KEY,
    user_query TEXT,
    agent_response TEXT
);

-- =========================
-- DATA GENERATION
-- =========================

DO $$
DECLARE
    i INT;
    services TEXT[] := ARRAY[
        'AI Voice Automation',
        'Customer Support Automation',
        'CRM Integration',
        'Sales Call Analytics',
        'Appointment Scheduling AI'
    ];
    industries TEXT[] := ARRAY[
        'Healthcare','E-commerce','Finance','Retail','Education','Logistics'
    ];
    callers TEXT[] := ARRAY[
        'Rahul','Priya','Arjun','Sneha','Vivek','Ananya',
        'Rohan','Divya','Siddharth','Nisha','Amit','Pallavi'
    ];
    intents TEXT[] := ARRAY[
        'know about your services',
        'request a product demo',
        'ask pricing details',
        'compare plans',
        'talk to sales executive',
        'check enterprise solutions'
    ];
BEGIN
    -- Company profile
    INSERT INTO biz_profile_core
    (company_name, industry, support_email, support_phone, opening_time, closing_time)
    VALUES
    ('VoxSphere Solutions','AI & Automation','sales@voxsphere.com','+91-9111111111','09:00','19:00');

    -- Services
    FOR i IN 1..1000 LOOP
        INSERT INTO biz_service_catalog
        (service_name, target_industry, description)
        VALUES
        (
            services[(i % array_length(services,1)) + 1],
            industries[(i % array_length(industries,1)) + 1],
            'A scalable AI-driven solution designed for modern ' ||
            industries[(i % array_length(industries,1)) + 1] || ' businesses.'
        );
    END LOOP;

    -- Pricing plans
    FOR i IN 1..500 LOOP
        INSERT INTO pricing_plan_matrix
        (plan_name, monthly_price_inr, max_users, support_level)
        VALUES
        (
            CASE
                WHEN i % 3 = 0 THEN 'Starter'
                WHEN i % 3 = 1 THEN 'Professional'
                ELSE 'Enterprise'
            END,
            2999 + (i % 15000),
            5 + (i % 100),
            CASE
                WHEN i % 3 = 0 THEN 'Email'
                WHEN i % 3 = 1 THEN 'Email + Chat'
                ELSE '24x7 Priority'
            END
        );
    END LOOP;

    -- Demo slots
    FOR i IN 1..2500 LOOP
        INSERT INTO demo_slot_calendar
        (demo_date, demo_time, slot_status)
        VALUES
        (
            CURRENT_DATE + (i % 25),
            TIME '10:00' + (INTERVAL '1 hour' * (i % 7)),
            CASE WHEN i % 4 = 0 THEN 'Booked' ELSE 'Available' END
        );
    END LOOP;

    -- Voice conversations (20,000+ B2B sales calls)
    FOR i IN 1..20000 LOOP
        INSERT INTO sales_voice_conversations
        (user_query, agent_response)
        VALUES
        (
            'Hello, this is ' || callers[(i % array_length(callers,1)) + 1] ||
            '. I want to ' || intents[(i % array_length(intents,1)) + 1] || '.',

            'Thank you for contacting VoxSphere Solutions. ' ||
            'We offer AI-powered services like ' ||
            services[(i % array_length(services,1)) + 1] ||
            '. I can explain pricing or schedule a demo for you.'
        );
    END LOOP;
END $$;
