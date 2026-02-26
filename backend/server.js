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
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    })
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch((err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
            console.log('⚠️ Running in fallback mode without database connection.');
        });
} else {
    console.warn('⚠️ MONGODB_URI not found in environment variables. Backend will run in Demo/Mock mode.');
}

// --- Notification Routes ---
app.post('/api/notify-superadmin', async (req, res) => {
    const { fullName, email, companyName, industry } = req.body;

    console.log('\n--- NEW ADMIN REGISTRATION NOTIFICATION ---');
    console.log(`👤 Admin: ${fullName} (${email})`);
    console.log(`🏢 Company: ${companyName}`);
    console.log(`📋 Industry: ${industry}`);
    console.log('--- SENT TO SUPERADMIN EMAIL (SIMULATED) ---\n');

    // In production, we'd use nodemailer or a service like Resend here:
    // await sendEmail({ to: 'superadmin@callix.com', subject: 'New Admin Request', ... })

    res.json({ success: true, message: 'Superadmin notified via terminal (production: email)' });
});

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({ message: 'Demo mode: User registration simulated.', user: { email: req.body.email, full_name: req.body.full_name || 'Guest' } });
        }
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
        if (mongoose.connection.readyState !== 1) {
            // Fallback for demo when DB is not connected
            return res.status(200).json({
                user: {
                    email: req.body.email,
                    full_name: 'Demo User',
                    isDemo: true
                }
            });
        }
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
    try {
        const companies = await Company.find();
        return res.json(companies || []);
    } catch (err) {
        console.error('Company fetch error:', err.message);
        res.json([]);
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

// --- Delete Routes ---
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Appointment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/feedback/:id', async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feedback deleted' });
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

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 API Server running on port ${PORT}`);
    });
}

export default app;
