-- =========================
-- CLEANUP (safe re-run)
-- =========================
DROP TABLE IF EXISTS care_center_profile;
DROP TABLE IF EXISTS medical_staff_registry;
DROP TABLE IF EXISTS staff_availability_grid;
DROP TABLE IF EXISTS consultation_slots;
DROP TABLE IF EXISTS patient_voice_conversations;

-- =========================
-- TABLE CREATION
-- =========================

CREATE TABLE care_center_profile (
    id SERIAL PRIMARY KEY,
    center_name TEXT,
    opening_time TIME,
    closing_time TIME,
    emergency_support BOOLEAN,
    contact_number TEXT
);

CREATE TABLE medical_staff_registry (
    id SERIAL PRIMARY KEY,
    doctor_name TEXT,
    department TEXT,
    experience_years INT
);

CREATE TABLE staff_availability_grid (
    id SERIAL PRIMARY KEY,
    doctor_name TEXT,
    department TEXT,
    available_date DATE,
    start_time TIME,
    end_time TIME
);

CREATE TABLE consultation_slots (
    id SERIAL PRIMARY KEY,
    doctor_name TEXT,
    slot_date DATE,
    slot_time TIME,
    slot_status TEXT
);

CREATE TABLE patient_voice_conversations (
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
    depts TEXT[] := ARRAY[
        'Cardiology','Neurology','Orthopedics','Dermatology',
        'ENT','Pediatrics','General Medicine'
    ];
    doctors TEXT[] := ARRAY[
        'Dr. Anil Kumar','Dr. Meera Iyer','Dr. Rakesh Verma',
        'Dr. Sunita Rao','Dr. Kunal Mehta','Dr. Ayesha Khan'
    ];
    callers TEXT[] := ARRAY[
        'Rahul','Priya','Arjun','Sneha','Vivek',
        'Ananya','Rohan','Divya','Siddharth','Nisha'
    ];
    symptoms TEXT[] := ARRAY[
        'chest pain','headache','joint pain','skin allergy',
        'fever','ear pain','stomach issue'
    ];
    actions TEXT[] := ARRAY[
        'book an appointment',
        'check doctor availability',
        'reschedule my visit',
        'cancel my appointment'
    ];
BEGIN
    -- Hospital profile (single row)
    INSERT INTO care_center_profile
    (center_name, opening_time, closing_time, emergency_support, contact_number)
    VALUES
    ('Aarogya Multispeciality Center','08:00','21:00',TRUE,'+91-9876543210');

    -- Doctors
    FOR i IN 1..array_length(doctors,1) LOOP
        INSERT INTO medical_staff_registry
        (doctor_name, department, experience_years)
        VALUES
        (
            doctors[i],
            depts[(i % array_length(depts,1)) + 1],
            6 + (i % 15)
        );
    END LOOP;

    -- Doctor availability
    FOR i IN 1..3000 LOOP
        INSERT INTO staff_availability_grid
        (doctor_name, department, available_date, start_time, end_time)
        VALUES
        (
            doctors[(i % array_length(doctors,1)) + 1],
            depts[(i % array_length(depts,1)) + 1],
            CURRENT_DATE + (i % 20),
            '09:00',
            '17:00'
        );
    END LOOP;

    -- Appointment slots
    FOR i IN 1..5000 LOOP
        INSERT INTO consultation_slots
        (doctor_name, slot_date, slot_time, slot_status)
        VALUES
        (
            doctors[(i % array_length(doctors,1)) + 1],
            CURRENT_DATE + (i % 30),
            TIME '09:00' + (INTERVAL '30 minutes' * (i % 12)),
            CASE WHEN i % 4 = 0 THEN 'Booked' ELSE 'Available' END
        );
    END LOOP;

    -- Voice conversations (20,000+ with variation)
    FOR i IN 1..20000 LOOP
        INSERT INTO patient_voice_conversations
        (user_query, agent_response)
        VALUES
        (
            'Hi, this is ' || callers[(i % array_length(callers,1)) + 1] ||
            '. I want to ' || actions[(i % array_length(actions,1)) + 1] ||
            ' for ' || symptoms[(i % array_length(symptoms,1)) + 1] || '.',

            'Thank you for calling Aarogya Multispeciality Center. ' ||
            'For ' || symptoms[(i % array_length(symptoms,1)) + 1] ||
            ', our ' || depts[(i % array_length(depts,1)) + 1] ||
            ' specialist ' || doctors[(i % array_length(doctors,1)) + 1] ||
            ' is available. Please tell me a suitable date.'
        );
    END LOOP;
END $$;
