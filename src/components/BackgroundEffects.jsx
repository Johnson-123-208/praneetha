import { motion } from 'framer-motion';

const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Subtle gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-primary/10 to-pink-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-primary/10 to-green-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-primary/5 to-purple-primary/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default BackgroundEffects;