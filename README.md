# Callix AI - Professional Multi-lingual Calling Assistant

Callix is a state-of-the-art AI-powered calling assistant designed for businesses. It provides high-quality, human-like voice interactions in **English, Telugu, and Hindi**, enabling automated appointment booking, order tracking, and feedback collection.

## 🚀 Live Demo
- **Frontend**: [Vercel Deployment URL]
- **Backend API**: [Render Deployment URL]

---

## 🛠️ Advanced Technology Stack

### 1. 🎙️ Text-to-Speech (TTS): Azure AI Speech
We use **Azure Neural Voices** for crystal-clear, professional output.
- **Telugu**: `te-IN-ShrutiNeural`
- **Hindi**: `hi-IN-SwaraNeural`
- **English**: `en-IN-NeerjaNeural`
- **Fallback**: Intelligent browser-based TTS with gender filtering.

### 🎤 2. Speech-to-Text (STT): Deepgram
Powered by the **Nova-3** model, providing sub-second transcription accuracy for conversational AI.
- **Smart Formatting**: Handles punctuation and filler words (`uhm`, `ah`) intelligently.
- **VAD (Voice Activity Detection)**: Custom logic to detect silence and process speech chunks only when the user is finished talking.

### 🧠 3. AI Reasoning: Groq (Llama-3.3-70B)
Utilitzing the **Llama-3.3-70B Versatile** model for ultra-fast, intelligent decision-making.
- **Context-Aware**: Understands specific industry context (Healthcare, Dining, E-Commerce, IT).
- **Tool Use**: Automatically detects when to book an appointment, place an order, or save feedback.

### 💾 4. Persistence & Dashboard: MongoDB + Render
A robust Node.js/Express backend handles all CRM integrations.
- **Deployment**: Permanently hosted on **Render.com**.
- **Database**: **MongoDB Atlas** for scalable record storage.
- **Real-time Dashboard**: Track all AI interactions, appointments, and feedback in a premium UI.

---

## 📱 Mobile Responsiveness
The application is fully optimized for mobile devices:
- **Responsive Layout**: Adapts from desktop rows to mobile stacks seamlessly.
- **Touch-Friendly**: Large, accessible controls for muting and hanging up.
- **Adaptive UI**: Optimized agent avatars and waveform indicators for small screens.

---

## 🛡️ Reliability Features
- **Deduplication Engine**: Built-in 10-second window to prevent duplicate database entries from speech glitches.
- **Privacy First**: `.env` protection and secure API handling.
- **Hybrid Sync**: Automatically falls back to LocalStorage if the backend is temporarily unreachable, ensuring no data loss.

---

## 🛠️ Local Setup Instructions

### 1. Clone & Install
```bash
git clone <repository-url>
npm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the root with:
```env
VITE_GROQ_API_KEY=your_groq_key
VITE_AZURE_SPEECH_KEY=your_azure_key
VITE_AZURE_SPEECH_REGION=centralindia
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Services
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
npm install
node server.js
```

---

## 🏢 Business Modules Included
1. **Hospital**: Dr. Appointment & Specialist queries.
2. **Spice Garden**: Table reservations & Menu recommendations.
3. **E-Commerce**: Product pricing & Order tracking.
4. **IT Solutions**: Career queries & Interview scheduling.

---

**Built with ❤️ for Professional AI Excellence.**
