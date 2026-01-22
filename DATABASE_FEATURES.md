# Database Features & Capabilities

## 🎯 Overview

The AI Calling Agent now supports comprehensive database operations for companies, hospitals, and other entities. The agent can answer general questions and perform database queries, bookings, and feedback collection.

---

## ✨ Key Features

### 1. **General Question Answering**
The agent can answer any general questions using its knowledge base:
- **Examples:**
  - "What is artificial intelligence?"
  - "Tell me about the weather"
  - "Explain quantum computing"
  - "How does machine learning work?"

### 2. **Vacancy Checking**
Check job vacancies and positions in companies:
- **Command:** "How many vacancies are there for [position]?"
- **Example:** "How many vacancies are there for Software Engineer?"
- **Function:** `check_vacancies`

### 3. **Appointment Booking**
Book appointments with doctors, CEOs, executives, etc.:
- **For Hospitals:**
  - "Book an appointment with Dr. Sarah Johnson"
  - "I want to see a cardiologist"
  
- **For Companies:**
  - "Book a meeting with the CEO"
  - "Schedule an appointment with the executive team"

- **Function:** `book_appointment`

### 4. **Feedback Collection**
Collect user feedback and ratings:
- **Examples:**
  - "I want to give feedback: 5 stars, excellent service!"
  - "Collect my feedback: Rating 4, comment: Good experience"
- **Function:** `collect_feedback`

### 5. **Database Queries**
Query any entity's database for information:
- Vacancies
- Appointments
- Doctors
- Feedback
- General info

---

## 📋 Usage Examples

### Example 1: Checking Vacancies

**User:** "How many vacancies are there for Software Engineer?"

**Agent Response:**
```
I found 1 vacancy for Software Engineer in the Engineering department.
Position: Software Engineer
Department: Engineering
Status: Open
Description: Full-stack developer with 3+ years experience
```

### Example 2: Booking Doctor Appointment

**User:** "I want to book an appointment with Dr. Sarah Johnson for tomorrow at 10 AM"

**Agent Response:**
```
I've booked your appointment with Dr. Sarah Johnson.
Appointment ID: apt_1234567890
Date: 2024-12-XX
Time: 10:00
Your appointment is confirmed!
```

### Example 3: Booking CEO Meeting

**User:** "Can I schedule a meeting with the CEO next Monday at 2 PM?"

**Agent Response:**
```
I've scheduled your meeting with the CEO.
Appointment ID: apt_1234567891
Date: 2024-12-XX (Monday)
Time: 14:00
The CEO's office will confirm the meeting shortly.
```

### Example 4: Collecting Feedback

**User:** "I want to give feedback. Rating 5, excellent service and friendly staff"

**Agent Response:**
```
Thank you for your feedback!
Feedback ID: fb_1234567890
Rating: 5/5
Category: General
Your feedback has been recorded and will be reviewed.
```

### Example 5: General Questions

**User:** "What is artificial intelligence?"

**Agent Response:**
```
Artificial Intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding.
...
```

---

## 🔧 Function Calling Tools

### 1. `check_vacancies`
**Purpose:** Check job vacancies for positions

**Parameters:**
- `companyId` (required): Company ID
- `position` (optional): Position/job title to search

**Returns:**
- Count of vacancies
- List of available positions
- Department and status information

---

### 2. `book_appointment`
**Purpose:** Book appointments with doctors, CEOs, executives

**Parameters:**
- `entityId` (required): Company/Hospital ID
- `type` (required): 'doctor', 'ceo', 'executive', 'general'
- `personName` (optional): Name of person (doctor name, CEO, etc.)
- `date` (required): Date in YYYY-MM-DD format
- `time` (required): Time in HH:MM format
- `userInfo` (optional): User information (name, phone, email)

**Returns:**
- Appointment ID
- Confirmation message
- Appointment details

---

### 3. `collect_feedback`
**Purpose:** Collect user feedback and ratings

**Parameters:**
- `entityId` (required): Company/Hospital ID
- `rating` (optional): Rating from 1-5
- `comment` (optional): Feedback text
- `category` (optional): 'service', 'product', 'appointment', 'general'

**Returns:**
- Feedback ID
- Confirmation message

---

### 4. `get_available_slots`
**Purpose:** Check available appointment time slots

**Parameters:**
- `entityId` (required): Company/Hospital ID
- `date` (optional): Date in YYYY-MM-DD format
- `type` (optional): Appointment type

**Returns:**
- List of available time slots
- Booked slots
- Total available slots

---

### 5. `query_entity_database`
**Purpose:** Query entity database for general information

**Parameters:**
- `entityId` (required): Company/Hospital ID
- `query` (optional): Query type ('vacancies', 'appointments', 'doctors', 'feedback', 'info')

**Returns:**
- Database information based on query type

---

## 🏥 Hospital-Specific Features

When you onboard a **Healthcare** company/hospital:

### Automatic Setup:
- 5 sample doctors are automatically added
- Each doctor has specialization, experience, availability

### Available Operations:
- Book appointments with specific doctors
- Book appointments by specialization
- Check doctor availability
- Collect patient feedback

### Example Doctors Added:
- Dr. Sarah Johnson - Cardiology (15 years)
- Dr. Michael Chen - Pediatrics (10 years)
- Dr. Priya Patel - Dermatology (8 years)
- Dr. Robert Williams - Orthopedics (12 years)
- Dr. Emily Davis - Gynecology (9 years)

---

## 🏢 Company-Specific Features

When you onboard a **non-Healthcare** company:

### Automatic Setup:
- 5 sample job vacancies are automatically added
- Positions include: Software Engineer, Product Manager, Marketing Specialist, Sales Executive, Customer Support

### Available Operations:
- Check vacancies by position
- Check vacancies by department
- Book meetings with executives
- Book appointments with CEO
- Collect customer feedback

---

## 📊 Database Structure

### Companies
```javascript
{
  id: 'comp_xxx',
  name: 'Company Name',
  industry: 'Technology',
  logo: '🏢',
  contextSummary: 'Company description',
  apiKey: 'xxx',
  createdAt: '2024-...'
}
```

### Vacancies
```javascript
{
  id: 'vac_xxx',
  companyId: 'comp_xxx',
  position: 'Software Engineer',
  department: 'Engineering',
  status: 'open',
  description: 'Job description',
  createdAt: '2024-...'
}
```

### Doctors
```javascript
{
  id: 'doc_xxx',
  hospitalId: 'comp_xxx',
  name: 'Dr. Sarah Johnson',
  specialization: 'Cardiology',
  experience: '15 years',
  available: true,
  createdAt: '2024-...'
}
```

### Appointments
```javascript
{
  id: 'apt_xxx',
  entityId: 'comp_xxx',
  type: 'doctor',
  personName: 'Dr. Sarah Johnson',
  date: '2024-12-XX',
  time: '10:00',
  userInfo: {},
  status: 'scheduled',
  createdAt: '2024-...'
}
```

### Feedback
```javascript
{
  id: 'fb_xxx',
  entityId: 'comp_xxx',
  rating: 5,
  comment: 'Excellent service',
  category: 'service',
  createdAt: '2024-...'
}
```

---

## 🎤 Voice Interaction Examples

### Multilingual Support
All database operations work in 7 languages:
- English (default)
- Hindi (हिंदी)
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം)
- Marathi (मराठी)

**Example in Hindi:**
- **User:** "कितनी vacancies हैं Software Engineer के लिए?"
- **Agent:** (Responds in Hindi with vacancy information)

---

## 🚀 How to Use

### 1. Onboard a Company/Hospital
1. Click **"Sign Up"** in header
2. Fill company details (industry, name, context)
3. Submit - sample data is automatically added

### 2. Deploy Company-Specific Agent
1. Go to **"Portfolio"** section
2. Find your company card
3. Click **"Deploy Agent"**
4. Agent will use that company's database context

### 3. Start Voice Interaction
1. Click **"Call Agent"** button
2. Ask questions or make requests:
   - General questions: "What is AI?"
   - Check vacancies: "How many vacancies for Engineer?"
   - Book appointment: "Book appointment with Dr. Johnson"
   - Collect feedback: "I want to give 5 star feedback"

### 4. View Operations
- Go to **"Operations"** section
- View all bookings, orders, and operations

---

## 📝 Notes

1. **Sample Data:** When onboarding a company, sample vacancies/doctors are automatically added for demonstration.

2. **Entity Context:** When deploying a company-specific agent, all database queries automatically use that company's ID.

3. **Date Format:** Use YYYY-MM-DD format for dates (e.g., "2024-12-15")

4. **Time Format:** Use HH:MM format for times (e.g., "10:00", "14:30")

5. **Language Detection:** The agent automatically detects your language and responds accordingly.

---

## ✅ Complete Feature List

✅ General question answering  
✅ Vacancy checking and management  
✅ Appointment booking (doctors, CEOs, executives)  
✅ Feedback collection with ratings  
✅ Database queries for any entity  
✅ Multilingual support (7 languages)  
✅ Automatic sample data generation  
✅ Company-specific agent deployment  
✅ Real-time operations tracking  

---

**The AI Calling Agent is now fully equipped to handle general questions and comprehensive database operations!** 🚀