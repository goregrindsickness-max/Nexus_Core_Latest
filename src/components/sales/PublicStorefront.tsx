import React, { useState, useEffect } from 'react';
import { 
  Ticket, Activity, Sliders, Users, Trash, Edit2, Copy, Check, Plus, AlertTriangle, Zap, Play 
} from 'lucide-react';
import { TicketTier, Offer, EventLineup, StorefrontTicketItem } from '../../types';
import CrewTerminal from './CrewTerminal';
import DoorCrewWorkspace from '../portals/Promoter/DoorCrewWorkspace';

interface PublicStorefrontProps {
  ticketingEventId: string;
  sandboxTiers: TicketTier[];
  setSandboxTiers: React.Dispatch<React.SetStateAction<TicketTier[]>>;
  lineups: EventLineup[];
  promoterOffers: Offer[];
  localSalesList: any[];
  setLocalSalesList: React.Dispatch<React.SetStateAction<any[]>>;
  handleUpdateTicketTierSold: (eventId: string, tierId: string, currentSold: number) => void;
  triggerNotification?: (msg: string) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export default function PublicStorefront({
  ticketingEventId,
  sandboxTiers,
  setSandboxTiers,
  lineups,
  promoterOffers,
  localSalesList,
  setLocalSalesList,
  handleUpdateTicketTierSold,
  triggerNotification = (msg) => console.log(msg),
  playLocalBeep = () => {},
}: PublicStorefrontProps) {

  // Active Tab state: 'sales', 'inventory', 'affiliate'
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'affiliate'>('sales');
  
  // Door Crew mode modal launcher
  const [showCrewTerminal, setShowCrewTerminal] = useState(false);

  // Core ticketing state loaded from localStorage
  const [items, setItems] = useState<StorefrontTicketItem[]>([]);

  // Forms states
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState<number>(25);
  const [capacity, setCapacity] = useState<number>(100);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [customSku, setCustomSku] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Break-even states
  const [estExpenses, setEstExpenses] = useState<number>(() => {
    const saved = localStorage.getItem(`nexus_breakeven_expenses_${ticketingEventId}`);
    return saved ? parseInt(saved) || 2500 : 2500;
  });
  const [simulatedTicketPrice, setSimulatedTicketPrice] = useState<number>(25);

  // Affiliate states
  const [artistCommissionSplit, setArtistCommissionSplit] = useState<number>(15);
  const [selectedBandId, setSelectedBandId] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Auto-generate SKU from name
  useEffect(() => {
    if (name && !customSku) {
      const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
      const cleanEvent = ticketingEventId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
      const randomSfx = Math.floor(100 + Math.random() * 900);
      setCustomSku(`SKU-${cleanEvent}-${cleanName}-${randomSfx}`);
    }
  }, [name, ticketingEventId]);

  // Load items from localStorage
  const loadItems = () => {
    try {
      const savedStr = localStorage.getItem('nexus_storefront_tickets_list');
      let allItems: StorefrontTicketItem[] = savedStr ? JSON.parse(savedStr) : [];
      let showItems = allItems.filter(item => item.show_id === ticketingEventId);
      
      if (showItems.length === 0) {
        // Seed initial items if empty
        const cleanEvent = ticketingEventId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4);
        const seeds: StorefrontTicketItem[] = [
          {
            id: `seed-bundle-${ticketingEventId}`,
            sku: `SKU-${cleanEvent}-BUNDLE-01`,
            name: 'VIP Backstage Bundle',
            details: 'Includes direct priority skip-the-line check-in, premium limited event poster, and an official tour tee claimable at Merch booths.',
            price: 150,
            capacity: 50,
            sold: 12,
            show_id: ticketingEventId,
            lowStockThreshold: 10
          },
          {
            id: `seed-ga-${ticketingEventId}`,
            sku: `SKU-${cleanEvent}-GEN-501`,
            name: 'General Admission Pass',
            details: 'Standard admission to main floor arena. Holographic souvenir wristband included with ticket check-in at the gate.',
            price: 45,
            capacity: 350,
            sold: 142,
            show_id: ticketingEventId,
            lowStockThreshold: 25
          }
        ];
        const updatedAll = [...allItems, ...seeds];
        localStorage.setItem('nexus_storefront_tickets_list', JSON.stringify(updatedAll));
        showItems = seeds;
      }
      setItems(showItems);
    } catch (e) {
      console.error('Error loading ticketing items:', e);
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, [ticketingEventId]);

  // Save expenses when changed
  useEffect(() => {
    localStorage.setItem(`nexus_breakeven_expenses_${ticketingEventId}`, estExpenses.toString());
  }, [estExpenses, ticketingEventId]);

  // Handle Create Package
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newItem: StorefrontTicketItem = {
        id: 'pkg-' + Math.random().toString(36).substr(2, 9),
        sku: customSku.trim() || `SKU-${ticketingEventId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        details: details.trim() || 'General admission credential package included with immediate check-in.',
        price: Math.max(0, price),
        capacity: Math.max(1, capacity),
        sold: 0,
        show_id: ticketingEventId,
        lowStockThreshold: Math.max(0, lowStockThreshold)
      };

      const savedStr = localStorage.getItem('nexus_storefront_tickets_list');
      const allItems: StorefrontTicketItem[] = savedStr ? JSON.parse(savedStr) : [];
      
      if ((allItems || []).some(item => item.sku === newItem.sku)) {
        triggerNotification('🚨 SKU code already exists. Please input a unique SKU.');
        return;
      }

      const updated = [...allItems, newItem];
      localStorage.setItem('nexus_storefront_tickets_list', JSON.stringify(updated));
      
      // Reset form
      setName('');
      setDetails('');
      setPrice(25);
      setCapacity(100);
      setLowStockThreshold(5);
      setCustomSku('');
      
      loadItems();
      triggerNotification('🎟️ Ticket package created & added to active inventory!');
      playLocalBeep(880, 'sine', 0.05);
    } catch (err) {
      console.error(err);
    }
  };

  // Start Editing
  const startEditing = (item: StorefrontTicketItem) => {
    setEditingId(item.id);
    setName(item?.name);
    setDetails(item.details);
    setPrice(item.price);
    setCapacity(item.capacity);
    setLowStockThreshold(item.lowStockThreshold || 5);
    setCustomSku(item.sku);
    triggerNotification(`✏️ Loaded package ${item?.name} into the builder.`);
  };

  // Save Edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const savedStr = localStorage.getItem('nexus_storefront_tickets_list');
      const allItems: StorefrontTicketItem[] = savedStr ? JSON.parse(savedStr) : [];
      const targetIdx = allItems.findIndex(i => i.id === editingId);
      
      if (targetIdx !== -1) {
        allItems[targetIdx] = {
          ...allItems[targetIdx],
          name: name.trim(),
          details: details.trim(),
          price: Math.max(0, price),
          capacity: Math.max(1, capacity),
          sku: customSku.trim() || allItems[targetIdx].sku,
          lowStockThreshold: Math.max(0, lowStockThreshold)
        };

        localStorage.setItem('nexus_storefront_tickets_list', JSON.stringify(allItems));
        setEditingId(null);
        
        // Reset forms
        setName('');
        setDetails('');
        setPrice(25);
        setCapacity(100);
        setLowStockThreshold(5);
        setCustomSku('');

        loadItems();
        triggerNotification('💾 Ticket package details saved successfully!');
        playLocalBeep(660, 'sine', 0.04);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Package
  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Are you sure you want to retire this package SKU from public storefront?')) return;
    
    try {
      const savedStr = localStorage.getItem('nexus_storefront_tickets_list');
      const allItems: StorefrontTicketItem[] = savedStr ? JSON.parse(savedStr) : [];
      const filtered = allItems.filter(i => i.id !== itemId);
      localStorage.setItem('nexus_storefront_tickets_list', JSON.stringify(filtered));
      
      loadItems();
      triggerNotification('🗑️ Ticket package retired and removed!');
      playLocalBeep(330, 'sawtooth', 0.08);
    } catch (e) {
      console.error(e);
    }
  };

  // Math calculations for live sales & break-even analytics
  const totalTicketsSold = items.reduce((sum, item) => sum + (item.sold || 0), 0);
  const totalCapacity = items.reduce((sum, item) => sum + (item.capacity || 0), 0);
  const ticketRevenue = items.reduce((sum, item) => sum + ((item.sold || 0) * item.price), 0);
  
  const ratio = estExpenses > 0 ? (ticketRevenue / estExpenses) : 0;
  const ratioPercent = Math.min(Math.round(ratio * 100), 100);
  const isBreakedEven = ticketRevenue >= estExpenses;
  const surplusAmount = ticketRevenue - estExpenses;

  // Affiliate network calculations
  const directSales = localSalesList.filter(s => s.show_id === ticketingEventId);
  const bandAttributionsMap: Record<string, { name: string; qty: number; gross: number }> = {};
  
  // Populate from active event offers
  const attachedOffers = promoterOffers.filter(o => o.event_id === ticketingEventId);
  attachedOffers.forEach(o => {
    bandAttributionsMap[o.band_id] = { name: o.band_name, qty: 0, gross: 0 };
  });

  let directVenueQty = 0;
  let directVenueGross = 0;

  directSales.forEach(s => {
    const qty = parseInt(s.quantity) || 1;
    const value = (parseFloat(s.amount) || 0) * qty;
    if (s.band_id) {
      if (!bandAttributionsMap[s.band_id]) {
        bandAttributionsMap[s.band_id] = { name: s.band_name || 'Affiliate', qty: 0, gross: 0 };
      }
      bandAttributionsMap[s.band_id].qty += qty;
      bandAttributionsMap[s.band_id].gross += value;
    } else {
      directVenueQty += qty;
      directVenueGross += value;
    }
  });

  const affiliateRows = Object.entries(bandAttributionsMap).map(([id, meta]) => ({
    id,
    type: 'ARTIST AFFILIATE',
    name: meta.name,
    qty: meta.qty,
    gross: meta.gross,
    payout: Math.ceil(meta.gross * (artistCommissionSplit / 100))
  }));

  affiliateRows.push({
    id: 'venue-direct',
    type: 'VENUE DIRECT',
    name: 'VENUE GENERAL POOL (Direct Storefront)',
    qty: directVenueQty,
    gross: directVenueGross,
    payout: directVenueGross
  });

  const totalGrossRevenue = affiliateRows.reduce((sum, r) => sum + r.gross, 0);
  const totalPayout = affiliateRows.reduce((sum, r) => sum + r.payout, 0);

  // Band list for affiliate referral link generator
  const affiliateBands = ticketingEventId === 'demo-sandbox' 
    ? [
        { band_id: 'b1', band_name: 'Void Walkers' },
        { band_id: 'b2', band_name: 'Goregrind Sickness' },
        { band_id: 'b3', band_name: 'Apostate Legion' }
      ]
    : promoterOffers.filter(o => o.event_id === ticketingEventId).map(o => ({
        band_id: o.band_id,
        band_name: o.band_name
      }));

  const handleCopyPartnerLink = () => {
    const band = affiliateBands.find(b => b.band_id === selectedBandId);
    let link = `${window.location.origin}/pay?show_id=${ticketingEventId}`;
    if (band) {
      link += `&band_id=${band.band_id}&band_name=${encodeURIComponent(band.band_name)}`;
    }
    if (selectedSku && selectedSku !== 'all') {
      link += `&sku=${selectedSku}`;
    }

    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
    triggerNotification(`📋 Copied attributed link for ${band?.band_name || 'Direct Vendor'}!`);
    playLocalBeep(880, 'sine', 0.05);
  };

  if (showCrewTerminal) {
    return (
      <div className="w-full flex-grow animate-fadeIn flex flex-col">
        <DoorCrewWorkspace 
          onClose={() => setShowCrewTerminal(false)} 
          triggerNotification={triggerNotification}
          playLocalBeep={playLocalBeep}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full text-left text-yellow-500 font-mono">
      <h1 className="text-2xl font-mono uppercase tracking-wider font-black text-yellow-500 mb-3 text-center pt-5">
        🎟️ TICKETING & SALES MANAGER
      </h1>
      {/* Sub-tab Navigation Switched Strip with Launch Crew Door on the right */}
      <div className="flex flex-col lg:flex-row w-full gap-2 justify-between items-stretch lg:items-center mb-1 select-none">
        <div className="flex flex-1 border border-zinc-900 bg-zinc-950 text-xs rounded-xl overflow-hidden shadow-2xl">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b ${
              activeTab === 'sales'
                ? 'border-yellow-400 text-yellow-400 font-bold bg-yellow-400/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📊 Tab 1: Live Sales Tracking
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b ${
              activeTab === 'inventory'
                ? 'border-yellow-400 text-yellow-400 font-bold bg-yellow-400/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🛠️ Tab 2: Inventory Builder
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b ${
              activeTab === 'affiliate'
                ? 'border-yellow-400 text-yellow-400 font-bold bg-yellow-400/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🤝 Tab 3: Affiliate Networks
          </button>
        </div>

        <button
          onClick={() => {
            setShowCrewTerminal(true);
            playLocalBeep(750, 'sine', 0.04);
          }}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] py-2.5 px-5 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0"
        >
          <span>🎟️ LAUNCH CREW DOOR WORKSPACE</span>
        </button>
      </div>

      {/* TAB 1: LIVE SALES TRACKING & BREAK EVEN ANALYTICS */}
      {activeTab === 'sales' && (
        <div className="space-y-2 animate-fadeIn">
          {/* Sales Monitoring Panel */}
          <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-2 sm:p-3 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Live Storefront Package Metrics</span>
                <span className="text-[11px] text-yellow-400 font-bold">TOTAL SOLD: {totalTicketsSold} / {totalCapacity}</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                      <th className="py-1.5 px-1.5">PACKAGE / SKU</th>
                      <th className="py-1.5 px-1.5 text-right">UNIT PRICE</th>
                      <th className="py-1.5 px-1.5 text-center">SOLD / CAP</th>
                      <th className="py-1.5 px-1.5 text-center">VELOCITY</th>
                      <th className="py-1.5 px-1.5 text-right">GROSS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-650">
                          No active ticket packages built yet. Navigate to Tab 2 to create stock items.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const isLowStock = (item.capacity - (item.sold || 0)) <= (item.lowStockThreshold || 5);
                        const percentSold = Math.round(((item.sold || 0) / item.capacity) * 100);

                        return (
                          <tr key={item.id ? `pub-store-item-${item.id}-${idx}` : `pub-store-item-${idx}`} className="border-b border-zinc-900/60 hover:bg-zinc-950/45 transition-colors">
                            <td className="py-1.5 px-1.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-300">{item?.name}</span>
                                <span className="text-[9px] text-zinc-550 uppercase tracking-wider mt-0.5">{item.sku}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-1.5 text-right font-bold text-yellow-400/90">${item.price}</td>
                            <td className="py-1.5 px-1.5 text-center font-bold">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-zinc-300">{item.sold || 0}</span>
                                <span className="text-zinc-600">/</span>
                                <span className="text-zinc-400">{item.capacity}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-1.5 text-center">
                              <div className="max-w-xs mx-auto flex items-center gap-2">
                                <div className="flex-1 bg-zinc-900 border border-zinc-850 h-2 rounded overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${
                                      isLowStock ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${percentSold}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-zinc-500 shrink-0">{percentSold}%</span>
                                {isLowStock && (
                                  <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider animate-pulse shrink-0">LOW STOCK</span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-1.5 text-right font-black text-yellow-500">${((item.sold || 0) * item.price).toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Break-Even Analysis Enclosure */}
            <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-2 sm:p-3 shadow-2xl space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">BREAK EVEN TRACKING PANEL</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  isBreakedEven ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                }`}>
                  {isBreakedEven ? '🟢 BREACH ACQUIRED' : '🔴 RECOVERY MODE'}
                </span>
              </div>

              {/* Expense Configuration Input Field */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-black/60 border border-zinc-900/60 p-3 rounded-lg">
                <div className="space-y-0.5 flex-1 text-left">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Est. Venue Operations & Talent Guarantee Expenses</span>
                  <p className="text-[11px] text-zinc-400 font-sans leading-normal">
                    Enter your aggregated budget costs to calculate the exact payout amortization and check-in target boundaries.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded font-mono">
                  <span className="text-zinc-500 text-xs font-bold">BUDGET $</span>
                  <input 
                    type="number"
                    value={estExpenses || ''}
                    onChange={(e) => setEstExpenses(parseInt(e.target.value) || 0)}
                    className="w-24 bg-transparent text-yellow-500 font-black text-center text-xs outline-none focus:ring-0"
                    placeholder="2500"
                  />
                </div>
              </div>

              {/* Amortization Wheel Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Radial Gauge representation */}
                <div className="bg-black/40 border border-zinc-900 rounded-lg p-3 flex items-center gap-5">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="rgba(24, 24, 27, 0.8)" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="26" 
                        stroke={isBreakedEven ? '#10b981' : '#f59e0b'} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={2 * Math.PI * 26 * (1 - (ratioPercent / 100))}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                      {ratioPercent}%
                    </div>
                  </div>

                  <div className="text-left space-y-1 flex-grow">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono block">Capital Amortization Ratio</span>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Invoiced Receipts:</span>
                      <strong className="text-white">${ticketRevenue.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Breakeven Deficit:</span>
                      <strong className={isBreakedEven ? 'text-emerald-400' : 'text-amber-500'}>
                        {isBreakedEven ? `+$${surplusAmount.toLocaleString()}` : `-$${Math.abs(surplusAmount).toLocaleString()}`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Simulated Pricing Sensitivity Slider */}
                <div className="bg-black/40 border border-zinc-900 rounded-lg p-3 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase tracking-wider font-mono">Pricing Sensitivity Simulator</span>
                    <strong className="text-yellow-400 font-bold">${simulatedTicketPrice} USD</strong>
                  </div>
                  
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={simulatedTicketPrice}
                    onChange={(e) => setSimulatedTicketPrice(parseInt(e.target.value))}
                    className="w-full accent-yellow-500 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                  />

                  <div className="text-[10px] text-zinc-400 leading-normal font-sans">
                    {estExpenses > 0 ? (
                      <span>Requires selling <strong className="text-yellow-400 font-mono font-bold">{Math.ceil(estExpenses / simulatedTicketPrice)}</strong> tickets at this rate to offset event operating costs.</span>
                    ) : (
                      <span>Define operations expenses above to run calculations.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY BUILDER */}
        {activeTab === 'inventory' && (
          <div className="space-y-2 animate-fadeIn">
            {/* Intake Form Grid */}
            <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-2 sm:p-3 shadow-2xl space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block border-b border-zinc-900 pb-1.5">
                {editingId ? '📝 MODIFY TICKET OPTION SKU' : '➕ CREATE TICKET PACKAGE & ADMISSION STOCK'}
              </span>

              <form onSubmit={editingId ? handleSaveEdit : handleCreateItem} className="space-y-3 bg-zinc-950/30 p-3 border border-zinc-900 rounded-xl mb-2">
                {/* Row 1 Grid Layout (grid grid-cols-5 gap-2) */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="space-y-1 col-span-3">
                    <label htmlFor="p_name" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block">Package Title</label>
                    <input 
                      id="p_name"
                      type="text"
                      placeholder="e.g. VIP Backstage Bundle"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-3 py-2 text-xs font-mono placeholder-zinc-700 focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label htmlFor="p_sku" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block truncate">Custom Sku identifier code</label>
                    <input 
                      id="p_sku"
                      type="text"
                      placeholder="e.g. SKU-CUSTOM-001"
                      value={customSku}
                      onChange={(e) => setCustomSku(e.target.value.toUpperCase())}
                      className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-3 py-2 text-xs font-mono placeholder-zinc-700 focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>

                {/* Row 2 Grid Layout (grid grid-cols-3 gap-2) */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-1">
                    <label htmlFor="p_price" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block">Sale Price ($)</label>
                    <input 
                      id="p_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-3 py-2 text-xs font-mono focus:border-yellow-500 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1 col-span-1">
                    <label htmlFor="p_capacity" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block truncate">Starting Stock Limit</label>
                    <input 
                      id="p_capacity"
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                      required
                      className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-3 py-2 text-xs font-mono focus:border-yellow-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label htmlFor="p_threshold" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block truncate">Low Stock Alert Info Threshold</label>
                    <input 
                      id="p_threshold"
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                      required
                      className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-3 py-2 text-xs font-mono focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="space-y-1">
                  <label htmlFor="p_details" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block">Package Inclusions & Will-Call Instructions</label>
                  <textarea 
                    id="p_details"
                    rows={3}
                    placeholder="Describe direct pass credential collection instructions at standard gate counters."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-3 py-2 text-xs font-mono placeholder-zinc-700 focus:border-yellow-500 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="submit"
                    className="flex-grow py-2 bg-yellow-500 text-neutral-950 font-bold font-mono text-xs rounded uppercase tracking-wider hover:bg-yellow-400 transition-colors cursor-pointer"
                  >
                    {editingId ? '💾 SAVE PACKAGE MODIFICATIONS' : '➕ SAVE NEW PACKAGE SKU'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setName('');
                        setDetails('');
                        setPrice(25);
                        setCapacity(100);
                        setLowStockThreshold(5);
                        setCustomSku('');
                      }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs rounded font-mono uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Product Card Directory */}
            <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-2 sm:p-3 shadow-2xl space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block border-b border-zinc-900 pb-1.5">Active Catalog summary Cards</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {items.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-zinc-650 text-xs border border-dashed border-zinc-900 rounded-xl bg-black/20">
                    No active packages configured yet. Use the intake form above to add items.
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div 
                      key={item.id ? `pub-store-card-${item.id}-${idx}` : `pub-store-card-${idx}`} 
                      className="bg-black/60 border border-zinc-900 p-3 rounded-xl flex flex-col justify-between hover:border-yellow-500/35 transition-colors group relative"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-left">
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide leading-tight">{item?.name}</h4>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mt-0.5">{item.sku}</span>
                          </div>
                          <span className="text-xs font-black text-yellow-400 shrink-0 font-mono">${item.price}</span>
                        </div>

                        <p className="text-[11px] text-zinc-400 font-sans leading-normal text-left line-clamp-2">
                          {item.details || 'Will-Call collection credentials included.'}
                        </p>

                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono pt-1.5 border-t border-zinc-900/60">
                          <span>STOCK LIMIT: <strong>{item.capacity} units</strong></span>
                          <span>THRESHOLD ALERT: <strong>{item.lowStockThreshold || 5} units</strong></span>
                        </div>
                      </div>

                      {/* Action Overlays */}
                      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-zinc-900/50">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded text-[10px] uppercase font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          title="Modify item details"
                        >
                          <Edit2 className="w-3 h-3 text-yellow-500" />
                          <span>EDIT</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 px-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 hover:text-red-300 rounded text-[10px] uppercase font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          title="Retire item"
                        >
                          <Trash className="w-3 h-3" />
                          <span>Retire</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-500 uppercase flex-1">Manual Override:</span>
                        <button type="button" className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] px-2 py-1 rounded cursor-pointer hover:bg-zinc-800 transition-colors">➖ Comp</button>
                        <button type="button" className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] px-2 py-1 rounded cursor-pointer hover:bg-zinc-800 transition-colors">➕ Print</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AFFILIATE NETWORKS */}
        {activeTab === 'affiliate' && (
          <div className="space-y-2 animate-fadeIn">
            {/* Ledger Matrix Grid */}
            <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-2 sm:p-3 shadow-2xl space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block border-b border-zinc-900 pb-1.5">Affiliate partner & Brand direct payouts Ledger</span>
              
              <div className="overflow-x-auto border border-zinc-900 rounded-lg bg-black/40 p-1">
                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500">
                      <th className="py-2 px-3">AFFILIATE</th>
                      <th className="py-2 px-3 text-center">TYPE</th>
                      <th className="py-2 px-3 text-center">UNITS</th>
                      <th className="py-2 px-3 text-right">GROSS</th>
                      <th className="py-2 px-3 text-right">PAYOUT CALCULATION</th>
                      <th className="py-2 px-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliateRows.map((row, rowIdx) => (
                      <tr key={row.id ? `aff-${row.id}-${rowIdx}` : `aff-${rowIdx}`} className="border-b border-zinc-900/60 hover:bg-zinc-950/20 transition-colors">
                        <td className="py-1.5 px-1.5 font-bold text-zinc-300">{row.name}</td>
                        <td className="py-1.5 px-1.5 text-center">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            row.type === 'VENUE DIRECT' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="py-1.5 px-1.5 text-center text-zinc-400 font-bold">{row.qty}</td>
                        <td className="py-1.5 px-1.5 text-right text-zinc-300">${row.gross.toLocaleString()}</td>
                        <td className="py-1.5 px-1.5 text-right text-yellow-400/90 font-black">
                          ${row.payout.toLocaleString()}
                          {row.type !== 'VENUE DIRECT' && (
                            <span className="text-[8.5px] text-zinc-550 font-normal block">({artistCommissionSplit}% Split)</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1.5 text-right">
                          <button className="text-[10px] font-mono font-bold bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500 hover:text-neutral-950 text-yellow-500 px-2 py-1 rounded transition-all cursor-pointer">
                            💸 CLEAR SETTLEMENT
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Sum Totals */}
                    <tr className="bg-black/60 font-black">
                      <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-zinc-400 text-[10px]">Aggregated Ledger totals</td>
                      <td className="py-3 px-3 text-center text-white">
                        {affiliateRows.reduce((sum, r) => sum + r.qty, 0)} units
                      </td>
                      <td className="py-3 px-3 text-right text-white">${totalGrossRevenue.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-yellow-400">${totalPayout.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commission Percentage Adjuster */}
            <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="space-y-0.5 flex-1 text-left">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Commission Split rate</span>
                <p className="text-[11px] text-zinc-400 font-sans leading-normal">
                  Adjust the percentage paid directly to attributed referral bands for self-promoted ticket sales.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-black border border-zinc-850 px-3 py-1.5 rounded font-mono">
                <span className="text-zinc-500 text-xs font-bold">SPLIT</span>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={artistCommissionSplit}
                  onChange={(e) => setArtistCommissionSplit(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-12 bg-transparent text-yellow-500 font-black text-center text-xs outline-none focus:ring-0"
                />
                <span className="text-zinc-500 text-xs">%</span>
              </div>
            </div>

            {/* Affiliate Builder Link Module */}
            <div className="bg-neutral-950/80 border border-zinc-900 rounded-xl p-2 sm:p-3 shadow-2xl space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block border-b border-zinc-900 pb-1.5">Attributed Referral Partner Link builder</span>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1">
                  <label htmlFor="aff_partner" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block truncate">1. Select Referral Partner (Band)</label>
                  <select
                    id="aff_partner"
                    value={selectedBandId}
                    onChange={(e) => setSelectedBandId(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-2.5 py-2 text-xs font-mono outline-none focus:border-yellow-500"
                  >
                    <option value="">🏠 Direct / General</option>
                    {affiliateBands.map((b, bIdx) => (
                      <option key={b.band_id ? `band-${b.band_id}-${bIdx}` : `band-${bIdx}`} value={b.band_id}>🎸 {b.band_name} (Affiliate)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="aff_package" className="text-[9.5px] text-zinc-400 font-bold uppercase font-mono block truncate">2. Select Target Stock Package</label>
                  <select
                    id="aff_package"
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-yellow-500/90 rounded px-2.5 py-2 text-xs font-mono outline-none focus:border-yellow-500"
                  >
                    <option value="all">🎟️ All Packages (Storefront catalog)</option>
                    {items.map((it, itIdx) => (
                      <option key={it.id ? `it-${it.id}-${itIdx}` : `it-${itIdx}`} value={it.sku}>{it.name} ({it.sku})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct copy action panel */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyPartnerLink}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black font-mono text-xs rounded uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>📋 COPY ATTRIBUTED PARTNER LINK</span>
                </button>
                {copiedLink && (
                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-[10px] text-zinc-400 text-center break-all select-all font-mono">
                    {copiedLink}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
