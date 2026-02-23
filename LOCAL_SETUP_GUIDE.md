# 🚀 Callix AI - Production Stack Guide

This project is configured as a high-performance, cloud-first AI Agent.

## 🛠️ The Tech Stack

1.  **STT (Speech-to-Text)**: [Deepgram Nova-3](https://deepgram.com/)
    *   *Why?* Indentified as the fastest and most accurate for conversational AI.
2.  **TTS (Text-to-Speech)**: [Azure AI Neural Speech](https://azure.microsoft.com/en-us/products/ai-services/ai-speech)
    *   *Voices:* Shruti (Telugu), Swara (Hindi), Neerja (English).
3.  **LLM (Text Generation)**: [Groq Llama-3](https://groq.com/)
    *   *Why?* Lowest latency inference for snappy agent responses.
4.  **Database**: [MongoDB](https://www.mongodb.com/)
    *   Used for storing companies, orders, appointments, and feedback.

---

## 🚦 How to Run

### 1. Backend (Node.js + MongoDB)
Ensure you have a `MONGODB_URI` in your `backend/.env`.
```bash
cd backend
npm install
node server.js
```

### 2. Frontend (React)
Ensure your `.env` has the correct Deepgram, Azure, and Groq keys.
```bash
npm install
npm run dev
```

---

## 🔑 Required Environment Variables (.env)
```env
VITE_GROQ_API_KEY=gsk_...
VITE_DEEPGRAM_API_KEY=...
VITE_AZURE_SPEECH_KEY=...
VITE_AZURE_SPEECH_REGION=centralindia
VITE_API_URL=http://localhost:5000/api
```

*Note: All local Python-based fallback servers (XTTS/Whisper) have been removed to keep the codebase clean and fast.*
