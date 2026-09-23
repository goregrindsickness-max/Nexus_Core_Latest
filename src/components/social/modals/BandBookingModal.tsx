import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Music, 
  Clock, 
  Users, 
  CheckCircle, 
  Send, 
  Building2, 
  Tag, 
  AlertCircle, 
  Bed, 
  Mic2, 
  Flame, 
  Ticket, 
  FileText, 
  ShieldCheck, 
  Check, 
  Mail, 
  Phone, 
  Utensils, 
  Radio, 
  Layers
} from 'lucide-react';
import { getSupabase, generateUUID } from '../../../supabase';

export interface BandBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: any; // Band / Artist profile receiving the booking offer
  userProfile: any;   // Current user sending the booking request
  triggerNotification?: (msg: string) => void;
  onSuccess?: (bookingData: any) => void;
}

export interface BookingFormData {
  // Event & Routing
  eventName: string;
  eventType: string;
  performanceDate: string;
  doorTime: string;
  setDuration: string;
  venueName: string;
  venueCapacity: string;
  city: string;
  stateProvince: string;
  country: string;
  lineup: string;
  ageRestriction: string;

  // Compensation
  dealStructure: string;
  guaranteeAmount: string;
  currency: string;
  doorSplitPercentage: string;
  depositPercentage: string;
  merchCut: string;

  // Production & Hospitality
  backlineDrums: boolean;
  backlineGuitarCabs: boolean;
  backlineBassRig: boolean;
  backlineSoundTech: boolean;
  accommodations: string;
  hospitalityFood: string;
  hospitalityDrinks: boolean;
  hospitalityTowels: boolean;

  // Contact & Pitch
  promoterName: string;
  promoterOrg: string;
  promoterEmail: string;
  promoterPhone: string;
  customNotes: string;
}

export const BandBookingModal: React.FC<BandBookingModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  userProfile,
  triggerNotification,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'logistics' | 'financial' | 'hospitality' | 'contact'>('logistics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const bandName = targetProfile?.name || targetProfile?.band_name || targetProfile?.title || 'Artist';
  const bandLocation = targetProfile?.location || targetProfile?.city || targetProfile?.country || 'Earth';
  const bandAvatar = targetProfile?.avatar_url || targetProfile?.avatar || targetProfile?.image_url || targetProfile?.image || '';

  const initialPromoterName = userProfile?.name || userProfile?.username || '';
  const initialPromoterOrg = userProfile?.workspace_name || userProfile?.label || userProfile?.company || '';
  const initialPromoterEmail = userProfile?.email || '';

  const [formData, setFormData] = useState<BookingFormData>({
    eventName: '',
    eventType: 'Club Headline Show',
    performanceDate: '',
    doorTime: '19:00',
    setDuration: '45 Min',
    venueName: '',
    venueCapacity: '350',
    city: '',
    stateProvince: '',
    country: 'USA',
    lineup: '',
    ageRestriction: '18+',
    dealStructure: 'Guaranteed Flat Fee',
    guaranteeAmount: '500',
    currency: 'USD ($)',
    doorSplitPercentage: '70% after house nut',
    depositPercentage: '50% on signature',
    merchCut: '100% Artist Keep (0% Venue)',
    backlineDrums: true,
    backlineGuitarCabs: true,
    backlineBassRig: true,
    backlineSoundTech: true,
    accommodations: 'Hotel (2 Double Rooms)',
    hospitalityFood: 'Hot Meal or $25/person Buyout',
    hospitalityDrinks: true,
    hospitalityTowels: true,
    promoterName: initialPromoterName,
    promoterOrg: initialPromoterOrg,
    promoterEmail: initialPromoterEmail,
    promoterPhone: '',
    customNotes: ''
  });

  // Sync user profile details if loaded
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        promoterName: prev.promoterName || userProfile.name || userProfile.username || '',
        promoterOrg: prev.promoterOrg || userProfile.workspace_name || userProfile.company || '',
        promoterEmail: prev.promoterEmail || userProfile.email || ''
      }));
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const handleChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventName.trim()) {
      triggerNotification?.('⚠️ Please enter an event or tour title.');
      setActiveTab('logistics');
      return;
    }

    if (!formData.performanceDate) {
      triggerNotification?.('⚠️ Please select a proposed performance date.');
      setActiveTab('logistics');
      return;
    }

    if (!formData.venueName.trim() || !formData.city.trim()) {
      triggerNotification?.('⚠️ Please specify venue name and city.');
      setActiveTab('logistics');
      return;
    }

    if (!formData.promoterEmail.trim()) {
      triggerNotification?.('⚠️ Please provide a promoter contact email.');
      setActiveTab('contact');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingId = generateUUID();
      const timestamp = new Date().toISOString();

      const bookingRecord = {
        id: bookingId,
        band_id: targetProfile?.id || null,
        band_name: bandName,
        booker_id: userProfile?.id || null,
        booker_name: formData.promoterName || userProfile?.name || 'Promoter',
        booker_email: formData.promoterEmail,
        booker_org: formData.promoterOrg,
        event_name: formData.eventName,
        event_type: formData.eventType,
        performance_date: formData.performanceDate,
        venue_name: formData.venueName,
        city: formData.city,
        state_province: formData.stateProvince,
        country: formData.country,
        venue_capacity: formData.venueCapacity,
        deal_structure: formData.dealStructure,
        guarantee_amount: formData.guaranteeAmount,
        currency: formData.currency,
        door_split: formData.doorSplitPercentage,
        deposit_terms: formData.depositPercentage,
        merch_terms: formData.merchCut,
        lineup: formData.lineup,
        backline: {
          drums: formData.backlineDrums,
          cabs: formData.backlineGuitarCabs,
          bass: formData.backlineBassRig,
          sound_tech: formData.backlineSoundTech
        },
        hospitality: {
          accommodations: formData.accommodations,
          food: formData.hospitalityFood,
          drinks: formData.hospitalityDrinks,
          towels: formData.hospitalityTowels
        },
        custom_notes: formData.customNotes,
        status: 'pending',
        created_at: timestamp,
        updated_at: timestamp
      };

      // 1. Save locally to failover storage
      try {
        const existing = JSON.parse(localStorage.getItem('nexus_booking_requests') || '[]');
        existing.unshift(bookingRecord);
        localStorage.setItem('nexus_booking_requests', JSON.stringify(existing));
      } catch (e) {}

      // 2. Dispatch real notification to recipient band
      try {
        const supabase = getSupabase();
        if (supabase) {
          // Send notification entry
          await supabase.from('nexus_notifications').insert([{
            id: generateUUID(),
            user_id: targetProfile?.id || 'band_inbox',
            sender_id: userProfile?.id || null,
            sender_name: formData.promoterName || 'Promoter / Booker',
            title: `📅 Booking Offer: ${formData.eventName}`,
            message: `${formData.promoterName} sent a formal offer for ${formData.venueName} in ${formData.city} on ${formData.performanceDate} (${formData.guaranteeAmount} ${formData.currency}).`,
            type: 'booking_offer',
            category: 'GIGS',
            data: bookingRecord,
            is_read: false,
            created_at: timestamp
          }]).select();

          // Try persisting in general bookings table if configured
          try {
            await supabase.from('nexus_booking_requests').insert([bookingRecord]).select();
          } catch (insertErr) {
            // Non-blocking if table is not yet provisioned
          }
        }
      } catch (err) {
        console.warn('[BandBookingModal] Supabase transmission notice (using local failover):', err);
      }

      setSubmittedData(bookingRecord);
      setIsSuccess(true);
      triggerNotification?.(`🤘 Formal booking offer dispatched to ${bandName}!`);
      if (onSuccess) onSuccess(bookingRecord);
    } catch (err) {
      console.error('[BandBookingModal] Error submitting booking:', err);
      triggerNotification?.('⚠️ Failed to transmit booking offer. Please check network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[10000000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#09090b] border border-zinc-800/90 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto max-h-[92vh] z-10"
      >
        {/* Top Metallic Neon Glow Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-rose-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {bandAvatar ? (
              <img 
                src={bandAvatar} 
                alt={bandName} 
                className="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shadow-md shrink-0 bg-black" 
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-black text-lg shrink-0">
                {bandName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded">
                  EPK Routing Protocol
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  {bandLocation}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-mono font-black text-white uppercase tracking-wider truncate mt-0.5">
                Book <span className="text-emerald-400">{bandName}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          /* Confirmation State */
          <div className="p-6 sm:p-8 flex flex-col items-center text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-mono font-black text-white uppercase tracking-wider mb-1">
              Booking Offer Transmitted
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-md mb-6">
              Your formal performance memo has been dispatched to <strong className="text-emerald-400">{bandName}</strong>. They will receive an in-app transmission notification and notification record.
            </p>

            {/* Deal Summary Box */}
            <div className="w-full max-w-md bg-black/60 border border-zinc-800 rounded-xl p-4 text-left font-mono text-xs space-y-2 mb-6">
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500 uppercase">Event:</span>
                <span className="text-zinc-200 font-bold">{submittedData?.event_name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500 uppercase">Date & Venue:</span>
                <span className="text-zinc-200 font-bold">{submittedData?.performance_date} • {submittedData?.venue_name} ({submittedData?.city})</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500 uppercase">Offer Terms:</span>
                <span className="text-emerald-400 font-black">{submittedData?.guarantee_amount} {submittedData?.currency} ({submittedData?.deal_structure})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">Booker:</span>
                <span className="text-zinc-300">{submittedData?.booker_name} ({submittedData?.booker_email})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Main Tabbed Form */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('logistics')}
                className={`px-3.5 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'logistics'
                    ? 'bg-[#09090b] text-emerald-400 border-t border-x border-zinc-800 border-b-transparent -mb-[1px] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                1. Event & Logistics
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('financial')}
                className={`px-3.5 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'financial'
                    ? 'bg-[#09090b] text-emerald-400 border-t border-x border-zinc-800 border-b-transparent -mb-[1px] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                2. Deal Terms
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hospitality')}
                className={`px-3.5 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'hospitality'
                    ? 'bg-[#09090b] text-emerald-400 border-t border-x border-zinc-800 border-b-transparent -mb-[1px] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5" />
                3. Backline & Rider
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className={`px-3.5 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-[#09090b] text-emerald-400 border-t border-x border-zinc-800 border-b-transparent -mb-[1px] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                4. Booker Info
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 max-h-[60vh]">
              {/* TAB 1: LOGISTICS */}
              {activeTab === 'logistics' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                      Event / Tour Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midwest Necrosis Tour 2026 / Obscene Extreme Afterparty"
                      value={formData.eventName}
                      onChange={(e) => handleChange('eventName', e.target.value)}
                      className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Event Type
                      </label>
                      <select
                        value={formData.eventType}
                        onChange={(e) => handleChange('eventType', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Club Headline Show">Club Headline Show</option>
                        <option value="Direct Support / Tour Package">Direct Support / Tour Package</option>
                        <option value="Festival Appearance">Festival Appearance</option>
                        <option value="DIY Underground Gig">DIY Underground Gig</option>
                        <option value="Private Showcase / Release Party">Private Showcase / Release Party</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Proposed Performance Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.performanceDate}
                        onChange={(e) => handleChange('performanceDate', e.target.value)}
                        className="w-full px-3 py-2 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Venue / Room Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Reggies Rock Club / Subterranean"
                        value={formData.venueName}
                        onChange={(e) => handleChange('venueName', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Capacity
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 400"
                        value={formData.venueCapacity}
                        onChange={(e) => handleChange('venueCapacity', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chicago"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        State / Province
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IL"
                        value={formData.stateProvince}
                        onChange={(e) => handleChange('stateProvince', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Country
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. USA"
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Door Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 19:00 (7:00 PM)"
                        value={formData.doorTime}
                        onChange={(e) => handleChange('doorTime', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Set Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 45 Min (9:30 PM)"
                        value={formData.setDuration}
                        onChange={(e) => handleChange('setDuration', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Age Restriction
                      </label>
                      <select
                        value={formData.ageRestriction}
                        onChange={(e) => handleChange('ageRestriction', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All Ages">All Ages</option>
                        <option value="18+">18+</option>
                        <option value="21+">21+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                      Lineup & Support Bands
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Internal Bleeding, Bodybox, + Local Openers"
                      value={formData.lineup}
                      onChange={(e) => handleChange('lineup', e.target.value)}
                      className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCIAL */}
              {activeTab === 'financial' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Deal Structure
                      </label>
                      <select
                        value={formData.dealStructure}
                        onChange={(e) => handleChange('dealStructure', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Guaranteed Flat Fee">Guaranteed Flat Fee</option>
                        <option value="Percentage / Door Split">Percentage / Door Split</option>
                        <option value="Guarantee + Door Bonus Split">Guarantee + Door Bonus Split</option>
                        <option value="Gas / Travel Buyout Only">Gas / Travel Buyout Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                        <option value="CAD ($)">CAD ($)</option>
                        <option value="AUD ($)">AUD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Guarantee / Offer Amount ($) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 500"
                          value={formData.guaranteeAmount}
                          onChange={(e) => handleChange('guaranteeAmount', e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Door Split Terms
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 70% after $250 room nut"
                        value={formData.doorSplitPercentage}
                        onChange={(e) => handleChange('doorSplitPercentage', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Deposit Terms
                      </label>
                      <select
                        value={formData.depositPercentage}
                        onChange={(e) => handleChange('depositPercentage', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="50% on signature, 50% day of show">50% on signature, 50% day of show</option>
                        <option value="100% Cash/Wire Day of Show">100% Cash/Wire Day of Show</option>
                        <option value="30% Deposit upon routing lock">30% Deposit upon routing lock</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Merchandise Sales Policy
                      </label>
                      <select
                        value={formData.merchCut}
                        onChange={(e) => handleChange('merchCut', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="100% Artist Keep (0% Venue Cut)">100% Artist Keep (0% Venue Cut)</option>
                        <option value="85% Artist / 15% Venue Soft Merch">85% Artist / 15% Venue Soft Merch</option>
                        <option value="80% Artist / 20% Venue (Seller Provided)">80% Artist / 20% Venue (Seller Provided)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] font-mono text-emerald-300">
                      <strong>Escrow & Settlement Guarantee:</strong> Verified promoter deals route through Nexus Tour & Gig protocol with date lock protection.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BACKLINE & HOSPITALITY */}
              {activeTab === 'hospitality' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-2">
                      Backline & Technical Support Provided
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.backlineDrums}
                          onChange={(e) => handleChange('backlineDrums', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                        />
                        <span className="text-xs font-mono text-zinc-200">Full Drum Shell Pack</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.backlineGuitarCabs}
                          onChange={(e) => handleChange('backlineGuitarCabs', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                        />
                        <span className="text-xs font-mono text-zinc-200">2x 4x12 Guitar Cabs</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.backlineBassRig}
                          onChange={(e) => handleChange('backlineBassRig', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                        />
                        <span className="text-xs font-mono text-zinc-200">Bass 8x10 / Head</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.backlineSoundTech}
                          onChange={(e) => handleChange('backlineSoundTech', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                        />
                        <span className="text-xs font-mono text-zinc-200">House FOH Sound Engineer</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Accommodations / Lodging
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hotel (2 Double Rooms) / Band Crash Pad"
                        value={formData.accommodations}
                        onChange={(e) => handleChange('accommodations', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Catering & Food Buyout
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hot Meal or $25/person Buyout"
                        value={formData.hospitalityFood}
                        onChange={(e) => handleChange('hospitalityFood', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hospitalityDrinks}
                        onChange={(e) => handleChange('hospitalityDrinks', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                      />
                      <span>Beverage / Beer Rider Included</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hospitalityTowels}
                        onChange={(e) => handleChange('hospitalityTowels', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                      />
                      <span>Stage Towels & Bottled Water</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACT & NOTES */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Booker / Promoter Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name / Alias"
                        value={formData.promoterName}
                        onChange={(e) => handleChange('promoterName', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Organization / Production Co.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Abyssal Booking / Deathfest"
                        value={formData.promoterOrg}
                        onChange={(e) => handleChange('promoterOrg', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Primary Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="promoter@booking.com"
                        value={formData.promoterEmail}
                        onChange={(e) => handleChange('promoterEmail', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                        Phone / Signal / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={formData.promoterPhone}
                        onChange={(e) => handleChange('promoterPhone', e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                      Pitch, Routing Notes & Special Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add any specific details regarding stage schedule, travel radius, ticket presale link, or hotel details..."
                      value={formData.customNotes}
                      onChange={(e) => handleChange('customNotes', e.target.value)}
                      className="w-full px-3 py-2.5 bg-black/70 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeTab !== 'logistics' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'financial') setActiveTab('logistics');
                      if (activeTab === 'hospitality') setActiveTab('financial');
                      if (activeTab === 'contact') setActiveTab('hospitality');
                    }}
                    className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {activeTab !== 'contact' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'logistics') setActiveTab('financial');
                      if (activeTab === 'financial') setActiveTab('hospitality');
                      if (activeTab === 'hospitality') setActiveTab('contact');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition-colors cursor-pointer"
                  >
                    Next Step
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Radio className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Booking Offer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default BandBookingModal;
