import React from 'react';
import { Info, Trash } from 'lucide-react';
import { TicketTier, EventLineup, StorefrontTicketItem } from '../../types';

interface PacingTrackerProps {
  ticketingEventId: string;
  setTicketingEventId: (id: string) => void;
  lineups: EventLineup[];
  sandboxTiers: TicketTier[];
  setSandboxTiers: React.Dispatch<React.SetStateAction<TicketTier[]>>;
  newTierName: string;
  setNewTierName: (name: string) => void;
  newTierPrice: string;
  setNewTierPrice: (price: string) => void;
  newTierCapacity: string;
  setNewTierCapacity: (capacity: string) => void;
  newTierSold: string;
  setNewTierSold: (sold: string) => void;
  tierLineupId: string;
  setTierLineupId: (id: string) => void;
  handleUpdateTicketTierSold: (eventId: string, tierId: string, currentSold: number) => void;
  handleDeleteTicketTier: (eventId: string, tierId: string) => void;
  handleAddTicketTier: (eventId: string, e: React.MouseEvent) => void;
  triggerNotification?: (msg: string) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export default function PacingTracker({
  ticketingEventId,
  setTicketingEventId,
  lineups,
  sandboxTiers,
  setSandboxTiers,
  newTierName,
  setNewTierName,
  newTierPrice,
  setNewTierPrice,
  newTierCapacity,
  setNewTierCapacity,
  newTierSold,
  setNewTierSold,
  tierLineupId,
  setTierLineupId,
  handleUpdateTicketTierSold,
  handleDeleteTicketTier,
  handleAddTicketTier,
  triggerNotification,
  playLocalBeep
}: PacingTrackerProps) {

  const [expandedTiers, setExpandedTiers] = React.useState<Record<string, boolean>>({});
  const [storefrontItems, setStorefrontItems] = React.useState<StorefrontTicketItem[]>([]);

  React.useEffect(() => {
    const list = localStorage.getItem('nexus_storefront_tickets_list');
    if (list) {
      const all: StorefrontTicketItem[] = JSON.parse(list);
      setStorefrontItems(all.filter(i => i.show_id === ticketingEventId));
    } else {
      setStorefrontItems([]);
    }
  }, [ticketingEventId]);

  const activeTiers = storefrontItems;

  const cumulativeSold = activeTiers.reduce((acc, curr) => acc + curr.sold, 0);
  const estDirectRevenue = activeTiers.reduce((acc, curr) => acc + (curr.sold * curr.price), 0);

  return (
    <div className="w-full border border-[#00ffcc]/35 bg-black/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl space-y-4 text-center relative overflow-hidden" id="fancier-pacing-tracker">
      <div className="absolute right-0 top-0 w-80 h-80 bg-[#00ffcc]/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex flex-col xl:items-center justify-center gap-4 border-b border-zinc-900 pb-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[#00ffcc] text-xl animate-pulse shrink-0">🎟️</span>
          <div className="flex flex-col items-center">
            <h3 
              className="text-xl sm:text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-400 to-[#00ffcc] drop-shadow-[0_0_12px_rgba(0,255,204,0.55)] tracking-widest uppercase text-center"
            >
              Ticket Sales Tracking
            </h3>
            <p 
              className="text-xs text-zinc-400 font-sans mt-1 text-center"
            >
              Real-time monitoring and multi-tier tracking. Choose any active event context.
            </p>
          </div>
        </div>
        
        {/* Event Context Selector Dropdown - Not cut-off and nicely wide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-3 shrink-0 w-full xl:w-auto">
          <span className="text-zinc-400 font-mono text-xs uppercase font-bold tracking-wider shrink-0">Active Event Context:</span>
          <select
            value={ticketingEventId}
            onChange={(e) => setTicketingEventId(e.target.value)}
            style={{ width: '303.98699999999997px' }}
            className="bg-zinc-950 border border-zinc-700 text-white text-sm font-mono p-3 rounded-xl focus:ring-1 focus:ring-[#00ffcc]/50 focus:border-[#00ffcc] cursor-pointer"
          >
            <option value="demo-sandbox">⭐ [DEMO SANDBOX] Showcase Arena</option>
            {lineups.map((l, lIdx) => (
              <option key={`${l.id}-${lIdx}`} value={l.id}>📡 {l.name} ({l.date})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculations & Pacing Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950/50 border border-zinc-900 p-3 sm:p-4 rounded-2xl text-center font-mono">
          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Target Context</span>
          <span className="text-sm sm:text-base text-[#00ffcc] font-black uppercase truncate block">
            {ticketingEventId === 'demo-sandbox' ? 'SANDBOX DEMO' : (lineups.find(l => l.id === ticketingEventId)?.name || 'N/A')}
          </span>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-900 p-3 sm:p-4 rounded-2xl text-center font-mono">
          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Cumulative Sold</span>
          <span className="text-sm sm:text-base text-white font-black block mt-0.5">
            {cumulativeSold.toLocaleString()} QTY
          </span>
        </div>
        <div className="bg-green-950/5 border border-green-900/20 p-3 sm:p-4 rounded-2xl text-center font-mono">
          <span className="text-[10px] text-green-500 font-bold uppercase block mb-1">Estimated Direct Revenue</span>
          <span className="text-sm sm:text-base text-green-400 font-black block mt-0.5">
            ${estDirectRevenue.toLocaleString()} USD
          </span>
        </div>
      </div>

      {/* List of active ticket tiers */}
      {activeTiers.length === 0 ? (
        <div className="text-center p-8 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800">
          <p className="text-zinc-500 font-mono text-xs uppercase">No active tracking metrics for this show.</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {activeTiers.map((tier, idx) => {
            const percentSold = tier.capacity && tier.capacity > 0 
              ? Math.min(Math.round((tier.sold / tier.capacity) * 100), 100) 
              : 0;
            const isExpanded = !!expandedTiers[tier.id];
            
            const toggleExpanded = () => {
              setExpandedTiers(prev => ({
                ...prev,
                [tier.id]: !prev[tier.id]
              }));
              if (typeof playLocalBeep === 'function') {
                playLocalBeep(640, 'sine', 0.015);
              }
            };

            return (
              <div 
                key={`${tier.id}-${idx}`} 
                className="relative bg-zinc-950/55 border border-zinc-900 rounded-xl flex flex-col p-3 gap-3 transition-all hover:border-zinc-800 w-[325px] overflow-hidden"
              >
                {/* Header Row */}
                <div 
                  onClick={toggleExpanded}
                  className="flex items-start gap-3 cursor-pointer select-none relative"
                >
                  {/* Display image next to item name */}
                  {tier.images && tier.images.length > 0 ? (
                    <img src={tier.images[0]} alt="thumbnail" className="w-12 h-12 rounded-lg object-cover border border-zinc-800 bg-black shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[8px] text-zinc-600 font-mono uppercase">NO IMG</div>
                  )}
                  <div className="space-y-1 block pr-2 flex-grow min-w-0 text-left">
                    <div className="flex flex-col gap-0.5 min-w-0 w-full pr-8">
                      <span className="text-sm font-black text-white font-mono tracking-wider truncate">
                        {tier.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-green-950/50 text-green-400 border border-green-900/30 px-1.5 py-0.5 rounded font-mono font-bold">
                          ${tier.price}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate">
                          Rev: <strong className="text-zinc-300">${(tier.sold * tier.price).toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full pt-1.5">
                      <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase mb-1">
                        <span>Tracker Metric</span>
                        <span>
                          {tier.capacity 
                            ? `Sold ${tier.sold.toLocaleString()} / ${tier.capacity.toLocaleString()} (${percentSold}%)` 
                            : `Sold ${tier.sold.toLocaleString()}`
                          }
                        </span>
                      </div>
                      {tier.capacity > 0 && (
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-[#00ffcc] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 rounded-full bg-black/40 text-zinc-400 transition-colors hover:text-white">
                    {isExpanded ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    )}
                  </div>
                </div>

                {/* Counter block / variations when expanded */}
                {isExpanded && (
                  <div className="pt-3 border-t border-zinc-900/60 flex flex-col gap-3 text-left">
                    <div className="text-[9px] text-zinc-400 font-mono flex flex-col items-start gap-2.5 uppercase font-bold">
                      <div className="bg-black/40 border border-zinc-800 p-2.5 rounded w-full">
                        <span className="text-zinc-500 block mb-1 font-black tracking-wider w-full">Inventory Stock</span>
                        <div className="flex justify-between">
                          <span>Limit: <strong className="text-white">{tier.capacity}</strong></span>
                          <span>Sold: <strong className="text-emerald-400">{tier.sold}</strong></span>
                          <span>Remains: <strong className="text-orange-400 whitespace-nowrap">{(tier.capacity) - tier.sold}</strong></span>
                        </div>
                      </div>

                      {(tier.multiOptions || tier.options) && (
                        <div className="bg-indigo-950/10 border border-indigo-900/30 p-2.5 rounded w-full">
                           <span className="text-indigo-400 block mb-1 font-black tracking-wider text-[8px]">Included Variants & Options</span>
                           <div className="flex flex-col gap-1 text-[9px]">
                             {tier.multiOptions ? tier.multiOptions.map((o, idx) => (
                               <div key={`pacing-row-${idx}`} className="flex justify-between border-b border-indigo-900/20 last:border-0 pb-1 last:pb-0">
                                 <span>{o.label}:</span>
                                 <span className="text-zinc-300">{o.choices.join(', ')}</span>
                               </div>
                             )) : (
                               <div className="flex justify-between">
                                 <span>{tier.optionsLabel || 'Size'}:</span>
                                 <span className="text-zinc-300">{tier.options?.join(', ')}</span>
                               </div>
                             )}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
