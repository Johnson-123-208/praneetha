import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Particle = ({ delay, duration, initialX, initialY }) => {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-electric-cyan/30"
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
      }}
      animate={{
        y: [0, -100, -200],
        x: [0, Math.random() * 50 - 25],
        opacity: [0.3, 0.8, 0],
        scale: [1, 1.5, 0.5],
      }}
      transition={{
        duration: duration || 6,
        delay: delay || 0,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

const BackgroundEffects = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Animated radial gradients
    const gradients = [
      { x: 0.2, y: 0.3, color: 'rgba(112, 214, 255, 0.1)' },
      { x: 0.8, y: 0.2, color: 'rgba(255, 112, 166, 0.1)' },
      { x: 0.5, y: 0.7, color: 'rgba(157, 141, 241, 0.1)' },
    ];

    let time = 0;

    const animate = () => {
      ctx.fillStyle = '#0a0918';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.01;

      gradients.forEach((grad, i) => {
        const x = (grad.x + Math.sin(time + i) * 0.1) * canvas.width;
        const y = (grad.y + Math.cos(time + i * 0.5) * 0.1) * canvas.height;
        const radius = 300 + Math.sin(time * 2 + i) * 50;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, grad.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate 25 particles
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: i * 0.2,
    duration: 6 + Math.random() * 4,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {particles.map((particle) => (
        <Particle key={particle.id} {...particle} />
      ))}
    </div>
  );
};

export default BackgroundEffects;