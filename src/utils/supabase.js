import { createClient } from '@supabase/supabase-js';

// In production (Vercel), we use a proxy to bypass ISP blocks in India.
// In development, we use the direct Supabase URL.
const supabaseUrl = import.meta.env.MODE === 'production'
    ? `${window.location.origin}/supabase`
    : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL or Anon Key is missing. Database operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
