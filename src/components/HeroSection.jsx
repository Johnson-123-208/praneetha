import { motion } from 'framer-motion';

const HeroSection = ({ onCallAgent }) => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Video - Full width and height */}
      <div className="absolute inset-0 top-0 z-0 mt-12">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        >
          <source src="/AI.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Text on Right Side - Two lines with different sizes */}
      <div className="relative z-10 w-full h-full flex items-center justify-end px-8 md:px-16">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-xl text-right"
        >
          {/* First Line - Bigger */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-4"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Hi, I'm <span className="text-purple-600">Callix</span>
          </motion.h1>

          {/* Second Line - Smaller */}
          <motion.p
            className="text-3xl md:text-4xl font-semibold text-gray-700"
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          >
            your AI Calling Agent
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;