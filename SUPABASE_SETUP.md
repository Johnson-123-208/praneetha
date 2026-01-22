# Supabase Database Setup Guide

## 🎯 Overview

This guide will help you set up the complete Supabase database for your AI Calling Agent project.

---

## 📋 Prerequisites

- Supabase account (free tier works fine)
- Project created on Supabase
- Supabase URL and Anon Key (already configured in `.env`)

---

## 🚀 Step-by-Step Setup

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Open your project: **xpuhacmnjpzzmhrjdigs**

### Step 2: Create Database Schema

1. In the Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `database/schema.sql` from this project
4. **Copy the entire contents** of `schema.sql`
5. **Paste it into the SQL Editor**
6. Click **"Run"** button (or press Ctrl+Enter)
7. Wait for execution to complete (should take 10-30 seconds)

✅ **Expected Result:** All tables, indexes, triggers, views, and functions will be created.

### Step 3: Verify Tables Created

1. Click on **"Table Editor"** in the left sidebar
2. You should see the following tables:
   - ✅ companies
   - ✅ doctors
   - ✅ departments
   - ✅ vacancies
   - ✅ appointments
   - ✅ orders
   - ✅ feedback
   - ✅ services
   - ✅ health_packages
   - ✅ conversation_logs
   - ✅ leadership_team
   - ✅ office_locations

### Step 4: Import Sample Data (Tech Mahindra)

#### Option A: Using SQL Editor (Recommended)

1. Go back to **SQL Editor**
2. Create a **New Query**
3. Open `database/import_techmahindra.sql`
4. **First**, run ONLY the company INSERT statement:
   ```sql
   INSERT INTO companies (name, industry, logo, ...) VALUES (...) RETURNING id;
   ```
5. **Copy the returned UUID** (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
6. **Replace all `{company_id}` placeholders** in the file with this UUID
7. **Run the remaining INSERT statements** (office locations, leadership, vacancies)

#### Option B: Using JavaScript (Automated)

1. Open your browser console on http://localhost:3000
2. Run this code:
   ```javascript
   import supabaseDB from './src/utils/supabaseClient.js';
   import techMahindraData from './TechMahindra.json';
   
   const company = await supabaseDB.bulkInsertCompanyData(techMahindraData);
   console.log('Imported:', company);
   ```

### Step 5: Import Hospital Data (Apollo Hospitals)

If you have `Apollo_Hospitals.json`, repeat the same process:

1. Create SQL import script or use the bulk insert function
2. Import company, doctors, departments, services, etc.

---

## 🔧 Configuration Files

### 1. `.env` File (Already Configured)

```bash
VITE_SUPABASE_URL=https://xpuhacmnjpzzmhrjdigs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Supabase Client (`src/utils/supabaseClient.js`)

This file provides all database operations:
- `supabaseDB.getCompanies()` - Get all companies
- `supabaseDB.saveCompany(data)` - Save a company
- `supabaseDB.getVacancies(companyId)` - Get job vacancies
- `supabaseDB.saveAppointment(data)` - Book an appointment
- `supabaseDB.bulkInsertCompanyData(json)` - Import JSON data
- And many more...

---

## 📊 Database Schema Overview

### Core Tables:

1. **companies** - Stores company/hospital information
2. **doctors** - Doctor profiles for hospitals
3. **departments** - Organizational departments
4. **vacancies** - Job openings
5. **appointments** - Appointment bookings
6. **orders** - Order tracking
7. **feedback** - Customer feedback
8. **services** - Services offered
9. **health_packages** - Health checkup packages
10. **conversation_logs** - AI conversation history
11. **leadership_team** - Company leadership
12. **office_locations** - Office addresses

### Views (Pre-built Queries):

- `available_doctors` - All available doctors with hospital info
- `open_vacancies` - All open job positions
- `upcoming_appointments` - Scheduled appointments
- `recent_orders` - Latest orders

### Functions:

- `get_available_slots(entity_id, date)` - Get free appointment slots
- `generate_order_id()` - Generate unique order IDs
- `update_updated_at_column()` - Auto-update timestamps

---

## 🔒 Row Level Security (RLS)

The schema includes RLS policies for security:

- **Public Read Access** - Anyone can view data
- **Insert/Update/Delete** - Currently open to all (adjust based on your needs)

### To Customize Security:

1. Go to **Authentication** > **Policies** in Supabase
2. Modify policies for each table
3. Example: Restrict updates to authenticated users only

---

## 🧪 Testing the Database

### Test 1: Check if Supabase is Connected

```javascript
import { isSupabaseInitialized } from './src/utils/supabaseClient.js';

console.log('Supabase connected:', isSupabaseInitialized());
```

### Test 2: Fetch Companies

```javascript
import supabaseDB from './src/utils/supabaseClient.js';

const companies = await supabaseDB.getCompanies();
console.log('Companies:', companies);
```

### Test 3: Get Vacancies

```javascript
const vacancies = await supabaseDB.getVacancies();
console.log('Job openings:', vacancies);
```

### Test 4: Book an Appointment

```javascript
const appointment = await supabaseDB.saveAppointment({
  entity_id: 'company-uuid-here',
  appointment_type: 'doctor',
  person_name: 'Dr. Smith',
  date: '2026-01-25',
  time: '10:00',
  user_name: 'John Doe',
  user_email: 'john@example.com',
  user_phone: '+91-9876543210'
});
console.log('Appointment booked:', appointment);
```

---

## 🔄 Migrating from localStorage to Supabase

Your app currently uses localStorage. To migrate:

### Option 1: Update database.js

Replace localStorage calls with Supabase calls:

```javascript
// OLD (localStorage)
const companies = localStorage.getItem('companies');

// NEW (Supabase)
const companies = await supabaseDB.getCompanies();
```

### Option 2: Create a Hybrid Approach

Use Supabase as primary, localStorage as fallback:

```javascript
async getCompanies() {
  try {
    if (isSupabaseInitialized()) {
      return await supabaseDB.getCompanies();
    }
  } catch (error) {
    console.warn('Supabase error, using localStorage');
  }
  // Fallback to localStorage
  return JSON.parse(localStorage.getItem('companies') || '[]');
}
```

---

## 📈 Monitoring & Analytics

### View Database Stats:

1. Go to **Database** > **Tables** in Supabase
2. Click on any table to see row count
3. Use **SQL Editor** for custom queries:

```sql
-- Total companies
SELECT COUNT(*) FROM companies;

-- Total job openings
SELECT COUNT(*) FROM vacancies WHERE status = 'open';

-- Appointments by status
SELECT status, COUNT(*) FROM appointments GROUP BY status;

-- Average feedback rating
SELECT AVG(rating) FROM feedback;
```

---

## 🐛 Troubleshooting

### Issue 1: "Supabase not initialized"

**Solution:** Check `.env` file has correct credentials and restart dev server.

### Issue 2: "Permission denied" errors

**Solution:** Check RLS policies in Supabase dashboard. You may need to adjust policies.

### Issue 3: "Function not found" error

**Solution:** Ensure `schema.sql` was run completely. Check SQL Editor for errors.

### Issue 4: Data not showing in app

**Solution:** 
1. Verify data exists in Supabase Table Editor
2. Check browser console for errors
3. Ensure you're using the correct company IDs

---

## 📚 Next Steps

1. ✅ **Run schema.sql** to create tables
2. ✅ **Import sample data** (Tech Mahindra, Apollo Hospitals)
3. ✅ **Test database connection** in your app
4. ✅ **Update app code** to use Supabase instead of localStorage
5. ✅ **Deploy** your app with live database

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs
- **Supabase Docs:** https://supabase.com/docs
- **SQL Editor:** https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs/sql
- **Table Editor:** https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs/editor

---

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Review the SQL error messages
3. Verify your API keys are correct
4. Check the browser console for JavaScript errors

---

**Happy coding! 🚀**
