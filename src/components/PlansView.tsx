import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  Check, 
  Star, 
  Gift, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Award
} from 'lucide-react';
import { UserReview } from '../types';
import { BAND_PORTAL_BILLING } from '../config/billingMatrix';

interface PlansViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  userReviews?: UserReview[];
  setUserReviews?: React.Dispatch<React.SetStateAction<UserReview[]>>;
  activePlan?: string;
  onSelectPlan?: (planCode: string) => void;
}

export default function PlansView({
  onBack,
  triggerNotification,
  addLog,
  activePlan,
  onSelectPlan
}: PlansViewProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const isRosterOwner = React.useMemo(() => {
    const roleLower = (userProfile?.role || '').toLowerCase();
    if (userProfile?.email === 'admin@example.com' || !userProfile?.role || roleLower === 'manager') return true;
    return roleLower.includes('owner');
  }, [userProfile]);

  // Billing cycle state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  // Countdown clock state (05 days, 04 hours, 55 mins, 51 secs)
  const [countdown, setCountdown] = useState({
    days: 5,
    hours: 4,
    minutes: 55,
    seconds: 51
  });

  // Calculator expansion state
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [showsPerMonth, setShowsPerMonth] = useState<number>(12);

  // Feature comparison toggle state
  const [showComparison, setShowComparison] = useState<boolean>(false);

  // Single use options panel nested toggle state
  const [perShowExpanded, setPerShowExpanded] = useState<boolean>(false);
  const [perTourExpanded, setPerTourExpanded] = useState<boolean>(false);

  // Dynamic FAQs accordion state
  const [faqOpen, setFaqOpen] = useState<{ [key: string]: boolean }>({
    trial: false,
    cancel: false,
    refunds: false,
    pertour: false,
    payment: false,
    upgrade: false,
    secure: false
  });

  // Countdown ticker logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Hydrate user profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_core_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        queueMicrotask(() => {
          setUserProfile(parsed);
        });
      }
    } catch (e) {
      console.error('[PLANS HYDRATION ERROR]', e);
    }
  }, []);

  // Format single values to two digit strings
  const padZero = (n: number) => n.toString().padStart(2, '0');

  // Trigger Stripe licensing checkout handshake payload injection
  const handleSelectPlan = async (tierId: string) => {
    if (!isRosterOwner) {
      triggerNotification("RESTRICTED: Only the primary account owner is authorized to execute subscription contract upgrades.");
      return;
    }

    setIsProcessing(tierId);
    let selectedProductName = '';
    if (tierId === 'touring_pro') selectedProductName = 'Touring Pro';
    else if (tierId === 'touring_pro_plus') selectedProductName = 'Touring Pro +';
    else if (tierId === 'per_tour') selectedProductName = 'Per Tour';
    else selectedProductName = 'Per Show';

    addLog(`[STRI_CONN] Handshaking Stripe billing session for plan "${tierId}"...`);
    triggerNotification(`Initializing gateway session for ${selectedProductName}...`);

    try {
      const stripeCustomerId = userProfile?.creative_metadata?.stripe_customer_id || userProfile?.stripe_customer_id || null;
      const stripeAccountId = userProfile?.creative_metadata?.stripe_account_id || userProfile?.stripe_connect_id || null;

      const response = await fetch('/api/payments/create-billing-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tierId,
          billingCycle: (tierId === 'touring_pro' || tierId === 'touring_pro_plus') ? billingCycle : 'monthly',
          role: 'band', // Keep page strictly for Band subscriptions
          stripeCustomerId,
          stripeAccountId,
          email: userProfile?.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gateway rejected initialization parameters.');
      }

      const data = await response.json();
      if (data.url) {
        addLog(`[SYSTEM] Client redirecting to secure billing gateway: ${data.simulated ? 'SIMULATED INTERFACE' : 'STRIPE LIVE'}`);
        window.location.href = data.url;
      } else {
        throw new Error('Endpoint returned successful response, but stripe URL token was empty.');
      }
    } catch (err: any) {
      console.error(err);
      addLog(`[ERROR] Stripe checkout redirection handshake failed: ${err.message}`);
      triggerNotification(`Gateway Connection Refused: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("WARNING: ARE YOU SURE YOU WANT TO DE-AUTHORIZE YOUR ACTIVE CONTRACT TIER? ALL GATES REVERT TO GUEST TIERS IMMEDIATELY.")) {
      return;
    }

    setCancelLoading(true);
    addLog(`[SYSTEM] INITIALIZING CONTRACT REVERT PROTOCOL FOR DISMANTLING TIERS...`);
    triggerNotification(`Sending teardown payload...`);

    try {
      if (onSelectPlan) {
        onSelectPlan('');
      }
      
      const stored = localStorage.getItem('nexus_core_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.subscription_status = 'canceled';
        parsed.sub_tier = 'free_for_life';
        localStorage.setItem('nexus_core_user_profile', JSON.stringify(parsed));
        
        window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: parsed }));
      }

      addLog(`[SUCCESS] CONTRACT DE-ACTIVATED. PROFILE TIER SET TO DEFAULT 'FREE_FOR_LIFE'.`);
      triggerNotification(`Contract terminated successfully. Status: DEGRADED.`);
    } catch (err: any) {
      console.error(err);
      addLog(`[ERROR] Teardown script failed: ${err.message}`);
      triggerNotification(`Cancellation Error: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  const toggleFaq = (key: string) => {
    setFaqOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to build custom ASCII progress indicators for countdown
  const getLoaderString = (days: number) => {
    const totalBlocks = 14;
    const filledBlocks = Math.max(0, Math.min(14, days));
    const emptyBlocks = 14 - filledBlocks;
    return `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}]`;
  };

  const isAnnual = billingCycle === 'yearly';
  
  // Dynamic recommendations logic output
  const recommendedPlan = showsPerMonth >= 22 ? 'Touring Pro +' : showsPerMonth >= 10 ? 'Touring Pro' : showsPerMonth >= 3 ? 'Per Tour' : 'Per Show';

  return (
    <div 
      id="plans-view-container" 
      className="bg-[#0A0A0C] text-zinc-100 font-sans tracking-normal min-h-screen selection:bg-[#00F2FE]/20 selection:text-[#00F2FE] relative"
    >
      {/* Floating Back Button (Scrolling Back Button like other pages) */}
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

      <div className="max-w-[580px] mx-auto px-4 py-8 md:py-12 flex flex-col gap-6">

        {!isRosterOwner && (
          <div className="p-4 bg-[#0a231c]/50 border border-emerald-500/20 rounded-2xl flex items-start gap-3.5 shadow-md">
            <Shield className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-mono font-bold text-[#00ffcc] uppercase tracking-wider">Dynamic Roster Operator Profile</h3>
              <p className="text-[11px] text-zinc-300 font-sans mt-0.5 leading-relaxed">
                You are currently connected as a <strong className="text-white">{userProfile?.role || 'Staff Operator'}</strong>. 
                Your active seat is fully funded and sponsored by the roster billing owner. 
                Pricing tiers below remain display-only.
              </p>
            </div>
          </div>
        )}

        {/* 1. HEADER SECTION (CYBER GLOW / CHOSEN BLUE SHADOW PULSE) */}
        <div id="plans-top-header" className="flex flex-col items-center justify-center pt-2 pb-5 border-b border-zinc-900 relative">
          {/* Pulsing Cyber Blue Title */}
          <h1 
            id="plans-main-title" 
            className="text-4xl sm:text-5xl font-black tracking-widest text-center text-white uppercase drop-shadow-[0_0_25px_rgba(0,242,254,0.95)] animate-pulse font-mono leading-tight py-2"
          >
            Subscription Picker
          </h1>
          
          <p id="plans-main-description" className="text-[12px] text-zinc-400 text-center font-sans mt-3 px-4 leading-normal">
            Here is where you manage your application access, choose your subscription tier, and toggle optional road tools like venue-cut splitting.
          </p>
        </div>

        {/* 2. 14-DAY COMPLIMENTARY TRIAL ACTIVE MODULE */}
        <div 
          id="trial-banner" 
          className="flex flex-col items-center bg-[#0d1416]/90 border border-[#144245]/30 rounded-2xl py-6 px-4 relative overflow-hidden"
        >
          {/* Static Clock Backdrop behind the timer */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
            <svg 
              className="w-80 h-80 text-[#00F2FE]" 
              viewBox="0 0 100 100" 
              fill="none" 
              stroke="currentColor"
            >
              {/* Outer clock ring */}
              <circle cx="50" cy="50" r="48" strokeWidth="0.5" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="45" strokeWidth="1" />
              <circle cx="50" cy="50" r="42" strokeWidth="0.75" strokeDasharray="1,2" />
              {/* Inner detail rings */}
              <circle cx="50" cy="50" r="30" strokeWidth="0.5" strokeDasharray="1,5" />
              <circle cx="50" cy="50" r="15" strokeWidth="0.5" />
              {/* Ticks around the clock */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 50 + 38 * Math.cos(angle);
                const y1 = 50 + 38 * Math.sin(angle);
                const x2 = 50 + 44 * Math.cos(angle);
                const y2 = 50 + 44 * Math.sin(angle);
                return <line key={`plan-grid-line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.8" />;
              })}
              {/* Hands */}
              <line x1="50" y1="50" x2="50" y2="22" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="50" y1="50" x2="70" y2="50" strokeWidth="0.8" strokeLinecap="round" />
              {/* Center point */}
              <circle cx="50" cy="50" r="2" fill="currentColor" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Circle Clock Indicator */}
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-900"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[#00F2FE] border-r-[#00F2FE] animate-spin" style={{ animationDuration: '6s' }}></div>
              <Clock className="w-6 h-6 text-[#00F2FE]" />
            </div>

            <h2 id="trial-active-title" className="text-[#00F2FE] text-lg font-bold tracking-wide text-center">
              14-Day Free Trial Active
            </h2>
            <p className="text-xs text-zinc-400 text-center mt-1">
              Full access • No credit card required
            </p>
            <p className="text-[11px] text-zinc-500 text-center mt-0.5">
              After trial: Choose a plan or continue with limited features
            </p>

            {/* Liquid Countdown Timers */}
            <div id="countdown-blocks-grid" className="flex justify-center items-center gap-3 mt-6">
              <div className="flex flex-col items-center">
                <div className="bg-[#121E20] border border-[#144245] text-[#00F2FE] px-3 py-2 rounded-lg text-lg font-bold font-mono tracking-wider min-w-[50px] text-center shadow-[0_0_12px_rgba(0,242,254,0.15)]">
                  {padZero(countdown.days)}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5 font-mono">Days</span>
              </div>
              
              <div className="text-[#00F2FE] font-bold text-lg -mt-4">:</div>

              <div className="flex flex-col items-center">
                <div className="bg-[#121E20] border border-[#144245] text-[#00F2FE] px-3 py-2 rounded-lg text-lg font-bold font-mono tracking-wider min-w-[50px] text-center shadow-[0_0_12px_rgba(0,242,254,0.15)]">
                  {padZero(countdown.hours)}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5 font-mono">Hours</span>
              </div>

              <div className="text-[#00F2FE] font-bold text-lg -mt-4">:</div>

              <div className="flex flex-col items-center">
                <div className="bg-[#121E20] border border-[#144245] text-[#00F2FE] px-3 py-2 rounded-lg text-lg font-bold font-mono tracking-wider min-w-[50px] text-center shadow-[0_0_12px_rgba(0,242,254,0.15)]">
                  {padZero(countdown.minutes)}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5 font-mono">Mins</span>
              </div>

              <div className="text-[#00F2FE] font-bold text-lg -mt-4">:</div>

              <div className="flex flex-col items-center">
                <div className="bg-[#121E20] border border-[#144245] text-[#00F2FE] px-3 py-2 rounded-lg text-lg font-bold font-mono tracking-wider min-w-[50px] text-center shadow-[0_0_12px_rgba(0,242,254,0.15)]">
                  {padZero(countdown.seconds)}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5 font-mono">Secs</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BILLING INTERVAL CHANGER */}
        <div id="interval-panel-container" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-black font-mono">
              Currency config:
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
              <span>🌐 USD ($)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-[#111113] p-1 rounded-xl border border-zinc-900">
            <button
              id="cycle-monthly-btn"
              onClick={() => setBillingCycle('monthly')}
              style={{ fontSize: '11.5px' }}
              className={`py-2 px-4 rounded-lg font-bold transition-all text-center cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Monthly
            </button>
            <button
              id="cycle-yearly-btn"
              onClick={() => setBillingCycle('yearly')}
              style={{ fontSize: '11.5px', color: '#8787f3' }}
              className={`py-2 px-4 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-extrabold'
                  : 'hover:text-white'
              }`}
            >
              Annual <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider font-mono ${billingCycle === 'yearly' ? 'bg-black/20 text-black' : 'bg-black/40 text-[#10B981]'}`}>SAVE 20%</span>
            </button>
          </div>

          {billingCycle === 'yearly' && (
            <div className="text-[11px] text-[#00F2FE] text-center font-bold font-sans">
              💰 Save on annual plans instantly! Billed yearly with a 20% savings margin.
            </div>
          )}
        </div>

        {/* 4. NOT SURE WHICH PLAN COLLAPSIBLE CALCULATOR */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-[#111113]">
          <button
            id="expand-plan-calculator"
            onClick={() => setShowCalculator(!showCalculator)}
            className="w-full flex items-center justify-between p-4 text-xs font-bold text-zinc-300 hover:text-white transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <span>🧮</span>
              <span>Not sure which plan? Calculate →</span>
            </div>
            {showCalculator ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </button>

          {showCalculator && (
            <div className="p-4 border-t border-zinc-900 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">ESTIMATED SHOWS / MONTH</span>
                  <span className="text-white font-black">{showsPerMonth} Shows</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="40"
                  value={showsPerMonth}
                  onChange={(e) => setShowsPerMonth(Number(e.target.value))}
                  className="w-full accent-[#00F2FE] bg-zinc-800 rounded"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between text-xs border border-zinc-900">
                <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-mono">RECOMMENDED FIT:</span>
                <span className="text-[#00F2FE] font-black tracking-wide text-xs font-mono">{recommendedPlan.toUpperCase()} TIER</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. FEATURE COMPARISON INTERFACE */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-[#111113]">
          <button
            id="toggle-features-panel"
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between p-4 text-xs font-bold text-zinc-300 hover:text-white transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <span>📈</span>
              <span>Show Feature Comparison</span>
            </div>
            {showComparison ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </button>

          {showComparison && (
            <div className="p-4 border-t border-zinc-900 text-[11px] space-y-3 font-mono text-zinc-400">
              <div className="grid grid-cols-4 border-b border-zinc-900 pb-1.5 text-white font-bold">
                <span>FEATURES</span>
                <span className="text-center text-zinc-500">SHOW</span>
                <span className="text-center text-zinc-500">TOUR</span>
                <span className="text-center text-[#00F2FE]">PRO</span>
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-900/40 pb-1">
                <span>Unlimited Shows</span>
                <span className="text-center">❌</span>
                <span className="text-center">❌</span>
                <span className="text-center text-[#00F2FE]">✓</span>
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-900/40 pb-1">
                <span>Merch Inventory</span>
                <span className="text-center">✓</span>
                <span className="text-center">✓</span>
                <span className="text-center text-[#00F2FE]">✓</span>
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-900/40 pb-1">
                <span>Tally Sheets</span>
                <span className="text-center">✓</span>
                <span className="text-center">✓</span>
                <span className="text-center text-[#00F2FE]">✓</span>
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-900/40 pb-1">
                <span>CSV Exports</span>
                <span className="text-center">❌</span>
                <span className="text-center">✓</span>
                <span className="text-center text-[#00F2FE]">✓</span>
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-900/40 pb-1">
                <span>Team Members</span>
                <span className="text-center text-zinc-500">2</span>
                <span className="text-center text-zinc-500">3</span>
                <span className="text-center text-[#00F2FE]">5</span>
              </div>
              <div className="grid grid-cols-4 pb-1">
                <span>Analytics Engine</span>
                <span className="text-center">Basic</span>
                <span className="text-center">Basic</span>
                <span className="text-center text-[#00F2FE]">Advanced</span>
              </div>
            </div>
          )}
        </div>

        {/* 6. SUBSCRIPTION TIERS FOR BANDS (TOURING PRO & TOURING PRO + CARDS) */}
        <div id="tiers-deck-wrapper" className="space-y-6 pt-2">

          {/* CARD A: TOURING PRO PLAN */}
          <div 
            id="tier-card-touring-pro" 
            className="rounded-2xl border-2 border-[#00F2FE] bg-[#0E1517] p-6 relative flex flex-col justify-between shadow-[0_0_20px_rgba(0,242,254,0.12)] "
          >
            {/* MOST POPULAR BADGE */}
            <div className="absolute -top-3.5 right-6 bg-[#00F2FE] text-black font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full shadow-lg font-mono">
              ✨ MOST POPULAR
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-center pt-2">
                <div className="text-3xl font-black text-white uppercase tracking-widest font-mono drop-shadow-[0_0_15px_rgba(0,242,254,0.85)] animate-pulse py-1">
                  Touring Pro
                </div>
                <p className="text-[11px] text-zinc-300 tracking-wide mt-2 max-w-[340px] leading-relaxed">
                  Our flagship command center with all features fully unlocked.
                </p>
              </div>

              {/* Pricing numbers */}
              <div className="flex items-baseline gap-1 justify-center pt-1">
                <span className="text-3xl font-black text-white">$</span>
                <span className="text-5xl font-extrabold text-white tracking-tighter">
                  {isAnnual ? BAND_PORTAL_BILLING.tiers.touring_pro.annualMonthlyPrice.toFixed(2) : BAND_PORTAL_BILLING.tiers.touring_pro.monthlyPrice}
                </span>
                <span className="text-[#00F2FE] text-sm font-bold">/mo</span>
              </div>

              <div className="text-center pb-1">
                {isAnnual ? (
                  <div className="bg-[#153436] text-[11px] text-[#00F2FE] py-2.5 px-3.5 rounded-lg font-bold border border-[#144245] inline-block font-mono">
                    💰 Billed ${(BAND_PORTAL_BILLING.tiers.touring_pro.annualMonthlyPrice * 12).toFixed(2)}/year - Save ~24% on Annual!
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Standard ${BAND_PORTAL_BILLING.tiers.touring_pro.monthlyPrice} monthly billing structure
                  </div>
                )}
              </div>

              {/* Tier action selector */}
              <button
                id="select-plan-btn-touring_pro"
                onClick={() => handleSelectPlan('touring_pro')}
                disabled={isProcessing !== null}
                className="w-full bg-[#00F2FE] text-black font-black uppercase tracking-widest text-xs py-3.5 px-4 text-center rounded-xl shadow-[0_0_12px_rgba(0,242,254,0.25)] hover:bg-[#33f5ff] transition-all cursor-pointer flex items-center justify-center gap-2 font-mono"
              >
                {isProcessing === 'touring_pro' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    SELECTING...
                  </>
                ) : (
                  <>
                    ✓ Select Touring Pro
                  </>
                )}
              </button>

              {/* Bullet proof features list */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-900 text-xs text-left">
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Manage up to ${BAND_PORTAL_BILLING.tiers.touring_pro.bandProfileLimit} separate band profiles with their own portals</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Infinite Shows & Multi-Run Tracking</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Live Booking Beacons</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>${BAND_PORTAL_BILLING.tiers.touring_pro.monthlyBoostTokens} Priority Feed Boost Tokens / month</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Full Inventory Management</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Complete Reports w/ Export</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Real-Time Merch Desk Inventory Ledger</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>On-Demand Venue-Cut Splitting Utility</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Team Collaboration (${BAND_PORTAL_BILLING.tiers.touring_pro.teamSeatLimit} members)</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300 font-bold text-[#00F2FE]">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Secure Database & Device Cloud Sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD B: TOURING PRO + PLANS (NEW ADDITION) */}
          <div 
            id="tier-card-touring-pro-plus" 
            className="rounded-2xl border border-zinc-800 bg-[#111113] p-6 relative flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-center pt-2">
                <div className="text-3xl font-black text-white uppercase tracking-widest font-mono drop-shadow-[0_0_15px_rgba(0,242,254,0.85)] animate-pulse py-1">
                  Touring Pro +
                </div>
                <p className="text-[11px] text-zinc-300 tracking-wide mt-2 max-w-[340px] leading-relaxed">
                  For the elite user or tour manager that manages 3-5 separate band/artist profiles.
                </p>
              </div>

              {/* Pricing numbers */}
              <div className="flex items-baseline gap-1 justify-center pt-1">
                <span className="text-3xl font-black text-white">$</span>
                <span className="text-5xl font-extrabold text-white tracking-tighter">
                  {isAnnual ? BAND_PORTAL_BILLING.tiers.touring_pro_plus.annualMonthlyPrice.toFixed(2) : BAND_PORTAL_BILLING.tiers.touring_pro_plus.monthlyPrice}
                </span>
                <span className="text-[#00F2FE] text-sm font-bold">/mo</span>
              </div>

              <div className="text-center pb-1">
                {isAnnual ? (
                  <div className="bg-[#121E20] text-[11px] text-[#00F2FE] py-2 px-3 rounded-lg font-bold border border-[#144245] inline-block font-mono">
                    💰 Billed ${(BAND_PORTAL_BILLING.tiers.touring_pro_plus.annualMonthlyPrice * 12).toFixed(2)}/year - Save 20% on Annual!
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Standard ${BAND_PORTAL_BILLING.tiers.touring_pro_plus.monthlyPrice} monthly billing structure
                  </div>
                )}
              </div>

              {/* Tier action selector */}
              <button
                id="select-plan-btn-touring_pro_plus"
                onClick={() => handleSelectPlan('touring_pro_plus')}
                disabled={isProcessing !== null}
                className="w-full bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-bold uppercase tracking-wider text-xs py-3.5 px-4 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-mono"
              >
                {isProcessing === 'touring_pro_plus' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    SELECTING...
                  </>
                ) : (
                  <>
                    Select Touring Pro +
                  </>
                )}
              </button>

              {/* Bullet proof features list */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-900 text-xs text-left">
                <div className="flex items-start gap-2.5 text-[#00F2FE] font-bold">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Manage up to ${BAND_PORTAL_BILLING.tiers.touring_pro_plus.bandProfileLimit} separate band profiles with their own portals</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Everything in the Touring Pro Contract</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>${BAND_PORTAL_BILLING.tiers.touring_pro_plus.monthlyBoostTokens} Priority Feed Boost Tokens / month</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Multi-User Crew & Member Access Keys</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Custom Merch & Print Vendor Calibration</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>White-Label Financial & Stock Auditing</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Priority Platform Support Routing</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
                  <span>Dedicated Representative Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. COLLAPSED SINGLE USE OPTIONS PANEL */}
          <div 
            id="single-use-options-wrapper" 
            className="rounded-2xl border border-zinc-900 bg-black p-5 space-y-4"
          >
            <div className="border-b border-zinc-900 pb-2">
              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                Need single use access? Check out these options
              </h4>
              <p className="text-[10px] text-zinc-650 uppercase tracking-normal mt-0.5 font-mono">
                Perfect for intermittent seasonal performers or ad-hoc events
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Per Show */}
              <div className="bg-[#0D0D10] border border-zinc-900 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setPerShowExpanded(!perShowExpanded)}
                  className="w-full p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-left gap-3 hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-100"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider font-mono">Per Show Pass</span>
                      <span className="bg-zinc-800 text-zinc-500 text-[8px] font-mono px-1.5 py-0.5 rounded tracking-wider">FLAT RATE</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      One-time pass / Per show
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-900/60 mt-2 sm:mt-0 font-mono">
                    <span className="text-sm font-bold text-[#10B981]">${BAND_PORTAL_BILLING.singleUsePasses.per_show.price}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#00F2FE] uppercase font-bold tracking-wider hidden sm:inline">
                        {perShowExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {perShowExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                  </div>
                </button>

                {perShowExpanded && (
                  <div className="p-4 border-t border-zinc-900 bg-[#08080A] space-y-4">
                    <div className="space-y-2 text-xs text-left">
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Single Show Inventory Ledger</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Basic Digital Sales Log</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Standard Cash Drawer Reconciliation</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Export Show Summary PDF</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan('per_show')}
                      disabled={isProcessing !== null}
                      className="w-full bg-[#10B981] text-black font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-[#34d399] transition-all cursor-pointer font-mono"
                    >
                      {isProcessing === 'per_show' ? 'Processing...' : '✓ Select Per Show Pass'}
                    </button>
                  </div>
                )}
              </div>

              {/* Option 2: Per Tour */}
              <div className="bg-[#0D0D10] border border-zinc-900 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setPerTourExpanded(!perTourExpanded)}
                  className="w-full p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-left gap-3 hover:bg-zinc-905 transition-colors cursor-pointer text-zinc-100"
                >
                  <div className="space-y-0.5 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider font-mono">Per Tour Pass</span>
                      <span className="bg-zinc-800 text-zinc-500 text-[8px] font-mono px-1.5 py-0.5 rounded tracking-wider">VALUE</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      One-time pass for bands who don't want a monthly sub but need a complete tour run unlocked.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-900/60 mt-2 sm:mt-0 font-mono">
                    <span className="text-sm font-bold text-[#10B981]">${BAND_PORTAL_BILLING.singleUsePasses.per_tour.price}</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[10px] text-[#00F2FE] uppercase font-bold tracking-wider hidden sm:inline">
                        {perTourExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {perTourExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                  </div>
                </button>

                {perTourExpanded && (
                  <div className="p-4 border-t border-zinc-900 bg-[#08080A] space-y-4">
                    <div className="space-y-2 text-xs text-left">
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Up to 35 Show Builds (Single Tour Run)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Multi-City Inventory Tracking</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Unified Road Expense Logs</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                        <span>Export Full Tour Settlement Spreadsheets</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan('per_tour')}
                      disabled={isProcessing !== null}
                      className="w-full bg-[#10B981] text-black font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-[#34d399] transition-all cursor-pointer font-mono"
                    >
                      {isProcessing === 'per_tour' ? 'Processing...' : '✓ Select Per Tour Pass'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 8. 30-DAY MONEY BACK ACCESSIBILITY CARD (RELEGATED UNDER SINGLE USE GATES) */}
          <div 
            id="guarantee-box" 
            className="flex items-start gap-4 p-4 rounded-xl border border-[#162D30] bg-[#0A1213]"
          >
            <div className="p-2 bg-[#1A3D40] rounded-lg text-[#00F2FE] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 text-xs font-bold font-sans">
                30-Day Money-Back Guarantee
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                Not satisfied? Contact us for a complete, hassle-free refund within 30 days.
              </p>
            </div>
          </div>

        </div>

        {/* 9. LOVED BY ARTISTS LIKE YOU */}
        <div id="artist-reviews-deck" className="space-y-4 pt-4 border-t border-zinc-900">
          <div className="flex items-center gap-1.5 justify-center py-2 text-[#00F2FE]">
            <Star className="w-5 h-5 fill-current" />
            <span className="text-sm font-bold tracking-widest uppercase font-mono">
              Loved by Artists Like You
            </span>
          </div>

          <div className="space-y-3">
            {/* Review 1 */}
            <div className="bg-[#111113] border border-zinc-900 p-4 rounded-xl flex items-start gap-3">
              <span className="text-2xl mt-1 shrink-0">🎸</span>
              <div className="space-y-1">
                <div className="flex gap-1 text-[#00F2FE]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`rev1-star-${i}`} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-300 tracking-wide font-medium leading-relaxed italic">
                  "Merch Tally saved us thousands in lost inventory. The tour reports are incredible!"
                </p>
                <div className="text-[10px] text-zinc-500 pt-0.5 font-mono">
                  <span className="text-zinc-300 font-bold">Alex Rivera</span> // Crimson Void
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-[#111113] border border-zinc-900 p-4 rounded-xl flex items-start gap-3">
              <span className="text-2xl mt-1 shrink-0">🐷</span>
              <div className="space-y-1">
                <div className="flex gap-1 text-[#00F2FE]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`rev2-star-${i}`} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-300 tracking-wide font-medium leading-relaxed italic">
                  "Finally, a merch system that actually works on the road. Game changer."
                </p>
                <div className="text-[10px] text-zinc-500 pt-0.5 font-mono">
                  <span className="text-zinc-300 font-bold">Sarah Chen</span> // The Echoes
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-[#111113] border border-zinc-900 p-4 rounded-xl flex items-start gap-3">
              <span className="text-2xl mt-1 shrink-0">🎤</span>
              <div className="space-y-1">
                <div className="flex gap-1 text-[#00F2FE]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`rev3-star-${i}`} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-300 tracking-wide font-medium leading-relaxed italic">
                  "Paid for itself in the first weekend. The analytics help us stock smarter."
                </p>
                <div className="text-[10px] text-zinc-500 pt-0.5 font-mono">
                  <span className="text-zinc-300 font-bold">Marcus Stone</span> // Iron Legacy
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 10. REFERRAL INCENTIVE SECTION */}
        <div 
          id="referral-box" 
          className="rounded-2xl border border-[#162D30] bg-[#0A1213] p-5 relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#133033] rounded-xl text-[#00F2FE] shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div className="space-y-3 block">
              <div>
                <h4 className="text-white text-xs font-bold font-sans">
                  Invite Bands, Get Free Months
                </h4>
                <p className="text-[#00F2FE] text-[10px] uppercase tracking-wider font-extrabold font-mono mt-0.5">
                  Tied directly to your account!
                </p>
                <div className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed space-y-1.5">
                  <p>
                    Get a unique referral link tied directly to your active account (ID: <span className="text-white font-mono">{userProfile?.id || userProfile?.creative_metadata?.band_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nexus_partner'}</span>).
                  </p>
                  <p>
                    When a band you refer signs up and upgrades to any paid subscription tier, our billing ledger automatically flags the link token to credit your account with a <span className="text-[#00F2FE] font-bold">100% discount on your next billing cycle</span>, while they also receive a free month! Cumulative rewards are completely unlimited.
                  </p>
                </div>
              </div>

              <button
                id="referral-button"
                onClick={() => {
                  const uniqueId = userProfile?.id || userProfile?.uid || userProfile?.email?.split('@')[0] || userProfile?.creative_metadata?.band_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'partner';
                  const referralLink = `https://nexusmerch.com/refer?ref=${encodeURIComponent(String(uniqueId).toLowerCase())}`;
                  navigator.clipboard.writeText(referralLink);
                  triggerNotification('Account-tied referral link copied to clipboard!');
                  addLog(`[REFERRAL] Copied unique referral link: ${referralLink}`);
                }}
                className="bg-[#00F2FE] text-black font-extrabold text-[10px] tracking-wider uppercase py-2.5 px-4 rounded-lg hover:bg-[#3bf5ff] transition-all cursor-pointer flex items-center gap-1.5 font-mono"
              >
                👥 Get Your Referral Link
              </button>
            </div>
          </div>
        </div>

        {/* 11. FREQUENTLY ASKED QUESTIONS */}
        <div id="faq-section" className="space-y-3 pt-4 border-t border-zinc-900">
          <h3 className="text-zinc-200 text-xs font-bold uppercase tracking-widest text-[#00F2FE] text-center py-2 font-mono">
            Frequently Asked Questions
          </h3>

          <div className="space-y-2 font-mono">
            {/* FAQ 1 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('trial')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>What happens when my trial ends?</span>
                {faqOpen.trial ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.trial && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  Your workspace will transition to limited guest capabilities. Absolutely none of your show tallies, active counts, or rosters are deleted. You can unlock fully unlimited capabilities via any tier package.
                </p>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('cancel')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>Can I cancel anytime?</span>
                {faqOpen.cancel ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.cancel && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  Yes, you can cancel your secure subscription immediately in one click inside your portal. Your workspace features revert instantly at the end of the current billing cycle.
                </p>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('refunds')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>Do you offer refunds?</span>
                {faqOpen.refunds ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.refunds && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  Absolutely! We pledge an honest, 30-day money-back guarantee. If you are not satisfied with the platform, simply prompt support and we will process a complete refund.
                </p>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('pertour')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>How does the Per Tour plan work?</span>
                {faqOpen.pertour ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.pertour && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  The Per Tour plan charges a flat, one-time fee of $49.99 for a block of up to 35 shows. No monthly subscription is created, making it perfect for intermittent seasonal touring.
                </p>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('payment')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>What payment methods do you accept?</span>
                {faqOpen.payment ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.payment && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  We accept secure payments through Visa, Mastercard, American Express, Apple Pay, Google Pay, and PayPal via standard SSL-256 Stripe channels.
                </p>
              )}
            </div>

            {/* FAQ 6 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('upgrade')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>Can I upgrade or downgrade my plan?</span>
                {faqOpen.upgrade ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.upgrade && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  Yes, we support dynamic adjustments. Any upgrade or downgrade calculates prorated credit differences instantly so you never double-pay.
                </p>
              )}
            </div>

            {/* FAQ 7 */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#111113]">
              <button
                onClick={() => toggleFaq('secure')}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-zinc-800 transition-all text-[11px] text-white"
              >
                <span>Is my data secure?</span>
                {faqOpen.secure ? <ChevronUp className="w-4 h-4 text-[#00F2FE]" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              {faqOpen.secure && (
                <p className="p-3 bg-black/40 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed uppercase">
                  Your data security is paramount. We deploy state-of-the-art secure TLS standards and direct-to-destination encryption protocols. No keys or client-side telemetry trackers are leaked.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 12. PAYMENT BADGES & STRIPE TRUST LABELS */}
        <div id="trust-footer-metrics" className="pt-6 border-t border-zinc-900 space-y-4 text-center">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
            Secure Payment Methods Accepted
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">Visa</span>
            <span className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">Mastercard</span>
            <span className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">Amex</span>
            <span className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">Apple Pay</span>
            <span className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">Google Pay</span>
            <span className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">PayPal</span>
          </div>

          <div className="space-y-1 text-zinc-600 text-[9px] font-mono">
            <div>🔒 Bank-level encryption • Used by 5,000+ bands worldwide</div>
            <div>🗺️ $2.5M+ in merch tracked • ⭐ 4.9/5 average rating</div>
          </div>

          {/* TERMINATE CONTRACT CONTROLLER */}
          <div className="pt-4 flex justify-center">
            <button
              id="cancel-subscription-tier-btn"
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="text-[10px] text-zinc-500 hover:text-red-400 underline underline-offset-4 uppercase tracking-widest cursor-pointer font-bold font-mono disabled:opacity-50 text-center"
            >
              {cancelLoading ? '[ Terminating Contract... ]' : '[ Terminate Current Licensed Contract ]'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}