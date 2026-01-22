-- =========================
-- CLEANUP (safe re-run)
-- =========================
DROP TABLE IF EXISTS dinehouse_profile;
DROP TABLE IF EXISTS food_catalog_registry;
DROP TABLE IF EXISTS chef_special_registry;
DROP TABLE IF EXISTS seating_slot_grid;
DROP TABLE IF EXISTS diner_voice_conversations;

-- =========================
-- TABLE CREATION
-- =========================

CREATE TABLE dinehouse_profile (
    id SERIAL PRIMARY KEY,
    restaurant_name TEXT,
    opening_time TIME,
    closing_time TIME,
    cuisine_type TEXT,
    contact_number TEXT
);

CREATE TABLE food_catalog_registry (
    id SERIAL PRIMARY KEY,
    item_name TEXT,
    category TEXT,
    price_inr INT,
    is_veg BOOLEAN
);

CREATE TABLE chef_special_registry (
    id SERIAL PRIMARY KEY,
    item_name TEXT,
    chef_name TEXT,
    popularity_score INT
);

CREATE TABLE seating_slot_grid (
    id SERIAL PRIMARY KEY,
    table_size INT,
    booking_date DATE,
    booking_time TIME,
    slot_status TEXT
);

CREATE TABLE diner_voice_conversations (
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
    dishes TEXT[] := ARRAY[
        'Butter Chicken','Paneer Tikka','Chicken Biryani','Veg Biryani',
        'Dal Tadka','Fish Curry','Masala Dosa','Chicken 65',
        'Veg Fried Rice','Mutton Rogan Josh'
    ];
    categories TEXT[] := ARRAY[
        'Main Course','Starters','Rice','South Indian','North Indian'
    ];
    callers TEXT[] := ARRAY[
        'Rahul','Priya','Arjun','Sneha','Vivek',
        'Ananya','Rohan','Divya','Siddharth','Nisha'
    ];
    intents TEXT[] := ARRAY[
        'book a table',
        'check menu prices',
        'ask for chef special',
        'get a food recommendation',
        'know opening timings',
        'ask for veg options'
    ];
BEGIN
    -- Restaurant profile
    INSERT INTO dinehouse_profile
    (restaurant_name, opening_time, closing_time, cuisine_type, contact_number)
    VALUES
    ('Spice Garden','10:00','23:00','Indian Multi-Cuisine','+91-9123456789');

    -- Menu items
    FOR i IN 1..800 LOOP
        INSERT INTO food_catalog_registry
        (item_name, category, price_inr, is_veg)
        VALUES
        (
            dishes[(i % array_length(dishes,1)) + 1],
            categories[(i % array_length(categories,1)) + 1],
            180 + (i % 250),
            CASE WHEN i % 3 = 0 THEN TRUE ELSE FALSE END
        );
    END LOOP;

    -- Chef specials
    FOR i IN 1..200 LOOP
        INSERT INTO chef_special_registry
        (item_name, chef_name, popularity_score)
        VALUES
        (
            dishes[(i % array_length(dishes,1)) + 1],
            'Chef ' || callers[(i % array_length(callers,1)) + 1],
            70 + (i % 30)
        );
    END LOOP;

    -- Seating / table booking slots
    FOR i IN 1..4000 LOOP
        INSERT INTO seating_slot_grid
        (table_size, booking_date, booking_time, slot_status)
        VALUES
        (
            CASE
                WHEN i % 4 = 0 THEN 2
                WHEN i % 4 = 1 THEN 4
                WHEN i % 4 = 2 THEN 6
                ELSE 8
            END,
            CURRENT_DATE + (i % 30),
            TIME '12:00' + (INTERVAL '30 minutes' * (i % 18)),
            CASE WHEN i % 5 = 0 THEN 'Booked' ELSE 'Available' END
        );
    END LOOP;

    -- Voice conversations (18,000+ realistic calls)
    FOR i IN 1..18000 LOOP
        INSERT INTO diner_voice_conversations
        (user_query, agent_response)
        VALUES
        (
            'Hello, this is ' || callers[(i % array_length(callers,1)) + 1] ||
            '. I want to ' || intents[(i % array_length(intents,1)) + 1] || '.',

            'Welcome to Spice Garden Restaurant. ' ||
            'Our popular dish is ' || dishes[(i % array_length(dishes,1)) + 1] ||
            '. We are open from 10 AM to 11 PM. ' ||
            'I can help you with table booking or recommendations.'
        );
    END LOOP;
END $$;
