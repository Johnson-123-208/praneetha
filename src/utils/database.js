import { supabase } from './supabaseClient';

/**
 * Real-time database utilities using Supabase
 * This provides the 'API' layer for the application to interact with the database.
 */
export const database = {
  // --- Company management ---
  getCompanies: async () => {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
    return data;
  },

  getCompany: async (id) => {
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }
    return data;
  },

  // --- Order management ---
  getOrders: async (userEmail = null) => {
    let query = supabase.from('orders').select('*');
    if (userEmail) query = query.eq('user_email', userEmail);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    return data;
  },

  saveOrder: async (order) => {
    const newOrder = {
      id: order.id || `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      company_id: order.companyId,
      item: order.item,
      quantity: order.quantity || 1,
      status: 'completed',
      customer_name: order.customerName,
      user_email: order.userEmail, // Added for user-specific tracking
    };

    const { data, error } = await supabase.from('orders').insert([newOrder]).select();
    if (error) {
      console.error('Error saving order:', error);
      throw error;
    }
    return data[0];
  },

  getOrder: async (id) => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }
    return data;
  },

  // --- Appointment management ---
  getAppointments: async (entityId = null, userEmail = null) => {
    let query = supabase.from('appointments').select('*');
    if (entityId) query = query.eq('entity_id', entityId);
    if (userEmail) query = query.eq('user_email', userEmail);

    const { data, error } = await query.order('appointment_date', { ascending: true });
    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
    return data;
  },

  saveAppointment: async (appointment) => {
    const newAppointment = {
      entity_id: appointment.entityId,
      entity_name: appointment.entityName,
      type: appointment.type,
      person_name: appointment.personName,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
      user_info: appointment.userInfo || {},
      user_email: appointment.userEmail, // Added for user-specific tracking
      status: 'scheduled'
    };

    const { data, error } = await supabase.from('appointments').insert([newAppointment]).select();
    if (error) {
      console.error('Error saving appointment:', error);
      throw error;
    }
    return data[0];
  },

  // --- Feedback management ---
  getFeedback: async (entityId) => {
    let query = supabase.from('feedbacks').select('*');
    if (entityId) query = query.eq('entity_id', entityId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
    return data;
  },

  saveFeedback: async (feedback) => {
    const newFeedback = {
      entity_id: feedback.entityId,
      entity_name: feedback.entityName,
      rating: feedback.rating,
      comment: feedback.comment,
      category: feedback.category || 'general',
      user_email: feedback.userEmail // Added for user-specific tracking
    };

    const { data, error } = await supabase.from('feedbacks').insert([newFeedback]).select();
    if (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }
    return data[0];
  },

  // --- Doctor management (Hospitals) ---
  getDoctors: async (hospitalId) => {
    const { data, error } = await supabase.from('doctors').select('*').eq('hospital_id', hospitalId);
    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
    return data;
  }
};

/**
 * AI Tool definitions that call the database 'API' layer.
 * These are used by Groq to perform actions.
 */
export const tools = {
  get_company_directory: async () => {
    const companies = await database.getCompanies();
    return {
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
      })),
    };
  },

  book_order: async (orderData) => {
    const { companyId, item, quantity, userEmail } = orderData;
    try {
      const order = await database.saveOrder({
        companyId,
        item: item || 'Product',
        quantity: quantity || 1,
        userEmail: userEmail // Pass to database service
      });
      return {
        success: true,
        orderId: order.id,
        message: `SUCCESS: Order ${order.id} for ${item} has been placed and saved to our database.`,
      };
    } catch (e) {
      return { error: 'Failed to save order to database' };
    }
  },

  book_appointment: async (params) => {
    const { entityId, type, personName, date, time, userInfo, userEmail } = params;

    if (!entityId || !type || !date || !time) {
      return { error: 'Missing required fields: entityId, type, date, time' };
    }

    try {
      const appointment = await database.saveAppointment({
        entityId,
        type,
        personName: personName || 'General',
        date,
        time,
        userInfo: userInfo || {},
        userEmail: userEmail // Pass to database service
      });

      return {
        success: true,
        appointmentId: appointment.id,
        message: `CONFIRMED: Appointment for ${personName} on ${date} at ${time} has been saved to our database.`,
      };
    } catch (e) {
      return { error: 'Failed to save appointment to database' };
    }
  },

  collect_feedback: async (params) => {
    const { entityId, rating, comment, category, userEmail } = params;

    if (!entityId) {
      return { error: 'Entity ID is required' };
    }

    try {
      const fb = await database.saveFeedback({
        entityId,
        rating: rating || 0,
        comment: comment || '',
        category: category || 'general',
        userEmail: userEmail // Pass to database service
      });

      return {
        success: true,
        feedbackId: fb.id,
        message: 'Thank you for your feedback! It has been saved to our database.',
      };
    } catch (e) {
      return { error: 'Failed to save feedback' };
    }
  },

  get_available_slots: async (params) => {
    const { entityId, date } = params;
    if (!entityId) return { error: 'Entity ID is required' };
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const bookedAppointments = await database.getAppointments(entityId);
    const bookedTimes = bookedAppointments
      .filter(a => a.appointment_date === date && a.status === 'scheduled')
      .map(a => a.appointment_time.substring(0, 5));
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    return {
      entityId,
      date: date || new Date().toISOString().split('T')[0],
      availableSlots,
      bookedSlots: bookedTimes,
    };
  },

  get_company_insights: async (companyId) => {
    const company = await database.getCompany(companyId);
    if (!company) return { error: 'Company not found' };
    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      context: company.nlpContext || company.contextSummary || '',
    };
  },

  trace_order: async (orderId) => {
    const id = typeof orderId === 'object' ? orderId.orderId : orderId;
    const order = await database.getOrder(id?.toUpperCase());
    if (!order) return { error: 'Order not found' };
    const company = await database.getCompany(order.company_id);
    return {
      orderId: order.id,
      item: order.item,
      quantity: order.quantity,
      status: order.status,
      timestamp: order.created_at,
      company: company ? company.name : 'Unknown',
    };
  },

  check_vacancies: async (params) => {
    return { count: 0, vacancies: [], message: "Check our careers page." };
  },

  query_entity_database: async (params) => {
    const { entityId } = params;
    const company = await database.getCompany(entityId);
    if (!company) return { error: 'Entity not found' };
    return { id: company.id, name: company.name, industry: company.industry };
  }
};