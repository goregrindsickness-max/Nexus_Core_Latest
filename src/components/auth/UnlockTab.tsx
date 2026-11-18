import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  KeyRound,
  Compass,
  Disc3,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { getSupabase } from '../../supabase';

interface UnlockTabProps {
  email: string;
  setEmail: (email: string) => void;
  pin: string;
  setPin: (pin: string) => void;
  showSignUpPassword: boolean;
  setShowSignUpPassword: (v: boolean) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSelectSignUp: () => void;
  onBackToSplash?: () => void;
}

const REMEMBER_EMAIL_STORAGE_KEY = 'nexus_remembered_login_email';

export const UnlockTab: React.FC<UnlockTabProps> = ({
  email,
  setEmail,
  pin,
  setPin,
  showSignUpPassword,
  setShowSignUpPassword,
  error,
  isLoading,
  onSubmit,
  onSelectSignUp,
  onBackToSplash,
}) => {
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [showResetBox, setShowResetBox] = useState<boolean>(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'idle' | 'sending' | 'sent' | 'error'; message?: string }>({
    type: 'idle',
  });

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_STORAGE_KEY);
      if (savedEmail && !email) {
        setEmail(savedEmail);
      }
    } catch {}
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    try {
      if (rememberDevice && email.trim()) {
        localStorage.setItem(REMEMBER_EMAIL_STORAGE_KEY, email.trim());
      } else if (!rememberDevice) {
        localStorage.removeItem(REMEMBER_EMAIL_STORAGE_KEY);
      }
    } catch {}
    onSubmit(e);
  };

  const handleSendPasswordReset = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setResetStatus({
        type: 'error',
        message: 'Enter your registered email address above first.',
      });
      return;
    }

    setResetStatus({ type: 'sending' });
    try {
      const sb = getSupabase();
      if (sb?.auth?.resetPasswordForEmail) {
        const { error: resetErr } = await sb.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        });
        if (resetErr) throw resetErr;
      }
      setResetStatus({
        type: 'sent',
        message: `Password recovery link dispatched to ${cleanEmail}. Check your inbox or spam folder.`,
      });
    } catch (err: any) {
      setResetStatus({
        type: 'error',
        message: err?.message || 'Unable to send reset link right now. Please try again.',
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto relative z-10">
      {/* Top Return Bar */}
      {onBackToSplash && (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToSplash}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Overview &amp; APK Download</span>
          </button>

          <span className="hidden sm:inline-block text-xs text-zinc-500 font-mono">
            End-to-End Encrypted Session · v1.9.4
          </span>
        </div>
      )}

      {/* Main Split-Column Gateway Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-white/[0.09] bg-[#0c0e14]/95 shadow-[0_32px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* Left Brand & Ecosystem Column (Desktop Full / Mobile Compact Header) */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#101420] via-[#0c0e14] to-[#090b10] border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient radial glow */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            <div className="text-xs font-mono tracking-widest uppercase text-emerald-400 font-semibold">
              Underground Music Network
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-display mt-1.5 leading-tight">
              NEXUS CORE
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed max-w-md">
              The unified platform built for independent bands, touring artists, venue promoters, record labels, creatives, and dedicated scene supporters.
            </p>

            {/* Ecosystem Pillars */}
            <div className="hidden sm:grid grid-cols-1 gap-3.5 mt-7 pt-6 border-t border-white/[0.07]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100">GPS-Matched Tour &amp; Show Discovery</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Automatic local show proximity, multi-day festival calendars, and connected fan tour flyers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Disc3 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100">Direct-to-Band Merch &amp; Audio Vault</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Full-master audio streaming, physical pressings, and instant payout routing to bands and sellers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100">Multi-Workspace Role Switching</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Manage your personal profile, band roster, promoter bookings, label catalog, or creative studio under one account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Footer */}
          <div className="hidden lg:flex items-center justify-between pt-6 mt-8 border-t border-white/[0.06] text-xs text-zinc-500 relative z-10">
            <span>Independent &amp; Artist-Owned</span>
            <span>·</span>
            <span>Direct Payouts Enabled</span>
            <span>·</span>
            <span>Scene Verified</span>
          </div>
        </div>

        {/* Right Authentication Form Column */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[#0d1017]">
          {/* Segmented Mode Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#080a0f] p-1.5 rounded-xl border border-white/[0.07] mb-6">
            <button
              type="button"
              className="py-2.5 px-3 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 bg-[#161b26] border border-emerald-500/40 text-white shadow-md cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={onSelectSignUp}
              className="py-2.5 px-3 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-zinc-400 hover:text-white hover:bg-white/[0.04] cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-purple-400" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Sign in with your email and password or operator PIN to access your workspaces.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080a0f] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  placeholder="you@band-or-scene.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Password or Access PIN
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetBox((prev) => !prev);
                    setResetStatus({ type: 'idle' });
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-[#080a0f] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-400 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  placeholder="Enter your password or PIN"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 focus:outline-none cursor-pointer"
                  aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Inline Password Recovery Box */}
            {showResetBox && (
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Password Recovery</span>
                  <button
                    type="button"
                    onClick={() => setShowResetBox(false)}
                    className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We&apos;ll send a recovery link to the email address entered above.
                </p>
                {resetStatus.message && (
                  <p
                    className={`text-xs font-medium ${
                      resetStatus.type === 'sent' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {resetStatus.message}
                  </p>
                )}
                <button
                  type="button"
                  disabled={resetStatus.type === 'sending'}
                  onClick={handleSendPasswordReset}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resetStatus.type === 'sending' ? 'Sending Recovery Link...' : 'Send Password Reset Email'}
                </button>
              </div>
            )}

            {/* Remember Device Row */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-[#080a0f] text-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>Remember email on this device</span>
              </label>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-500/40 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[46px] bg-gradient-to-r from-emerald-500 to-[#00ffcc] hover:from-emerald-400 hover:to-[#33ffd6] disabled:opacity-50 text-neutral-950 font-bold text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_28px_rgba(16,185,129,0.28)]"
            >
              {isLoading ? (
                <>
                  <ShieldCheck className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.25]" />
                  <span>Sign In to Nexus Core</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Create Account Prompt */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span>New to Nexus Core?</span>
            <button
              type="button"
              onClick={onSelectSignUp}
              className="font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Create a Fan or Pro Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
