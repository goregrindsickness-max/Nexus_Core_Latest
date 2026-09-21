import React, { useState } from 'react';
import { UserProfile, BILLING_TIER_LIMITS, SubscriptionTier } from '../types';
import { PROMOTER_BILLING_MATRIX } from '../config/promoterBilling';
import { ArrowLeft, ChevronLeft, Check, Lock, RefreshCw, Sparkles, Building, Landmark, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface BillingSettingsViewProps {
  userProfile: UserProfile;
  onClose: () => void;
  onNotification?: (msg: string) => void;
  isAccordionMode?: boolean;
}

export default function BillingSettingsView({ 
  userProfile, 
  onClose,
  onNotification,
  isAccordionMode = false
}: BillingSettingsViewProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isCancelLoading, setIsCancelLoading] = useState<boolean>(false);

  // Determine active venue numbers from promoter metadata
  const numSaved = userProfile?.promoter_metadata?.saved_venues?.length || 0;
  const hasHome = userProfile?.promoter_metadata?.home_venue?.name ? 1 : 0;
  const activeVenuesCount = numSaved + hasHome;

  const currentTier = userProfile?.sub_tier || 'free_for_life';
  const statusMessage = currentTier === 'local_booking_agent' ? 'LIFETIME FREE ACCESS ACTIVE' : 'PREMIUM SUBSCRIPTION ACTIVE';
  const statusColor = currentTier === 'local_booking_agent' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-purple-400 bg-purple-500/10 border-purple-500/20';

  const isAnnual = billingCycle === 'yearly';

  // Pricing calculations
  const localAgentPrice = isAnnual ? PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.annualMonthlyPrice : PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.monthlyPrice;
  const regionalBuyerPrice = isAnnual ? PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.annualMonthlyPrice : PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.monthlyPrice;
  const enterpriseNetworkPrice = isAnnual ? PROMOTER_BILLING_MATRIX.tiers.enterprise_network.annualMonthlyPrice : PROMOTER_BILLING_MATRIX.tiers.enterprise_network.monthlyPrice;
  const festivalPassPrice = PROMOTER_BILLING_MATRIX.oneOffUpgrades.single_festival_pass.price;

  const handleSelectPlan = async (tierId: string) => {
    setIsProcessing(tierId);
    let selectedProductName = '';
    if (tierId === 'local_booking_agent') selectedProductName = PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.name;
    else if (tierId === 'regional_talent_buyer') selectedProductName = PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.name;
    else if (tierId === 'enterprise_network') selectedProductName = PROMOTER_BILLING_MATRIX.tiers.enterprise_network.name;
    else if (tierId === 'single_festival_pass') selectedProductName = PROMOTER_BILLING_MATRIX.oneOffUpgrades.single_festival_pass.name;
    else selectedProductName = 'Local Booking Agent';

    if (onNotification) {
      onNotification(`Connecting to Stripe for ${selectedProductName}...`);
    }

    try {
      const profileAny = userProfile as any;
      const stripeCustomerId = profileAny?.promoter_metadata?.stripe_customer_id || profileAny?.stripe_customer_id || null;
      const stripeAccountId = profileAny?.promoter_metadata?.stripe_connect_id || profileAny?.stripe_connect_id || null;

      const response = await fetch('/api/payments/create-billing-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tierId,
          billingCycle: billingCycle === 'yearly' ? 'annual' : 'monthly',
          role: 'promoter',
          stripeCustomerId,
          stripeAccountId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gateway rejected initialization handshake.');
      }

      const data = await response.json();
      if (data.url) {
        if (onNotification) {
          onNotification('Redirecting to secure subscription checkout...');
        }
        window.location.href = data.url;
      } else {
        throw new Error('Endpoint returned successful response, but redirection URL was empty.');
      }
    } catch (err: any) {
      console.error(err);
      if (onNotification) {
        onNotification(`Stripe Gateway Refused: ${err.message}`);
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("WARNING: ARE YOU SURE YOU WANT TO DE-AUTHORIZE YOUR ACTIVE CONTRACT TIER? ALL GATES REVERT TO STANDARD SLOT LIMITS IMMEDIATELY.")) {
      return;
    }

    setIsCancelLoading(true);
    if (onNotification) {
      onNotification(`Dismantling subscription...`);
    }

    try {
      const stored = localStorage.getItem('nexus_core_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.subscription_status = 'canceled';
        parsed.sub_tier = 'free_for_life';
        localStorage.setItem('nexus_core_user_profile', JSON.stringify(parsed));
        
        window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: parsed }));
      }

      if (onNotification) {
        onNotification(`Contract terminated successfully. Profile set to default Free for Life.`);
      }
    } catch (err: any) {
      console.error(err);
      if (onNotification) {
        onNotification(`Cancellation Error: ${err.message}`);
      }
    } finally {
      setIsCancelLoading(false);
    }
  };

  return (
    <div id="plans-view-container" className={isAccordionMode ? "w-full text-zinc-100 font-sans tracking-normal relative" : "w-full min-h-screen bg-[#0C0F13] text-zinc-100 font-sans tracking-normal pb-24 selection:bg-purple-500/20 selection:text-purple-300 relative"}>
      {/* Header Bar */}
      {/* Floating Back Button */}
      {!isAccordionMode && (
        <div className="fixed top-4 left-4 md:top-6 md:left-6 z-[100]">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-red-500/20 hover:border-red-500/50 bg-black/85 flex items-center justify-center transition-all hover:bg-zinc-900 text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group"
            title="Return to Promoter Dashboard"
            aria-label="Go Back"
          >
            <ChevronLeft className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Header */}
      {!isAccordionMode && (
        <div className="sticky top-0 z-50 bg-[#0C0F13]/95 backdrop-blur-md border-b border-zinc-900 px-4 py-4 flex items-center justify-between pl-16 md:pl-20">
          <h1 className="text-xs font-black text-white uppercase tracking-widest text-center flex-1 pr-6 font-mono">
            System Billing Spec
          </h1>
        </div>
      )}

      <div className={isAccordionMode ? "w-full flex flex-col gap-6" : "max-w-[580px] mx-auto px-4 py-8 flex flex-col gap-6"}>
        
        {/* Title Block */}
        <div id="promoter-plans-header" className="flex flex-col items-center justify-center pt-2 pb-5 border-b border-zinc-900 text-center relative">
          <h1 
            id="promoter-plans-title" 
            className="text-4xl sm:text-5xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-pulse font-mono leading-tight py-2"
          >
            Subscription Picker
          </h1>
          <p id="promoter-plans-desc" className="text-[12px] text-zinc-400 mt-3 px-4 leading-normal max-w-md font-sans">
            Scale your managed property credentials. Choose your booking command plan to unlock automated venue logs and multi-venue routing signals.
          </p>
        </div>

        {/* System Active Billing Metrics Status Card */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-5 relative overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <span className="text-sm">🏢</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">[ SYSTEM BILLING METRICS & ACCOUNT STATUS ]</span>
          </div>
          
          <div className="space-y-3 font-mono pt-3">
            <p className="text-[10px] font-black tracking-widest uppercase">
              STATUS: <span className={`underline border px-2 py-0.5 rounded ${statusColor}`}>{statusMessage}</span>
            </p>
            <div className="flex justify-between items-center text-[10px] uppercase text-zinc-400 pt-1">
              <span>Managed Properties:</span>
              <span className="font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {activeVenuesCount} Active / Unlimited
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase pt-1 border-t border-zinc-900">
              Physical venue capacity limits and managed property caps have been fully abolished across all tiers. You are free to scale your routing networks endlessly.
            </p>
          </div>
        </div>

        {/* 3. RECURRING CYCLE SELECTION TOGGLE */}
        <div id="interval-panel-container" className="flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
              Currency config:
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              <span>🌐 USD ($)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-[#111113] p-1 rounded-xl border border-zinc-900">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annual <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider ${billingCycle === 'yearly' ? 'bg-black/20 text-white' : 'bg-black/40 text-emerald-400'}`}>SAVE 20%</span>
            </button>
          </div>

          {billingCycle === 'yearly' && (
            <div className="text-[10px] text-purple-400 text-center font-bold tracking-wide">
              💰 Save on annual plans instantly! Billed yearly with a 20% savings margin.
            </div>
          )}
        </div>

        {/* 4. SUBSCRIPTION TIERS FOR PROMOTERS */}
        <div id="tiers-deck-wrapper" className="space-y-6 pt-2 font-mono">

          {/* TIER 1: LOCAL BOOKING AGENT */}
          <div 
            className={`rounded-2xl border bg-zinc-950 p-6 relative flex flex-col justify-between transition-all ${
              currentTier === 'local_booking_agent' 
                ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.08)] bg-[#0d1411]' 
                : 'border-zinc-850'
            }`}
          >
            {currentTier === 'local_booking_agent' && (
              <div className="absolute -top-3 right-6 bg-emerald-500 text-black font-black uppercase text-[8px] tracking-widest px-3 py-1 rounded-full shadow-lg font-mono">
                ✓ ACTIVE TIER
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-center pt-2">
                <div className="text-2xl font-black text-white uppercase tracking-widest font-mono py-1">
                  Local Booking Agent
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[340px] leading-relaxed">
                  Excellent entry-tier credentials for independent spaces and solo creators.
                </p>
              </div>

              {/* Pricing numbers */}
              <div className="flex items-baseline gap-1 justify-center pt-1">
                <span className="text-2xl font-black text-white">$</span>
                <span className="text-4xl font-extrabold text-white tracking-tighter">
                  {localAgentPrice.toFixed(2)}
                </span>
                <span className="text-zinc-500 text-xs font-bold">/mo</span>
              </div>

              <div className="text-center font-mono">
                {isAnnual ? (
                  <div className="bg-[#1C1226]/80 text-[10px] text-purple-300 py-1.5 px-3 rounded-lg border border-purple-900 inline-block">
                    💰 Billed ${(PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.annualMonthlyPrice * 12).toFixed(2)}/year - Save 20% on Annual!
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 leading-normal uppercase">
                    Billed ${PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.monthlyPrice.toFixed(2)} monthly
                  </div>
                )}
              </div>

              <div className="text-center font-mono text-[9px] text-zinc-650 tracking-wider">
                Limit: {PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.rollingActiveShowLimit} rolling active shows, {PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.teamSeatLimit} team seats
              </div>

              {/* Tier action selector */}
              {currentTier === 'local_booking_agent' ? (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-widest text-[10px] py-3 px-4 text-center rounded-xl cursor-default flex items-center justify-center gap-1">
                  ACTIVE DEPLOYMENT TIER
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan('local_booking_agent')}
                  disabled={isProcessing !== null}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 hover:border-zinc-700 uppercase tracking-widest text-[10px] py-3 px-4 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  {isProcessing === 'local_booking_agent' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      CALIBRATING...
                    </>
                  ) : (
                    '✓ Select Local Booking Agent'
                  )}
                </button>
              )}

              {/* Features list */}
              <div className="space-y-2 pt-3 border-t border-zinc-900 text-[10px] text-left">
                <div className="flex items-start gap-2 text-zinc-400 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Artist Queries</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-400 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Basic Contracts</span>
                </div>
              </div>
            </div>
          </div>

          {/* TIER 2: REGIONAL TALENT BUYER */}
          <div 
            className={`rounded-2xl border-2 bg-[#120D1A] p-6 relative flex flex-col justify-between transition-all ${
              currentTier === 'regional_talent_buyer'
                ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.18)]'
                : 'border-purple-900/60 shadow-[0_0_15px_rgba(168,85,247,0.06)]'
            }`}
          >
            {/* BRAND BADGE */}
            <div className="absolute -top-3 right-6 bg-purple-500 text-white font-black uppercase text-[8px] tracking-widest px-3 py-1 rounded-full shadow-lg">
              ✨ RECOMMENDED FOR CIRCUITS
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-center pt-2">
                <div className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(168,85,247,0.95)] animate-pulse py-1">
                  Regional Talent Buyer
                </div>
                <p className="text-[10px] text-zinc-300 mt-1 max-w-[340px] leading-relaxed">
                  Standard toolkit for growing regional circuits, venues & promoters.
                </p>
              </div>

              {/* Pricing numbers */}
              <div className="flex items-baseline gap-1 justify-center pt-1">
                <span className="text-2xl font-black text-white">$</span>
                <span className="text-4xl font-extrabold text-white tracking-tighter">
                  {regionalBuyerPrice.toFixed(2)}
                </span>
                <span className="text-purple-400 text-xs font-bold">/mo</span>
              </div>

              <div className="text-center font-mono">
                {isAnnual ? (
                  <div className="bg-[#1C1226]/80 text-[10px] text-purple-300 py-1.5 px-3 rounded-lg border border-purple-900 inline-block">
                    💰 Billed ${(PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.annualMonthlyPrice * 12).toFixed(2)}/year - Save 20% on Annual!
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 leading-normal uppercase">
                    Billed ${PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.monthlyPrice.toFixed(2)} monthly
                  </div>
                )}
              </div>

              <div className="text-center font-mono text-[9px] text-zinc-650 tracking-wider">
                Limit: {PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.rollingActiveShowLimit} rolling active shows, {PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.teamSeatLimit} team seats
              </div>

              {/* Tier action selector */}
              {currentTier === 'regional_talent_buyer' ? (
                <div className="w-full bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] py-3.5 px-4 text-center rounded-xl cursor-default flex items-center justify-center gap-1.5">
                  ✓ ACTIVE ACCOUNT CREDENTIALS
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan('regional_talent_buyer')}
                  disabled={isProcessing !== null}
                  className="w-full bg-purple-500 hover:bg-purple-400 text-white font-black uppercase tracking-widest text-[10px] py-3.5 px-4 text-center rounded-xl shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isProcessing === 'regional_talent_buyer' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      CALIBRATING...
                    </>
                  ) : (
                    '✓ Select Regional Talent Buyer'
                  )}
                </button>
              )}

              {/* Features list */}
              <div className="space-y-2 pt-3 border-t border-zinc-900 text-[10px] text-left">
                <div className="flex items-start gap-2 text-zinc-300 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Artist Queries</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-350 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Basic Contracts</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-350 uppercase leading-relaxed font-semibold font-bold">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Source Split Settlements</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-350 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Geo Push Notifications</span>
                </div>
              </div>
            </div>
          </div>

          {/* TIER 3: ENTERPRISE NETWORK */}
          <div 
            className={`rounded-2xl border bg-zinc-950 p-6 relative flex flex-col justify-between transition-all ${
              currentTier === 'enterprise_network'
                ? 'border-emerald-400 bg-[#0B120E] shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center text-center pt-2">
                <div className="text-2xl font-black text-white uppercase tracking-widest font-mono py-1">
                  Enterprise Network
                </div>
                <p className="text-[10px] text-zinc-300 mt-1 max-w-[340px] leading-relaxed">
                  Unrestricted command center for large networks, multiple venues or agencies.
                </p>
              </div>

              {/* Pricing numbers */}
              <div className="flex items-baseline gap-1 justify-center pt-1">
                <span className="text-2xl font-black text-white">$</span>
                <span className="text-4xl font-extrabold text-white tracking-tighter">
                  {enterpriseNetworkPrice.toFixed(2)}
                </span>
                <span className="text-emerald-400 text-xs font-bold">/mo</span>
              </div>

              <div className="text-center font-mono">
                {isAnnual ? (
                  <div className="bg-[#0f1d14]/80 text-[10px] text-emerald-400 py-1.5 px-3 rounded-lg border border-emerald-950 inline-block">
                    💰 Billed ${(PROMOTER_BILLING_MATRIX.tiers.enterprise_network.annualMonthlyPrice * 12).toFixed(2)}/year - Save 20% on Annual!
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 leading-normal uppercase">
                    Billed ${PROMOTER_BILLING_MATRIX.tiers.enterprise_network.monthlyPrice.toFixed(2)} monthly
                  </div>
                )}
              </div>
              
              <div className="text-center font-mono text-[9px] text-zinc-650 tracking-wider">
                Unlimited rolling active shows, Unlimited team seats
              </div>

              {/* Tier action selector */}
              {currentTier === 'enterprise_network' ? (
                <div className="w-full bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] py-3.5 px-4 text-center rounded-xl cursor-default flex items-center justify-center gap-1.5">
                  ✓ ENTERPRISE CIRCUIT ENGAGED
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan('enterprise_network')}
                  disabled={isProcessing !== null}
                  className="w-full bg-[#10B981] hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[10px] py-3.5 px-4 text-center rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isProcessing === 'enterprise_network' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      DEPLOYING LEVEL...
                    </>
                  ) : (
                    'Select Enterprise Network'
                  )}
                </button>
              )}

              <div className="space-y-2 pt-3 border-t border-zinc-900 text-[10px] text-left">
                <div className="flex items-start gap-2 text-zinc-300 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>All Features</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-400 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Native Festival Planner</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-300 uppercase leading-relaxed font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Advanced Analytics</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* SECURE STRIPE HANDSHAKE CREDIT */}
        <div id="stripe-handshake-box" className="text-center text-[10px] text-zinc-550 border-t border-zinc-900 pt-5 uppercase leading-normal font-mono max-w-sm mx-auto">
          🔒 Secure contract parameters finalized using industry-grade direct Stripe Checkout handshake credentials. Cancel anytime.
        </div>

      </div>
    </div>
  );
}
