import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, Mail, Star, MessageSquare, Send, Plus, Edit2, ChevronLeft, ChevronRight, AlertOctagon, HelpCircle, Trash2, Mic2, Music, Building2, ChevronDown, ChevronUp, Globe, ExternalLink } from 'lucide-react';
import { InventoryItem, UserReview } from '../../../types';
import { getSupabase } from '../../../supabase';
import TalentBuyerRow from './TalentBuyerRow';

interface VenueReputationCardProps {
  key?: any;
  venue: any;
  userReviews: UserReview[];
  savedVenueIds: any;
  bookmarkMutating: any;
  toggleSavedVenue: (id: any) => any;
  handleOpenSuggestion: (venue: any) => any;
  handleGeneratePitch: (venue: any) => any;
  setIntelVenueId: (id: any) => any;
  activeIntelIndex: any;
  setActiveIntelIndex: any;
  onTouchStart: any;
  onTouchMove: any;
  onTouchEndHandler: any;
  triggerNotification?: any;
  onBuyerClick: (promoter: { name: string; email: string; venue: string; avatar: string }) => void;
  onEditVenue?: (venue: any) => void;
  onDeleteVenue?: (venueId: string, venueName: string, venueObj?: any) => void;
  defaultExpanded?: boolean;
  isExpandedOverride?: boolean;
}

export default function VenueReputationCard({
  venue,
  userReviews,
  savedVenueIds,
  bookmarkMutating,
  toggleSavedVenue,
  handleOpenSuggestion,
  handleGeneratePitch,
  setIntelVenueId,
  activeIntelIndex,
  setActiveIntelIndex,
  onTouchStart,
  onTouchMove,
  onTouchEndHandler,
  triggerNotification,
  onBuyerClick,
  onEditVenue,
  onDeleteVenue,
  defaultExpanded = false,
  isExpandedOverride
}: VenueReputationCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  useEffect(() => {
    if (isExpandedOverride !== undefined) {
      setIsExpanded(isExpandedOverride);
    }
  }, [isExpandedOverride]);

  const [matchingProfile, setMatchingProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pitchStatus, setPitchStatus] = useState<'none' | 'pending' | 'offered' | 'declined'>(() => {
    const saved = localStorage.getItem(`nexus_pitch_status_${venue.id}`);
    if (saved) return saved as any;
    if (venue.id === 'v1') return 'offered';
    if (venue.id === 'v3') return 'declined';
    if (venue.id === 'v4') return 'pending';
    return 'none';
  });

  const [pitchDate, setPitchDate] = useState<string>(() => {
    const saved = localStorage.getItem(`nexus_pitch_date_${venue.id}`);
    if (saved) return saved;
    if (venue.id === 'v4') return '06/15';
    return new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
  });

  const updatePitchStatus = (status: 'none' | 'pending' | 'offered' | 'declined') => {
    setPitchStatus(status);
    localStorage.setItem(`nexus_pitch_status_${venue.id}`, status);
    const today = new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
    setPitchDate(today);
    localStorage.setItem(`nexus_pitch_date_${venue.id}`, today);
  };

  // Unilateral verification: Lookup promoter profiles on Supabase to check reputation flags
  useEffect(() => {
    let active = true;
    const fetchPromoterProfile = async () => {
      setIsLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      try {
        // Find a promoter profile where full_name matches buyer name, or email matches, or custom match
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.eq."${venue.email}",full_name.eq."${venue.buyers}"`);

        if (!error && data && data.length > 0 && active) {
          setMatchingProfile(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch promoter profile for reputation calculation:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchPromoterProfile();
    return () => { active = false; };
  }, [venue.email, venue.buyers]);

  // Aggregate reported infractions live from userReviews
  const associatedReviews = userReviews.filter((r: any) => {
    const groupMatch = r.group?.toLowerCase() === venue.name?.toLowerCase();
    const venueIdMatch = r.venue_id === venue.id;
    const promoterMatch = r.target_promoter_id?.toLowerCase() === venue.buyers?.toLowerCase() || 
                          r.target_promoter_id?.toLowerCase() === venue.email?.toLowerCase();
    return groupMatch || venueIdMatch || promoterMatch;
  });

  const paymentDefaultsCount = associatedReviews.filter((r: any) => {
    const isShorter = r.infraction_type === 'SHORTED_PAYMENT' || 
                      r.text?.includes('GUARANTEE_SHORTED') || 
                      r.text?.includes('SHORTED_PAYMENT');
    const isContractDefault = r.infraction_type === 'CONTRACT_DEFAULT' || 
                              r.text?.includes('CONTRACT_DEFAULT') || 
                              r.text?.includes('BACKLINE_DEFAULT') || 
                              r.text?.includes('HOSPITALITY_DEFAULT') || 
                              r.text?.includes('UNSAFE_ENVIRONMENT');
    return isShorter || isContractDefault;
  }).length;

  // Determine critical dispute condition (Database Trigger flag, Local emulated flag, or living default threshold >= 2 reviews)
  const metaProfile = matchingProfile?.creative_metadata || matchingProfile?.promoter_metadata || {};
  const hasDbFlag = metaProfile.CRITICAL_SETTLEMENT_DISPUTE === true || 
                     matchingProfile?.creative_metadata?.CRITICAL_SETTLEMENT_DISPUTE === true ||
                     venue.creative_metadata?.CRITICAL_SETTLEMENT_DISPUTE === true;
  
  // Dynamic Live Threshold Evaluation (Threshold of 2 or more reports within a rolling 90 days or total)
  const isCriticalReputation = hasDbFlag || paymentDefaultsCount >= 2;

  const entries = venue.intelEntries && venue.intelEntries.length > 0
    ? venue.intelEntries
    : ['No intel yet. Be the first to contribute!'];
  
  const activeIdx = activeIntelIndex[venue.id] !== undefined
    ? Math.max(0, Math.min(activeIntelIndex[venue.id], entries.length - 1))
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative max-w-[620px] mx-auto bg-[#13151a] rounded-xl overflow-hidden shadow-lg border transition-all ${
        isCriticalReputation 
          ? 'border-red-600/70 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10' 
          : isExpanded 
            ? 'border-[#a855f7]/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]' 
            : 'border-zinc-800 hover:border-[#a855f7]/50 shadow-[0_0_12px_rgba(0,0,0,0.4)] hover:shadow-[0_0_18px_rgba(168,85,247,0.25)]'
      }`}
    >
      {/* 1. STARK FLASHING BRUTALIST WARNING BANNER ON CRITICAL DISPUTE */}
      {isCriticalReputation && (
        <div className="bg-red-950/40 border-b border-red-500/50 p-2 text-center animate-pulse select-none">
          <div className="flex items-center justify-center gap-1.5 text-red-500 font-mono font-black text-[10px] tracking-widest uppercase">
            <AlertOctagon className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
            <span>⚠️ // WARNING: REPEATED SETTLEMENT DISPUTES RECORDED</span>
          </div>
        </div>
      )}

      {/* Venue Header / Collapsed Summary Bar */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="p-3.5 sm:p-4 flex items-start justify-between cursor-pointer select-none hover:bg-zinc-900/40 transition-colors group/header"
      >
        <div className="text-left flex-1 min-w-0 pr-2">
          {/* Top Row: Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold font-display text-white truncate group-hover/header:text-[#d8b4fe] transition-colors">
              {venue.name}
            </h3>
            
            {/* Place Category Badge */}
            {venue.place_type === 'studio' ? (
              <span className="inline-flex items-center gap-1 bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 select-none shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                <Mic2 className="w-2.5 h-2.5 text-indigo-400" /> Studio
              </span>
            ) : venue.place_type === 'rehearsal' ? (
              <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 select-none shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                <Music className="w-2.5 h-2.5 text-emerald-400" /> Rehearsal
              </span>
            ) : venue.place_type === 'other' ? (
              <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 select-none">
                <Building2 className="w-2.5 h-2.5 text-zinc-400" /> Music Landmark
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-purple-950/40 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 select-none">
                Live Stage
              </span>
            )}

            {venue.source === 'MusicBrainz' && (
              <span className="inline-flex items-center gap-1 bg-teal-950/40 border border-teal-500/40 text-teal-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 select-none">
                ⚡ MusicBrainz
              </span>
            )}
            {(() => {
              const hasPayout = venue.payoutRating && venue.payoutRating > 0;
              const hasLoadIn = venue.loadInRating && venue.loadInRating > 0;
              if (hasPayout || hasLoadIn) {
                const avg = (hasPayout && hasLoadIn) 
                  ? (venue.payoutRating + venue.loadInRating) / 2 
                  : (venue.payoutRating || venue.loadInRating);
                return (
                  <span className="inline-flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.15)] select-none">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {avg.toFixed(1)}
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {/* Details Row: Location + Capacity + Coordinates */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" /> 
              {venue.address ? `${venue.address}, ` : ''}{venue.city}{venue.state ? `, ${venue.state}` : ''}{venue.country ? `, ${venue.country}` : ''}
            </span>
            {venue.capacity > 0 ? (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-zinc-500 shrink-0" /> 
                {venue.capacity} CAP
              </span>
            ) : venue.place_type === 'studio' ? (
              <span className="flex items-center gap-1 text-indigo-400/80">
                <Mic2 className="w-3 h-3 text-indigo-400 shrink-0" /> Studio Facility
              </span>
            ) : venue.place_type === 'rehearsal' ? (
              <span className="flex items-center gap-1 text-emerald-400/80">
                <Music className="w-3 h-3 text-emerald-400 shrink-0" /> Rehearsal / Production
              </span>
            ) : null}
            {venue.lat && venue.lng && (
              <span className="text-[10px] text-teal-400/80 bg-teal-950/20 px-1 py-0.5 rounded border border-teal-900/40">
                GPS [{typeof venue.lat === 'number' ? venue.lat.toFixed(3) : venue.lat}, {typeof venue.lng === 'number' ? venue.lng.toFixed(3) : venue.lng}]
              </span>
            )}
          </div>
        </div>
        
        {/* Genre Fit Badge, Actions, & Star Toggle */}
        <div className="flex flex-col items-end shrink-0 ml-2 sm:ml-4 gap-2 select-none">
          <div className="flex flex-col items-end">
            <div className="text-[9px] font-mono text-zinc-500 uppercase mb-0.5 drop-shadow-sm tracking-wider">Genre Fit</div>
            <div className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md text-xs font-bold font-mono tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)] ${venue.genreFit > 90 ? 'bg-purple-500/20 text-[#d8b4fe] border border-purple-500/30' : venue.genreFit > 80 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
              {venue.genreFit}%
            </div>
          </div>

          {/* Action Row: Bookmark Star, Edit, Delete, Chevron */}
          <div className="flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Edit Details Button */}
            {onEditVenue && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditVenue(venue);
                }}
                className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-150 outline-none select-none active:scale-95 cursor-pointer shadow-sm"
                title="Edit Venue / Place Details"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
              </button>
            )}

            {/* Delete Venue Button */}
            {onDeleteVenue && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVenue(venue.id, venue.name, venue);
                }}
                className="h-7 w-7 rounded-md border border-red-950/80 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500/60 text-red-400/80 hover:text-red-300 flex items-center justify-center transition-all duration-150 outline-none select-none active:scale-95 cursor-pointer shadow-sm"
                title="Delete from Black Book"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Bookmark Star Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSavedVenue(venue.id);
              }}
              disabled={bookmarkMutating === venue.id}
              className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all duration-200 outline-none select-none active:scale-90 cursor-pointer ${
                savedVenueIds.includes(venue.id)
                  ? 'bg-amber-500/20 border-amber-500/70 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-zinc-950/60 border-zinc-850 text-zinc-550 hover:text-zinc-300 hover:border-zinc-700'
              }`}
              title={savedVenueIds.includes(venue.id) ? "Remove Star Bookmark" : "Bookmark to Profile"}
            >
              <Star className={`w-3.5 h-3.5 ${savedVenueIds.includes(venue.id) ? 'fill-amber-400 text-amber-400 font-bold' : 'text-zinc-500'}`} />
            </button>

            {/* Expand / Collapse Chevron Indicator */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(prev => !prev);
              }}
              className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all duration-200 outline-none select-none cursor-pointer ${
                isExpanded 
                  ? 'bg-[#a855f7]/20 border-[#a855f7]/50 text-[#d8b4fe]' 
                  : 'bg-zinc-950/60 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
              title={isExpanded ? "Collapse Card" : "Expand Card Details"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Expandable Content Section */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-zinc-850"
          >
            {/* Talent Buyer & Contact Row */}
            <div className="px-4 py-3 bg-[#0f1115] border-b border-zinc-800/40">
              <div className="font-mono text-xs flex flex-col gap-0.5 text-left bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-zinc-500 text-[9px] uppercase tracking-wider flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{venue.place_type === 'studio' ? 'Studio Contact:' : 'Talent Buyer:'}</span>
                    <TalentBuyerRow
                      buyerName={venue.buyers || (venue.place_type === 'studio' ? 'Studio Manager' : 'Booking Dept.')}
                      venueEmail={venue.email}
                      venueName={venue.name}
                      onBuyerClick={onBuyerClick}
                      triggerNotification={triggerNotification}
                    />
                  </div>
                  <button 
                    onClick={() => handleOpenSuggestion(venue)} 
                    className="opacity-60 hover:opacity-100 text-zinc-500 hover:text-[#00ffcc] transition-opacity cursor-pointer p-1"
                    title="Suggest Contact Data Correction"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-zinc-400 pt-1.5 border-t border-zinc-900/40 mt-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> 
                    <span className="select-all block truncate text-[11px] text-zinc-300 font-mono">
                      {venue.email || <span className="text-zinc-550 italic">Inquire on advance</span>}
                    </span>
                  </div>

                  {venue.website && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <a 
                        href={venue.website.startsWith('http') ? venue.website : `https://${venue.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 font-mono truncate"
                        title={venue.website}
                      >
                        <span className="truncate">{venue.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Infractions Sub-bar */}
              {paymentDefaultsCount > 0 && (
                <div className="mt-2.5 p-2 bg-red-950/20 border border-red-500/20 rounded font-mono text-[10px] text-red-400 flex items-center justify-between gap-2 animate-[pulse_5s_infinite]">
                  <span className="font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-500 stroke-[2]" />
                    REPORTED PAYMENT DEFAULTS LEDGER
                  </span>
                  <span className="bg-red-900/30 text-red-300 px-2 py-0.5 rounded font-black border border-red-500/30">
                    {paymentDefaultsCount} DEFAULTS
                  </span>
                </div>
              )}
            </div>

            {/* Crew Intel Card */}
            <div className="p-4 bg-[#0d0f12]">
              <div className="flex items-center justify-between mb-3 select-none">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> Crew Intel
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1 hidden sm:flex">
                    <span className="text-zinc-500">Payout:</span>
                    <span className={venue.payoutRating >= 4.5 ? 'text-emerald-400' : 'text-amber-400'}>{venue.payoutRating > 0 ? venue.payoutRating.toFixed(1) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 hidden sm:flex">
                    <span className="text-zinc-500">Load-in:</span>
                    <span className={venue.loadInRating >= 4.0 ? 'text-emerald-400' : venue.loadInRating <= 3.0 ? 'text-rose-400' : 'text-amber-400'}>{venue.loadInRating > 0 ? venue.loadInRating.toFixed(1) : 'N/A'}</span>
                  </div>
                  <button 
                    onClick={() => setIntelVenueId(venue.id)}
                    className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded text-[10px] hover:bg-amber-500/20 transition-colors uppercase cursor-pointer flex items-center gap-1 font-bold font-mono"
                  >
                    <Plus className="w-3 h-3" /> Add Intel
                  </button>
                </div>
              </div>
              
              {/* Intel Scroll & Carousel panel */}
              <div 
                className="relative p-3 bg-[#00ffcc] rounded-lg border border-[#00ffcc]/80 flex flex-col gap-2 min-h-[76px] text-left touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={() => onTouchEndHandler(venue.id, entries.length)}
              >
                <div className="flex gap-2 text-xs text-black font-mono">
                  <MessageSquare className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-black font-bold text-[11px] select-text whitespace-pre-wrap flex-grow pr-16 uppercase">
                    {entries[activeIdx]}
                  </p>
                </div>

                {entries.length > 1 && (
                  <div className="absolute right-2 bottom-2 flex items-center gap-1.5 bg-black/10 border border-black/20 rounded px-1.5 py-0.5 text-[9.5px] font-mono select-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newIdx = (activeIdx - 1 + entries.length) % entries.length;
                        setActiveIntelIndex(prev => ({ ...prev, [venue.id]: newIdx }));
                      }}
                      className="text-black/60 hover:text-black cursor-pointer px-1 transition-colors"
                      title="Previous Intel Note"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-black/80 font-bold text-[9px] tracking-wide">{activeIdx + 1}/{entries.length}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newIdx = (activeIdx + 1) % entries.length;
                        setActiveIntelIndex(prev => ({ ...prev, [venue.id]: newIdx }));
                      }}
                      className="text-black/60 hover:text-black cursor-pointer px-1 transition-colors"
                      title="Next Intel Note"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Minimal Data-Attribution Footer */}
              <div className="mt-3 text-center">
                 <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                   LOGGED BY: {venue.created_by || 'SYSTEM'} │ LAST EDIT: {venue.updated_by || 'SYSTEM'} ({venue.updated_at || 'JUST NOW'})
                 </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-[#13151a] border-t border-zinc-800/20 flex flex-col gap-2">
              {pitchStatus === 'none' ? (
                <button
                  onClick={() => {
                    handleGeneratePitch(venue);
                    updatePitchStatus('pending');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-300 hover:bg-white text-black py-3 rounded-lg font-black tracking-widest uppercase text-xs transition-all shadow-[0_0_15px_rgba(212,212,216,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] cursor-pointer select-none"
                >
                  <Send className="w-4 h-4" />
                  Create Pitch
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      const nextState = 
                        pitchStatus === 'pending' ? 'offered' :
                        pitchStatus === 'offered' ? 'declined' : 'none';
                      updatePitchStatus(nextState);
                      if (triggerNotification) {
                        triggerNotification(`🔄 Pitch progression: ${nextState.toUpperCase()}`);
                      }
                    }}
                    className={
                      pitchStatus === 'pending'
                        ? "w-full flex items-center justify-center bg-zinc-900 text-zinc-400 border border-zinc-800 py-3 rounded-lg font-black tracking-widest uppercase text-xs transition-all select-none cursor-pointer"
                        : pitchStatus === 'offered'
                        ? "w-full flex items-center justify-center bg-[#064e3b]/20 text-[#34d399] border border-[#10b981]/30 shadow-[0_0_10px_rgba(16,185,129,0.05)] py-3 rounded-lg font-black tracking-widest uppercase text-xs transition-all select-none cursor-pointer"
                        : "w-full flex items-center justify-center bg-zinc-950 opacity-50 text-zinc-600 border border-zinc-900 py-3 rounded-lg font-black tracking-widest uppercase text-xs transition-all select-none cursor-pointer"
                    }
                  >
                    {pitchStatus === 'pending' && `[ ⏳ Pitch Sent: ${pitchDate} ]`}
                    {pitchStatus === 'offered' && `[ 🟢 Date Offered ]`}
                    {pitchStatus === 'declined' && `[ 🔴 Passed ]`}
                  </button>
                  <span className="text-[9px] text-zinc-600 font-mono text-center select-none uppercase tracking-wider">
                    (Click button to cycle progression states)
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
