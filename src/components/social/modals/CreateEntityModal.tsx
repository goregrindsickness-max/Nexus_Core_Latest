import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Globe,
  MapPin,
  Upload,
  Sparkles,
  Calendar,
  Ticket,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  EntityCategory,
  ENTITY_CATEGORY_META,
  NetworkEntity,
  createNetworkEntity,
  updateNetworkEntity,
  saveFestivalEdition,
  slugifyEntityName,
} from '../../../services/networkEntitiesService';

export interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
  initialCategory?: EntityCategory;
  initialEntity?: NetworkEntity | null;
  onEntityCreated?: (entity: NetworkEntity, createdEditionId?: string) => void;
  triggerNotification?: (msg: string) => void;
}

const SELECTABLE_CATEGORIES: EntityCategory[] = [
  'festival',
  'label_distro',
  'booking_agency',
  'media_press',
];

const AVATAR_PRESETS: Record<EntityCategory, string[]> = {
  festival: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=400&q=80',
  ],
  label_distro: [
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
  ],
  booking_agency: [
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80',
  ],
  media_press: [
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
  ],
  band: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
  ],
  venue: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
  ],
};

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  initialCategory = 'festival',
  initialEntity = null,
  onEntityCreated,
  triggerNotification,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<EntityCategory>(initialCategory);
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [bandcampUrl, setBandcampUrl] = useState('');

  // Optional initial festival edition setup when category === 'festival'
  const [createInitialEdition, setCreateInitialEdition] = useState(true);
  const [editionName, setEditionName] = useState('');
  const [editionStartDate, setEditionStartDate] = useState('2027-08-13');
  const [editionEndDate, setEditionEndDate] = useState('2027-08-15');
  const [editionVenue, setEditionVenue] = useState('');
  const [editionTicketUrl, setEditionTicketUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (initialEntity) {
      setStep(2);
      setCategory(initialEntity.category);
      setDisplayName(initialEntity.display_name || '');
      setSlug(initialEntity.slug || '');
      setSlugManuallyEdited(true);
      setLocation(initialEntity.location || '');
      setBio(initialEntity.bio || '');
      setAvatarUrl(initialEntity.avatar_url || '');
      setBannerUrl(initialEntity.banner_url || '');
      setWebsiteUrl(initialEntity.external_links?.website || '');
      setInstagramUrl(initialEntity.external_links?.instagram || '');
      setBandcampUrl(initialEntity.external_links?.bandcamp || '');
      setCreateInitialEdition(false);
    } else {
      setStep(1);
      setCategory(initialCategory);
      setDisplayName('');
      setSlug('');
      setSlugManuallyEdited(false);
      setLocation(userProfile?.location || '');
      setBio('');
      setAvatarUrl(AVATAR_PRESETS[initialCategory]?.[0] || '');
      setBannerUrl('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80');
      setWebsiteUrl('');
      setInstagramUrl('');
      setBandcampUrl('');
      setCreateInitialEdition(true);
      setEditionName('');
      setEditionStartDate('2027-08-13');
      setEditionEndDate('2027-08-15');
      setEditionVenue('');
      setEditionTicketUrl('');
    }
  }, [isOpen, initialEntity, initialCategory, userProfile?.location]);

  if (!isOpen) return null;

  const handleDisplayNameChange = (val: string) => {
    setDisplayName(val);
    if (!slugManuallyEdited) {
      setSlug(slugifyEntityName(val));
    }
    if (category === 'festival' && !editionName) {
      // Keep edition name synced naturally
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'avatar' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'avatar') setAvatarUrl(reader.result);
        else setBannerUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter an entity or festival name.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const externalLinks: Record<string, string | undefined> = {};
      if (websiteUrl.trim()) externalLinks.website = websiteUrl.trim();
      if (instagramUrl.trim()) externalLinks.instagram = instagramUrl.trim();
      if (bandcampUrl.trim()) externalLinks.bandcamp = bandcampUrl.trim();
      if (editionTicketUrl.trim()) externalLinks.tickets = editionTicketUrl.trim();

      if (initialEntity) {
        const updated = await updateNetworkEntity(initialEntity.id, {
          display_name: displayName.trim(),
          slug: slugifyEntityName(slug || displayName),
          category,
          location: location.trim() || 'Global Underground',
          bio: bio.trim(),
          avatar_url: avatarUrl.trim() || initialEntity.avatar_url,
          banner_url: bannerUrl.trim() || initialEntity.banner_url,
          external_links: externalLinks,
        });
        if (updated) {
          triggerNotification?.(`✅ Updated public page "${updated.display_name}" (@${updated.slug})`);
          onEntityCreated?.(updated);
        }
        onClose();
        return;
      }

      const createdEntity = await createNetworkEntity({
        display_name: displayName.trim(),
        slug: slug.trim() || displayName.trim(),
        category,
        location: location.trim() || 'Global Underground',
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || AVATAR_PRESETS[category]?.[0],
        banner_url: bannerUrl.trim(),
        external_links: externalLinks,
        owner_id: userProfile?.id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
      });

      let createdEditionId: string | undefined;
      if (category === 'festival' && createInitialEdition) {
        const cityParts = (location || 'Chicago, IL').split(',').map((s) => s.trim());
        const savedEd = await saveFestivalEdition({
          entity_id: createdEntity.id,
          edition_name: editionName.trim() || `${createdEntity.display_name} 2027`,
          start_date: editionStartDate || '2027-08-13',
          end_date: editionEndDate || editionStartDate || '2027-08-15',
          venue_name: editionVenue.trim() || 'Main Festival Grounds',
          city: cityParts[0] || 'Chicago',
          state: cityParts[1] || 'IL',
          ticket_url: editionTicketUrl.trim() || websiteUrl.trim() || '',
          flyer_url: bannerUrl.trim() || createdEntity.banner_url || '',
          status: 'announced',
        });
        createdEditionId = savedEd.id;
      }

      triggerNotification?.(
        `🎪 Created public entity "${createdEntity.display_name}" (@${createdEntity.slug})! Now available in your active identity switcher.`
      );
      onEntityCreated?.(createdEntity, createdEditionId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save public entity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeMeta = ENTITY_CATEGORY_META[category] || ENTITY_CATEGORY_META.festival;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000010] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0b0d13] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#11141d] border-b border-zinc-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
              {activeMeta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white truncate">
                  {initialEntity ? `Edit ${initialEntity.display_name}` : 'Create Public Page / Entity'}
                </h2>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Step {step} of 3
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 truncate">
                Decoupled brand page • Post, tag lineups & manage multi-admin rosters without a workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 bg-[#080a0f] border-b border-zinc-800/80 text-[10px] font-mono font-bold uppercase shrink-0">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              step === 1
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>1. Category</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              step === 2
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>2. Identity & Bio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!displayName.trim()) {
                setErrorMsg('Enter a Display Name first.');
                setStep(2);
                return;
              }
              setStep(3);
            }}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              step === 3
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>3. Branding & Launch</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs font-mono text-rose-200">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: ENTITY TYPE */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Select Public Organization / Brand Category
                </label>
                <p className="text-[11px] text-zinc-400">
                  Any personal or Industry Pro account can create and post as a public entity—no operational workspace subscription required.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SELECTABLE_CATEGORIES.map((catKey) => {
                  const meta = ENTITY_CATEGORY_META[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => {
                        setCategory(catKey);
                        if (!initialEntity && AVATAR_PRESETS[catKey]?.[0]) {
                          setAvatarUrl(AVATAR_PRESETS[catKey][0]);
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.18)]'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{meta.icon}</span>
                        {isSelected && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-black uppercase">
                            Selected
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-white">
                          {meta.label}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                          {meta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: NAME, HANDLE/SLUG, LOCATION, BIO & OPTIONAL FESTIVAL EDITION */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    {category === 'festival' ? 'Festival / Event Series Name *' : 'Organization / Brand Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    placeholder={
                      category === 'festival'
                        ? 'e.g. Chicago Domination Fest'
                        : category === 'label_distro'
                        ? 'e.g. Brutal Mind Distro'
                        : category === 'booking_agency'
                        ? 'e.g. Necrotic Booking Collective'
                        : 'e.g. Blastbeat Underground Zine'
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Public Handle / Slug *
                  </label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-amber-500 rounded-xl px-3 py-2">
                    <span className="text-xs font-mono text-amber-400 font-bold mr-1">@</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setSlug(slugifyEntityName(e.target.value));
                      }}
                      placeholder="chicago-domination-fest"
                      className="w-full bg-transparent text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Headquarters City / Region
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Chicago, IL or Los Angeles, CA"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Public Bio / Mission Statement
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your festival, roster focus, booking territories, or underground mission..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white font-mono focus:outline-none resize-none"
                />
              </div>

              {/* Festival Edition Quick Setup when category === 'festival' */}
              {category === 'festival' && !initialEntity && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                        Initialize Upcoming Festival Edition
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={createInitialEdition}
                      onChange={(e) => setCreateInitialEdition(e.target.checked)}
                      className="rounded border-zinc-700 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {createInitialEdition && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                          Edition Title
                        </label>
                        <input
                          type="text"
                          value={editionName}
                          onChange={(e) => setEditionName(e.target.value)}
                          placeholder={
                            displayName
                              ? `${displayName} 2027`
                              : 'e.g. Chicago Domination Fest 2027'
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={editionStartDate}
                          onChange={(e) => setEditionStartDate(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={editionEndDate}
                          onChange={(e) => setEditionEndDate(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                          Primary Venue Name
                        </label>
                        <input
                          type="text"
                          value={editionVenue}
                          onChange={(e) => setEditionVenue(e.target.value)}
                          placeholder="e.g. Reggies Rock Club"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                          Ticket Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={editionTicketUrl}
                          onChange={(e) => setEditionTicketUrl(e.target.value)}
                          placeholder="https://tickets..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase flex items-center gap-1.5 border border-zinc-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!displayName.trim()) {
                      setErrorMsg('Please enter a name for your public page.');
                      return;
                    }
                    setErrorMsg(null);
                    setStep(3);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Continue to Branding</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AVATAR, BANNER & EXTERNAL LINKS */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Live Banner + Avatar Preview Header */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 h-32">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="Entity banner preview"
                    className="w-full h-full object-cover opacity-70"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl border-2 border-amber-500 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xl">{activeMeta.icon}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        {activeMeta.icon} {activeMeta.shortLabel}
                      </span>
                      <h3 className="text-sm font-black text-white uppercase truncate mt-0.5">
                        {displayName || 'Untitled Entity'}
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-400 truncate">
                        @{slug || slugifyEntityName(displayName)} • {location || 'Global Underground'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Avatar Upload / URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold uppercase text-zinc-300">
                      Logo / Avatar Image
                    </label>
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                    />
                  </div>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://... or upload logo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                {/* Banner Upload / URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold uppercase text-zinc-300">
                      Cover Banner / Flyer
                    </label>
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'banner')}
                    />
                  </div>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... or upload banner"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* External Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                    Official Website
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1">
                    Bandcamp / Merch URL
                  </label>
                  <input
                    type="url"
                    value={bandcampUrl}
                    onChange={(e) => setBandcampUrl(e.target.value)}
                    placeholder="https://...bandcamp.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase flex items-center gap-1.5 border border-zinc-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving Entity...'
                      : initialEntity
                      ? 'Save Entity Changes'
                      : `Launch ${activeMeta.shortLabel} Page`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateEntityModal;
