import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  ExternalLink,
  Music,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';
import {
  NetworkEntity,
  FestivalEdition,
  FestivalLineupItem,
  FestivalEditionStatus,
  BillingTier,
  BILLING_TIER_META,
  getEditionsForEntity,
  getLineupForEdition,
  saveFestivalEdition,
  replaceEditionLineupItems,
  searchPlatformBandsForLineup,
  PlatformBandCandidate,
} from '../../../services/networkEntitiesService';

export interface FestivalLineupEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: NetworkEntity | null;
  initialEditionId?: string;
  onSaved?: (edition: FestivalEdition, lineup: FestivalLineupItem[]) => void;
  onShareEditionToFeed?: (entity: NetworkEntity, edition: FestivalEdition, lineup: FestivalLineupItem[]) => void;
  triggerNotification?: (msg: string) => void;
}

const BILLING_TIERS: BillingTier[] = [
  'headliner',
  'co_headliner',
  'main_support',
  'support',
  'opener',
];

export const FestivalLineupEditorModal: React.FC<FestivalLineupEditorModalProps> = ({
  isOpen,
  onClose,
  entity,
  initialEditionId,
  onSaved,
  onShareEditionToFeed,
  triggerNotification,
}) => {
  const [editions, setEditions] = useState<FestivalEdition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<string>('');

  // Edition metadata fields
  const [editionName, setEditionName] = useState('');
  const [startDate, setStartDate] = useState('2027-07-16');
  const [endDate, setEndDate] = useState('2027-07-18');
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [flyerUrl, setFlyerUrl] = useState('');
  const [status, setStatus] = useState<FestivalEditionStatus>('announced');

  // Lineup items state
  const [lineupItems, setLineupItems] = useState<FestivalLineupItem[]>([]);

  // Add band form state
  const [bandSearchQuery, setBandSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<PlatformBandCandidate | null>(null);
  const [isCustomExternalBand, setIsCustomExternalBand] = useState(false);
  const [customBandName, setCustomBandName] = useState('');
  const [customExternalUrl, setCustomExternalUrl] = useState('');
  const [newBillingTier, setNewBillingTier] = useState<BillingTier>('support');
  const [newDayNumber, setNewDayNumber] = useState<number>(1);
  const [newStageName, setNewStageName] = useState<string>('Main Stage');
  const [newSetTime, setNewSetTime] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const hydrateEditionFields = (ed: FestivalEdition) => {
    setSelectedEditionId(ed.id);
    setEditionName(ed.edition_name);
    setStartDate(ed.start_date || '2027-07-16');
    setEndDate(ed.end_date || ed.start_date || '2027-07-18');
    setVenueName(ed.venue_name || '');
    setCity(ed.city || '');
    setStateCode(ed.state || '');
    setTicketUrl(ed.ticket_url || '');
    setFlyerUrl(ed.flyer_url || '');
    setStatus(ed.status || 'announced');
    setLineupItems(getLineupForEdition(ed.id));
  };

  useEffect(() => {
    if (!isOpen || !entity) return;
    const entityEditions = getEditionsForEntity(entity.id);
    setEditions(entityEditions);

    const targetEd =
      (initialEditionId && entityEditions.find((e) => e.id === initialEditionId)) ||
      entityEditions[0];

    if (targetEd) {
      hydrateEditionFields(targetEd);
    } else {
      const locParts = (entity.location || 'Chicago, IL').split(',').map((s) => s.trim());
      setSelectedEditionId('new');
      setEditionName(`${entity.display_name} 2027`);
      setStartDate('2027-07-16');
      setEndDate('2027-07-18');
      setVenueName('Main Festival Grounds');
      setCity(locParts[0] || 'Chicago');
      setStateCode(locParts[1] || 'IL');
      setTicketUrl(entity.external_links?.tickets || entity.external_links?.website || '');
      setFlyerUrl(entity.banner_url || '');
      setStatus('announced');
      setLineupItems([]);
    }
  }, [isOpen, entity, initialEditionId]);

  const matchingCandidates = useMemo(() => {
    return searchPlatformBandsForLineup(bandSearchQuery);
  }, [bandSearchQuery]);

  if (!isOpen || !entity) return null;

  const handleSelectEditionSwitch = (edId: string) => {
    if (edId === 'new') {
      const locParts = (entity.location || 'Chicago, IL').split(',').map((s) => s.trim());
      setSelectedEditionId('new');
      setEditionName(`${entity.display_name} ${new Date().getFullYear() + 1}`);
      setStartDate('2027-08-20');
      setEndDate('2027-08-22');
      setVenueName('');
      setCity(locParts[0] || 'Chicago');
      setStateCode(locParts[1] || 'IL');
      setTicketUrl('');
      setFlyerUrl(entity.banner_url || '');
      setStatus('announced');
      setLineupItems([]);
      return;
    }
    const found = editions.find((e) => e.id === edId);
    if (found) {
      hydrateEditionFields(found);
    }
  };

  const handleAddBandToLineup = () => {
    const finalName = isCustomExternalBand
      ? customBandName.trim()
      : selectedCandidate?.name || bandSearchQuery.trim();

    if (!finalName) {
      triggerNotification?.('⚠️ Enter or select a band name to add to the festival billing.');
      return;
    }

    const newItem: FestivalLineupItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      edition_id: selectedEditionId,
      band_entity_id: !isCustomExternalBand && selectedCandidate ? selectedCandidate.id : null,
      custom_band_name: finalName,
      custom_external_url: isCustomExternalBand && customExternalUrl.trim() ? customExternalUrl.trim() : null,
      billing_tier: newBillingTier,
      sort_order: lineupItems.length + 1,
      day_number: newDayNumber || 1,
      stage_name: newStageName.trim() || 'Main Stage',
      performance_date: startDate || null,
      set_time: newSetTime.trim() || null,
      created_at: new Date().toISOString(),
      resolved_band_name: finalName,
      resolved_band_logo: selectedCandidate?.logo_url || undefined,
      resolved_band_genre: selectedCandidate?.genre || undefined,
      resolved_band_location: selectedCandidate?.location || undefined,
      is_platform_band: Boolean(!isCustomExternalBand && selectedCandidate),
    };

    setLineupItems((prev) => [...prev, newItem]);
    setBandSearchQuery('');
    setSelectedCandidate(null);
    setCustomBandName('');
    setCustomExternalUrl('');
    setNewSetTime('');
    setShowDropdown(false);
    triggerNotification?.(
      `🎸 Added ${finalName} (${BILLING_TIER_META[newBillingTier].label}) to ${editionName || entity.display_name}!`
    );
  };

  const handleRemoveItem = (id: string) => {
    setLineupItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleMoveItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= lineupItems.length) return;
    const copy = [...lineupItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setLineupItems(
      copy.map((item, idx) => ({
        ...item,
        sort_order: idx + 1,
      }))
    );
  };

  const handleUpdateItemTier = (id: string, tier: BillingTier) => {
    setLineupItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, billing_tier: tier } : item))
    );
  };

  const handleUpdateItemDay = (id: string, day: number) => {
    setLineupItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, day_number: day } : item))
    );
  };

  const handleSaveAll = async (andShareToFeed = false) => {
    if (!editionName.trim()) {
      triggerNotification?.('⚠️ Please provide an Edition Name.');
      return;
    }
    setIsSaving(true);
    try {
      const savedEdition = await saveFestivalEdition({
        id: selectedEditionId && selectedEditionId !== 'new' ? selectedEditionId : undefined,
        entity_id: entity.id,
        edition_name: editionName.trim(),
        start_date: startDate || '2027-07-16',
        end_date: endDate || startDate || '2027-07-18',
        venue_name: venueName.trim() || 'Main Festival Grounds',
        city: city.trim() || 'Chicago',
        state: stateCode.trim() || 'IL',
        ticket_url: ticketUrl.trim() || null,
        flyer_url: flyerUrl.trim() || entity.banner_url || null,
        status,
      });

      const savedLineup = await replaceEditionLineupItems(
        savedEdition.id,
        lineupItems.map((it, idx) => ({
          ...it,
          sort_order: idx + 1,
        }))
      );

      setSelectedEditionId(savedEdition.id);
      setEditions(getEditionsForEntity(entity.id));
      setLineupItems(savedLineup);

      triggerNotification?.(
        `✅ Saved "${savedEdition.edition_name}" with ${savedLineup.length} billed bands!`
      );
      onSaved?.(savedEdition, savedLineup);

      if (andShareToFeed && onShareEditionToFeed) {
        onShareEditionToFeed(entity, savedEdition, savedLineup);
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#0a0c12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-left my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#11141e] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
              🎪
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Festival Edition & Lineup Roster Manager
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  @{entity.slug}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Tag registered Nexus bands (interactive profile cards) or external acts across tiered billing slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEditionId}
              onChange={(e) => handleSelectEditionSwitch(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {editions.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  📅 {ed.edition_name} ({ed.status.toUpperCase()})
                </option>
              ))}
              <option value="new">+ Create New Festival Edition</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* 1. Edition Details Grid */}
          <div className="p-4 rounded-xl bg-[#0e1118] border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Edition Details & Logistics</span>
              </span>
              <div className="flex items-center gap-1.5">
                {(['draft', 'announced', 'sold_out', 'completed'] as FestivalEditionStatus[]).map(
                  (st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                        status === st
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Edition Title *
                </label>
                <input
                  type="text"
                  value={editionName}
                  onChange={(e) => setEditionName(e.target.value)}
                  placeholder="Chicago Domination Fest 2027"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Reggies Rock Club"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chicago"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="IL"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Ticket / Passes URL
                </label>
                <input
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  placeholder="https://tickets..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Add Band to Billing Builder */}
          <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Band to Festival Lineup</span>
              </span>

              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCustomExternalBand(false)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    !isCustomExternalBand
                      ? 'bg-amber-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🔍 Search Nexus Bands
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomExternalBand(true);
                    setSelectedCandidate(null);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    isCustomExternalBand
                      ? 'bg-amber-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🌐 External / Unlisted Band
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* Band Picker or Custom Name */}
              {!isCustomExternalBand ? (
                <div className="sm:col-span-5 relative">
                  <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                    Search Registered Platform Bands (or type any band)
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bandSearchQuery}
                      onFocus={() => setShowDropdown(true)}
                      onChange={(e) => {
                        setBandSearchQuery(e.target.value);
                        setSelectedCandidate(null);
                        setShowDropdown(true);
                      }}
                      placeholder="Type band name (e.g. Suffocation, Lust of Decay)..."
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  {showDropdown && matchingCandidates.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#12151f] border border-zinc-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-zinc-800/70">
                      {matchingCandidates.map((cand) => (
                        <button
                          type="button"
                          key={cand.id}
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setBandSearchQuery(cand.name);
                            setShowDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-amber-500/15 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                              {cand.logo_url ? (
                                <img
                                  src={cand.logo_url}
                                  alt={cand.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[9px] font-bold text-amber-400">
                                  {cand.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {cand.name}
                              </div>
                              <div className="text-[9px] font-mono text-zinc-400 truncate">
                                {cand.genre} • {cand.location}
                              </div>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                            ON NEXUS
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                      Custom Band Name *
                    </label>
                    <input
                      type="text"
                      value={customBandName}
                      onChange={(e) => setCustomBandName(e.target.value)}
                      placeholder="e.g. Mortal Decay"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                      External URL (Bandcamp/IG)
                    </label>
                    <input
                      type="url"
                      value={customExternalUrl}
                      onChange={(e) => setCustomExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </>
              )}

              {/* Billing Tier */}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Billing Tier
                </label>
                <select
                  value={newBillingTier}
                  onChange={(e) => setNewBillingTier(e.target.value as BillingTier)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono cursor-pointer"
                >
                  {BILLING_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {BILLING_TIER_META[t].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Number */}
              <div className="sm:col-span-1">
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Day
                </label>
                <select
                  value={newDayNumber}
                  onChange={(e) => setNewDayNumber(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono cursor-pointer"
                >
                  {[1, 2, 3, 4].map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage & Set Time */}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                  Stage / Set Time
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Stage"
                    className="w-1/2 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono"
                  />
                  <input
                    type="text"
                    value={newSetTime}
                    onChange={(e) => setNewSetTime(e.target.value)}
                    placeholder="9:30 PM"
                    className="w-1/2 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono"
                  />
                </div>
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddBandToLineup}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Band</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Current Lineup Roster Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Active Lineup Billing ({lineupItems.length} Bands)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Tagged Nexus bands open interactive profile cards when clicked
              </span>
            </div>

            {lineupItems.length === 0 ? (
              <div className="p-8 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center space-y-2">
                <p className="text-xs font-mono text-zinc-400">
                  No bands billed for this festival edition yet.
                </p>
                <p className="text-[11px] font-mono text-zinc-500">
                  Use the search bar above to tag platform bands or add external acts by billing tier.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/70 bg-[#0d1017]">
                {lineupItems.map((item, idx) => {
                  const tierMeta =
                    BILLING_TIER_META[item.billing_tier] || BILLING_TIER_META.support;
                  const bandLabel = item.resolved_band_name || item.custom_band_name || 'TBA';
                  return (
                    <div
                      key={item.id}
                      className="px-3.5 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 hover:bg-zinc-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-zinc-500 w-5 text-right tabular-nums">
                          #{idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.resolved_band_logo ? (
                            <img
                              src={item.resolved_band_logo}
                              alt={bandLabel}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xs font-black text-amber-400">
                              {bandLabel.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase text-white truncate">
                              {bandLabel}
                            </span>
                            {item.is_platform_band ? (
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                                ⚡ NEXUS PROFILE LINKED
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                🌐 EXTERNAL BAND
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 truncate">
                            {item.stage_name || 'Main Stage'}
                            {item.set_time ? ` • ${item.set_time}` : ''}
                            {item.resolved_band_location ? ` • ${item.resolved_band_location}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={item.billing_tier}
                          onChange={(e) =>
                            handleUpdateItemTier(item.id, e.target.value as BillingTier)
                          }
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded border bg-zinc-950 cursor-pointer ${tierMeta.badgeClass}`}
                        >
                          {BILLING_TIERS.map((t) => (
                            <option key={t} value={t} className="bg-zinc-950 text-white">
                              {BILLING_TIER_META[t].label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.day_number || 1}
                          onChange={(e) => handleUpdateItemDay(item.id, Number(e.target.value))}
                          className="text-[10px] font-mono font-bold px-2 py-1 rounded border border-zinc-700 bg-zinc-950 text-zinc-300 cursor-pointer"
                        >
                          {[1, 2, 3, 4].map((d) => (
                            <option key={d} value={d}>
                              Day {d}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 1)}
                            disabled={idx === lineupItems.length - 1}
                            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 cursor-pointer ml-1"
                            title="Remove band from lineup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#11141e] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase border border-zinc-800 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onShareEditionToFeed && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveAll(true)}
                className="px-4 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/50 font-mono font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Save & Post Billing Card to Feed</span>
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAll(false)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving Lineup...' : 'Save Edition & Lineup'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalLineupEditorModal;
