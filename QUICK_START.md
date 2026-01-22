# Quick Start Guide - AI Calling Agent

## 🚀 Fast Setup (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Add Your API Key
Create a `.env` file in the root directory:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### Step 3: Run the Application
```bash
npm run dev
```

The app will open at `http://localhost:3000`

---

## 🎯 What You'll See

1. **Hero Section** - Central "Call Agent" button with orbiting feature icons
2. **Account Portfolio** - Manage connected companies
3. **Pricing Section** - View pricing plans
4. **Operations Log** - Real-time order tracking

---

## 🎤 Using Voice Interaction

1. Click **"Call Agent"** button (magenta pulsing button)
2. Grant microphone permission
3. Start speaking in any supported language:
   - English (default)
   - Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi
4. The agent will detect your language and respond accordingly

---

## 🏢 Adding Your First Company

1. Click **"Sign Up"** button (top right)
2. Fill in company details
3. Click **"Connect Database"**
4. Your company will appear in the Portfolio section

---

## 📋 VS Code Terminal Commands

Open VS Code terminal (`` Ctrl+` `` or `View > Terminal`):

```bash
# Navigate to project directory
cd C:\Users\prana\OneDrive\Desktop\praneetha

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## ⚠️ Common Issues & Solutions

### "Module not found" error
```bash
npm install
```

### API key not working
- Check `.env` file exists in root directory
- Restart dev server after adding API key
- Format: `VITE_GEMINI_API_KEY=your_key_here`

### Microphone not working
- Grant permissions in browser
- Use Chrome/Edge (best support)
- Ensure you're on `localhost` or HTTPS

### Port already in use
Change port in `vite.config.js`:
```js
server: {
  port: 3001,  // Change to any available port
}
```

---

## 📁 Important Files

- `.env` - Your API key (create this)
- `src/App.jsx` - Main application
- `src/components/VoiceOverlay.jsx` - Voice interaction
- `src/utils/gemini.js` - Gemini API integration
- `src/utils/database.js` - Data storage (localStorage)

---

## 🎨 Features

✅ Multilingual support (7 languages)  
✅ Real-time voice interaction  
✅ Company-specific agents  
✅ Order tracking  
✅ Glassmorphism UI with animations  
✅ Responsive design  

---

## 📚 Full Documentation

See `SETUP_GUIDE.md` for detailed instructions.

---

**Ready to go? Run `npm run dev` and start exploring!** 🚀