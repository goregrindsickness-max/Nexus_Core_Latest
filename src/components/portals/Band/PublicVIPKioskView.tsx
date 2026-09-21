import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  MapPin, 
  Ticket, 
  Sparkles, 
  UserCheck, 
  Gift, 
  Compass, 
  Share2, 
  CheckCircle2, 
  HelpCircle, 
  Lock, 
  Smartphone, 
  PhoneCall, 
  LogOut, 
  Scan, 
  Cpu, 
  Check, 
  Zap, 
  Activity 
} from 'lucide-react';
import { LoyaltyMember, Show } from '../../../types';
import { getSupabase, generateUUID } from '../../../supabase';

interface PublicVIPKioskViewProps {
  onBackToApp: () => void;
  activeBandName: string;
  onSignUp: (member: LoyaltyMember) => void;
  shows?: Show[];
  loyaltyMembers?: LoyaltyMember[];
  onUpdateMember?: (member: LoyaltyMember) => void;
}

export default function PublicVIPKioskView({ 
  onBackToApp, 
  activeBandName, 
  onSignUp,
  shows = [],
  loyaltyMembers = [],
  onUpdateMember
}: PublicVIPKioskViewProps) {
  
  // Dynamic session simulation for active fan
  const [currentFan, setCurrentFan] = useState<LoyaltyMember | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(true);

  // Bottom Navigation state (pass, radar, quiz, wallet)
  const [activeTab, setActiveTab] = useState<'pass' | 'radar' | 'quiz' | 'wallet'>('pass');

  // Register Inputs
  const [fanName, setFanName] = useState('');
  const [fanEmail, setFanEmail] = useState('');
  const [fanPhone, setFanPhone] = useState('');
  const [fanCity, setFanCity] = useState('');
  const [fanState, setFanState] = useState('');
  const [fanCountry, setFanCountry] = useState('United States');
  const [fanPin, setFanPin] = useState('');
  const [fanOptIn, setFanOptIn] = useState(true);

  // Login Inputs
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // GPS SIM Location Proximity
  const [gpsVerifiedShows, setGpsVerifiedShows] = useState<string[]>([]);
  const [gpsSimLocation, setGpsSimLocation] = useState<'Chicago' | 'Brooklyn' | 'Denver' | 'LA'>('Chicago');
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);

  // Quiz game state
  const [quizRating, setQuizRating] = useState<number | null>(null);
  const [quizFavoriteSong, setQuizFavoriteSong] = useState('');
  const [quizVibe, setQuizVibe] = useState('MELTED MY FACE 💥');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCoupon, setQuizCoupon] = useState('');

  // General Notification toast
  const [toastMessage, setToastMessage] = useState('');

  const triggerLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  // Co-Op coordinate lookup mappings
  const gpsCoords = {
    Chicago: { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL (Subterranean Area)' },
    Brooklyn: { lat: 40.7128, lon: -73.9352, name: 'Brooklyn, NY (Saint Vitus Area)' },
    Denver: { lat: 39.7392, lon: -104.9903, name: 'Denver, CO (Red Rocks Area)' },
    LA: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA (No Tour Stops)' }
  };

  const getDistanceMiles = (showCity: string): number => {
    const curCity = gpsSimLocation.toLowerCase();
    const cityLower = showCity.toLowerCase();
    
    if (curCity === 'chicago') {
      if (cityLower.includes('chicago')) return 2.4;
      if (cityLower.includes('brooklyn') || cityLower.includes('ny')) return 712;
      if (cityLower.includes('denver') || cityLower.includes('co')) return 918;
    }
    if (curCity === 'brooklyn') {
      if (cityLower.includes('chicago')) return 712;
      if (cityLower.includes('brooklyn') || cityLower.includes('ny')) return 4.1;
      if (cityLower.includes('denver') || cityLower.includes('co')) return 1620;
    }
    if (curCity === 'denver') {
      if (cityLower.includes('chicago')) return 918;
      if (cityLower.includes('brooklyn') || cityLower.includes('ny')) return 1620;
      if (cityLower.includes('denver') || cityLower.includes('co')) return 12.8;
    }
    return 1100 + Math.random() * 400;
  };

  // Convert Scans count into Loyalty Tier Level details
  const getFanLoyaltyDetails = (scans: number = 0) => {
    if (scans >= 4) {
      return { tier: 'DIAMOND', mult: '20% OFF ALL MERCH', color: 'text-cyan-400 border-cyan-400/40 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.25)]', colorStop: 'from-cyan-500/30 via-slate-950 to-[#0e1726]', accent: 'text-cyan-400' };
    }
    if (scans === 3) {
      return { tier: 'GOLD', mult: '15% OFF ALL MERCH', color: 'text-amber-400 border-amber-400/40 bg-amber-950/20 shadow-[0_0_15px_rgba(251,191,36,0.20)]', colorStop: 'from-amber-500/25 via-slate-950 to-[#1c1917]', accent: 'text-amber-400' };
    }
    if (scans === 2) {
      return { tier: 'SILVER', mult: '12.5% OFF ALL MERCH', color: 'text-zinc-200 border-zinc-700/60 bg-zinc-900/20 shadow-[0_0_10px_rgba(228,228,231,0.15)]', colorStop: 'from-zinc-500/20 via-slate-950 to-[#18181b]', accent: 'text-zinc-300' };
    }
    // Bronze default
    return { tier: 'BRONZE', mult: '10% OFF ALL MERCH', color: 'text-orange-400 border-orange-950/40 bg-orange-950/10', colorStop: 'from-orange-500/15 via-slate-950 to-[#0f172a]', accent: 'text-orange-400' };
  };

  // Register New Fan Profile Card
  const handleRegisterFan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fanName.trim() || !fanEmail.trim() || !fanPhone.trim() || !fanCity.trim() || !fanState.trim() || !fanPin.trim()) {
      alert('Please complete all requested contact fields!');
      return;
    }
    const cleanPhone = fanPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      alert('Please specify a valid mobile telephone number!');
      return;
    }
    if (fanPin.length !== 4 || isNaN(Number(fanPin))) {
      alert('Your security PIN code must be exactly 4 digits!');
      return;
    }

    const uniqueCodeSuffix = Math.floor(Math.random() * 9000 + 1000);
    const firstName = fanName.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();

    const supabase = getSupabase();
    let memberId = `loyalty_${Date.now()}`;
    
    if (supabase) {
      try {
        const authPass = (fanPin.trim() + "000000").slice(0, 6);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: fanEmail.trim(),
          password: authPass,
          options: {
            data: {
              full_name: fanName.trim(),
              display_name: fanName.trim(),
              role: 'Fan Listener',
              account_type: 'fan'
            }
          }
        });
        if (!authError && authData?.user) {
          memberId = authData.user.id;
        } else if (authError) {
          console.warn("Kiosk auth signup warning/error, falling back to UUID:", authError);
          memberId = generateUUID();
        } else {
          memberId = generateUUID();
        }
      } catch (e) {
        console.warn("Kiosk auth setup failed, using generated ID:", e);
        memberId = generateUUID();
      }
    } else {
      memberId = generateUUID();
    }

    // Create loyalty profile
    const newMember: LoyaltyMember = {
      id: memberId,
      created_at: new Date().toISOString(),
      name: fanName,
      city: fanCity,
      state: fanState,
      country: fanCountry,
      email: fanEmail,
      phone: cleanPhone,
      pin: fanPin,
      opt_in_promotions: fanOptIn,
      lifetime_discount_uses: 0,
      scans_count: 1, // Start with 1 scan for registering in-venue!
      points: 100, // Pre-load 100 registration points
      scanned_shows: []
    };

    onSignUp(newMember);
    setCurrentFan(newMember);
    setActiveTab('pass');
    triggerLocalToast(`🎉 Welcome to the inner circle, @${newMember.name.split(' ')[0]}!`);

    if (supabase) {
      try {
        // 1. Sync the localized loyalty analytics entry as intended
        await supabase.from('loyalty_members').insert([newMember]);

        // 2. Mirror a pure personal platform profile so they can log in via LoginView
        const coreProfileMirror = {
          id: newMember.id, // Shares the same secure registration ID matrix
          created_at: newMember.created_at,
          full_name: newMember.name,
          email: newMember.email,
          city_state: `${newMember.city}, ${newMember.state}`,
          pin: newMember.pin,
          account_type: 'fan',           // Keeps them isolated in a standard personal tier
          sub_tier: 'free_for_life'     // Clean default setting matching our lean schema
        };

        await supabase.from('profiles').insert([coreProfileMirror]);

      } catch (err) {
        console.error('Failed to coordinate network synchronization pipelines:', err);
      }
    }

    // Clear Inputs
    setFanName('');
    setFanEmail('');
    setFanPhone('');
    setFanPin('');
    setFanCity('');
    setFanState('');
  };

  // Login Existing Fan Card
  const handleLoginFan = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = loginPhone.replace(/\D/g, '');
    
    if (!cleanPhone || loginPin.length !== 4) {
      setLoginError('Complete phone lookup & exact 4-digit PIN first.');
      return;
    }

    // Search existing roster records
    const matched = loyaltyMembers.find(m => m.phone === cleanPhone && m.pin === loginPin);
    if (matched) {
      // Restore fan state defaults or fallback values for safe execution
      const hydrated: LoyaltyMember = {
        ...matched,
        scans_count: matched.scans_count || 1,
        points: matched.points || 150,
        scanned_shows: matched.scanned_shows || []
      };
      setCurrentFan(hydrated);
      setActiveTab('pass');
      setLoginPhone('');
      setLoginPin('');
      triggerLocalToast(`🔑 VIP wallet unlocked! Pitcher-perfect, ${hydrated.name.split(' ')[0]}`);
    } else {
      setLoginError('No matching telephone + PIN profile verified. Secure checkout credentials.');
    }
  };

  // Virtual Check-In Simulation (GPS validation)
  const handleGpsVerification = (show: Show) => {
    if (!currentFan) return;
    setIsVerifyingGps(true);
    
    setTimeout(async () => {
      setIsVerifyingGps(false);
      const distance = getDistanceMiles(show.city);
      
      if (distance < 50) {
        // Already checked into tonight's gig coordinates?
        const alreadyScanned = (currentFan.scanned_shows || []).includes(show.id);
        
        if (alreadyScanned) {
          triggerLocalToast(`🛰️ GPS: You already verified attendance for ${show.city}!`);
          return;
        }

        // Apply reward points + scans level progression
        const updatedShows = [...(currentFan.scanned_shows || []), show.id];
        const nextScans = (currentFan.scans_count || 1) + 1;
        const nextPoints = (currentFan.points || 150) + 120; // 120 XP points for active venue presence

        const updatedFan: LoyaltyMember = {
          ...currentFan,
          scans_count: nextScans,
          points: nextPoints,
          scanned_shows: updatedShows
        };

        setCurrentFan(updatedFan);
        
        // Notify Parent callbacks
        if (onUpdateMember) {
          onUpdateMember(updatedFan);
        } else {
          onSignUp(updatedFan); // fallback upsert in parent local state
        }

        // Push updates to database if online
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.from('loyalty_members').update({
              scans_count: nextScans,
              points: nextPoints,
              scanned_shows: updatedShows
            }).eq('id', currentFan.id);
          } catch(e) {
            console.error(e);
          }
        }

        triggerLocalToast(`🛰️ GPS LOCATED! Staged validation SUCCESS: Tier progressed!`);
      } else {
        triggerLocalToast(`❌ GPS LIMIT EXCEED: You must be within 50 miles of ${show.city}!`);
      }
    }, 1200);
  };

  // Handle Quiz Submissions
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFan || quizRating === null) return;

    const code = `QUIZ50-${currentFan.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    setQuizCoupon(code);
    setQuizSubmitted(true);

    const nextPoints = (currentFan.points || 150) + 50; // Give 50 points for feedback
    const updatedFan: LoyaltyMember = {
      ...currentFan,
      points: nextPoints
    };
    setCurrentFan(updatedFan);
    if (onUpdateMember) onUpdateMember(updatedFan);

    // Update DB
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('loyalty_members').update({ points: nextPoints }).eq('id', currentFan.id);
      } catch (err) {
        console.error(err);
      }
    }

    triggerLocalToast(`🧠 Feedback Recorded: +50 Loyalty XP granted!`);
  };

  const fanDetails = currentFan ? getFanLoyaltyDetails(currentFan.scans_count) : null;

  return (
    <div className="fixed inset-0 bg-[#06080c] z-50 flex items-center justify-center p-4 min-h-screen overflow-y-auto font-sans">
      
      {/* Background neon decor elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main mobile framing */}
      <div className="relative bg-zinc-950 border-4 border-zinc-850 rounded-[44px] w-full max-w-md overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] min-h-[640px] flex flex-col justify-between">
        
        {/* Device camera hardware notch mock */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-5 bg-zinc-950 border-b border-zinc-850 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-zinc-900 border border-zinc-800 rounded-full mr-2" />
          <div className="w-12 h-1 bg-zinc-900 rounded-full" />
        </div>

        {/* Localized Toast notifications */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 16, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              className="absolute top-6 left-4 right-4 z-50 bg-[#02ffcc] text-black px-4 py-2.5 rounded-2xl text-[10.5px] font-mono leading-normal font-black text-center shadow-[0_4px_20px_rgba(2,255,204,0.3)] border border-teal-300"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. STATE LOCKOUT: Enter or Login Kiosk */}
        {!currentFan ? (
          <div className="p-6 pt-12 flex-grow overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Brand Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl uppercase font-mono tracking-widest text-[9px] font-black items-center gap-1.5">
                  <Award className="w-4 h-4 animate-bounce text-[#00ffcc]" />
                  <span>VIP Concert Companion Gate</span>
                </div>
                <h2 className="text-2xl font-display font-medium text-white tracking-tight uppercase leading-none mt-2">
                  {activeBandName}
                </h2>
                <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                  Exclusive Tour Rewards, Check-In & Perks
                </span>
              </div>

              {/* Toggle controls */}
              <div className="flex bg-zinc-900/60 p-1 border border-zinc-850 rounded-xl gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`flex-1 py-2 text-[10px] font-mono font-black uppercase rounded-lg transition ${
                    isRegisterMode ? 'bg-purple-950/45 text-purple-300 border border-purple-500/20' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  [ VIP Sign Up ]
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className={`flex-1 py-2 text-[10px] font-mono font-black uppercase rounded-lg transition ${
                    !isRegisterMode ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  [ Access Wallet ]
                </button>
              </div>

              {/* Login mode */}
              {!isRegisterMode ? (
                <form onSubmit={handleLoginFan} className="space-y-4">
                  <div className="text-center pb-2 border-b border-zinc-900">
                    <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase">Input Credential Tokens</h3>
                    <p className="text-[10px] text-zinc-500 text-sans mt-1 leading-normal">
                      Verify your telephone credentials to recall existing reward points, digital companion passes, and gig tier statistics.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 font-mono text-[9px] text-left leading-normal">
                      ⚠️ ERROR: {loginError}
                    </div>
                  )}

                  <div className="space-y-3 font-mono text-[10px]">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Registered Telephone</label>
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 3125550188"
                        className="w-full bg-black border border-zinc-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 text-center font-mono placeholder:text-zinc-750"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Secret 4-Digit PIN</label>
                      <input
                        type="password"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        required
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-black border border-zinc-850 rounded-xl p-2.5 text-base text-center text-[#00ffcc] tracking-widest font-black focus:outline-none focus:border-teal-400 font-mono placeholder:text-zinc-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs uppercase font-mono font-black tracking-widest transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(147,51,234,0.2)]"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-300" /> Unlock VIP Wallet
                  </button>
                </form>
              ) : (
                /* Registration Mode */
                <form onSubmit={handleRegisterFan} className="space-y-3.5">
                  <div className="bg-purple-950/10 border border-purple-500/10 p-3 rounded-xl">
                    <span className="text-[9.5px] font-mono text-[#00ffcc] uppercase block font-black mb-1">🎁 VIP GUEST GIG BENEFITS:</span>
                    <ul className="text-[9px] font-mono text-zinc-400 space-y-0.5 list-disc list-inside">
                      <li>Earn <strong>20% Off</strong> entire merch counter checkouts tonight</li>
                      <li>Progressive tiers unlock up to <strong>20% Lifetime Off</strong></li>
                      <li>Check-in using radar to claim +120 attendance points!</li>
                    </ul>
                  </div>

                  <div className="space-y-2.5 font-mono text-[9px] text-left">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-zinc-500 uppercase tracking-wide block">Contact Full Name</label>
                      <input
                        type="text"
                        required
                        value={fanName}
                        onChange={(e) => setFanName(e.target.value)}
                        placeholder="Sarah Connor"
                        className="w-full bg-black/60 border border-purple-950/75 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] text-zinc-500 uppercase tracking-wide block">Email Address</label>
                      <input
                        type="email"
                        required
                        value={fanEmail}
                        onChange={(e) => setFanEmail(e.target.value)}
                        placeholder="sarah@apocalypse.org"
                        className="w-full bg-black/60 border border-purple-950/75 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] text-zinc-500 uppercase tracking-wide block">Mobile Telephone Number</label>
                      <input
                        type="tel"
                        required
                        value={fanPhone}
                        onChange={(e) => setFanPhone(e.target.value)}
                        placeholder="3125550224"
                        className="w-full bg-black/60 border border-purple-950/75 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-500 uppercase tracking-wide block">City</label>
                        <input
                          type="text"
                          required
                          value={fanCity}
                          onChange={(e) => setFanCity(e.target.value)}
                          placeholder="Chicago"
                          className="w-full bg-black/60 border border-purple-950/75 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 uppercase tracking-wide font-black block">Secret 4-Digit PIN</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={fanPin}
                          onChange={(e) => setFanPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="0000"
                          className="w-full bg-black border border-purple-500/40 rounded-xl p-2.5 text-xs text-center text-[#2affcc] tracking-widest font-black focus:outline-none focus:border-[#2affcc] font-mono"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fanOptIn}
                        onChange={(e) => setFanOptIn(e.target.checked)}
                        className="mt-0.5 text-purple-600 bg-black border-zinc-900 rounded cursor-pointer"
                      />
                      <span className="text-[8px] text-zinc-500 leading-normal font-sans">
                        I explicitly consent to receive newsletters, upcoming tour check-in alerts, early ticket presales and limited merch editions drop alerts.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#00ffcc] hover:bg-teal-400 text-black rounded-xl text-xs uppercase font-mono font-black tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-[0_5px_15px_rgba(0,255,204,0.15)]"
                  >
                    Claim 20% Discount Pass 🎫
                  </button>
                </form>
              )}

            </div>

            <div className="pt-6 border-t border-zinc-900 text-center">
              <button
                type="button"
                onClick={onBackToApp}
                className="text-[9px] font-mono text-zinc-550 hover:text-white uppercase tracking-widest cursor-pointer"
              >
                [ EXIT PORTAL MODE & RETURN TO HUB ]
              </button>
            </div>
          </div>
        ) : (
          
          /* 2. LOGGED-IN CUSTOMER VIEW STAGE */
          <div className="flex-grow flex flex-col justify-between pt-12">
            
            {/* Top Brand Logo Strip */}
            <div className="px-5 pb-3 border-b border-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-tight">VIP BAND COMPANION</h4>
                  <span className="text-[8.5px] font-mono text-purple-400 uppercase leading-none block">{activeBandName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Virtual XP Points indicator */}
                <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded-lg flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-mono font-black text-white">{currentFan.points || 150} <span className="text-[8px] text-zinc-500">XP</span></span>
                </div>

                <button
                  onClick={() => {
                    setCurrentFan(null);
                    triggerLocalToast('🔒 Checked out of the session.');
                  }}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300 rounded-lg border border-zinc-850 hover:border-red-500/20 cursor-pointer"
                  title="Logout VIP"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable primary body space */}
            <div className="p-5 flex-grow overflow-y-auto max-h-[58vh] scrollbar-thin">
              
              {/* TAB 1: Loyalty Pass Card View */}
              {activeTab === 'pass' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center"
                >
                  <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                    Show this holographic VIP membership pass at the merch checkout table or supply your telephone number to deduct active tier rewards!
                  </p>

                  {/* HIGH AESTHETIC HOLOGRAPHIC PASS */}
                  <div className={`p-5 rounded-[24px] border flex flex-col justify-between h-[230px] relative overflow-hidden bg-gradient-to-br ${fanDetails.colorStop} border-purple-500/30 transition-all font-mono text-left shadow-2xl`}>
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-[#00ffcc]/5 rounded-full blur-2xl font-mono" />
                    <div className="absolute bottom-2 right-2 text-[7px] text-zinc-650 tracking-wider">
                      LO-FI SYNCED SECURE ENVELOPE
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-zinc-500 uppercase font-black">NEXUS DRIP ID</span>
                        <div className="text-[10.5px] font-black text-white">#VIP-{currentFan.id.toUpperCase().substring(8, 14)}</div>
                      </div>

                      <div className={`px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase shrink-0 ${fanDetails.color}`}>
                        {fanDetails.tier}
                      </div>
                    </div>

                    <div className="space-y-0.5 my-3">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">MEMBER NAME</span>
                      <div className="text-lg font-display font-medium text-white uppercase leading-tight truncate">{currentFan.name}</div>
                      <span className="text-[9px] text-purple-300">Hometown: {currentFan.city}, {currentFan.state}</span>
                    </div>

                    <div className="bg-black/75 border border-zinc-900 rounded-xl p-2.5 flex items-center justify-between text-left gap-1">
                      <div>
                        <span className="text-[7.5px] text-[#00ffcc] tracking-widest uppercase block font-black">VERIFIED COUPON CODE</span>
                        <span className="text-xs font-black text-white">
                          VIP20-{currentFan.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase()}-{currentFan.pin}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold text-[#00ffcc] bg-[#00ffcc]/10 border border-[#00ffcc]/20 px-1 py-0.5 rounded shrink-0 leading-none">
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2 text-left">
                    <span className="text-[9px] font-mono text-[#00ffcc] font-black uppercase tracking-wider block">⭐ GIG PROGRESS SUMMARY</span>
                    <div className="grid grid-cols-2 gap-3 text-zinc-400 font-mono text-[10px]">
                      <div className="p-2 bg-black/40 rounded-lg border border-zinc-900">
                        <span className="text-[8px] text-zinc-500 uppercase block">Gigs Checked In</span>
                        <span className="text-sm font-bold text-white">{currentFan.scans_count || 1} shows</span>
                      </div>
                      <div className="p-2 bg-black/40 rounded-lg border border-zinc-900">
                        <span className="text-[8px] text-zinc-500 uppercase block">Active Perks</span>
                        <span className="text-xs font-bold text-purple-400 truncate block">{fanDetails.mult}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: Tour Radar / GPS Proximity (Verify Presence) */}
              {activeTab === 'radar' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-left"
                >
                  <div className="border-b border-zinc-900 pb-2.5">
                    <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#00ffcc] animate-spin" />
                      <span>🛰️ Coordinate Radar check-in</span>
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-sans mt-1 leading-normal">
                      The FOH portal cross-references your cell location coordinates with tonight's target venue coordinates. Stay within 50 miles perimeter to unlock your gig XP points!
                    </p>
                  </div>

                  {/* Virtual environment shifter */}
                  <div className="p-3 bg-black border border-zinc-850 rounded-xl space-y-2 font-mono text-[9px]">
                    <span className="text-zinc-500 uppercase font-black block">SHIFT VIRTUAL RADAR POSITION</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['Chicago', 'Brooklyn', 'Denver', 'LA'] as const).map((loc, idx) => (
                        <button
                          key={`${loc}-${idx}`}
                          type="button"
                          onClick={() => {
                            setGpsSimLocation(loc);
                            triggerLocalToast(`📍 Changed physical GPS location to ${loc}`);
                          }}
                          className={`py-1 rounded text-[8.5px] uppercase font-bold text-center border cursor-pointer ${
                            gpsSimLocation === loc 
                              ? 'bg-[#00ffcc]/15 text-[#00ffcc] border-[#00ffcc]/40' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                    <span className="text-[8px] text-zinc-550 block">CURRENT SIM: <strong className="text-white">{gpsSimLocation.toUpperCase()}</strong></span>
                  </div>

                  {/* Renders shows list */}
                  <div className="space-y-2.5">
                    {shows.slice(0, 5).map((show, idx) => {
                      const distance = getDistanceMiles(show.city);
                      const isInRange = distance < 50;
                      const alreadyScanned = (currentFan.scanned_shows || []).includes(show.id);

                      return (
                        <div key={`${show.id}-${idx}`} className="p-3 bg-[#0e1015]/80 border border-zinc-900 rounded-xl flex items-center justify-between gap-3 font-mono">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-white block">{show.city}</span>
                            <span className="text-[9px] text-zinc-500 uppercase block">{show.date} • {show.name || 'FOH Venue'}</span>
                            <span className={`text-[8.5px] uppercase font-semibold ${isInRange ? 'text-emerald-400' : 'text-zinc-650'}`}>
                              Distance: ~{distance.toFixed(1)} miles
                            </span>
                          </div>

                          {alreadyScanned ? (
                            <span className="p-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[8.5px] font-black uppercase shrink-0">
                              ✓ Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGpsVerification(show)}
                              disabled={isVerifyingGps}
                              className={`py-1.5 px-3 rounded-lg text-[9px] uppercase font-black tracking-tight transition cursor-pointer shrink-0 ${
                                isInRange 
                                  ? 'bg-[#00ffcc] text-black hover:bg-teal-400 font-extrabold shadow-[0_0_10px_rgba(2,255,204,0.2)]' 
                                  : 'bg-zinc-900 border border-zinc-850 text-zinc-600 cursor-not-allowed border-dashed'
                              }`}
                            >
                              {isVerifyingGps ? 'PINGING...' : '[ SCAN GPS ]'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: Sound Check Quiz Section */}
              {activeTab === 'quiz' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-left"
                >
                  <div className="border-b border-zinc-900 pb-2">
                    <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>🧠 Face-Melter Feedback quiz</span>
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                      Submit feedback about your concert experience tonight to score <strong>+50 Bonus Loyalty XP</strong> and claim a unique 25% off coupon!
                    </p>
                  </div>

                  {!quizSubmitted ? (
                    <form onSubmit={handleQuizSubmit} className="space-y-3 font-mono text-[10px]">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider block">1. RATE TONIGHT'S SOUND PERFORMANCE WORK:</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num, idx) => (
                            <button
                              key={`${num}-${idx}`}
                              type="button"
                              onClick={() => setQuizRating(num)}
                              className={`flex-1 py-1.5 border rounded-lg text-xs font-black transition cursor-pointer ${
                                quizRating === num 
                                  ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_12px_rgba(147,51,234,0.25)]' 
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                              }`}
                            >
                              {num} ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-wider block">2. CHOOSE THE SONG THAT MELTED YOUR FACE MOST:</label>
                        <input
                          type="text"
                          required
                          value={quizFavoriteSong}
                          onChange={(e) => setQuizFavoriteSong(e.target.value)}
                          placeholder="e.g. Subterranean Overload, Doomgazer"
                          className="w-full bg-black border border-zinc-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-555 uppercase tracking-wider block">3. CHOOSE GIG ENERGY TYPE:</label>
                        <select
                          value={quizVibe}
                          onChange={(e) => setQuizVibe(e.target.value)}
                          className="w-full bg-black border border-zinc-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="MELTED MY FACE 💥">MELTED MY FACE 💥</option>
                          <option value="CRUSHING HEAVY OBLIVION 💀">CRUSHING HEAVY OBLIVION 💀</option>
                          <option value="CHILL RETRO SYNTH ATMOSPHERE 🌌">CHILL RETRO SYNTH ATMOSPHERE 🌌</option>
                          <option value="SWEATY FLOOR MOSH INSANITY 🏃">SWEATY FLOOR MOSH INSANITY 🏃</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={quizRating === null || !quizFavoriteSong.trim()}
                        className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs uppercase font-extrabold tracking-widest rounded-xl transition cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Submit Feedback Survey
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-purple-950/20 border-2 border-purple-500/25 rounded-2xl text-center space-y-3 font-mono">
                      <div className="w-12 h-12 bg-purple-500/10 border border-purple-400/30 rounded-full flex items-center justify-center mx-auto text-purple-400">
                        <Gift className="w-6 h-6 animate-bounce" />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-purple-300 font-extrabold uppercase">SURVEY BONUS UNLOCKED!</span>
                        <h4 className="text-xs text-zinc-400">Congratulations! You earned +50 XP and a special 25% single-use discount coupon code:</h4>
                      </div>

                      <div className="bg-black border border-[#00ffcc]/30 p-3 rounded-xl select-all font-bold text-center text-sm text-[#00ffcc] tracking-widest font-mono">
                        {quizCoupon}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizRating(null);
                          setQuizFavoriteSong('');
                        }}
                        className="py-1 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[8.5px] uppercase"
                      >
                        [ Clear & Fill Custom Survey ]
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: WALLET TICKET WALLET STAGE */}
              {activeTab === 'wallet' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center"
                >
                  <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                    Digital Concert ticket. Organizers can sweep this verified pass gate at FOH with their scanner console!
                  </p>

                  {/* VINTAGE BRUTALIST CONCERT GIG TICKET */}
                  <div className="bg-[#0b0c10] border-2 border-dashed border-purple-900/60 rounded-2xl p-4 text-left font-mono text-[10px] space-y-3 relative overflow-hidden">
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-zinc-950 border-r border-b border-zinc-850 rounded-full" />
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-zinc-950 border-l border-b border-zinc-850 rounded-full" />
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-zinc-950 border-r border-t border-zinc-850 rounded-full" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-zinc-950 border-l border-t border-zinc-850 rounded-full" />

                    <div className="border-b border-purple-950/50 pb-2 flex justify-between items-center px-1">
                      <span className="font-black text-purple-400">TICKET TYPE: GUESTLIST VIP</span>
                      <span className="text-[8.5px] text-zinc-550 uppercase">SECURE PASS</span>
                    </div>

                    <div className="space-y-1.5 px-1 py-1 text-zinc-300">
                      <div>
                        <span className="text-[8px] text-zinc-550 uppercase block">CONCERT GIG</span>
                        <span className="font-bold text-white uppercase text-xs">{activeBandName} LIVE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div>
                          <span className="text-[8px] text-zinc-550 uppercase block">DATE & TIME</span>
                          <span>{shows[0] ? shows[0].date : 'TONIGHT 8:00PM'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-zinc-550 uppercase block">LOCATION CLUSTER</span>
                          <span className="truncate block">{shows[0] ? shows[0].city : 'MAIN CENTRAL'}</span>
                        </div>
                      </div>
                    </div>

                    {/* BARCODE MOCKED */}
                    <div className="border-t-2 border-dashed border-purple-950/60 pt-3 relative flex flex-col items-center justify-center space-y-1 px-1">
                      <div className="w-full h-11 bg-zinc-900 rounded border border-zinc-850 relative flex items-center justify-center overflow-hidden">
                        {/* Barcode line mock */}
                        <div className="flex gap-0.5 justify-center items-stretch h-7 w-5/6 opacity-85">
                          {[1,3,1,4,2,1,5,1,2,4,1,2,1,1,3,1,2,4,1,3,1,4,2,1,1,3,2,1,5].map((weight, i) => (
                            <div key={`vip-bar-${i}`} className="bg-white" style={{ width: `${weight * 1.5}px` }} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[8px] text-zinc-500 uppercase font-black">barcode-token-id: {currentFan.id.substring(8, 18).toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-purple-950/20 border border-purple-500/10 rounded-xl text-left text-[9px] font-mono leading-relaxed text-zinc-400 flex gap-2 items-center">
                    <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Provide your registered telephone number during merch checkouts to claim automatic tier reward discounts!</span>
                  </div>
                </motion.div>
              )}

            </div>

            {/* 3. BOTTOM TAB NAVIGATION BAR */}
            <div className="border-t border-zinc-900 bg-zinc-950 p-3 flex justify-around items-center gap-1">
              {[
                { id: 'pass', label: 'VIP Pass', icon: Award },
                { id: 'radar', label: 'Radar', icon: Compass },
                { id: 'quiz', label: 'XP Quiz', icon: Zap },
                { id: 'wallet', label: 'Wallet', icon: Ticket }
              ].map((tab, idx) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={`${tab.id}-${idx}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 text-[9px] font-mono uppercase font-black tracking-tighter cursor-pointer transition ${
                      isSelected ? 'text-[#00ffcc] scale-105' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'stroke-[2.5px] text-[#00ffcc]' : 'text-zinc-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
