-- ============================================
-- USER AUTHENTICATION SCHEMA (SIMPLIFIED)
-- ============================================
-- This version only creates what's needed for authentication
-- and doesn't create views that depend on other tables

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    preferred_language VARCHAR(50) DEFAULT 'en-US',
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- Add user_id to appointments table (if it exists and column doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='appointments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='appointments' AND column_name='user_id') THEN
            ALTER TABLE appointments ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
            CREATE INDEX idx_appointments_user ON appointments(user_id);
        END IF;
    END IF;
END $$;

-- Add user_id to orders table (if it exists and column doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='orders' AND column_name='user_id') THEN
            ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
            CREATE INDEX idx_orders_user ON orders(user_id);
        END IF;
    END IF;
END $$;

-- Add user_id to feedback table (if it exists and column doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='feedback') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='feedback' AND column_name='user_id') THEN
            ALTER TABLE feedback ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
            CREATE INDEX idx_feedback_user ON feedback(user_id);
        END IF;
    END IF;
END $$;

-- Add user_id to conversation_logs (if it exists and column doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='conversation_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='conversation_logs' AND column_name='user_id') THEN
            ALTER TABLE conversation_logs ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
            CREATE INDEX idx_conversation_logs_user ON conversation_logs(user_id);
        END IF;
    END IF;
END $$;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow public registration" ON users;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow session creation" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow public registration" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow session creation" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own sessions" ON user_sessions FOR DELETE USING (user_id = auth.uid());

-- Update trigger for users (only if function exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMENT ON TABLE users IS 'Stores user authentication and profile information';
COMMENT ON TABLE user_sessions IS 'Stores active user sessions for authentication';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ User authentication schema created successfully!';
    RAISE NOTICE '📝 Tables created:';
    RAISE NOTICE '   - users';
    RAISE NOTICE '   - user_sessions';
    RAISE NOTICE '📝 Columns added to existing tables (if they exist):';
    RAISE NOTICE '   - appointments.user_id';
    RAISE NOTICE '   - orders.user_id';
    RAISE NOTICE '   - feedback.user_id';
    RAISE NOTICE '   - conversation_logs.user_id';
    RAISE NOTICE '';
    RAISE NOTICE '� Next steps:';
    RAISE NOTICE '   1. Enable Email authentication in Supabase Dashboard';
    RAISE NOTICE '   2. Test sign up/sign in functionality';
    RAISE NOTICE '   3. Verify users table has data after signup';
END $$;
