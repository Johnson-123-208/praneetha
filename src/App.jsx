import { useState, useEffect } from 'react';
import Header from './components/Header';
import BackgroundEffects from './components/BackgroundEffects';
import HeroSection from './components/HeroSection';
import VoiceOverlay from './components/VoiceOverlay';
import CompanyOnboarding from './components/CompanyOnboarding';
import AccountPortfolio from './components/AccountPortfolio';
import OperationsLog from './components/OperationsLog';
import PricingSection from './components/PricingSection';

function App() {
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Load API key from environment or localStorage
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    const storedKey = localStorage.getItem('groq_api_key');
    const key = envKey || storedKey || '';

    if (key) {
      setApiKey(key);
    }
  }, []);

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
    // Refresh portfolio
    window.location.hash = '#portfolio';
  };

  return (
    <div className="min-h-screen bg-deep-navy relative overflow-x-hidden">
      {/* Background Effects */}
      <BackgroundEffects />

      {/* Header */}
      <Header onSignUpClick={handleSignUp} />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection onCallAgent={handleCallAgent} />

        {/* Account Portfolio */}
        <AccountPortfolio onDeployAgent={handleDeployAgent} />

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
      />

      {/* Company Onboarding Modal */}
      <CompanyOnboarding
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={handleOnboardingSuccess}
      />

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} AI Calling Agent. All rights reserved.
          </p>
          <p className="text-white/40 text-xs mt-2">
            Powered by Groq API & Advanced Voice Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;