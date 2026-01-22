import { motion } from 'framer-motion';
import { Rocket, Building2, CheckCircle, Loader } from 'lucide-react';

const AccountPortfolio = ({ onDeployAgent, companies = [], loading = false }) => {
  const handleDeploy = (company) => {
    if (onDeployAgent) {
      onDeployAgent(company);
    }
  };

  // Colorful gradient classes for cards
  const cardGradients = [
    'bg-gradient-purple',
    'bg-gradient-pink',
    'bg-gradient-blue',
    'bg-gradient-orange',
    'bg-gradient-green',
    'bg-gradient-peach',
  ];

  return (
    <section id="portfolio" className="py-24 px-4 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-6xl md:text-7xl font-black mb-6 text-gradient-purple">
            Account Portfolio
          </h2>
          <p className="text-text-gray text-xl max-w-3xl mx-auto leading-relaxed">
            Manage your connected companies and deploy AI agents instantly
          </p>
        </motion.div>

        {loading ? (
          <motion.div
            className="text-center py-20 bg-white rounded-3xl shadow-premium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader size={72} className="mx-auto mb-6 text-purple-primary animate-spin" />
            <p className="text-text-gray text-xl font-semibold">Loading companies...</p>
          </motion.div>
        ) : companies.length === 0 ? (
          <motion.div
            className="text-center py-20 bg-white rounded-3xl shadow-premium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Building2 size={72} className="mx-auto mb-6 text-text-light" />
            <p className="text-text-dark text-2xl font-bold mb-3">No companies connected yet</p>
            <p className="text-text-gray text-lg">
              Connect your first company database to get started
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                className={`${cardGradients[index % cardGradients.length]} rounded-3xl p-8 text-white card-hover shadow-premium-lg relative overflow-hidden`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-6xl transform hover:scale-110 transition-transform duration-300">
                        {company.logo || '🏢'}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">
                          {company.name}
                        </h3>
                        <p className="text-white/80 text-sm font-medium">
                          {company.industry}
                        </p>
                      </div>
                    </div>
                    {company.apiLinked && (
                      <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold">
                        <CheckCircle size={14} />
                        <span>Live</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {company.contextSummary && (
                    <p className="text-white/90 text-sm mb-8 line-clamp-3 leading-relaxed">
                      {company.contextSummary}
                    </p>
                  )}

                  {/* Deploy Button */}
                  <motion.button
                    onClick={() => handleDeploy(company)}
                    className="w-full px-6 py-4 rounded-2xl bg-white text-purple-primary font-bold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Rocket size={22} />
                    <span>Deploy AI Agent</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AccountPortfolio;