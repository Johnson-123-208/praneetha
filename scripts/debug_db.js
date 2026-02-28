
import { supabase } from './src/utils/supabase.js';

async function checkCompanies() {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Companies:', data);
    }

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Profile Error:', pError);
    } else {
        console.log('Profiles:', profiles);
    }
}

checkCompanies();
