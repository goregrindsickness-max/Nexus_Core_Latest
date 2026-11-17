import React, { useState, useEffect } from 'react';
import { CheckCircle2, Calendar, MapPin, Sparkles, QrCode, Shield, Check, Info } from 'lucide-react';
import QRCode from 'react-qr-code';

interface GuestPassConfirmViewProps {
  onGoToApp: () => void;
}

export default function GuestPassConfirmView({ onGoToApp }: GuestPassConfirmViewProps) {
  // Extract query parameters
  const [params, setParams] = useState({
    email: '',
    guestName: '',
    band: '',
    date: '',
    venue: '',
    passType: 'General',
  });

  const [validatedTime, setValidatedTime] = useState('');
  const [animationClass, setAnimationClass] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setParams({
      email: urlParams.get('email') || 'guest@example.com',
      guestName: urlParams.get('guestName') || 'VIP Guest',
      band: urlParams.get('band') || 'The Artist',
      date: urlParams.get('date') || 'TBA',
      venue: urlParams.get('venue') || 'Exclusive Event Venue',
      passType: urlParams.get('pass_type') || 'General',
    });

    // Set validation time to current localized string
    const now = new Date();
    setValidatedTime(now.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZoneName: 'short' 
    }));

    // Trigger visual reveal animations
    const timer = setTimeout(() => setAnimationClass(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Format pass type with elegant badge styling
  const getPassTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vip':
        return 'VIP Access Pass';
      case 'crew':
        return 'Crew Member All-Access';
      case 'media':
      case 'press':
        return 'Media & Press Credential';
      default:
        return 'General Guest Entry Pass';
    }
  };

  const getPassColorTheme = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vip':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-950/20 border-amber-500/40',
          drop: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          badge: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black',
        };
      case 'crew':
        return {
          text: 'text-purple-400',
          bg: 'bg-purple-950/20 border-purple-500/40',
          drop: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
          badge: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
        };
      case 'media':
      case 'press':
        return {
          text: 'text-blue-400',
          bg: 'bg-blue-950/20 border-blue-500/40',
          drop: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
          badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
        };
      default:
        return {
          text: 'text-[#00ffcc]',
          bg: 'bg-emerald-950/15 border-[#00ffcc]/30',
          drop: 'shadow-[0_0_20px_rgba(0,255,204,0.1)]',
          badge: 'bg-gradient-to-r from-[#00ffcc] to-teal-500 text-black',
        };
    }
  };

  const theme = getPassColorTheme(params.passType);

  return (
    <div className="w-full min-h-screen bg-[#080a0f] text-[#f3f4f6] font-sans flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden">
      
      {/* Concert Dynamic Background Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-15 pointer-events-none scale-105 filter blur-xs"
        style={{ backgroundImage: `url('https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20live%20music%20concert%201.png')` }}
      />
      {/* Ambient overlay shadows */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/90 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Primary Container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-1.5 focus:outline-none select-none">
            {/* Logo copy using Nexus Brackets styling */}
            <span className="text-[#00ffcc] font-mono font-black text-2xl tracking-tighter drop-shadow-[0_0_8px_rgba(0,255,204,0.5)]">[</span>
            <span className="text-white font-mono font-black text-xl tracking-[0.25em] uppercase pl-1">NEXUS</span>
            <span className="text-purple-500 font-mono font-black text-xl tracking-[0.1em] -ml-1 flex items-center">_</span>
            <span className="text-white font-mono font-black text-xl tracking-[0.25em] uppercase pr-1">CORE</span>
            <span className="text-[#00ffcc] font-mono font-black text-2xl tracking-tighter drop-shadow-[0_0_8px_rgba(0,255,204,0.5)]">]</span>
          </div>
          <div className="text-[9px] font-mono text-[#00ffcc]/80 tracking-[0.35em] uppercase mt-2.5 font-extrabold">
            SECURE LIVE OPS TRANSITIONS
          </div>
        </div>

        {/* Live pass card */}
        <div 
          className={`w-full bg-[#12151e]/95 border border-[#1f2736] rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-700 transform ${
            animationClass ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
          } ${theme.drop}`}
        >
          
          {/* Status strip top */}
          <div className="bg-[#080a0f] border-b border-[#1f2736] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">// SECURE STATUS VALIDATED</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
              ONLINE PASS
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Artist Brand Cover Title */}
            <div className="text-center space-y-2">
              <div className="text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-purple-400">
                OFFICIAL WORKSPACE CONFIRMATION
              </div>
              <h2 className="text-3xl font-sans font-black tracking-tight text-white leading-none">
                {params.band}
              </h2>
              <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border tracking-wider bg-white/5 border-white/10 text-white">
                LIVE VISITOR CREDENTIAL
              </div>
            </div>

            {/* Split Grid Details */}
            <div className="grid grid-cols-2 gap-4 border-y border-zinc-800/60 py-4 font-sans">
              <div className="space-y-1">
                <span className="block text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider">DATE OF WORK</span>
                <span className="text-white text-xs font-bold leading-tight flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  {params.date}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider">VENUE DESTINATION</span>
                <span className="text-white text-xs font-bold leading-tight flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 truncate" />
                  <span className="truncate" title={params.venue}>{params.venue}</span>
                </span>
              </div>
            </div>

            {/* Credential Name Card with Highlight Color */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 gap-1 ${theme.bg}`}>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">ASSIGNED CREDENTIAL LEVEL</span>
              <span className={`text-lg font-mono font-black uppercase tracking-wider ${theme.text}`}>
                {getPassTypeName(params.passType)}
              </span>
            </div>

            {/* Holder information */}
            <div className="space-y-3 bg-[#0d1017] border border-zinc-850/70 p-4.5 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-0.5">REGISTERED HOLDER</span>
                  <p className="text-sm font-sans font-extrabold text-white leading-tight">{params.guestName}</p>
                  <p className="text-[10px] font-mono text-zinc-400">{params.email}</p>
                </div>
                <div className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#00ffcc]" />
                  <span className="text-[9px] font-mono font-bold text-[#00ffcc]">ID CO-OP</span>
                </div>
              </div>
            </div>

            {/* Dynamic barcode grid box */}
            <div className="flex flex-col items-center space-y-3 pt-2">
              <div className="p-3 bg-white rounded-xl shadow-lg border border-zinc-200 flex items-center justify-center">
                <div style={{ background: 'white', padding: '2px', width: '120px', height: '120px' }}>
                  <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={window.location.href}
                    viewBox={`0 0 256 256`}
                    fgColor="#080a0f"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest">GATE CHECK-IN DIGITAL SEAL</p>
                <p className="text-[7.5px] font-mono text-zinc-650 mt-1 uppercase selection:bg-none">
                  TOKEN: NCT-{params.passType.substring(0,3).toUpperCase()}-{Math.floor(100000 + Math.random() * 900000)}
                </p>
              </div>
            </div>

          </div>

          {/* Validation bottom receipt */}
          <div className="bg-[#080a0f] border-t border-[#1f2736] p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>HANDSHAKE SECURE & ACTIVE</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-500">
              Validating Node Time: {validatedTime}
            </p>
          </div>

        </div>

        {/* Security Warning Information bar */}
        <div className="mt-5 w-full flex items-start gap-2.5 p-3 rounded-xl border border-zinc-850/60 bg-[#12151e]/40">
          <Info className="w-4 h-4 text-[#00ffcc] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-sans text-zinc-400 leading-normal">
            Show up at the venue credential desk or priority VIP lane. Host security personnel will scan this active digital QR-token or verify your identity against the digital guestlist to issue your physical wristband.
          </p>
        </div>

        {/* Action button – Return to gateway app */}
        <button
          onClick={onGoToApp}
          className="mt-8 w-full max-w-sm py-4 rounded-xl border border-[#00ffcc] bg-transparent text-[#00ffcc] font-mono font-black text-xs uppercase tracking-widest text-center cursor-pointer transition-all hover:bg-[#00ffcc] hover:text-black hover:scale-[1.01] active:scale-95 duration-150 shadow-[0_0_15px_rgba(0,255,204,0.15)] flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>[ RETURN TO PORTAL ]</span>
        </button>

      </div>

      {/* Humble visual footer - clean & non-cluttered */}
      <div className="mt-12 text-center text-zinc-600 font-mono text-[9px] tracking-wider z-10 select-none">
        &copy; 2026 NEXUS CORE SECURED HANDSHAKE DISPATCH GATEWAY.
      </div>

    </div>
  );
}
