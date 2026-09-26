import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Check, 
  AlertTriangle, 
  Music, 
  Radio, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  Calendar, 
  FileText, 
  Sparkles, 
  Video, 
  CheckCircle2, 
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';
import { getSupabase, generateUUID } from '../../../supabase';

export interface SubmitBandToPromoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterProfile: any;
  userProfile: any;
  activeBand?: any;
  triggerNotification?: (msg: string) => void;
  onSuccess?: (submissionData: any) => void;
}

export interface BandSubmissionFormData {
  bandName: string;
  genres: string;
  location: string;
  membersCount: string;
  streamingUrl: string;
  liveVideoUrl: string;
  epkUrl: string;
  socialUrl: string;
  preferredDates: string;
  pitchBio: string;
  pastDraw: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  attachedBandId?: string;
  isBandProfileAttached: boolean;
}

export const SubmitBandToPromoterModal: React.FC<SubmitBandToPromoterModalProps> = ({
  isOpen,
  onClose,
  promoterProfile,
  userProfile,
  activeBand,
  triggerNotification,
  onSuccess
}) => {
  const promoterName = promoterProfile?.corporate_name || promoterProfile?.brand_name || promoterProfile?.name || promoterProfile?.full_name || 'Promoter';
  const promoterAvatar = promoterProfile?.promoter_logo || promoterProfile?.avatar_url || promoterProfile?.avatar || promoterProfile?.logo_url || '';
  const promoterLocation = promoterProfile?.city || promoterProfile?.location || promoterProfile?.region || 'North America';

  // Detect user's available band profile
  const userBandData = React.useMemo(() => {
    if (activeBand && activeBand.name) return activeBand;
    if (userProfile?.bandName || userProfile?.band_name) {
      return {
        id: userProfile?.band_id || userProfile?.registered_band_id || generateUUID(),
        name: userProfile?.bandName || userProfile?.band_name,
        genre: userProfile?.genre || (Array.isArray(userProfile?.genres) ? userProfile.genres.join(', ') : 'Extreme Metal'),
        city: userProfile?.city || userProfile?.location || '',
        bio: userProfile?.band_bio || userProfile?.bio || '',
        avatar_url: userProfile?.band_logo || userProfile?.avatar_url || userProfile?.avatar || '',
        streaming_url: userProfile?.streaming_url || userProfile?.top_song_url || '',
        featured_youtube_url: userProfile?.featured_youtube_url || userProfile?.top_song_url || ''
      };
    }
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('nexus_my_band_profile') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.band_name || parsed?.name) {
          return {
            id: parsed.id || generateUUID(),
            name: parsed.band_name || parsed.name,
            genre: parsed.genre || (Array.isArray(parsed.genre_tags) ? parsed.genre_tags.join(', ') : 'Death Metal / Grindcore'),
            city: parsed.city || '',
            bio: parsed.bio || '',
            avatar_url: parsed.logo_url || parsed.avatar_url || '',
            streaming_url: parsed.streaming_url || '',
            featured_youtube_url: parsed.featured_youtube_url || ''
          };
        }
      }
    } catch (_) {}
    return null;
  }, [activeBand, userProfile]);

  const [formData, setFormData] = useState<BandSubmissionFormData>({
    bandName: '',
    genres: '',
    location: '',
    membersCount: '4',
    streamingUrl: '',
    liveVideoUrl: '',
    epkUrl: '',
    socialUrl: '',
    preferredDates: 'Flexible / Any upcoming open bill or support slot',
    pitchBio: '',
    pastDraw: '',
    contactName: userProfile?.full_name || userProfile?.name || '',
    contactEmail: userProfile?.email || '',
    contactPhone: userProfile?.phone || '',
    attachedBandId: undefined,
    isBandProfileAttached: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');

  // Auto-attach if band data exists
  const handleAttachBandProfile = () => {
    if (!userBandData) return;
    setFormData(prev => ({
      ...prev,
      bandName: userBandData.band_name || userBandData.name || prev.bandName,
      genres: userBandData.genre || (Array.isArray(userBandData.genre_tags) ? userBandData.genre_tags.join(', ') : prev.genres),
      location: userBandData.city || userBandData.location || prev.location,
      pitchBio: userBandData.bio || prev.pitchBio,
      streamingUrl: userBandData.streaming_url || userBandData.top_song_url || prev.streamingUrl,
      liveVideoUrl: userBandData.featured_youtube_url || prev.liveVideoUrl,
      attachedBandId: userBandData.id,
      isBandProfileAttached: true
    }));
    triggerNotification?.(`⚡ Attached active band profile: ${userBandData.band_name || userBandData.name}`);
  };

  const handleDetachBandProfile = () => {
    setFormData(prev => ({
      ...prev,
      isBandProfileAttached: false,
      attachedBandId: undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bandName.trim()) {
      triggerNotification?.("⚠️ Please enter your band name.");
      return;
    }
    if (!formData.contactEmail.trim()) {
      triggerNotification?.("⚠️ Please enter a contact email.");
      return;
    }

    setIsSubmitting(true);
    const newSubmissionId = `GIG-SUB-${Date.now().toString().slice(-6)}`;
    setSubmissionId(newSubmissionId);

    const submissionPayload = {
      id: newSubmissionId,
      promoterId: promoterProfile?.id || 'promoter-general',
      promoterName: promoterName,
      bandName: formData.bandName.trim(),
      genres: formData.genres.trim(),
      location: formData.location.trim(),
      membersCount: formData.membersCount,
      streamingUrl: formData.streamingUrl.trim(),
      liveVideoUrl: formData.liveVideoUrl.trim(),
      epkUrl: formData.epkUrl.trim(),
      socialUrl: formData.socialUrl.trim(),
      preferredDates: formData.preferredDates.trim(),
      pitchBio: formData.pitchBio.trim(),
      pastDraw: formData.pastDraw.trim(),
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      attachedBandId: formData.attachedBandId,
      isBandProfileAttached: formData.isBandProfileAttached,
      submittedByUserId: userProfile?.id || 'anonymous',
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    // 1. Cache to localStorage
    try {
      const existingStr = localStorage.getItem('nexus_promoter_gig_submissions');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem('nexus_promoter_gig_submissions', JSON.stringify([submissionPayload, ...existing]));
    } catch (err) {
      console.warn("Error saving gig submission to localStorage:", err);
    }

    // 2. Sync to Supabase if available
    try {
      const supabase = getSupabase();
      if (supabase && userProfile?.id) {
        await supabase.from('epk_submissions').insert([{
          target_label: promoterName,
          band_name: formData.bandName.trim(),
          bio: formData.pitchBio.trim() || `${formData.genres} from ${formData.location}`,
          history: `Show Application: ${formData.preferredDates}. Draw: ${formData.pastDraw || 'N/A'}`,
          members: `Contact: ${formData.contactName} (${formData.contactEmail} / ${formData.contactPhone})`,
          profile_link: formData.epkUrl || formData.streamingUrl || formData.liveVideoUrl || '',
          status: 'pending'
        }]);
      }
    } catch (_) {}

    setIsSubmitting(false);
    setIsSubmitted(true);
    triggerNotification?.(`🎸 Submission delivered to ${promoterName}!`);
    if (onSuccess) onSuccess(submissionPayload);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[10000000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={handleResetAndClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-950 border border-yellow-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-[0_0_60px_rgba(234,179,8,0.18)] no-scrollbar relative"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-900 bg-zinc-950/80 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-yellow-950/60 border border-yellow-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.25)]">
                {promoterAvatar ? (
                  <img src={promoterAvatar} alt={promoterName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Flame className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    Promoter Gig Application
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-mono truncate mt-0.5">
                  Submit Band to <span className="text-yellow-400">{promoterName}</span>
                </h2>
                <p className="text-[10.5px] text-zinc-400 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-500" /> {promoterLocation}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-5">
            {isSubmitted ? (
              /* Success Screen */
              <div className="py-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-yellow-950/60 border border-yellow-400 flex items-center justify-center text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.35)] animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-400 font-bold">
                    TRANSMISSION LOGGED • REF: {submissionId}
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-wide font-mono">
                    Band Application Dispatched!
                  </h3>
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                    Your band profile and show pitch have been securely queued in <strong className="text-yellow-400">{promoterName}</strong>'s booking portal.
                  </p>
                </div>

                {/* Mandatory Disclaimer Box */}
                <div className="w-full max-w-md bg-yellow-950/30 border border-yellow-800/60 rounded-xl p-3 text-left">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-200/90 font-mono leading-snug">
                      <strong>Disclaimer:</strong> All submissions will be reviewed but not guaranteed to result in an offer. Promoters will contact you via your provided email if a matching slot opens up.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-3 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider font-mono text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* REQUIRED DISCLAIMER BANNER */}
                <div className="bg-yellow-950/30 border border-yellow-700/50 rounded-xl p-3.5 shadow-sm flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] font-mono leading-snug">
                    <span className="text-yellow-300 font-bold uppercase tracking-wider block mb-0.5">
                      Booking Disclaimer
                    </span>
                    <p className="text-yellow-100/90 font-medium">
                      All submissions will be reviewed but not guaranteed to result in an offer.
                    </p>
                  </div>
                </div>

                {/* ATTACH ACTIVE BAND PROFILE SHORTCUT */}
                {userBandData && (
                  <div className="bg-zinc-900/60 border border-zinc-800 hover:border-yellow-500/40 transition-colors rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {userBandData.avatar_url ? (
                          <img src={userBandData.avatar_url} alt={userBandData.name} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Active Band Profile Detected</div>
                        <div className="text-xs font-bold text-white font-mono">{userBandData.name || userBandData.band_name}</div>
                      </div>
                    </div>

                    {formData.isBandProfileAttached ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-yellow-400 font-mono font-bold bg-yellow-950/60 border border-yellow-500/40 px-2 py-1 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Attached
                        </span>
                        <button
                          type="button"
                          onClick={handleDetachBandProfile}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 underline font-mono cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAttachBandProfile}
                        className="px-3 py-1.5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 hover:text-yellow-200 text-[10.5px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Attach Band Profile
                      </button>
                    )}
                  </div>
                )}

                {/* SECTION 1: CORE BAND IDENTITY */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                    <Music className="w-3.5 h-3.5 text-yellow-400" /> 1. Band Details & Identity
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        🎸 Band / Artist Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.bandName}
                        onChange={(e) => setFormData(prev => ({ ...prev, bandName: e.target.value }))}
                        placeholder="e.g. Virulent Excision"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        🏷️ Subgenres / Style *
                      </label>
                      <input
                        type="text"
                        value={formData.genres}
                        onChange={(e) => setFormData(prev => ({ ...prev, genres: e.target.value }))}
                        placeholder="e.g. Slam / Brutal Death Metal, Grindcore"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        📍 Hometown (City, State / Country)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g. Chicago, IL, USA"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        👥 Band Members / Lineup Count
                      </label>
                      <input
                        type="text"
                        value={formData.membersCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, membersCount: e.target.value }))}
                        placeholder="e.g. 4-piece (2 Guitars, Bass, Drums, Vocals)"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: AUDIO & VIDEO TRANSMISSIONS */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                    <Radio className="w-3.5 h-3.5 text-yellow-400" /> 2. Audio & Live Video Links
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        🎵 Streaming Link (Bandcamp / Spotify / SoundCloud)
                      </label>
                      <input
                        type="text"
                        value={formData.streamingUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, streamingUrl: e.target.value }))}
                        placeholder="https://bandcamp.com/... or Spotify link"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        🎥 Live Footage / Set Video (YouTube URL)
                      </label>
                      <input
                        type="text"
                        value={formData.liveVideoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, liveVideoUrl: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=... (live set)"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        📄 EPK Deck / Electronic Press Kit / Website Link
                      </label>
                      <input
                        type="text"
                        value={formData.epkUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, epkUrl: e.target.value }))}
                        placeholder="https://yourband.com/epk or press dropbox"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        🌐 Instagram / Facebook / Social Handle
                      </label>
                      <input
                        type="text"
                        value={formData.socialUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, socialUrl: e.target.value }))}
                        placeholder="https://instagram.com/yourband"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: SHOW PITCH & AVAILABILITY */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-yellow-400" /> 3. Target Dates, Draw & Bio Pitch
                  </h4>

                  <div>
                    <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                      🗓️ Preferred Dates / Tour Routing Window
                    </label>
                    <input
                      type="text"
                      value={formData.preferredDates}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredDates: e.target.value }))}
                      placeholder="e.g. Any weekend in September 2026, or passing through on tour Oct 12-16"
                      className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        🔥 Notable Past Shows & Typical Crowd Draw
                      </label>
                      <input
                        type="text"
                        value={formData.pastDraw}
                        onChange={(e) => setFormData(prev => ({ ...prev, pastDraw: e.target.value }))}
                        placeholder="e.g. Opened for Devourment, typical draw 75-120 heads"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        📝 Brief Band Bio & Pitch to Promoter
                      </label>
                      <textarea
                        rows={2}
                        value={formData.pitchBio}
                        onChange={(e) => setFormData(prev => ({ ...prev, pitchBio: e.target.value }))}
                        placeholder="Tell the promoter why your band is a great fit for their bills or festival..."
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: CONTACT & DISPATCH */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
                    <Mail className="w-3.5 h-3.5 text-yellow-400" /> 4. Contact Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="booking@yourband.com"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                        Phone / Discord (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-yellow-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-900 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black uppercase tracking-wider font-mono text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Band To Promoter
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubmitBandToPromoterModal;
