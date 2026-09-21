import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Sparkles, Clock, Users, DollarSign, Image as ImageIcon, Flame, Lock, Check, Upload, Trash2, Ticket, AlertTriangle } from 'lucide-react';
import { compressImageInSocialFeed } from '../../../utils/socialFeedUtils';
import { checkDuplicateCommunityEvent } from '../../../utils/communityEventUtils';

export interface CreateDIYEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  setEventTitle: (val: string) => void;
  eventType: string;
  setEventType: (val: string) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  eventTime: string;
  setEventTime: (val: string) => void;
  eventLocationName: string;
  setEventLocationName: (val: string) => void;
  eventAddress: string;
  setEventAddress: (val: string) => void;
  eventIsSecret: boolean;
  setEventIsSecret: (val: boolean) => void;
  eventLineup: string;
  setEventLineup: (val: string) => void;
  eventFlyerUrl: string;
  setEventFlyerUrl: (val: string) => void;
  eventDescription: string;
  setEventDescription: (val: string) => void;
  eventCost: string;
  setEventCost: (val: string) => void;
  eventTicketUrl?: string;
  setEventTicketUrl?: (val: string) => void;
  onSaveEvent?: () => void;
  onRemoveEvent?: () => void;
  isAttached?: boolean;
  triggerNotification?: (msg: string) => void;
}

export const EVENT_CATEGORIES = [
  { id: 'DIY Show', label: 'DIY SHOW', icon: '🎸', desc: 'House, basement, or backyard gig' },
  { id: 'Fest / Festival', label: 'FESTIVAL', icon: '🎪', desc: 'Multi-band fest or all-dayer' },
  { id: 'Tour Date', label: 'TOUR DATE', icon: '🚐', desc: 'Official tour routing stop' },
  { id: 'Club Gig', label: 'CLUB GIG', icon: '⚡', desc: 'Standard music club or venue' },
  { id: 'Warehouse Rave', label: 'WAREHOUSE RAVE', icon: '🔊', desc: 'Off-grid venue / late night' },
  { id: 'House Party', label: 'HOUSE PARTY', icon: '🎉', desc: 'Social gathering & party' },
  { id: 'Pop-Up / Jam', label: 'POP-UP / JAM', icon: '🔥', desc: 'Merch swap, jam session or popup' },
  { id: 'Other Gathering', label: 'OTHER GATHERING', icon: '✨', desc: 'Listening party, meetup, etc.' }
];

export const CreateDIYEventModal: React.FC<CreateDIYEventModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  setEventTitle,
  eventType,
  setEventType,
  eventDate,
  setEventDate,
  eventTime,
  setEventTime,
  eventLocationName,
  setEventLocationName,
  eventAddress,
  setEventAddress,
  eventIsSecret,
  setEventIsSecret,
  eventLineup,
  setEventLineup,
  eventFlyerUrl,
  setEventFlyerUrl,
  eventDescription,
  setEventDescription,
  eventCost,
  setEventCost,
  eventTicketUrl,
  setEventTicketUrl,
  onSaveEvent,
  onRemoveEvent,
  isAttached = false,
  triggerNotification,
}) => {
  const flyerFileInputRef = useRef<HTMLInputElement>(null);

  const dupCheck = useMemo(() => {
    return checkDuplicateCommunityEvent({
      title: eventTitle,
      date: eventDate,
      venue: eventLocationName,
      ticketUrl: eventTicketUrl
    });
  }, [eventTitle, eventDate, eventLocationName, eventTicketUrl]);

  const handleFlyerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        triggerNotification?.('⚠️ Flyer photo exceeds 10MB limit.');
        return;
      }
      triggerNotification?.('⏳ Processing event flyer...');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const compressed = await compressImageInSocialFeed(base64, 1024, 1024, 0.8);
          setEventFlyerUrl(compressed);
          triggerNotification?.('✅ Event flyer uploaded from device!');
        } catch (err) {
          console.error('Flyer compression error:', err);
          setEventFlyerUrl(reader.result as string);
          triggerNotification?.('✅ Event flyer uploaded!');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = () => {
    if (!eventTitle.trim()) {
      triggerNotification?.('⚠️ Event Title is required!');
      return;
    }
    if (!eventLocationName.trim()) {
      triggerNotification?.('⚠️ Location/Venue Name is required!');
      return;
    }
    if (onSaveEvent) onSaveEvent();
    triggerNotification?.('🎉 DIY Event attached to your post!');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0b0c10] border border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.2)] p-4 sm:p-5 relative my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest font-display flex items-center gap-1.5">
                    DIY & Community Event Creator
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Create DIY shows, parties, BBQs & off-grid gatherings</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields - Scrollable */}
            <div className="space-y-3.5 overflow-y-auto pr-1 custom-scrollbar text-left text-xs font-mono">
              {/* Real-Time Duplicate Prevention Notice */}
              {dupCheck.isDuplicate && dupCheck.matchedEvent && (
                <div className="p-3 bg-amber-950/60 border-2 border-amber-500/60 rounded-xl text-amber-200 text-xs space-y-1.5 animate-in fade-in shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-[11px] text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Existing Event Page Detected ({dupCheck.matchReason})</span>
                  </div>
                  <p className="text-[11px] text-zinc-200">
                    Matches existing scene event <strong className="text-amber-300 font-bold">{dupCheck.matchedEvent.name}</strong> on {dupCheck.matchedEvent.date} @ {dupCheck.matchedEvent.venue_name}.
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Attaching will link to this existing event page to avoid duplicate calendar listings and consolidate RSVPs!
                  </p>
                </div>
              )}

              {/* Event Type Grid */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1.5">
                  Event Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EVENT_CATEGORIES.map((cat, catIdx) => {
                    const isSelected = eventType === cat.id;
                    return (
                      <button
                        key={`diy-cat-${cat.id}-${catIdx}`}
                        type="button"
                        onClick={() => setEventType(cat.id)}
                        className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-zinc-950/80 border-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>{cat.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-wide truncate">{cat.label}</span>
                        </div>
                        <span className="text-[8px] text-zinc-500 leading-tight">{cat.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1">
                  Event Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moshpit Backyard BBQ & DIY Noise Fest"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SAT, AUG 22"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7:00 PM"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Location Name & Address */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" /> Venue / Location Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Boiler Room Alley / 123 House Spot"
                  value={eventLocationName}
                  onChange={(e) => setEventLocationName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all mb-2"
                />

                <input
                  type="text"
                  placeholder="Address or City (e.g. Portland, OR)"
                  value={eventAddress}
                  onChange={(e) => setEventAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                />

                {/* Secret Location Toggle */}
                <button
                  type="button"
                  onClick={() => setEventIsSecret(!eventIsSecret)}
                  className={`mt-2 w-full flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    eventIsSecret 
                      ? 'bg-red-950/50 border-red-500/80 text-red-300' 
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className={`w-3.5 h-3.5 ${eventIsSecret ? 'text-red-400' : 'text-zinc-500'}`} />
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase">Secret Location / Address via DM</p>
                      <p className="text-[8px] text-zinc-500">Hides full street address on public feed card for DIY privacy</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${eventIsSecret ? 'bg-red-500 border-red-400 text-black' : 'border-zinc-700'}`}>
                    {eventIsSecret && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              </div>

              {/* Lineup / Performers */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" /> Lineup / Bands / DJs
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mortician, Vomit Corpse, Local DJs (comma separated)"
                  value={eventLineup}
                  onChange={(e) => setEventLineup(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Entry / Cover Fee */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-400" /> Entry / Cover Fee
                </label>
                <input
                  type="text"
                  placeholder="e.g. FREE / $5 Donation / BYOB"
                  value={eventCost}
                  onChange={(e) => setEventCost(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Ticket URL / Presale Link (Optional) */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-amber-400" /> Ticket / Presale Link (Optional)
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">DICE, EVENTBRITE, ETC.</span>
                </label>
                <input
                  type="url"
                  placeholder="https://dice.fm/event/... or presale link (optional)"
                  value={eventTicketUrl || ''}
                  onChange={(e) => setEventTicketUrl?.(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all font-mono text-xs"
                />
              </div>

              {/* Native Flyer / Poster Device Uploader */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-400" /> Event Flyer / Poster
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">PNG, JPG, WEBP</span>
                </label>

                <input
                  type="file"
                  ref={flyerFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFlyerFileChange}
                />

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
                  {/* Thumbnail Preview Box */}
                  <div className="w-20 h-24 rounded-lg bg-black border border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
                    {eventFlyerUrl ? (
                      <>
                        <img
                          src={eventFlyerUrl}
                          alt="Flyer Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEventFlyerUrl('')}
                          className="absolute inset-0 bg-black/75 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[10px] font-bold"
                          title="Remove Flyer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-1 text-zinc-600 flex flex-col items-center">
                        <ImageIcon className="w-6 h-6 mb-1 text-amber-500/40" />
                        <span className="text-[8px] font-mono uppercase">No Flyer</span>
                      </div>
                    )}
                  </div>

                  {/* Device Upload Buttons */}
                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      onClick={() => flyerFileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                    >
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>UPLOAD FLYER FROM DEVICE</span>
                    </button>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                      <span>OR PASTE URL:</span>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={eventFlyerUrl}
                        onChange={(e) => setEventFlyerUrl(e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1 text-zinc-300 placeholder-zinc-700 text-[10px] focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description / Rules */}
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-300 tracking-wide mb-1">
                  Event Details & Guidelines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. BYOB, respect the house, parking behind alleyway, no jerks."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 shrink-0">
              {isAttached && onRemoveEvent ? (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveEvent();
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 text-[10px] font-mono uppercase tracking-wider transition-all"
                >
                  Remove Event Attachment
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-[10px] font-mono uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/40 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" /> Attach DIY Event
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
