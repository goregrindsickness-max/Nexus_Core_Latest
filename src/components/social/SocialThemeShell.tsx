import React from 'react';

interface SocialThemeShellProps {
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
  handleDoubleTapToggle?: (e: React.MouseEvent<HTMLDivElement>) => void;
  dataTheme: string;
  gridStyle: React.CSSProperties;
}

export const SocialThemeShell: React.FC<SocialThemeShellProps> = ({
  children,
  containerRef,
  dataTheme,
  gridStyle
}) => {
  return (
      <div 
        ref={containerRef}
        data-theme={dataTheme}
        className="min-h-screen w-full bg-[#030303] text-zinc-200 font-sans overflow-x-clip pl-0 pb-6 sm:pb-8"
        style={gridStyle}
      >
      <style>{`
        /* Promoter Yellow Theme Overrides */

        /* Label Orange Theme Overrides */
        [data-theme="label"] .text-rose-400 { color: #fb923c !important; }
        [data-theme="label"] .text-rose-500 { color: #f97316 !important; }
        [data-theme="label"] .text-rose-650 { color: #ea580c !important; }
        [data-theme="label"] .text-rose-600 { color: #c2410c !important; }
        [data-theme="label"] .text-rose-300 { color: #fdba74 !important; }
        [data-theme="label"] .text-rose-200 { color: #fed7aa !important; }
        [data-theme="label"] .text-rose-700 { color: #9a3412 !important; }

        [data-theme="label"] .hover\:text-rose-400:hover { color: #fb923c !important; }
        [data-theme="label"] .hover\:text-rose-300:hover { color: #fdba74 !important; }
        [data-theme="label"] .hover\:text-rose-500:hover { color: #f97316 !important; }

        [data-theme="label"] .group-hover\/player\:text-rose-400:hover { color: #fb923c !important; }
        [data-theme="label"] .group-hover\:text-rose-400:hover { color: #fb923c !important; }

        [data-theme="label"] .bg-rose-500 { background-color: #f97316 !important; }
        [data-theme="label"] .bg-rose-600 { background-color: #ea580c !important; }
        [data-theme="label"] .bg-rose-950 { background-color: #431407 !important; }
        [data-theme="label"] .bg-rose-950\/40 { background-color: rgba(67, 20, 7, 0.45) !important; }
        [data-theme="label"] .bg-rose-950\/30 { background-color: rgba(67, 20, 7, 0.35) !important; }
        [data-theme="label"] .bg-rose-950\/20 { background-color: rgba(67, 20, 7, 0.25) !important; }
        [data-theme="label"] .bg-rose-950\/10 { background-color: rgba(67, 20, 7, 0.15) !important; }
        [data-theme="label"] .bg-rose-950\/15 { background-color: rgba(67, 20, 7, 0.2) !important; }
        [data-theme="label"] .bg-rose-955\/10 { background-color: rgba(67, 20, 7, 0.1) !important; }
        [data-theme="label"] .bg-rose-500\/10 { background-color: rgba(249, 115, 22, 0.1) !important; }
        [data-theme="label"] .bg-rose-500\/20 { background-color: rgba(249, 115, 22, 0.2) !important; }
        [data-theme="label"] .bg-rose-500\/25 { background-color: rgba(249, 115, 22, 0.25) !important; }
        [data-theme="label"] .bg-rose-600\/20 { background-color: rgba(234, 88, 12, 0.2) !important; }
        [data-theme="label"] .bg-rose-600\/30 { background-color: rgba(234, 88, 12, 0.3) !important; }

        [data-theme="label"] .border-rose-500 { border-color: #f97316 !important; }
        [data-theme="label"] .border-rose-900 { border-color: #7c2d12 !important; }
        [data-theme="label"] .border-rose-500\/30 { border-color: rgba(249, 115, 22, 0.3) !important; }
        [data-theme="label"] .border-rose-500\/40 { border-color: rgba(249, 115, 22, 0.4) !important; }
        [data-theme="label"] .border-rose-500\/45 { border-color: rgba(249, 115, 22, 0.45) !important; }
        [data-theme="label"] .border-rose-500\/50 { border-color: rgba(249, 115, 22, 0.5) !important; }
        [data-theme="label"] .border-rose-900\/30 { border-color: rgba(124, 45, 18, 0.3) !important; }
        [data-theme="label"] .border-rose-950\/80 { border-color: rgba(67, 20, 7, 0.8) !important; }
        [data-theme="label"] .border-rose-950\/40 { border-color: rgba(67, 20, 7, 0.4) !important; }

        [data-theme="label"] .hover\:border-rose-400:hover { border-color: #fb923c !important; }
        [data-theme="label"] .hover\:border-rose-500\/50:hover { border-color: rgba(249, 115, 22, 0.5) !important; }

        [data-theme="label"] .focus\:ring-rose-500:focus { --tw-ring-color: #f97316 !important; }

        [data-theme="label"] .from-rose-600 { --tw-gradient-from: #ea580c !important; --tw-gradient-to: rgba(234, 88, 12, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        [data-theme="label"] .via-rose-500 { --tw-gradient-to: rgba(249, 115, 22, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), #f97316, var(--tw-gradient-to) !important; }
        [data-theme="label"] .to-rose-900 { --tw-gradient-to: #7c2d12 !important; }

        [data-theme="label"] .from-rose-950\/40 { --tw-gradient-from: rgba(67, 20, 7, 0.4) !important; }

        [data-theme="label"] .drop-shadow-\[0_0_8px_rgba\(244\,63\,94\,0\.8\)\] { filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.8)) !important; }
        [data-theme="label"] .shadow-\[0_0_12px_\#f43f5e\] { box-shadow: 0 0 12px #f97316 !important; }

        [data-theme="promoter"] .text-rose-400 { color: #facc15 !important; }
        [data-theme="promoter"] .text-rose-500 { color: #eab308 !important; }
        [data-theme="promoter"] .text-rose-650 { color: #ca8a04 !important; }
        [data-theme="promoter"] .text-rose-600 { color: #a16207 !important; }
        [data-theme="promoter"] .text-rose-300 { color: #fef08a !important; }
        [data-theme="promoter"] .text-rose-200 { color: #fef9c3 !important; }
        [data-theme="promoter"] .text-rose-700 { color: #854d0e !important; }

        [data-theme="promoter"] .hover\:text-rose-400:hover { color: #facc15 !important; }
        [data-theme="promoter"] .hover\:text-rose-300:hover { color: #fef08a !important; }
        [data-theme="promoter"] .hover\:text-rose-500:hover { color: #eab308 !important; }

        [data-theme="promoter"] .group-hover\/player\:text-rose-400:hover { color: #facc15 !important; }
        [data-theme="promoter"] .group-hover\:text-rose-400:hover { color: #facc15 !important; }

        [data-theme="promoter"] .bg-rose-500 { background-color: #eab308 !important; }
        [data-theme="promoter"] .bg-rose-600 { background-color: #ca8a04 !important; }
        [data-theme="promoter"] .bg-rose-950 { background-color: #422006 !important; }
        [data-theme="promoter"] .bg-rose-950\/40 { background-color: rgba(66, 32, 6, 0.45) !important; }
        [data-theme="promoter"] .bg-rose-950\/30 { background-color: rgba(66, 32, 6, 0.35) !important; }
        [data-theme="promoter"] .bg-rose-950\/20 { background-color: rgba(66, 32, 6, 0.25) !important; }
        [data-theme="promoter"] .bg-rose-950\/10 { background-color: rgba(66, 32, 6, 0.15) !important; }
        [data-theme="promoter"] .bg-rose-950\/15 { background-color: rgba(66, 32, 6, 0.2) !important; }
        [data-theme="promoter"] .bg-rose-955\/10 { background-color: rgba(66, 32, 6, 0.1) !important; }
        [data-theme="promoter"] .bg-rose-500\/10 { background-color: rgba(234, 179, 8, 0.1) !important; }
        [data-theme="promoter"] .bg-rose-500\/20 { background-color: rgba(234, 179, 8, 0.2) !important; }
        [data-theme="promoter"] .bg-rose-500\/25 { background-color: rgba(234, 179, 8, 0.25) !important; }
        [data-theme="promoter"] .bg-rose-600\/20 { background-color: rgba(202, 138, 4, 0.2) !important; }
        [data-theme="promoter"] .bg-rose-600\/30 { background-color: rgba(202, 138, 4, 0.3) !important; }

        [data-theme="promoter"] .border-rose-500 { border-color: #eab308 !important; }
        [data-theme="promoter"] .border-rose-900 { border-color: #713f12 !important; }
        [data-theme="promoter"] .border-rose-500\/30 { border-color: rgba(234, 179, 8, 0.3) !important; }
        [data-theme="promoter"] .border-rose-500\/40 { border-color: rgba(234, 179, 8, 0.4) !important; }
        [data-theme="promoter"] .border-rose-500\/45 { border-color: rgba(234, 179, 8, 0.45) !important; }
        [data-theme="promoter"] .border-rose-500\/50 { border-color: rgba(234, 179, 8, 0.5) !important; }
        [data-theme="promoter"] .border-rose-900\/30 { border-color: rgba(113, 63, 18, 0.3) !important; }
        [data-theme="promoter"] .border-rose-950\/80 { border-color: rgba(66, 32, 6, 0.8) !important; }
        [data-theme="promoter"] .border-rose-950\/40 { border-color: rgba(66, 32, 6, 0.4) !important; }

        [data-theme="promoter"] .hover\:border-rose-400:hover { border-color: #facc15 !important; }
        [data-theme="promoter"] .hover\:border-rose-500\/50:hover { border-color: rgba(234, 179, 8, 0.5) !important; }

        [data-theme="promoter"] .focus\:ring-rose-500:focus { --tw-ring-color: #eab308 !important; }

        [data-theme="promoter"] .from-rose-600 { --tw-gradient-from: #ca8a04 !important; --tw-gradient-to: rgba(202, 138, 4, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        [data-theme="promoter"] .via-rose-500 { --tw-gradient-to: rgba(234, 179, 8, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), #eab308, var(--tw-gradient-to) !important; }
        [data-theme="promoter"] .to-rose-900 { --tw-gradient-to: #713f12 !important; }
        [data-theme="promoter"] .from-rose-950\/40 { --tw-gradient-from: rgba(66, 32, 6, 0.4) !important; }

        [data-theme="promoter"] .drop-shadow-\[0_0_8px_rgba\(244\,63\,94\,0\.8\)\] { filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.8)) !important; }
        [data-theme="promoter"] .shadow-\[0_0_12px_\#f43f5e\] { box-shadow: 0 0 12px #eab308 !important; }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(239, 68, 68, 0.55);
            border-color: rgba(239, 68, 68, 0.8);
          }
        }
        @keyframes pulseGlowMagenta {
          0%, 100% {
            box-shadow: 0 0 12px rgba(217, 70, 239, 0.2);
            border-color: rgba(217, 70, 239, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(217, 70, 239, 0.55);
            border-color: rgba(217, 70, 239, 0.8);
          }
        }
        @keyframes pulseGlowGreen {
          0%, 100% {
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
            border-color: rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(16, 185, 129, 0.55);
            border-color: rgba(16, 185, 129, 0.8);
          }
        }
        @keyframes pulseGlowYellow {
          0%, 100% {
            box-shadow: 0 0 12px rgba(234, 179, 8, 0.2);
            border-color: rgba(234, 179, 8, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(234, 179, 8, 0.55);
            border-color: rgba(234, 179, 8, 0.8);
          }
        }
        @keyframes pulseGlowOrange {
          0%, 100% {
            box-shadow: 0 0 12px rgba(249, 115, 22, 0.2);
            border-color: rgba(249, 115, 22, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(249, 115, 22, 0.55);
            border-color: rgba(249, 115, 22, 0.8);
          }
        }
        @keyframes pulseGlowBlue {
          0%, 100% {
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(59, 130, 246, 0.55);
            border-color: rgba(59, 130, 246, 0.8);
          }
        }
        @keyframes pulseGlowViolet {
          0%, 100% {
            box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
            border-color: rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(139, 92, 246, 0.55);
            border-color: rgba(139, 92, 246, 0.8);
          }
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s infinite ease-in-out;
        }
        .animate-pulse-glow-magenta {
          animation: pulseGlowMagenta 3s infinite ease-in-out;
        }
        .animate-pulse-glow-green {
          animation: pulseGlowGreen 3s infinite ease-in-out;
        }
        .animate-pulse-glow-yellow {
          animation: pulseGlowYellow 3s infinite ease-in-out;
        }
        .animate-pulse-glow-orange {
          animation: pulseGlowOrange 3s infinite ease-in-out;
        }
        .animate-pulse-glow-blue {
          animation: pulseGlowBlue 3s infinite ease-in-out;
        }
        .animate-pulse-glow-violet {
          animation: pulseGlowViolet 3s infinite ease-in-out;
        }

        /* Fan Blue Theme Overrides (Electric Blue / Cyan) */
        [data-theme="fan-blue"] .text-rose-400 { color: #22d3ee !important; }
        [data-theme="fan-blue"] .text-rose-500 { color: #06b6d4 !important; }
        [data-theme="fan-blue"] .text-rose-600 { color: #0891b2 !important; }
        [data-theme="fan-blue"] .text-rose-300 { color: #67e8f9 !important; }
        [data-theme="fan-blue"] .text-rose-200 { color: #a5f3fc !important; }
        [data-theme="fan-blue"] .text-rose-700 { color: #0e7490 !important; }

        [data-theme="fan-blue"] .hover\:text-rose-400:hover { color: #22d3ee !important; }
        [data-theme="fan-blue"] .hover\:text-rose-300:hover { color: #67e8f9 !important; }
        [data-theme="fan-blue"] .hover\:text-rose-500:hover { color: #06b6d4 !important; }

        [data-theme="fan-blue"] .group-hover\/player\:text-rose-400:hover { color: #22d3ee !important; }
        [data-theme="fan-blue"] .group-hover\:text-rose-400:hover { color: #22d3ee !important; }

        [data-theme="fan-blue"] .bg-rose-500 { background-color: #06b6d4 !important; }
        [data-theme="fan-blue"] .bg-rose-600 { background-color: #0891b2 !important; }
        [data-theme="fan-blue"] .bg-rose-950 { background-color: #083344 !important; }
        [data-theme="fan-blue"] .bg-rose-950\/40 { background-color: rgba(8, 51, 68, 0.45) !important; }
        [data-theme="fan-blue"] .bg-rose-950\/30 { background-color: rgba(8, 51, 68, 0.35) !important; }
        [data-theme="fan-blue"] .bg-rose-950\/20 { background-color: rgba(8, 51, 68, 0.25) !important; }
        [data-theme="fan-blue"] .bg-rose-950\/10 { background-color: rgba(8, 51, 68, 0.15) !important; }
        [data-theme="fan-blue"] .bg-rose-950\/15 { background-color: rgba(8, 51, 68, 0.2) !important; }
        [data-theme="fan-blue"] .bg-rose-955\/10 { background-color: rgba(8, 51, 68, 0.1) !important; }
        [data-theme="fan-blue"] .bg-rose-500\/10 { background-color: rgba(6, 182, 212, 0.1) !important; }
        [data-theme="fan-blue"] .bg-rose-500\/20 { background-color: rgba(6, 182, 212, 0.2) !important; }
        [data-theme="fan-blue"] .bg-rose-500\/25 { background-color: rgba(6, 182, 212, 0.25) !important; }
        [data-theme="fan-blue"] .bg-rose-600\/20 { background-color: rgba(8, 145, 178, 0.2) !important; }
        [data-theme="fan-blue"] .bg-rose-600\/30 { background-color: rgba(8, 145, 178, 0.3) !important; }

        [data-theme="fan-blue"] .border-rose-500 { border-color: #06b6d4 !important; }
        [data-theme="fan-blue"] .border-rose-900 { border-color: #164e63 !important; }
        [data-theme="fan-blue"] .border-rose-500\/30 { border-color: rgba(6, 182, 212, 0.45) !important; }
        [data-theme="fan-blue"] .border-rose-500\/40 { border-color: rgba(6, 182, 212, 0.5) !important; }
        [data-theme="fan-blue"] .border-rose-500\/45 { border-color: rgba(6, 182, 212, 0.55) !important; }
        [data-theme="fan-blue"] .border-rose-500\/50 { border-color: rgba(6, 182, 212, 0.6) !important; }
        [data-theme="fan-blue"] .border-rose-900\/30 { border-color: rgba(22, 78, 99, 0.4) !important; }
        [data-theme="fan-blue"] .border-rose-950\/80 { border-color: rgba(8, 51, 68, 0.65) !important; }
        [data-theme="fan-blue"] .border-rose-950\/40 { border-color: rgba(8, 51, 68, 0.45) !important; }

        /* Purple Overrides for Discover Artists */
        [data-theme="fan-blue"] .border-purple-500\/40 { border-color: rgba(6, 182, 212, 0.45) !important; }
        [data-theme="fan-blue"] .border-purple-500\/35 { border-color: rgba(6, 182, 212, 0.4) !important; }
        [data-theme="fan-blue"] .hover\:border-purple-400:hover { border-color: #22d3ee !important; }
        [data-theme="fan-blue"] .shadow-\[0_0_15px_rgba\(168\,85\,247\,0\.1\)\] { box-shadow: 0 0 15px rgba(6, 182, 212, 0.1) !important; }
        [data-theme="fan-blue"] .hover\:shadow-\[0_0_20px_rgba\(168\,85\,247\,0\.3\)\]:hover { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3) !important; }
        [data-theme="fan-blue"] .text-purple-400 { color: #22d3ee !important; }
        [data-theme="fan-blue"] .bg-purple-950\/70 { background-color: rgba(8, 51, 68, 0.7) !important; }
        [data-theme="fan-blue"] .border-purple-900\/50 { border-color: rgba(22, 78, 99, 0.5) !important; }
        [data-theme="fan-blue"] .shadow-\[0_0_8px_rgba\(168\,85\,247\,0\.3\)\] { box-shadow: 0 0 8px rgba(6, 182, 212, 0.3) !important; }

        [data-theme="fan-blue"] .hover\:border-rose-400:hover { border-color: #22d3ee !important; }
        [data-theme="fan-blue"] .hover\:border-rose-500\/50:hover { border-color: rgba(6, 182, 212, 0.7) !important; }

        [data-theme="fan-blue"] .focus\:ring-rose-500:focus { --tw-ring-color: #06b6d4 !important; }

        [data-theme="fan-blue"] .from-rose-600 { --tw-gradient-from: #0891b2 !important; --tw-gradient-to: rgba(8, 145, 178, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        [data-theme="fan-blue"] .via-rose-500 { --tw-gradient-to: rgba(6, 182, 212, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), #06b6d4, var(--tw-gradient-to) !important; }
        [data-theme="fan-blue"] .to-rose-900 { --tw-gradient-to: #164e63 !important; }
        [data-theme="fan-blue"] .from-rose-950\/40 { --tw-gradient-from: rgba(8, 51, 68, 0.4) !important; }

        [data-theme="fan-blue"] .drop-shadow-\[0_0_8px_rgba\(244\,63\,94\,0\.8\)\] { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) !important; }
        [data-theme="fan-blue"] .shadow-\[0_0_12px_\#f43f5e\] { box-shadow: 0 0 12px #06b6d4 !important; }

        /* Professional Violet/Metallic Purple Theme Overrides (DEEPER / DARKER) */
        [data-theme="pro-violet"] .text-rose-400 { color: #5b07a3 !important; }
        [data-theme="pro-violet"] .text-rose-500 { color: #5802ae !important; }
        [data-theme="pro-violet"] .text-rose-650 { color: #5802ae !important; }
        [data-theme="pro-violet"] .text-rose-600 { color: #2c025c !important; }
        [data-theme="pro-violet"] .text-rose-300 { color: #6b26b5 !important; }
        [data-theme="pro-violet"] .text-rose-200 { color: #9154db !important; }
        [data-theme="pro-violet"] .text-rose-700 { color: #1f0140 !important; }

        [data-theme="pro-violet"] .hover\:text-rose-400:hover { color: #5b07a3 !important; }
        [data-theme="pro-violet"] .hover\:text-rose-300:hover { color: #6b26b5 !important; }
        [data-theme="pro-violet"] .hover\:text-rose-500:hover { color: #5802ae !important; }

        [data-theme="pro-violet"] .group-hover\/player\:text-rose-400:hover { color: #5b07a3 !important; }
        [data-theme="pro-violet"] .group-hover\:text-rose-400:hover { color: #5b07a3 !important; }

        [data-theme="pro-violet"] .bg-rose-500 { background-color: #5802ae !important; }
        [data-theme="pro-violet"] .bg-rose-600 { background-color: #2c025c !important; }
        [data-theme="pro-violet"] .bg-rose-950 { background-color: #14032c !important; }
        [data-theme="pro-violet"] .bg-rose-950\/40 { background-color: rgba(44, 2, 92, 0.4) !important; }
        [data-theme="pro-violet"] .bg-rose-950\/30 { background-color: rgba(44, 2, 92, 0.3) !important; }
        [data-theme="pro-violet"] .bg-rose-950\/20 { background-color: rgba(44, 2, 92, 0.2) !important; }
        [data-theme="pro-violet"] .bg-rose-950\/10 { background-color: rgba(44, 2, 92, 0.1) !important; }
        [data-theme="pro-violet"] .bg-rose-950\/15 { background-color: rgba(44, 2, 92, 0.15) !important; }
        [data-theme="pro-violet"] .bg-rose-955\/10 { background-color: rgba(44, 2, 92, 0.1) !important; }
        [data-theme="pro-violet"] .bg-rose-500\/10 { background-color: rgba(88, 2, 174, 0.1) !important; }
        [data-theme="pro-violet"] .bg-rose-500\/20 { background-color: rgba(88, 2, 174, 0.2) !important; }
        [data-theme="pro-violet"] .bg-rose-500\/25 { background-color: rgba(88, 2, 174, 0.25) !important; }
        [data-theme="pro-violet"] .bg-rose-600\/20 { background-color: rgba(44, 2, 92, 0.2) !important; }
        [data-theme="pro-violet"] .bg-rose-600\/30 { background-color: rgba(44, 2, 92, 0.3) !important; }

        [data-theme="pro-violet"] .border-rose-500 { border-color: #5802ae !important; }
        [data-theme="pro-violet"] .border-rose-900 { border-color: #1f0140 !important; }
        [data-theme="pro-violet"] .border-rose-500\/30 { border-color: rgba(88, 2, 174, 0.3) !important; }
        [data-theme="pro-violet"] .border-rose-500\/40 { border-color: rgba(88, 2, 174, 0.4) !important; }
        [data-theme="pro-violet"] .border-rose-500\/45 { border-color: rgba(88, 2, 174, 0.45) !important; }
        [data-theme="pro-violet"] .border-rose-500\/50 { border-color: rgba(88, 2, 174, 0.5) !important; }
        [data-theme="pro-violet"] .border-rose-900\/30 { border-color: rgba(44, 2, 92, 0.3) !important; }
        [data-theme="pro-violet"] .border-rose-950\/80 { border-color: rgba(44, 2, 92, 0.8) !important; }
        [data-theme="pro-violet"] .border-rose-950\/40 { border-color: rgba(44, 2, 92, 0.4) !important; }

        [data-theme="pro-violet"] .hover\:border-rose-400:hover { border-color: #5b07a3 !important; }
        [data-theme="pro-violet"] .hover\:border-rose-500\/50:hover { border-color: rgba(88, 2, 174, 0.5) !important; }

        [data-theme="pro-violet"] .focus\:ring-rose-500:focus { --tw-ring-color: #5802ae !important; }

        [data-theme="pro-violet"] .from-rose-600 { --tw-gradient-from: #2c025c !important; --tw-gradient-to: rgba(44, 2, 92, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        [data-theme="pro-violet"] .via-rose-500 { --tw-gradient-to: rgba(88, 2, 174, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), #5802ae, var(--tw-gradient-to) !important; }
        [data-theme="pro-violet"] .to-rose-900 { --tw-gradient-to: #1f0140 !important; }
        [data-theme="pro-violet"] .from-rose-950\/40 { --tw-gradient-from: rgba(44, 2, 92, 0.4) !important; }

        [data-theme="pro-violet"] .drop-shadow-\[0_0_8px_rgba\(244\,63\,94\,0\.8\)\] { filter: drop-shadow(0 0 8px rgba(88, 2, 174, 0.8)) !important; }
        [data-theme="pro-violet"] .shadow-\[0_0_12px_\#f43f5e\] { box-shadow: 0 0 12px #5802ae !important; }

        /* Fan Only Theme Overrides (Royal Blue #006df9) */
        [data-theme="fan-only"] .text-rose-400 { color: #006df9 !important; }
        [data-theme="fan-only"] .text-rose-500 { color: #006df9 !important; }
        [data-theme="fan-only"] .text-rose-650 { color: #006df9 !important; }
        [data-theme="fan-only"] .text-rose-600 { color: #0056c6 !important; }
        [data-theme="fan-only"] .text-rose-300 { color: #338aff !important; }
        [data-theme="fan-only"] .text-rose-200 { color: #66a7ff !important; }
        [data-theme="fan-only"] .text-rose-700 { color: #004094 !important; }

        [data-theme="fan-only"] .hover\:text-rose-400:hover { color: #006df9 !important; }
        [data-theme="fan-only"] .hover\:text-rose-300:hover { color: #338aff !important; }
        [data-theme="fan-only"] .hover\:text-rose-500:hover { color: #006df9 !important; }

        [data-theme="fan-only"] .group-hover\/player\:text-rose-400:hover { color: #006df9 !important; }
        [data-theme="fan-only"] .group-hover\:text-rose-400:hover { color: #006df9 !important; }

        [data-theme="fan-only"] .bg-rose-500 { background-color: #006df9 !important; }
        [data-theme="fan-only"] .bg-rose-600 { background-color: #0056c6 !important; }
        [data-theme="fan-only"] .bg-rose-950 { background-color: #001f47 !important; }
        [data-theme="fan-only"] .bg-rose-950\/40 { background-color: rgba(0, 31, 71, 0.4) !important; }
        [data-theme="fan-only"] .bg-rose-950\/30 { background-color: rgba(0, 31, 71, 0.3) !important; }
        [data-theme="fan-only"] .bg-rose-950\/20 { background-color: rgba(0, 31, 71, 0.2) !important; }
        [data-theme="fan-only"] .bg-rose-950\/10 { background-color: rgba(0, 31, 71, 0.1) !important; }
        [data-theme="fan-only"] .bg-rose-955\/10 { background-color: rgba(0, 31, 71, 0.1) !important; }
        [data-theme="fan-only"] .bg-rose-500\/10 { background-color: rgba(0, 109, 249, 0.1) !important; }
        [data-theme="fan-only"] .bg-rose-500\/20 { background-color: rgba(0, 109, 249, 0.2) !important; }
        [data-theme="fan-only"] .bg-rose-500\/25 { background-color: rgba(0, 109, 249, 0.25) !important; }
        [data-theme="fan-only"] .bg-rose-600\/20 { background-color: rgba(0, 86, 198, 0.2) !important; }
        [data-theme="fan-only"] .bg-rose-600\/30 { background-color: rgba(0, 86, 198, 0.3) !important; }

        [data-theme="fan-only"] .border-rose-500 { border-color: #006df9 !important; }
        [data-theme="fan-only"] .border-rose-900 { border-color: #004094 !important; }
        [data-theme="fan-only"] .border-rose-500\/30 { border-color: rgba(0, 109, 249, 0.3) !important; }
        [data-theme="fan-only"] .border-rose-500\/40 { border-color: rgba(0, 109, 249, 0.4) !important; }
        [data-theme="fan-only"] .border-rose-500\/45 { border-color: rgba(0, 109, 249, 0.45) !important; }
        [data-theme="fan-only"] .border-rose-500\/50 { border-color: rgba(0, 109, 249, 0.5) !important; }
        [data-theme="fan-only"] .border-rose-900\/30 { border-color: rgba(0, 64, 148, 0.3) !important; }
        [data-theme="fan-only"] .border-rose-950\/80 { border-color: rgba(0, 31, 71, 0.8) !important; }
        [data-theme="fan-only"] .border-rose-950\/40 { border-color: rgba(0, 31, 71, 0.4) !important; }

        [data-theme="fan-only"] .hover\:border-rose-400:hover { border-color: #006df9 !important; }
        [data-theme="fan-only"] .hover\:border-rose-500\/50:hover { border-color: rgba(0, 109, 249, 0.5) !important; }

        [data-theme="fan-only"] .focus\:ring-rose-500:focus { --tw-ring-color: #006df9 !important; }

        [data-theme="fan-only"] .from-rose-600 { --tw-gradient-from: #0056c6 !important; --tw-gradient-to: rgba(0, 86, 198, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        [data-theme="fan-only"] .via-rose-500 { --tw-gradient-to: rgba(0, 109, 249, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), #006df9, var(--tw-gradient-to) !important; }
        [data-theme="fan-only"] .to-rose-900 { --tw-gradient-to: #004094 !important; }
        [data-theme="fan-only"] .from-rose-950\/40 { --tw-gradient-from: rgba(0, 31, 71, 0.4) !important; }

        [data-theme="fan-only"] .drop-shadow-\[0_0_8px_rgba\(244\,63\,94\,0\.8\)\] { filter: drop-shadow(0 0 8px rgba(0, 109, 249, 0.8)) !important; }
        [data-theme="fan-only"] .shadow-\[0_0_12px_\#f43f5e\] { box-shadow: 0 0 12px #006df9 !important; }

        /* Targeted Focus Mode Selector Overrides */
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > p:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(7) > div:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(6) > div:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(5) > div:nth-of-type(3) > button:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(4) > span:nth-of-type(1) {
          background-color: #006df9 !important;
          color: #000000 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(2) > div:nth-of-type(1) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > button:nth-of-type(1) {
          background-color: #006df9 !important;
          border-color: #000000 !important;
        }
        [data-theme="fan-only"] > button:nth-of-type(2) > span:nth-of-type(2) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > button:nth-of-type(2) > div:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > button:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > img:nth-of-type(1) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(2) > div:nth-of-type(1) > button:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(2) > div:nth-of-type(2) > button:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(2) > button:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(2) > p:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(3) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(5) > div:nth-of-type(2) > div:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(8) > div:nth-of-type(4) > div:nth-of-type(2) > button:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(9) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(8) > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(9) > div:nth-of-type(3) > div:nth-of-type(2) > button:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(9) > div:nth-of-type(3) > div:nth-of-type(2) > div:nth-of-type(1) > p:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(9) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(1) {
          background-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(9) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(3) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(8) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(3) {
          color: #e06c09 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(8) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(6) > div:nth-of-type(3) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(2) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(6) > div:nth-of-type(3) > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(3) > div:nth-of-type(2) > span:nth-of-type(2) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(6) > div:nth-of-type(3) > div:nth-of-type(2) > div:nth-of-type(5) > div:nth-of-type(1) > span:nth-of-type(2) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(5) > div:nth-of-type(4) > button:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(5) > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(3) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(2) > button:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(3) > button:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(1) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(2) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(3) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > h3:nth-of-type(1) > svg:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(2) > span:nth-of-type(1) {
          color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(4) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(5) {
          border-color: #006df9 !important;
        }
        [data-theme="fan-only"] > div:nth-of-type(4) > div:nth-of-type(4) > div:nth-of-type(3) > div:nth-of-type(6) {
          border-color: #006df9 !important;
        }

        /* Band Neon Green Theme Overrides */
        [data-theme="band"] .text-rose-400,
        [data-theme="band"] .text-rose-500,
        [data-theme="band"] .text-rose-650,
        [data-theme="band"] .text-rose-600,
        [data-theme="band"] .text-rose-300,
        [data-theme="band"] .text-rose-200,
        [data-theme="band"] .text-rose-700,
        [data-theme="band"] .text-purple-300,
        [data-theme="band"] .text-purple-400,
        [data-theme="band"] .text-purple-500,
        [data-theme="band"] .text-[#00ffcc],
        [data-theme="band"] .text-emerald-400,
        [data-theme="band"] .text-cyan-400,
        [data-theme="band"] .text-amber-400,
        [data-theme="band"] .text-orange-400,
        [data-theme="band"] .text-orange-500,
        [data-theme="band"] .text-sky-400,
        [data-theme="band"] .text-fuchsia-400,
        [data-theme="band"] .text-fuchsia-500,
        [data-theme="band"] .text-indigo-400,
        [data-theme="band"] .text-teal-400,
        [data-theme="band"] .text-pink-400,
        [data-theme="band"] .text-blue-400 { color: #39ff14 !important; }

        [data-theme="band"] .hover\:text-rose-400:hover,
        [data-theme="band"] .hover\:text-rose-300:hover,
        [data-theme="band"] .hover\:text-rose-500:hover,
        [data-theme="band"] .hover\:text-purple-400:hover,
        [data-theme="band"] .hover\:text-purple-300:hover,
        [data-theme="band"] .hover\:text-[#39ff14]:hover { color: #39ff14 !important; }

        [data-theme="band"] .group-hover\/player\:text-rose-400:hover,
        [data-theme="band"] .group-hover\:text-rose-400:hover,
        [data-theme="band"] .group-hover\:text-purple-400:hover { color: #39ff14 !important; }

        [data-theme="band"] .bg-rose-500,
        [data-theme="band"] .bg-rose-600,
        [data-theme="band"] .bg-purple-600,
        [data-theme="band"] .bg-purple-500,
        [data-theme="band"] .bg-emerald-500,
        [data-theme="band"] .bg-cyan-600,
        [data-theme="band"] .bg-[#00ffcc],
        [data-theme="band"] .bg-rose-500\/20,
        [data-theme="band"] .bg-rose-500\/10,
        [data-theme="band"] .bg-rose-500\/25,
        [data-theme="band"] .bg-rose-600\/20,
        [data-theme="band"] .bg-rose-600\/30,
        [data-theme="band"] .bg-purple-950\/40,
        [data-theme="band"] .bg-purple-950\/70,
        [data-theme="band"] .bg-emerald-950\/40,
        [data-theme="band"] .bg-cyan-950\/40,
        [data-theme="band"] .bg-rose-950\/40,
        [data-theme="band"] .bg-rose-950\/30,
        [data-theme="band"] .bg-rose-950\/20,
        [data-theme="band"] .bg-rose-950\/10,
        [data-theme="band"] .bg-rose-950\/15,
        [data-theme="band"] .bg-rose-955\/10 { background-color: rgba(57, 255, 20, 0.15) !important; color: #39ff14 !important; }

        /* Solid buttons */
        [data-theme="band"] button.bg-rose-600,
        [data-theme="band"] button.bg-purple-600,
        [data-theme="band"] button.bg-emerald-600,
        [data-theme="band"] button.bg-emerald-500,
        [data-theme="band"] button.bg-cyan-600,
        [data-theme="band"] button.bg-[#00ffcc],
        [data-theme="band"] button.bg-[#39ff14] { background-color: #39ff14 !important; color: #000000 !important; font-weight: 900 !important; }

        [data-theme="band"] .border-rose-500,
        [data-theme="band"] .border-rose-900,
        [data-theme="band"] .border-purple-500,
        [data-theme="band"] .border-purple-900,
        [data-theme="band"] .border-rose-500\/30,
        [data-theme="band"] .border-rose-500\/40,
        [data-theme="band"] .border-rose-500\/45,
        [data-theme="band"] .border-rose-500\/50,
        [data-theme="band"] .border-rose-900\/30,
        [data-theme="band"] .border-rose-950\/80,
        [data-theme="band"] .border-rose-950\/40,
        [data-theme="band"] .border-purple-900\/50,
        [data-theme="band"] .border-emerald-500\/30,
        [data-theme="band"] .border-cyan-500\/30,
        [data-theme="band"] .border-zinc-800,
        [data-theme="band"] .border-zinc-700 { border-color: rgba(57, 255, 20, 0.3) !important; }

        [data-theme="band"] .hover\:border-rose-400:hover,
        [data-theme="band"] .hover\:border-purple-400:hover,
        [data-theme="band"] .hover\:border-[#39ff14]\/50:hover { border-color: #39ff14 !important; }

        [data-theme="band"] .focus\:ring-rose-500:focus,
        [data-theme="band"] .focus\:ring-purple-500:focus,
        [data-theme="band"] .focus\:ring-[#39ff14]:focus { --tw-ring-color: #39ff14 !important; }

        [data-theme="band"] .from-rose-600,
        [data-theme="band"] .from-purple-600 { --tw-gradient-from: #39ff14 !important; --tw-gradient-to: rgba(57, 255, 20, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        [data-theme="band"] .via-rose-500,
        [data-theme="band"] .via-purple-500 { --tw-gradient-to: rgba(57, 255, 20, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), #39ff14, var(--tw-gradient-to) !important; }
        [data-theme="band"] .to-rose-900,
        [data-theme="band"] .to-purple-900 { --tw-gradient-to: rgba(57, 255, 20, 0.1) !important; }
        [data-theme="band"] .from-rose-950\/40,
        [data-theme="band"] .from-purple-950\/40 { --tw-gradient-from: rgba(57, 255, 20, 0.2) !important; }

        [data-theme="band"] .drop-shadow-\[0_0_8px_rgba\(244\,63\,94\,0\.8\)\] { filter: drop-shadow(0 0 8px rgba(57, 255, 20, 0.8)) !important; }
        [data-theme="band"] .shadow-\[0_0_12px_\#f43f5e\],
        [data-theme="band"] .shadow-\[0_0_15px_rgba\(168\,85\,247\,0\,1\)\],
        [data-theme="band"] .shadow-\[0_0_8px_rgba\(168\,85\,247\,0\.3\)\] { box-shadow: 0 0 12px rgba(57, 255, 20, 0.45) !important; }

        /* Force Lucide and other SVGs to neon green where applicable */
        [data-theme="band"] svg {
          stroke: #39ff14 !important;
        }
        [data-theme="band"] svg path {
          stroke: #39ff14 !important;
        }
        [data-theme="band"] button {
          border-color: rgba(57, 255, 20, 0.3) !important;
        }
        [data-theme="band"] .bg-purple-950\/20 {
          background-color: rgba(57, 255, 20, 0.1) !important;
        }
        [data-theme="band"] .border-purple-900\/40 {
          border-color: rgba(57, 255, 20, 0.3) !important;
        }
      `}</style>
      {children}
    </div>
  );
};
