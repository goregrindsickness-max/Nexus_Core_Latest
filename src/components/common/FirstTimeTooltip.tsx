import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, Check, Sparkles } from 'lucide-react';
import { safeSetLocalStorageItem } from '../../utils/safeStorage';

interface FirstTimeTooltipProps {
  id: string;
  title?: string;
  tip: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  accentColor?: 'violet' | 'amber' | 'cyan' | 'rose' | 'emerald';
  triggerOn?: 'click' | 'hover';
  autoShow?: boolean;
  autoShowDelay?: number;
  className?: string;
}

const isDismissed = (id: string): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const v1 = localStorage.getItem(`ft_tip_${id}`);
    const v2 = localStorage.getItem(`nexus_tooltip_dismissed_${id}`);
    return v1 === 'true' || v2 === 'true';
  } catch {
    return false;
  }
};

export const FirstTimeTooltip: React.FC<FirstTimeTooltipProps> = ({
  id,
  title,
  tip,
  children,
  position = 'top',
  accentColor = 'violet',
  triggerOn = 'hover',
  autoShow = true,
  autoShowDelay = 1500,
  className = '',
}) => {
  const [hasSeen, setHasSeen] = useState<boolean>(() => isDismissed(id));
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDismissed(id)) {
      setHasSeen(true);
      setIsOpen(false);
      return;
    }

    if (autoShow) {
      const timer = setTimeout(() => {
        if (!isDismissed(id)) {
          setIsOpen(true);
        }
      }, autoShowDelay);
      return () => clearTimeout(timer);
    }
  }, [id, autoShow, autoShowDelay]);

  // Synchronize across components or tabs if dismissed
  useEffect(() => {
    const handleRemoteDismiss = (e: any) => {
      if (e?.detail?.id === id) {
        setHasSeen(true);
        setIsOpen(false);
      }
    };
    window.addEventListener('nexus_tooltip_dismissed', handleRemoteDismiss as EventListener);
    return () => window.removeEventListener('nexus_tooltip_dismissed', handleRemoteDismiss as EventListener);
  }, [id]);

  const dismiss = (e?: React.MouseEvent | React.SyntheticEvent | Event) => {
    if (e && typeof (e as any).stopPropagation === 'function') {
      (e as any).stopPropagation();
    }
    setHasSeen(true);
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`ft_tip_${id}`, 'true');
        localStorage.setItem(`nexus_tooltip_dismissed_${id}`, 'true');
      } catch (_) {}
      safeSetLocalStorageItem(`ft_tip_${id}`, 'true');
      safeSetLocalStorageItem(`nexus_tooltip_dismissed_${id}`, 'true');
      window.dispatchEvent(new CustomEvent('nexus_tooltip_dismissed', { detail: { id } }));
    }
  };

  const handleTrigger = () => {
    if (!hasSeen && !isDismissed(id)) {
      setIsOpen(true);
    }
  };

  // Close when clicking or tapping outside if open
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const accentStyles = {
    violet: {
      border: 'border-violet-500/60',
      bg: 'bg-[#120e24]',
      text: 'text-violet-300',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      btn: 'bg-violet-600 hover:bg-violet-500 text-white',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
    },
    amber: {
      border: 'border-amber-500/60',
      bg: 'bg-[#241a0e]',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    },
    cyan: {
      border: 'border-cyan-500/60',
      bg: 'bg-[#0e2024]',
      text: 'text-cyan-300',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      btn: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    },
    rose: {
      border: 'border-rose-500/60',
      bg: 'bg-[#240e16]',
      text: 'text-rose-300',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    },
    emerald: {
      border: 'border-emerald-500/60',
      bg: 'bg-[#0e2417]',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
  }[accentColor];

  const posClasses = {
    top: 'bottom-full mb-3 right-0 sm:left-1/2 sm:-translate-x-1/2',
    bottom: 'top-full mt-3 right-0 sm:left-1/2 sm:-translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }[position];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={triggerOn === 'hover' && !hasSeen ? handleTrigger : undefined}
      onClick={triggerOn === 'click' && !hasSeen ? handleTrigger : undefined}
      onClickCapture={() => {
        // Any click on the target element or its children permanently dismisses the tip
        if (isOpen) {
          dismiss();
        }
      }}
    >
      {children}

      <AnimatePresence>
        {!hasSeen && isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[200] w-64 p-3 rounded-xl border ${accentStyles.border} ${accentStyles.bg} ${accentStyles.glow} backdrop-blur-md shadow-2xl ${posClasses} pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono ${accentStyles.badge}`}>
                  <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                  First Time Tip
                </span>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss permanently"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {title && (
              <h4 className="text-xs font-bold text-white mb-0.5 font-display">{title}</h4>
            )}

            <p className="text-[11px] text-zinc-300 leading-snug mb-2 font-sans">{tip}</p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={dismiss}
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${accentStyles.btn}`}
              >
                <Check className="w-3 h-3" /> Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
