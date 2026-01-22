# Sample Data Examples for AI Calling Agent

## Example 1: Hospital Setup

### Company/Hospital Information:
```json
{
  "name": "Apollo Hospital",
  "industry": "Healthcare",
  "contextSummary": "Multi-specialty hospital with 24/7 emergency services, cardiology, neurology, and orthopedics departments. We have 10 doctors available for appointments."
}
```

### Sample Doctors:
```json
[
  {
    "name": "Dr. Rajesh Kumar",
    "specialization": "Cardiology",
    "hospitalId": "comp_xxx"
  },
  {
    "name": "Dr. Priya Sharma",
    "specialization": "Neurology",
    "hospitalId": "comp_xxx"
  }
]
```

### Sample Appointment Slots:
- Available times: 09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00

---

## Example 2: Tech Company Setup

### Company Information:
```json
{
  "name": "Tech Mahindra",
  "industry": "Technology",
  "contextSummary": "Leading IT services company specializing in digital transformation, cloud services, and AI solutions. We have multiple job openings for software engineers, data scientists, and project managers."
}
```

### Sample Job Vacancies:
```json
[
  {
    "position": "Senior Software Engineer",
    "department": "Engineering",
    "status": "open",
    "description": "5+ years experience in Java/Python, cloud technologies"
  },
  {
    "position": "Data Scientist",
    "department": "AI/ML",
    "status": "open",
    "description": "3+ years experience in machine learning, Python, TensorFlow"
  }
]
```

---

## Example 3: Manufacturing Company

### Company Information:
```json
{
  "name": "Tata Steel",
  "industry": "Manufacturing",
  "contextSummary": "Leading steel manufacturing company. We handle bulk orders for construction materials, steel sheets, and industrial components."
}
```

---

## What Users Can Ask the AI Agent:

### For Hospitals:
- "I want to book an appointment with a cardiologist"
- "What are the available slots for tomorrow?"
- "Show me all doctors in neurology department"
- "I want to give feedback about my recent visit"

### For Companies:
- "Are there any job openings for software engineers?"
- "I want to book an appointment with the CEO"
- "What positions are available in the engineering department?"
- "I'd like to place an order for 100 units"

### General Queries:
- "Tell me about your company"
- "What services do you provide?"
- "What are your operating hours?"
- "I want to trace my order ABC123"

---

## Voice Interaction Examples:

### English:
**User:** "Hello, I want to book an appointment"
**Agent:** "Hello! I'd be happy to help you book an appointment. What type of appointment would you like - with a doctor, CEO, or someone else?"

### Hindi:
**User:** "नमस्ते, मुझे अपॉइंटमेंट बुक करना है"
**Agent:** "नमस्ते! मैं आपकी मदद करूंगा। आप किसके साथ अपॉइंटमेंट बुक करना चाहते हैं?"

### Telugu:
**User:** "హలో, నాకు అపాయింట్‌మెంట్ బుక్ చేయాలి"
**Agent:** "హలో! నేను మీకు సహాయం చేస్తాను. మీరు ఎవరితో అపాయింట్‌మెంట్ బుక్ చేయాలనుకుంటున్నారు?"

---

## Supported Languages:
1. English 🇬🇧
2. Hindi 🇮🇳
3. Telugu 🇮🇳
4. Tamil 🇮🇳
5. Kannada 🇮🇳
6. Malayalam 🇮🇳
7. Marathi 🇮🇳

---

## Tips for Best Results:

1. **Speak clearly** and at a normal pace
2. **Grant microphone permissions** when prompted
3. **Use Chrome or Edge** for best voice recognition
4. **Wait for the agent** to finish speaking before responding
5. **Be specific** in your requests (dates, times, names)

---

## Data Storage:

All data is stored locally in your browser's localStorage:
- Companies/Hospitals
- Orders
- Vacancies
- Appointments
- Doctors
- Feedback

**Note:** Data persists across sessions but is browser-specific.
