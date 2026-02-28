-- Add supporting columns for better dashboard display
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sub_title TEXT;

-- Update existing records to have some data if possible
UPDATE bookings SET title = target_item WHERE title IS NULL;
UPDATE bookings SET sub_title = booking_type WHERE sub_title IS NULL;
