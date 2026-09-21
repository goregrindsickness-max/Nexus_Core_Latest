import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, Camera, Users, Star, CheckSquare, Settings, DollarSign, Pin, X, Plus, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, CheckCircle2, BadgeCheck, Disc, Trash2, Edit2, FileText, Sparkles } from 'lucide-react';
import { V2ExpandableCard } from './V2ExpandableCard';
import SettingsView from './SettingsView';
import HelpDeskView from './HelpDeskView';
import TermsOfServiceView from './TermsOfServiceView';
import { fetchReleasesFromDatabase, upsertReleaseToDatabase, deleteReleaseFromDatabase } from '../services/releasesService';
const concertBg = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20concert%202.png";
import { profileStore } from '../utils/indexedDB';
import { getSupabase, executeWithSchemaResilience, uploadBase64ToStorage, uploadCommunityBandMedia, sanitizeBandPayload, sanitizeMicroGenres, parseLocationFields, upsertBandToDatabase, ensureUUID } from '../supabase';

const GENRE_CLUSTERS = [
  {
    name: 'EXTREME METAL',
    genres: ['DEATH METAL', 'SLAMMING BDM', 'BRUTAL DEATH METAL', 'BRUTAL DEATHCORE', 'TECHNICAL BDM', 'DEATH N\' ROLL', 'TECH DEATH', 'BLASTING BDM', 'GRINDCORE', 'DEATHGRIND', 'GOREGRIND/PORNOGRIND', 'THRASH METAL', 'DEATH THRASH', 'MELODIC DEATH', 'OSDM', 'DOOM', 'BLACK METAL', 'BLACKENED DEATH', 'SYMPHONIC BLACK', 'DEATHCORE', 'PROGRESSIVE DEATH']
  },
  {
    name: 'ROCK/HEAVY METAL',
    genres: ['TRADITIONAL HEAVY METAL', 'DOOM METAL', 'STONER METAL', 'SLUDGE METAL', 'STONER ROCK', 'PROG METAL', 'POWER METAL', 'ALTERNATIVE ROCK', 'GOTHIC ROCK', 'HARD ROCK', 'NEW WAVE', 'FOLK METAL', 'AVANT-GARDE', 'DJENT', 'MATHCORE', 'MATH ROCK', 'SHOE GAZE', 'NOISE ROCK', 'INDIE ROCK', 'NU METAL']
  },
  {
    name: 'HARDCORE',
    genres: ['TRADITIONAL HARDCORE', 'METALCORE', 'BEATDOWN', 'YOUTH CREW', 'FASTCORE', 'POST HARDCORE', 'MELODIC HARDCORE', 'SKRAMZ/SCREAMO', 'POWER VIOLENCE', 'MINCECORE']
  },
  {
    name: 'PUNK/ALTERNATIVE',
    genres: ['PUNK ROCK', 'POP PUNK', 'MATH ROCK', 'MIDWEST EMO', 'SKATE PUNK', 'MELODIC PUNK', 'INDIE PUNK', 'POST PUNK', 'GRUNGE']
  },
  {
    name: 'INDUSTRIAL/EDM',
    genres: ['EBM', 'SYNTHWAVE', 'DARKWAVE/COLD WAVE', 'AGGROTECH/TERROR EBM', 'TECHNO', 'INDUSTRIAL METAL', 'DUBSTEP', 'DRUM & BASS', 'GABBER/HARDSTYLE', 'BREAKCORE', 'HARSH NOISE WALL', 'WITCH HOUSE']
  },
  {
    name: 'HIP HOP/RAP',
    genres: ['UNDERGROUND RAP', 'TRAP', 'BOOM BAP', 'PHONK', 'DRILL', 'CLOUD RAP', 'EXPERIMENTAL', 'GRIME']
  }
];

export default function SettingsWorkspace(props: any) {
  const {
    bandCoverUrl, activeBand, setEditingBand, setIsBandModalOpen, bandLogoUrl, 
    setLogoUploaderDragActive, handleBandInfoLogoUpload, logoUploaderDragActive,
    bandInfoLogoFileInputRef, setCoverUploaderDragActive, handleBandInfoCoverUpload,
    coverUploaderDragActive, bandInfoCoverFileInputRef, bandInfoName, setBandInfoName,
    selectedMicroGenres, bandInfoHomebase, setBandInfoHomebase,
    bandInfoFoundedYear, setBandInfoFoundedYear,
    bandInfoBio, setBandInfoBio,
    bandInfoCustomSlug, setBandInfoCustomSlug,
    bandInfoBookingEmail, setBandInfoBookingEmail,
    bandInfoBookingPhone, setBandInfoBookingPhone,
    bandInfoYoutubeVideo, setBandInfoYoutubeVideo,
    bandInfoStreamingUrl, setBandInfoStreamingUrl,
    bandInfoTechRider, setBandInfoTechRider,
    bandInfoTourVehicle, setBandInfoTourVehicle,
    bandInfoMetalArchivesUrl, setBandInfoMetalArchivesUrl,
    bandLineup, setBandLineup, crewMembers, setCrewMembers,
    triggerNotification, userReviews, setReviewLeft, setReviewText, reviewScore,
    setReviewScore, reviewText, reviewerName, setReviewerName, reviewerGroup,
    setReviewerGroup, userProfile, setUserProfile, shows, setShows,
    inventory, setInventory, sales, setSales, venues, setVenues, addLog, logs,
    handleDataSubmit, handleRestock, dbStatus, supabaseUrl, supabaseKey
  } = props;

  const rawMicroGenres = selectedMicroGenres ?? props.activeBand?.micro_genres;
  const safeSelectedMicroGenres: string[] = Array.isArray(rawMicroGenres)
    ? rawMicroGenres
    : (typeof rawMicroGenres === 'string' && rawMicroGenres
        ? (rawMicroGenres as string).split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean)
        : []);

  const [activeClusterIdx, setActiveClusterIdx] = React.useState(0);
  const [isLineupCollapsed, setIsLineupCollapsed] = React.useState(true);
  const [isVerifiedState, setIsVerifiedState] = React.useState<boolean>(
    () => props.activeBand?.is_verified ?? false
  );
  const [verificationPlatformInput, setVerificationPlatformInput] = React.useState<string>(
    () => props.activeBand?.verification_platform || 'Spotify Official Artist'
  );
  const [verificationUrlInput, setVerificationUrlInput] = React.useState<string>('');

  // Discography & Releases Manager state variables
  const [releasesList, setReleasesList] = useState<any[]>([]);
  const [isReleasesLoading, setIsReleasesLoading] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any | null>(null);
  const [releaseCoverDragActive, setReleaseCoverDragActive] = useState(false);

  const loadReleasesData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !props.activeBand?.id) return;
    setIsReleasesLoading(true);
    try {
      const rawBandId = String(props.activeBand.id).trim();
      const bandUUID = ensureUUID(rawBandId);
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .or(`band_id.eq.${rawBandId},band_id.eq.${bandUUID}`);
      if (data && !error) {
        setReleasesList(data.map((row: any) => ({
          id: row.id,
          catalogId: row.catalog_id || row.catalogId || '',
          title: row.title || '',
          coverColor: row.cover_color || '',
          type: row.type || 'Album',
          year: row.release_date ? new Date(row.release_date).getFullYear().toString() : (row.release_year || '2026'),
          releaseDate: row.release_date || '',
          label: row.label || '',
          genre: row.genre || '',
          coverImage: row.cover_image || row.cover_url || '',
          coverUrl: row.cover_url || row.cover_image || '',
          image_url: row.cover_url || row.cover_image || '',
          tracks: Array.isArray(row.tracks) ? row.tracks : (typeof row.tracks === 'string' ? JSON.parse(row.tracks) : []),
          formats: typeof row.formats === 'object' && row.formats ? row.formats : (typeof row.formats === 'string' ? JSON.parse(row.formats) : {}),
          digital: Array.isArray(row.digital) ? row.digital : (typeof row.digital === 'string' ? JSON.parse(row.digital) : []),
          status: row.status || 'active'
        })));
      }
    } catch (e) {
      console.warn('[loadReleasesData error]:', e);
    } finally {
      setIsReleasesLoading(false);
    }
  }, [props.activeBand?.id]);

  useEffect(() => {
    loadReleasesData();
  }, [loadReleasesData]);

  React.useEffect(() => {
    if (props.activeBand) {
      setIsVerifiedState(props.activeBand.is_verified ?? false);
      setVerificationPlatformInput(props.activeBand.verification_platform || 'Spotify Official Artist');
    }
  }, [props.activeBand]);


  const handleMicroGenreSelect = (genre: string) => {
    if (props.setSelectedMicroGenres) {
      props.setSelectedMicroGenres((prev: any) => {
        const safePrev: string[] = Array.isArray(prev)
          ? prev
          : (typeof prev === 'string' && prev ? prev.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean) : []);
        if (safePrev.includes(genre)) {
          return safePrev.filter(g => g !== genre);
        }
        if (safePrev.length >= 3) {
          if (props.triggerNotification) props.triggerNotification('⚠️ Maximum 3 micro-genres allowed per band.');
          return safePrev;
        }
        return [...safePrev, genre];
      });
    }
  };

  const handleBandInfoSubmit = async () => {
    if (!props.activeBand) return;
    const bandNameVal = props.bandInfoName || props.activeBand.name || props.activeBand.band_name || 'Artist';

    let logoUrl = props.bandLogoUrl || props.activeBand.logo_url || '';
    let coverUrl = props.bandCoverUrl || props.activeBand.cover_url || '';

    if (logoUrl.startsWith('data:')) {
      try {
        const userOrBandId = props.activeBand.id || props.activeBand.creator_id || 'band';
        const publicUrl = await uploadCommunityBandMedia(logoUrl, userOrBandId, 'logo');
        if (publicUrl && !publicUrl.startsWith('data:')) {
          logoUrl = publicUrl;
        }
      } catch (e) {
        console.warn('Failed to upload base64 logo:', e);
      }
    }

    if (coverUrl.startsWith('data:')) {
      try {
        const userOrBandId = props.activeBand.id || props.activeBand.creator_id || 'band';
        const publicUrl = await uploadCommunityBandMedia(coverUrl, userOrBandId, 'cover');
        if (publicUrl && !publicUrl.startsWith('data:')) {
          coverUrl = publicUrl;
        }
      } catch (e) {
        console.warn('Failed to upload base64 cover:', e);
      }
    }

    const rawLocInput = props.bandInfoHomebase ?? props.activeBand.homebase ?? '';
    const parsedLoc = parseLocationFields(rawLocInput);
    const cleanMicros = sanitizeMicroGenres(safeSelectedMicroGenres.length > 0 ? safeSelectedMicroGenres : (props.activeBand.micro_genres || []));

    const updated = {
      ...props.activeBand,
      name: bandNameVal,
      band_name: bandNameVal,
      city: parsedLoc.city || props.activeBand.city || '',
      state_province: parsedLoc.state_province || props.activeBand.state_province || '',
      country: parsedLoc.country || props.activeBand.country || '',
      homebase: [parsedLoc.city || props.activeBand.city, parsedLoc.state_province || props.activeBand.state_province, parsedLoc.country || props.activeBand.country].filter(Boolean).join(', '),
      founded_year: props.bandInfoFoundedYear ?? props.activeBand.founded_year ?? '',
      bio: props.bandInfoBio ?? props.activeBand.bio ?? '',
      custom_slug: props.bandInfoCustomSlug ?? props.activeBand.custom_slug ?? '',
      booking_email: props.bandInfoBookingEmail ?? props.activeBand.booking_email ?? '',
      booking_phone: props.bandInfoBookingPhone ?? props.activeBand.booking_phone ?? '',
      featured_youtube_url: props.bandInfoYoutubeVideo ?? props.activeBand.featured_youtube_url ?? '',
      streaming_url: props.bandInfoStreamingUrl ?? props.activeBand.streaming_url ?? '',
      tech_rider_url: props.bandInfoTechRider ?? props.activeBand.tech_rider_url ?? '',
      tour_vehicle: props.bandInfoTourVehicle ?? props.activeBand.tour_vehicle ?? '',
      metal_archives_url: props.bandInfoMetalArchivesUrl ?? props.activeBand.metal_archives_url ?? '',
      micro_genres: cleanMicros,
      cover_url: coverUrl,
      logo_url: logoUrl,
      is_verified: isVerifiedState,
      verification_platform: verificationPlatformInput || (isVerifiedState ? 'Spotify Official Artist' : null),
      lineup: (Array.isArray(props.bandLineup) ? props.bandLineup : [])
        .map((m: any) => `${m.name || 'Unnamed'} (${m.role || 'Vocals'} - Lvl ${m.clearanceLevel || 5})`)
        .join(', ')
    };

    if (props.setBands) {
      props.setBands((prev: any[]) => prev.map(b => b.id === props.activeBand.id ? updated : b));
    }

    try {
      await upsertBandToDatabase(updated, { triggerNotification: props.triggerNotification });
    } catch (err) {
      console.warn("Error syncing band info to Supabase:", err);
    }

    if (props.triggerNotification) props.triggerNotification('✨ Band profile saved & synced successfully!');
  };

  const handleReviewSubmit = () => {
    const finalComment = props.reviewText.trim() || "Full-featured tour manager. Love the offline sync and live operations tracking!";
    const newReviewObj = {
      id: Date.now().toString(),
      text: finalComment,
      rating: props.reviewScore,
      name: props.reviewerName || "Verified Crew",
      group: props.reviewerGroup || props.activeBand?.name || "Independent Artist",
      created_at: new Date().toISOString(),
      is_synced: false
    };
    const updatedReviews = [newReviewObj, ...(props.userReviews || [])];
    if (props.setUserReviews) props.setUserReviews(updatedReviews);
    localStorage.setItem('nexus_core_user_reviews', JSON.stringify(updatedReviews));
    if (props.setReviewLeft) props.setReviewLeft(true);
    if (props.triggerNotification) props.triggerNotification('Review cached securely. Awaiting sync.');
  };

  return (
    <div className="flex flex-col gap-0 text-left pt-6 sm:pt-8">
      {/* REDESIGNED TALL BAND PROFILE CARD WITH NEON GREEN CHASE BORDER */}
      <div className="neon-green-chase-border mb-5 shadow-xl shadow-emerald-950/10 mx-auto max-w-[92%] w-full rounded-[1.25rem]">
        <div className="neon-green-chase-content relative overflow-hidden flex flex-col p-3.5 sm:p-4 min-h-[340px] md:min-h-[325px]">
          
          {/* Cover Image in Top Half with bottom gradient fade */}
          <div className="absolute top-0 left-0 right-0 h-[44%] overflow-hidden pointer-events-none z-0">
            <img 
               src={bandCoverUrl || concertBg || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200"} 
               alt="Band Cover Banner" 
               className="w-full h-full object-cover opacity-45"
               referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/70 to-[#090b0e]" />
          </div>

          {/* Interactive Edit Cover Button & Roster Controller */}
          <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
            <span className="text-[7.5px] font-mono text-emerald-400/90 border border-emerald-950 bg-black/75 px-1.5 py-0.5 rounded animate-pulse">
              NEXUS PRO
            </span>
          </div>

          {/* Content Area */}
          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left mt-4 w-full flex-grow">
            
            {/* Profile Avatar overlapping */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              <div 
                 className="relative group shrink-0 cursor-pointer"
                 title="Click to edit artist details"
                onClick={() => {
                  setEditingBand(activeBand);
                  setIsBandModalOpen(true);
                }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-lime-400 to-teal-450 rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300" />
                <div className="relative w-18 h-18 sm:w-23 sm:h-23 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/85 flex items-center justify-center shadow-lg group-hover:border-emerald-400 transition-colors">
                  <img 
                     src={bandLogoUrl || activeBand?.logo_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=120"} 
                     alt="Artist Profile" 
                     className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                     referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Camera className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Band Info */}
              <div className="mt-3 md:mt-0 flex-grow pt-2 md:pt-4">
                <div className="flex flex-col items-center md:items-start">
                   <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mb-1 group-hover:text-emerald-400 transition-colors">{activeBand?.name || 'Unknown Artist'}</h2>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-2">
                     <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-800">
                       {activeBand
                         ? (Array.isArray(activeBand.micro_genres) && activeBand.micro_genres.length > 0
                             ? activeBand.micro_genres.slice(0, 3).join(' • ')
                             : Array.isArray(activeBand.genre_tags) && activeBand.genre_tags.length > 0
                             ? activeBand.genre_tags.slice(0, 3).join(' • ')
                             : activeBand.genre || 'N/A')
                         : 'N/A'}
                     </span>
                     <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-800">{activeBand?.homebase || 'N/A'}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Micro Stats or Lineup string at bottom */}
            <div className="mt-auto pt-4 w-full flex flex-col items-center justify-center gap-3 border-t border-zinc-900/50">
               <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                 {Array.isArray(bandLineup) && bandLineup.length > 0 ? (
                   bandLineup.map((member: any, idx: number) => (
                     <div key={member.id ? `roster-mem-${member.id}-${idx}` : `roster-mem-${member.name || idx}-${idx}`} className="flex items-center gap-1.5 bg-zinc-950/70 border border-zinc-800 px-2 py-0.5 rounded-md text-[9px]">
                       <span className="font-bold text-zinc-100">{member?.name || 'Unnamed'}</span>
                       <span className="text-zinc-500 font-mono font-medium">{member.role || 'Vocals'}</span>
                       <span className="text-[#00ffcc] font-mono font-black bg-[#00ffcc]/10 border border-[#00ffcc]/20 rounded px-1 text-[8px]">
                         LVL {member.clearanceLevel || 5}
                       </span>
                     </div>
                   ))
                 ) : (
                   <span className="text-[10px] text-zinc-500 font-sans">{activeBand?.lineup || "No lineup defined."}</span>
                 )}
               </div>
               <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold text-emerald-500 shrink-0">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  ACTIVE ROSTER
               </div>
            </div>
          </div>
        </div>
      </div>

      <V2ExpandableCard title="System Preferences" defaultExpanded={false}>
            <SettingsView
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              shows={shows}
              setShows={setShows}
              inventory={inventory}
              setInventory={setInventory}
              sales={sales}
              setSales={setSales}
              venues={venues}
              setVenues={setVenues}
              onBack={() => {}}
              triggerNotification={triggerNotification}
              addLog={addLog}
              activeBandName={activeBand?.name || 'Artist'}
              logs={logs}
              onSubmitSale={handleDataSubmit}
              handleRestock={handleRestock}
              dbStatus={dbStatus === 'unconfigured' ? 'idle' : dbStatus}
              supabaseUrl={supabaseUrl || ''}
              supabaseKey={supabaseKey || ''}
              bands={props.bands || []}
              setBands={props.setBands || (() => {})}
              activeBand={props.activeBand}
              setActiveBandId={props.setActiveBandId || (() => {})}
              setIsBandModalOpen={props.setIsBandModalOpen || (() => {})}
            />
      </V2ExpandableCard>

      <V2ExpandableCard title="Band Information" defaultExpanded={false}>
        <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5 space-y-6">
          <div className="space-y-6 text-left">
            {/* Image Uploaders Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Logo / Avatar Uploader */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-[#00ffcc] tracking-widest block font-bold">Profile Avatar / Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-[#00ffcc]/30 bg-zinc-950 shrink-0 shadow-md">
                    <img 
                       src={bandLogoUrl || activeBand?.logo_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=120"} 
                       alt="Avatar Preview" 
                       className="w-full h-full object-cover"
                       referrerPolicy="no-referrer"
                    />
                  </div>
                  <div 
                     onDragEnter={(e) => { e.preventDefault(); setLogoUploaderDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setLogoUploaderDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setLogoUploaderDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setLogoUploaderDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleBandInfoLogoUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => bandInfoLogoFileInputRef.current?.click()}
                    className={`flex-grow cursor-pointer border-2 border-dashed rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[90px] ${
                      logoUploaderDragActive ? "border-[#00ffcc] bg-[#142320]/60" : "border-zinc-800 hover:border-zinc-750 bg-[#12151d]"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-[9px] text-zinc-300 font-mono font-bold">Upload Custom Avatar</span>
                    <span className="text-[7.5px] text-zinc-500 font-mono uppercase">Drag & Drop or Click</span>
                    <input 
                       type="file"
                       accept="image/*"
                       ref={bandInfoLogoFileInputRef}
                       onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                           handleBandInfoLogoUpload(e.target.files[0]);
                         }
                       }}
                       className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Banner Uploader */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-[#00ffcc] tracking-widest block font-bold">Cover Banner</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl overflow-hidden border border-[#00ffcc]/30 bg-zinc-950 shrink-0 shadow-md">
                    <img 
                       src={bandCoverUrl || activeBand?.cover_url || concertBg || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400"} 
                       alt="Cover Preview" 
                       className="w-full h-full object-cover"
                       referrerPolicy="no-referrer"
                    />
                  </div>
                  <div 
                     onDragEnter={(e) => { e.preventDefault(); setCoverUploaderDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setCoverUploaderDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setCoverUploaderDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setCoverUploaderDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleBandInfoCoverUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => bandInfoCoverFileInputRef.current?.click()}
                    className={`flex-grow cursor-pointer border-2 border-dashed rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[90px] ${
                      coverUploaderDragActive ? "border-[#00ffcc] bg-[#142320]/60" : "border-zinc-800 hover:border-zinc-750 bg-[#12151d]"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-[9px] text-zinc-300 font-mono font-bold">Upload Custom Banner</span>
                    <span className="text-[7.5px] text-zinc-500 font-mono uppercase">Drag & Drop or Click</span>
                    <input 
                       type="file"
                       accept="image/*"
                       ref={bandInfoCoverFileInputRef}
                       onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                           handleBandInfoCoverUpload(e.target.files[0]);
                         }
                       }}
                       className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Band / Artist Name</label>
                <input 
                  type="text" 
                  value={bandInfoName}
                  onChange={(e) => setBandInfoName(e.target.value)}
                  placeholder="e.g. The Midnight Echo" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Homebase / Location</label>
                <input 
                  type="text" 
                  value={bandInfoHomebase}
                  onChange={(e) => setBandInfoHomebase(e.target.value)}
                  placeholder="e.g. Austin, TX" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Founded Year</label>
                <input 
                  type="text" 
                  value={bandInfoFoundedYear}
                  onChange={(e) => setBandInfoFoundedYear(e.target.value)}
                  placeholder="e.g. 2018" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Custom URL Slug</label>
                <input 
                  type="text" 
                  value={bandInfoCustomSlug}
                  onChange={(e) => setBandInfoCustomSlug && setBandInfoCustomSlug(e.target.value)}
                  placeholder="e.g. midnight-echo" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Artist Bio / Description</label>
              <textarea 
                value={bandInfoBio}
                onChange={(e) => setBandInfoBio && setBandInfoBio(e.target.value)}
                placeholder="Artist biography or summary..." 
                className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Booking Representative Email</label>
                <input 
                  type="email" 
                  value={bandInfoBookingEmail}
                  onChange={(e) => setBandInfoBookingEmail && setBandInfoBookingEmail(e.target.value)}
                  placeholder="booking@artist.com" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Booking Representative Phone</label>
                <input 
                  type="tel" 
                  value={bandInfoBookingPhone}
                  onChange={(e) => setBandInfoBookingPhone && setBandInfoBookingPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Featured YouTube Link</label>
                <input 
                  type="url" 
                  value={bandInfoYoutubeVideo}
                  onChange={(e) => setBandInfoYoutubeVideo && setBandInfoYoutubeVideo(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Audio Hub / Bandcamp Link</label>
                <input 
                  type="url" 
                  value={bandInfoStreamingUrl}
                  onChange={(e) => setBandInfoStreamingUrl && setBandInfoStreamingUrl(e.target.value)}
                  placeholder="https://spotify.com/..." 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Metal-Archives.com URL</label>
                <input 
                  type="url" 
                  value={bandInfoMetalArchivesUrl}
                  onChange={(e) => setBandInfoMetalArchivesUrl && setBandInfoMetalArchivesUrl(e.target.value)}
                  placeholder="https://www.metal-archives.com/bands/..." 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Technical Rider Link</label>
                <input 
                  type="text" 
                  value={bandInfoTechRider}
                  onChange={(e) => setBandInfoTechRider && setBandInfoTechRider(e.target.value)}
                  placeholder="https://drive.google.com/..." 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Touring Rig / Vehicle</label>
                <input 
                  type="text" 
                  value={bandInfoTourVehicle}
                  onChange={(e) => setBandInfoTourVehicle && setBandInfoTourVehicle(e.target.value)}
                  placeholder="e.g. 15-Passenger Van + Trailer" 
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Advanced Genre Matrix Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Primary Micro-Genres (Max 3)</label>
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4.5 space-y-3">
                <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                  {GENRE_CLUSTERS.map((cluster, idx) => (
                    <button
                      key={`${cluster.name}-${idx}`}
                      type="button"
                      onClick={() => setActiveClusterIdx(idx)}
                      className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase rounded-lg border shrink-0 transition-all ${
                        activeClusterIdx === idx
                          ? 'bg-[#00ffcc]/15 text-[#00ffcc] border-[#00ffcc]/40 shadow-[0_0_10px_rgba(0,255,204,0.1)]'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {cluster.name}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-950/80 rounded-xl border border-zinc-850 min-h-[105px]">
                  {GENRE_CLUSTERS[activeClusterIdx].genres.map((genre, gIdx) => {
                    const isSelected = safeSelectedMicroGenres.includes(genre);
                    return (
                      <button
                        key={`settings-genre-cluster-${activeClusterIdx}-${gIdx}-${genre}`}
                        type="button"
                        onClick={() => handleMicroGenreSelect(genre)}
                        className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all ${
                          isSelected
                            ? "bg-[#00ffcc]/15 text-[#00ffcc] border-[#00ffcc]/35 shadow-sm"
                            : "bg-zinc-900/60 text-zinc-400 border-zinc-800/70 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-750"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[8.5px] font-mono px-1">
                  <div className="text-zinc-400 truncate flex-grow text-left">
                    <span className="text-zinc-500 uppercase tracking-wider mr-1.5">SELECTED MICRO-GENRES (MAX 3):</span>
                    {safeSelectedMicroGenres.length > 0 ? (
                      <span className="text-[#00ffcc] font-bold">{safeSelectedMicroGenres.join(' / ')}</span>
                    ) : (
                      <span className="text-zinc-600 italic">None selected (use matrix above)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {safeSelectedMicroGenres.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (props.setSelectedMicroGenres) {
                            props.setSelectedMicroGenres([]);
                            triggerNotification?.("🧹 Cleared all selected micro-genres.");
                          }
                        }}
                        className="px-2 py-0.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded font-bold uppercase text-[8px] tracking-wider transition-all cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                    <span className="text-zinc-500 text-right uppercase font-bold tracking-widest">
                      ({safeSelectedMicroGenres.length}/3 Limit)
                    </span>
                  </div>
                </div>
              </div>
            </div>            {/* Touring Lineup / Members section */}
            <div className="space-y-3">
              <div 
                className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-900/80 hover:border-[#00ffcc]/20 hover:bg-zinc-950/80 transition-all select-none"
                onClick={() => setIsLineupCollapsed(!isLineupCollapsed)}
              >
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block cursor-pointer">Touring Lineup / Members</label>
                  <span className="text-[9px] text-[#00ffcc]/80 font-mono font-bold bg-[#00ffcc]/10 px-1.5 py-0.5 rounded-md border border-[#00ffcc]/15">
                    {(Array.isArray(bandLineup) ? bandLineup : []).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                    {isLineupCollapsed ? 'Click to Expand' : 'Assign specific roles & names'}
                  </span>
                  {isLineupCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-[#00ffcc]" />}
                </div>
              </div>
              
              {!isLineupCollapsed && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(Array.isArray(bandLineup) ? bandLineup : []).map((member: any, index: number) => {
                      const standardRoles = ['Vocals', 'Guitars', 'Bass', 'Drums', 'Keyboards'];
                      const isCustom = member.role && !standardRoles.includes(member.role);
                      
                      return (
                        <div 
                          key={member.id ? `lineup-mem-${member.id}-${index}` : `lineup-mem-${index}`} 
                          className="bg-zinc-950/70 border border-zinc-900 rounded-xl p-3.5 space-y-3.5 relative group hover:border-[#00ffcc]/20 transition-all shadow-md"
                        >
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedLineup = bandLineup.filter((_: any, i: number) => i !== index);
                              setBandLineup(updatedLineup);
                            }}
                            className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-950/20 transition-all cursor-pointer"
                            title="Remove member"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div className="space-y-2.5 text-left">
                            {/* Member Name */}
                            <div>
                              <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">Member Name</span>
                              <input
                                type="text"
                                value={member?.name || ''}
                                onChange={(e) => {
                                  const updatedLineup = bandLineup.map((m: any, i: number) => 
                                    i === index ? { ...m, name: e.target.value } : m
                                  );
                                  setBandLineup(updatedLineup);
                                }}
                                placeholder="e.g. Alex"
                                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-[#00ffcc]/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none transition-colors font-sans"
                              />
                            </div>

                            {/* Member Role Dropdown */}
                            <div>
                              <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">Role</span>
                              <div className="flex flex-col gap-2">
                                <select
                                  value={isCustom ? 'Custom' : (member.role || 'Vocals')}
                                  onChange={(e) => {
                                    const selectedVal = e.target.value;
                                    const updatedLineup = bandLineup.map((m: any, i: number) => {
                                      if (i === index) {
                                        return { 
                                          ...m, 
                                          role: selectedVal === 'Custom' ? '' : selectedVal 
                                        };
                                      }
                                      return m;
                                    });
                                    setBandLineup(updatedLineup);
                                  }}
                                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                                >
                                  <option value="Vocals">Vocals</option>
                                  <option value="Guitars">Guitars</option>
                                  <option value="Bass">Bass</option>
                                  <option value="Drums">Drums</option>
                                  <option value="Keyboards">Keyboards</option>
                                  <option value="Custom">Custom...</option>
                                </select>

                                {/* If custom is selected or current role is not in standard list, show custom text input */}
                                {(isCustom || !member.role || !standardRoles.includes(member.role)) && (
                                  <input
                                    type="text"
                                    value={member.role || ''}
                                    onChange={(e) => {
                                      const updatedLineup = bandLineup.map((m: any, i: number) => 
                                        i === index ? { ...m, role: e.target.value } : m
                                      );
                                      setBandLineup(updatedLineup);
                                    }}
                                    placeholder="e.g. Synth, Violin, Management"
                                    className="w-full bg-zinc-900 border border-[#00ffcc]/20 focus:border-[#00ffcc]/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-sans"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Member Clearance Level Dropdown */}
                            <div>
                              <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">Security Clearance</span>
                              <select
                                value={member.clearanceLevel || 5}
                                onChange={(e) => {
                                  const updatedLineup = bandLineup.map((m: any, i: number) => 
                                    i === index ? { ...m, clearanceLevel: Number(e.target.value) } : m
                                  );
                                  setBandLineup(updatedLineup);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                              >
                                <option value="1">Lvl 1 - Temp (Read Events/Social)</option>
                                <option value="2">Lvl 2 - Staff (+ POS checkout sales)</option>
                                <option value="3">Lvl 3 - Rep (+ Write Inventory/Social)</option>
                                <option value="4">Lvl 4 - Partner (+ Finance access)</option>
                                <option value="5">Lvl 5 - Owner (Unrestricted access)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Member Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newMember = {
                        id: 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        name: '',
                        role: 'Vocals',
                        clearanceLevel: 5,
                        inviteStatus: 'accepted'
                      };
                      setBandLineup([...(Array.isArray(bandLineup) ? bandLineup : []), newMember]);
                    }}
                    className="mt-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[#00ffcc] hover:text-white rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lineup Member</span>
                  </button>
                </>
              )}
            </div>

            {/* OFFICIAL ARTIST VERIFICATION & CLAIM CARD */}
            <div className="bg-[#0c0f14] border border-zinc-850 rounded-2xl p-4.5 space-y-3.5 my-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isVerifiedState ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                    {isVerifiedState ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      Artist Profile Verification & Official Claim
                    </h4>
                    <p className="text-[9.5px] font-mono text-zinc-400">
                      {isVerifiedState ? 'Verified Official Artist' : 'Currently Listed as Unverified / Fan Managed'}
                    </p>
                  </div>
                </div>
                <div>
                  {isVerifiedState ? (
                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8.5px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8.5px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                      FAN MANAGED
                    </span>
                  )}
                </div>
              </div>

              {!isVerifiedState ? (
                <div className="space-y-3 text-xs">
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                    Unverified profiles carry a <span className="text-amber-400 font-mono font-bold">"FAN MANAGED"</span> status badge. To remove this label and verify official ownership of this band, enter your Spotify Artist link, Apple Music URL, or Bandcamp account below:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                        Verification Platform / Source
                      </label>
                      <select
                        value={verificationPlatformInput}
                        onChange={(e) => setVerificationPlatformInput(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer"
                      >
                        <option value="Spotify Official Artist">Spotify Official Artist URI</option>
                        <option value="Apple Music Artist Link">Apple Music Artist URL</option>
                        <option value="Bandcamp Account">Bandcamp Official Account</option>
                        <option value="Record Label Accreditation">Record Label Accreditation</option>
                        <option value="Official Band Website">Official Band Website / Domain</option>
                        <option value="Direct Management Claim">Direct Official Owner Claim</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                        Verification Link / URI / ISRC
                      </label>
                      <input
                        type="text"
                        value={verificationUrlInput}
                        onChange={(e) => setVerificationUrlInput(e.target.value)}
                        placeholder="e.g. spotify:artist:1x9... or URL"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none placeholder-zinc-600"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifiedState(true);
                      if (props.triggerNotification) {
                        props.triggerNotification(`🛡️ Band profile officially verified via ${verificationPlatformInput}! "FAN MANAGED" tag removed.`);
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Verify & Claim Official Profile</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] font-mono text-zinc-400">
                    <span className="text-zinc-500 uppercase tracking-wider">VERIFIED VIA: </span>
                    <span className="text-emerald-400 font-bold">{verificationPlatformInput}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifiedState(false);
                      if (props.triggerNotification) {
                        props.triggerNotification('⚠️ Verification status reset to Fan Managed.');
                      }
                    }}
                    className="text-[9px] font-mono text-zinc-500 hover:text-rose-400 underline cursor-pointer"
                  >
                    Reset Verification
                  </button>
                </div>
              )}
            </div>
            
            <div className="pt-3">
              <button 
                 type="button"
                 onClick={handleBandInfoSubmit}
                 className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98] cursor-pointer"
              >
                Save Band Profile
              </button>
            </div>
          </div>
        </div>
      </V2ExpandableCard>

      <V2ExpandableCard title="Discography & Releases" defaultExpanded={false}>
        <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5 space-y-6">
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Release Catalog</h3>
                <p className="text-[10.5px] text-zinc-400 font-sans mt-1">
                  Manage the official music catalog of your band. These releases will display live on your public profile.
                </p>
              </div>
              {!editingRelease && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRelease({
                      id: `rel-${Date.now()}`,
                      title: '',
                      type: 'Album',
                      releaseDate: new Date().toISOString().split('T')[0],
                      label: props.activeBand?.label || '',
                      coverUrl: '',
                      coverImage: '',
                      catalogId: '',
                      tracks: []
                    });
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer border-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Release
                </button>
              )}
            </div>

            {/* List View */}
            {!editingRelease ? (
              isReleasesLoading ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-[10px] text-zinc-500 font-mono">Retrieving releases from database...</p>
                </div>
              ) : releasesList.length === 0 ? (
                <div className="border border-zinc-850 rounded-xl p-8 text-center space-y-3 bg-zinc-950/40">
                  <Disc className="w-10 h-10 text-zinc-600 mx-auto animate-spin-slow" />
                  <p className="text-xs text-zinc-400 font-mono">No releases found in the database releases table.</p>
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">Click 'Add Release' to publish your first album, EP, single, or demo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {releasesList.map((rel: any, idx: number) => {
                    const linkedProduct = props.inventory?.find((inv: any) => inv.id === rel.catalogId || inv.id === rel.catalog_id);
                    return (
                      <div key={rel.id ? `rel-${rel.id}-${idx}` : `rel-${idx}`} className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {rel.coverUrl ? (
                              <img src={rel.coverUrl} alt={rel.title} className="w-full h-full object-cover" />
                            ) : (
                              <Disc className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono font-bold uppercase">{rel.type}</span>
                              <span className="text-[9px] font-mono text-zinc-500">{rel.year}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate mt-0.5">{rel.title}</h4>
                            <p className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">
                              {rel.label || 'No Label'} {rel.tracks?.length ? `• ${rel.tracks.length} Tracks` : '• No Tracks'}
                            </p>
                            {linkedProduct ? (
                              <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Synced: {linkedProduct.name}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] font-mono">
                                Not Synced to Store
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingRelease(JSON.parse(JSON.stringify(rel)))}
                            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                            title="Edit Release"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${rel.title}"?`)) {
                                const ok = await deleteReleaseFromDatabase(rel.id);
                                if (ok) {
                                  props.triggerNotification?.(`🗑️ Deleted release "${rel.title}" successfully.`);
                                  loadReleasesData();
                                } else {
                                  props.triggerNotification?.(`❌ Failed to delete release from database.`);
                                }
                              }
                            }}
                            className="p-2 bg-zinc-900 hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 rounded-lg border border-zinc-800 hover:border-rose-900/50 transition-colors cursor-pointer"
                            title="Delete Release"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Editor View */
              <div className="space-y-5 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Disc className="w-4 h-4 text-amber-500" />
                    {editingRelease.id.startsWith('rel-') ? 'New Release Draft' : 'Edit Release Record'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingRelease(null)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer border-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Left Column: Cover Uploader */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase text-amber-400 tracking-widest block font-bold">Release Cover Image</label>
                    <div className="aspect-square w-full rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden relative group shadow-md flex flex-col items-center justify-center">
                      {editingRelease.coverUrl || editingRelease.coverImage ? (
                        <>
                          <img src={editingRelease.coverUrl || editingRelease.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditingRelease((prev: any) => ({ ...prev, coverUrl: '', coverImage: '' }))}
                            className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-rose-400 rounded-lg transition-colors shadow-md border-none"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div
                          onDragEnter={(e) => { e.preventDefault(); setReleaseCoverDragActive(true); }}
                          onDragOver={(e) => { e.preventDefault(); setReleaseCoverDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setReleaseCoverDragActive(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setReleaseCoverDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (reader.result) {
                                  setEditingRelease((prev: any) => ({ ...prev, coverUrl: reader.result as string, coverImage: reader.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (reader.result) {
                                    setEditingRelease((prev: any) => ({ ...prev, coverUrl: reader.result as string, coverImage: reader.result as string }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className={`w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer border-2 border-dashed transition-all ${
                            releaseCoverDragActive ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
                          }`}
                        >
                          <Upload className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-amber-400 transition-colors" />
                          <p className="text-[10px] font-mono text-zinc-400 font-bold">DRAG & DROP COVER ART</p>
                          <p className="text-[8px] font-mono text-zinc-600 mt-1">Accepts PNG, JPG or Base64</p>
                        </div>
                      )}
                    </div>
                    {/* Manual URL Input */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Or cover image URL</span>
                      <input
                        type="text"
                        value={editingRelease.coverUrl || ''}
                        onChange={(e) => setEditingRelease((prev: any) => ({ ...prev, coverUrl: e.target.value, coverImage: e.target.value }))}
                        placeholder="https://example.com/cover.jpg"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* Middle/Right Column: Metadata Form */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-zinc-400 tracking-widest block font-bold">Release Title</label>
                        <input
                          type="text"
                          value={editingRelease.title}
                          onChange={(e) => setEditingRelease((prev: any) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Onset of Putrefaction"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10.5px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>

                      {/* Format Type */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-zinc-400 tracking-widest block font-bold">Format Type</label>
                        <select
                          value={editingRelease.type}
                          onChange={(e) => setEditingRelease((prev: any) => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10.5px] font-mono text-zinc-100 focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="Album">Album</option>
                          <option value="EP">EP</option>
                          <option value="Demo">Demo</option>
                          <option value="Split">Split</option>
                          <option value="Single">Single</option>
                        </select>
                      </div>

                      {/* Release Date */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-zinc-400 tracking-widest block font-bold">Release Date</label>
                        <input
                          type="date"
                          value={editingRelease.releaseDate}
                          onChange={(e) => setEditingRelease((prev: any) => ({ ...prev, releaseDate: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10.5px] font-mono text-zinc-100 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>

                      {/* Record Label */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-zinc-400 tracking-widest block font-bold">Record Label</label>
                        <input
                          type="text"
                          value={editingRelease.label}
                          onChange={(e) => setEditingRelease((prev: any) => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g. Willowtip Records"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10.5px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    </div>

                    {/* Sync Section */}
                    <div className="bg-zinc-900/60 border border-zinc-850 p-3 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                          Platform Catalog Sync (Tied Store Product)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingRelease.title) {
                              props.triggerNotification?.('⚠️ Enter a release title first to auto-sync.');
                              return;
                            }
                            const matched = props.inventory?.find((inv: any) => 
                              inv.name?.toLowerCase().includes(editingRelease.title.toLowerCase()) ||
                              editingRelease.title.toLowerCase().includes(inv.name?.toLowerCase())
                            );
                            if (matched) {
                              setEditingRelease((prev: any) => ({ ...prev, catalogId: matched.id }));
                              props.triggerNotification?.(`⚡ Smart Sync Matched: "${matched.name}"`);
                            } else {
                              props.triggerNotification?.('⚠️ No store matching product found in inventory.');
                            }
                          }}
                          className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded text-[9px] font-mono font-bold transition-all cursor-pointer border-none"
                        >
                          Smart Auto-Sync
                        </button>
                      </div>
                      
                      <div className="space-y-1">
                        <select
                          value={editingRelease.catalogId || ''}
                          onChange={(e) => setEditingRelease((prev: any) => ({ ...prev, catalogId: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] font-mono text-zinc-100 focus:outline-none focus:border-teal-500/50"
                        >
                          <option value="">-- No Sync (Show Standalone Discography) --</option>
                          {props.inventory?.map((inv: any, idx: number) => (
                            <option key={inv.id ? `inv-${inv.id}-${idx}` : `inv-${idx}`} value={inv.id}>
                              {inv.name} ({inv.item_type || 'Merch'} • ${inv.price ? inv.price.toFixed(2) : '0.00'} • Qty: {inv.quantity ?? 0})
                            </option>
                          ))}
                        </select>
                        <p className="text-[8px] text-zinc-500 font-mono mt-0.5">
                          Linking this release with a store product lets fans download or purchase directly from the profile card.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracklist Builder Section */}
                <div className="border border-zinc-850 rounded-xl p-3 bg-zinc-950/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                      Tracklist Builder ({editingRelease.tracks?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const trks = editingRelease.tracks ? [...editingRelease.tracks] : [];
                        trks.push({
                          id: `trk-${Date.now()}`,
                          title: '',
                          duration: '',
                          lyrics: ''
                        });
                        setEditingRelease((prev: any) => ({ ...prev, tracks: trks }));
                      }}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Track
                    </button>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(!editingRelease.tracks || editingRelease.tracks.length === 0) ? (
                      <p className="text-[10px] text-zinc-500 font-mono text-center py-4">No tracks added to this release. Click 'Add Track' to begin building the tracklist.</p>
                    ) : (
                      editingRelease.tracks.map((trk: any, tIdx: number) => (
                        <div key={trk.id ? `release-trk-${trk.id}-${tIdx}` : `release-trk-${tIdx}`} className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500 font-black shrink-0">{tIdx + 1}.</span>
                            <input
                              type="text"
                              value={trk.title}
                              onChange={(e) => {
                                const trks = [...editingRelease.tracks];
                                trks[tIdx].title = e.target.value;
                                setEditingRelease((prev: any) => ({ ...prev, tracks: trks }));
                              }}
                              placeholder="Track Title"
                              className="flex-grow bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={trk.duration || ''}
                              onChange={(e) => {
                                const trks = [...editingRelease.tracks];
                                trks[tIdx].duration = e.target.value;
                                setEditingRelease((prev: any) => ({ ...prev, tracks: trks }));
                              }}
                              placeholder="Time (e.g. 4:12)"
                              className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trks = editingRelease.tracks.filter((_: any, i: number) => i !== tIdx);
                                setEditingRelease((prev: any) => ({ ...prev, tracks: trks }));
                              }}
                              className="p-1 bg-zinc-900 hover:bg-rose-950/20 text-zinc-500 hover:text-rose-400 rounded transition-colors border-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Lyrics Section */}
                          <div className="pl-4">
                            <details className="group">
                              <summary className="text-[8px] font-mono text-zinc-500 hover:text-zinc-400 cursor-pointer list-none flex items-center gap-1 select-none">
                                <FileText className="w-2.5 h-2.5" />
                                <span className="group-open:hidden">Add/Edit Lyrics</span>
                                <span className="hidden group-open:inline">Hide Lyrics Editor</span>
                              </summary>
                              <div className="mt-1 pt-1 border-t border-zinc-900">
                                <textarea
                                  value={trk.lyrics || ''}
                                  onChange={(e) => {
                                    const trks = [...editingRelease.tracks];
                                    trks[tIdx].lyrics = e.target.value;
                                    setEditingRelease((prev: any) => ({ ...prev, tracks: trks }));
                                  }}
                                  rows={3}
                                  placeholder="Paste track lyrics here..."
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-[9px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                                />
                              </div>
                            </details>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setEditingRelease(null)}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingRelease.title) {
                        props.triggerNotification?.('⚠️ Release title is required.');
                        return;
                      }
                      if (!props.activeBand?.id) return;
                      
                      const ok = await upsertReleaseToDatabase(editingRelease, props.activeBand.id);
                      if (ok.success) {
                        props.triggerNotification?.(`⚡ Successfully saved release "${editingRelease.title}"!`);
                        setEditingRelease(null);
                        loadReleasesData();
                      } else {
                        props.triggerNotification?.(`❌ Failed to save release: ${ok.error || 'Unknown error'}`);
                      }
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all shadow-md cursor-pointer border-none"
                  >
                    Save Release to Database
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </V2ExpandableCard>

      <V2ExpandableCard title="Crew Members & Tour Staff" defaultExpanded={false}>
        <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5 space-y-6">
          <div className="space-y-4 text-left">
            <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans max-w-2xl">
              Manage your active touring personnel. Assigning crew roles helps organize day sheets and contact lists for venues.
            </p>
            <div className="flex items-center gap-3">
              <button 
                 type="button"
                 onClick={() => {
                   const cName = prompt("Crew Member Name:");
                   if (cName) {
                     const cRole = prompt("Role (e.g. FOH Engineer, TM, Merch):") || "Crew";
                     const cContact = prompt("Contact Info (Phone/Email optional):") || "";
                     setCrewMembers([...crewMembers, { id: Date.now().toString(), name: cName, role: cRole, contact: cContact, clearanceLevel: 1 }]);
                     triggerNotification?.(`🔧 Crew member ${cName} registered!`);
                   }
                 }}
                 className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-[#00ffcc] font-mono text-[9px] font-bold uppercase tracking-widest rounded-lg border border-zinc-800 transition-colors flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>
            {crewMembers && crewMembers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {crewMembers.map((crew: any, idx: number) => (
                  <div 
                    key={crew.id ? `crew-${crew.id}-${idx}` : `crew-${idx}`} 
                    className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl flex items-start justify-between group hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex flex-col flex-grow min-w-0 pr-2">
                      <span className="text-white font-bold truncate text-[12px]">{crew.name}</span>
                      <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{crew.role}</span>
                      {crew.contact && (
                        <span className="text-zinc-500 text-[9px] mt-1 truncate">{crew.contact}</span>
                      )}
                      
                      {/* Security Clearance Selection (only levels 1 & 2 selectable) */}
                      <div className="mt-2 pt-2 border-t border-zinc-900 text-left">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">Clearance Level</span>
                        <select
                          value={crew.clearanceLevel || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedCrew = crewMembers.map((c: any) => 
                              c.id === crew.id ? { ...c, clearanceLevel: val } : c
                            );
                            setCrewMembers(updatedCrew);
                            triggerNotification?.(`🔧 Updated ${crew.name}'s clearance to Level ${val}`);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-lg px-2 py-1 text-[10px] text-zinc-200 font-mono focus:outline-none cursor-pointer"
                        >
                          <option value="1">Lvl 1 - Temp (Read Events/Social)</option>
                          <option value="2">Lvl 2 - Staff (+ POS checkout sales)</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove ${crew.name} from tour crew?`)) {
                          setCrewMembers(crewMembers.filter((c: any) => c.id !== crew.id));
                          triggerNotification?.(`🔧 Crew member ${crew.name} removed.`);
                        }
                      }}
                      className="p-1.5 bg-rose-500/10 text-rose-500 rounded-md hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </V2ExpandableCard>

      {(props.bandJoinRequests?.length > 0) && (
        <V2ExpandableCard title={`Pending Join Requests (${props.bandJoinRequests.filter((r: any) => r.status === 'pending').length})`} defaultExpanded={true}>
          <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5 space-y-4">
            <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans max-w-2xl text-left">
              These users have requested to join your touring team. Approve them to grant access to the band's metrics and data.
            </p>
            <div className="space-y-3">
              {props.bandJoinRequests.filter((r: any) => r.status === 'pending').map((request: any, idx: number) => (
                <div key={request.id ? `join-req-${request.id}-${idx}` : `join-req-${idx}`} className="bg-zinc-950/80 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between group">
                  <div className="text-left space-y-1">
                    <p className="text-sm font-bold text-white">{request.user_name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{request.user_email}</p>
                    <div className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase mt-1">
                      Role Requested: {request.role_requested}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const updatedRequests = props.bandJoinRequests.map((r: any) => r.id === request.id ? { ...r, status: 'approved' } : r);
                        props.setBandJoinRequests(updatedRequests);
                        const newMember = {
                          id: `crew_${Date.now()}`,
                          name: request.user_name,
                          role: request.role_requested,
                          clearanceLevel: 2, // default crew
                          contact: request.user_email
                        };
                        setCrewMembers([...(Array.isArray(crewMembers) ? crewMembers : []), newMember]);
                        triggerNotification?.(`✅ ${request.user_name} approved and added to crew.`);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => {
                        const updatedRequests = props.bandJoinRequests.map((r: any) => r.id === request.id ? { ...r, status: 'rejected' } : r);
                        props.setBandJoinRequests(updatedRequests);
                        triggerNotification?.(`❌ Request from ${request.user_name} declined.`);
                      }}
                      className="px-4 py-2 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition-colors border border-rose-500/20"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {props.bandJoinRequests.filter((r: any) => r.status === 'pending').length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-xs font-mono">No pending requests</div>
              )}
            </div>
          </div>
        </V2ExpandableCard>
      )}

      <V2ExpandableCard title="Share Your Experience" defaultExpanded={false}>
        <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5 space-y-6">
          <div className="text-left space-y-4">
            {userReviews && userReviews.length > 0 && !props.reviewLeft ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400 shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-emerald-200 font-sans leading-relaxed pt-0.5">
                    Thank you for your review of Nexus Core. Your live review is dynamically integrated and featured on the Plans Page!
                  </p>
                </div>
                {/* List of user reviews saved locally */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {userReviews && userReviews.length > 0 && (
                    <div className="space-y-2 text-left">
                      <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest">My Recent Reviews ({userReviews.length})</span>
                      {userReviews.map((rev: any, idx: number) => (
                        <div key={rev.id ? `user-rev-${rev.id}-${idx}` : `user-rev-${idx}`} className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={`rev-star-${rev.id || idx}-${i}`} className={`w-3 h-3 ${rev.rating > i ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                              ))}
                            </div>
                            <span className="text-[8.5px] font-mono text-zinc-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-zinc-300 pr-1 italic">"{rev.text}"</p>
                          <div className="text-[9.5px] font-mono text-[#00ffcc] flex items-center justify-between pt-0.5 border-t border-zinc-850">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{rev.name}</span>
                              <span className="text-zinc-600">•</span>
                              <span>{rev.group}</span>
                            </div>
                            {rev.is_synced === false ? (
                              <span className="text-[8.5px] font-mono font-bold text-amber-600 tracking-tight block animate-pulse">[ ▰ OFFLINE CACHED ]</span>
                            ) : (
                              <span className="text-[8.5px] font-mono font-bold text-emerald-600/80 tracking-tight block transition-all">[ ✓ SYNCED ]</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReviewLeft(false);
                    setReviewText('');
                  }}
                  className="w-full py-1.5 text-[9.5px] font-mono font-bold bg-zinc-900 hover:bg-zinc-805 text-zinc-300 rounded-lg uppercase tracking-wider border border-zinc-800 transition-all cursor-pointer"
                >
                  + Write Another Review
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 text-left">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Help independent touring crews manage tables securely. Your review instantly publishes to the plans/billing showcase.
                </p>
                {/* Stars Selector Row */}
                <div className="space-y-1 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                  <label className="text-[8.5px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Tap Star Rating</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star, stIdx) => (
                        <button
                          key={`${star}-${stIdx}`}
                          type="button"
                          onClick={() => setReviewScore(star)}
                          className="p-1 text-amber-500 transition-transform active:scale-90 hover:scale-115"
                        >
                          <Star className={`w-5 h-5 ${reviewScore >= star ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'}`} />
                        </button>
                      ))}
                    </div>
                    <span className="text-[10.5px] text-amber-400 font-mono font-bold">
                      {reviewScore === 5 ? 'Perfect 5/5 ⭐' : `${reviewScore}/5`}
                    </span>
                  </div>
                </div>
                {/* Textarea review prompt */}
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider font-bold block">Review Comment</label>
                  <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="e.g. Saved our cargo counting in Chicago, seamless PDF exports..."
                    className="w-full h-20 bg-zinc-950/85 hover:bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-amber-500/60 rounded-xl p-3 text-xs text-white font-sans focus:outline-none transition resize-none placeholder-zinc-600"
                  />
                </div>
                {/* Two-column Input row (Your Name & Your Band) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Your Name</label>
                    <input 
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500/50 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none transition font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Your Band</label>
                    <input 
                      type="text"
                      value={reviewerGroup}
                      onChange={(e) => setReviewerGroup(e.target.value)}
                      placeholder="e.g. Crimson Void"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500/50 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none transition font-sans"
                    />
                  </div>
                </div>
                {/* Submission CTA */}
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 font-bold font-mono text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  Post Review & Publish
                </button>
              </div>
            )}
          </div>
        </div>
      </V2ExpandableCard>

      <V2ExpandableCard title="Help Desk">
          <HelpDeskView onBack={() => {}} />
      </V2ExpandableCard>
      
      <V2ExpandableCard title="Terms of Service">
          <TermsOfServiceView onBack={() => {}} />
      </V2ExpandableCard>
      
      <div className="mt-8 flex justify-center pb-8 relative z-10">
        <button
          type="button"
          onClick={async () => {
            if (window.confirm("WARNING: This will completely wipe all local storage, accounts, and offline databases from this device. Are you sure you want to start fresh?")) {
              if (typeof (window as any).WIPE_NEXUS_DATA === 'function') {
                await (window as any).WIPE_NEXUS_DATA();
              }
            }
          }}
          className="text-[10px] font-mono text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-500/10 px-4 py-2 rounded border border-transparent hover:border-red-500/50 bg-black/50"
          title="WARNING: This will completely wipe all saved state, caches, accounts, and offline databases from this browser"
        >
          [ HARD WIPE ALL DATA CACHES ]
        </button>
      </div>
    </div>
  );
}
