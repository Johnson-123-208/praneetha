import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Building2, CheckCircle } from 'lucide-react';
import { database } from '../utils/database.js';

const AccountPortfolio = ({ onDeployAgent }) => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadCompanies();
    
    // Refresh every 2 seconds
    const interval = setInterval(loadCompanies, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadCompanies = () => {
    const companyList = database.getCompanies();
    setCompanies(companyList);
  };

  const handleDeploy = (company) => {
    if (onDeployAgent) {
      onDeployAgent(company);
    }
  };

  return (
    <section id="portfolio" className="py-20 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-cyan">
            Account Portfolio
          </h2>
          <p className="text-white/60 text-lg">
            Manage your connected companies and deploy AI agents
          </p>
        </motion.div>

        {companies.length === 0 ? (
          <motion.div
            className="text-center py-12 glass rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Building2 size={64} className="mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No companies connected yet.</p>
            <p className="text-white/40 text-sm mt-2">
              Connect your first company database to get started.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                className="glass-strong rounded-xl p-6 hover:border-electric-cyan/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{company.logo || '🏢'}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{company.name}</h3>
                      <p className="text-sm text-white/60">{company.industry}</p>
                    </div>
                  </div>
                  {company.apiLinked && (
                    <div className="flex items-center space-x-1 text-electric-cyan">
                      <CheckCircle size={16} />
                      <span className="text-xs font-medium">API Linked</span>
                    </div>
                  )}
                </div>

                {company.contextSummary && (
                  <p className="text-sm text-white/70 mb-4 line-clamp-2">
                    {company.contextSummary}
                  </p>
                )}

                <motion.button
                  onClick={() => handleDeploy(company)}
                  className="w-full px-4 py-3 rounded-lg bg-electric-cyan text-deep-navy font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Rocket size={18} />
                  <span>Deploy Agent</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AccountPortfolio;