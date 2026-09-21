import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Smartphone, 
  Share, 
  PlusSquare, 
  ShieldCheck, 
  Download, 
  HelpCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface InstallInstructionsAccordionProps {
  className?: string;
  defaultOpen?: boolean;
}

export const InstallInstructionsAccordion: React.FC<InstallInstructionsAccordionProps> = ({
  className = '',
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>('android');

  return (
    <div className={`w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md overflow-hidden transition-all duration-200 ${isOpen ? 'border-zinc-700 shadow-xl shadow-black/60' : 'hover:border-zinc-700/80'} ${className}`}>
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 px-4 flex items-center justify-between text-left cursor-pointer group select-none transition-colors hover:bg-zinc-900/50"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-[#00ffcc] group-hover:border-[#00ffcc]/40 transition-colors flex-shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-zinc-200 group-hover:text-white tracking-wide flex items-center gap-1.5 truncate">
              <span>Installation Guide</span>
              <span className="text-[10px] font-mono font-normal text-zinc-400 hidden sm:inline">• Android & iOS</span>
            </span>
            <span className="text-[9.5px] font-mono text-zinc-400">
              {isOpen ? 'Tap to collapse instructions' : 'How to install on Android & iPhone'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300 hidden xs:inline">
            {isOpen ? 'Close' : 'View'}
          </span>
          <div className={`w-5 h-5 rounded-md bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00ffcc]' : ''}`}>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>

      {/* Accordion Expanded Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-zinc-900"
          >
            <div className="p-3.5 sm:p-4 space-y-3.5 bg-zinc-950/95">
              {/* Platform Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setActivePlatform('android')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === 'android'
                      ? 'bg-gradient-to-r from-[#00ffcc]/20 to-emerald-500/20 text-[#00ffcc] border border-[#00ffcc]/50 shadow-[0_0_12px_rgba(0,255,204,0.15)]'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#00ffcc]" />
                  <span>Android (APK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePlatform('ios')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === 'ios'
                      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-sky-300 border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Share className="w-3.5 h-3.5 text-sky-400" />
                  <span>iPhone / iOS</span>
                </button>
              </div>

              {/* Android Instructions Panel */}
              {activePlatform === 'android' && (
                <motion.div
                  key="android-instructions"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00ffcc] flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3" />
                      For Android Users (Full Native Experience)
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">Direct APK</span>
                  </div>

                  <div className="space-y-2">
                    {/* Step 1 */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="w-5 h-5 rounded-full bg-[#00ffcc]/15 border border-[#00ffcc]/40 text-[#00ffcc] font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Tap the Download Button
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5">
                          Click the Android APK download link above.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="w-5 h-5 rounded-full bg-[#00ffcc]/15 border border-[#00ffcc]/40 text-[#00ffcc] font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Allow Installation
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5">
                          If your phone prompts you with a security warning about installing from an unknown source, tap <span className="text-white font-semibold">Settings</span> and toggle <span className="text-[#00ffcc] font-semibold">"Allow from this source"</span> (this is safe—it's coming directly from your secure server).
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="w-5 h-5 rounded-full bg-[#00ffcc]/15 border border-[#00ffcc]/40 text-[#00ffcc] font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Install & Open
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5">
                          Tap <span className="text-white font-semibold">Install</span> when prompted, and your custom app icon will appear right on your home screen.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* iOS Instructions Panel */}
              {activePlatform === 'ios' && (
                <motion.div
                  key="ios-instructions"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                      <Share className="w-3 h-3" />
                      For iPhone / iOS Users (Web App / PWA Experience)
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">Safari PWA</span>
                  </div>

                  <div className="space-y-2">
                    {/* Step 1 */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="w-5 h-5 rounded-full bg-sky-400/15 border border-sky-400/40 text-sky-400 font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Tap the Share Button
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5">
                          Look at the bottom toolbar in Safari and tap the <span className="text-white font-semibold">Share</span> icon (the square with an arrow pointing up).
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="w-5 h-5 rounded-full bg-sky-400/15 border border-sky-400/40 text-sky-400 font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Add to Home Screen
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5">
                          Scroll down the menu and select <span className="text-sky-300 font-semibold">"Add to Home Screen"</span>.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="w-5 h-5 rounded-full bg-sky-400/15 border border-sky-400/40 text-sky-400 font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Launch
                        </span>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5">
                          Tap <span className="text-white font-semibold">Add</span>, and the app icon will lock onto your home screen for a full-screen app experience.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bottom security assurance */}
              <div className="pt-1 flex items-center justify-center gap-2 text-[9.5px] font-mono text-zinc-400 text-center">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Direct Distribution • 100% Encrypted & Safe</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default InstallInstructionsAccordion;
