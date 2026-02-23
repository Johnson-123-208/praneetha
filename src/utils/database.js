/**
 * Independent Database Layer
 * Automatically switches between Backend API and Local Storage / Mock Data.
 * This allows the frontend to work perfectly without a running local backend.
 *
 * IMPORTANT: localStorage prefix is 'callix_' for ALL modules so CRM-saved data
 * is always readable by the dashboard.
 */

export const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
    // Ensure /api suffix is present for consistency with backend routes
    if (!envUrl.endsWith('/api')) envUrl += '/api';
    return envUrl;
  }

  // If running locally, default to 5000
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }

  // Default to relative if nothing else
  return '/api';
};

const API_URL = getApiUrl();

// --- Static Fallback Data (Matches Backend Seed) ---
const MOCK_COMPANIES = [
  {
    _id: "hospital_1",
    name: "Aarogya Multispeciality Hospital",
    industry: "Healthcare",
    logo: "🏥",
    gender: "female",
    context_summary: "Tier-1 Healthcare Facility with 50+ Doctors, 15+ specialized departments, and 24/7 Emergency Care.",
    nlp_context: "DATABASE: [Departments: Cardiology, Neurology, Pediatrics, Orthopedics, Oncology, Dental]. DOCTORS: [Dr. Sharm: Cardiology (Mon-Fri, 10-4), Dr. Verma: Neurology (Tue-Sat, 9-2), Dr. Iyer: Pediatrics (Daily, 5-8)]. FEES: [Consultation: ₹500, Emergency: ₹1500, Specialist Senior: ₹1000]. ROOMS: [General: ₹2000/day, Private: ₹5000/day, ICU: ₹12000/day]. FACILITIES: 24/7 Trauma, In-house Pharmacy, Radiology. Action: 'BOOK_APPOINTMENT for [Doctor] on [Date] at [Time]'.",
    contact_email: "appointments@aarogya.com",
    contact_phone: "+91-98765-43000"
  },
  {
    _id: "hotel_1",
    name: "Spice Garden Fine Dine & Hotel",
    industry: "Food & Beverage",
    logo: "🥗",
    gender: "female",
    context_summary: "Luxury Multi-cuisine Hotel with Indian, Continental, and Oriental menus. Seats up to 300 guests.",
    nlp_context: "MENU: [Veg: Paneer Lababdar (₹380), Dal Makhani (₹320), Malai Kofta (₹350)]. [Non-Veg: Butter Chicken (₹480), Hyderabadi Mutton Biryani (₹550), Fish Curry (₹420)]. [Desserts: Gulab Jamun (₹120), Rasmalai (₹150)]. COMBOS: 'Couple Combo' (₹1800), 'Family Feast' (₹3500). TABLE OPTIONS: [Standard, Garden View, Private Cabin (₹500 extra)]. Action: 'BOOK_TABLE for [People] on [Date] at [Time]'.",
    contact_email: "tables@spicegarden.com",
    contact_phone: "+91-88888-55555"
  },
  {
    _id: "it_1",
    name: "Agile-IT Global Solutions",
    industry: "Technology",
    logo: "💻",
    gender: "female",
    context_summary: "Fortune 500 IT Giant with 40+ open roles in AI, Cloud, and Software Engineering. Remote-First Culture.",
    nlp_context: "HR PORTAL: [Roles: Senior React Dev (Hybrid), Node.js Lead (Remote), AI Researcher (On-site), UI/UX Specialist]. SALARY: [Entry: 8-12 LPA, Senior: 25-45 LPA]. CULTURE: 4-day work week, learning stipends, health insurance. PROCESS: Screening -> Technical -> HR. Action: 'BOOK_APPOINTMENT for Interview on [Date] at [Time]'.",
    contact_email: "careers@agile-it.com",
    contact_phone: "+1-555-TECH-HIRE"
  },
  {
    _id: "ecommerce_1",
    name: "QuickKart Pro Electronics",
    industry: "E-Commerce",
    logo: "🛒",
    gender: "female",
    context_summary: "Premier Electronics Store featuring 100+ products from Apple, Sony, Samsung, and more.",
    nlp_context: "CATALOG: [Phones: iPhone 15 Pro (₹1,34,900), S24 Ultra (₹1,29,900), OnePlus 12 (₹64,900)]. [Laptops: Macbook Pro M3 (₹1,69,900), Dell XPS (₹1,45,000), ROG Zephyrus (₹1,89,000)]. [Audio: Sony XM5 (₹29,900), AirPods Pro (₹24,900)]. SHIPPING: Free for orders above ₹5000, Express (1-day) at ₹250. Action: 'BOOK_ORDER [Item]' or 'TRACE_ORDER'.",
    contact_email: "support@quickkart.com",
    contact_phone: "+1-800-KART-PRO"
  }
];

// --- Local Storage Helper (shared 'callix_' prefix used by all modules) ---
const getLocal = (key) => {
  try { return JSON.parse(localStorage.getItem(`callix_${key}`)) || []; }
  catch { return []; }
};
const saveLocal = (key, data) => {
  const existing = getLocal(key);
  existing.push({ ...data, _id: data._id || data.id || `local_${Date.now()}` });
  localStorage.setItem(`callix_${key}`, JSON.stringify(existing));
};

export const database = {
  // --- Company management ---
  getCompanies: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/companies`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      const localCompanies = getLocal('companies');
      return [...MOCK_COMPANIES, ...localCompanies];
    } catch (error) {
      return MOCK_COMPANIES;
    }
  },

  getCompany: async (id) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/companies/${id}`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      const all = [...MOCK_COMPANIES, ...getLocal('companies')];
      return all.find(c => c._id === id || c.id === id) || null;
    } catch (error) {
      const all = [...MOCK_COMPANIES, ...getLocal('companies')];
      return all.find(c => c._id === id || c.id === id) || null;
    }
  },

  saveCompany: async (companyData) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      const newCompany = {
        ...companyData,
        id: `COMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        _id: `COMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        created_at: new Date().toISOString()
      };
      saveLocal('companies', newCompany);
      return newCompany;
    } catch (error) {
      const newCompany = { id: Date.now().toString(), ...companyData };
      saveLocal('companies', newCompany);
      return newCompany;
    }
  },

  // --- Order management ---
  getOrders: async (userEmail = null) => {
    try {
      let url = `${API_URL}/orders`;
      if (userEmail) url += `?user_email=${userEmail}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      const local = getLocal('orders');
      return userEmail ? local.filter(o => o.user_email === userEmail) : local;
    } catch (error) {
      const local = getLocal('orders');
      return userEmail ? local.filter(o => o.user_email === userEmail) : local;
    }
  },

  saveOrder: async (order) => {
    const newOrder = {
      id: order.id || `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      company_id: order.companyId,
      item: order.item,
      quantity: order.quantity || 1,
      total_price: order.totalPrice || 0,
      status: 'completed',
      customer_name: order.customerName,
      user_email: order.userEmail,
      created_at: new Date().toISOString()
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      saveLocal('orders', newOrder);
      return newOrder;
    } catch (error) {
      saveLocal('orders', newOrder);
      return newOrder;
    }
  },

  getOrder: async (id) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/orders/${id}`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();
      return getLocal('orders').find(o => o.id === id?.toUpperCase()) || null;
    } catch (error) {
      return getLocal('orders').find(o => o.id === id?.toUpperCase()) || null;
    }
  },

  deleteOrder: async (id) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' }).catch(() => null);
      if (res && res.ok) return true;

      const local = getLocal('orders').filter(o => o._id !== id && o.id !== id);
      localStorage.setItem(`callix_orders`, JSON.stringify(local));
      return true;
    } catch (error) {
      return false;
    }
  },

  // --- Appointment management ---
  getAppointments: async (entityId = null, userEmail = null) => {
    try {
      let url = `${API_URL}/appointments?`;
      if (entityId) url += `entity_id=${entityId}&`;
      if (userEmail) url += `user_email=${userEmail}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      let local = getLocal('appointments');
      if (entityId) local = local.filter(a => a.entity_id === entityId);
      if (userEmail) local = local.filter(a => a.user_email === userEmail || !a.user_email);
      return local;
    } catch (error) {
      return getLocal('appointments');
    }
  },

  saveAppointment: async (appointment) => {
    const newApp = {
      id: `APP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      entity_id: appointment.entityId,
      entity_name: appointment.entityName || 'General',
      type: appointment.type,
      person_name: appointment.personName,
      date: appointment.date,
      time: appointment.time,
      user_info: appointment.userInfo || {},
      user_email: appointment.userEmail,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      saveLocal('appointments', newApp);
      return newApp;
    } catch (error) {
      saveLocal('appointments', newApp);
      return newApp;
    }
  },

  deleteAppointment: async (id) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' }).catch(() => null);
      if (res && res.ok) return true;

      const local = getLocal('appointments').filter(a => a._id !== id && a.id !== id);
      localStorage.setItem(`callix_appointments`, JSON.stringify(local));
      return true;
    } catch (error) {
      return false;
    }
  },

  saveRestaurantBooking: async (booking) => {
    return await database.saveAppointment({
      ...booking,
      type: 'table',
      userInfo: { party_size: booking.userInfo?.peopleCount || 1, notes: booking.userInfo?.notes || '' }
    });
  },

  // --- Doctor management ---
  getDoctors: async (hospitalId) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/doctors?hospital_id=${hospitalId}`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();
      return getLocal('doctors').filter(d => d.hospital_id === hospitalId);
    } catch (e) {
      return getLocal('doctors').filter(d => d.hospital_id === hospitalId);
    }
  },

  saveDoctor: async (doctor) => {
    saveLocal('doctors', doctor);
    return doctor;
  },

  // --- Vacancy management ---
  saveVacancy: async (vacancy) => {
    saveLocal('vacancies', vacancy);
    return vacancy;
  },

  // --- Feedback management ---
  getFeedback: async (userEmail = null) => {
    try {
      let url = `${API_URL}/feedback`;
      if (userEmail) url += `?user_email=${encodeURIComponent(userEmail)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();

      const local = getLocal('feedback');
      return userEmail ? local.filter(f => f.user_email === userEmail) : local;
    } catch (error) {
      const local = getLocal('feedback');
      return userEmail ? local.filter(f => f.user_email === userEmail) : local;
    }
  },

  saveFeedback: async (feedback) => {
    const newFb = {
      _id: `local_fb_${Date.now()}`,
      entity_id: feedback.entity_id || feedback.entityId,
      entity_name: feedback.entity_name || feedback.entityName,
      rating: feedback.rating,
      comment: feedback.comment,
      category: feedback.category || 'general',
      user_email: feedback.user_email || feedback.userEmail,
      created_at: new Date().toISOString()
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFb),
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) return await res.json();
      saveLocal('feedback', newFb);
      return newFb;
    } catch (error) {
      saveLocal('feedback', newFb);
      return newFb;
    }
  },

  deleteFeedback: async (id) => {
    try {
      const res = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' }).catch(() => null);
      if (res && res.ok) return true;

      const local = getLocal('feedback').filter(f => f._id !== id && f.id !== id);
      localStorage.setItem(`callix_feedback`, JSON.stringify(local));
      return true;
    } catch (error) {
      return false;
    }
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
        id: c._id || c.id,
        name: c.name,
        industry: c.industry,
      })),
    };
  },

  book_order: async (orderData) => {
    try {
      const order = await database.saveOrder({
        companyId: orderData.companyId,
        item: orderData.item || 'Product',
        quantity: orderData.quantity || 1,
        totalPrice: orderData.totalPrice,
        customerName: orderData.customerName,
        userEmail: orderData.userEmail
      });
      return {
        success: true,
        orderId: order.id,
        message: `SUCCESS: Order ${order.id} for ${orderData.item} has been placed. (Local Save)`,
      };
    } catch (e) {
      return { error: 'Failed to process order' };
    }
  },

  book_appointment: async (params) => {
    try {
      const result = await database.saveAppointment(params);
      return {
        success: true,
        id: result.id,
        message: `CONFIRMED: Appointment for ${params.personName} on ${params.date} at ${params.time} has been saved.`,
      };
    } catch (e) {
      return { error: `Failed to save booking` };
    }
  },

  collect_feedback: async (params) => {
    try {
      const fb = await database.saveFeedback(params);
      return {
        success: true,
        message: 'Thank you for your feedback! It has been saved.',
      };
    } catch (e) {
      return { error: 'Failed to save feedback' };
    }
  },

  get_available_slots: async (params) => {
    const { entityId, date } = params;
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const booked = await database.getAppointments(entityId);
    const bookedTimes = booked.filter(a => a.appointment_date === date).map(a => a.appointment_time);
    return {
      availableSlots: allSlots.filter(slot => !bookedTimes.includes(slot)),
      date: date || 'Today'
    };
  },

  get_company_insights: async (companyId) => {
    const company = await database.getCompany(companyId);
    if (!company) return { error: 'Company not found' };
    return {
      name: company.name,
      industry: company.industry,
      context: company.nlp_context || company.context_summary || '',
    };
  },

  trace_order: async (orderId) => {
    const id = typeof orderId === 'object' ? orderId.orderId : orderId;
    const order = await database.getOrder(id);
    if (!order) return { error: 'Order not found' };
    return { orderId: order.id, status: order.status, item: order.item };
  }
};