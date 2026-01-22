-- =========================
-- CLEANUP (safe re-run)
-- =========================
DROP TABLE IF EXISTS shop_profile_core;
DROP TABLE IF EXISTS product_inventory_map;
DROP TABLE IF EXISTS order_intake_registry;
DROP TABLE IF EXISTS order_item_lines;
DROP TABLE IF EXISTS order_voice_conversations;

-- =========================
-- TABLE CREATION
-- =========================

CREATE TABLE shop_profile_core (
    id SERIAL PRIMARY KEY,
    shop_name TEXT,
    support_email TEXT,
    support_phone TEXT,
    opening_time TIME,
    closing_time TIME
);

CREATE TABLE product_inventory_map (
    id SERIAL PRIMARY KEY,
    product_name TEXT,
    category TEXT,
    price_inr INT,
    stock_quantity INT
);

CREATE TABLE order_intake_registry (
    id SERIAL PRIMARY KEY,
    order_ref TEXT,
    order_date DATE,
    order_status TEXT,
    total_amount INT
);

CREATE TABLE order_item_lines (
    id SERIAL PRIMARY KEY,
    order_ref TEXT,
    product_name TEXT,
    quantity INT,
    line_amount INT
);

CREATE TABLE order_voice_conversations (
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
    products TEXT[] := ARRAY[
        'Wireless Mouse','Bluetooth Headphones','Smart Watch',
        'Laptop Backpack','USB-C Charger','Mechanical Keyboard',
        'Power Bank','Noise Cancelling Earbuds'
    ];
    categories TEXT[] := ARRAY[
        'Electronics','Accessories','Wearables'
    ];
    callers TEXT[] := ARRAY[
        'Rahul','Priya','Arjun','Sneha','Vivek','Ananya',
        'Rohan','Divya','Siddharth','Nisha','Amit','Pallavi'
    ];
    intents TEXT[] := ARRAY[
        'place an order',
        'buy a product',
        'check product availability',
        'confirm price before ordering',
        'order multiple items'
    ];
    order_ref TEXT;
    qty INT;
BEGIN
    -- Shop profile
    INSERT INTO shop_profile_core
    (shop_name, support_email, support_phone, opening_time, closing_time)
    VALUES
    ('QuickKart Online Store','support@quickkart.com','+91-9000000000','09:00','22:00');

    -- Products
    FOR i IN 1..1200 LOOP
        INSERT INTO product_inventory_map
        (product_name, category, price_inr, stock_quantity)
        VALUES
        (
            products[(i % array_length(products,1)) + 1],
            categories[(i % array_length(categories,1)) + 1],
            499 + (i % 2500),
            20 + (i % 300)
        );
    END LOOP;

    -- Orders + order items
    FOR i IN 1..15000 LOOP
        order_ref := 'ORD' || LPAD(i::TEXT, 6, '0');
        qty := (i % 4) + 1;

        INSERT INTO order_intake_registry
        (order_ref, order_date, order_status, total_amount)
        VALUES
        (
            order_ref,
            CURRENT_DATE - (i % 15),
            CASE
                WHEN i % 4 = 0 THEN 'Placed'
                WHEN i % 4 = 1 THEN 'Confirmed'
                WHEN i % 4 = 2 THEN 'Packed'
                ELSE 'Shipped'
            END,
            qty * (999 + (i % 1500))
        );

        INSERT INTO order_item_lines
        (order_ref, product_name, quantity, line_amount)
        VALUES
        (
            order_ref,
            products[(i % array_length(products,1)) + 1],
            qty,
            qty * (999 + (i % 1500))
        );
    END LOOP;

    -- Voice conversations (20,000+ order placing calls)
    FOR i IN 1..20000 LOOP
        INSERT INTO order_voice_conversations
        (user_query, agent_response)
        VALUES
        (
            'Hi, this is ' || callers[(i % array_length(callers,1)) + 1] ||
            '. I want to ' || intents[(i % array_length(intents,1)) + 1] ||
            ' for a ' || products[(i % array_length(products,1)) + 1] || '.',

            'Sure. The ' || products[(i % array_length(products,1)) + 1] ||
            ' is currently available. I can place the order for you right now. ' ||
            'Please confirm the quantity and delivery address.'
        );
    END LOOP;
END $$;
