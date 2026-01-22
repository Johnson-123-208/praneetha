import { useState, useEffect } from 'react';
import Header from './components/Header';
import BackgroundEffects from './components/BackgroundEffects';
import HeroSection from './components/HeroSection';
import VoiceOverlay from './components/VoiceOverlay';
import CompanyOnboarding from './components/CompanyOnboarding';
import AccountPortfolio from './components/AccountPortfolio';
import OperationsLog from './components/OperationsLog';
import PricingSection from './components/PricingSection';
import supabaseDB, { isSupabaseInitialized } from './utils/supabaseClient';
import { initializeGroq } from './utils/groq';

function App() {
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en-US', name: 'English', voice: 'Google US English' });
  const [apiKey, setApiKey] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load API key from environment or localStorage
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    const storedKey = localStorage.getItem('groq_api_key');
    const key = envKey || storedKey || '';

    if (key) {
      setApiKey(key);
      // Initialize Groq with the API key
      const initialized = initializeGroq(key);
      if (initialized) {
        console.log('✅ Groq AI initialized successfully');
      } else {
        console.warn('⚠️ Failed to initialize Groq AI');
      }
    } else {
      console.warn('⚠️ No Groq API key found - AI responses will use fallback mode');
    }

    // Load companies from Supabase
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      if (isSupabaseInitialized()) {
        // Try to fetch from Supabase
        const [hospitals, techCompanies] = await Promise.all([
          supabaseDB.getHospitals().catch(() => []),
          supabaseDB.getCompanies().catch(() => [])
        ]);

        // Combine and format
        const allCompanies = [
          ...hospitals.map(h => ({
            id: h.id,
            name: h.name,
            industry: 'Healthcare',
            logo: '🏥',
            contextSummary: h.tagline || '',
            nlpContext: `${h.name}. ${h.tagline || ''}. Total beds: ${h.total_beds}. ICU beds: ${h.icu_beds}. Contact: ${h.phone}, ${h.email}`,
            apiLinked: true
          })),
          ...techCompanies.map(c => ({
            id: c.id,
            name: c.name,
            industry: 'Technology',
            logo: '💻',
            contextSummary: c.tagline || '',
            nlpContext: `${c.name}. ${c.tagline || ''}. Founded: ${c.founded_year}. CEO: ${c.ceo_name}. Employees: ${c.total_employees}. Contact: ${c.careers_email}`,
            apiLinked: true
          }))
        ];

        setCompanies(allCompanies);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('companies');
        if (stored) {
          setCompanies(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('companies');
      if (stored) {
        setCompanies(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCallAgent = () => {
    setIsVoiceOverlayOpen(true);
  };

  const handleDeployAgent = (company) => {
    setSelectedCompany(company);
    setIsVoiceOverlayOpen(true);
  };

  const handleSignUp = () => {
    setIsOnboardingOpen(true);
  };

  const handleOnboardingSuccess = (company) => {
    console.log('Company onboarded:', company);
    // Reload companies
    loadCompanies();
    // Scroll to portfolio
    window.location.hash = '#portfolio';
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      {/* Background Effects */}
      <BackgroundEffects />

      {/* Header */}
      <Header onSignUpClick={handleSignUp} />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection onCallAgent={handleCallAgent} />

        {/* Account Portfolio */}
        <AccountPortfolio
          onDeployAgent={handleDeployAgent}
          companies={companies}
          loading={loading}
        />

        {/* Pricing Section */}
        <PricingSection />

        {/* Operations Log */}
        <OperationsLog />
      </main>

      {/* Voice Overlay */}
      <VoiceOverlay
        isOpen={isVoiceOverlayOpen}
        onClose={() => {
          setIsVoiceOverlayOpen(false);
          setSelectedCompany(null);
        }}
        selectedCompany={selectedCompany}
        selectedLanguage={selectedLanguage}
      />

      {/* Company Onboarding Modal */}
      <CompanyOnboarding
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={handleOnboardingSuccess}
      />

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-gray text-sm font-medium">
            © {new Date().getFullYear()} AI Calling Agent. All rights reserved.
          </p>
          <p className="text-text-light text-xs mt-2">
            Powered by Groq API & Advanced Voice Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;