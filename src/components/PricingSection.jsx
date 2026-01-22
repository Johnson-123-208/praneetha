import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: [
        'Basic voice interactions',
        'English language only',
        '100 calls/month',
        'Email support',
      ],
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$99',
      period: '/month',
      description: 'Ideal for growing businesses with advanced needs',
      features: [
        'Advanced voice intelligence',
        'Multilingual support (7 languages)',
        'Unlimited calls',
        'API integration',
        'Company database linking',
        'Priority support',
        'Custom agent profiles',
        'Analytics dashboard',
      ],
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored solutions for large organizations',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'On-premise deployment',
        'White-label options',
        'Advanced security',
      ],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-cyan">
            Pricing Plans
          </h2>
          <p className="text-white/60 text-lg">
            Choose the perfect plan for your business needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? 'glass-strong border-2 border-electric-cyan scale-105'
                  : 'glass border border-white/10'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: plan.highlight ? 1.08 : 1.02, y: -5 }}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-electric-cyan text-deep-navy text-sm font-bold flex items-center space-x-1">
                    <Zap size={14} />
                    <span>Recommended</span>
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-gradient-magenta">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-white/60 ml-2">{plan.period}</span>
                  )}
                </div>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <Check
                      className={`flex-shrink-0 mt-0.5 ${
                        plan.highlight ? 'text-electric-cyan' : 'text-white/60'
                      }`}
                      size={18}
                    />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                className={`w-full py-3 rounded-lg font-semibold transition-opacity ${
                  plan.highlight
                    ? 'bg-electric-cyan text-deep-navy glow-cyan hover:opacity-90'
                    : 'glass border border-white/20 text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;