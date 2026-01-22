-- =========================
-- CLEANUP (safe re-run)
-- =========================
DROP TABLE IF EXISTS shipment_status_log;
DROP TABLE IF EXISTS support_ticket_registry;
DROP TABLE IF EXISTS refund_request_log;
DROP TABLE IF EXISTS tracking_voice_conversations;

-- =========================
-- TABLE CREATION
-- =========================

CREATE TABLE shipment_status_log (
    id SERIAL PRIMARY KEY,
    order_ref TEXT,
    current_status TEXT,
    last_updated TIMESTAMP
);

CREATE TABLE support_ticket_registry (
    id SERIAL PRIMARY KEY,
    ticket_ref TEXT,
    order_ref TEXT,
    issue_type TEXT,
    ticket_status TEXT,
    created_at TIMESTAMP
);

CREATE TABLE refund_request_log (
    id SERIAL PRIMARY KEY,
    order_ref TEXT,
    refund_reason TEXT,
    refund_status TEXT,
    requested_at TIMESTAMP
);

CREATE TABLE tracking_voice_conversations (
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
    callers TEXT[] := ARRAY[
        'Rahul','Priya','Arjun','Sneha','Vivek','Ananya',
        'Rohan','Divya','Siddharth','Nisha','Amit','Pallavi'
    ];
    issues TEXT[] := ARRAY[
        'track my order',
        'order is delayed',
        'cancel my order',
        'request a refund',
        'change delivery address',
        'item delivered but damaged'
    ];
    statuses TEXT[] := ARRAY[
        'Placed','Confirmed','Packed','Shipped',
        'Out for Delivery','Delivered','Cancelled'
    ];
    refund_reasons TEXT[] := ARRAY[
        'Item damaged',
        'Wrong product delivered',
        'Order cancelled by user',
        'Delivery delay',
        'Product not required anymore'
    ];
    order_ref TEXT;
BEGIN
    -- Shipment status log
    FOR i IN 1..25000 LOOP
        order_ref := 'ORD' || LPAD((i % 15000 + 1)::TEXT, 6, '0');

        INSERT INTO shipment_status_log
        (order_ref, current_status, last_updated)
        VALUES
        (
            order_ref,
            statuses[(i % array_length(statuses,1)) + 1],
            NOW() - (i % 10) * INTERVAL '1 hour'
        );
    END LOOP;

    -- Support tickets
    FOR i IN 1..12000 LOOP
        order_ref := 'ORD' || LPAD((i % 15000 + 1)::TEXT, 6, '0');

        INSERT INTO support_ticket_registry
        (ticket_ref, order_ref, issue_type, ticket_status, created_at)
        VALUES
        (
            'TCK' || LPAD(i::TEXT, 7, '0'),
            order_ref,
            issues[(i % array_length(issues,1)) + 1],
            CASE
                WHEN i % 3 = 0 THEN 'Open'
                WHEN i % 3 = 1 THEN 'In Progress'
                ELSE 'Resolved'
            END,
            NOW() - (i % 5) * INTERVAL '1 day'
        );
    END LOOP;

    -- Refund requests
    FOR i IN 1..8000 LOOP
        order_ref := 'ORD' || LPAD((i % 15000 + 1)::TEXT, 6, '0');

        INSERT INTO refund_request_log
        (order_ref, refund_reason, refund_status, requested_at)
        VALUES
        (
            order_ref,
            refund_reasons[(i % array_length(refund_reasons,1)) + 1],
            CASE
                WHEN i % 3 = 0 THEN 'Requested'
                WHEN i % 3 = 1 THEN 'Approved'
                ELSE 'Completed'
            END,
            NOW() - (i % 7) * INTERVAL '1 day'
        );
    END LOOP;

    -- Voice conversations (20,000+ tracking & support calls)
    FOR i IN 1..20000 LOOP
        INSERT INTO tracking_voice_conversations
        (user_query, agent_response)
        VALUES
        (
            'Hi, this is ' || callers[(i % array_length(callers,1)) + 1] ||
            '. I want to ' || issues[(i % array_length(issues,1)) + 1] || '.',

            'I can help you with that. Please share your order ID so I can check the latest status and assist you further.'
        );
    END LOOP;
END $$;
