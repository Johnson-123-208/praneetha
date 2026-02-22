import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Company } from './models/Company.js';
import { Order } from './models/Order.js';
import { Appointment } from './models/Appointment.js';
import { Feedback } from './models/Feedback.js';
import { Doctor } from './models/Doctor.js';
import { User } from './models/User.js';
import { ConversationLog } from './models/ConversationLog.js';
import { Vacancy } from './models/Vacancy.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️ Running in fallback mode without database connection.');
    });

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, full_name, phone, preferred_language } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const newUser = new User({ email, password, full_name, phone, preferred_language });
        await newUser.save();
        res.status(201).json({ user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        user.last_login = new Date();
        await user.save();
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Company Routes ---
app.get('/api/companies', async (req, res) => {
    // Highly Detailed Fallback data for the 4 Core Services
    const fallbackCompanies = [
        {
            id: "aarogya-hosp-001",
            name: "Aarogya Multispeciality Hospital",
            industry: "Healthcare",
            logo: "🏥",
            gender: "female",
            context_summary: "Tier-1 Healthcare Facility with 50+ Doctors, 15+ specialized departments, and 24/7 Emergency Care.",
            nlp_context: "DATABASE: [Departments: Cardiology, Neurology, Pediatrics, Orthopedics, Oncology, Dental]. Fees: ₹500 - ₹1500. Facilities: 24/7 Trauma, ICU, In-house Pharmacy. Action: 'BOOK_APPOINTMENT for [Doctor] on [Date] at [Time]'.",
            contact_email: "appointments@aarogya.com",
            contact_phone: "+91-98765-43000"
        },
        {
            id: "spice-garden-001",
            name: "Spice Garden Fine Dine & Hotel",
            industry: "Food & Beverage",
            logo: "🥗",
            gender: "female",
            context_summary: "Luxury Multi-cuisine Hotel with Indian, Continental, and Oriental menus. Seats up to 300 guests.",
            nlp_context: "MENU: [Veg: Paneer Lababdar (₹380), Dal Makhani (₹320)]. [Non-Veg: Butter Chicken (₹480), Hyderabadi Mutton Biryani (₹550)]. Recommendations: 'Couple Combo' (₹1800), 'Family Feast' (₹3500). Action: 'BOOK_TABLE for [People] on [Date] at [Time]'.",
            contact_email: "tables@spicegarden.com",
            contact_phone: "+91-88888-55555"
        },
        {
            id: "agile-it-001",
            name: "Agile-IT Global Solutions",
            industry: "Technology",
            logo: "💻",
            gender: "female",
            context_summary: "Fortune 500 IT Giant with 40+ open roles in AI, Cloud, and Software Engineering. Remote-First Culture.",
            nlp_context: "HR PORTAL: [Roles: Senior React Dev, Node.js Lead, AI Researcher, UI/UX Specialist]. Culture: 4-day work week, learning stipends, health insurance. Hiring: Screening -> Technical -> HR. Action: 'BOOK_APPOINTMENT for Interview on [Date] at [Time]'.",
            contact_email: "careers@agile-it.com",
            contact_phone: "+1-555-TECH-HIRE"
        },
        {
            id: "quickkart-pro-001",
            name: "QuickKart Pro Electronics",
            industry: "E-Commerce",
            logo: "🛒",
            gender: "female",
            context_summary: "Premier Electronics Store featuring 100+ products from Apple, Sony, Samsung, and more.",
            nlp_context: "CATALOG: [Phones: iPhone 15 Pro (₹1,34,900), S24 Ultra (₹1,29,900)]. [Laptops: Macbook Pro M3 (₹1,69,900), Dell XPS (₹1,45,000)]. [Audio: Sony XM5 (₹29,900)]. Action: 'BOOK_ORDER [Item]' or 'TRACE_ORDER'.",
            contact_email: "support@quickkart.com",
            contact_phone: "+1-800-KART-PRO"
        }
    ];

    try {
        const companies = await Company.find();
        if (companies && companies.length > 0) {
            return res.json(companies);
        }
        res.json(fallbackCompanies);
    } catch (err) {
        console.error('Company fetch error:', err.message);
        res.json(fallbackCompanies);
    }
});

app.post('/api/companies', async (req, res) => {
    try {
        const newCompany = new Company(req.body);
        await newCompany.save();
        res.status(201).json(newCompany);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/:id', async (req, res) => {
    try {
        const company = await Company.findOne({ _id: req.params.id }) || await Company.findOne({ id: req.params.id });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Order Routes ---
app.get('/api/orders', async (req, res) => {
    try {
        const { user_email } = req.query;
        let query = {};
        if (user_email) query.user_email = user_email;
        const orders = await Order.find(query).sort({ created_at: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Appointment Routes ---
app.get('/api/appointments', async (req, res) => {
    try {
        const { entity_id, user_email } = req.query;
        let query = {};
        if (entity_id) query.entity_id = entity_id;
        if (user_email) query.user_email = user_email;
        const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const newAppointment = new Appointment(req.body);
        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Feedback Routes ---
app.get('/api/feedback', async (req, res) => {
    try {
        const { user_email } = req.query;
        let query = {};
        if (user_email) query.user_email = user_email;
        const feedback = await Feedback.find(query).sort({ created_at: -1 });
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const newFeedback = new Feedback(req.body);
        await newFeedback.save();
        res.status(201).json(newFeedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Doctor Routes ---
app.get('/api/doctors', async (req, res) => {
    try {
        const { hospital_id } = req.query;
        let query = {};
        if (hospital_id) query.hospital_id = hospital_id;
        const doctors = await Doctor.find(query);
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/doctors', async (req, res) => {
    try {
        const newDoctor = new Doctor(req.body);
        await newDoctor.save();
        res.status(201).json(newDoctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Vacancy Routes ---
app.get('/api/vacancies', async (req, res) => {
    try {
        const { company_id } = req.query;
        let query = {};
        if (company_id) query.company_id = company_id;
        const vacancies = await Vacancy.find(query);
        res.json(vacancies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vacancies', async (req, res) => {
    try {
        const newVacancy = new Vacancy(req.body);
        await newVacancy.save();
        res.status(201).json(newVacancy);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Conversation Log Routes ---
app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new ConversationLog(req.body);
        await newLog.save();
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
        const { session_id, company_id } = req.query;
        let query = {};
        if (session_id) query.session_id = session_id;
        if (company_id) query.company_id = company_id;
        const logs = await ConversationLog.find(query).sort({ created_at: 1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});

export default app;
