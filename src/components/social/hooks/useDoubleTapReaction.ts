import { useState, useRef, useCallback } from 'react';
import { GENRE_REACTION_MATRICES } from '../../../data/socialFeedMockData';

export interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  scale?: number;
  rotation?: number;
}

interface UseDoubleTapReactionOptions {
  triggerNotification?: (msg: string) => void;
  defaultEmoji?: string;
  genreKey?: string;
}

export function useDoubleTapReaction(options: UseDoubleTapReactionOptions = {}) {
  const { triggerNotification, defaultEmoji = '❤️', genreKey = 'metal' } = options;

  const [traysHiddenOnMobile, setTraysHiddenOnMobile] = useState(false);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const lastTapTimeRef = useRef<number>(0);

  const triggerParticleReaction = useCallback((x: number, y: number, customEmoji?: string) => {
    const activeMatrix = GENRE_REACTION_MATRICES[genreKey] || GENRE_REACTION_MATRICES['metal'];
    const emojiChoices = [
      customEmoji || defaultEmoji,
      activeMatrix?.horns?.icon || '🤘',
      activeMatrix?.hype?.icon || '🔥',
      activeMatrix?.brutal?.icon || '🔨'
    ];
    const chosenEmoji = emojiChoices[Math.floor(Math.random() * emojiChoices.length)];

    const id = `particle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const scale = 0.8 + Math.random() * 0.6;
    const rotation = (Math.random() - 0.5) * 40;

    const newParticle: FloatingParticle = {
      id,
      x,
      y,
      emoji: chosenEmoji,
      scale,
      rotation
    };

    setParticles(prev => [...prev.slice(-15), newParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1200);
  }, [defaultEmoji, genreKey]);

  const handleDoubleTapToggle = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target?.closest('button, a, input, textarea, select, option, label, [role="button"], video, audio, iframe, .interactive')) {
      return;
    }

    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;

    if (timeDiff >= 150 && timeDiff <= 1500) {
      const nextState = !traysHiddenOnMobile;
      setTraysHiddenOnMobile(nextState);

      if (nextState) {
        triggerNotification?.("🙈 Pullout trays & Scene Radio hidden");
      } else {
        triggerNotification?.("👁️ Pullout trays & Scene Radio restored");
      }
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  }, [traysHiddenOnMobile, triggerNotification]);

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  return {
    traysHiddenOnMobile,
    setTraysHiddenOnMobile,
    particles,
    triggerParticleReaction,
    handleDoubleTapToggle,
    clearParticles
  };
}
