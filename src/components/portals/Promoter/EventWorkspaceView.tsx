import React, { useState, useEffect } from 'react';
import { 
  X, HelpCircle, CheckCircle, Trash, Copy, Edit2, Play, Activity, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PromoterFinancials from './PromoterFinancials';

interface EventWorkspaceViewProps {
  userProfile: any;
  calendarSelectedDate: Date;
  selectedVenueIndex: number;
  setSelectedVenueIndex: (idx: number) => void;
  activeAllVenues: any[];
  plannerShowType: 'standard' | 'festival';
  setPlannerShowType: (type: 'standard' | 'festival') => void;
  plannerEventName: string;
  setPlannerEventName: (name: string) => void;
  plannerNotes: string;
  setPlannerNotes: (notes: string) => void;
  plannerLineup: any[];
  setPlannerLineup: React.Dispatch<React.SetStateAction<any[]>>;
  bands: any[];
  onClose: () => void;
  triggerNotification?: (msg: string) => void;
  playLocalBeep: (freq?: number, type?: OscillatorType, duration?: number) => void;
  handleCalendarPlannerSubmit: (e: React.FormEvent) => void;
  plannerCostLedger: any[];
  setPlannerCostLedger: React.Dispatch<React.SetStateAction<any[]>>;
  festivalDuration: number;
  setFestivalDuration: (duration: number) => void;
  onNavigateToTab?: (tab: 'routing' | 'workspace' | 'offers' | 'sales') => void;
}

export default function EventWorkspaceView({
  userProfile,
  calendarSelectedDate,
  selectedVenueIndex,
  setSelectedVenueIndex,
  activeAllVenues,
  plannerShowType,
  setPlannerShowType,
  plannerEventName,
  setPlannerEventName,
  plannerLineup,
  setPlannerLineup,
  bands,
  onClose,
  triggerNotification,
  playLocalBeep,
  handleCalendarPlannerSubmit,
  plannerCostLedger,
  setPlannerCostLedger,
  festivalDuration,
  setFestivalDuration,
}: EventWorkspaceViewProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [use24Hour, setUse24Hour] = useState<boolean>(false);
  
  const [ticketPrice, setTicketPrice] = useState<number>(25);
  const [proposedBudget, setProposedBudget] = useState<number>(15000);

  const formatSingleTimeStr = (singleTimeStr: string) => {
    const match = singleTimeStr.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return singleTimeStr;
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return 'TBA';
    if (use24Hour) return timeStr;
    
    if (timeStr.includes('-')) {
      const parts = timeStr.split('-').map(p => p.trim());
      return parts.map(part => formatSingleTimeStr(part)).join(' - ');
    }
    
    return formatSingleTimeStr(timeStr);
  };
  
  // Step 1 local states
  const [sessionDate, setSessionDate] = useState(() => {
    const d = calendarSelectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [doorsOpen, setDoorsOpen] = useState('19:00');
  const [showStart, setShowStart] = useState('20:00');

  // Step 2 local states
  const [addBandId, setAddBandId] = useState('');
  const [addGuarantee, setAddGuarantee] = useState('');
  const [addSetStart, setAddSetStart] = useState('21:00');
  const [addSetEnd, setAddSetEnd] = useState('22:00');
  const [addLoadIn, setAddLoadIn] = useState('18:00');
  const [addContractState, setAddContractState] = useState('Pending');
  const [addContactMethod, setAddContactMethod] = useState('Email');
  const [addAutoContract, setAddAutoContract] = useState(true);
  const [activeDayFilter, setActiveDayFilter] = useState('All Days');

  // Step 3 local states
  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newCostCategory, setNewCostCategory] = useState('Sound/Audio');

  const activeVenue = activeAllVenues[selectedVenueIndex] || null;
  const venueCapacity = parseInt(activeVenue?.capacity || '500', 10);
  
  // Calculations
  const breakEvenTix = ticketPrice > 0 ? Math.ceil(proposedBudget / ticketPrice) : 0;
  const breakEvenPercent = venueCapacity > 0 ? Math.min(100, Math.round((breakEvenTix / venueCapacity) * 100)) : 0;
  
  const actualSpent = plannerCostLedger.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) + 
                      plannerLineup.reduce((sum, item) => sum + (parseFloat(item.guarantee) || 0), 0);
  const remainingReserve = proposedBudget - actualSpent;

  const handleAddBand = () => {
    if (!addBandId && !addGuarantee) return;
    const band = bands.find(b => b.id === addBandId);
    setPlannerLineup([...plannerLineup, {
      id: Date.now().toString(),
      band_id: addBandId,
      custom_name: band ? band.name : 'TBA Artist',
      guarantee: addGuarantee,
      set_time: `${addSetStart} - ${addSetEnd}`,
      load_in: addLoadIn,
      status: 'pending'
    }]);
    setAddBandId('');
    setAddGuarantee('');
    setAddSetStart('21:00');
    setAddSetEnd('22:00');
    setAddLoadIn('18:00');
    playLocalBeep(800, 'sine', 0.02);
  };

  const handleRemoveBand = (id: string) => {
    setPlannerLineup(plannerLineup.filter(b => b.id !== id));
    playLocalBeep(300, 'square', 0.05);
  };

  const handleAddCost = () => {
    if (!newCostName || !newCostAmount) return;
    setPlannerCostLedger([...plannerCostLedger, {
      id: Date.now().toString(),
      name: newCostName,
      amount: newCostAmount,
      type: 'expense',
      category: newCostCategory
    }]);
    setNewCostName('');
    setNewCostAmount('');
    playLocalBeep(700, 'sine', 0.02);
  };

  const handleRemoveCost = (id: string) => {
    setPlannerCostLedger(plannerCostLedger.filter(c => c.id !== id));
    playLocalBeep(300, 'square', 0.05);
  };

  const copyRunningOrder = () => {
    const text = plannerLineup.map((b, i) => {
      const setTime = formatTimeStr(b.set_time);
      const loadIn = b.load_in ? ` (Load-In: ${formatTimeStr(b.load_in)})` : '';
      return `${i+1}. ${b.custom_name} - Set: ${setTime}${loadIn} (Status: ${b.status})`;
    }).join('\n');
    navigator.clipboard.writeText(`RUNNING ORDER:\n${text}`);
    if (triggerNotification) triggerNotification('Running order copied to clipboard!');
    playLocalBeep(900, 'sine', 0.05);
  };

  return (
    <div className="w-full min-h-0 flex-1 bg-neutral-950 flex flex-col p-4 pb-2 font-sans text-yellow-400 border border-zinc-900 rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(#eab30805_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <button onClick={onClose} className="text-zinc-500 hover:text-yellow-400 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center flex-1">
          <h2 className="text-3xl font-mono uppercase tracking-widest font-black text-center text-yellow-400 mb-1">
            {plannerEventName || 'UNTITLED GIG'}
          </h2>
          <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
            {calendarSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => {
            setUse24Hour(!use24Hour);
            playLocalBeep(600, 'sine', 0.02);
          }}
          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-yellow-400 transition-all text-[10px] font-mono font-bold tracking-wider"
          title="Toggle Time Format (12h/24h)"
        >
          {use24Hour ? '24HR' : '12HR'}
        </button>
      </div>

      {/* Wizard Navigation Anchor Bar */}
      <div className="flex w-full border-b border-zinc-900 bg-zinc-950 text-xs mb-6 relative z-10 rounded shadow-lg overflow-hidden">
        {[
          { step: 1, label: 'Gig Basics' },
          { step: 2, label: 'Lineup & Running Order' },
          { step: 3, label: 'Financial Runway' }
        ].map((s, sIdx) => (
          <button
            key={`${s.step}-${sIdx}`}
            onClick={() => { setActiveStep(s.step as 1|2|3); playLocalBeep(400 + s.step * 100, 'sine', 0.02); }}
            className={`flex-1 py-3 px-2 text-center transition-all duration-300 font-bold uppercase tracking-widest ${
              activeStep === s.step 
                ? 'bg-yellow-500/10 text-yellow-400 border-b-2 border-yellow-400' 
                : 'text-zinc-600 hover:text-yellow-500 hover:bg-yellow-950/20'
            }`}
          >
            Step {s.step}: {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pb-6">
        <AnimatePresence mode="wait">
          {activeStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="space-y-4 max-w-3xl mx-auto"
            >
              <div className="space-y-3">
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-lg shadow-inner">
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Event Name</label>
                  <input
                    type="text"
                    value={plannerEventName}
                    onChange={(e) => setPlannerEventName(e.target.value)}
                    placeholder="Enter event name..."
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-sm font-mono"
                  />
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-xl p-4 my-3">
                  <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-2">⚡ CORE LOGISTICS FRAME</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Session Date</label>
                      <input 
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Doors Open</label>
                      <input 
                        type="time"
                        value={doorsOpen}
                        onChange={(e) => setDoorsOpen(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-xs font-mono text-center"
                      />
                      <div className="text-[9px] text-zinc-500 font-mono mt-1 text-center">
                        Active: <span className="text-yellow-500/80">{formatTimeStr(doorsOpen)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Show Start</label>
                      <input 
                        type="time"
                        value={showStart}
                        onChange={(e) => setShowStart(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-xs font-mono text-center"
                      />
                      <div className="text-[9px] text-zinc-500 font-mono mt-1 text-center">
                        Active: <span className="text-yellow-500/80">{formatTimeStr(showStart)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-lg shadow-inner">
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Format Select</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPlannerShowType('standard')}
                      className={`flex-1 py-2 text-xs uppercase font-bold tracking-widest rounded border transition-all ${
                        plannerShowType === 'standard' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      Club Show
                    </button>
                    <button
                      onClick={() => setPlannerShowType('festival')}
                      className={`flex-1 py-2 text-xs uppercase font-bold tracking-widest rounded border transition-all ${
                        plannerShowType === 'festival' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      Festival
                    </button>
                  </div>
                  
                  {plannerShowType === 'festival' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Festival Duration (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={festivalDuration}
                        onChange={(e) => setFestivalDuration(Number(e.target.value))}
                        className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-sm font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-lg shadow-inner">
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Venue Anchor</label>
                  <select
                    value={selectedVenueIndex}
                    onChange={(e) => setSelectedVenueIndex(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-sm font-mono appearance-none"
                  >
                    {activeAllVenues.map((v, i) => (
                      <option key={`venue-opt-${v.id || i}-${i}`} value={i}>{v.name} (Cap: {v.capacity})</option>
                    ))}
                  </select>
                </div>

                {/* Break-Even Estimation Inline Capsule */}
                <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><Activity className="w-12 h-12 text-yellow-400" /></div>
                  <label className="block text-[10px] text-yellow-600 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> Break-Even Tix Projection
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-6 mb-4 relative z-10">
                    <div className="flex-1">
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Door Price ($)</label>
                      <input
                        type="range"
                        min="5" max="150" step="5"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(Number(e.target.value))}
                        className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer mt-2"
                      />
                      <div className="text-right text-xs text-yellow-400 font-mono mt-1 font-bold">${ticketPrice}</div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Proposed Budget ($)</label>
                      <input
                        type="number"
                        value={proposedBudget}
                        onChange={(e) => setProposedBudget(Number(e.target.value))}
                        className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="w-full bg-black rounded-full h-2.5 mt-2 overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${breakEvenPercent > 100 ? 'bg-red-500' : 'bg-yellow-400'}`} 
                      style={{ width: `${Math.min(100, breakEvenPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono mt-2 text-zinc-400">
                    <span>{breakEvenTix} Tix to Breakeven</span>
                    <span className={breakEvenPercent > 100 ? 'text-red-400 font-bold' : ''}>
                      {breakEvenPercent}% of Cap ({venueCapacity})
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="space-y-4 max-w-4xl mx-auto"
            >
              {plannerShowType === 'festival' && (
                <div className="mb-4">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="bg-zinc-900 p-2 rounded text-center border border-zinc-800">
                      <div className="text-[9px] text-zinc-500 uppercase">Roster Slots</div>
                      <div className="text-yellow-400 font-mono text-sm">{plannerLineup.length}</div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded text-center border border-zinc-800">
                      <div className="text-[9px] text-zinc-500 uppercase">Avg Guarantee</div>
                      <div className="text-yellow-400 font-mono text-sm">
                        ${plannerLineup.length > 0 ? Math.round(plannerLineup.reduce((sum, item) => sum + (parseFloat(item.guarantee) || 0), 0) / plannerLineup.length) : 0}
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded text-center border border-zinc-800">
                      <div className="text-[9px] text-zinc-500 uppercase">Contracts OK</div>
                      <div className="text-emerald-400 font-mono text-sm">
                        {plannerLineup.filter(a => a.status === 'accepted').length}
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded text-center border border-zinc-800">
                      <div className="text-[9px] text-zinc-500 uppercase">Capital Gap</div>
                      <div className={`font-mono text-sm ${remainingReserve < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                        ${remainingReserve}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                    <button 
                      onClick={() => setActiveDayFilter('All Days')}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded border transition-all whitespace-nowrap ${
                        activeDayFilter === 'All Days' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      All Days
                    </button>
                    {Array.from({length: festivalDuration}).map((_, i) => (
                      <button 
                        key={`fest-day-btn-${i}`} 
                        onClick={() => setActiveDayFilter(`Day ${i + 1}`)}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded border transition-all whitespace-nowrap ${
                          activeDayFilter === `Day ${i + 1}` ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        Day {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compress Artist Intake */}
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl mb-4 space-y-3 shadow-inner">
                <div className="flex gap-2">
                  <div className="w-[60%]">
                    <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Artist</label>
                    <select
                      value={addBandId}
                      onChange={(e) => setAddBandId(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-yellow-400 focus:outline-none text-xs font-mono"
                    >
                      <option value="">Select Band...</option>
                      {bands.map((b, bIdx) => (
                        <option key={`${b.id}-${bIdx}`} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-[40%]">
                    <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Guarantee ($)</label>
                    <input
                      type="number"
                      value={addGuarantee}
                      onChange={(e) => setAddGuarantee(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-yellow-400 focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Set Window (Start & End Times)</label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="time"
                          value={addSetStart}
                          onChange={(e) => setAddSetStart(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-xs font-mono text-center"
                        />
                        <div className="text-[8px] text-zinc-500 text-center mt-1 uppercase tracking-wider">Start</div>
                      </div>
                      <span className="text-zinc-600 font-bold font-mono self-start pt-2">-</span>
                      <div className="flex-1">
                        <input
                          type="time"
                          value={addSetEnd}
                          onChange={(e) => setAddSetEnd(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-xs font-mono text-center"
                        />
                        <div className="text-[8px] text-zinc-500 text-center mt-1 uppercase tracking-wider">End</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1.5 text-center bg-zinc-950 border border-zinc-900/60 py-1 rounded">
                      Selected Set: <span className="text-yellow-400 font-bold">{formatTimeStr(`${addSetStart} - ${addSetEnd}`)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Load-In Time</label>
                    <input
                      type="time"
                      value={addLoadIn}
                      onChange={(e) => setAddLoadIn(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-yellow-400 focus:outline-none focus:border-yellow-500/50 text-xs font-mono text-center"
                    />
                    <div className="text-[10px] text-zinc-400 font-mono mt-1.5 text-center bg-zinc-950 border border-zinc-900/60 py-1 rounded">
                      Selected Load-In: <span className="text-yellow-400 font-bold">{formatTimeStr(addLoadIn)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 items-center justify-center text-center">
                  <div className="flex flex-col items-center">
                    <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Contract State</label>
                    <select
                      value={addContractState}
                      onChange={(e) => setAddContractState(e.target.value)}
                      className="w-full max-w-[200px] bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-400 focus:outline-none text-xs font-mono text-center"
                    >
                      <option value="Pending">Contract: Pending</option>
                      <option value="Issued">Contract: Issued</option>
                      <option value="Signed">Contract: Signed</option>
                    </select>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Contact Method</label>
                    <select
                      value={addContactMethod}
                      onChange={(e) => setAddContactMethod(e.target.value)}
                      className="w-full max-w-[200px] bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-400 focus:outline-none text-xs font-mono text-center"
                    >
                      <option value="Email">Contact via Email</option>
                      <option value="SMS">Contact via SMS</option>
                      <option value="Agent">Contact via Agent</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:col-span-2 md:col-span-1 items-center justify-center pt-2 sm:pt-0">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Auto-Contract</label>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-900">
                      <input
                        type="checkbox"
                        id="autoContractChk"
                        checked={addAutoContract}
                        onChange={(e) => setAddAutoContract(e.target.checked)}
                        className="w-4 h-4 accent-yellow-500 bg-zinc-800 border-zinc-700 rounded cursor-pointer"
                      />
                      <label htmlFor="autoContractChk" className="text-[10px] text-zinc-400 font-mono cursor-pointer select-none">
                        Enabled
                      </label>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleAddBand}
                  disabled={!addBandId && !addGuarantee}
                  className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded py-2 mt-2 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  + ADD ACT
                </button>
              </div>

              {/* Roster List Matrix */}
              <div className="space-y-2 mt-4">
                {plannerLineup.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs font-mono border border-zinc-900 border-dashed rounded bg-zinc-950/50">
                    No acts added to roster yet.
                  </div>
                ) : (
                  plannerLineup.map((act, index) => (
                    <div key={`${act.id}-${index}`} className="flex items-center justify-between bg-black border border-zinc-800 rounded p-3 hover:border-yellow-900/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="text-zinc-600 font-mono text-xs font-black w-6">{index + 1}.</div>
                        <div>
                          <div className="text-yellow-100 font-bold text-sm">{act.custom_name}</div>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">⌚ Set: {formatTimeStr(act.set_time)}</span>
                            {act.load_in && (
                              <span className="text-[10px] text-zinc-500 font-mono">📥 Load-in: {formatTimeStr(act.load_in)}</span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-mono">💰 Guarantee: ${act.guarantee || '0'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-zinc-900 px-2 py-1 rounded text-[9px] font-mono tracking-wider flex items-center gap-1.5 border border-zinc-800">
                          {act.status === 'accepted' ? (
                            <><span className="text-emerald-400 animate-pulse">🟢</span><span className="text-emerald-400">CONTRACT OK</span></>
                          ) : (
                            <><span className="text-yellow-500">🟡</span><span className="text-yellow-500/70">PENDING SIGNATURE</span></>
                          )}
                        </div>
                        <button onClick={() => handleRemoveBand(act.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Utility Asset */}
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={copyRunningOrder}
                  className="text-[10px] text-zinc-400 hover:text-yellow-400 flex items-center gap-1.5 uppercase font-mono tracking-widest border border-transparent hover:border-yellow-900/50 bg-zinc-950 px-3 py-1.5 rounded transition-all"
                >
                  <Copy className="w-3 h-3" />
                  📋 Copy Running Order to Clipboard
                </button>
              </div>

              {/* Lower Summary Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 border-b border-zinc-800 pb-2">📋 SCHEDULE SUMMARY</div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-zinc-400">Total Booked Acts</span>
                    <span className="text-yellow-400">{plannerLineup.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Est. Total Runtime</span>
                    <span className="text-yellow-400">{plannerLineup.length * 45} mins</span>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 border-b border-zinc-800 pb-2">⚠️ PRODUCTION CURFEW ALERTS</div>
                  <div className="text-xs text-zinc-400 font-mono space-y-1">
                    <div>Curfew Limit: {formatTimeStr('23:00')} (Standard)</div>
                    <div className="text-emerald-400 font-bold">Current schedule is within curfew limits.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {/* Financial Data Header Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded text-center shadow-inner">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Proposed Budget</div>
                  <div className="text-xl font-mono text-zinc-300">${proposedBudget.toLocaleString()}</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded text-center shadow-inner">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Actual Spent</div>
                  <div className="text-xl font-mono text-yellow-500">${actualSpent.toLocaleString()}</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded text-center shadow-inner">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Remaining Allocation Reserve</div>
                  <div className={`text-xl font-mono ${remainingReserve < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                    ${remainingReserve.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Production Ledger List */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-600 mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <DollarSign className="w-3.5 h-3.5" /> Production Ledger
                </h3>
                
                <div className="flex flex-wrap md:flex-nowrap gap-2 mb-4">
                   <input
                      type="text"
                      value={newCostName}
                      onChange={(e) => setNewCostName(e.target.value)}
                      placeholder="Expense Name"
                      className="w-full md:w-[50%] bg-black border border-zinc-800 rounded px-3 py-1.5 text-yellow-400 focus:outline-none text-xs font-mono"
                    />
                    <select
                      value={newCostCategory}
                      onChange={(e) => setNewCostCategory(e.target.value)}
                      className="w-full md:w-[30%] bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-400 focus:outline-none text-xs font-mono"
                    >
                      <option value="Sound/Audio">Sound/Audio</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Security">Security</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="number"
                      value={newCostAmount}
                      onChange={(e) => setNewCostAmount(e.target.value)}
                      placeholder="Amount ($)"
                      className="w-full md:w-[20%] bg-black border border-zinc-800 rounded px-3 py-1.5 text-yellow-400 focus:outline-none text-xs font-mono"
                    />
                    <button
                      onClick={handleAddCost}
                      disabled={!newCostName || !newCostAmount}
                      className="w-full md:w-auto bg-zinc-800 hover:bg-zinc-700 text-white rounded px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      ADD
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Left Side: EXPENSE ALLOCATIONS */}
                  <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-3">
                    <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-3 border-b border-zinc-800 pb-2">EXPENSE ALLOCATIONS</div>
                    <div className="space-y-3">
                      {['Sound/Audio', 'Marketing', 'Security', 'Hospitality'].map((cat, idx) => {
                        const catTotal = plannerCostLedger.filter(c => c.category === cat).reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
                        const pct = proposedBudget > 0 ? (catTotal / proposedBudget) * 100 : 0;
                        return (
                          <div key={`${cat}-${idx}`}>
                            <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                              <span>{cat}</span>
                              <span className="text-yellow-500/80">${catTotal}</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-yellow-500/50 h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Side: SETTLEMENT CHECKLIST */}
                  <PromoterFinancials 
                    items={plannerCostLedger} 
                    plannerLineup={plannerLineup} 
                    handleRemoveCost={handleRemoveCost} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Execution Finalizer */}
      <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row gap-3 relative z-10 bg-neutral-950 shrink-0">
        <button className="flex-1 bg-zinc-900/40 border border-zinc-800 text-zinc-400 text-xs font-mono px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors uppercase tracking-widest">
          💾 SAVE AS A DRAFT
        </button>
        <button 
          onClick={handleCalendarPlannerSubmit}
          className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold font-mono text-xs py-3 px-6 rounded-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
        >
          ⚡ CONFIRM EVENT AND SEND CONTRACTS
        </button>
      </div>
    </div>
  );
}
