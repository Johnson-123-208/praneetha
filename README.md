**Callix** is a state-of-the-art AI-powered autonomous calling assistant. It functions as a professional digital receptionist that can handle natural voice conversations in multiple languages, manage business operations (bookings, orders, hiring), and synchronize data in real-time with a cloud database.

---

## Demo Highlights

1. **Hospital Mode**: Schedule appointments with specialized doctors (Cardiology, Neurology) with exact fee knowledge.
2. **Restaurant Mode**: Reserve tables and explore multi-cuisine menus with real-time pricing.
3. **E-Commerce Mode**: Track orders and purchase high-end electronics via voice.
4. **Corporate Mode**: Automate recruitment by screening candidates and scheduling interviews.

---

## The Tech Stack (The "Magic" Behind Callix)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **LLM (The Brain)** | **Groq AI (Llama-3)** | Lightning-fast conversational logic (< 200ms). |
| **STT (The Ears)** | **Deepgram Nova-3** | Near-instant voice-to-text in native scripts. |
| **TTS (The Voice)** | **Custom TTS + WebSpeech** | Professional, warm female voice interactions. |
| **Database** | **MongoDB Atlas** | Cloud-synced business data & logs. |
| **Frontend** | **React + Framer Motion** | Premium, high-density dashboard UI. |
| **Backend** | **Node.js + Express** | Secure API with Vercel deployment support. |

---

## How to Run (Direct Demo)

### 1. Backend API (The Motor)
- `cd backend`
- `npm install`
- `npm run dev`
- *Confirmed*: Cloud MongoDB connection is active via `.env`.

### 2. Frontend App (The Face)
- Open root folder
- `npm install --legacy-peer-deps`
- `npm run dev`
- *Link*: [http://localhost:5173](http://localhost:5173)

---

## � Architecture Overview

- **`src/prompts/agentPrompts.js`**: Contains the complex system personas for different industries.
- **`src/components/VoiceOverlay.jsx`**: The main voice engine handling STT, TTS, and AI logic.
- **`src/utils/database.js`**: Managed synchronization between local storage and cloud MongoDB.
- **`backend/server.js`**: Central API handling business logic and transactions.

---
