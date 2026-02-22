import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Company } from './models/Company.js';

dotenv.config();

const companies = [
    {
        name: "Aarogya Multispeciality Hospital",
        industry: "Healthcare",
        logo: "🏥",
        gender: "female",
        context_summary: "Comprehensive healthcare database: 15+ Doctors, 8 Specialties, 24/7 Emergency & Lab Services.",
        nlp_context: `DATABASE:
[STAFF REGISTRY]:
- Cardiology: Dr. Aryan (HOD, 18yrs exp, Consultation: ₹1200), Dr. Sneha (10yrs exp, ₹800)
- Neurology: Dr. Meera (Specialist, 14yrs exp, ₹1500), Dr. Amit (8yrs exp, ₹1000)
- Pediatrics: Dr. Ananya (Care lead, 12yrs exp, ₹700), Dr. Sid (6yrs exp, ₹500)
- Orthopedics: Dr. Rohan (Surgeon, 15yrs exp, ₹1100), Dr. Pooja (9yrs exp, ₹750)
- General Physician: Dr. Kapoor (₹500), Dr. Gupta (₹400)

[FACILITIES]:
- 24/7 Emergency Wing, In-house Pharmacy, Advanced MRI/CT Scan Lab, ICU, Dialysis Center.

[SCHEDULING]:
- Morning: 09:00 AM - 01:00 PM
- Evening: 04:00 PM - 08:30 PM
- Action: Call 'BOOK_APPOINTMENT for [Doctor] on [Date] at [Time]'.`,
        contact_email: "care@aarogya.com",
        contact_phone: "+91-98765-43000",
        website_url: "https://aarogya-hospital.com"
    },
    {
        name: "Spice Garden Fine Dine",
        industry: "Food & Beverage",
        logo: "🥗",
        gender: "female",
        context_summary: "Full Menu Database: Starters, Main Course, Combos, and Group Booking Recommendations.",
        nlp_context: `MENU & PRICING:
[STARTERS]: 
- Veg: Paneer Tikka (₹350), Crispy Corn (₹280), Mushroom Duplex (₹320)
- Non-Veg: Chicken 65 (₹420), Fish Fingers (₹480), Chilli Prawns (₹550)

[MAIN COURSE]:
- North Indian: Butter Chicken (₹480), Kadhai Paneer (₹380), Dal Makhani (₹320)
- Briyani: Hyderabadi Mutton (₹550), Chicken Dum (₹420), Veg Handi (₹350)
- Breads: Butter Naan (₹60), Garlic Roti (₹50)

[COMBOS & RECOMMENDATIONS]:
- For Couples: 'Romantic Candlelight' (₹1800 - 3 courses + Drinks)
- For Families (4-6): 'Grand Feast' (₹3500 - Unlimited Starters + Main Course)
- Budget Friendly: 'Executive Thali' (₹299)
- Spicy Lovers: Mutton Biryani is our signature highly spicy dish.

[RESERVATIONS]:
- Table Sizes: 2, 4, 6, 8, 12, 20.
- Action: Use 'BOOK_TABLE for [People] on [Date] at [Time]'.`,
        contact_email: "reservations@spicegarden.com",
        contact_phone: "+91-88888-55555",
        website_url: "https://spicegarden-dine.com"
    },
    {
        name: "Agile-IT Global Solutions",
        industry: "Technology",
        logo: "💻",
        gender: "male",
        context_summary: "HR Portal: Careers, 12 Openings, Culture, Benefits, and Interview Automations.",
        nlp_context: `HR & TALENT PORTAL:
[CURRENT OPENINGS]:
- Engineering: Senior React Dev (5+ yrs), Node.js Backend Lead (7+ yrs), QA Automation (3+ yrs)
- Design: UI/UX Specialist (Figma/Adobe XD, 4+ yrs)
- Data: ML Engineer (Python/Tensorflow), Data Analyst (SQL/Tableau)
- HR: Talent Acquisition Lead, HR Operations Manager

[CULTURE & PERKS]:
- Work Model: 100% Remote-First, Flexible timings.
- Benefits: 4-day work week (Friday Off), Annual ₹1L Learning Stipend, Family Health Insurance, 30 days Paid Leave.
- Environment: Flat hierarchy, high innovation, tech-first approach.

[HIRING PROCESS]:
1. Step: Phone Screen with Callix
2. Step: Take-home Technical Assignment
3. Step: Live Panel Interview
- Action: Use 'BOOK_APPOINTMENT for Interview on [Date] at [Time]'.`,
        contact_email: "talent@agile-it.services",
        contact_phone: "+1-555-TECH-HIRE",
        website_url: "https://agile-it.services"
    },
    {
        name: "QuickKart Store",
        industry: "E-Commerce",
        logo: "🛒",
        gender: "female",
        context_summary: "Electronics Catalog: 20+ Premium Devices, Inventory Levels, and Tracking System.",
        nlp_context: `STOCK REGISTRY:
[SMARTPHONES]:
- Apple: iPhone 15 Pro (₹1,34,900), iPhone 14 (₹69,900), Apple Watch Ultra (₹82,900)
- Samsung: S24 Ultra (₹1,29,900), Z Fold 5 (₹1,54,900)
- Google: Pixel 8 Pro (₹1,06,900)

[LAPTOPS & COMPUTING]:
- Macbook: Pro M3 Max (₹2,49,900), Air M2 (₹94,900)
- Gaming: ASUS ROG Zephyrus (₹1,85,000), Dell Alienware (₹2,10,000)
- Productivity: Dell XPS 15 (₹1,45,000), Surface Laptop (₹1,15,000)

[ACCESSORIES & AUDIO]:
- Audio: Sony XM5 Headphones (₹29,900), AirPods Pro (₹24,900), Bose QuietComfort (₹27,500)

[OPERATIONS]:
- Delivery: Express 24h for tier-1 cities. Standard 2-3 days.
- Tracking: 10-digit ID (e.g., QK99887766). 
- Action: Use 'BOOK_ORDER [Item]' for buying or 'TRACE_ORDER' for tracking.`,
        contact_email: "orders@quickkart.com",
        contact_phone: "+1-800-KART-HELP",
        website_url: "https://quickkart-store.com"
    }
];

const seedProData = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is missing");

        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('🔄 Connected');

        await Company.deleteMany({});
        await Company.insertMany(companies);

        console.log('✨ SUCCESS: Large scale data for 4 services (Hospital, Hotel, IT, E-Commerce) seeded.');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    }
};

seedProData();
