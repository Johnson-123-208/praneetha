# 🎯 Quick Reference: Supabase Integration

## ✅ What's Been Set Up

### 1. Environment Configuration
- ✅ Supabase URL configured in `.env`
- ✅ Supabase Anon Key configured in `.env`
- ✅ Supabase client library installed

### 2. Database Files Created

| File | Purpose |
|------|---------|
| `database/schema.sql` | Complete database schema (12 tables, views, functions) |
| `database/import_techmahindra.sql` | SQL to import Tech Mahindra data |
| `src/utils/supabaseClient.js` | JavaScript client for all DB operations |
| `SUPABASE_SETUP.md` | Detailed setup instructions |

### 3. Database Tables (12 Total)

1. **companies** - Company/hospital profiles
2. **doctors** - Doctor information
3. **departments** - Organizational departments
4. **vacancies** - Job openings
5. **appointments** - Appointment bookings
6. **orders** - Order tracking
7. **feedback** - Customer feedback
8. **services** - Services offered
9. **health_packages** - Health packages
10. **conversation_logs** - AI conversation history
11. **leadership_team** - Leadership profiles
12. **office_locations** - Office addresses

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create Tables in Supabase

```bash
1. Go to: https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs/sql
2. Click "New Query"
3. Copy entire contents of database/schema.sql
4. Paste and click "Run"
```

### Step 2: Import Tech Mahindra Data

```bash
1. In SQL Editor, run the company INSERT from import_techmahindra.sql
2. Copy the returned UUID
3. Replace {company_id} with the UUID in the file
4. Run the remaining INSERT statements
```

### Step 3: Test in Your App

```javascript
import supabaseDB from './src/utils/supabaseClient.js';

// Get all companies
const companies = await supabaseDB.getCompanies();
console.log(companies);
```

---

## 📋 Common Operations

### Get Companies
```javascript
const companies = await supabaseDB.getCompanies();
```

### Save Company
```javascript
const company = await supabaseDB.saveCompany({
  name: 'Apollo Hospitals',
  industry: 'Healthcare',
  context_summary: 'Multi-specialty hospital...',
  contact_email: 'info@apollo.com'
});
```

### Get Job Vacancies
```javascript
// All vacancies
const allVacancies = await supabaseDB.getVacancies();

// For specific company
const companyVacancies = await supabaseDB.getVacancies(companyId);

// Search by position
const engineerJobs = await supabaseDB.getVacancies(null, 'engineer');
```

### Book Appointment
```javascript
const appointment = await supabaseDB.saveAppointment({
  entity_id: companyId,
  appointment_type: 'doctor',
  person_name: 'Dr. Smith',
  date: '2026-01-25',
  time: '10:00',
  user_name: 'John Doe',
  user_email: 'john@example.com'
});
```

### Create Order
```javascript
const order = await supabaseDB.saveOrder({
  company_id: companyId,
  item: 'Product Name',
  quantity: 5,
  customer_name: 'Jane Doe',
  customer_email: 'jane@example.com'
});
```

### Save Feedback
```javascript
const feedback = await supabaseDB.saveFeedback({
  entity_id: companyId,
  rating: 5,
  comment: 'Excellent service!',
  category: 'service',
  user_name: 'Customer Name'
});
```

### Bulk Import JSON
```javascript
import techMahindraData from './TechMahindra.json';

const company = await supabaseDB.bulkInsertCompanyData(techMahindraData);
```

---

## 🔍 Useful SQL Queries

### Check Total Records
```sql
SELECT 
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM vacancies) as vacancies,
  (SELECT COUNT(*) FROM appointments) as appointments,
  (SELECT COUNT(*) FROM orders) as orders;
```

### View All Open Jobs
```sql
SELECT * FROM open_vacancies;
```

### View Available Doctors
```sql
SELECT * FROM available_doctors;
```

### View Upcoming Appointments
```sql
SELECT * FROM upcoming_appointments;
```

### Get Available Slots for a Date
```sql
SELECT * FROM get_available_slots(
  'company-uuid-here'::UUID,
  '2026-01-25'::DATE
);
```

---

## 🔗 Important URLs

- **SQL Editor:** https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs/sql
- **Table Editor:** https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs/editor
- **API Docs:** https://supabase.com/dashboard/project/xpuhacmnjpzzmhrjdigs/api

---

## 📊 Database Schema Diagram

```
companies (main table)
├── doctors (hospital_id → companies.id)
├── departments (company_id → companies.id)
├── vacancies (company_id → companies.id)
├── appointments (entity_id → companies.id)
│   └── doctor_id → doctors.id
├── orders (company_id → companies.id)
├── feedback (entity_id → companies.id)
├── services (company_id → companies.id)
├── health_packages (hospital_id → companies.id)
├── conversation_logs (company_id → companies.id)
├── leadership_team (company_id → companies.id)
└── office_locations (company_id → companies.id)
```

---

## 🎨 Integration with Your App

### Update database.js to use Supabase

Replace localStorage calls with Supabase:

```javascript
// src/utils/database.js
import supabaseDB, { isSupabaseInitialized } from './supabaseClient.js';

export const database = {
  async getCompanies() {
    if (isSupabaseInitialized()) {
      return await supabaseDB.getCompanies();
    }
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('companies') || '[]');
  },
  
  async saveCompany(data) {
    if (isSupabaseInitialized()) {
      return await supabaseDB.saveCompany(data);
    }
    // Fallback to localStorage
    const companies = this.getCompanies();
    const newCompany = { id: Date.now(), ...data };
    companies.push(newCompany);
    localStorage.setItem('companies', JSON.stringify(companies));
    return newCompany;
  },
  
  // ... similar for other methods
};
```

---

## ⚡ Performance Tips

1. **Use Views** - Pre-built queries are faster
2. **Index Usage** - All foreign keys are indexed
3. **Batch Operations** - Use bulk insert for multiple records
4. **Caching** - Cache frequently accessed data in localStorage

---

## 🔐 Security Notes

- **RLS Enabled** - Row Level Security is active on all tables
- **Public Read** - Currently allows public read access
- **Modify Policies** - Adjust in Supabase dashboard for production
- **API Keys** - Never commit `.env` to version control

---

## 📝 Next Steps

1. ✅ Run `schema.sql` in Supabase SQL Editor
2. ✅ Import sample data (Tech Mahindra, Apollo)
3. ✅ Test database connection in your app
4. ✅ Update app code to use Supabase
5. ✅ Test all features (appointments, orders, feedback)
6. ✅ Deploy to production

---

**Need help? Check `SUPABASE_SETUP.md` for detailed instructions!**
