import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  Terminal, 
  Cpu, 
  Check, 
  HelpCircle,
  X,
  Loader
} from 'lucide-react';
import { SubscriptionTier, UserProfile } from '../types';
import { getSupabase } from '../supabase';

interface PremiumGateProps {
  currentTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
  featureName?: string;
  onUpgradeSuccess?: (newTier: SubscriptionTier) => void;
  children: React.ReactNode;
}

const TIER_WEIGHTS: Record<SubscriptionTier, number> = {
  free_for_life: 0,
  power_user_pro: 1,
  touring_pro: 1,
  touring_pro_plus: 2,
  enterprise_circuit: 3,
  per_show: 0,
  per_tour: 0,
  local_booking_agent: 1,
  regional_talent_buyer: 2,
  enterprise_network: 3,
  single_festival_pass: 0
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free_for_life: 'FREE FOR LIFE',
  power_user_pro: 'POWER-USER PRO CONSOLE',
  touring_pro: 'TOURING PRO',
  touring_pro_plus: 'TOURING PRO+',
  enterprise_circuit: 'ENTERPRISE CIRCUIT',
  per_show: 'PER SHOW PASS',
  per_tour: 'PER TOUR PASS',
  local_booking_agent: 'LOCAL BOOKING AGENT',
  regional_talent_buyer: 'REGIONAL TALENT BUYER',
  enterprise_network: 'ENTERPRISE NETWORK',
  single_festival_pass: 'SINGLE FESTIVAL PASS'
};

const TIER_PRICE: Record<SubscriptionTier, string> = {
  free_for_life: '$0',
  power_user_pro: '$29/mo',
  touring_pro: '$19.99/mo',
  touring_pro_plus: '$39.99/mo',
  enterprise_circuit: '$99/mo',
  per_show: '$5.99/show',
  per_tour: '$49.99/tour',
  local_booking_agent: '$29.99/mo',
  regional_talent_buyer: '$74.99/mo',
  enterprise_network: '$149.99/mo',
  single_festival_pass: '$29.99/pass'
};

export default function PremiumGate({
  currentTier = 'free_for_life',
  requiredTier = 'power_user_pro',
  featureName = 'ADVANCED_ANALYTICAL_MATRIX',
  onUpgradeSuccess,
  children
}: PremiumGateProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [successUpgraded, setSuccessUpgraded] = useState(false);

  const activeWeight = TIER_WEIGHTS[currentTier] !== undefined ? TIER_WEIGHTS[currentTier] : 0;
  const targetWeight = TIER_WEIGHTS[requiredTier] !== undefined ? TIER_WEIGHTS[requiredTier] : 1;

  // Access validation evaluation
  const hasAccess = activeWeight >= targetWeight;

  if (hasAccess) {
    return <>{children}</>;
  }

  const addTerminalLog = (msg: string, delay: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, `[SYS_ENG] ${msg}`]);
        resolve();
      }, delay);
    });
  };

  const executeUpgradeHandshake = async () => {
    setIsProcessing(true);
    setTerminalLogs([]);
    
    await addTerminalLog('INITIALIZING TRANS-NODE CONNECTION TO GATEWAY...', 200);
    await addTerminalLog('RESOLVING LOCAL PROFILE AUTH STATE...', 300);
    await addTerminalLog(`TARGET UPGRADE IDENTIFIER: [${requiredTier.toUpperCase()}]`, 250);
    await addTerminalLog('CONTACTING STRIPE INTEGRATION ROUTER...', 350);
    await addTerminalLog('PAYMENT TOKEN ACQUIRED. PERFORMING CRYPTOGRAPHIC HANDSHAKE...', 300);
    await addTerminalLog('TRANSACTION AUTHORIZED BY CARD DEPLOYMENT TERMINOUS: SUCCESS', 400);
    await addTerminalLog('MUTATING DATABASE PROFILE SCHEMA RECORDS...', 250);

    try {
      // 1. Fetch current profile from localStorage
      const profileStr = localStorage.getItem('nexus_core_user_profile');
      let profile: UserProfile | null = null;
      if (profileStr) {
        profile = JSON.parse(profileStr);
      }

      const updatedTier: SubscriptionTier = requiredTier;
      
      const updatedProfile: UserProfile = {
        ...profile,
        name: profile?.name || 'Power User Promoters',
        email: profile?.email || 'promoter@nexuscore.fm',
        role: profile?.role || 'Promoter',
        sub_tier: updatedTier,
        subscription_status: 'active',
        stripe_customer_id: profile?.stripe_customer_id || `cus_mock_${Math.random().toString(36).substring(2, 10)}`,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        allowed_workspaces: profile?.allowed_workspaces || ['band', 'promoter', 'creative']
      };

      // 2. Persist updated configuration in local device cache
      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updatedProfile));

      // 3. Persist to server database if profile ID is matching Supabase database schema
      const supabase = getSupabase();
      if (supabase && profile?.id && !profile.id.startsWith('profile_')) {
        await addTerminalLog(`SYNCING TIER TO PERSISTENT CLOUD TABLE (profile: ${profile.id})...`, 100);
        const { error } = await supabase
          .from('profiles')
          .update({
            sub_tier: updatedTier,
            subscription_status: 'active',
            stripe_customer_id: updatedProfile.stripe_customer_id,
            current_period_end: updatedProfile.current_period_end
          })
          .eq('id', profile.id);

        if (error) {
          await addTerminalLog(`WARNING DB-SYNC: ${error.message}. Local persistence remains active.`, 100);
        } else {
          await addTerminalLog('CLOUD SCHEMA SINCHRONIZED GATES INSTANTLY UNLOCKED.', 100);
        }
      }

      await addTerminalLog('DISPATCHING SYSTEM-WIDE METADATA RE-MUTATION EVENT...', 150);
      
      // Dispatch custom event to notify parent App state immediately
      window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updatedProfile }));
      
      if (onUpgradeSuccess) {
        onUpgradeSuccess(updatedTier);
      }

      await addTerminalLog('SECURE ACCESS PRIVILEGES BROADCAST: LEVEL GRANTED.', 200);
      setSuccessUpgraded(true);
    } catch (err: any) {
      await addTerminalLog(`ERROR IN INTEGRITY ENG: ${err.message || 'Unknown State Collapse'}`, 100);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSandbox = () => {
    setShowCheckout(false);
    setSuccessUpgraded(false);
    setTerminalLogs([]);
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
  };

  return (
    <div id="premium_gate_bounding_container" className="py-8 px-4 w-full flex items-center justify-center">
      <div className="w-full max-w-[620px] bg-black border-2 border-red-500 rounded-lg p-6 shadow-[0_0_25px_rgba(239,68,68,0.25)] text-left relative overflow-hidden font-mono text-zinc-300">
        
        {/* Decorative Grid Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-red-500" />
        <div className="absolute top-1 right-2 text-[8px] opacity-40 text-red-500">SECURE NODE // RLS_ACTIVE</div>

        {/* Access Refused Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded text-red-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              ACCESS PRIVILEGES INSUFFICIENT
            </h2>
            <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest flex items-center gap-2">
              <span>RESOURCE ID:</span>
              <span className="text-red-400 bg-red-950/20 px-1 border border-red-900/40">{featureName}</span>
            </div>
          </div>
        </div>

        {/* Matrix Metadata Specs */}
        <div className="bg-zinc-950/80 rounded border border-zinc-900 p-4 mb-6 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-[7.5px] font-bold text-red-600 tracking-widest uppercase bg-red-950/30 px-1 border border-red-500/20">
            LOCKED
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-[11px] uppercase tracking-wide border-b border-zinc-900 pb-3 mb-3">
            <div className="text-zinc-500">Current Authorization:</div>
            <div className="text-zinc-305 font-bold text-zinc-400 select-all flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
              {TIER_LABELS[currentTier] || currentTier.toUpperCase()}
            </div>
            <div className="text-zinc-500">Required Console Level:</div>
            <div className="text-purple-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-purple-400 shrink-0" />
              {TIER_LABELS[requiredTier] || requiredTier.toUpperCase()}
            </div>
          </div>

          <p className="text-[11.5px] leading-relaxed text-zinc-400">
            Our original grassroots commitment ensures basic manager profiles and ledger spreadsheets are <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1 border border-emerald-900/30">FREE FOR LIFE</span>.
            However, advanced analytical routers, multiple venue forecast vectors, dynamic pitch generations, and API-synchronized databases utilize heavy background system routing computing cores.
          </p>
          
          <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-550 border-t border-zinc-900 pt-3">
            <Cpu className="w-3.5 h-3.5 text-zinc-650" />
            <span>METRIC PARSER STAMP LEVEL: MINIMUM LEVEL NEEDED : {targetWeight}</span>
          </div>
        </div>

        {/* Call to action Upgrade Trigger Button */}
        <div>
          <button
            onClick={() => setShowCheckout(true)}
            className="w-full py-4.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black border-2 border-red-500/70 hover:border-red-400 rounded font-black tracking-widest text-[12.5px] uppercase transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-98 flex items-center justify-center gap-2"
          >
            [ UPGRADE TO PRO CONSOLE ({TIER_PRICE[requiredTier] || '$29/mo'}) ]
          </button>
          
          <div className="text-center text-[9px] text-zinc-600 uppercase tracking-widest mt-3">
            Secure self-service billing sandbox • Cancel anytime instantly
          </div>
        </div>

        {/* FULL INTEGRATED CHECOUT DIALOG / TERMINAL PAY EMULATOR */}
        <AnimatePresence>
          {showCheckout && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/98 z-50 flex flex-col p-6 font-mono text-zinc-300"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider font-display">
                    NEXUS BILLING TERM v1.4
                  </span>
                </div>
                <button 
                  onClick={resetSandbox}
                  className="w-6 h-6 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!successUpgraded ? (
                <div className="flex-grow flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded text-zinc-300 text-[11px] space-y-1">
                      <div className="font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>SELECT TIER SUBSCRIPTION</span>
                        <span className="text-purple-400">{TIER_PRICE[requiredTier]}</span>
                      </div>
                      <p className="text-zinc-400 text-[10.5px]">
                        Upgrading account nodes instantly provisions real-time credential tokens required by the analytical compile suite.
                      </p>
                    </div>

                    {/* Form Input fields */}
                    <div id="checkout_terminal_form_inputs" className="space-y-3">
                      <div>
                        <label className="block text-[9.5px] uppercase tracking-wider text-zinc-500 mb-1">
                          CARDHOLDER NAME:
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. GRASSROOTS PROMOTERS"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] uppercase tracking-wider text-zinc-500 mb-1">
                          CREDIT CARD NUMBER (MOCK SANDBOX):
                        </label>
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="4242 •••• •••• 4242"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                            maxLength={19}
                            disabled={isProcessing}
                            className="w-full bg-zinc-950 border border-zinc-805 focus:border-purple-500 rounded pl-9 pr-2.5 py-1.5 text-xs text-white font-mono focus:outline-none placeholder-zinc-700"
                          />
                          <CreditCard className="w-3.5 h-3.5 text-zinc-650 absolute left-3 top-2.5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9.5px] uppercase tracking-wider text-zinc-500 mb-1">
                            EXPIRATION (MM/YY):
                          </label>
                          <input 
                            type="text"
                            placeholder="12/28"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength={5}
                            disabled={isProcessing}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] uppercase tracking-wider text-zinc-500 mb-1">
                            SECURITY CODE (CVC):
                          </label>
                          <input 
                            type="password"
                            placeholder="***"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            maxLength={4}
                            disabled={isProcessing}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Processing Terminal logs output */}
                    {terminalLogs.length > 0 && (
                      <div className="bg-black border border-zinc-900 rounded p-2.5 max-h-[140px] overflow-y-auto text-[10px] font-mono space-y-1 scrollbar-thin text-purple-400 bg-zinc-950/60 leading-normal">
                        {terminalLogs.map((log, idx) => (
                          <div key={`prem-feat-${idx}`} className="flex gap-1.5 items-start">
                            <span className="text-[#00ffcc] font-bold">›</span>
                            <span className="whitespace-pre-wrap">{log}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-zinc-900 mt-4">
                    <button
                      type="button"
                      disabled={isProcessing || !cardName || !cardNumber}
                      onClick={executeUpgradeHandshake}
                      className="w-full py-3.5 bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black rounded font-black text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          TRANSMITTING HANDSHAKE...
                        </>
                      ) : (
                        `[ DEPLOY BILLING AUTHENTICATION ($29) ]`
                      )}
                    </button>
                    <p className="text-center text-[8.5px] text-zinc-650 mt-2 uppercase select-none">
                      Testing credentials simulated securely. Entering actual values not required.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col justify-between text-center pt-8">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-950/30 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-emerald-400 font-bold tracking-widest text-sm uppercase">
                        TRANSACTION AUTHENTICATED SUCCESSFULLY
                      </h3>
                      <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">
                        LICENSING SYNCED IN 320ms • NODE LIVE
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-900 rounded p-4 text-[11px] leading-relaxed max-w-sm mx-auto text-zinc-400 text-left">
                      <div className="text-white font-bold mb-1 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        ACCESS AUTHORIZATION GRANTED
                      </div>
                      Your user account profile has been dynamically provisioned with level status weight: <span className="text-purple-400 font-bold uppercase">{requiredTier}</span>. Advanced analytical matrix modules are now fully unlocked.
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-900">
                    <button
                      onClick={resetSandbox}
                      className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-black rounded font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    >
                      INITIALIZE CORE INTERFACES <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
