import { motion } from 'framer-motion';
import { Rocket, Building2, CheckCircle, Loader } from 'lucide-react';

const AccountPortfolio = ({ onDeployAgent, companies = [], loading = false }) => {
  const handleDeploy = (company) => {
    if (onDeployAgent) {
      onDeployAgent(company);
    }
  };



  return (
    <section id="portfolio" className="py-12 px-4 relative z-10 bg-sky-200">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-slate-800">
            Account Portfolio
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Manage your connected companies and deploy AI agents instantly
          </p>
        </motion.div>

        {loading ? (
          <motion.div
            className="text-center py-12 bg-white rounded-2xl shadow-lg border border-sky-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader size={48} className="mx-auto mb-4 text-sky-500 animate-spin" />
            <p className="text-slate-600 font-semibold">Loading companies...</p>
          </motion.div>
        ) : companies.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-2xl shadow-lg border border-sky-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Building2 size={48} className="mx-auto mb-4 text-sky-300" />
            <p className="text-slate-800 text-xl font-bold mb-2">No companies connected yet</p>
            <p className="text-slate-500">
              Connect your first company database to get started
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300 bg-sky-50 p-3 rounded-xl">
                      {company.logo || '🏢'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 leading-tight">
                        {company.name}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium">
                        {company.industry}
                      </p>
                    </div>
                  </div>
                  {company.apiLinked && (
                    <div className="flex items-center space-x-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                      <CheckCircle size={12} />
                      <span>Live</span>
                    </div>
                  )}
                </div>

                <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Training Context</p>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {company.contextSummary || 'Standard AI processing engine'}
                  </p>
                </div>



                <motion.button
                  onClick={() => handleDeploy(company)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg group-hover:bg-sky-600 transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Rocket size={16} />
                  <span>Deploy AI Agent</span>
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