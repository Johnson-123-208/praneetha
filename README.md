# AI Calling Agent - Voice Intelligence Platform

A high-end, futuristic SaaS platform for an AI Calling Agent with real-time voice interaction powered by Gemini Live API.

## Features

- **Multilingual Voice Intelligence**: Supports English, Hindi, Telugu, Tamil, Kannada, Malayalam, and Marathi
- **Real-time Voice Interaction**: Powered by Gemini Live API with adaptive language switching
- **General Question Answering**: Answer any general questions using AI knowledge base
- **Database Operations**: 
  - Check job vacancies and positions
  - Book appointments with doctors, CEOs, executives
  - Collect feedback and ratings
  - Query company/hospital databases
- **Company Onboarding**: Connect company databases via API integration with automatic sample data
- **Account Portfolio**: Manage multiple company accounts and deploy agents
- **Operations Log**: Track voice-booked orders, appointments, and operations in real-time
- **Dark Space Aesthetic**: Glassmorphism design with fluid animations

## Technology Stack

- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Lucide Icons
- Google Generative AI (Gemini Live API)

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Usage

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key to your `.env` file
3. Start the dev server and access the application at `http://localhost:3000`
4. Click "Call Agent" to start a voice interaction
5. The agent will detect your language and respond accordingly

## Project Structure

```
src/
  components/
    Header.jsx
    HeroSection.jsx
    VoiceOverlay.jsx
    CompanyOnboarding.jsx
    AccountPortfolio.jsx
    OperationsLog.jsx
    PricingSection.jsx
    BackgroundEffects.jsx
  utils/
    gemini.js
    audio.js
    database.js
    languageDetection.js
  styles/
    index.css
  App.jsx
  main.jsx
```

## License

MIT