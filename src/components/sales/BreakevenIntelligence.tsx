import React from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { TicketTier, EventLineup } from '../../types';

interface BreakevenIntelligenceProps {
  ticketingEventId: string;
  sandboxTiers: TicketTier[];
  lineups: EventLineup[];
  estExpenses: number;
  setEstExpenses: (expenses: number) => void;
  breakevenTicketPrice: number;
  setBreakevenTicketPrice: (price: number) => void;
  isBreakevenCollapsed: boolean;
  setIsBreakevenCollapsed: (collapsed: boolean) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export default function BreakevenIntelligence({
  ticketingEventId,
  sandboxTiers,
  lineups,
  estExpenses,
  setEstExpenses,
  breakevenTicketPrice,
  setBreakevenTicketPrice,
  isBreakevenCollapsed,
  setIsBreakevenCollapsed,
  playLocalBeep
}: BreakevenIntelligenceProps) {

  const activeTiers = ticketingEventId === 'demo-sandbox' 
    ? sandboxTiers 
    : (lineups.find(l => l.id === ticketingEventId)?.ticket_tiers || []);

  const ticketRevenue = activeTiers.reduce((acc, curr) => acc + (curr.sold * curr.price), 0);
  const ratio = estExpenses > 0 ? (ticketRevenue / estExpenses) : 0;
  const ratioPercent = Math.min(Math.round(ratio * 100), 100);
  const isBreakedEven = ticketRevenue >= estExpenses;
  const surplusAmount = ticketRevenue - estExpenses;

  return (
    <div className="w-full border border-emerald-500/25 bg-black/85 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        aria-expanded={!isBreakevenCollapsed}
        onClick={() => {
          setIsBreakevenCollapsed(!isBreakevenCollapsed);
          if (typeof playLocalBeep === 'function') playLocalBeep(520, 'sine', 0.015);
        }}
        className="w-full p-4 sm:p-5 flex flex-col md:items-center justify-center text-center hover:bg-emerald-950/10 transition-colors gap-3"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-emerald-450 text-xl shrink-0">📈</span>
          <div className="flex flex-col items-center text-center">
            <h3 
              style={{ fontSize: '24px', textAlign: 'center' }}
              className="text-xl sm:text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.55)] tracking-widest uppercase flex items-center justify-center gap-2 text-center"
            >
              Break Even Tracking
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-1 text-center">
              Reactive business analytics correlating expenses and ticketing credits.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0 w-full md:w-auto mt-2">
          <div className="flex items-center gap-2 bg-black border border-zinc-850 px-3.5 py-1.5 rounded-xl font-mono" onClick={(e) => e.stopPropagation()}>
            <span className="text-zinc-500 text-xs font-bold">EXPENSES $</span>
            <input 
              type="number"
              value={estExpenses || ''}
              onChange={(e) => setEstExpenses(parseInt(e.target.value) || 0)}
              className="w-24 bg-transparent text-amber-500 font-black text-center text-xs outline-none focus:ring-0"
              placeholder="Expenses"
              title="Est. Total Expenses"
            />
          </div>
          <span className="text-emerald-405 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl hover:bg-emerald-900/20 hover:border-emerald-600 transition-all shrink-0 flex items-center justify-center">
            {isBreakevenCollapsed ? (
              <ChevronDown className="w-5 h-5 text-emerald-400 animate-pulse" />
            ) : (
              <ChevronUp className="w-5 h-5 text-emerald-300" />
            )}
          </span>
        </div>
      </button>

      {!isBreakevenCollapsed && (
        <div className="border-t border-zinc-900/60 p-4 sm:p-5 space-y-4">
          {/* Glowing Breakeven Indicator Banner requested by user */}
          <div className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
            isBreakedEven 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
          }`}>
            <Sparkles className="w-5 h-5 shrink-0 animate-pulse text-yellow-400" />
            <div className="text-left space-y-1">
              <span className="font-black uppercase block tracking-wider">
                {isBreakedEven ? '🟢 BREACH STATUS: PROFIT ACQUIRED' : '🔴 BREACH STATUS: DEFICIT RECOVERY MODE'}
              </span>
              <p className="text-[10px] text-zinc-400 leading-normal">
                {isBreakedEven 
                  ? `Congratulations! Current ticketing receipts have fully offset total estimated production expenses by a net positive surplus of $${surplusAmount.toLocaleString()} USD!`
                  : `Currently tracking short of the overall financial breakeven target. Requires another $${Math.abs(surplusAmount).toLocaleString()} USD in ticket invoices to cross the direct breakeven threshold.`
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left side: visual progress representation wheel & ratios */}
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900 flex flex-col justify-between space-y-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block">Capital Amortization Ratio</span>
                <span className="text-xs text-zinc-400 font-sans block">Incremental threshold target representation</span>
              </div>

              <div className="flex items-center gap-6 justify-start font-mono">
                {/* Visual Radial Gauge representation */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="rgba(24, 24, 27, 0.8)" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      stroke={isBreakedEven ? '#10b981' : '#f59e0b'} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * (1 - (ratioPercent / 100))}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                    {ratioPercent}%
                  </div>
                </div>

                <div className="text-left space-y-1.5 flex-grow">
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 border-b border-zinc-900 pb-1">
                    <span>Total Direct Revenue:</span>
                    <strong className="text-white">${ticketRevenue.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>Target Event Expenses:</span>
                    <strong className="text-white">${estExpenses.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: custom pricing sensitivity simulator slider */}
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block">Simulated Sensitivity Slider</span>
                <span className="text-xs text-zinc-400 font-sans block">Identify target tier pricing margins required to break even.</span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Simulate Ticket Price:</span>
                  <strong className="text-emerald-400">${breakevenTicketPrice || 25} USD</strong>
                </div>
                
                <input
                  type="range"
                  min="5"
                  max="150"
                  value={breakevenTicketPrice || 25}
                  onChange={(e) => setBreakevenTicketPrice(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                />

                <div className="text-[10px] text-zinc-500 font-mono text-center block">
                  {estExpenses > 0 ? (
                    <span>Requires selling <strong className="text-amber-500">{Math.ceil(estExpenses / (breakevenTicketPrice || 25))}</strong> total tickets at this rate to fully recover production expenses.</span>
                  ) : (
                    <span>Configure target expenses in the text field to activate.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
