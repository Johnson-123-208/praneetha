import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Database Check ---');
    console.log('Project URL:', process.env.VITE_SUPABASE_URL);

    const { data: tables, error: tError } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    if (tError) {
        console.error('Error fetching companies table:', tError.message);
    } else {
        console.log('Companies table exists. Count:', tables);
    }

    const { data: profiles, error: pError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (pError) {
        console.error('Error fetching profiles table:', pError.message);
    } else {
        console.log('Profiles table exists. Count:', profiles);
    }
}

check();
