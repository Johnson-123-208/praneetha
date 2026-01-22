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
    <section id="pricing" className="py-12 px-4 relative z-10 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-purple bg-clip-text text-transparent">
            Pricing Plans
          </h2>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Choose the perfect plan for your business needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-xl p-5 flex flex-col h-full transform transition-all duration-500 ${plan.highlight
                ? 'bg-gradient-purple text-white shadow-lg scale-105 z-10'
                : 'bg-white border border-gray-100 shadow-md text-gray-900'
                }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full bg-white text-purple-600 text-[10px] font-bold flex items-center space-x-1 shadow-md whitespace-nowrap">
                    <Zap size={10} className="fill-purple-600" />
                    <span>POPULAR</span>
                  </span>
                </div>
              )}

              <div className="mb-3 text-center">
                <h3 className="text-lg font-bold mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-center justify-center mb-1">
                  <span className={`text-2xl font-bold ${plan.highlight ? 'text-white' : 'text-purple-600'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-xs font-semibold opacity-80">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <ul className="space-y-1.5 mb-4">
                  {plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <div className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-white/20' : 'bg-green-100'
                        }`}>
                        <Check
                          size={8}
                          strokeWidth={3}
                          className={plan.highlight ? 'text-white' : 'text-green-600'}
                        />
                      </div>
                      <span className="text-[11px] font-medium leading-tight">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.button
                className={`w-full py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all ${plan.highlight
                  ? 'bg-white text-purple-600 hover:bg-gray-50'
                  : 'bg-gradient-purple text-white hover:opacity-90'
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