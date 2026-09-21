import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingParticle } from './hooks/useDoubleTapReaction';

interface FloatingReactionOverlayProps {
  particles: FloatingParticle[];
}

export const FloatingReactionOverlay: React.FC<FloatingReactionOverlayProps> = ({ particles }) => {
  if (!particles || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle, pIdx) => (
          <motion.div
            key={`reaction-particle-${particle.id}-${pIdx}`}
            initial={{
              opacity: 1,
              scale: (particle.scale || 1) * 0.5,
              x: particle.x - 24,
              y: particle.y - 24,
              rotate: particle.rotation || 0
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [(particle.scale || 1) * 0.8, (particle.scale || 1) * 1.5, (particle.scale || 1) * 1.8],
              y: particle.y - 120,
              x: particle.x - 24 + ((particle.rotation || 0) * 1.2),
              rotate: (particle.rotation || 0) + 15
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute text-4xl select-none drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
