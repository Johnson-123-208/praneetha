import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Company } from './models/Company.js';
import { Doctor } from './models/Doctor.js';
import { Vacancy } from './models/Vacancy.js';
import { Order } from './models/Order.js';
import { Appointment } from './models/Appointment.js';
import { Feedback } from './models/Feedback.js';

dotenv.config();

const clearCollections = async () => {
    await Company.deleteMany({});
    await Doctor.deleteMany({});
    await Vacancy.deleteMany({});
    await Order.deleteMany({});
    await Appointment.deleteMany({});
    await Feedback.deleteMany({});
};

const seedCoreFourMassive = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected to Atlas');

        await clearCollections();
        console.log('🗑️ Collections cleared');

        // 1. Core 4 Companies
        const companyData = [
            {
                name: "Aarogya Multispeciality Hospital",
                industry: "Healthcare",
                logo: "🏥",
                context_summary: "Premier Hospital with 20+ departments and online booking for leading consultants.",
                nlp_context: "DATABASE: [Specialties: Cardiology, Neurology, Pediatrics, Orthopedics, Oncology, Dermatology, ENT, Urology, Gynecology, Dental]. Facilities: 24/7 ER, ICU, Pharmacy. Action: 'BOOK_APPOINTMENT for [Doctor] on [Date] at [Time]'.",
                contact_email: "appointments@aarogya.com",
                contact_phone: "+91-98765-43000"
            },
            {
                name: "Spice Garden Fine Dine & Hotel",
                industry: "Food & Beverage",
                logo: "🥗",
                context_summary: "Luxury dining with diverse menus and event booking for large groups.",
                nlp_context: "MENU: [North Indian: Butter Chicken (₹480), Paneer Lababdar (₹380)]. [Continental: Grilled Salmon (₹850), Alfredo Pasta (₹420)]. [Oriental: Dimsums (₹320)]. RECOMMENDATIONS: For 2: 'Chef Special Thali' (₹799). For 4: 'Family Feast' (₹2499). Action: 'BOOK_TABLE for [People] on [Date] at [Time]'.",
                contact_email: "tables@spicegarden.com",
                contact_phone: "+91-88888-55555"
            },
            {
                name: "Agile-IT Global Solutions",
                industry: "Technology",
                logo: "💻",
                context_summary: "Fortune 500 Tech Partner focusing on Enterprise AI and Cloud Transformation.",
                nlp_context: "CULTURE: Flat hierarchy, 4-day week, remote-first. HIRING: Rounds: Screening -> Tech -> Panel. PERKS: Equity, ₹1L Learning Fund. Action: 'BOOK_APPOINTMENT for Interview on [Date] at [Time]'.",
                contact_email: "careers@agile-it.com",
                contact_phone: "+1-555-TECH"
            },
            {
                name: "QuickKart Pro Electronics",
                industry: "E-Commerce",
                logo: "🛒",
                context_summary: "Authorized retailer for premium gadgets including Apple, Sony, and Samsung.",
                nlp_context: "CATALOG: [Phones: iPhone 15 Pro (₹1,34,900), S24 Ultra (₹1,29,900)]. [Audio: Sony XM5 (₹29,900)]. [Computing: MacBook Pro M3 (₹1,69,900)]. Action: 'BOOK_ORDER [Item]' or 'TRACE_ORDER'.",
                contact_email: "support@quickkart.com",
                contact_phone: "+1-800-KART"
            }
        ];

        const seededCompanies = await Company.insertMany(companyData);
        console.log('🏢 Core 4 Companies Seeded');

        const hospital = seededCompanies[0];
        const hotel = seededCompanies[1];
        const tech = seededCompanies[2];
        const ecom = seededCompanies[3];

        // 2. Large Data Sets (Linked to these 4)
        const doctors = [];
        const specs = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Oncology', 'Dental', 'General Medicine'];
        for (let i = 1; i <= 50; i++) {
            doctors.push({
                hospital_id: hospital._id,
                name: `Dr. Specialist ${i}`,
                specialization: specs[i % specs.length],
                experience_years: 5 + (i % 15),
                is_available: true
            });
        }
        await Doctor.insertMany(doctors);
        console.log('👨‍⚕️ 50 Doctors Seeded for Hospital');

        const vacancies = [];
        const positions = ['Cloud Architect', 'Node.js Senior Dev', 'AI Researcher', 'Product Lead', 'UI Designer', 'DevOps Specialist', 'HR Partner'];
        for (let i = 1; i <= 40; i++) {
            vacancies.push({
                company_id: tech._id,
                position: positions[i % positions.length],
                department: ['Engineering', 'Product', 'People'][i % 3],
                description: `Senior level opening #${i} for a high-growth career.`,
                status: 'open'
            });
        }
        await Vacancy.insertMany(vacancies);
        console.log('💼 40 Vacancies Seeded for Tech Co');

        const demoEmails = ['user@example.com', 'guest@preview.com'];
        const sampleOrders = [];
        for (let i = 1; i <= 60; i++) {
            sampleOrders.push({
                id: `QK-ORD-${1000 + i}`,
                company_id: ecom._id,
                item: `Premium Device #${i}`,
                quantity: 1,
                total_price: 200 + (i * 10),
                status: 'completed',
                customer_name: `Customer ${i}`,
                user_email: demoEmails[i % 2]
            });
        }
        await Order.insertMany(sampleOrders);
        console.log('📦 60 Orders Seeded for Ecom');

        const sampleApps = [];
        for (let i = 1; i <= 60; i++) {
            sampleApps.push({
                entity_id: i % 2 === 0 ? hospital._id : hotel._id,
                entity_name: i % 2 === 0 ? hospital.name : hotel.name,
                type: i % 2 === 0 ? 'consultation' : 'table',
                person_name: `Client ${i}`,
                date: "2024-10-15",
                time: "14:00",
                status: 'scheduled',
                user_email: demoEmails[i % 2]
            });
        }
        await Appointment.insertMany(sampleApps);
        console.log('📅 60 Appointments Seeded');

        console.log('\n✨ SUCCESS: 4 CORE SERVICES SEEDED WITH LARGE DATASETS.');
        process.exit(0);
    } catch (error) {
        console.error('❌ SEED ERROR:', error);
        process.exit(1);
    }
};

seedCoreFourMassive();
