// Mock database utilities using localStorage

const STORAGE_KEYS = {
  COMPANIES: 'ai_calling_agent_companies',
  ORDERS: 'ai_calling_agent_orders',
  VACANCIES: 'ai_calling_agent_vacancies',
  APPOINTMENTS: 'ai_calling_agent_appointments',
  DOCTORS: 'ai_calling_agent_doctors',
  FEEDBACK: 'ai_calling_agent_feedback',
};

export const database = {
  // Company management
  getCompanies: () => {
    const companies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    return companies ? JSON.parse(companies) : [];
  },

  saveCompany: (company) => {
    const companies = database.getCompanies();
    const newCompany = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...company,
      createdAt: new Date().toISOString(),
      apiLinked: true,
    };
    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    return newCompany;
  },

  getCompany: (id) => {
    const companies = database.getCompanies();
    return companies.find(c => c.id === id);
  },

  updateCompany: (id, updates) => {
    const companies = database.getCompanies();
    const index = companies.findIndex(c => c.id === id);
    if (index !== -1) {
      companies[index] = { ...companies[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      return companies[index];
    }
    return null;
  },

  deleteCompany: (id) => {
    const companies = database.getCompanies();
    const filtered = companies.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(filtered));
    return filtered;
  },

  // Order management
  getOrders: () => {
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return orders ? JSON.parse(orders) : [];
  },

  saveOrder: (order) => {
    const orders = database.getOrders();
    const newOrder = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      ...order,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };
    orders.unshift(newOrder); // Add to beginning for recent-first
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  getOrder: (id) => {
    const orders = database.getOrders();
    return orders.find(o => o.id === id);
  },

  getOrdersByCompany: (companyId) => {
    const orders = database.getOrders();
    return orders.filter(o => o.companyId === companyId);
  },

  // Vacancy management
  getVacancies: (companyId) => {
    const vacancies = localStorage.getItem(STORAGE_KEYS.VACANCIES);
    const allVacancies = vacancies ? JSON.parse(vacancies) : [];
    return companyId ? allVacancies.filter(v => v.companyId === companyId) : allVacancies;
  },

  saveVacancy: (vacancy) => {
    const vacancies = database.getVacancies();
    const newVacancy = {
      id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...vacancy,
      createdAt: new Date().toISOString(),
    };
    vacancies.push(newVacancy);
    localStorage.setItem(STORAGE_KEYS.VACANCIES, JSON.stringify(vacancies));
    return newVacancy;
  },

  updateVacancy: (id, updates) => {
    const vacancies = database.getVacancies();
    const index = vacancies.findIndex(v => v.id === id);
    if (index !== -1) {
      vacancies[index] = { ...vacancies[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.VACANCIES, JSON.stringify(vacancies));
      return vacancies[index];
    }
    return null;
  },

  // Doctor management (for hospitals)
  getDoctors: (hospitalId) => {
    const doctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    const allDoctors = doctors ? JSON.parse(doctors) : [];
    return hospitalId ? allDoctors.filter(d => d.hospitalId === hospitalId) : allDoctors;
  },

  saveDoctor: (doctor) => {
    const doctors = database.getDoctors();
    const newDoctor = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...doctor,
      createdAt: new Date().toISOString(),
    };
    doctors.push(newDoctor);
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    return newDoctor;
  },

  getDoctor: (id) => {
    const doctors = database.getDoctors();
    return doctors.find(d => d.id === id);
  },

  // Appointment management
  getAppointments: (entityId) => {
    const appointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    const allAppointments = appointments ? JSON.parse(appointments) : [];
    return entityId ? allAppointments.filter(a => a.entityId === entityId) : allAppointments;
  },

  saveAppointment: (appointment) => {
    const appointments = database.getAppointments();
    const newAppointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...appointment,
      createdAt: new Date().toISOString(),
      status: 'scheduled',
    };
    appointments.push(newAppointment);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    return newAppointment;
  },

  getAppointment: (id) => {
    const appointments = database.getAppointments();
    return appointments.find(a => a.id === id);
  },

  // Feedback management
  getFeedback: (entityId) => {
    const feedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const allFeedback = feedback ? JSON.parse(feedback) : [];
    return entityId ? allFeedback.filter(f => f.entityId === entityId) : allFeedback;
  },

  saveFeedback: (feedback) => {
    const allFeedback = database.getFeedback();
    const newFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...feedback,
      createdAt: new Date().toISOString(),
    };
    allFeedback.push(newFeedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(allFeedback));
    return newFeedback;
  },

  // Query database (general purpose)
  queryDatabase: (entityId, queryType, params = {}) => {
    const company = database.getCompany(entityId);
    if (!company) {
      return { error: 'Entity not found' };
    }

    switch (queryType) {
      case 'vacancies':
        return database.getVacancies(entityId);
      case 'appointments':
        return database.getAppointments(entityId);
      case 'doctors':
        return database.getDoctors(entityId);
      case 'feedback':
        return database.getFeedback(entityId);
      case 'info':
        return {
          id: company.id,
          name: company.name,
          industry: company.industry,
          context: company.contextSummary || company.nlpContext || '',
          vacancies: database.getVacancies(entityId).length,
          doctors: database.getDoctors(entityId).length,
          appointments: database.getAppointments(entityId).length,
        };
      default:
        return { error: 'Unknown query type' };
    }
  },
};

// Function calling tools for Gemini
export const tools = {
  get_company_directory: () => {
    const companies = database.getCompanies();
    return {
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
      })),
    };
  },

  get_company_insights: (companyId) => {
    const company = database.getCompany(companyId);
    if (!company) {
      return { error: 'Company not found' };
    }
    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      context: company.nlpContext || company.contextSummary || '',
      apiLinked: company.apiLinked || false,
    };
  },

  book_order: (orderData) => {
    const { companyId, item, quantity } = orderData;
    const order = database.saveOrder({
      companyId,
      item: item || 'Product',
      quantity: quantity || 1,
    });
    return {
      success: true,
      orderId: order.id,
      message: `Order ${order.id} booked successfully`,
    };
  },

  trace_order: (orderId) => {
    const order = database.getOrder(orderId.toUpperCase());
    if (!order) {
      return { error: 'Order not found' };
    }
    const company = database.getCompany(order.companyId);
    return {
      orderId: order.id,
      item: order.item,
      quantity: order.quantity,
      status: order.status,
      timestamp: order.timestamp,
      company: company ? company.name : 'Unknown',
    };
  },

  // Check vacancies for a position
  check_vacancies: (params) => {
    const { companyId, position } = params;
    if (!companyId) {
      return { error: 'Company ID is required' };
    }

    const vacancies = database.getVacancies(companyId);
    let filteredVacancies = vacancies;

    if (position) {
      filteredVacancies = vacancies.filter(v => 
        v.position?.toLowerCase().includes(position.toLowerCase()) ||
        v.title?.toLowerCase().includes(position.toLowerCase())
      );
    }

    return {
      companyId,
      position: position || 'all positions',
      count: filteredVacancies.length,
      vacancies: filteredVacancies.map(v => ({
        id: v.id,
        position: v.position || v.title,
        department: v.department,
        status: v.status || 'open',
        description: v.description,
      })),
    };
  },

  // Book appointment (doctor, CEO, executive, etc.)
  book_appointment: (params) => {
    const { entityId, type, personName, date, time, userInfo } = params;
    
    if (!entityId || !type || !date || !time) {
      return { error: 'Missing required fields: entityId, type, date, time' };
    }

    const entity = database.getCompany(entityId);
    if (!entity) {
      return { error: 'Entity not found' };
    }

    // Validate appointment availability
    const existingAppointments = database.getAppointments(entityId);
    const conflictingAppointment = existingAppointments.find(a => 
      a.date === date && a.time === time && a.status === 'scheduled'
    );

    if (conflictingAppointment) {
      return { 
        error: 'Time slot already booked',
        suggestion: 'Please choose a different time',
      };
    }

    const appointment = database.saveAppointment({
      entityId,
      type, // 'doctor', 'ceo', 'executive', etc.
      personName: personName || 'General',
      date,
      time,
      userInfo: userInfo || {},
      entityName: entity.name,
    });

    return {
      success: true,
      appointmentId: appointment.id,
      message: `Appointment booked successfully for ${type} on ${date} at ${time}`,
      appointment: {
        id: appointment.id,
        type,
        personName,
        date,
        time,
        entityName: entity.name,
      },
    };
  },

  // Collect feedback
  collect_feedback: (params) => {
    const { entityId, rating, comment, category } = params;
    
    if (!entityId) {
      return { error: 'Entity ID is required' };
    }

    const entity = database.getCompany(entityId);
    if (!entity) {
      return { error: 'Entity not found' };
    }

    const feedback = database.saveFeedback({
      entityId,
      rating: rating || 0,
      comment: comment || '',
      category: category || 'general',
      entityName: entity.name,
    });

    return {
      success: true,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback!',
      feedback: {
        id: feedback.id,
        rating,
        category,
        timestamp: feedback.createdAt,
      },
    };
  },

  // Get available appointment slots
  get_available_slots: (params) => {
    const { entityId, date, type } = params;
    
    if (!entityId) {
      return { error: 'Entity ID is required' };
    }

    const entity = database.getCompany(entityId);
    if (!entity) {
      return { error: 'Entity not found' };
    }

    // Default available slots (can be customized per entity)
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const bookedAppointments = database.getAppointments(entityId).filter(a => 
      a.date === date && a.status === 'scheduled'
    );

    const bookedTimes = bookedAppointments.map(a => a.time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    return {
      entityId,
      entityName: entity.name,
      date: date || new Date().toISOString().split('T')[0],
      type: type || 'general',
      availableSlots,
      bookedSlots: bookedTimes,
      totalSlots: allSlots.length,
    };
  },

  // Query entity database (general purpose)
  query_entity_database: (params) => {
    const { entityId, query } = params;
    
    if (!entityId) {
      return { error: 'Entity ID is required' };
    }

    return database.queryDatabase(entityId, query || 'info');
  },
};