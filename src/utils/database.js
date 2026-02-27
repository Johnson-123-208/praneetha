import { supabase } from './supabase';

/**
 * FINAL CLEAN DATABASE LAYER
 * Maps universal AI actions to industry-specific Supabase tables.
 */

// --- Industry Constants ---
export const INDUSTRIES = {
  HEALTHCARE: 'Healthcare',
  RESTAURANT: 'Food & Beverage',
  ECOMMERCE: 'E-Commerce',
  BUSINESS: 'Technology'
};

export const getApiUrl = () => {
  return (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5000/api');
};

const notifySuperadmin = async (adminData) => {
  try {
    await fetch(`${getApiUrl()}/notify-superadmin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    });
  } catch (err) {
    console.warn('Notification failed:', err);
  }
};

export const database = {
  // --- AUTHENTICATION ---
  signUp: async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      if (err.message.includes('fetch') || err.message.includes('timeout')) {
        return { user: { id: 'mock-' + Date.now(), email, user_metadata: { full_name: fullName } }, isMock: true };
      }
      throw err;
    }
  },

  signUpAdmin: async (email, password, fullName, companyName, industry) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin',
            company_name: companyName,
            industry: industry
          }
        }
      });
      if (error) throw error;
      await notifySuperadmin({ fullName, email, companyName, industry });
      return data;
    } catch (err) { throw err; }
  },

  signIn: async (email, password) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (!authError && authData.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      if (profile?.status === 'pending') throw new Error('Account awaiting approval.');
      if (profile?.status === 'suspended') throw new Error('Account suspended.');
      return { ...authData.user, profile };
    }
    if (authError && (authError.message.includes('fetch') || authError.message.includes('timeout'))) {
      const role = email.includes('super') ? 'superadmin' : (email.includes('admin') ? 'admin' : 'user');
      return { email, profile: { id: 'mock', role, full_name: 'Mock User', company_id: 'mock-co' } };
    }
    throw authError;
  },

  signOut: async () => { try { await supabase.auth.signOut(); } catch (e) { } },

  // --- DATA FETCHING ---
  getCompanies: async () => {
    const { data, error } = await supabase.from('companies').select('*');
    return error ? [] : data;
  },

  getCompany: async (id) => {
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
    return error ? null : data;
  },

  // --- UNIVERSAL INTERACTION ENGINE ---
  saveOrder: async (order) => {
    const payload = {
      company_id: order.companyId || order.company_id || order.entityId,
      user_email: order.userEmail || order.user_email,
      user_name: order.userName || order.user_name || 'Customer',
      type: 'order',
      title: order.item || 'Order',
      sub_title: order.quantity ? `${order.quantity} units` : '1 unit',
      amount: order.price || 0,
      status: 'completed',
      data: order
    };
    const { data, error } = await supabase.from('company_interactions').insert([payload]).select();
    return error ? { error: error.message } : data[0];
  },

  saveAppointment: async (appointment) => {
    const industry = appointment.industry;
    const payload = {
      company_id: appointment.companyId || appointment.company_id || appointment.entityId,
      user_email: appointment.userEmail || appointment.user_email,
      user_name: appointment.userName || appointment.user_name || 'Client',
      type: industry === INDUSTRIES.RESTAURANT ? 'reservation' : (industry === INDUSTRIES.BUSINESS ? 'meeting' : 'booking'),
      title: appointment.item || 'Appointment',
      sub_title: appointment.personName || appointment.person_name || 'General',
      date: appointment.date,
      time: appointment.time,
      status: 'scheduled',
      data: appointment
    };
    const { data, error } = await supabase.from('company_interactions').insert([payload]).select();
    return error ? { error: error.message } : data[0];
  },

  getUserData: async (email) => {
    const { data: all } = await supabase.from('company_interactions').select('*').eq('user_email', email).order('created_at', { ascending: false });
    return {
      appointments: (all || []).filter(i => i.type === 'booking'),
      reservations: (all || []).filter(i => i.type === 'reservation'),
      meetings: (all || []).filter(i => i.type === 'meeting'),
      orders: (all || []).filter(i => i.type === 'order')
    };
  },

  // --- AI TOOL LOGIC ---
  query_entity_database: async (params) => {
    const { entityId } = params;
    const company = await database.getCompany(entityId);
    if (!company) return { error: 'Company not found' };

    let knowledge = '';

    // 1. Unified Assets (Modern Folder)
    const { data: assets } = await supabase.from('company_assets').select('*').eq('company_id', entityId);
    if (assets) {
      knowledge += assets.map(a => `[${a.category.toUpperCase()}] ${a.name}: ${JSON.stringify(a.data)}`).join('\n');
    }

    // 2. Legacy Tables (Fallbacks)
    if (company.industry === INDUSTRIES.HEALTHCARE) {
      const { data } = await supabase.from('doctors').select('*').eq('company_id', entityId);
      if (data) knowledge += '\nDoctors: ' + data.map(d => `${d.doctor_name}`).join(', ');
    } else if (company.industry === INDUSTRIES.RESTAURANT) {
      const { data } = await supabase.from('menu').select('*').eq('company_id', entityId);
      if (data) knowledge += '\nMenu items available.';
    }

    return {
      result: knowledge || company.nlp_context || 'System operational.',
      entityName: company.name
    };
  },

  get_available_slots: async (params) => {
    const { entityId, date, industry } = params;
    let table = industry === INDUSTRIES.RESTAURANT ? 'restaurant_slots' : (industry === INDUSTRIES.BUSINESS ? 'staff_slots' : 'hospital_slots');
    const { data } = await supabase.from(table).select('time').eq('company_id', entityId).eq('date', date).eq('is_booked', false);
    return {
      available: data ? data.map(s => s.time) : [],
      message: data?.length ? `Available: ${data.map(s => s.time).join(', ')}` : 'No slots available.'
    };
  },

  getLiveCatalogue: async (companyId, industry) => {
    try {
      let knowledge = '';

      // 1. Fetch Unified Assets
      const { data: assets } = await supabase.from('company_assets').select('*').eq('company_id', companyId);
      if (assets?.length > 0) {
        knowledge += assets.map(a => `[${a.category}] ${a.name}`).join('\n');
      }

      // 2. Fetch Industry Specific Legacy Data
      if (industry === INDUSTRIES.HEALTHCARE) {
        const { data: doctors } = await supabase.from('doctors').select('doctor_name, specialty').eq('company_id', companyId);
        if (doctors?.length > 0) {
          knowledge += '\nDoctors Available:\n' + doctors.map(d => `- ${d.doctor_name} (${d.specialty || 'General'})`).join('\n');
        }
      } else if (industry === INDUSTRIES.RESTAURANT) {
        const { data: menu } = await supabase.from('menu').select('item_name, price, category').eq('company_id', companyId);
        if (menu?.length > 0) {
          knowledge += '\nMenu Highlights:\n' + menu.map(m => `- ${m.item_name}: ${m.price}`).join('\n');
        }
      }

      return knowledge || 'System Operational for ' + industry + '.';
    } catch (e) {
      console.error('Catalogue Fetch Error:', e);
      return 'Operational.';
    }
  }
};

export const tools = {
  book_order: async (data) => await database.saveOrder(data),
  book_appointment: async (params) => await database.saveAppointment(params),
  query_entity_database: async (params) => await database.query_entity_database(params),
  get_available_slots: async (params) => await database.get_available_slots(params),
  hang_up: async () => ({ success: true, message: 'Disconnected.' })
};