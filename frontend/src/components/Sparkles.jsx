import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Sparkles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate static random positions for performance
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.random() * 3 + 1, // 1 to 4px
      duration: Math.random() * 3 + 2, // 2 to 5s
      delay: Math.random() * 2 // 0 to 2s
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 ${p.size * 2}px ${p.size / 2}px rgba(255, 255, 255, 0.8)`
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
            y: [0, -20, -40]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
