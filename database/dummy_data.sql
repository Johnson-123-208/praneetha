-- ============================================
-- DUMMY DATA FOR PRANEETHA'S DASHBOARD (v2)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure the specialized companies exist
INSERT INTO companies (id, name, industry, api_linked)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aarogya Multispeciality', 'Healthcare', true),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QuickKart Store', 'E-Commerce', true),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'VoxSphere Solutions', 'AI & Business', true),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Spice Garden', 'Food & Beverage', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Dummy Appointments (Column names: appointment_date, appointment_time)
INSERT INTO appointments (entity_id, entity_name, appointment_type, person_name, appointment_date, appointment_time, user_email, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aarogya Multispeciality', 'doctor', 'Dr. Sreenivas Kumar', CURRENT_DATE + 1, '10:30:00', 'praneetha@gnit.com', 'scheduled'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'VoxSphere Solutions', 'general', 'Strategy Meeting', CURRENT_DATE + 2, '14:00:00', 'praneetha@gnit.com', 'scheduled');

-- 3. Dummy Orders (Column name: user_email)
INSERT INTO orders (id, company_id, item, quantity, total_price, customer_name, user_email, status)
VALUES 
  ('ORDX01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Wireless Mouse', 1, 1200.00, 'Praneetha', 'praneetha@gnit.com', 'completed'),
  ('ORDX02', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Smart Watch', 1, 4500.00, 'Praneetha', 'praneetha@gnit.com', 'processing');

-- 4. Dummy Restaurant Bookings
INSERT INTO restaurant_bookings (restaurant_id, restaurant_name, customer_name, party_size, booking_date, booking_time, user_email, status)
VALUES 
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Spice Garden', 'Praneetha', 4, CURRENT_DATE + 3, '19:30:00', 'praneetha@gnit.com', 'confirmed');

-- 5. Dummy Feedback (Table: feedbacks)
INSERT INTO feedbacks (entity_id, entity_name, rating, comment, category, user_email)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aarogya Multispeciality', 5, 'Very helpful AI receptionist, booking was seamless.', 'service', 'praneetha@gnit.com'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QuickKart Store', 4, 'Fast response but the menu navigation could be smoother.', 'general', 'praneetha@gnit.com');
