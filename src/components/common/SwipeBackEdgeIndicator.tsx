import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SwipeBackVisualState } from '../../hooks/useSwipeBackGesture';

export const SwipeBackEdgeIndicator: React.FC<{ state: SwipeBackVisualState }> = ({ state }) => {
  if (!state.active || state.progress <= 0.05) return null;

  const translateX = Math.round(-28 + state.progress * 44);
  const scale = 0.85 + state.progress * 0.2;

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] pointer-events-none select-none"
      style={{
        transform: `translate3d(${translateX}px, -50%, 0) scale(${scale})`,
        opacity: Math.min(1, state.progress * 1.35),
      }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-colors duration-100 shadow-2xl ${
          state.ready
            ? 'bg-purple-600/90 border-teal-300 text-white shadow-[0_0_20px_rgba(168,85,247,0.75)]'
            : 'bg-zinc-950/90 border-zinc-700/80 text-zinc-300 shadow-[0_0_12px_rgba(0,0,0,0.65)]'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
      </div>
    </div>
  );
};
