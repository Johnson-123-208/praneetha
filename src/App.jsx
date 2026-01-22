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
import supabaseDB, { isSupabaseInitialized, supabase } from './utils/supabaseClient';
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
    // Check for existing user session
    const checkUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
        }
      }
    };
    checkUser();

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
          ...hospitals
            .filter(h => !h.name?.toLowerCase().includes('apollo'))
            .map(h => ({
              id: h.id,
              name: h.name,
              industry: 'Healthcare',
              logo: '🏥',
              contextSummary: h.tagline || '',
              nlpContext: `Hospital: ${h.name}. Tagline: ${h.tagline}. Emergency: ${h.emergency_24x7 ? 'Yes' : 'No'}. Beds: ${h.total_beds}. Contact: ${h.phone}.`,
              apiLinked: true
            })),
          ...techCompanies
            .filter(c => !['Tech Mahindra', 'Tech Mahindra Limited'].includes(c.name))
            .map(c => ({
              id: c.id,
              name: c.name,
              industry: 'Technology',
              logo: '💻',
              contextSummary: c.tagline || '',
              nlpContext: `Company: ${c.name}. Tagline: ${c.tagline}. CEO: ${c.ceo_name}. Employees: ${c.total_employees}. Headquarters: ${c.headquarters_address}.`,
              apiLinked: true
            })),
          // 6 Specialized Agents (3 Female, 3 Male)
          {
            id: 'aarogya-hospital',
            name: 'Aarogya Multispeciality',
            industry: 'Healthcare',
            logo: '🏥',
            gender: 'female',
            agentId: 'female_1',
            contextSummary: 'Trained on: Medical Staff Registry, Staff Availability Grid, and Consultation Slots.',
            nlpContext: 'Trained on Aarogya Database: Access to care_center_profile (namne, timings), medical_staff_registry (specialists), staff_availability_grid (daily slots), and consultation_slots (real-time booking status).',
            apiLinked: true
          },
          {
            id: 'quickkart-ecommerce',
            name: 'QuickKart store',
            industry: 'E-Commerce',
            logo: '🛒',
            gender: 'female',
            agentId: 'female_2',
            contextSummary: 'Trained on: Product Inventory, Order Intake, Shipping Tracking, and Support Tickets.',
            nlpContext: 'Trained on E-Commerce + Tracking Databases: Access to product_inventory_map (stock/price), order_intake_registry (status tracking), shipment_status_log (real-time logs), support_ticket_registry (issue tracking), and refund_request_log.',
            apiLinked: true
          },
          {
            id: 'voxsphere-biz-solutions',
            name: 'VoxSphere Solutions',
            industry: 'AI & Business',
            logo: '🌐',
            gender: 'female',
            agentId: 'female_3',
            contextSummary: 'Trained on: Service Catalog, Pricing Plan Matrix, and Demo Slot Calendar.',
            nlpContext: 'Trained on Business Solutions Database: Access to biz_profile_core (timings, contact), biz_service_catalog (sector-specific AI tools), pricing_plan_matrix (Starter/Pro/Enterprise plans), and demo_slot_calendar (slot_status tracking).',
            apiLinked: true
          },
          {
            id: 'spice-garden-restaurant',
            name: 'Spice Garden',
            industry: 'Food & Beverage',
            logo: '🍕',
            gender: 'male',
            agentId: 'male_1',
            contextSummary: 'Trained on: Food Catalog, Chef Special Registry, and Seating Slot Grid.',
            nlpContext: 'Trained on Restaurant Database: Access to dinehouse_profile (cuisine), food_catalog_registry (full menu, pricing, veg flags), chef_special_registry (chef recommendations), and seating_slot_grid (table availability).',
            apiLinked: true
          }
          // {
          //   id: 'tech-mahindra-software',
          //   name: 'Tech Mahindra',
          //   industry: 'Software IT',
          //   logo: '🚀',
          //   gender: 'male',
          //   agentId: 'male_2',
          //   contextSummary: 'Trained on: Business Units, Job Openings, Leadership Team, and Office Locations.',
          //   nlpContext: 'Trained on Tech Mahindra Database: Access to business_units (key technologies, head_name), job_openings (skills required, salary range, location), office_locations (city hubs), and leadership_team (executive designations).',
          //   apiLinked: true
          // }
          // {
          //   id: 'agile-it-global',
          //   name: 'Agile IT Global',
          //   industry: 'Technology',
          //   logo: '💻',
          //   gender: 'male',
          //   agentId: 'male_3',
          //   contextSummary: 'Trained on: Cloud Infrastructure, Digital Transformation, and Managed Services.',
          //   nlpContext: 'Trained on Global IT Database: Access to infrastructure_map (cloud nodes), service_catalog (managed services), tech_stack_registry (modern frameworks), and support_incident_log.',
          //   apiLinked: true
          // }
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
    // Default to VoxSphere (Female) if calling from Hero/Header
    const voxSphere = companies.find(c => c.id === 'voxsphere-biz-solutions');
    if (voxSphere) {
      setSelectedCompany(voxSphere);
    }
    setIsVoiceOverlayOpen(true);
  };

  const handleDeployAgent = (company) => {
    setSelectedCompany(company);
    setIsVoiceOverlayOpen(true);
  };

  const handleSignUp = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowDashboard(false);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setShowDashboard(false);
  };

  const handleViewDashboard = () => {
    if (user) {
      setShowDashboard(true);
    } else {
      setIsAuthModalOpen(true);
    }
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
      <Header
        onSignUpClick={handleSignUp}
        user={user}
        onLogout={handleLogout}
        onViewDashboard={handleViewDashboard}
        onNavigateHome={() => setShowDashboard(false)}
      />

      {/* Main Content */}
      <main className="relative z-10">
        {showDashboard && user ? (
          <UserDashboard user={user} onClose={() => setShowDashboard(false)} />
        ) : (
          <>
            {/* Hero Section */}
            <HeroSection onCallAgent={handleCallAgent} />

            {/* Problems and Solutions */}
            <ProblemsAndSolutions />

            {/* Account Portfolio - Only show when logged in */}
            {user && (
              <AccountPortfolio
                onDeployAgent={handleDeployAgent}
                companies={companies}
                loading={loading}
              />
            )}

            {/* Pricing Section */}
            <PricingSection />
          </>
        )}
      </main>

      {/* Voice Overlay */}
      <VoiceOverlay
        isOpen={isVoiceOverlayOpen}
        onClose={() => {
          setIsVoiceOverlayOpen(false);
          setSelectedCompany(null);
        }}
        selectedCompany={selectedCompany}
        user={user}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        mode="signin"
      />

      {/* Company Onboarding Modal */}
      <CompanyOnboarding
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={handleOnboardingSuccess}
      />

      {/* Footer */}
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