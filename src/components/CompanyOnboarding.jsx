import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Key, FileText, Briefcase, Globe, Loader } from 'lucide-react';
import { database } from '../utils/database.js';
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

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'E-commerce',
    'Retail', 'Manufacturing', 'Education', 'Real Estate',
    'Food & Beverage', 'Transportation', 'Other'
  ];


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save company to MongoDB via backend
      const company = await database.saveCompany({
        ...formData,
        logo: formData.industry === 'Healthcare' ? '🏥' : '🏢',
        nlp_context: formData.contextSummary,
        context_summary: formData.contextSummary
      });

      const companyId = company._id || company.id;

      // Add sample vacancies for companies (non-healthcare)
      if (formData.industry !== 'Healthcare') {
        const sampleVacancies = [
          { position: 'Software Engineer', department: 'Engineering', status: 'open', description: 'Full-stack developer with 3+ years experience' },
          { position: 'Product Manager', department: 'Product', status: 'open', description: 'Lead product development initiatives' },
          { position: 'Marketing Specialist', department: 'Marketing', status: 'open', description: 'Digital marketing and content creation' },
        ];

        for (const vacancy of sampleVacancies) {
          await database.saveVacancy({
            ...vacancy,
            company_id: companyId,
          });
        }
      }

      // Add sample doctors for hospitals/healthcare
      if (formData.industry === 'Healthcare') {
        const sampleDoctors = [
          { name: 'Dr. Sarah Johnson', specialization: 'Cardiology', experience: '15 years', available: true },
          { name: 'Dr. Michael Chen', specialization: 'Pediatrics', experience: '10 years', available: true },
          { name: 'Dr. Priya Patel', specialization: 'Dermatology', experience: '8 years', available: true },
        ];

        for (const doctor of sampleDoctors) {
          await database.saveDoctor({
            ...doctor,
            hospital_id: companyId,
          });
        }
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
            className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">
                  Connect Database
                </h2>
                <p className="text-slate-400 mt-1">Train your AI agent on your company data</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-400 mb-2">
                    <Building2 size={16} />
                    <span>COMPANY NAME</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-blue-500 focus:outline-none text-white"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-400 mb-2">
                    <Briefcase size={16} />
                    <span>INDUSTRY</span>
                  </label>
                  <select
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-blue-500 focus:outline-none text-white"
                  >
                    <option value="">Select Category</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-400 mb-2">
                  <Key size={16} />
                  <span>SECURE API KEY</span>
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-blue-500 focus:outline-none text-white"
                  placeholder="Your database connection key"
                />
              </div>

              {/* NLP Context Summary */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-400 mb-2">
                  <FileText size={16} />
                  <span>AI TRAINING CONTEXT</span>
                </label>
                <textarea
                  required
                  value={formData.contextSummary}
                  onChange={(e) => setFormData({ ...formData, contextSummary: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-blue-500 focus:outline-none text-white resize-none"
                  placeholder="Tell the AI what it should know about your business, products, and services..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompanyOnboarding;