import { motion } from 'framer-motion';
import { Rocket, Building2, CheckCircle, Loader } from 'lucide-react';

const AccountPortfolio = ({ onDeployAgent, companies = [], loading = false, isLoggedIn = false, onLoginRequired, onAddCompany }) => {
  const handleDeploy = (company) => {
    if (onDeployAgent) {
      onDeployAgent(company);
    }
  };



  return (
    <section id="portfolio" className="py-12 px-4 relative z-10 bg-sky-200">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-black mb-2 text-slate-800">
            Account Portfolio
          </h2>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto font-medium">
            Manage your connected companies and deploy AI agents instantly
          </p>
        </motion.div>

        {loading ? (
          <motion.div
            className="text-center py-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader size={40} className="mx-auto mb-3 text-sky-500 animate-spin" />
            <p className="text-slate-600 font-bold">Loading Portfolio...</p>
          </motion.div>
        ) : companies.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-3xl shadow-xl border border-sky-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Building2 size={48} className="mx-auto mb-4 text-sky-300" />
            <p className="text-slate-800 text-xl font-bold mb-2">No companies connected yet</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 group flex flex-col h-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="text-3xl bg-sky-50 p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                    {company.logo || '🏢'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                      {company.name}
                    </h3>
                    <p className="text-sky-500 text-[10px] font-black uppercase tracking-widest mt-1">
                      {company.industry}
                    </p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Capabilities</p>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed line-clamp-3 italic">
                    {company.contextSummary || 'Standard AI Intelligence Pattern'}
                  </p>
                </div>

                <motion.button
                  onClick={() => isLoggedIn ? handleDeploy(company) : onLoginRequired()}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-300 ${isLoggedIn ? 'bg-slate-900 text-white hover:bg-sky-600 shadow-lg shadow-slate-900/10' : 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50'}`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Rocket size={16} />
                  <span>{isLoggedIn ? 'Deploy Agent' : 'Login to Access'}</span>
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