# Step-by-Step Execution Guide for VS Code

## Complete Setup Instructions

### Prerequisites Check
- [ ] Node.js installed (v18+)
- [ ] VS Code installed
- [ ] Project folder open in VS Code

---

## Terminal Commands (Copy & Paste)

### 1. Open Terminal in VS Code
- Press `` Ctrl+` `` (backtick) OR
- Go to `Terminal > New Terminal`

### 2. Verify Current Directory
```bash
pwd
# Should show: C:\Users\prana\OneDrive\Desktop\praneetha
```

If not in the project directory:
```bash
cd C:\Users\prana\OneDrive\Desktop\praneetha
```

### 3. Install Dependencies
```bash
npm install
```

**Expected output:**
```
added XXX packages in XXs
```

### 4. Create Environment File
Create `.env` file in root directory:

**Option A: Using VS Code**
1. Click "New File" icon
2. Name it `.env`
3. Add this line:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Option B: Using Terminal**
```bash
echo VITE_GEMINI_API_KEY=your_actual_api_key_here > .env
```

**⚠️ Important:** Replace `your_actual_api_key_here` with your actual Gemini API key from:
https://makersuite.google.com/app/apikey

### 5. Start Development Server
```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 6. Open in Browser
- Browser should auto-open
- OR manually visit: `http://localhost:3000`

---

## What to Expect

### ✅ Successful Launch
- Browser opens to a dark space-themed page
- "AI Calling Agent" header visible
- Central pulsing magenta "Call Agent" button
- Orbiting feature icons around the button

### ❌ If Errors Occur

**Error: "Cannot find module"**
```bash
npm install
```

**Error: "Port already in use"**
- Change port in `vite.config.js` (line 6: `port: 3001`)
- OR close other applications using port 3000

**Error: "API key not found"**
- Check `.env` file exists
- Verify API key format: `VITE_GEMINI_API_KEY=your_key`
- Restart dev server after creating `.env`

---

## Testing the Application

### Test 1: Voice Interaction
1. Click **"Call Agent"** button
2. Grant microphone permission
3. Say: "Hello" (in any language)
4. Agent should respond

### Test 2: Company Onboarding
1. Click **"Sign Up"** (top right)
2. Fill form:
   - Name: "Test Company"
   - Industry: Select any
   - Logo: 🏢
   - Context: "Test context"
3. Click **"Connect Database"**
4. Company should appear in Portfolio section

### Test 3: Multilingual Support
1. Start voice interaction
2. Speak in Hindi: "नमस्ते"
3. Agent should detect and respond in Hindi

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Stop server
Ctrl + C (in terminal)

# Build for production
npm run build

# Clear cache and reinstall
rm -rf node_modules
npm install
```

---

## Project Structure Overview

```
praneetha/
├── src/
│   ├── components/        # UI components
│   ├── utils/            # Utility functions
│   ├── App.jsx          # Main app
│   └── main.jsx         # Entry point
├── .env                 # API key (create this)
├── package.json         # Dependencies
└── vite.config.js       # Build config
```

---

## Troubleshooting Checklist

- [ ] Node.js version is 18+ (`node -v`)
- [ ] `.env` file exists in root directory
- [ ] API key is correctly formatted in `.env`
- [ ] All dependencies installed (`npm install` completed)
- [ ] No other app using port 3000
- [ ] Browser console shows no errors
- [ ] Microphone permission granted

---

## Next Steps After Setup

1. ✅ Application running at `http://localhost:3000`
2. ✅ Test voice interaction
3. ✅ Add your first company
4. ✅ Explore all features
5. ✅ Deploy company-specific agent

---

## Support Files

- `QUICK_START.md` - Quick reference
- `SETUP_GUIDE.md` - Detailed documentation
- `README.md` - Project overview

---

**Happy Coding! 🚀**

For detailed information, refer to `SETUP_GUIDE.md`