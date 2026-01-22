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
    <section id="pricing" className="py-24 px-4 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Pricing Plans
          </h2>
          <p className="text-gray-900 text-xl md:text-2xl font-bold max-w-2xl mx-auto">
            Choose the perfect plan for your business needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-[2.5rem] p-10 flex flex-col h-full transform transition-all duration-500 ${plan.highlight
                  ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white shadow-2xl scale-105 z-10'
                  : 'bg-white border-2 border-gray-100 shadow-xl text-gray-900'
                }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <span className="px-6 py-2 rounded-full bg-white text-purple-700 text-sm font-black flex items-center space-x-2 shadow-xl whitespace-nowrap">
                    <Zap size={16} className="fill-purple-600" />
                    <span>MOST POPULAR</span>
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-3xl font-black mb-4 tracking-tight">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-6xl font-black tracking-tighter">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-2 text-xl font-bold opacity-80">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold leading-relaxed opacity-90">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1">
                <ul className="space-y-5 mb-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-4">
                      <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-white/20' : 'bg-green-100'
                        }`}>
                        <Check
                          size={16}
                          strokeWidth={4}
                          className={plan.highlight ? 'text-white' : 'text-green-600'}
                        />
                      </div>
                      <span className="text-base font-bold leading-tight">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.button
                className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg transition-all ${plan.highlight
                    ? 'bg-white text-purple-700 hover:bg-gray-50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90'
                  }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
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