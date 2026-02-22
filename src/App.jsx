import { useState, useEffect } from 'react';
import Header from './components/Header';
import BackgroundEffects from './components/BackgroundEffects';
import HeroSection from './components/HeroSection';
import VoiceOverlay from './components/VoiceOverlay';
import CompanyOnboarding from './components/CompanyOnboarding';
import AccountPortfolio from './components/AccountPortfolio';
import ProblemsAndSolutions from './components/ProblemsAndSolutions';
import PricingSection from './components/PricingSection';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import { database } from './utils/database';
import { initializeGroq } from './utils/groq';

function App() {
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // Load API key from environment or localStorage
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    const storedKey = localStorage.getItem('groq_api_key');
    const key = envKey || storedKey || '';

    if (key) {
      setApiKey(key);
      const initialized = initializeGroq(key);
      if (initialized) {
        console.log('✅ Groq AI initialized successfully');
      }
    }

    // Load companies from MongoDB (via backend)
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await database.getCompanies();

      if (data && data.length > 0) {
        // Map to consistent format
        const formattedCompanies = data.map(c => ({
          id: c._id || c.id,
          name: c.name,
          industry: c.industry || 'Technology',
          logo: c.logo || (c.industry === 'Healthcare' ? '🏥' : (c.industry === 'E-Commerce' ? '🛒' : (c.industry?.includes('AI') ? '🌐' : '🏢'))),
          contextSummary: c.context_summary || '',
          nlpContext: c.nlp_context || '',
          apiLinked: true
        }));
        setCompanies(formattedCompanies);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallAgent = () => {
    const voxSphere = companies.find(c => c.name.includes('VoxSphere'));
    if (voxSphere) setSelectedCompany(voxSphere);
    setIsVoiceOverlayOpen(true);
  };

  const handleDeployAgent = (company) => {
    setSelectedCompany(company);
    setIsVoiceOverlayOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowDashboard(false);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowDashboard(false);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <BackgroundEffects />
      <Header
        onSignUpClick={() => setIsAuthModalOpen(true)}
        user={user}
        onLogout={handleLogout}
        onViewDashboard={() => setShowDashboard(true)}
        onNavigateHome={() => setShowDashboard(false)}
      />
      <main className="relative z-10">
        {showDashboard && user ? (
          <UserDashboard user={user} onClose={() => setShowDashboard(false)} />
        ) : (
          <>
            <HeroSection onCallAgent={handleCallAgent} />
            <ProblemsAndSolutions />
            <AccountPortfolio
              onDeployAgent={handleDeployAgent}
              companies={companies}
              loading={loading}
              isLoggedIn={!!user}
              onLoginRequired={() => setIsAuthModalOpen(true)}
              onAddCompany={() => setIsOnboardingOpen(true)}
            />
            <PricingSection />
          </>
        )}
      </main>
      <VoiceOverlay
        isOpen={isVoiceOverlayOpen}
        onClose={() => {
          setIsVoiceOverlayOpen(false);
          setSelectedCompany(null);
        }}
        selectedCompany={selectedCompany}
        user={user}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        mode="signin"
      />
      <CompanyOnboarding
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => loadCompanies()}
      />
      <footer className="relative z-10 py-12 px-4 border-t border-white/10 bg-[#000]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm font-medium">
            © {new Date().getFullYear()} Callix. All rights reserved.
          </p>
          <p className="text-white/40 text-[10px] mt-2 tracking-wider">
            Powered by Praneetha and Team.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;