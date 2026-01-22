import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Key, FileText, Briefcase, Globe, Loader } from 'lucide-react';
import { database } from '../utils/database.js';
import { scrapeWebsiteData, formatForCompanyOnboarding, enhanceDataWithAI } from '../utils/webscraper.js';
import { chatWithGroq } from '../utils/groq.js';

const CompanyOnboarding = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contextSummary: '',
    apiKey: '',
    websiteUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);
  const [scrapingError, setScrapingError] = useState(null);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'E-commerce',
    'Retail', 'Manufacturing', 'Education', 'Real Estate',
    'Food & Beverage', 'Transportation', 'Other'
  ];

  const handleScrapeWebsite = async () => {
    if (!formData.websiteUrl) {
      setScrapingError('Please enter a website URL');
      return;
    }

    setIsScrapingWebsite(true);
    setScrapingError(null);

    try {
      // Scrape website data
      const scrapedData = await scrapeWebsiteData(formData.websiteUrl);

      if (!scrapedData.success) {
        throw new Error(scrapedData.error || 'Failed to scrape website');
      }

      // Format data for company onboarding
      const formattedData = formatForCompanyOnboarding(scrapedData);

      // Enhance with AI if Groq is available
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      let enhancedData = formattedData;

      if (apiKey) {
        try {
          enhancedData = await enhanceDataWithAI(scrapedData, chatWithGroq);
        } catch (aiError) {
          console.warn('AI enhancement failed, using basic scraped data:', aiError);
        }
      }

      // Update form with scraped data
      setFormData({
        ...formData,
        name: enhancedData.name || formData.name,
        industry: enhancedData.industry || formData.industry,
        contextSummary: enhancedData.contextSummary || enhancedData.nlpContext || formData.contextSummary,
      });

      alert('Website data extracted successfully! Please review and submit.');
    } catch (error) {
      console.error('Error scraping website:', error);
      setScrapingError(error.message || 'Failed to scrape website. Please enter data manually.');
    } finally {
      setIsScrapingWebsite(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const company = database.saveCompany({
        ...formData,
        logo: formData.industry === 'Healthcare' ? '🏥' : '🏢', // Default logo based on industry
        nlpContext: formData.contextSummary,
      });

      // Add sample vacancies for companies (non-healthcare)
      if (formData.industry !== 'Healthcare') {
        const sampleVacancies = [
          { position: 'Software Engineer', department: 'Engineering', status: 'open', description: 'Full-stack developer with 3+ years experience' },
          { position: 'Product Manager', department: 'Product', status: 'open', description: 'Lead product development initiatives' },
          { position: 'Marketing Specialist', department: 'Marketing', status: 'open', description: 'Digital marketing and content creation' },
          { position: 'Sales Executive', department: 'Sales', status: 'open', description: 'B2B sales with client relationship management' },
          { position: 'Customer Support', department: 'Support', status: 'open', description: 'Customer service and technical support' },
        ];

        sampleVacancies.forEach(vacancy => {
          database.saveVacancy({
            ...vacancy,
            companyId: company.id,
          });
        });
      }

      // Add sample doctors for hospitals/healthcare
      if (formData.industry === 'Healthcare') {
        const sampleDoctors = [
          { name: 'Dr. Sarah Johnson', specialization: 'Cardiology', experience: '15 years', available: true },
          { name: 'Dr. Michael Chen', specialization: 'Pediatrics', experience: '10 years', available: true },
          { name: 'Dr. Priya Patel', specialization: 'Dermatology', experience: '8 years', available: true },
          { name: 'Dr. Robert Williams', specialization: 'Orthopedics', experience: '12 years', available: true },
          { name: 'Dr. Emily Davis', specialization: 'Gynecology', experience: '9 years', available: true },
        ];

        sampleDoctors.forEach(doctor => {
          database.saveDoctor({
            ...doctor,
            hospitalId: company.id,
          });
        });
      }

      onSuccess(company);

      // Reset form
      setFormData({
        name: '',
        industry: '',
        contextSummary: '',
        apiKey: '',
        websiteUrl: '',
      });

      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Failed to save company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gradient-magenta">
                Connect Company Database
              </h2>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-white/80 mb-2">
                  <Building2 size={16} />
                  <span>Company Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-electric-cyan focus:outline-none text-white placeholder-white/40"
                  placeholder="Enter company name"
                />
              </div>

              {/* Website URL (Optional - for auto-scraping) */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-white/80 mb-2">
                  <Globe size={16} />
                  <span>Website URL (Optional - Auto-fill data)</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-lg glass border border-white/10 focus:border-electric-cyan focus:outline-none text-white placeholder-white/40"
                    placeholder="https://example.com"
                  />
                  <motion.button
                    type="button"
                    onClick={handleScrapeWebsite}
                    disabled={isScrapingWebsite || !formData.websiteUrl}
                    className="px-4 py-3 rounded-lg bg-vibrant-magenta text-white font-semibold glow-magenta hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isScrapingWebsite ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span>Scraping...</span>
                      </>
                    ) : (
                      <span>Auto-fill</span>
                    )}
                  </motion.button>
                </div>
                {scrapingError && (
                  <p className="text-sm text-vibrant-magenta mt-2">{scrapingError}</p>
                )}
                <p className="text-xs text-white/40 mt-1">
                  Enter a website URL to automatically extract company information
                </p>
              </div>

              {/* Industry */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-white/80 mb-2">
                  <Briefcase size={16} />
                  <span>Industry</span>
                </label>
                <select
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-electric-cyan focus:outline-none text-white bg-transparent"
                >
                  <option value="" className="bg-deep-navy">Select industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry} className="bg-deep-navy">
                      {industry}
                    </option>
                  ))}
                </select>
              </div>



              {/* NLP Context Summary */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-white/80 mb-2">
                  <FileText size={16} />
                  <span>NLP Context Summary</span>
                </label>
                <textarea
                  required
                  value={formData.contextSummary}
                  onChange={(e) => setFormData({ ...formData, contextSummary: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-electric-cyan focus:outline-none text-white placeholder-white/40 resize-none"
                  placeholder="Describe the company's products, services, and key information that the AI agent should know..."
                />
              </div>

              {/* API Key */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-white/80 mb-2">
                  <Key size={16} />
                  <span>Secure API Key</span>
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg glass border border-white/10 focus:border-electric-cyan focus:outline-none text-white placeholder-white/40"
                  placeholder="Enter API key for database access"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-lg glass border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-lg bg-electric-cyan text-deep-navy font-semibold glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Database'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompanyOnboarding;