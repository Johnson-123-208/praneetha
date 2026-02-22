import { motion } from 'framer-motion';
import { Building2, Bot, ShieldCheck, Sparkles } from 'lucide-react';

const AccountPortfolio = ({ onDeployAgent, companies = [], loading = false, isLoggedIn = false, onLoginRequired }) => {
  const handleDeploy = (company) => {
    if (onDeployAgent) {
      onDeployAgent(company);
    }
  };

  const getIndustryStyles = (industry = '') => {
    const ind = industry.toLowerCase();
    if (ind.includes('health')) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (ind.includes('food') || ind.includes('restaur')) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
    if (ind.includes('tech')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    if (ind.includes('commerce')) return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
    return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
  };

  return (
    <section id="portfolio" className="py-20 px-4 bg-[#0a0c10] relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Portfolio</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Manage and deploy your automated AI instances.</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <Building2 size={32} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white">No active instances</h3>
            <p className="text-slate-400 text-sm">Deploy your first company profile to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {companies.map((company, index) => {
              const styles = getIndustryStyles(company.industry);
              return (
                <motion.div
                  key={company.id || index}
                  className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-500/50 hover:bg-white/[0.05] transition-all duration-300 flex flex-col h-full group"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                      {company.logo || '🏢'}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${styles.bg} ${styles.text} border ${styles.border}`}>
                      {company.industry}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white leading-tight mb-3">
                    {company.name}
                  </h3>

                  <div className="flex-1 bg-black/20 rounded-xl p-3 mb-4 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={10} className="text-blue-400" />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Capabilities</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed line-clamp-3">
                      {company.contextSummary || 'Standard AI Intelligence Pattern'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-4 px-1">
                    <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-emerald-500" /> Latency Optimized</span>
                    <span className="text-emerald-500 font-black">ACTIVE</span>
                  </div>

                  <button
                    onClick={() => isLoggedIn ? handleDeploy(company) : onLoginRequired()}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all duration-300 ${isLoggedIn
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-transparent border border-white/20 text-white hover:bg-white/10'}`}
                  >
                    <Bot size={14} />
                    <span>{isLoggedIn ? 'Launch Agent' : 'Sign In'}</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AccountPortfolio;
