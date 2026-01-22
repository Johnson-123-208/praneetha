import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseInitialized = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};

// Helper methods that match the old supabaseDB usage in App.jsx
export const supabaseDB = {
    getHospitals: async () => {
        const { data, error } = await supabase.from('hospitals').select('*');
        if (error) return [];
        return data;
    },
    getCompanies: async () => {
        const { data, error } = await supabase.from('companies').select('*');
        if (error) return [];
        return data;
    }
};

export default supabaseDB;
