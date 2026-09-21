import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Users, CloudRain, Megaphone, ShieldCheck, 
  HelpCircle, Edit3, Save, Compass, BarChart2, Star,
  Lock, Unlock, RefreshCw, AlertTriangle, Check, DollarSign
} from 'lucide-react';
import { Show, Sale } from '../../../types';
import InfoTip from '../../InfoTip';

interface BookingAdvisorAnalyticsProps {
  shows: Show[];
  setShows?: React.Dispatch<React.SetStateAction<Show[]>>;
  sales: Sale[];
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  bandName: string;
}

export default function BookingAdvisorAnalytics({
  shows = [],
  setShows,
  sales = [],
  triggerNotification,
  addLog,
  bandName
}: BookingAdvisorAnalyticsProps) {
  // Access control states
  const [accessLevel, setAccessLevel] = useState<'manager' | 'band' | 'agency'>('manager');
  const [authPin, setAuthPin] = useState('');
  const [isAccessLocked, setIsAccessLocked] = useState(true);
  const [showPinError, setShowPinError] = useState(false);

  // In-line auditing state
  const [editingShowId, setEditingShowId] = useState<string | null>(null);
  const [editActualAttendance, setEditActualAttendance] = useState<number>(0);
  const [editTicketPrice, setEditTicketPrice] = useState<number>(0);
  const [editWeather, setEditWeather] = useState<string>('Sunny');
  const [editPromo, setEditPromo] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  const [editMedium, setEditMedium] = useState<string>('socials');
  const [editTicketTier, setEditTicketTier] = useState<string>('normal');

  // Simulator State Parameters
  const [simCapacity, setSimCapacity] = useState<number>(400);
  const [simTicketPrice, setSimTicketPrice] = useState<number>(25);
  const [simWeather, setSimWeather] = useState<string>('Sunny');
  const [simPromoEffort, setSimPromoEffort] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  const [simMarketingMedium, setSimMarketingMedium] = useState<string>('socials');
  const [simSupportStrength, setSimSupportStrength] = useState<'unknown' | 'local' | 'regional' | 'national'>('regional');
  const [simDayOfWeek, setSimDayOfWeek] = useState<string>('Friday');

  // Trigger local synth check chime on interactions
  const triggerTickChime = (pitch = 640) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (_) {}
  };

  // Check PIN for current simulated role access
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication pin for demonstration
    // General code is '1312' or role-specific
    const correctPin = accessLevel === 'manager' ? '1234' : accessLevel === 'agency' ? '7777' : '0000';
    if (authPin === correctPin || authPin === '1312') {
      setIsAccessLocked(false);
      setShowPinError(false);
      triggerNotification(`Access Granted: logged in as Tour ${accessLevel.toUpperCase()}`);
      addLog(`Authorized Booking Advisor analytics access level: ${accessLevel}`);
      triggerTickChime(880);
    } else {
      setShowPinError(true);
      triggerNotification('Security Check Failed: Incorrect authorization code.');
      triggerTickChime(220);
    }
  };

  const handleLock = () => {
    setIsAccessLocked(true);
    setAuthPin('');
    triggerNotification('Security Lock Engaged.');
    triggerTickChime(350);
  };

  // Group shows and enrich them with sales metrics plus audit states
  const enrichedShows = useMemo(() => {
    return shows.map(show => {
      // Find sales happening on the day of this show
      const salesOnDate = sales.filter(s => {
        const sDate = s.created_at.split('T')[0];
        return sDate === show.date;
      });

      const merchRevenue = salesOnDate.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0);
      const itemsSold = salesOnDate.reduce((sum, s) => sum + (s.quantity || 1), 0);

      // Extract expected capacity based on existing values
      let capacity = 300;
      if (show.expected_attendance === '+100') capacity = 150;
      else if (show.expected_attendance === '100-300') capacity = 250;
      else if (show.expected_attendance === '300-700') capacity = 500;
      else if (show.expected_attendance === '700+') capacity = 1000;

      // Ensure fallback or mock initial audited variables if not set
      const computedActualAttendance = show.actual_attendance !== undefined 
        ? show.actual_attendance
        : Math.round(capacity * (show.status === 'Closed' ? 0.82 : 0.9));

      const computedTicketPrice = show.ticket_price || 20;
      const computedWeather = show.weather_condition || 'Sunny';
      const computedPromo = show.promo_effort || 'medium';
      const computedMedium = show.marketing_medium || 'socials';
      const computedTicketTier = show.ticket_tier_sold || 'normal';

      // Turnout ratio
      const turnoutRatio = capacity > 0 ? (computedActualAttendance / capacity) * 100 : 90;
      // Merch yield per head
      const yieldPerHead = computedActualAttendance > 0 ? merchRevenue / computedActualAttendance : 0;

      return {
        ...show,
        capacity,
        actualAttendance: computedActualAttendance,
        ticketPrice: computedTicketPrice,
        weather: computedWeather,
        promoEffort: computedPromo,
        marketingMedium: computedMedium,
        ticketTier: computedTicketTier,
        merchRevenue: parseFloat(merchRevenue.toFixed(2)),
        itemsSold,
        turnoutRatio: parseFloat(turnoutRatio.toFixed(2)),
        yieldPerHead: parseFloat(yieldPerHead.toFixed(2)),
        ticketRevenue: parseFloat((computedActualAttendance * computedTicketPrice).toFixed(2)),
        combinedRevenue: parseFloat(((computedActualAttendance * computedTicketPrice) + merchRevenue).toFixed(2))
      };
    });
  }, [shows, sales]);

  // Optimal Success Factor aggregations
  const optimalStats = useMemo(() => {
    if (enrichedShows.length === 0) {
      return {
        bestWeather: 'Sunny',
        bestPromo: 'medium',
        avgYield: 0,
        avgTurnout: 0
      };
    }

    // Weather performance: average turnout
    const weatherGroups: { [key: string]: { sum: number, count: number } } = {};
    const promoGroups: { [key: string]: { sum: number, count: number } } = {};
    let totalYieldSum = 0;
    let totalTurnoutSum = 0;
    let countEnriched = 0;

    enrichedShows.forEach(s => {
      totalYieldSum += s.yieldPerHead;
      totalTurnoutSum += s.turnoutRatio;
      countEnriched++;

      // Weather groups
      const w = s.weather;
      if (!weatherGroups[w]) weatherGroups[w] = { sum: 0, count: 0 };
      weatherGroups[w].sum += s.turnoutRatio;
      weatherGroups[w].count++;

      // Promo groups
      const p = s.promoEffort;
      if (!promoGroups[p]) promoGroups[p] = { sum: 0, count: 0 };
      promoGroups[p].sum += s.combinedRevenue;
      promoGroups[p].count++;
    });

    let bestWeather = 'Sunny';
    let maxWeatherAvg = 0;
    Object.entries(weatherGroups).forEach(([w, data]) => {
      const avg = data.sum / data.count;
      if (avg > maxWeatherAvg) {
        maxWeatherAvg = avg;
        bestWeather = w;
      }
    });

    let bestPromo = 'medium';
    let maxPromoAvg = 0;
    Object.entries(promoGroups).forEach(([p, data]) => {
      const avg = data.sum / data.count;
      if (avg > maxPromoAvg) {
        maxPromoAvg = avg;
        bestPromo = p;
      }
    });

    return {
      bestWeather,
      bestPromo,
      avgYield: parseFloat((totalYieldSum / countEnriched).toFixed(2)),
      avgTurnout: parseFloat((totalTurnoutSum / countEnriched).toFixed(1))
    };
  }, [enrichedShows]);

  // Start in-line editing for a specific show
  const startEditingShow = (show: any) => {
    triggerTickChime(700);
    setEditingShowId(show.id);
    setEditActualAttendance(show.actualAttendance);
    setEditTicketPrice(show.ticketPrice);
    setEditWeather(show.weather);
    setEditPromo(show.promoEffort);
    setEditMedium(show.marketingMedium);
    setEditTicketTier(show.ticketTier);
  };

  // Save the audited variables of a show back into parent state
  const saveAuditedShowData = (showId: string) => {
    if (!setShows) return;
    
    setShows(prev => prev.map(s => {
      if (s.id === showId) {
        return {
          ...s,
          actual_attendance: editActualAttendance,
          ticket_price: editTicketPrice,
          weather_condition: editWeather,
          promo_effort: editPromo,
          marketing_medium: editMedium,
          ticket_tier_sold: editTicketTier
        };
      }
      return s;
    }));

    setEditingShowId(null);
    triggerTickChime(960);
    triggerNotification('Audit Logs updated with verified parameters.');
    addLog(`Audited parameters of show '${shows.find(s => s.id === showId)?.name}': Attn ${editActualAttendance}, Tix $${editTicketPrice}, Weather ${editWeather}`);
  };

  // Run dynamic simulation model
  const simulationResult = useMemo(() => {
    // Basic baseline variables derived from global historical averages or default values
    const historicalAvgYield = optimalStats.avgYield > 0 ? optimalStats.avgYield : 4.50; // default average merch spend per head
    const historicalAvgTurnout = optimalStats.avgTurnout > 0 ? optimalStats.avgTurnout : 82.5; // average turnout percentage

    // Coefficients adjustments
    let weatherModifier = 1.0;
    if (simWeather === 'Rainy') weatherModifier = 0.88; // -12% turnout
    else if (simWeather === 'Stormy') weatherModifier = 0.70; // -30% turnout
    else if (simWeather === 'Cold') weatherModifier = 0.93; // -7% turnout
    else if (simWeather === 'Snowy') weatherModifier = 0.78; // -22% turnout
    else if (simWeather === 'Sunny') weatherModifier = 1.05; // +5% turnout

    let promoModifier = 1.0;
    if (simPromoEffort === 'none') promoModifier = 0.65; // -35% turnout
    else if (simPromoEffort === 'low') promoModifier = 0.85; // -15%
    else if (simPromoEffort === 'medium') promoModifier = 1.0;  // baseline
    else if (simPromoEffort === 'high') promoModifier = 1.25; // +25% turnout

    let mediumModifier = 1.0;
    if (simMarketingMedium === 'socials') mediumModifier = 1.10; // +10% socials effectiveness
    else if (simMarketingMedium === 'radio') mediumModifier = 0.90; 
    else if (simMarketingMedium === 'flyers') mediumModifier = 0.95;

    let dayModifier = 1.0;
    const weekend = ['Friday', 'Saturday'].includes(simDayOfWeek);
    const midWeek = ['Tuesday', 'Wednesday', 'Thursday'].includes(simDayOfWeek);
    if (weekend) dayModifier = 1.15; // +15% turnout on weekend
    else if (midWeek) dayModifier = 0.90; // -10% midWeek
    else dayModifier = 0.82; // -18% on Sun / Mon

    let supportModifier = 1.0;
    if (simSupportStrength === 'national') supportModifier = 1.35; // +35% turnout
    else if (simSupportStrength === 'regional') supportModifier = 1.15; // +15% turnout
    else if (simSupportStrength === 'local') supportModifier = 1.02;
    else supportModifier = 0.85; // solo act/unknown has lower crowd pull

    // Calculate simulated turnout percentage
    let simulatedTurnoutRatio = historicalAvgTurnout * weatherModifier * promoModifier * mediumModifier * dayModifier * supportModifier;
    simulatedTurnoutRatio = Math.max(10, Math.min(100, simulatedTurnoutRatio)); // bound between 10% and 100%

    // Total simulated attendees
    const predictedAttendees = Math.round(simCapacity * (simulatedTurnoutRatio / 100));

    // Merch yield spending modifies with promo tier as people buy more merch on high-energy events
    const predictedYieldPerHead = historicalAvgYield * (simPromoEffort === 'high' ? 1.15 : simPromoEffort === 'none' ? 0.80 : 1.0);
    const predictedMerchRevenue = predictedAttendees * predictedYieldPerHead;
    const predictedTicketRevenue = predictedAttendees * simTicketPrice;
    const totalPredictedRevenue = predictedTicketRevenue + predictedMerchRevenue;

    // Craft recommendations notes
    let advice = 'Suitable alignment. Secure date coordinates.';
    let recommendations: string[] = [];

    if (simPromoEffort === 'none' || simPromoEffort === 'low') {
      recommendations.push('Increase promotional effort tier to "Medium" or "High" to recover up to 25% turnout.');
    }
    if (['Rainy', 'Stormy', 'Snowy'].includes(simWeather)) {
      recommendations.push(`Adverse weather forecast (${simWeather}). Offset with digital ticket bundle & pre-sale discounts.`);
    }
    if (simTicketPrice > 35 && simCapacity < 300) {
      recommendations.push('High ticket price for a small venue capacity. Monitor competitor sales or adjust price downwards.');
    }
    if (!weekend && simPromoEffort !== 'high') {
      recommendations.push('Midweek bookings have historically lower turnout. Bolster with highly targeted local socials promos.');
    }
    if (simSupportStrength === 'unknown') {
      recommendations.push('Consider securing a regional or strong local supporting act to bolster crowd pull.');
    }

    if (recommendations.length === 0) {
      advice = 'Optimal combination! High turnout potential. Lock in contract quickly.';
    } else {
      advice = recommendations[0];
    }

    return {
      turnoutRatio: parseFloat(simulatedTurnoutRatio.toFixed(1)),
      attendees: predictedAttendees,
      merchRev: parseFloat(predictedMerchRevenue.toFixed(2)),
      ticketRev: parseFloat(predictedTicketRevenue.toFixed(2)),
      totalRev: parseFloat(totalPredictedRevenue.toFixed(2)),
      yieldPerHead: parseFloat(predictedYieldPerHead.toFixed(2)),
      advice,
      allRecommendations: recommendations
    };

  }, [simCapacity, simTicketPrice, simWeather, simPromoEffort, simMarketingMedium, simSupportStrength, simDayOfWeek, optimalStats]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header with custom security access badge and info toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-[9px] font-black uppercase tracking-wider">
              Alpha Predictor Engine
            </span>
            <span className="text-[10px] font-mono text-zinc-550">•</span>
            <div className="flex items-center gap-1 font-mono text-[9.5px]">
              <span className="text-zinc-500">Access:</span>
              <span className={`font-bold uppercase ${isAccessLocked ? 'text-rose-500' : 'text-emerald-400'}`}>
                {isAccessLocked ? 'LOCKED' : `${accessLevel.toUpperCase()} LEVEL`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase text-zinc-100 tracking-wider">
              Booking Advisor & Concert Turnout Predictor
            </h2>
            <InfoTip 
              title="BOOKING PREDICTOR PROTOCOL"
              bullets={[
                "AUDIT PAST EVENTS WITH REAL WEATHER, PRICES & MARKETING METRICS.",
                "SIMULATION ENGINE COMPUTES TURNOUT RATIOS AND MERCH YIELDS AUTOMATICALLY.",
                "ADJUST SLIDERS FOR TARGET SHOW COORDINATES TO ESTIMATE OUTCOMES.",
                "RESTRICTED CREDENTIAL CHECKS ENERGIZE COMPLIANCE ACCESS RULES."
              ]}
              accentColor="#f59e0b"
              position="bottom-left"
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500 max-w-xl uppercase leading-relaxed">
            Correlate historical attendance averages, weather, price, and support line-ups to discover turnout dynamics and optimize ticket prices and marketing efforts.
          </p>
        </div>

        {/* Security Access Controller */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-center">
          {isAccessLocked ? (
            <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-1.5 items-stretch sm:items-center bg-zinc-950/90 border border-zinc-800 p-2 rounded-xl w-full sm:w-auto">
              <select 
                value={accessLevel}
                onChange={(e) => { setAccessLevel(e.target.value as any); triggerTickChime(500); }}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[9.5px] font-mono text-zinc-300 focus:outline-none h-8 sm:h-auto"
              >
                <option value="manager">Tour Manager</option>
                <option value="band">Artist (Owner)</option>
                <option value="agency">Agency Booker</option>
              </select>
              <input 
                type="password"
                placeholder="PIN PIN"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                className={`bg-zinc-900 border ${showPinError ? 'border-rose-600 animate-pulse' : 'border-zinc-800'} rounded px-2 py-1 text-[9.5px] font-mono text-center text-white w-full sm:w-20 focus:outline-none placeholder:text-zinc-650 h-8 sm:h-auto`}
                title="Enter custom authorization pin to extract metrics (Hint: try '1234' for Manager, '7777' for Agency or bypass with '1312')"
              />
              <button 
                type="submit"
                className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 px-3 py-1 rounded text-[9.5px] font-mono font-bold text-white cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 h-8 sm:h-auto"
              >
                <Lock className="w-3 h-3 text-amber-500" /> Unlock
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-zinc-950/90 border border-zinc-800 p-2 rounded-xl w-full sm:w-auto">
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                <Unlock className="w-3.5 h-3.5" /> AUTHORIZED
              </div>
              <div className="h-4 w-[1px] bg-zinc-800" />
              <button
                type="button"
                onClick={handleLock}
                className="p-1 px-2.5 hover:bg-rose-950/20 border border-zinc-850 hover:border-rose-900/40 rounded text-zinc-400 hover:text-rose-400 text-[9px] font-mono uppercase cursor-pointer"
              >
                Sign Lock ×
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isAccessLocked ? (
          /* Locked State Placeholder Visual */
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="border border-dashed border-zinc-850 bg-zinc-950/15 p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-4 py-16"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-md">
              <Lock className="w-5 h-5 text-zinc-400 animate-pulse" />
            </div>
            <div className="max-w-md space-y-1.5">
              <span className="text-[10px] font-mono font-black uppercase text-amber-500 tracking-widest block">
                PROTECTED DIAGNOSTICS DETECTED
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                Historical Optimization Log Locked
              </h3>
              <p className="text-[9.5px] font-mono text-zinc-550 uppercase leading-relaxed">
                Tour bookings analysis contains sensitive attendance financials, revenue estimates, and private agency feedback. Please select a user profile role and authorize credentials.
              </p>
            </div>
            <div className="p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl max-w-sm flex flex-col gap-1 items-center">
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wide">💡 Demo Pin Tips</span>
              <div className="flex gap-2">
                <span className="text-[9px] font-mono text-zinc-400">Manager: <strong className="text-amber-400">1234</strong></span>
                <span className="text-[9px] font-mono text-zinc-650">•</span>
                <span className="text-[9px] font-mono text-zinc-400">Agency: <strong className="text-amber-400">7777</strong></span>
                <span className="text-[9px] font-mono text-zinc-650">•</span>
                <span className="text-[9px] font-mono text-zinc-400">Artist: <strong className="text-amber-400">0000</strong></span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* 2. Main Analytics Simulator Dashboard Layout (Bento style grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Panel: Sim Controls (Column Span 5) */}
              <div className="lg:col-span-5 bg-zinc-950/70 border border-zinc-850 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                  <span className="text-xs font-black text-white uppercase font-mono tracking-widest flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500 animate-[spin_10s_linear_infinite]" />
                    Simulator Parameters
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">
                    Adjust variables
                  </span>
                </div>

                {/* Capacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9.5px]">
                    <span className="text-zinc-400">TARGET VENUE CAPACITY</span>
                    <span className="text-amber-400 font-bold">{simCapacity} PAX</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="2000" 
                    step="50"
                    value={simCapacity} 
                    onChange={e => setSimCapacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between font-mono text-[7.5px] text-zinc-600 uppercase">
                    <span>50 (Bar)</span>
                    <span>1000 (Theater)</span>
                    <span>2000+ (Arena/Fest)</span>
                  </div>
                </div>

                {/* Ticket Price Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9.5px]">
                    <span className="text-zinc-400">PLANNED TICKET PRICE</span>
                    <span className="text-emerald-400 font-bold">${simTicketPrice} USD</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="150" 
                    step="5"
                    value={simTicketPrice} 
                    onChange={e => setSimTicketPrice(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between font-mono text-[7.5px] text-zinc-600 uppercase">
                    <span>$5 (DIY)</span>
                    <span>$50 (Mid-level)</span>
                    <span>$150+ (Premium)</span>
                  </div>
                </div>

                {/* Support Lineup Select */}
                <div className="space-y-1">
                  <label className="block font-mono text-[9.5px] text-zinc-400 uppercase">SUPPORT BAND CALIBER</label>
                  <select 
                    value={simSupportStrength}
                    onChange={e => { setSimSupportStrength(e.target.value as any); triggerTickChime(500); }}
                    className="w-full bg-zinc-900 border border-zinc-800/80 rounded px-2.5 py-1.5 font-mono text-zinc-300 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="unknown">Solo Tour Act (No Regional Pull)</option>
                    <option value="local">Local Opener Stack (Minor local bolster)</option>
                    <option value="regional">Regional Support Act (+15-20% turnout)</option>
                    <option value="national">National Tour Support / Heavyweight co-op (+35% turnout)</option>
                  </select>
                </div>

                {/* Promo Effort and Medium Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9.5px] text-zinc-400 uppercase">PROMO CAMPAIGN</label>
                    <select 
                      value={simPromoEffort}
                      onChange={e => { setSimPromoEffort(e.target.value as any); triggerTickChime(500); }}
                      className="w-full bg-zinc-900 border border-zinc-800/80 rounded px-2.5 py-1.5 font-mono text-zinc-300 text-[10.5px] focus:outline-none focus:border-amber-500"
                    >
                      <option value="none">None (Word of mouth)</option>
                      <option value="low">Low (Standard flyers)</option>
                      <option value="medium">Medium (Social events)</option>
                      <option value="high">High (Coordinated Ads)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9.5px] text-zinc-400 uppercase">PRIMARY FOCUS</label>
                    <select 
                      value={simMarketingMedium}
                      onChange={e => { setSimMarketingMedium(e.target.value); triggerTickChime(500); }}
                      className="w-full bg-zinc-900 border border-zinc-800/80 rounded px-2.5 py-1.5 font-mono text-zinc-300 text-[10.5px] focus:outline-none focus:border-amber-500"
                    >
                      <option value="socials">Targeted Social Ads</option>
                      <option value="flyers">On-Street Handbills</option>
                      <option value="radio">Radio & Local Press</option>
                      <option value="word-of-mouth">Organic PR Network</option>
                    </select>
                  </div>
                </div>

                {/* Weather & Day Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9.5px] text-zinc-400 uppercase">FORECAST ESTIMATE</label>
                    <select 
                      value={simWeather}
                      onChange={e => { setSimWeather(e.target.value); triggerTickChime(500); }}
                      className="w-full bg-zinc-900 border border-zinc-800/80 rounded px-2.5 py-1.5 font-mono text-zinc-300 text-[10.5px] focus:outline-none focus:border-amber-500"
                    >
                      <option value="Sunny">☀️ Sunny / Mild</option>
                      <option value="Rainy">🌧️ Rainy / Wet</option>
                      <option value="Cold">❄️ Cold / Brisk</option>
                      <option value="Stormy">⛈️ Stormy/Squalls</option>
                      <option value="Snowy">🌨️ Snowy / Sleet</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9.5px] text-zinc-400 uppercase">DAY OF WEEK</label>
                    <select 
                      value={simDayOfWeek}
                      onChange={e => { setSimDayOfWeek(e.target.value); triggerTickChime(500); }}
                      className="w-full bg-zinc-900 border border-zinc-800/80 rounded px-2.5 py-1.5 font-mono text-zinc-300 text-[10.5px] focus:outline-none focus:border-amber-500"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday (Peak)</option>
                      <option value="Saturday">Saturday (Peak)</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                </div>

                {/* Quick Simulation Reset */}
                <button
                  type="button"
                  onClick={() => {
                    setSimCapacity(400);
                    setSimTicketPrice(25);
                    setSimWeather('Sunny');
                    setSimPromoEffort('medium');
                    setSimMarketingMedium('socials');
                    setSimSupportStrength('regional');
                    setSimDayOfWeek('Friday');
                    triggerTickChime(420);
                  }}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restore Default Predictor Sliders
                </button>
              </div>

              {/* Right Panel: Simulation Results & Forecast Advice (Column Span 7) */}
              <div className="lg:col-span-7 bg-[#0b0c10] border border-zinc-850/80 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl relative">
                
                {/* Result header overlay */}
                <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-mono text-amber-500 font-bold uppercase tracking-widest block">ADVANTAGE PREDICTION</span>
                    <h4 className="text-xs font-bold uppercase text-zinc-200 font-mono tracking-wider">
                      Turnout & Profitability Estimator
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[8px] font-mono text-emerald-400 font-black uppercase">LIVE MODEL SIMULATING</span>
                  </div>
                </div>

                {/* Main forecast display body */}
                <div className="p-5 flex-grow space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    
                    {/* Simulated turnout meter card */}
                    <div className="bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl space-y-1 text-center">
                      <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">PREDICTED TURNOUT</span>
                      <span className="text-2xl font-mono font-black text-amber-400 block tracking-tight">
                        {simulationResult.turnoutRatio}%
                      </span>
                      <span className="text-[8px] block font-mono text-zinc-650 uppercase">
                        ~ {simulationResult.attendees} / {simCapacity} HEADS
                      </span>
                    </div>

                    {/* Ticket sales estimation */}
                    <div className="bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl space-y-1 text-center">
                      <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block text-center">TICKET SALES REV</span>
                      <span className="text-2xl font-mono font-black text-emerald-400 block tracking-tight text-center">
                        ${simulationResult.ticketRev.toLocaleString()}
                      </span>
                      <span className="text-[8px] block font-mono text-zinc-650 uppercase text-center">
                        @ ${simTicketPrice} EACH TICKET
                      </span>
                    </div>

                    {/* Merch sales estimation */}
                    <div className="bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl space-y-1 text-center col-span-2 sm:col-span-1">
                      <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">PREDICTED MERCH REV</span>
                      <span className="text-2xl font-mono font-black text-purple-400 block tracking-tight">
                        ${simulationResult.merchRev.toLocaleString()}
                      </span>
                      <span className="text-[8px] block font-mono text-zinc-650 uppercase">
                        @ ${simulationResult.yieldPerHead} PER HEAD
                      </span>
                    </div>
                  </div>

                  {/* Total Projected Combine Income Progress bar */}
                  <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-2 relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider">COMBINED TOTAL NET ESTIMATED REVENUE</span>
                        <span className="text-3xl font-mono font-black text-white tracking-tight block">
                          ${simulationResult.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="p-1 px-2 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/15 border border-emerald-500/20 rounded-md">
                        {simulationResult.totalRev > 10000 ? '⭐ HIGHEST YIELD' : 'NORMAL RANGE'}
                      </span>
                    </div>
                    {/* Progress tracking visually comparing ticket vs merch */}
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300" 
                        style={{ width: `${(simulationResult.ticketRev / simulationResult.totalRev) * 100 || 50}%` }}
                        title={`Ticket Revenue portion: ${Math.round((simulationResult.ticketRev / simulationResult.totalRev) * 100) || 50}%`}
                      />
                      <div 
                        className="bg-purple-500 h-full transition-all duration-300" 
                        style={{ width: `${(simulationResult.merchRev / simulationResult.totalRev) * 100 || 50}%` }}
                        title={`Merch Portion: ${Math.round((simulationResult.merchRev / simulationResult.totalRev) * 100) || 50}%`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[7.5px] font-mono font-bold text-zinc-550 uppercase">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> TICKETS: ${simulationResult.ticketRev.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> MERCH: ${simulationResult.merchRev.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* AI Booking Advice Alert Box */}
                  <div className="bg-amber-970/10 border border-amber-500/15 p-4 rounded-xl space-y-2">
                    <div className="flex gap-2 items-center text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider">AI Booking Advisor Assessment</span>
                    </div>
                    <p className="text-[10.5px] font-mono text-zinc-300 leading-relaxed uppercase">
                      {simulationResult.advice}
                    </p>
                    {simulationResult.allRecommendations.length > 1 && (
                      <div className="pt-2 border-t border-zinc-900/60 mt-1 space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wide">Optimization Directives:</span>
                        {simulationResult.allRecommendations.slice(1).map((rec, i) => (
                          <div key={`advisor-stat-item-${i}`} className="flex gap-1.5 items-start text-[9.5px] text-zinc-400 font-mono uppercase">
                            <span className="text-amber-500 select-none shrink-0">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimal Stats Reference Footer */}
                <div className="bg-zinc-950 p-4 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-3 text-[9.5px] font-mono text-zinc-500 uppercase font-bold text-center sm:text-left">
                  <div>BEST WEATHER PERFORMANCE: <span className="text-emerald-400 font-black">{optimalStats.bestWeather} ({optimalStats.avgTurnout}% avg)</span></div>
                  <div className="hidden sm:block h-4 w-[1px] bg-zinc-900 shrink-0" />
                  <div>AVG SPEND/HEAD: <span className="text-purple-400 font-black">${optimalStats.avgYield} USD</span></div>
                </div>
              </div>
            </div>

            {/* 3. Show Attendance Auditor Log Ledger */}
            <div className="bg-[#111319] border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-4 py-3.5 border-b border-zinc-850 bg-zinc-900/30 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 font-display flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-500" />
                  Historical Show Auditor Log
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-black">
                  {enrichedShows.length} Total Shows
                </span>
              </div>

              <div className="p-4 space-y-3.5">
                <p className="text-[9.5px] font-mono text-zinc-450 uppercase leading-none mb-1">
                  💡 Complete turn-out parameters below to train the Predictor Engine with real road insights.
                </p>

                {enrichedShows.length === 0 ? (
                  <div className="text-center py-8 text-zinc-550 font-mono text-xs uppercase">
                    No active shows available for auditing. Please add dates in shows portal.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {enrichedShows.map((show, idx) => {
                      const isEditing = editingShowId === show.id;
                      return (
                        <div 
                          key={`${show.id}-${idx}`}
                          className="p-4 rounded-xl border transition-all duration-150 bg-zinc-950/50 hover:bg-zinc-950/80 border-zinc-900"
                        >
                          {isEditing ? (
                            /* Editing Block Form */
                            <div className="space-y-3">
                              <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                                <span className="text-xs font-bold font-mono text-white tracking-wide uppercase">
                                  Auditing: {show.name}
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => saveAuditedShowData(show.id)}
                                    className="p-1 px-3.5 bg-emerald-950/40 hover:bg-[#003c2a] text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500/70 rounded font-mono text-[9px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Save className="w-3 h-3" /> Save parameters
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setEditingShowId(null); triggerTickChime(400); }}
                                    className="p-1 px-2.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[9px] uppercase cursor-pointer text-zinc-400 hover:text-white transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                {/* Actual Attendance */}
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono text-zinc-500 uppercase font-black">ACTUAL ATTENDANCE</label>
                                  <input 
                                    type="number"
                                    value={editActualAttendance}
                                    onChange={e => setEditActualAttendance(parseInt(e.target.value) || 0)}
                                    className="w-full bg-zinc-900 border border-zinc-805 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                                    placeholder="PAX Heads"
                                  />
                                </div>

                                {/* Actual Ticket Price */}
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono text-zinc-500 uppercase font-black">TICKET PRICE (USD)</label>
                                  <input 
                                    type="number"
                                    value={editTicketPrice}
                                    onChange={e => setEditTicketPrice(parseInt(e.target.value) || 0)}
                                    className="w-full bg-zinc-900 border border-zinc-805 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="$ USD"
                                  />
                                </div>

                                {/* Ticket Tier Sold */}
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono text-zinc-500 uppercase font-black">SALE COMPLIANCE</label>
                                  <select 
                                    value={editTicketTier}
                                    onChange={e => setEditTicketTier(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-805 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                                  >
                                    <option value="low">Underperformed</option>
                                    <option value="normal">Normal Attendance</option>
                                    <option value="sold-out">🚩 SOLD OUT EVENT</option>
                                  </select>
                                </div>

                                {/* Weather Condition */}
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono text-zinc-500 uppercase font-black">WEATHER CONDITION</label>
                                  <select 
                                    value={editWeather}
                                    onChange={e => setEditWeather(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-805 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                                  >
                                    <option value="Sunny">☀️ Sunny / Mild</option>
                                    <option value="Rainy">🌧️ Rainy / Sleet</option>
                                    <option value="Cold">❄️ Cold</option>
                                    <option value="Stormy">⛈️ Severe Storm</option>
                                    <option value="Snowy">🌨️ Snowing</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-zinc-900/50">
                                {/* Promo Intensity */}
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono text-zinc-500 uppercase font-black">PROMOTIONAL INTENSITY</label>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                    {(['none', 'low', 'medium', 'high'] as const).map((tier, idx) => (
                                      <button
                                        key={`${tier}-${idx}`}
                                        type="button"
                                        onClick={() => { setEditPromo(tier); triggerTickChime(500); }}
                                        className={`flex-1 py-1 text-[9px] font-mono rounded uppercase font-bold border transition-all ${
                                          editPromo === tier 
                                            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                                        }`}
                                      >
                                        {tier}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Marketing Medium */}
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono text-zinc-500 uppercase font-black">PRIMARY PROMOTIONAL CHANNEL</label>
                                  <select 
                                    value={editMedium}
                                    onChange={e => setEditMedium(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-805 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                                  >
                                    <option value="socials">Targeted Locals Socials</option>
                                    <option value="flyers">Street poster distribution</option>
                                    <option value="radio">Radio & localized press lists</option>
                                    <option value="word-of-mouth">Organic PR Network</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Regular Readable Card Panel Info */
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1 pr-2 truncate">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide truncate">
                                    {show.name}
                                  </h4>
                                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded leading-none font-black uppercase ${
                                    show.ticketTier === 'sold-out' 
                                      ? 'bg-rose-950/30 border border-rose-500/20 text-rose-450 animate-pulse' 
                                      : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400'
                                  }`}>
                                    {show.ticketTier === 'sold-out' ? '🔥 SOLD OUT' : show.ticketTier === 'low' ? 'UNDER CAPACITY' : 'NORMAL'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 font-mono text-[9px] text-zinc-500 uppercase">
                                  <span>{new Date(show.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span>•</span>
                                  <span>{show.city || 'Denison'}, {show.state_province || 'TX'}</span>
                                  <span>•</span>
                                  <span className="text-amber-500">CAPACITY: {show.capacity} LUX</span>
                                </div>
                              </div>

                              {/* Audited Variables Stack */}
                              <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 text-right">
                                {/* Attn */}
                                <div className="text-left sm:text-right space-y-0.5">
                                  <span className="text-[7.5px] font-mono text-zinc-550 uppercase block">Verified Attn</span>
                                  <span className="text-xs font-mono font-bold text-zinc-200 block">
                                    {show.actualAttendance} PAX <span className="text-[9.5px] font-normal text-zinc-550">({show.turnoutRatio}%)</span>
                                  </span>
                                </div>

                                {/* Weather / Promo Pill */}
                                <div className="text-left sm:text-right space-y-0.5">
                                  <span className="text-[7.5px] font-mono text-zinc-550 uppercase block">Weather & Promo</span>
                                  <span className="text-[9px] font-mono text-zinc-350 block uppercase">
                                    {show.weather === 'Sunny' ? '☀️' : show.weather === 'Rainy' ? '🌧️' : '❄️'} {show.weather} • {show.promoEffort} Promo
                                  </span>
                                </div>

                                {/* Financial Yield */}
                                <div className="text-left sm:text-right space-y-0.5">
                                  <span className="text-[7.5px] font-mono text-zinc-550 uppercase block">Finances (Combined)</span>
                                  <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                                    ${show.combinedRevenue.toLocaleString()} <span className="text-[8.5px] font-normal text-zinc-550">(${show.yieldPerHead}/head)</span>
                                  </span>
                                </div>

                                {/* Edit trigger block */}
                                <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => startEditingShow(show)}
                                    className="p-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-[9.5px] text-zinc-300 hover:text-white font-mono uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3 text-amber-500" /> Audit
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
