import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Link as LinkIcon, Check } from 'lucide-react';
import { Offer } from '../../types';

interface TicketStorefrontItem {
  id: string;
  sku: string;
  name: string;
  details: string;
  price: number;
  capacity: number;
  sold: number;
  show_id: string;
}

interface BandAffiliateMetricsProps {
  ticketingEventId: string;
  promoterOffers: Offer[];
  localSalesList: any[];
  artistCommissionSplit: number;
  setArtistCommissionSplit: (split: number) => void;
  isBandAffiliateCollapsed: boolean;
  setIsBandAffiliateCollapsed: (collapsed: boolean) => void;
  playLocalBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
  triggerNotification?: (msg: string) => void;
}

export default function BandAffiliateMetrics({
  ticketingEventId,
  promoterOffers,
  localSalesList,
  artistCommissionSplit,
  setArtistCommissionSplit,
  isBandAffiliateCollapsed,
  setIsBandAffiliateCollapsed,
  playLocalBeep,
  triggerNotification
}: BandAffiliateMetricsProps) {

  const [storefrontItems, setStorefrontItems] = useState<TicketStorefrontItem[]>([]);
  const [selectedBandId, setSelectedBandId] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Retrieve current active event sales and check out allocations
  const directSales = localSalesList.filter(s => s.show_id === ticketingEventId);
  
  // Calculate allocations per affiliate
  const bandAttributionsMap: Record<string, { name: string; qty: number; gross: number }> = {};
  
  // Initialize with offer bands
  const attachedOffers = promoterOffers.filter(o => o.event_id === ticketingEventId);
  attachedOffers.forEach(o => {
    bandAttributionsMap[o.band_id] = { name: o.band_name, qty: 0, gross: 0 };
  });

  // Calculate actuals
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

  // Convert to list
  const listRows = Object.entries(bandAttributionsMap).map(([id, meta]) => ({
    id,
    type: 'ARTIST AFFILIATE',
    name: meta.name,
    qty: meta.qty,
    gross: meta.gross,
    payout: Math.ceil(meta.gross * (artistCommissionSplit / 100))
  }));

  // Add Venue row
  listRows.push({
    id: 'venue-direct',
    type: 'VENUE DIRECT',
    name: 'VENUE GENERAL POOL (Direct Storefront)',
    qty: directVenueQty,
    gross: directVenueGross,
    payout: directVenueGross
  });

  const totalGross = listRows.reduce((sum, r) => sum + r.gross, 0);
  const totalPayout = listRows.reduce((sum, r) => sum + r.payout, 0);

  // Load physical storefront ticket items so we can attribute specific packages
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem('nexus_storefront_tickets_list');
      const allItems = savedStr ? JSON.parse(savedStr) : [];
      const filtered = allItems.filter((i: any) => i.show_id === ticketingEventId);
      setStorefrontItems(filtered);
    } catch (_) {
      setStorefrontItems([]);
    }
  }, [ticketingEventId, isBandAffiliateCollapsed]);

  const bandsForLink = ticketingEventId === 'demo-sandbox' 
    ? [
        { band_id: 'b1', band_name: 'Void Walkers' },
        { band_id: 'b2', band_name: 'Goregrind Sickness' },
        { band_id: 'b3', band_name: 'Apostate Legion' }
      ]
    : promoterOffers.filter(o => o.event_id === ticketingEventId).map(o => ({
        band_id: o.band_id,
        band_name: o.band_name
      }));

  const handleCopyLink = (bandId: string, bandName: string, sku: string) => {
    let link = `${window.location.origin}/pay?show_id=${ticketingEventId}`;
    if (bandId) {
      link += `&band_id=${bandId}&band_name=${encodeURIComponent(bandName)}`;
    }
    if (sku && sku !== 'all') {
      link += `&sku=${sku}`;
    }

    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);

    if (triggerNotification) {
      triggerNotification(`Attributed referral link for ${bandName || 'Direct'} copied to clipboard!`);
    }
    if (playLocalBeep) {
      playLocalBeep(880, 'sine', 0.05);
    }
  };

  return (
    <div className="w-full border border-purple-500/25 bg-black/85 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        aria-expanded={!isBandAffiliateCollapsed}
        onClick={() => {
          setIsBandAffiliateCollapsed(!isBandAffiliateCollapsed);
          if (typeof playLocalBeep === 'function') playLocalBeep(520, 'sine', 0.015);
        }}
        className="w-full p-4 sm:p-5 flex flex-col md:items-center justify-center text-center hover:bg-purple-950/10 transition-colors gap-3"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-purple-450 text-xl shrink-0">💸</span>
          <div className="flex flex-col items-center text-center">
            <h3 
              style={{ fontSize: '23px', textAlign: 'center' }}
              className="text-xl sm:text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-350 to-pink-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.55)] tracking-widest uppercase flex items-center justify-center gap-2 text-center"
            >
              Affiliates
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-1 text-center">
              Real-time calculation of attributed ticket quantities and ledger balances.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 shrink-0 w-full md:w-auto mt-2">
          <span className="text-purple-350 p-2 bg-purple-950/30 border border-purple-800/40 rounded-xl hover:bg-purple-900/20 hover:border-purple-600 transition-all shrink-0 flex items-center justify-center">
            {isBandAffiliateCollapsed ? (
              <ChevronDown className="w-5 h-5 text-purple-400 animate-pulse" />
            ) : (
              <ChevronUp className="w-5 h-5 text-purple-300" />
            )}
          </span>
        </div>
      </button>

      {!isBandAffiliateCollapsed && (
        <div className="border-t border-zinc-900/60 p-4 sm:p-5 space-y-5">
          {/* Splits Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-550 uppercase font-black tracking-wider text-[9.5px]">
                  <th className="pb-3 pr-2">PARTNER</th>
                  <th className="pb-3 text-center">TICKETS ATTRIBUTED</th>
                  <th className="pb-3 text-right">GROSS REV</th>
                  <th className="pb-3 text-right text-purple-400">EST ALLOCATED</th>
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {listRows.map((row, idx) => (
                  <tr key={`split-row-${row.id}-${idx}`} className="hover:bg-zinc-900/10">
                    <td className="py-3.5 pr-2 font-bold text-white uppercase">{row.name}</td>
                    <td className="py-3.5 text-center text-zinc-300 font-black">{row.qty} qty</td>
                    <td className="py-3.5 text-right text-zinc-400">${row.gross.toLocaleString()}</td>
                    <td className="py-3.5 text-right font-black text-purple-300">${row.payout.toLocaleString()}</td>
                    <td className="py-3.5 text-right">
                      {row.id !== 'venue-direct' ? (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(row.id, row.name, 'all')}
                          className="px-2.5 py-1 text-[10px] bg-purple-950/40 hover:bg-purple-900 hover:text-white border border-purple-500/30 text-purple-300 rounded font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                        >
                          <LinkIcon className="w-3 h-3" /> Quick Link
                        </button>
                      ) : (
                        <span className="text-zinc-650">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Grand summary row */}
                <tr className="border-t-2 border-zinc-900 font-black text-white bg-zinc-950/30">
                  <td className="py-4 font-black">GRAND LEDGER ACTUALS</td>
                  <td className="py-4 text-center text-amber-500 font-black">
                    {listRows.reduce((sum, r) => sum + r.qty, 0)} sold
                  </td>
                  <td className="py-4 text-right">${totalGross.toLocaleString()}</td>
                  <td className="py-4 text-right text-[#00ffcc] font-black">${totalPayout.toLocaleString()}</td>
                  <td className="py-4 text-right text-zinc-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Moved Affiliate Link Builder Block requested by user */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-xl space-y-4 text-left">
            <div className="border-b border-zinc-900 pb-2">
              <span className="text-[10px] sm:text-xs text-purple-400 font-black uppercase tracking-wider block font-mono">🔗 Affiliate Link Custom Builder</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Affiliate Referral Partner */}
              <div className="space-y-2 text-left">
                <label htmlFor="affiliate-partner-select" className="text-[10px] text-zinc-400 font-bold uppercase font-mono block">1. Select Referral Partner (Band)</label>
                <select 
                  id="affiliate-partner-select"
                  value={selectedBandId}
                  onChange={(e) => setSelectedBandId(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white rounded-xl p-3 text-xs sm:text-sm font-mono focus:border-purple-400 focus:ring-1 focus:ring-purple-400/35 cursor-pointer text-ellipsis"
                >
                  <option value="">🏠 Direct Venue / General Storefront (No Partner)</option>
                  {bandsForLink.map((b, bIdx) => (
                    <option key={`opt-aff-band-${b.band_id}-${bIdx}`} value={b.band_id}>
                      🎸 {b.band_name} (Attributed affiliate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Ticket / Package SKU */}
              <div className="space-y-2 text-left">
                <label htmlFor="affiliate-package-select" className="text-[10px] text-zinc-400 font-bold uppercase font-mono block">2. Select Target Package (Optional)</label>
                <select 
                  id="affiliate-package-select"
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white rounded-xl p-3 text-xs sm:text-sm font-mono focus:border-purple-400 focus:ring-1 focus:ring-purple-400/35 cursor-pointer text-ellipsis"
                >
                  <option value="all">🎁 Entire Venue Shopping Catalog (Generic Link)</option>
                  {storefrontItems.map((item, idx) => (
                    <option key={`opt-aff-sku-${item.id}-${idx}`} value={item.sku}>
                      🎟️ {item?.name} (${item.price} USD) — SKU: {item.sku}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  const partnerObj = bandsForLink.find(b => b.band_id === selectedBandId);
                  const nameStr = partnerObj ? partnerObj.band_name : 'Direct Venue';
                  handleCopyLink(selectedBandId, nameStr, selectedSku);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-900 to-indigo-950 hover:brightness-110 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-mono tracking-widest uppercase font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> COPIED!
                  </>
                ) : (
                  <>
                    📋 COPY ATTRIBUTED PARTNER LINK
                  </>
                )}
              </button>

              <div className="text-[10px] text-zinc-500 font-mono text-center sm:text-left leading-normal font-sans">
                Referral partners earn a split commission on ticket sales matching their link parameters. This builders injects <code className="text-purple-400 font-mono bg-purple-950/20 px-1 py-0.5 rounded">band_id</code> as an auditor cookie.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
