import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X } from 'lucide-react';
import { playTactileChime } from '../utils/audioEngine';

interface InfoTipProps {
  title: string;
  bullets: string[];
  subtitle?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center-modal';
  className?: string;
  accentColor?: string; // e.g. '#00ffcc' or '#a855f7' or '#f59e0b'
}

export default function InfoTip({
  title,
  bullets,
  subtitle,
  position = 'bottom-right',
  className = '',
  accentColor = '#00ffcc'
}: InfoTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Small local synthesizer cue for futuristic tactile interactions
  const triggerTactileChime = () => {
    playTactileChime(isOpen);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggerTactileChime();
    setIsOpen(!isOpen);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isOpen) {
      triggerTactileChime();
      setIsOpen(false);
    }
  };

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // CSS mappings for position overlays
  const positionClasses = {
    'bottom-right': 'absolute top-8 right-0 w-[290px] sm:w-[320px] origin-top-right z-50',
    'bottom-left': 'absolute top-8 left-0 w-[290px] sm:w-[320px] origin-top-left z-50',
    'top-right': 'absolute bottom-8 right-0 w-[290px] sm:w-[320px] origin-bottom-right z-50',
    'top-left': 'absolute bottom-8 left-0 w-[290px] sm:w-[320px] origin-bottom-left z-50',
    'center-modal': 'fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[380px] z-50'
  };

  return (
    <div className={`relative inline-block select-none ${className}`} ref={containerRef}>
      {/* Small informative (i) interactive button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer border focus:outline-none ${
          isOpen
            ? 'bg-zinc-805 text-white scale-110 shadow-[0_0_8px_rgba(0,255,204,0.35)]'
            : 'bg-zinc-950/60 text-zinc-450 hover:text-white border-zinc-800/80 hover:border-zinc-700 hover:scale-105 active:scale-95'
        }`}
        style={isOpen ? { borderColor: accentColor } : {}}
        title={`Click for card info: ${title}`}
      >
        <HelpCircle className="w-3 h-3 pointer-events-none" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay backdrop only if rendered as a center-modal */}
            {position === 'center-modal' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => handleClose()}
                className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-40 cursor-pointer"
              />
            )}

            {/* Content Popout Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: position.startsWith('bottom') ? -4 : 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: position.startsWith('bottom') ? -4 : 4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`${positionClasses[position]} bg-zinc-950/95 border border-zinc-800/85 p-4 rounded-xl shadow-2xl backdrop-blur-md`}
              style={{ borderTopColor: accentColor, borderTopWidth: '3px' }}
            >
              {/* Header section */}
              <div className="flex items-start justify-between gap-2 border-b border-zinc-900 pb-1.5 mb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[7.5px] font-mono tracking-widest uppercase font-black px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded" style={{ color: accentColor }}>
                    PROTOCOL INFO
                  </span>
                  <h4 className="text-[11px] font-black tracking-wide uppercase font-mono text-zinc-105">
                    {title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 -mr-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Optional sub-description */}
              {subtitle && (
                <p className="text-[9.5px] font-mono text-zinc-500 leading-relaxed uppercase mb-2">
                  {subtitle}
                </p>
              )}

              {/* Quick instructions checklist layout */}
              <ul className="space-y-2 font-mono text-[9.5px] text-zinc-400 leading-relaxed uppercase">
                {bullets.map((bullet, idx) => (
                  <motion.li
                    key={`tip-bullet-${idx}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 + 0.05 }}
                    className="flex gap-2 items-start"
                  >
                    <span className="text-zinc-650 font-black shrink-0">[{idx + 1}]</span>
                    <span>{bullet}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Footer action tip */}
              <div className="mt-3.5 pt-2 border-t border-zinc-90 w-full text-center">
                <span className="text-[7px] font-mono text-zinc-600 block uppercase tracking-widest font-bold">
                  TAP OUTSIDE OR × TO RETURN
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
