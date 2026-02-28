import { createClient } from '@supabase/supabase-js';

// We use the '/supabase' proxy in both development and production to bypass ISP blocks.
const supabaseUrl = `${window.location.origin}/supabase`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL or Anon Key is missing. Database operations will fail.');
}

let supabaseInstance = null;

export const supabase = (() => {
    if (!supabaseInstance) {
        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('⚠️ Supabase URL or Anon Key is missing. Database operations will fail.');
        }
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
})();
