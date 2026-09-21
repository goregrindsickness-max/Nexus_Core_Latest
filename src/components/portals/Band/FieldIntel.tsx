import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FieldIntelProps {
  content: string;
  className?: string;
  trigger?: '?' | '[ i ]';
}

export const FieldIntel: React.FC<FieldIntelProps> = ({
  content,
  className = '',
  trigger = '[ i ]'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div 
      className={`inline-block relative ml-1.5 align-middle select-none ${className}`} 
      ref={containerRef}
      id={`field-intel-container-${content.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`}
    >
      <button
        type="button"
        id="field-intel-trigger"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-[10px] font-mono font-bold text-zinc-500 hover:text-[#8b5cf6] cursor-pointer transition-colors px-1 py-0.5 rounded border border-transparent hover:border-zinc-800"
        title="Field Intelligence help"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            id="field-intel-popup"
            className="absolute z-50 left-0 mt-1.5 w-64 p-3 bg-black border-2 border-[#8b5cf6] shadow-[0_4px_20px_rgba(139,92,246,0.15)] rounded-md pointer-events-none text-left"
          >
            {/* Brutalist neon corner accent */}
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#8b5cf6]" />
            <div className="text-[10px] uppercase font-mono text-[#8b5cf6] font-bold mb-1 tracking-wider flex items-center gap-1">
              <span>● OPERATIONAL INTEL</span>
            </div>
            <p className="font-mono text-[9px] text-zinc-400 font-medium leading-relaxed uppercase">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
