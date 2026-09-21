import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface V2ExpandableCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  theme?: 'green' | 'darkgrey' | 'yellow' | 'orange' | 'fuchsia' | 'default';
  headerActions?: React.ReactNode;
}

export function V2ExpandableCard({ 
  title, 
  children, 
  defaultExpanded = false,
  isExpanded: controlledIsExpanded,
  onToggle,
  theme = 'default',
  headerActions
}: V2ExpandableCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Theme styling definitions
  const themeStyles = {
    green: {
      cardContainer: "w-full bg-zinc-950/40 border border-zinc-900 overflow-hidden transition-all duration-300 mb-1.5 rounded-md",
      buttonClass: "w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group",
      titleClass: "font-mono text-[13.5px] font-bold text-emerald-400 uppercase tracking-widest text-left",
      chevronCircle: "flex items-center justify-center w-6 h-6 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 group-hover:border-emerald-400 group-hover:bg-emerald-900/30 transition-all duration-200",
      bodyClass: "border-t border-zinc-900 bg-black"
    },
    darkgrey: {
      cardContainer: "w-full bg-zinc-950/40 border border-zinc-900 overflow-hidden transition-all duration-300 mb-1.5 rounded-md",
      buttonClass: "w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group",
      titleClass: "font-mono text-[13.5px] font-bold text-zinc-300 uppercase tracking-widest text-left",
      chevronCircle: "flex items-center justify-center w-6 h-6 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 group-hover:border-zinc-500 transition-all duration-200",
      bodyClass: "border-t border-zinc-900 bg-black"
    },
    yellow: {
      cardContainer: "w-full bg-zinc-950/40 border border-zinc-900 overflow-hidden transition-all duration-300 mb-1.5 rounded-md",
      buttonClass: "w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group",
      titleClass: "font-mono text-[13.5px] font-bold text-amber-400 uppercase tracking-widest text-left",
      chevronCircle: "flex items-center justify-center w-6 h-6 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 group-hover:border-amber-400 group-hover:bg-amber-900/30 transition-all duration-200",
      bodyClass: "border-t border-zinc-900 bg-black"
    },
    orange: {
      cardContainer: "w-full bg-zinc-950/40 border border-zinc-900 overflow-hidden transition-all duration-300 mb-1.5 rounded-md",
      buttonClass: "w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group",
      titleClass: "font-mono text-[13.5px] font-bold text-orange-500 uppercase tracking-widest text-left",
      chevronCircle: "flex items-center justify-center w-6 h-6 rounded-full border border-orange-500/30 bg-orange-950/40 text-orange-500 group-hover:border-orange-500 group-hover:bg-orange-900/30 transition-all duration-200",
      bodyClass: "border-t border-zinc-900 bg-black"
    },
    fuchsia: {
      cardContainer: "w-full bg-zinc-950/40 border border-zinc-900 overflow-hidden transition-all duration-300 mb-1.5 rounded-md",
      buttonClass: "w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group",
      titleClass: "font-mono text-[13.5px] font-bold text-fuchsia-500 uppercase tracking-widest text-left",
      chevronCircle: "flex items-center justify-center w-6 h-6 rounded-full border border-fuchsia-500/30 bg-fuchsia-950/40 text-fuchsia-400 group-hover:border-fuchsia-450 group-hover:bg-fuchsia-900/30 transition-all duration-200",
      bodyClass: "border-t border-zinc-900 bg-black"
    },
    default: {
      cardContainer: "w-full bg-zinc-950/40 border border-zinc-900 overflow-hidden transition-all duration-300 mb-1.5 rounded-md",
      buttonClass: "w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group",
      titleClass: "font-mono text-[13.5px] font-bold text-zinc-300 uppercase tracking-widest text-left",
      chevronCircle: "flex items-center justify-center w-6 h-6 rounded-full border border-emerald-500/20 bg-emerald-950/25 text-[#39ff14] transition-all duration-200",
      bodyClass: "border-t border-zinc-900 bg-black"
    }
  };

  const style = themeStyles[theme] || themeStyles.default;

  return (
    <div className={style.cardContainer}>
      <div 
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              handleToggle();
            }
          }
        }}
        className={`${style.buttonClass} cursor-pointer select-none`}
      >
        <div className={style.titleClass}>{title}</div>
        <div className="flex items-center gap-2.5 shrink-0" onClick={e => e.stopPropagation()}>
          {headerActions}
          <div className={style.chevronCircle}>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
      {isExpanded && (
         <div className={style.bodyClass}>
           {children}
         </div>
      )}
    </div>
  );
}
