import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  MessageSquare,
  Headphones,
  Shield,
  Phone,
  PhoneCall
} from 'lucide-react';

const HeroSection = ({ onCallAgent }) => {
  const features = [
    { icon: BarChart3, label: 'Analytics', color: '#667eea' },
    { icon: Users, label: 'CRM', color: '#f093fb' },
    { icon: MessageSquare, label: 'Omni-channel', color: '#4facfe' },
    { icon: Headphones, label: 'Support', color: '#fa709a' },
    { icon: Shield, label: 'Security', color: '#84fab0' },
  ];

  return (
    <section id="features" className="min-h-screen flex items-center justify-center px-4 relative z-10 py-32 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
            <span className="text-text-dark">AI Calling</span>
            <br />
            <span className="text-gradient-purple italic">Agent</span>
          </h1>
          <p className="text-2xl md:text-3xl text-text-gray max-w-4xl mx-auto font-medium leading-relaxed">
            Next-generation voice intelligence platform with multilingual support
            <br className="hidden md:block" />
            and real-time conversational AI
          </p>
        </motion.div>

        {/* Orbital Section */}
        <div className="relative w-full h-96 md:h-[500px] flex items-center justify-center my-20">
          {/* Orbital Wrapper */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const angle = (360 / features.length) * index;
              const radius = 200;

              return (
                <motion.div
                  key={feature.label}
                  className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-premium flex items-center justify-center border-2 border-gray-100 z-10"
                  style={{
                    transform: `rotate(${-angle}deg) translateX(${radius}px) rotate(${angle}deg)`,
                  }}
                  whileHover={{ scale: 1.2 }}
                >
                  <Icon
                    size={32}
                    className="md:w-10 md:h-10"
                    style={{ color: feature.color }}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Central Call Agent Button */}
          <motion.button
            onClick={onCallAgent}
            className="relative z-20 w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-purple text-white font-black text-xl md:text-2xl shadow-card-purple flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 10px 40px rgba(102, 126, 234, 0.3)',
                '0 15px 60px rgba(102, 126, 234, 0.5)',
                '0 10px 40px rgba(102, 126, 234, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex flex-col items-center space-y-3">
              <PhoneCall size={48} className="md:w-14 md:h-14" />
              <span>Call Agent</span>
            </div>
          </motion.button>
        </div>

        {/* Features Grid (Mobile Alternative) */}
        <motion.div
          className="grid grid-cols-5 gap-4 md:hidden mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="bg-white rounded-2xl p-4 flex flex-col items-center space-y-2 shadow-premium"
              >
                <Icon size={24} style={{ color: feature.color }} />
                <span className="text-xs text-text-gray font-semibold">{feature.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={onCallAgent}
            className="px-10 py-5 rounded-2xl bg-gradient-blue text-white font-bold text-xl shadow-card-blue hover:shadow-premium transition-all flex items-center space-x-3"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone size={24} />
            <span>Start Voice Interaction</span>
          </motion.button>
          <motion.a
            href="#pricing"
            className="px-10 py-5 rounded-2xl bg-white border-2 border-gray-200 text-text-dark font-bold text-xl hover:border-purple-primary hover:text-purple-primary transition-all shadow-premium"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            View Pricing
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;