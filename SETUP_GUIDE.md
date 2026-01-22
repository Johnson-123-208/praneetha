# AI Calling Agent - Setup Guide

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js) or **yarn**
3. **VS Code** or any code editor
4. **Git** (optional)

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required dependencies:
- React 19
- Vite (build tool)
- Tailwind CSS
- Framer Motion
- Lucide Icons
- @google/generative-ai (Gemini API)

## Step 2: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory (same level as `package.json`)

2. Add your Gemini API key:

```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Replace `your_actual_api_key_here` with your actual API key from Step 2.

## Step 4: Start the Development Server

Run the following command in your terminal:

```bash
npm run dev
```

The application will start on `http://localhost:3000`

You should see output similar to:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 5: Open in Browser

1. The browser should automatically open
2. If not, navigate to `http://localhost:3000` manually

## Project Structure

```
ai-calling-agent/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx
│   │   ├── HeroSection.jsx
│   │   ├── VoiceOverlay.jsx
│   │   ├── CompanyOnboarding.jsx
│   │   ├── AccountPortfolio.jsx
│   │   ├── OperationsLog.jsx
│   │   ├── PricingSection.jsx
│   │   └── BackgroundEffects.jsx
│   ├── utils/               # Utility functions
│   │   ├── gemini.js        # Gemini API integration
│   │   ├── audio.js         # Audio processing
│   │   ├── database.js      # Mock database (localStorage)
│   │   └── languageDetection.js
│   ├── styles/
│   │   └── index.css        # Global styles
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env                      # Your API key (create this)
```

## Usage Instructions

### 1. Start Voice Interaction

- Click the **"Call Agent"** button in the hero section
- Or click **"Start Voice Interaction"** button
- Grant microphone permissions when prompted

### 2. Multilingual Support

The agent supports 7 languages:
- English (default)
- Hindi (हिंदी)
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം)
- Marathi (मराठी)

**Language Protocol:**
- Agent always starts in English
- Detects when you switch to another language
- Automatically adapts its responses to your language

### 3. Company Onboarding

1. Click **"Sign Up"** in the header
2. Fill in company details:
   - Company Name
   - Industry
   - Logo (Emoji)
   - NLP Context Summary
   - API Key (optional)
3. Click **"Connect Database"**

### 4. Deploy Company-Specific Agent

1. Navigate to **"Portfolio"** section
2. Find your company card
3. Click **"Deploy Agent"**
4. The agent will use your company's context

### 5. View Operations Log

- Navigate to **"Operations"** section
- View all voice-booked orders in real-time
- Each order shows:
  - Unique Order ID
  - Item and Quantity
  - Timestamp
  - Associated Company

## Troubleshooting

### Issue: API Key Not Working

**Solution:**
1. Ensure `.env` file is in the root directory
2. Restart the dev server after adding API key
3. Check that the key starts with `VITE_GEMINI_API_KEY=`
4. Verify your API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Issue: Microphone Not Accessing

**Solution:**
1. Grant microphone permissions in browser
2. Use HTTPS or localhost (required for microphone access)
3. Check browser console for errors

### Issue: Voice Recognition Not Working

**Solution:**
- The app uses Web Speech API which works in:
  - Chrome/Edge (recommended)
  - Safari (limited support)
- Firefox may have limited support

### Issue: Build Errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Browser Compatibility

- **Chrome/Edge** - Full support (recommended)
- **Firefox** - Most features work
- **Safari** - Limited voice recognition
- **Mobile browsers** - Responsive design supported

## Production Build

To create a production build:

```bash
npm run build
```

The build output will be in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

## Features Overview

✅ **Multilingual Voice Intelligence** - 7 languages supported  
✅ **Real-time Voice Interaction** - Powered by Gemini Live API  
✅ **Company Onboarding** - Connect company databases via API  
✅ **Account Portfolio** - Manage multiple company accounts  
✅ **Operations Log** - Track voice-booked orders in real-time  
✅ **Dark Space Aesthetic** - Glassmorphism design with animations  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify all dependencies are installed correctly
4. Ensure your API key is valid

## Next Steps

1. ✅ Install dependencies
2. ✅ Add API key to `.env`
3. ✅ Start dev server
4. ✅ Test voice interaction
5. ✅ Add your first company
6. ✅ Deploy a company-specific agent

Enjoy building with AI Calling Agent! 🚀