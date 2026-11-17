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
  Calendar,
  Users,
  Film,
  Music,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TermsOfServiceViewProps {
  onBack: () => void;
  triggerNotification?: (msg: string) => void;
  isRegistrationModal?: boolean;
  onAgreeAndAccept?: () => void;
  onDeclineAndExit?: () => void;
}

export default function TermsOfServiceView({ 
  onBack, 
  triggerNotification,
  isRegistrationModal = false,
  onAgreeAndAccept,
  onDeclineAndExit,
}: TermsOfServiceViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'terms' | 'privacy'>('terms');
  
  // Accordion state
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Full Terms Modal Simulator
  const [showFullContract, setShowFullContract] = useState(false);

  // User consent interactive checkbox
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
          className="w-10 h-10 rounded-full border border-emerald-500/30 hover:border-emerald-500/60 bg-black/85 flex items-center justify-center transition-all hover:bg-zinc-900 text-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer group"
          title="Go Back"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#11131a] border-b border-zinc-850 sticky top-0 z-20 shadow-lg pl-16 md:pl-20">
        <span className="font-display font-bold text-base text-white tracking-wide">Legal & Compliance Center</span>
      </div>

      {/* Styled Brand Hero Banner */}
      <div className="relative px-5 py-8 bg-gradient-to-b from-[#11131a] to-[#07090e] border-b border-zinc-900 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 blur-[85px] pointer-events-none rounded-full"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
          <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-300">Updated Compliance & Security Standard</span>
        </div>

        <h1 className="text-3xl font-display font-black text-emerald-400 tracking-normal">
          Nexus Core
        </h1>
        
        <p className="text-xs text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed font-sans">
          The full-stack music industry ecosystem, tour routing engine, ticketing hub, merchandise manager, media portal, and automated revenue split settlement platform.
        </p>

        {/* Dynamic Dual Tab Bar */}
        <div className="flex bg-[#12151c] p-1 rounded-xl border border-zinc-850 max-w-xs mx-auto mt-6">
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'terms' 
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-400/30 text-emerald-300' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'privacy' 
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-400/30 text-emerald-300' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Main Legal Content Container */}
      <div className="flex-grow p-5 space-y-6 max-w-3xl mx-auto w-full">
        
        {activeSubTab === 'terms' ? (
          <div className="space-y-4">
            {/* Version Metadata Tag */}
            <div className="flex items-center justify-between bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-900">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Effective Date</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">September 29, 2026 (v3.5 Multi-Portal)</span>
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
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">01 / Workspaces</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Multi-Role Platform Workspaces & Identity</h3>
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
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3.5 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Industry Portals</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Nexus Core authorizes specialized workspaces for Bands & Artists, Promoters & Venues, Record Labels, Creative Freelancers (Producers, Photographers, Merch Designers), and Fan Archivists. You are responsible for maintaining account access credentials and workspace authorization levels.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Data Ownership</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">You retain full ownership of your tour dates, inventory manifests, revenue ledgers, roster sheets, and creative contracts created within your account.</p>
                        </div>
                      </div>
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
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">02 / Financials</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Settlements, Split Ledgers & 7.77% Platform Fee</h3>
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
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3.5 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Automated Revenue Split Routing</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Payout splits between artists, venue managers, booking agents, and creative contractors execute according to user-defined ratios. Users are responsible for confirming mathematical accuracy prior to finalizing settlements.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">7.77% Creative Contract Settlement Fee</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Standard freelancer gig contracts, creative services, and artwork jobs processed through the platform carry a 7.77% routing and settlement fee on completed transaction volume, unless exempted by custom enterprise agreements.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Not a Banking Institution</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Nexus Core provides informational settlement ledgers and payment gateway integrations (e.g. Stripe, PayPal). Nexus Core is not a bank, escrow firm, or credit union.</p>
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
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <Film className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">03 / Media</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Media Uploads, Clips & Copyright Integrity</h3>
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
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3.5 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">User-Generated Media License</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">You retain copyright in all original audio tracks, video clips, concert photography, setlist images, and artwork uploaded to Nexus Core. By uploading, you grant the platform a non-exclusive license to stream and display the media as directed by your privacy settings.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Zero Tolerance Copyright Policy</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Uploading bootleg audio, unauthorized commercial video footage, or copyrighted works without rights is strictly prohibited and subject to immediate content removal under DMCA guidelines.</p>
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
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <Music className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">04 / Archives</span>
                      <h3 className="text-sm font-display font-extrabold text-white">Community Archives & Band Handover Rights</h3>
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
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3.5 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Fan-Curated Archives</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Fan archivists may curate historical discographies and band profiles. All community profile data is maintained with strict data preservation standards.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">100% Data Preservation Handover</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Official band members and authorized band representatives retain the absolute right to claim their official band profile at any time. Claiming a band preserves 100% of existing discography, artwork, and follower history.</p>
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
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">05 / Performance</span>
                      <h3 className="text-sm font-display font-extrabold text-white">System Availability & Offline Sync Duty</h3>
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
                      className="border-t border-zinc-900/60 bg-zinc-950/40 divide-y divide-zinc-900/40 p-3.5 space-y-2.5"
                    >
                      <div className="flex gap-2.5 items-start text-xs pt-1">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">"As-Is" Software Provision</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">The platform is provided on an "as-is" and "as-available" basis. While we maintain high availability and real-time database synchronization, users are encouraged to maintain local backups of critical tour logistics.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start text-xs pt-2">
                        <span className="text-emerald-400 font-bold select-none">•</span>
                        <div>
                          <p className="text-zinc-200 font-bold">Offline Storage Caching</p>
                          <p className="text-zinc-400 mt-0.5 leading-normal">Transactions conducted in offline venue environments cache locally in your device sandbox. It is the user's responsibility to reconnect to a network to trigger cloud reconciliation.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Quick Interactive Agreement Card */}
            <div className="bg-gradient-to-br from-[#12151c] to-[#0c0e13] border-2 border-emerald-500/20 rounded-2xl p-4 mt-2 space-y-3 shadow-md">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">Consent Checklist</span>
              
              <button 
                onClick={handleAgreeToggle}
                className="flex items-start gap-3 w-full p-2.5 bg-zinc-950/50 hover:bg-zinc-950/80 rounded-xl transition-all border border-zinc-850 cursor-pointer text-left"
              >
                <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                  hasAgreed 
                    ? 'bg-emerald-400 border-emerald-400 text-black' 
                    : 'border-zinc-700 bg-transparent'
                }`}>
                  {hasAgreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs text-zinc-200 font-bold block">I accept the Terms of Service & Platform Guidelines</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Includes acceptance of the 7.77% platform fee for completed creative projects, media copyright rules, multi-portal workspace conduct, and local storage sync.</p>
                </div>
              </button>

              <form onSubmit={handleSaveSignature} className="space-y-2 pt-1.5 border-t border-zinc-900">
                <label className="block text-[9px] font-mono text-zinc-400 uppercase">Manager / Member Digital Signature</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="e.g. touring_manager_signature"
                    className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer"
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
                Click here to read the full Legal Terms of Service Contract
              </button>
              
              <button
                onClick={() => setActiveSubTab('privacy')}
                className="text-xs text-zinc-500 hover:text-emerald-400 cursor-pointer font-sans transition-all"
              >
                View our Privacy Policy
              </button>
            </div>

          </div>
        ) : (
          <div className="space-y-4">
            
            {/* PRIVACY POLICY VIEW SECTION */}
            <div className="bg-[#10131a] border border-zinc-850 rounded-2xl p-5 space-y-4 leading-relaxed">
              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-black text-white text-base">Privacy Shield & Data Protection Standards</h3>
              </div>

              <div className="space-y-4 text-xs text-zinc-300">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-emerald-400">1. Data Minimization & Encryption</h4>
                  <p className="mt-1 leading-normal">We collect only details necessary to operate your tour routing, inventory management, ticket sales, and social feed. Account passwords are encrypted using salted crypto hashes. All network transmissions use 256-bit SSL encryption.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-emerald-400">2. Zero-Selling Commitment</h4>
                  <p className="mt-1 leading-normal">Your financial metrics, merchandise inventory, gross tour receipts, and personal data are strictly private. We never sell or lease user data to third-party ad networks, corporate booking agencies, or data brokers.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-emerald-400">3. Media & Location Services</h4>
                  <p className="mt-1 leading-normal">Location parameters are used solely to compute event proximity for gig alerts and map discovery. You control the visibility of uploaded photos, video clips, and profile details in your workspace privacy settings.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider text-emerald-400">4. Local Sandbox Caching</h4>
                  <p className="mt-1 leading-normal">Tour logistics and transaction drafts cache securely in your device's local container sandbox to enable uninterrupted offline venue performance.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Encryption Status</div>
                <span className="text-emerald-400 font-bold">256-BIT SSL PROTECTED</span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setActiveSubTab('terms')}
                className="text-xs text-zinc-400 hover:text-emerald-400 underline cursor-pointer"
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
                  <Scale className="w-4 h-4 text-emerald-400" />
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
                  className="bg-emerald-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  Confirm & Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Modal Sticky Footer Bar */}
      {isRegistrationModal ? (
        <div className="sticky bottom-0 z-50 bg-[#0f121a]/95 backdrop-blur-md border-t border-emerald-500/30 p-4 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto w-full rounded-t-2xl">
          <div className="text-left">
            <span className="text-xs font-bold text-white block">Registration Agreement Standard</span>
            <span className="text-[10px] text-zinc-400 font-mono">By accepting, you agree to all Terms & Privacy Shield policies.</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (onDeclineAndExit) {
                  onDeclineAndExit();
                } else {
                  onBack();
                }
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
            >
              Decline & Exit
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('nexus_core_tos_agreed', 'true');
                setHasAgreed(true);
                if (onAgreeAndAccept) {
                  onAgreeAndAccept();
                } else {
                  onBack();
                }
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            >
              Agree & Accept Terms
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-[10px] text-zinc-600 font-mono">
          Nexus Core Legal Engine • Secured Locally
        </div>
      )}
    </div>
  );
}
