import React, { useState } from 'react';
import { 
  ArrowLeft, ChevronLeft,
  Shield, 
  Database, 
  CreditCard, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Terminal, 
  Check, 
  Share2, 
  Scale, 
  ChevronDown, 
  ChevronUp,
  UserCheck,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TermsOfServiceViewProps {
  onBack: () => void;
  triggerNotification?: (msg: string) => void;
}

export default function TermsOfServiceView({ onBack, triggerNotification }: TermsOfServiceViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'terms' | 'privacy'>('terms');
  
  // Accordion state
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Full Terms Modal Simulator
  const [showFullContract, setShowFullContract] = useState(false);

  // User consent interactive checkbox (saving dynamically in memory/localStorage for fun interactivity)
  const [hasAgreed, setHasAgreed] = useState(() => {
    return localStorage.getItem('nexus_core_tos_agreed') === 'true';
  });
  const [signature, setSignature] = useState(() => {
    return localStorage.getItem('nexus_core_tos_signature') || '';
  });

  const handleAgreeToggle = () => {
    const nextVal = !hasAgreed;
    setHasAgreed(nextVal);
    localStorage.setItem('nexus_core_tos_agreed', String(nextVal));
    if (triggerNotification) {
      triggerNotification(nextVal ? 'Agreed to Terms & Conditions!' : 'Agreement revoked.');
    }
  };

  const handleSaveSignature = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nexus_core_tos_signature', signature);
    if (triggerNotification) {
      triggerNotification(signature.trim() ? `Consent signed as "${signature}"` : 'Signature cleared');
    }
  };

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] text-zinc-100 font-sans">
      {/* Floating Back Button */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-[100]">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-red-500/20 hover:border-red-500/50 bg-black/85 flex items-center justify-center transition-all hover:bg-zinc-900 text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group"
          title="Go Back"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#11131a] border-b border-zinc-850 sticky top-0 z-20 shadow-lg pl-16 md:pl-20">
        <span className="font-display font-bold text-base text-white tracking-wide">Legal Center</span>
      </div>

      {/* Styled Brand Hero Banner */}
      <div className="relative px-5 py-8 bg-gradient-to-b from-[#11131a] to-[#07090e] border-b border-zinc-900 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#00ffd2]/10 blur-[85px] pointer-events-none rounded-full"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full mb-3">
          <Shield className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-teal-300">Compliance & Security</span>
        </div>

        <h1 className="text-3xl font-display font-black text-[#00ffd2] tracking-normal">
          Nexus Core
        </h1>
        
        <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
          The ultimate full-stack touring ecosystem, ticketing hub, merchandise tracker, and real-time revenue split settlement engine.
        </p>

        {/* Dynamic Dual Tab Bar */}
        <div className="flex bg-[#12151c] p-1 rounded-xl border border-zinc-850 max-w-xs mx-auto mt-6">
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'terms' 
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-400/10 border border-teal-400/30 text-[#00ffd2]' 
                : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'privacy' 
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-400/10 border border-teal-400/30 text-[#00ffd2]' 
                : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Main Legal Content Container */}
      <div className="flex-grow p-5 space-y-6">
        
        {activeSubTab === 'terms' ? (
          <div className="space-y-4">
            {/* Version Metadata Tag */}
            <div className="flex items-center justify-between bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-900">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-zinc-455" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Last Updated</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-200 font-bold">June 26, 2026</span>
            </div>

            {/* Premium Accordion Chapters */}
            <div className="space-y-3">
              
              {/* Section 1 */}
              <div className="bg-[#10131a] border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleSection(1)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                      <Database className="w-4 h-4 text-[#00ffd2]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">01 / Storage</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Your Data is Yours</h3>
                    </div>
                  </div>
                  {expandedSection === 1 ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {(expandedSection === 1 || expandedSection === null) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-900/60 bg-zinc-950/40"
                    >
                      <p className="p-4 text-xs text-zinc-300 leading-relaxed">
                        You own every sale, inventory count, tour date, ticket manifest, and venue sheet you put into this app. We don't own your business; we just provide the high-performance routing to help you run and scale it. Your business metrics deserve strict confidentiality.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section 2 */}
              <div className="bg-[#10131a] border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleSection(2)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                      <Scale className="w-4 h-4 text-[#00ffd2]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">02 / Ledger</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Settlements & Revenue Splits</h3>
                    </div>
                  </div>
                  {expandedSection === 2 ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {(expandedSection === 2 || expandedSection === null) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Accuracy of Splits</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Our system routes payouts based on the percentages you define. You are solely responsible for ensuring payout ratios between venues, promoters, and freelancers are mathematically correct prior to settlement.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Not a Bank</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Nexus Core provides settlement routing ledgers and tokenized distributions via third-party processors. We do not hold your funds, act as an escrow agent, or represent a financial banking institution.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Platform Fees & Settlement</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Standard freelancer contracts and creative projects/jobs execute with a strict 7.77% platform routing and settlement fee on gross transaction volume or completed creative earnings, unless overridden by a custom label/venue agreement.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section 3 */}
              <div className="bg-[#10131a] border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleSection(3)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-[#00ffd2]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">03 / Access</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Subscription Billing</h3>
                    </div>
                  </div>
                  {expandedSection === 3 ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {(expandedSection === 3 || expandedSection === null) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Billing Cycles</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">You'll be billed based on your selected tier (e.g., Independent / Corporate Label). Cancel at any time without locking agreements. We generally don't offer refunds for partial cycles already completed.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Limits</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Your tier settings determine how many "Active Tours" or "Collaborators" (like bandmates / road managers) can share write-permissions.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section 4 */}
              <div className="bg-[#10131a] border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleSection(4)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-[#00ffd2]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">04 / Road Test</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Road Reality & Liability</h3>
                    </div>
                  </div>
                  {expandedSection === 4 ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {(expandedSection === 4 || expandedSection === null) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-amber-500 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-205 font-bold">"As-Is" System</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">We strive for 100% uptime, but we are not liable for lost sales due to app hiccups, dead smartphone batteries, or your drummer accidentally dropping the iPad off the merch desk.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-amber-500 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-205 font-bold">Offline Sync Duty</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">We cache your transactions in the local container sandbox when the venue's underground basement has no network, but it's your responsibility to trigger a real sync once you get back above ground.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section 5 */}
              <div className="bg-[#10131a] border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleSection(5)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-[#00ffd2]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">05 / Conduct</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Respect the Gear</h3>
                    </div>
                  </div>
                  {expandedSection === 5 ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>

                <AnimatePresence initial={false}>
                  {(expandedSection === 5 || expandedSection === null) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">No Funny Business</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Don't try to hack, slide scripts, scrape data pipelines, or reverse-engineer Nexus Core's engines.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-teal-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Tax & Accounting Compliance</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">You remain fully responsible for filing and reporting your own regional venue, state, and merchandise sales taxes. Nexus Core is an informative ledger platform only.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Quick Interactive Agreement Card */}
            <div className="bg-gradient-to-br from-[#12151c] to-[#0c0e13] border-2 border-teal-400/20 rounded-2xl p-4 mt-2 space-y-3 shadow-md">
              <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest block mb-2">Consent Checklist</span>
              
              <button 
                onClick={handleAgreeToggle}
                className="flex items-start gap-3 w-full p-2.5 bg-zinc-950/50 hover:bg-zinc-950/80 rounded-xl transition-all border border-zinc-850 cursor-pointer text-left"
              >
                <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                  hasAgreed 
                    ? 'bg-teal-400 border-teal-400 text-black' 
                    : 'border-zinc-700 bg-transparent'
                }`}>
                  {hasAgreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs text-zinc-200 font-bold block">I accept the Terms, platform fees & Road conditions</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Permits local cookie caches, analytics streams, acceptance of the 7.77% platform fee for completed creative projects/jobs, and background query syncing.</p>
                </div>
              </button>

              <form onSubmit={handleSaveSignature} className="space-y-2 pt-1.5 border-t border-zinc-900">
                <label className="block text-[9px] font-mono text-zinc-400 uppercase">Manager Signature</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="e.g. touring_manager_xx"
                    className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-teal-400"
                  />
                  <button 
                    type="submit"
                    className="bg-teal-400/10 hover:bg-teal-400/20 text-[#00ffd2] border border-teal-400/30 font-mono px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer"
                  >
                    Bind
                  </button>
                </div>
              </form>
            </div>

            {/* Direct legal sub-links */}
            <div className="pt-3 flex flex-col items-center justify-center gap-2">
              <button
                onClick={() => setShowFullContract(true)}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer font-sans transition-all"
              >
                Click here to read the full Legal Terms of Service
              </button>
              
              <button
                onClick={() => setActiveSubTab('privacy')}
                className="text-xs text-zinc-500 hover:text-[#00ffd2] cursor-pointer font-sans transition-all"
              >
                View our Privacy Policy
              </button>
            </div>

          </div>
        ) : (
          <div className="space-y-4">
            
            {/* PRIVACY POLICY VIEW SECTION */}
            <div className="bg-[#10131a] border border-zinc-850 rounded-2xl p-4.5 space-y-4 leading-relaxed">
              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <Lock className="w-5 h-5 text-[#00ffd2]" />
                <h3 className="font-display font-black text-white text-base">Privacy Shield</h3>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-300">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-teal-400">1. Data Minimization</h4>
                  <p className="mt-1">We collect only details necessary to compute tour statistics: sale values, inventory quantities, and basic venue tax parameters to output calculations. Your passwords stay salted with crypto hash chains.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-teal-400">2. Local Storage First</h4>
                  <p className="mt-1">All catalog details are cached in your local sandbox container to avoid exposure. Only synced datasets hit our live clusters securely over SSL connections.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-teal-400">3. Integrity Controls</h4>
                  <p className="mt-1">Your ledger streams are private. We do not sell analytics or tour gross receipts to third-party labels, corporate promoters, or booking agencies.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-teal-400" /> SSL Status</div>
                <span className="text-[#00ffd2] font-bold">COMPLIANT (256-BIT)</span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setActiveSubTab('terms')}
                className="text-xs text-zinc-400 hover:text-[#00ffd2] underline cursor-pointer"
              >
                Return to Terms of Service Controls
              </button>
            </div>

          </div>
        )}

      </div>

      {/* FULL DETAILED CONTRACT SIMULATOR DIALOG OVERLAY */}
      <AnimatePresence>
        {showFullContract && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0e1117] border border-zinc-800 rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="bg-[#12151c] p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-400" />
                  <span className="font-display font-bold text-xs text-white uppercase tracking-wider">Universal Terms Contract</span>
                </div>
                <button 
                  onClick={() => setShowFullContract(false)}
                  className="text-zinc-500 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 flex-grow overflow-y-auto text-[10px] text-zinc-400 font-mono space-y-3 leading-relaxed">
                <p className="text-zinc-300 font-bold">NEXUS CORE ON-THE-ROAD GENERAL SERVICE LICENSE AGREEMENT</p>
                <p>1. DEFINITIONS. "Tour" means scheduled serial performances in discrete geographical municipalities. "Table stock" means immediate physical items available for terminal redemption at venue portals. "Van stock" means high-level master holdings.</p>
                <p>2. GRANT OF SERVICE. Licensee receives standard non-transferable authority to record transaction logs of items sold.</p>
                <p>3. INTELLECTUAL REALMS. Brand marks, vector layouts, algorithmic sync counters, and CSS asset classes are exclusive property of Nexus Core dev divisions.</p>
                <p>4. WARRANTY DISCLAIMER. PLATFORM IS DELIVERED "AS-IS" AND "WITH ALL FAULTS" TO THE MAXIMUM DEGREE PERMISSIBLE BY REGIONAL LAW. WE REJECT LIABILITY FOR DISCREPANCIES OR ADVERSE CONVERSIONS AT HIGH-VOLUME SETTLEMENT DEPOSITS.</p>
              </div>

              <div className="p-3 bg-[#11131a] border-t border-zinc-850 flex justify-end">
                <button
                  onClick={() => {
                    setShowFullContract(false);
                    if (!hasAgreed) handleAgreeToggle();
                  }}
                  className="bg-teal-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider shadow-lg shadow-teal-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  Confirm & Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-6 text-center text-[10px] text-zinc-650 font-mono">
        Nexus Core Legal Engine • Secured Locally
      </div>
    </div>
  );
}
