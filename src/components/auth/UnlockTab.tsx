import React from 'react';
import { Lock, UserPlus, Radio, Eye, EyeOff, CheckCircle, ArrowLeft, Download } from 'lucide-react';

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
  return (
    <div className="w-full max-w-md bg-[#12141a] border-2 border-[#1c1f26] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#00ffcc] to-purple-500" />
      
      {onBackToSplash && (
        <button
          type="button"
          onClick={onBackToSplash}
          className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
          <span>Back to Splash &amp; Download</span>
        </button>
      )}

      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#00ffcc] animate-pulse" />
          <span className="text-[9.5px] font-mono text-[#00ffcc] uppercase tracking-widest font-black">LIVE NETWORK CONNECT</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white font-display mt-1 text-center">Nexus Core</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-1 rounded-xl border border-zinc-900 mb-6">
        <button type="button" className="py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-[#181d26]/90 border border-[#2e3444]/40 text-white shadow">
          <Lock className="w-3 h-3 text-[#00ffcc]" /> Unlock / Sign In
        </button>
        <button type="button" onClick={onSelectSignUp} className="py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-950/20">
          <UserPlus className="w-3 h-3 text-[#a855f7]" /> Roster Enrollment
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
           <label className="block text-[10px] font-bold font-mono text-[#00ffcc] uppercase tracking-wider mb-1.5">Authorized Operator Email</label>
           <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0c0e12] border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-mono transition-colors" placeholder="tm@tour-hq.com" required/>
        </div>
        <div>
          <label className="block text-[10px] font-bold font-mono text-[#00ffcc] uppercase tracking-wider mb-1.5">Secure Access PIN / Operator Password</label>
          <div className="relative">
            <input type={showSignUpPassword ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-[#0c0e12] border border-zinc-800 rounded-lg px-3 py-2.5 pr-10 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-mono transition-colors tracking-widest placeholder:tracking-normal placeholder:font-sans" placeholder="••••" required/>
            <button
              type="button"
              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 focus:outline-none"
            >
              {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider bg-red-950/20 border border-red-900/30 px-2.5 py-1.5 rounded-lg animate-pulse">⚠️ {error}</p>}
        <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 hover:bg-[#00ffcc] disabled:opacity-50 text-black font-mono font-bold uppercase tracking-wider text-xs py-3 rounded-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/10">
          <CheckCircle className="w-4 h-4 stroke-[2.5]" /> {isLoading ? 'Verifying Gateway...' : '[ AUTHORIZE SESSION ]'}
        </button>
      </form>
    </div>
  );
};
