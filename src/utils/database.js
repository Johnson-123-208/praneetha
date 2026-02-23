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
    context_summary: "500-bed NABH-accredited tertiary care hospital with 24/7 emergency, 12 modular OTs, 80 ICU beds, advanced diagnostics, super-specialty departments, organ transplant program, and cancer centre.",
    nlp_context: "DEPARTMENTS: [Cardiology & CTVS, Neurology & Neurosurgery, Orthopedics & Joint Replacement, Oncology & Onco-surgery, Pediatrics & Neonatology, Gynecology & IVF, Gastroenterology & Hepatology, Urology & Nephrology, Pulmonology & Critical Care, Endocrinology & Diabetology, Dermatology & Cosmetology, ENT & Head-Neck Surgery, Ophthalmology, Plastic & Reconstructive Surgery, Psychiatry, Rheumatology, General Medicine, General Surgery]. DOCTORS: [Dr. Sarah Sharma MD DM: Cardiology (Mon–Fri 9:30–13:00 & 15:00–18:00, ₹900), Dr. Vipul Verma MS MCh: Neurosurgery (Tue–Sat 10:00–14:00, ₹1200), Dr. Amit Iyer MD DNB: Pediatrics & Neonatology (Daily 16:00–20:00, ₹700), Dr. Kavita Reddy MS Ortho: Joint Replacement (Mon,Wed,Fri 11:00–15:00, ₹1000), Dr. Rajesh Kapoor MD DM: Medical Oncology (Thu–Sat 08:30–13:00, ₹1300), Dr. Neha Patel MS DGO: Gynecology & IVF (Mon–Sat 10:00–14:00, ₹800), Dr. Sunil Gupta BDS MDS: Maxillofacial & Implantology (Daily 09:00–17:00, ₹600), Dr. Priya Desai MS ENT: Otology & Rhinology (Wed–Fri 14:00–18:00, ₹750), Dr. Manoj Singh MD: Dermatology & Lasers (Mon–Thu 11:00–16:00, ₹850), Dr. Anil Kumar MS MCh: Urology & Renal Transplant (Tue–Sat 09:00–13:00, ₹950), Dr. Ritu Jain MD DM: Gastroenterology (Mon–Fri 10:00–15:00, ₹1000), Dr. Vikram Bose MD: Pulmonology & Sleep Medicine (Daily 16:00–19:00, ₹900), Dr. Sonia Mehta MD DM: Endocrinology (Tue–Thu 11:00–14:00, ₹800), Dr. Arjun Rao MD DM: Nephrology & Dialysis (Fri–Sun 09:00–13:00, ₹1100), Dr. Lata Singh MS: Ophthalmology & Retina (Mon–Sat 10:00–16:00, ₹700), Dr. Rohan Mehra MS MCh: CTVS (Mon–Wed 09:00–13:00, ₹1500)]. FEES: [OPD General: ₹500, Specialist: ₹700–1500, Emergency: ₹2500, Daycare Procedure: ₹15000–60000, Major Surgery: ₹80000–450000]. EMERGENCY: 24×7 Trauma & Stroke Centre, Ambulance 911 ext, Golden Hour Protocol. BOOKING: 'BOOK_APPOINTMENT for [Doctor Name] on [Date] at [Time]'. ADDRESS: 101 Health Lane, Banjara Hills, Hyderabad, Telangana 500034. FACILITIES: [MRI 3T, CT 128-slice, Cath Lab, LINAC Radiation, 80 ICU beds, 24/7 Pharmacy & Lab, Blood Bank, 24/7 Cafeteria, Valet Parking 250 slots, Tele-consult, Health Check Packages ₹1999–14999].",
    contact_email: "care@aarogya-hospital.com",
    contact_phone: "+91-98765-43210"
  },
  {
    _id: "hotel_1",
    name: "Spice Garden Fine Dine & Hotel",
    industry: "Food & Beverage",
    logo: "🥗",
    gender: "female",
    context_summary: "5-star luxury boutique hotel – 128 rooms & suites, 5 dining venues, infinity pool, spa, fitness centre, 3 banquet halls (max 650 pax), business centre, rooftop bar.",
    nlp_context: "DINING_VENUES: [Saffron – North Indian Fine Dining, Lotus Court – Pan-Asian, The Grill – Steak & Seafood, Trattoria – Italian, The Verandah – All-day multi-cuisine]. VEG_STARTERS: [Paneer Ajwaini Tikka ₹420, Hara Bhara Kebab ₹380, Crispy Chilli Baby Corn ₹340, Stuffed Jalapeño ₹400, Mushroom 65 ₹360, Corn Seekh Kebab ₹320, Palak Patta Chaat ₹300, Dahi Ke Kebab ₹390]. NON_VEG_STARTERS: [Chicken Malai Tikka ₹480, Mutton Galouti ₹520, Amritsari Fish ₹550, Prawn Koliwada ₹620, Lamb Seekh Kebab ₹580, Tandoori Jumbo Prawn ₹750, Murgh Reshmi Kebab ₹460, Crispy Duck Bao ₹680]. MAIN_COURSE_VEG: [Paneer Butter Masala ₹460, Dal Bukhara ₹380, Malai Kofta ₹420, Kadai Paneer ₹450, Dum Aloo Kashmiri ₹390, Lauki Kofta ₹360, Veg Jalfrezi ₹340, Mushroom Do Pyaza ₹400, Sarson ka Saag Makki di Roti ₹480]. MAIN_COURSE_NON_VEG: [Murgh Makhani ₹580, Kosha Mangsho ₹720, Hyderabadi Gosht Biryani ₹650, Konkani Prawn Curry ₹780, Chicken Chettinad ₹560, Lamb Shank Rogan Josh ₹750, Kerala Fish Molee ₹680, Tandoori Pomfret ₹850]. DESSERTS: [Gulab Jamun with Rabri ₹180, Warm Chocolate Lava Cake ₹320, Rasmalai ₹200, Mango Cheesecake ₹280, Kulfi Falooda ₹220, Shahi Tukda ₹250, Tiramisu Shot ₹300]. BEVERAGES: [Signature Mocktails ₹280–420, Craft Cocktails ₹450–750, Single Malt ₹600–1800, House Wine Glass ₹450, Fresh Juices ₹220, Detox Infusions ₹280]. HOURS: [Breakfast Buffet 07:00–10:30, All-day Dining 12:00–23:30, Rooftop Bar 17:00–01:00, Room Service 00:00–06:00]. BOOKING: 'BOOK_TABLE for [Pax] on [Date] at [Time]' | Room categories: Deluxe ₹9500, Premier ₹12500, Suite ₹22000–38000. ADDRESS: 123 MG Road, Goregaon West, Mumbai 400104. FACILITIES: [Infinity Pool, Kaya Kalp Spa, 24×7 Gym, Kids Club, Business Centre, Valet Parking 180 slots, High-speed WiFi, EV Charging].",
    contact_email: "reservations@spicegarden.com",
    contact_phone: "+91-88888-99999"
  },
  {
    _id: "it_1",
    name: "Agile-IT Global Solutions",
    industry: "Technology",
    logo: "💻",
    gender: "female",
    context_summary: "650+ employee digital transformation company – AI/ML, cloud-native apps, cybersecurity, data & analytics, low-code, blockchain, IoT – serving 80+ clients across BFSI, retail, healthcare, manufacturing.",
    nlp_context: "OPEN_ROLES: [Senior React/Next.js Developer ×10 (₹16–30 LPA, 5–11 yrs), Node.js + Microservices Architect ×5 (₹25–42 LPA, 9–16 yrs), Python + GenAI/ML Engineer ×8 (₹18–38 LPA, 4–13 yrs), AWS/GCP/Azure Cloud Architect ×6 (₹22–40 LPA, 8–15 yrs), Cybersecurity Consultant ×5 (₹18–34 LPA, 6–12 yrs), UI/UX Lead (Figma/Framer) ×4 (₹15–28 LPA, 5–10 yrs), DevOps & SRE (Terraform/K8s) ×7 (₹16–32 LPA, 5–11 yrs), Data Engineer (Snowflake/Databricks) ×6 (₹17–35 LPA, 5–12 yrs), Full-Stack Java/Spring ×5 (₹14–28 LPA, 4–9 yrs), AI Product Manager ×3 (₹25–45 LPA, 8+ yrs), Penetration Tester ×4 (₹16–30 LPA, 5–10 yrs)]. HR_TEAM: [Priya Singh – Tech Recruitment Lead priya@agile-it.com +91-98765 43210, Satya Menon – VP Talent satya@agile-it.com, Anjali Sharma – HR Business Partner anjali@agile-it.com +91-88888 77777, Vikram Rao – Campus & Lateral vikram@agile-it.com, Neha Kapoor – Executive Search neha@agile-it.com]. INTERVIEW_TIMINGS: [Mon–Fri 09:00–12:30 & 14:00–18:30 | Slots every 60 min]. PROCESS: [Resume Screen → Online Assessment → 2–3 Tech Rounds → Managerial → HR + Culture Fit]. BENEFITS: [Hybrid 3:2, Health + Parents Insurance, 32 Paid Leaves, Learning Stipend ₹60k/yr, ESOPs, Cab/Meal Allowance, 5-year Loyalty Bonus]. ADDRESS: 456 Tech Park, Whitefield, Bengaluru 560066 | Offices: Hyderabad, Pune, Chennai, London, Dallas. TECHNOLOGIES: [Frontend: React, Next.js, Vue, Svelte | Backend: Node, Spring Boot, .NET, Go | Cloud: AWS, Azure, GCP | AI/ML: PyTorch, TensorFlow, LangChain, LlamaIndex | Data: Snowflake, Databricks, Kafka | DevOps: Kubernetes, ArgoCD, GitHub Actions].",
    contact_email: "careers@agile-it-global.com",
    contact_phone: "+91-77777-66666"
  },
  {
    _id: "ecommerce_1",
    name: "QuickKart Pro Electronics",
    industry: "E-Commerce",
    logo: "🛒",
    gender: "female",
    context_summary: "Fast-growing online electronics mega-store – mobiles, laptops, audio, TVs, appliances, gaming, wearables, smart home, cameras, personal care – 2–4 hr delivery in 12 cities, next-day in 200+ cities.",
    nlp_context: "MOBILES: [iPhone 16 Pro Max 256GB ₹144900, Galaxy S25 Ultra 512GB ₹139999, Pixel 9 Pro XL 256GB ₹124900, OnePlus 13 512GB ₹74999, Xiaomi 15 512GB ₹69999, Vivo X200 Pro 512GB ₹94999, Nothing Phone (3) ₹49999, Motorola Edge 50 Ultra ₹64999, Realme GT 7 Pro ₹59999]. LAPTOPS: [MacBook Pro 14 M4 Pro 1TB ₹199900, MacBook Air 13 M4 512GB ₹114900, Dell XPS 14 OLED ₹189900, Lenovo Legion Pro 7i RTX 4080 ₹229900, HP Spectre x360 16 2-in-1 ₹169900, ASUS ROG Zephyrus G16 ₹199900, Acer Predator Helios Neo ₹119900, MSI Stealth 14 AI Studio ₹179900]. AUDIO: [Sony WH-1000XM6 ₹34990, AirPods Max 2 ₹59900, Bose QuietComfort Ultra ₹38500, Sennheiser Momentum 4 ₹34990, JBL Tour One M3 ₹24999, Sony WF-1000XM5 ₹24990, Beats Studio Buds + ₹18990, Nothing Ear (open) ₹11999]. TVS: [Samsung QN90D Neo QLED 65 ₹189990, LG OLED evo C4 65 ₹179990, Sony Bravia 8 OLED 65 ₹239990, TCL C855 Mini-LED 75 ₹149990, Hisense U8N 65 ₹89990, Xiaomi X Pro QLED 65 ₹74990]. APPLIANCES: [LG 9kg AI DD Washing Machine ₹42990, Samsung Bespoke 465L Refrigerator ₹94990, Daikin 1.5T 5★ Inverter AC ₹48990, Dyson V15 Detect Absolute ₹59990, Philips Airfryer XXL ₹12990, Bosch Serie 6 Dishwasher ₹58990]. WEARABLES: [Apple Watch Ultra 2 ₹89900, Galaxy Watch 7 44mm ₹32990, Pixel Watch 3 ₹39990, OnePlus Watch 2R ₹17999, NoiseFit Voyage ₹7999]. GAMING: [PS5 Slim Disc ₹54990, Xbox Series X 1TB ₹49990, Nintendo Switch OLED ₹32990, Steam Deck 1TB ₹64990]. OFFERS: [10% instant bank discount (HDFC/ICICI), No-cost EMI 3–36 months, Exchange bonus up to ₹45000, QuickKart Assured ₹1999/yr (free delivery + extended warranty)]. DELIVERY: [2-hr slots in metro, Next-day 200+ cities, Standard 3–6 days]. ADDRESS: Central Warehouse – Plot 789, Sector 82, Noida, Uttar Pradesh 201305.",
    contact_email: "orders@quickkart-pro.com",
    contact_phone: "+91-1800-200-500"
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
  },

  check_vacancies: async (params) => {
    const { companyId, position } = params;
    const company = await database.getCompany(companyId);
    if (!company) return { error: 'Company not found' };

    // Extract vacancies from nlp_context if possible
    const context = company.nlp_context || company.context_summary || '';
    const rolesMatch = context.match(/\[Roles: ([^\]]+)\]/);
    const roles = rolesMatch ? rolesMatch[1] : 'Various positions';

    return {
      companyName: company.name,
      vacancies: roles,
      message: `Current openings at ${company.name}: ${roles}`
    };
  },

  query_entity_database: async (params) => {
    const { entityId, query } = params;
    const entity = await database.getCompany(entityId);
    if (!entity) return { error: 'Entity not found' };

    const context = entity.nlp_context || entity.context_summary || '';
    const lowerQuery = query?.toLowerCase() || '';

    // Handle Doctor Queries
    if (lowerQuery.includes('doctor') || lowerQuery.includes('specialist') || lowerQuery.includes('physician')) {
      const doctorsMatch = context.match(/DOCTORS: \[([^\]]+)\]/);
      if (doctorsMatch) {
        return { result: doctorsMatch[1], type: 'doctors', entityName: entity.name };
      }
    }

    // Handle Menu Queries
    if (lowerQuery.includes('menu') || lowerQuery.includes('food') || lowerQuery.includes('item') || lowerQuery.includes('dish')) {
      const menuMatch = context.match(/MENU: \[([^\]]+)\]/);
      if (menuMatch) {
        return { result: menuMatch[1], type: 'menu', entityName: entity.name };
      }
    }

    // Handle Vacancy Queries
    if (lowerQuery.includes('vacancy') || lowerQuery.includes('job') || lowerQuery.includes('hiring')) {
      const rolesMatch = context.match(/(?:HR PORTAL|Roles): \[([^\]]+)\]/);
      if (rolesMatch) {
        return { result: rolesMatch[1], type: 'vacancies', entityName: entity.name };
      }
    }

    return {
      result: context,
      type: 'general',
      entityName: entity.name,
      message: `Information about ${entity.name}: ${context}`
    };
  }
};