# 🎙️ Callix AI - Local High-Performance Setup Guide

This guide will help you run the Callix AI project locally using a **Local AI Stack** (XTTS for voice and Whisper for transcription). This avoids cloud latency and provides a smooth, human-like conversational experience on your hardware.

---

## 🛠️ Prerequisites

1.  **Python 3.10 to 3.12** (Recommended). *Note: Python 3.14 may have compatibility issues with some AI libraries.*
2.  **Node.js 18+**
3.  **RAM**: 16GB (Confirmed on your system)
4.  **GPU**: Intel Iris Xe (Confirmed - scripts are optimized for CPU/Shared Memory)

---

## 🚀 Running the Project (4 Terminals)

### Terminal 1: Frontend (React/Vite)
This is your main user interface.
```bash
# From the root directory:
npm run dev
```

### Terminal 2: CRM Backend (Node.js)
Handles saving appointments, orders, and data.
```bash
cd backend
npm install
node server.js
```

### Terminal 3: Local TTS Server (XTTS v2)
Generates high-quality human voices.
```bash
# Root directory:
pip install coqui-tts fastapi uvicorn torch soundfile python-multipart
python tts_server.py
```
*Note: The first run will download the XTTS v2 model (approx 2GB). Please wait for "✅ Model loaded successfully".*

### Terminal 4: Local STT Server (Whisper)
Transcribes your voice into text.
```bash
# Root directory:
pip install openai-whisper fastapi uvicorn
python stt_server.py
```

---

## ⚙️ Configuration (.env)
Ensure your `.env` file in the root folder looks like this:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_API_URL=http://localhost:5000/api
# Azure keys are optional now, as the code prioritizes local servers
VITE_AZURE_SPEECH_KEY=...
VITE_AZURE_SPEECH_REGION=centralindia
```

---

## 💎 Features of this Setup
- **Conversational AI**: Prompts have been updated to be warm, human-like, and empathetic.
- **Privacy**: Your voice data is processed locally on your machine.
- **Zero Cloud Costs**: STT and TTS are 100% free by running them on your own hardware.
- **Fail-safe**: If local servers aren't running, the system will automatically try to use Azure/Groq cloud services.

---

## 🚑 Troubleshooting
- **"Process cannot access file" error during pip install**: Make sure no other terminal is currently trying to run the Python scripts. Close all terminals and try the `pip install` again.
- **Slow Response**: If the agent takes more than 5 seconds to respond, change the model in `stt_server.py` from `"base"` to `"tiny"`.
- **CORS Errors**: The Python scripts already include CORS fixes, but ensure you are accessing the frontend via `http://localhost:5173`.

**Built for Professional Excellence.**
