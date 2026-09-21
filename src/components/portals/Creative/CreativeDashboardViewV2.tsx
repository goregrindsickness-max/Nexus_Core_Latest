import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, hasRegisteredWorkspace } from '../../../types';
import { Power, Globe, Users, User, DollarSign, Database, Activity, RefreshCw, Settings, X, Home, Lock, Sparkles, Layers, LogOut, Bell, Building, MapPin, MessageSquare, ArrowLeft, Send, CheckSquare, Check, Plus, AlertTriangle, TrendingUp, Shield, BarChart3, Radio, Heart, MessageCircle, Play, Pause, Square, SkipBack, SkipForward, Disc, Volume2, Truck, Tag, Edit, Trash2, Upload, ShoppingBag, ShoppingCart, CreditCard, Calendar, ArrowRightLeft, Package, Box, Banknote, ChevronDown, Calculator, Palette, Info, Search, Pin, Flame, Rocket, ThumbsUp, Menu, Briefcase, Star, Mail, ExternalLink, ChevronUp, Camera, Zap, Edit3, ChevronLeft, ChevronRight, Music, Maximize } from 'lucide-react';
import MarqueeText from '../../MarqueeText';
import { getSupabase, uploadBase64ToStorage, executeWithSchemaResilience, sanitizeCreativePayload, formatCreativePayload, extractGlobalProfilePayload, autoSyncCreativeProfile } from '../../../supabase';
import CreativeSettingsTab from './CreativeSettingsTab';
import CreativeAlliancesView from './CreativeAlliancesView';
import CreativeWorkspaceProtocols from './CreativeWorkspaceProtocols';
import EscrowReleaseReceipt from './EscrowReleaseReceipt';
import { ProfileCard } from './ProfileCard';
import { MASTER_GENRES } from '../../../constants/genres';
import { COUNTRIES, US_STATES } from '../../../constants/location';

interface CreativeDashboardViewV2Props {
  userProfile: UserProfile;
  setUserProfile: any;
  onLogout: () => void;
  notifications?: any[];
  onOpenNotifications?: () => void;
  onBack: () => void;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  onUpgradeToPro?: () => void;
  setActiveTab?: (tab: string) => void;
}

// Preloaded beautiful gig leads that match different creative categories
const SAMPLE_GIG_LEADS = [
  {
    id: 'gig-1',
    category: 'Artist/Designer',
    title: 'Visual Identity & Merch Bundle: "Iron Crypt" LP Release',
    client: 'Goregrind Overlord Records',
    budget: '$1,500 USD',
    timeline: 'Due in 3 weeks',
    tags: ['Logo Design', 'Merch Illustration', 'Album Layout'],
    description: 'Looking for a dark, hyper-detailed pen-and-ink style artwork for an upcoming death metal vinyl gatefold cover and a matching 3-color screenprint t-shirt design.',
    region: 'Global / Remote',
    difficulty: 'Expert Level'
  },
  {
    id: 'gig-2',
    category: 'Sound Engineer/Recording',
    title: 'FOH Sound Engineer - 5-Date Southwest Metal Tour Stop',
    client: 'Shattered Sanity Management',
    budget: '$450 / Day + Lodging',
    timeline: 'Starts July 12',
    tags: ['Front-of-House (FOH)', 'Monitor Tech'],
    description: 'FOH engineer requested for a 5-date run spanning Texas and New Mexico. Crew must be experienced with Behringer X32/Midas M32 setups and managing heavy live kick dynamics.',
    region: 'Texas / New Mexico',
    difficulty: 'Intermediate'
  },
  {
    id: 'gig-3',
    category: 'Media/Photography',
    title: 'Multi-Cam Live Vid & Promo Shoot (Stubbs Austin)',
    client: 'Obsidian Moon Agency',
    budget: '$850 Flat',
    timeline: 'June 28 Event',
    tags: ['Music Videos', 'Tour Promos', 'Live Photography'],
    description: 'Need a dual DSLR shooter and editor to capture 3 live performance songs, edit 1 high-impact 60-second Instagram reel, and deliver 25 polished high-contrast digital action shots.',
    region: 'Austin, TX',
    difficulty: 'Any Experience'
  },
  {
    id: 'gig-4',
    category: 'Artist/Designer',
    title: 'Tour Flyer & Screenprint Separation Re-seps',
    client: 'Screaming Banshee Bookings',
    budget: '$300 Flat',
    timeline: 'Quick 48hr Turnaround',
    tags: ['Vector Conversion', 'Screenprint Sepps'],
    description: 'Need immediate color separation (5-color spot index) and clean vector conversion of a hand-painted flyer illustration to prepare for screen printers.',
    region: 'Global / Remote',
    difficulty: 'Intermediate'
  },
  {
    id: 'gig-5',
    category: 'Sound Engineer/Recording',
    title: 'Mixing & Mastering: 4-Track Raw Crust Grind EP',
    client: 'Crypt Spitter Records',
    budget: '$600 USD Total',
    timeline: 'No tight deadline',
    tags: ['Mixing', 'Mastering', 'Tracking Engineer'],
    description: 'Raw stems are complete but require intense leveling, analog grit clipping saturation, and high-energy master output level matching the standard grindcore loudness.',
    region: 'Global / Remote',
    difficulty: 'Expert Level'
  }
];

const GENRE_MICRO_GENRES: Record<string, string[]> = {};
MASTER_GENRES.forEach(cluster => {
  GENRE_MICRO_GENRES[cluster.name] = cluster.tags.map(t => t.label);
});

// Fullscreen external media embed parser helper
export function getEmbedData(url: string) {
  if (!url) {
    return { embedUrl: null, thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400', type: 'generic' };
  }

  const strUrl = url.trim();

  // 1. YouTube
  const ytMatch = strUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      type: 'youtube'
    };
  }

  // 2. Vimeo
  const vimeoMatch = strUrl.match(/vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/[0-9]+\/video\/|video\/|showcase\/[^\/]+\/video\/|)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
      type: 'vimeo'
    };
  }

  // 3. Spotify
  if (strUrl.includes('spotify.com')) {
    const embedUrl = strUrl.replace('spotify.com/', 'spotify.com/embed/');
    return {
      embedUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600',
      type: 'spotify'
    };
  }

  // 4. SoundCloud
  if (strUrl.includes('soundcloud.com')) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(strUrl)}&color=%238b5cf6&auto_play=true&hide_related=true&show_comments=true&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    return {
      embedUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600',
      type: 'soundcloud'
    };
  }

  return {
    embedUrl: strUrl,
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400',
    type: 'generic'
  };
}

const categoryTags = {
  'Artist/Designer': ['Logo Design', 'Vector Conversion', 'Merch Illustration', 'Album Layout', 'Screenprint Sepps'],
  'Sound Engineer/Recording': ['Front-of-House (FOH)', 'Monitor Tech', 'Tracking Engineer', 'Mixing', 'Mastering'],
  'Media/Photography': ['Music Videos', 'Tour Promos', 'Live Photography'],
  'Session Musician/Techs': ['Session Guitarist', 'Session Bassist', 'Drummer', 'Guitar/Bass Tech', 'Touring Crew / Backline']
};

const allPresetSkills = Object.values(categoryTags).flat();

// Helper to compress uploaded images to avoid LocalStorage quota overflow
function compressImage(base64Str: string, maxWidth = 1920, maxHeight = 1080, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = window.Image ? new window.Image() : null;
    if (!img) {
      resolve(base64Str);
      return;
    }
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export default function CreativeDashboardViewV2({
   userProfile,
   setUserProfile,
   onLogout,
   notifications,
   onOpenNotifications,
   onBack,
   triggerNotification: propTriggerNotification,
   addLog: propAddLog,
   setActiveTab: setPortalActiveTab
}: CreativeDashboardViewV2Props) {
  const [activeTab, setActiveTab] = useState<'JOBS'|'BOOKINGS'|'PORTFOLIO'|'TEAMS'|'SOCIAL'|'SETTINGS'>('JOBS');
  const [subTab, setSubTab] = useState<string>('');
  const [v2RoleMenuOpen, setV2RoleMenuOpen] = useState(false);
  const [isSpecsDrawerOpen, setIsSpecsDrawerOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxSubTab, setInboxSubTab] = useState('');

  const allowedWorkspaces = userProfile.allowed_workspaces || [];

  // Safe notifications and logs
  const safeTriggerNotification = propTriggerNotification || ((msg: string) => console.log('NOTIFICATION:', msg));
  const safeAddLog = propAddLog || ((msg: string) => console.log('LOG:', msg));
  const triggerNotification = safeTriggerNotification;
  const addLog = safeAddLog;

  // --- MIGRATED V1 STATE HOOKS ---
  const [clearedBalance, setClearedBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`nexus_core_creative_balance_${userProfile?.id || 'default'}`);
      return stored ? Number(stored) : 5100;
    } catch (_) {
      return 5100;
    }
  });

  const [availabilityStatus, setAvailabilityStatus] = useState<string>(() => {
    return userProfile.creative_metadata?.availability_status || 'Available';
  });

  const [quickBroadcast, setQuickBroadcast] = useState<string>(() => {
    return userProfile.creative_metadata?.quick_broadcast || 'Preparing artwork specs and mixing layouts for Q3 tour rosters.';
  });

  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [isEditingBroadcast, setIsEditingBroadcast] = useState(false);
  const [isPayoutExpanded, setIsPayoutExpanded] = useState(false);

  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'paypal' | 'none'>(() => {
    return (userProfile.creative_metadata?.payout_method as any) || 'none';
  });

  const [stripeAccountId, setStripeAccountId] = useState<string>(() => {
    return userProfile.creative_metadata?.stripe_account_id || '';
  });

  const [paypalEmail, setPaypalEmail] = useState<string>(() => {
    return userProfile.creative_metadata?.paypal_email || '';
  });

  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [isSuccessfullyConnected, setIsSuccessfullyConnected] = useState(false);

  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<string>('overview');

  useEffect(() => {
    const handleOpenProfile = (e: CustomEvent) => {
      const profileData = e.detail?.profile || e.detail;
      if (profileData) {
        setSelectedUserProfile(profileData);
      }
    };
    window.addEventListener('openPublicProfile', handleOpenProfile as any);
    return () => {
      window.removeEventListener('openPublicProfile', handleOpenProfile as any);
    };
  }, []);

  const upAny = userProfile as any;

  // Profile fields state
  const [displayName, setDisplayName] = useState(upAny?.creative_name || upAny?.creativeName || userProfile.name || '');
  const [avatarUrl, setAvatarUrl] = useState(upAny?.creative_avatar || userProfile.creative_avatar || '');
  const [businessName, setBusinessName] = useState(upAny?.creative_business_name || upAny?.creative_name || upAny?.creativeName || upAny?.creative_metadata?.business_name || upAny?.business_name || 'Vortex Graphics');
  const [creativeHandle, setCreativeHandle] = useState(upAny?.creative_handle || upAny?.creative_slug || upAny?.custom_slug || userProfile?.console_handle || userProfile?.screen_name || 'vortexgraphics');
  const [bookingEmail, setBookingEmail] = useState(userProfile.email || upAny?.creative_metadata?.booking_email || '');
  const [city, setCity] = useState(userProfile.city || upAny?.creative_metadata?.city || '');
  const [stateProvince, setStateProvince] = useState(userProfile.state_province || upAny?.creative_metadata?.state_province || '');
  const [country, setCountry] = useState(userProfile.country || upAny?.creative_metadata?.country || 'USA');
  const [baseLocation, setBaseLocation] = useState(userProfile.city ? `${userProfile.city}, ${userProfile.state_province || userProfile.country || ''}` : (upAny?.creative_metadata?.base_location || 'Remote Market Hub'));
  const [portfolioLink, setPortfolioLink] = useState(upAny?.creative_metadata?.portfolio_link || upAny?.website || '');
  const [bio, setBio] = useState(userProfile.bio || upAny?.creative_metadata?.bio || upAny?.creative_metadata?.biography || '');
  const [dayRate, setDayRate] = useState<string>(String(upAny?.creative_metadata?.day_rate || upAny?.creative_metadata?.base_rate_value || '350'));
  const [rateType, setRateType] = useState<'day' | 'project'>(upAny?.creative_metadata?.rate_type || 'day');
  const [pricingNotes, setPricingNotes] = useState(upAny?.creative_metadata?.pricing_notes || 'Flexible depending on label sizes.');

  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    return upAny?.creative_metadata?.selected_skills || upAny?.creative_metadata?.skills || [];
  });

  const [genreTags, setGenreTags] = useState<string[]>(() => {
    return upAny?.creative_metadata?.genre_tags || upAny?.creative_metadata?.genres || ['Death Metal', 'Grindcore', 'Hardcore Punk', 'Doom'];
  });

  const [gearTags, setGearTags] = useState<string[]>(() => {
    return upAny?.creative_metadata?.gear_tags || (upAny?.creative_metadata?.primary_gear ? [upAny.creative_metadata.primary_gear] : ['Wacom Cintiq Pro', 'Adobe Creative Suite', 'Nikon Z6 II DSLR']);
  });

  useEffect(() => {
    if (userProfile) {
      setDisplayName(upAny?.creative_name || upAny?.creativeName || userProfile.name || '');
      setAvatarUrl(upAny?.creative_avatar || userProfile.creative_avatar || '');
      setBusinessName(upAny?.creative_business_name || upAny?.creative_name || upAny?.creativeName || upAny?.creative_metadata?.business_name || '');
      setBookingEmail(userProfile.email || upAny?.creative_metadata?.booking_email || '');
      if (userProfile.city || upAny?.creative_metadata?.base_location) {
        setBaseLocation(userProfile.city ? `${userProfile.city}, ${userProfile.state_province || userProfile.country || ''}` : (upAny?.creative_metadata?.base_location || 'Remote Market Hub'));
      }
      setPortfolioLink(upAny?.creative_metadata?.portfolio_link || upAny?.website || '');
      setBio(userProfile.bio || upAny?.creative_metadata?.bio || upAny?.creative_metadata?.biography || '');
      if (upAny?.creative_metadata?.day_rate || upAny?.creative_metadata?.base_rate_value) {
        setDayRate(String(upAny?.creative_metadata?.day_rate || upAny?.creative_metadata?.base_rate_value));
      }
      if (userProfile.creative_metadata?.rate_type || userProfile.creative_metadata?.base_rate_type) {
        setRateType((userProfile.creative_metadata?.rate_type || (userProfile.creative_metadata?.base_rate_type === 'PROJECT' ? 'project' : 'day')) as 'day' | 'project');
      }
      if (userProfile.creative_metadata?.selected_skills?.length) {
        setSelectedSkills(userProfile.creative_metadata.selected_skills);
      } else if (userProfile.creative_metadata?.skills?.length) {
        setSelectedSkills(userProfile.creative_metadata.skills);
      }
      if (userProfile.creative_metadata?.genre_tags?.length) {
        setGenreTags(userProfile.creative_metadata.genre_tags);
      } else if (userProfile.creative_metadata?.genres?.length) {
        setGenreTags(userProfile.creative_metadata.genres);
      }
      if (userProfile.creative_metadata?.gear_tags?.length) {
        setGearTags(userProfile.creative_metadata.gear_tags);
      } else if (userProfile.creative_metadata?.primary_gear) {
        setGearTags([userProfile.creative_metadata.primary_gear]);
      }
    }
  }, [userProfile]);

  const handleOpenMyCreativeProfile = () => {
    safeTriggerNotification("⚡ Opening creative public profile card...");
    const profilePayload = {
      id: userProfile?.id,
      name: businessName || userProfile?.creative_metadata?.business_name || (userProfile as any)?.creative_name || userProfile?.name || 'Vortex Graphics',
      creative_name: displayName || (userProfile as any)?.creative_name || userProfile?.name,
      business_name: businessName || userProfile?.creative_metadata?.business_name || 'Vortex Graphics',
      legalName: userProfile?.full_name || userProfile?.name,
      avatar: avatarUrl || (userProfile as any)?.creative_avatar || userProfile?.avatar_url || null,
      avatar_url: avatarUrl || (userProfile as any)?.creative_avatar || userProfile?.avatar_url || null,
      banner: (userProfile as any)?.creative_banner || userProfile?.banner_url || null,
      banner_url: (userProfile as any)?.creative_banner || userProfile?.banner_url || null,
      cover_url: (userProfile as any)?.creative_banner || userProfile?.banner_url || null,
      location: baseLocation || (userProfile as any)?.location || userProfile?.city || 'USA / Global',
      role: 'Creative',
      account_type: 'creative',
      type: 'creative',
      isPersonal: false,
      isCreativeProfile: true,
      isYou: true,
      badges: ['🛠️ Creative Pro', '🎨 Designer'],
      customBadges: ['🛠️ Creative Pro', '🎨 Designer'],
      bio: bio || (userProfile as any)?.creative_metadata?.bio || 'Professional creative specialist on the Nexus network.',
      handle: creativeHandle || userProfile?.console_handle || 'vortexgraphics',
      console_handle: creativeHandle || userProfile?.console_handle || 'vortexgraphics',
      creative_metadata: {
        business_name: businessName,
        booking_email: bookingEmail,
        day_rate: dayRate,
        rate_type: rateType,
        portfolio_link: portfolioLink,
        selected_skills: selectedSkills,
        genre_tags: genreTags,
        gear_tags: gearTags
      }
    };
    setSelectedUserProfile(profilePayload);
    window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: profilePayload }));
  };

  // Minor tag/skill helpers
  const [customSkill, setCustomSkill] = useState('');
  const [newGearTag, setNewGearTag] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');

  const toggleSkillTag = (tag: string) => {
    setSelectedSkills(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkill.trim()) return;
    if (selectedSkills.includes(customSkill.trim())) {
      safeTriggerNotification('Skill already assigned.');
      return;
    }
    setSelectedSkills(prev => [...prev, customSkill.trim()]);
    setCustomSkill('');
    safeTriggerNotification('✓ Added custom specialized skill!');
  };

  const addGearTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearTag.trim()) return;
    if (gearTags.includes(newGearTag.trim())) {
      safeTriggerNotification('Gear tag already exists.');
      return;
    }
    setGearTags(prev => [...prev, newGearTag.trim()]);
    setNewGearTag('');
    safeTriggerNotification('✓ Added gear item to specifications.');
  };

  const removeGearTag = (tag: string) => {
    setGearTags(prev => prev.filter(t => t !== tag));
  };

  const toggleGenrePreset = (genre: string) => {
    setGenreTags(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const addGenreTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreInput.trim()) return;
    if (genreTags.includes(newGenreInput.trim())) {
      safeTriggerNotification('Genre already listed.');
      return;
    }
    setGenreTags(prev => [...prev, newGenreInput.trim()]);
    setNewGenreInput('');
    safeTriggerNotification('✓ Added subcultural genre specialty.');
  };

  const removeGenreTag = (genre: string) => {
    setGenreTags(prev => prev.filter(g => g !== genre));
  };

  const [primaryCategory, setPrimaryCategory] = useState<string>(() => {
    return userProfile.creative_metadata?.primary_category || 'Artist/Designer';
  });

  const [secondaryCategory, setSecondaryCategory] = useState<string>(() => {
    return userProfile.creative_metadata?.secondary_category || '';
  });

  // Gigs matching & feed persistence
  const [appliedGigIds, setAppliedGigIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`nexus_core_creative_gigs_applied_${userProfile?.id || 'default'}`);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const [expandedGigs, setExpandedGigs] = useState<Record<string, boolean>>({});
  const [leadsSubFilter, setLeadsSubFilter] = useState<'primary' | 'secondary' | 'all'>('primary');

  const [pitchTemplates, setPitchTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem(`nexus_core_creative_pitch_templates_${userProfile?.id || 'default'}`);
      return stored ? JSON.parse(stored) : [
        { id: 't1', title: 'Standard Illustration Pitch', content: 'Hi! Stoked on your LP vision. My rates are $450/front shirt, which includes fully print-separated vector assets and 2 design revision rounds. View my designer profile for samples!' },
        { id: 't2', title: 'Premium Multi-Asset Campaign', content: 'Hey there. I can bundle the Gatefold cover design, custom typography logo, and 3 shirt illustrations for $1,200. I operate on high-speed turnarounds to meet factory press schedules. Let me know if we can sync up!' },
        { id: 't3', title: 'Urgent Promo / Web Flyers', content: 'Yo! Can deliver high-impact web promos/tour flyers within 24-48 hours flat. Fully layered .PSD and web-ready formats. Hit me up to lock this in.' }
      ];
    } catch (_) {
      return [
        { id: 't1', title: 'Standard Illustration Pitch', content: 'Hi! Stoked on your LP vision. My rates are $450/front shirt, which includes fully print-separated vector assets and 2 design revision rounds. View my designer profile for samples!' },
        { id: 't2', title: 'Premium Multi-Asset Campaign', content: 'Hey there. I can bundle the Gatefold cover design, custom typography logo, and 3 shirt illustrations for $1,200. I operate on high-speed turnarounds to meet factory press schedules. Let me know if we can sync up!' },
        { id: 't3', title: 'Urgent Promo / Web Flyers', content: 'Yo! Can deliver high-impact web promos/tour flyers within 24-48 hours flat. Fully layered .PSD and web-ready formats. Hit me up to lock this in.' }
      ];
    }
  });

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateTitle, setEditingTemplateTitle] = useState('');
  const [editingTemplateContent, setEditingTemplateContent] = useState('');
  const [isPitchTemplatesExpanded, setIsPitchTemplatesExpanded] = useState(false);

  // Applying gig modal state
  const [applyingGig, setApplyingGig] = useState<any | null>(null);
  const [customPitchLetter, setCustomPitchLetter] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  // Portfolio items state
  const [portfolioItems, setPortfolioItems] = useState<{ id: string; title: string; client: string; link: string; year: string; completed: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_core_creative_portfolio_${userProfile?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [
        { id: 'item-1', title: 'Brutal Grind LP Cover', client: 'Gravehunter Band', link: 'https://behance.net/nexus_core', year: '2025', completed: true },
        { id: 'item-2', title: 'Warped Summer Merch Collection', client: 'Hellfire Boys', link: 'https://behance.net/nexus_core', year: '2026', completed: true }
      ];
    } catch (_) {
      return [];
    }
  });

  // Portfolio Form State
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortClient, setNewPortClient] = useState('');
  const [newPortLink, setNewPortLink] = useState('');
  const [newPortYear, setNewPortYear] = useState('2026');

  // Showcase Gallery State & Handlers
  const [galleryItems, setGalleryItems] = useState<{ id: string; title: string; subtitle: string; imageUrl: string; fileFrame: string; mediaType?: string; externalUrl?: string; year?: string; genre?: string; microGenre?: string }[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_core_creative_gallery_${userProfile?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy placeholder items
          return parsed.filter((item: any) => !['gal-1', 'gal-2', 'gal-3'].includes(item?.id) && !item?.title?.includes('Brutal CMYK') && !item?.imageUrl?.includes('1541701494587'));
        }
      }
      return [];
    } catch (_) {
      return [];
    }
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [newGalTitle, setNewGalTitle] = useState('');
  const [newGalSubtitle, setNewGalSubtitle] = useState('');
  const [newGalYear, setNewGalYear] = useState('2026');
  const [activeLookbookItemIds, setActiveLookbookItemIds] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nexus_core_lookbook_feed') || '[]');
      const myId = userProfile?.id || 'default';
      return saved.filter((l: any) => l.talentId === myId).map((l: any) => l.id);
    } catch (_) {
      return [];
    }
  });
  const [newGalGenre, setNewGalGenre] = useState('Extreme Metal');
  const [newGalMicroGenre, setNewGalMicroGenre] = useState('Death Metal');
  const [galUploadMethod, setGalUploadMethod] = useState<'file' | 'external'>('file');
  const [externalEmbedUrl, setExternalEmbedUrl] = useState('');
  const [fullscreenSlide, setFullscreenSlide] = useState<any | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Inbox / Leads Booking proposals (V1 structure)
  const [proposals, setProposals] = useState<{ id: string; bandName: string; projectType: string; deadline: string; description: string; proposedFee: string; status: 'pending' | 'accepted' | 'declined' }[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_core_creative_proposals_${userProfile?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'prop-1',
          bandName: 'Crucifixion Tour Management',
          projectType: 'Tour T-shirt Illustration',
          deadline: 'July 1st, 2026',
          description: 'Requesting a custom multi-spectral color screenprint-ready asset for our upcoming European Summer Fest circuit tour. Theme is gothic architecture meets bio-mechanical decay.',
          proposedFee: '$1,200 Flat',
          status: 'pending'
        },
        {
          id: 'prop-2',
          bandName: 'Austin Doom Coalition',
          projectType: 'Show FOH Mix Support',
          deadline: 'June 20th, 2026',
          description: 'Sound engineer slot for our regional Austin headline show. 2 hour performance block at The Lost Well. Sound check at 5:00 PM Sharp.',
          proposedFee: '$400 Line Check & Mix',
          status: 'pending'
        }
      ];
    } catch (_) {
      return [];
    }
  });

  // Calendar states
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(() => new Date(2026, 5, 20)); // Base is June 2026
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(() => new Date(2026, 5, 20)); // Base is June 2026
  const [isDateProfileExpanded, setIsDateProfileExpanded] = useState<boolean>(true);
  const [newBlockoutLabel, setNewBlockoutLabel] = useState('');
  const [newBlockoutReason, setNewBlockoutReason] = useState('');
  const [manualBlockedDates, setManualBlockedDates] = useState<{ dateStr: string; reason: string; label: string }[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_core_creative_blocked_dates_${userProfile?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [
        { dateStr: '2026-06-25', reason: 'Redundant core maintenance & workstation cleanup.', label: 'Workspace Sync' }
      ];
    } catch (_) {
      return [
        { dateStr: '2026-06-25', reason: 'Redundant core maintenance & workstation cleanup.', label: 'Workspace Sync' }
      ];
    }
  });

  // Persist manual blocked dates
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_blocked_dates_${userProfile?.id || 'default'}`, JSON.stringify(manualBlockedDates));
    } catch (_) {}
  }, [manualBlockedDates, userProfile?.id]);

  const calDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const calStartDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calPreviousMonth = () => {
    setCalendarCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const calNextMonth = () => {
    setCalendarCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const parseProposalDate = (deadline: string): Date | null => {
    try {
      if (!deadline) return null;
      let cl = deadline.toLowerCase().trim();
      cl = cl.replace(/(\d+)(st|nd|rd|th)/, "$1");
      const d = new Date(cl);
      if (!isNaN(d.getTime())) return d;
    } catch (_) {}
    return null;
  };

  const getDayEvents = (date: Date) => {
    const events: { id: string; type: 'proposal' | 'blocked'; status?: string; name: string; description: string; fee?: string; original: any }[] = [];
    
    // Match proposals
    proposals.forEach(p => {
      const pDate = parseProposalDate(p.deadline);
      if (pDate && pDate.getFullYear() === date.getFullYear() && pDate.getMonth() === date.getMonth() && pDate.getDate() === date.getDate()) {
        events.push({
          id: p.id,
          type: 'proposal',
          status: p.status,
          name: `${p.projectType} (${p.bandName})`,
          description: p.description,
          fee: p.proposedFee,
          original: p
        });
      }
    });

    // Match manual blocked dates
    manualBlockedDates.forEach(b => {
      const parts = b.dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const d = parseInt(parts[2]);
        if (y === date.getFullYear() && m === date.getMonth() && d === date.getDate()) {
          events.push({
            id: `blocked-${b.dateStr}`,
            type: 'blocked',
            name: b.label || 'Offline Blockout',
            description: b.reason,
            original: b
          });
        }
      }
    });

    return events;
  };

  // Additional needed states and effects
  const [expandedProposals, setExpandedProposals] = useState<Record<string, boolean>>({});
  const toggleProposalExpand = (id: string) => {
    setExpandedProposals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [bandConfiguredProtocols, setBandConfiguredProtocols] = useState<Record<string, boolean>>({
    'visual-1': true,
    'visual-2': true,
    'audio-1': true,
    'audio-2': true,
    'media-1': true,
    'media-2': true
  });
  const [releasedEscrowProjIds, setReleasedEscrowProjIds] = useState<string[]>([]);
  const [isSecurityMatrixExpanded, setIsSecurityMatrixExpanded] = useState(false);
  const [activeReceiptProposal, setActiveReceiptProposal] = useState<any | null>(null);
  const [isReleasingEscrow, setIsReleasingEscrow] = useState<boolean>(false);

  // Track dynamic custom protocols from shared contract ledger
  const [proposalVerifiedProtocols, setProposalVerifiedProtocols] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    try {
      const saved = localStorage.getItem('nexus_core_creative_contracts_v1');
      if (saved) {
        const contracts = JSON.parse(saved);
        contracts.forEach((c: any) => {
          initial[c.id] = c.verified_protocols || {};
        });
      }
    } catch (_) {}
    return initial;
  });

  const [proposalEnforcedProtocols, setProposalEnforcedProtocols] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    try {
      const saved = localStorage.getItem('nexus_core_creative_contracts_v1');
      if (saved) {
        const contracts = JSON.parse(saved);
        contracts.forEach((c: any) => {
          initial[c.id] = c.enforced_protocols || {};
        });
      }
    } catch (_) {}
    return initial;
  });

  // Checklist completion handler that updates the shared contract list bidirectionally
  const handleContractChecklistChange = (proposalId: string, completedMap: Record<string, boolean>) => {
    setProposalVerifiedProtocols(prev => ({
      ...prev,
      [proposalId]: completedMap
    }));

    try {
      const savedContractsStr = localStorage.getItem('nexus_core_creative_contracts_v1');
      if (savedContractsStr) {
        const savedContracts = JSON.parse(savedContractsStr);
        const updatedContracts = savedContracts.map((c: any) => {
          if (c.id === proposalId) {
            // Check if all enforced protocols are verified
            const isAllDone = Object.keys(c.enforced_protocols)
              .filter(key => c.enforced_protocols[key] === true)
              .every(key => completedMap[key] === true);

            return {
              ...c,
              verified_protocols: completedMap,
              status: isAllDone ? 'verified' : 'production'
            };
          }
          return c;
        });

        localStorage.setItem('nexus_core_creative_contracts_v1', JSON.stringify(updatedContracts));

        // Sync to Supabase
        const supabase = getSupabase();
        if (supabase) {
          supabase.from('creative_contracts_v1')
            .upsert(updatedContracts)
            .then(({ error }) => {
              if (error) console.warn('Supabase contract checklist sync error:', error);
            });
        }
      }
    } catch (err) {
      console.warn('Error saving checklist completion to contract ledger:', err);
    }
  };

  // Bidirectional real-time contract synchronization effect with automatic mapping
  useEffect(() => {
    const syncSharedContracts = () => {
      try {
        const savedContractsStr = localStorage.getItem('nexus_core_creative_contracts_v1');
        if (savedContractsStr) {
          const savedContracts = JSON.parse(savedContractsStr);
          
          // Match the user profile's name or allow general sandbox match
          const matchingContracts = savedContracts.filter((c: any) => {
            return c.creative_name === displayName || c.creative_id === 'c-vortex' || !c.creative_name;
          });

          if (matchingContracts.length > 0) {
            const contractProposals = matchingContracts.map((c: any) => ({
              id: c.id,
              bandName: c.band_name || 'Hiring Band',
              projectType: c.creative_category === 'visual' ? 'Logo & Custom Cover Merch illustration' :
                           c.creative_category === 'audio' ? 'FOH Playback Mix Support & EQ check' : 'Promotional Tour Video Teaser',
              deadline: `${c.timeline_days || 5} Days`,
              description: c.project_title || 'Direct hired creative contract with quality control protocols.',
              proposedFee: `$${c.fee || 250} USD`,
              status: 'accepted' as const
            }));

            // Sync released IDs to releasedEscrowProjIds to render released screens correctly
            matchingContracts.forEach((c: any) => {
              if (c.status === 'released' && !releasedEscrowProjIds.includes(c.id)) {
                setReleasedEscrowProjIds(prev => [...prev, c.id]);
              } else if (c.status !== 'released' && releasedEscrowProjIds.includes(c.id)) {
                setReleasedEscrowProjIds(prev => prev.filter(uid => uid !== c.id));
              }
            });

            // Map enforced and verified protocol collections
            const enforcedMap: Record<string, Record<string, boolean>> = {};
            const verifiedMap: Record<string, Record<string, boolean>> = {};
            matchingContracts.forEach((c: any) => {
              enforcedMap[c.id] = c.enforced_protocols || {};
              verifiedMap[c.id] = c.verified_protocols || {};
            });
            setProposalEnforcedProtocols(prev => ({ ...prev, ...enforcedMap }));
            setProposalVerifiedProtocols(prev => ({ ...prev, ...verifiedMap }));

            // Update local proposals state by merging
            setProposals(prev => {
              const baseProposals = prev.filter(p => !p.id.startsWith('contract-') && !p.id.startsWith('con-') && !(contractProposals || []).some(cp => cp.id === p.id));
              return [...baseProposals, ...contractProposals];
            });
          }
        }
      } catch (err) {
        console.warn('Sandbox contract ledger sync warning:', err);
      }
    };

    // Run every 3.5 seconds to query updates
    syncSharedContracts();
    const interval = setInterval(syncSharedContracts, 3500);
    return () => clearInterval(interval);
  }, [userProfile?.id, displayName, JSON.stringify(releasedEscrowProjIds)]);

  // Sync state changes with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_balance_${userProfile?.id || 'default'}`, String(clearedBalance));
    } catch (_) {}
  }, [clearedBalance, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_gigs_applied_${userProfile?.id || 'default'}`, JSON.stringify(appliedGigIds));
    } catch (_) {}
  }, [appliedGigIds, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_pitch_templates_${userProfile?.id || 'default'}`, JSON.stringify(pitchTemplates));
    } catch (_) {}
  }, [pitchTemplates, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_portfolio_${userProfile?.id || 'default'}`, JSON.stringify(portfolioItems));
    } catch (_) {}
  }, [portfolioItems, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_gallery_${userProfile?.id || 'default'}`, JSON.stringify(galleryItems));
    } catch (_) {}
  }, [galleryItems, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_creative_proposals_${userProfile?.id || 'default'}`, JSON.stringify(proposals));
    } catch (_) {}
  }, [proposals, userProfile?.id]);

  // Synchronize state from userProfile object changes and creatives table
  useEffect(() => {
    if (userProfile) {
      setDisplayName(upAny.creative_name || upAny.creativeName || userProfile.name || '');
      setAvatarUrl(upAny.creative_avatar || userProfile.creative_avatar || '');
      if (upAny.creative_business_name || upAny.creative_metadata?.business_name || userProfile.name) {
        setBusinessName(upAny.creative_business_name || upAny.creative_metadata?.business_name || upAny.creative_name || 'Vortex Graphics');
      }
      if (upAny.creative_handle || upAny.creative_slug || upAny.custom_slug || userProfile.console_handle) {
        setCreativeHandle(upAny.creative_handle || upAny.creative_slug || upAny.custom_slug || userProfile.console_handle || 'vortexgraphics');
      }
    }

    async function loadCreativeLedger() {
      const supabase = getSupabase();
      if (!supabase || !userProfile?.id) return;
      try {
        const creativeIdToQuery = upAny.creative_id || upAny.registered_creative_id;
        let query = supabase.from('creatives').select('*');
        if (creativeIdToQuery) {
          query = query.or(`id.eq.${creativeIdToQuery},creator_id.eq.${userProfile.id}`);
        } else {
          query = query.eq('creator_id', userProfile.id);
        }
        const { data } = await query.maybeSingle();

        let creativeRow = data;
        if (!creativeRow) {
          creativeRow = await autoSyncCreativeProfile(userProfile);
        }

        if (creativeRow) {
          if (creativeRow.business_name || creativeRow.creative_name || creativeRow.name) {
            setBusinessName(creativeRow.business_name || creativeRow.creative_name || creativeRow.name || '');
            setDisplayName(creativeRow.creative_name || creativeRow.business_name || creativeRow.name || '');
          }
          if (creativeRow.handle || creativeRow.slug || creativeRow.custom_slug || creativeRow.console_handle) {
            setCreativeHandle(creativeRow.handle || creativeRow.slug || creativeRow.custom_slug || creativeRow.console_handle);
          }
          if (creativeRow.booking_email) setBookingEmail(creativeRow.booking_email);
          if (creativeRow.base_location || creativeRow.location) setBaseLocation(creativeRow.base_location || creativeRow.location);
          if (creativeRow.portfolio_link || creativeRow.website) setPortfolioLink(creativeRow.portfolio_link || creativeRow.website);
          if (creativeRow.biography || creativeRow.bio) setBio(creativeRow.biography || creativeRow.bio);
          if (creativeRow.day_rate || creativeRow.base_rate_value) setDayRate(String(creativeRow.day_rate || creativeRow.base_rate_value));
          if (creativeRow.pricing_notes) setPricingNotes(creativeRow.pricing_notes);
          if (Array.isArray(creativeRow.skills) && creativeRow.skills.length > 0) setSelectedSkills(creativeRow.skills);
          if (Array.isArray(creativeRow.gear) && creativeRow.gear.length > 0) setGearTags(creativeRow.gear);
          if (creativeRow.avatar_url) setAvatarUrl(creativeRow.avatar_url);
        }
      } catch (err) {
        console.warn('Creative ledger query bypass:', err);
      }
    }

    loadCreativeLedger();
  }, [userProfile?.id, upAny?.creative_id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        safeTriggerNotification('Error: image file cannot exceed 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 800, 800, 0.92);
            const publicUrl = await uploadBase64ToStorage(compressed, 'avatars', userProfile.id, 'creative-avatar');
            if (publicUrl) {
              setAvatarUrl(publicUrl);
              setUserProfile((prev: any) => ({
                ...prev,
                creative_avatar: publicUrl
              }));
              const supabase = getSupabase();
              if (supabase && userProfile?.id) {
                const creativeIdToUse = upAny.creative_id || upAny.registered_creative_id || userProfile?.id;
                
                // 1. Separate Creative Payload: upsert only to creatives table
                const cleanCreative = formatCreativePayload({
                  id: creativeIdToUse,
                  avatar_url: publicUrl,
                  creative_avatar: publicUrl,
                  name: displayName || userProfile?.creative_name || userProfile?.name,
                  business_name: businessName || (userProfile as any)?.creative_business_name || userProfile?.full_name,
                  creator_id: userProfile.id,
                  user_id: userProfile.id
                }, creativeIdToUse, userProfile.id);
                await executeWithSchemaResilience(
                  async (p) => supabase.from('creatives').upsert(p, { onConflict: 'id' }),
                  cleanCreative
                );
              }
              safeTriggerNotification('✓ Creative logo updated and saved.');
            }
          } catch (err) {
            console.error('Profile photo upload error:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        safeTriggerNotification('Error: image file cannot exceed 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 1920, 1080, 0.92);
            const publicUrl = await uploadBase64ToStorage(compressed, 'bannersv2', userProfile.id, 'creative-banner');
            setUserProfile((prev: any) => ({
              ...prev,
              creative_banner: publicUrl
            }));
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              const creativeIdToUse = upAny.creative_id || upAny.registered_creative_id || userProfile?.id;
              const cleanCreative = formatCreativePayload({
                id: creativeIdToUse,
                banner_url: publicUrl,
                creative_banner: publicUrl,
                cover_url: publicUrl,
                creator_id: userProfile.id,
                user_id: userProfile.id
              }, creativeIdToUse, userProfile.id);
              await executeWithSchemaResilience(
                async (p) => supabase.from('creatives').upsert(p, { onConflict: 'id' }),
                cleanCreative
              );
            }
            safeTriggerNotification('✓ Creative cover banner updated.');
          } catch (err) {
            console.error('Banner upload error:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle saving profile changes
  const handleSaveProfile = async (overrides?: Partial<{
    payout_method: 'stripe' | 'paypal' | 'none';
    stripe_account_id: string;
    paypal_email: string;
    selected_skills: string[];
    availability_status: string;
    quick_broadcast: string;
  }>) => {
    const updatedMetadata = {
      ...userProfile.creative_metadata,
      business_name: businessName,
      booking_email: bookingEmail,
      base_location: baseLocation,
      portfolio_link: portfolioLink,
      bio: bio,
      day_rate: String(dayRate),
      pricing_notes: pricingNotes,
      selected_skills: overrides?.selected_skills !== undefined ? overrides.selected_skills : selectedSkills,
      genre_tags: genreTags,
      gear_tags: gearTags,
      primary_category: primaryCategory,
      secondary_category: secondaryCategory,
      availability_status: overrides?.availability_status !== undefined ? overrides.availability_status : availabilityStatus,
      quick_broadcast: overrides?.quick_broadcast !== undefined ? overrides.quick_broadcast : quickBroadcast,
      payout_method: overrides?.payout_method !== undefined ? overrides.payout_method : payoutMethod,
      stripe_account_id: overrides?.stripe_account_id !== undefined ? overrides.stripe_account_id : stripeAccountId,
      paypal_email: overrides?.paypal_email !== undefined ? overrides.paypal_email : paypalEmail
    };

    const creativeIdToUse = upAny.creative_id || upAny.registered_creative_id || userProfile?.id;

    const nextWorkspaces = Array.from(new Set([...(userProfile.registered_workspaces || []), 'creative']));
    const nextAllowed = Array.from(new Set([...(userProfile.allowed_workspaces || []), 'creative']));

    setUserProfile((prev: any) => ({
      ...prev,
      creative_id: creativeIdToUse,
      creative_name: displayName,
      creative_business_name: businessName,
      creative_handle: creativeHandle,
      creative_avatar: avatarUrl || prev.creative_avatar,
      creative_banner: prev.creative_banner,
      registered_workspaces: nextWorkspaces,
      allowed_workspaces: nextAllowed
    }));

    // Persist to Supabase
    const supabase = getSupabase();
    if (supabase && userProfile?.id) {
      try {
        // 1. Separate Creative Payload: Update/Upsert the creatives table separately with ONLY creative-specific fields
        const creativePayload = formatCreativePayload({
          id: creativeIdToUse,
          creator_id: userProfile.id,
          user_id: userProfile.id,
          name: businessName || displayName || (userProfile as any).creative_name || userProfile.name,
          business_name: businessName || displayName,
          creative_name: displayName || businessName,
          handle: creativeHandle || upAny.creative_handle || userProfile.console_handle,
          creative_handle: creativeHandle || upAny.creative_handle || userProfile.console_handle,
          avatar_url: avatarUrl || upAny.creative_avatar || null,
          banner_url: upAny.creative_banner || null,
          creative_avatar: avatarUrl || upAny.creative_avatar || null,
          creative_banner: upAny.creative_banner || null,
          specialty: primaryCategory || 'visual',
          category: primaryCategory || 'visual',
          primary_category: primaryCategory || 'visual',
          skills: updatedMetadata.selected_skills || [],
          primary_gear: updatedMetadata.gear_tags?.[0] || '',
          gear: updatedMetadata.gear_tags || [],
          biography: bio,
          bio: bio,
          custom_slug: creativeHandle,
          slug: creativeHandle,
          day_rate: updatedMetadata.day_rate,
          base_rate_value: Number(updatedMetadata.day_rate) || 0,
          rate_range: updatedMetadata.day_rate ? `$${updatedMetadata.day_rate} / Day` : '$350 / Day',
          pricing_notes: updatedMetadata.pricing_notes,
          booking_email: updatedMetadata.booking_email,
          base_location: updatedMetadata.base_location,
          location: updatedMetadata.base_location,
          portfolio_link: updatedMetadata.portfolio_link,
          website: updatedMetadata.portfolio_link,
        }, creativeIdToUse, userProfile.id);
        
        await executeWithSchemaResilience(async (payload) => supabase.from('creatives').upsert(payload, { onConflict: 'id' }), creativePayload);
        console.log('✓ Successfully synced creative specifications directly to creatives table.');

        // Brief delay before updating profiles table to ensure PostgREST foreign key cache registers the creative row
        await new Promise(r => setTimeout(r, 300));

        // 2. Separate Profile Payload: Update the profiles table with ONLY global user fields
        const globalProfilePayload = extractGlobalProfilePayload({
          id: userProfile.id,
          creative_id: creativeIdToUse,
          creative_name: displayName,
          registered_workspaces: nextWorkspaces,
          allowed_workspaces: nextAllowed
        }, userProfile.id);

        await executeWithSchemaResilience(
          async (p) => supabase.from('profiles').update(p).eq('id', userProfile.id),
          globalProfilePayload
        );
      } catch (err) {
        console.error('Failed to update Supabase creative profile:', err);
      }
    }
  };

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortTitle.trim()) return;
    const newItem = {
      id: `port-${Date.now()}`,
      title: newPortTitle.trim(),
      client: newPortClient.trim() || 'Self initiated',
      link: newPortLink.trim() || '#',
      year: newPortYear,
      completed: true
    };
    setPortfolioItems(prev => [newItem, ...prev]);
    setNewPortTitle('');
    setNewPortClient('');
    setNewPortLink('');
    triggerNotification('🎨 Portfolio asset published to directory stream.');
    safeAddLog(`Published new portfolio work "${newItem.title}" to public profile.`);
  };

  const handleDeletePortfolio = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
    triggerNotification('Portfolio item removed.');
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalTitle.trim()) return;

    if (galUploadMethod === 'external') {
      if (!externalEmbedUrl.trim()) {
        triggerNotification('Please provide a valid YouTube, Vimeo, Spotify, or SoundCloud URL.');
        return;
      }
      if (galleryItems.length >= 24) {
        triggerNotification('You can only upload up to 24 items in your gallery.');
        return;
      }

      const embed = getEmbedData(externalEmbedUrl);
      const newItem = {
        id: `gal-${Date.now()}-${Math.random()}`,
        title: newGalTitle.trim(),
        subtitle: newGalSubtitle.trim(),
        imageUrl: embed.thumbnailUrl,
        externalUrl: externalEmbedUrl.trim(),
        mediaType: 'external',
        year: newGalYear,
        genre: newGalGenre,
        microGenre: newGalMicroGenre,
        fileFrame: `${embed.type.toUpperCase()}_EMBED_STREAM`
      };

      setGalleryItems(prev => {
        const updated = [...prev, newItem];
        setActiveSlideIndex(prev.length);
        return updated;
      });

      setNewGalTitle('');
      setNewGalSubtitle('');
      setExternalEmbedUrl('');
      triggerNotification('🚀 Direct streaming reference published to dynamic lookbook feed!');
      safeAddLog(`Linked external ${embed.type} streaming reference "${newGalTitle}" is now live.`);
      return;
    }

    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      triggerNotification('Please select at least one image file.');
      return;
    }

    if (galleryItems.length + files.length > 24) {
      triggerNotification('You can only upload up to 24 images in your gallery.');
      return;
    }

    const processedItems: any[] = [];
    const filesArray = Array.from(files);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i] as any;
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const mediaType = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      const fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      let finalUrl = fileDataUrl;
      if (mediaType === 'image') {
        try {
          finalUrl = await compressImage(fileDataUrl, 800, 800, 0.7);
        } catch (_) {}
      }

      const newItem = {
        id: `gal-${Date.now()}-${Math.random()}`,
        title: newGalTitle.trim(),
        subtitle: newGalSubtitle.trim(),
        imageUrl: finalUrl,
        mediaType,
        year: newGalYear,
        genre: newGalGenre,
        microGenre: newGalMicroGenre,
        fileFrame: file.name || 'artwork_asset.tiff'
      };
      processedItems.push(newItem);
    }

    setGalleryItems(prev => {
      const updated = [...prev, ...processedItems];
      setActiveSlideIndex(prev.length);
      return updated;
    });

    setNewGalTitle('');
    setNewGalSubtitle('');
    setNewGalYear('2026');
    if (fileInputRef.current) fileInputRef.current.value = '';
    triggerNotification('📸 Added new showcase items to your professional media gallery!');
    safeAddLog(`Published new media showcase "${newGalTitle}" with genre ${newGalGenre} (${newGalMicroGenre}) to digital portfolio.`);
  };

  const handleDeleteGalleryItem = (id: string) => {
    const updated = galleryItems.filter(item => item.id !== id);
    setGalleryItems(updated);
    if (activeSlideIndex >= updated.length) {
      setActiveSlideIndex(Math.max(0, updated.length - 1));
    }
    
    // Clean up lookbook if deleted
    try {
      const key = 'nexus_core_lookbook_feed';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((l: any) => l.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      setActiveLookbookItemIds(prev => prev.filter(itemId => itemId !== id));
    } catch (_) {}

    triggerNotification('Showcase gallery item deleted.');
  };

  const handleProposalStatus = (id: string, status: 'accepted' | 'declined') => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    safeTriggerNotification(`Propose status: ${status.toUpperCase()}`);
    safeAddLog(`Responded ${status} to booking offer from "${proposals.find(p => p.id === id)?.bandName || 'Client'}"`);
  };

  const handleApplyGig = (gigId: string, customText?: string) => {
    if (appliedGigIds.includes(gigId)) return;
    if (customText === undefined) {
      const gigObj = SAMPLE_GIG_LEADS.find(g => g.id === gigId);
      if (gigObj) {
        setApplyingGig(gigObj);
        setCustomPitchLetter(pitchTemplates[0]?.content || '');
        setSelectedTemplateIndex(0);
      }
      return;
    }
    setAppliedGigIds(prev => [...prev, gigId]);
    safeTriggerNotification('⚡ Live application pitch transmitted!');
    const gigObj = SAMPLE_GIG_LEADS.find(g => g.id === gigId);
    safeAddLog(`Submitted placement pitch for premium gig slot: "${gigObj?.title}". Pitch: "${customText.substring(0, 80)}..."`);
    setApplyingGig(null);
  };

  // Filter and split gig leads based on active category specialty
  const matchingGigs = SAMPLE_GIG_LEADS.filter(gig => gig.category === primaryCategory);
  
  const secondaryMatchingGigs = secondaryCategory 
    ? SAMPLE_GIG_LEADS.filter(gig => gig.category === secondaryCategory) 
    : [];

  const otherGigs = SAMPLE_GIG_LEADS.filter(
    gig => gig.category !== primaryCategory && gig.category !== secondaryCategory
  );

  const secondaryGigsCount = secondaryMatchingGigs.length;
  const hasSecondaryAlerts = secondaryGigsCount > 0;

  const renderGigItem = (gig: typeof SAMPLE_GIG_LEADS[0], listType = 'gig', idx = 0) => {
    const hasApplied = appliedGigIds.includes(gig.id);
    const isExpanded = !!expandedGigs[gig.id];
    
    const isMatching = gig.category === primaryCategory;
    
    // Choose custom border / accent colors for other available jobs based on category
    let borderColor = 'border-zinc-800/80';
    let hoverBorderColor = 'hover:border-zinc-400';
    let dotColor = 'bg-zinc-400';
    let textColor = 'text-zinc-400';
    let shadowGlow = 'shadow-[0_4px_30px_rgba(200,200,200,0.05)]';

    if (gig.category === 'Artist/Designer') {
      borderColor = 'border-fuchsia-500/40';
      hoverBorderColor = 'hover:border-fuchsia-400/80 hover:shadow-[0_4px_30px_rgba(217,70,239,0.15)]';
      dotColor = 'bg-fuchsia-400';
      textColor = 'text-fuchsia-400';
    } else if (gig.category === 'Sound Engineer/Recording') {
      borderColor = 'border-teal-500/40';
      hoverBorderColor = 'hover:border-teal-400/80 hover:shadow-[0_4px_30px_rgba(20,184,166,0.15)]';
      dotColor = 'bg-teal-400';
      textColor = 'text-teal-400';
    } else if (gig.category === 'Media/Photography') {
      borderColor = 'border-orange-500/40';
      hoverBorderColor = 'hover:border-orange-400/80 hover:shadow-[0_4px_30px_rgba(249,115,22,0.15)]';
      dotColor = 'bg-orange-400';
      textColor = 'text-orange-400';
    }

    const currentStyles = isMatching ? {
      bg: 'bg-gradient-to-br from-[#1f1a0a] via-[#0d0a04] to-[#07080a] border-yellow-500/40 shadow-[0_4px_30px_rgba(234,179,8,0.15)]',
      hover: 'hover:border-yellow-400/80 hover:shadow-[0_4px_45px_rgba(234,179,8,0.25)] animate-[pulse_3s_ease-in-out_infinite]',
      color: 'text-yellow-400',
      dot: 'bg-yellow-400',
      isMetallic: true,
      isSilver: false
    } : {
      bg: `bg-gradient-to-br from-[#ebecef]/25 via-white/[0.08] to-[#0b0c0f] ${borderColor} ${shadowGlow}`,
      hover: `${hoverBorderColor}`,
      color: textColor,
      dot: dotColor,
      isMetallic: false,
      isSilver: true
    };

    return (
      <div key={`gig-${listType}-${gig.id}-${idx}`} className={`${currentStyles.bg} ${currentStyles.hover} border rounded-2xl transition-all duration-300 relative overflow-hidden group`}>
        <div className="bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:16px_16px] absolute inset-0 rounded-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] rounded-bl-full pointer-events-none" />
        
        {/* Top Half - Clickable Header Box */}
        <div 
          onClick={() => setExpandedGigs(prev => ({ ...prev, [gig.id]: !prev[gig.id] }))}
          className="p-5 cursor-pointer select-none relative z-10 flex justify-between items-start gap-4"
          title={isExpanded ? "Click to collapse job details" : "Click to expand job details"}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-mono bg-zinc-950/70 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded flex items-center gap-1.5 font-bold shadow-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${currentStyles.dot} animate-pulse shrink-0`} />
                {gig.difficulty}
              </span>
              <span className="text-[9.5px] font-mono text-zinc-400 uppercase">
                📍 {gig.region}
              </span>
            </div>
            <h3 className={`text-xs sm:text-sm font-black uppercase font-mono mt-2.5 tracking-wide leading-snug transition-colors ${currentStyles.isMetallic ? 'bg-gradient-to-r from-yellow-100 via-yellow-400 to-amber-500 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : currentStyles.isSilver ? 'bg-gradient-to-r from-white via-zinc-100 via-white to-zinc-350 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white group-hover:text-fuchsia-400'}`}>{gig.title}</h3>
            <p className="text-[11px] font-mono text-zinc-400">Client Hub: <strong className="text-fuchsia-300 font-medium">{gig.client}</strong></p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="text-right">
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 block tracking-wide">{gig.budget}</span>
              <span className="text-[9.5px] font-mono text-zinc-550 block font-bold mt-0.5">{gig.timeline}</span>
            </div>
            <div className="text-zinc-500 group-hover:text-zinc-300 pt-0.5 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-fuchsia-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-fuchsia-400 transition-colors" />
              )}
            </div>
          </div>
        </div>

        {/* Collapsible/Expandable Bottom Half with Animation */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-3.5 border-t border-zinc-900/60 space-y-3.5">
                <p className="text-xs text-zinc-400 leading-relaxed font-sans relative z-10">
                  {gig.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900/60 pt-3 relative z-10 select-none">
                  <div className="flex flex-wrap gap-1">
                    {gig.tags.map((t, tIdx) => (
                      <span key={`${t}-${tIdx}`} className="bg-zinc-950 border border-zinc-850 text-[9px] text-zinc-400 hover:text-white px-2.5 py-0.5 rounded font-mono transition-colors shadow">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    disabled={hasApplied}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyGig(gig.id);
                    }}
                    className={`text-[10px] font-mono font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      hasApplied 
                        ? 'bg-zinc-900/70 border border-zinc-850 text-zinc-650 cursor-not-allowed flex items-center gap-1.5' 
                        : 'bg-fuchsia-900/20 hover:bg-fuchsia-900/40 border border-fuchsia-500/50 hover:border-fuchsia-400 text-white active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-fuchsia-950/40'
                    }`}
                  >
                    {hasApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        PITCH TRANSMITTED
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 text-fuchsia-400" />
                        SUBMIT ENROLL PITCH
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-100 flex flex-col items-center selection:bg-fuchsia-500/30 selection:text-fuchsia-400">
      {/* STICKY TOP HEADER ROW */}
      <div className="sticky top-0 z-20 bg-[#0c0e12]/95 backdrop-blur-md border-b border-zinc-900 w-full shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Row 1: BRAND NAVIGATION HEADER */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[#1b1e25] bg-black">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('JOBS');
                setSubTab('');
              }}
              className="flex items-center select-none shrink-0 cursor-pointer hover:opacity-85 active:scale-98 transition-all focus:outline-none"
              title="Return to Home Dashboard"
            >
              <img 
                src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png" 
                alt="Nexus Core" 
                className="object-contain"
                style={{ width: '154.791px', height: '57.9957px' }}
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('SETTINGS');
                setSubTab('team_subscription');
              }}
              className="rounded-full px-2 py-0.5 flex items-center gap-1.5 transition text-[7.5px] sm:text-[8px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 shadow-fuchsia-500/5 shadow-[0_0_6px_rgba(217,70,239,0.1)]"
            >
              <span className="w-1 h-1 rounded-full animate-pulse bg-fuchsia-500 shadow-[0_0_4px_rgba(217,70,239,0.8)] shrink-0" />
              <span className="hidden sm:inline">Owner</span>
              <span className="sm:hidden font-mono">OWNER</span>
              <span className="text-fuchsia-500/40 text-[7.5px]">•</span>
              <span className="text-fuchsia-400">LEVEL 5 CLEARANCE</span>
            </button>
          </div>
        </div>

        {/* Row 2: V2 Header Row */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900/60">
          {/* Active stats pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 text-[8.5px] font-bold uppercase tracking-wider font-mono shrink-0 transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 shadow-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_8px_#d946ef]" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none mr-0.5">CREATIVE HQ:</span>
            <span className="truncate max-w-[150px] text-fuchsia-400 font-black uppercase">
              CREATIVE PORTFOLIO
            </span>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all text-[8.5px] font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                <div className="relative">
                  <Bell className="w-3.5 h-3.5" />
                  {notifications && (notifications || []).some(n => !n.is_read) && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse shadow-[0_0_8px_#d946ef]" />
                  )}
                </div>
                <span>NOTICES</span>
              </button>
            )}
            
            {/* Interactive Profile Avatar Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setV2RoleMenuOpen(!v2RoleMenuOpen)}
                className="w-8 h-8 rounded-full bg-fuchsia-950/40 border border-fuchsia-500/50 flex items-center justify-center font-black text-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all active:scale-95 overflow-hidden shadow-md cursor-pointer hover:border-fuchsia-400"
              >
                {userProfile.creative_avatar || userProfile.avatar_url ? (
                  <img src={userProfile.creative_avatar || userProfile.avatar_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <Globe className="w-4 h-4 text-fuchsia-500" />
                )}
              </button>

              <AnimatePresence>
                {v2RoleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[99990] bg-black/60 backdrop-blur-[2px]" onClick={() => setV2RoleMenuOpen(false)} />
                    <div className="fixed top-[92px] right-4 sm:right-6 w-80 bg-[#09090b] border border-zinc-800 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.95)] z-[99999] text-left animate-in fade-in slide-in-from-top-3 duration-200">
                      <button onClick={() => setV2RoleMenuOpen(false)} className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-full transition-all cursor-pointer z-10"><X className="w-3.5 h-3.5" /></button>
                      
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                        <label className="relative shrink-0 cursor-pointer group">
                          <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900/90 overflow-hidden flex items-center justify-center font-bold text-fuchsia-500 text-sm font-mono uppercase relative">
                            {userProfile.creative_avatar || userProfile.avatar_url ? (
                              <img src={userProfile.creative_avatar || userProfile.avatar_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <Globe className="w-4 h-4 text-fuchsia-500" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImageUpload(e); setV2RoleMenuOpen(false); }} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[7px] uppercase font-bold text-fuchsia-400">
                              Edit
                            </div>
                          </div>
                        </label>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-black text-zinc-100 truncate uppercase tracking-tight">
                            {businessName || userProfile.creative_metadata?.business_name || userProfile.creative_name || 'Vortex Graphics'}
                          </p>
                          <p className="text-[8.5px] text-zinc-500 font-mono truncate">
                            slug: {creativeHandle || userProfile.console_handle || userProfile.screen_name || 'vortexgraphics'}
                          </p>
                        </div>
                        <span className="bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[8px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
                          SECURE NODE
                        </span>
                      </div>

                      <div className="pt-3 pb-3 border-b border-zinc-800/80">
                        <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase mb-1.5">PUBLIC IDENTITY</span>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setV2RoleMenuOpen(false);
                              handleOpenMyCreativeProfile();
                            }}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black font-mono tracking-wider text-[10px] uppercase cursor-pointer shadow-[0_0_12px_rgba(217,70,239,0.4)] hover:shadow-[0_0_18px_rgba(217,70,239,0.6)] transition-all transform active:scale-95"
                          >
                            🌐 VIEW MY PROFILE
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 pb-3 border-b border-zinc-800/80 space-y-2">
                        <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase">SWITCH ACTIVE PORTAL</span>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            { key: 'industry_pro', icon: '🎟️', name: 'Industry Pro', desc: 'Active social environment', bgClass: 'bg-rose-950/40 text-rose-400 border-rose-500/30', hoverBorderClass: 'hover:border-rose-500/50', textClass: 'text-rose-400', activeIndicator: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' },
                            { key: 'fan_only', icon: '💙', name: 'Fan-Only Profile', desc: 'Royal Blue fan community', bgClass: 'bg-blue-950/40 text-blue-400 border-blue-500/30', hoverBorderClass: 'hover:border-blue-500/50', textClass: 'text-blue-400', activeIndicator: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' },
                            { key: 'band', icon: '🎸', name: 'Band / Artist Workspace', desc: 'Lineup, repertoire & presets', bgClass: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/30', hoverBorderClass: 'hover:border-[#39ff14]/50', textClass: 'text-[#39ff14]', activeIndicator: 'bg-[#39ff14] shadow-[0_0_8px_#39ff14]' },
                            { key: 'promoter', icon: '🏟️', name: 'Venue Promoter Gateway', desc: 'Calendars, lineups & finance', bgClass: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30', hoverBorderClass: 'hover:border-yellow-500/50', textClass: 'text-yellow-400', activeIndicator: 'bg-yellow-500 shadow-[0_0_8px_#eab308]' },
                            { key: 'creative', icon: '🛠️', name: 'Creative Hub & Crew', desc: 'Contracts, portfolio & sound crew', bgClass: 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-500/30', hoverBorderClass: 'hover:border-fuchsia-500/50', textClass: 'text-fuchsia-400', activeIndicator: 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' },
                            { key: 'label', icon: '💿', name: 'Record Label Console', desc: 'Oversee rosters & releases', bgClass: 'bg-orange-950/40 text-orange-400 border-orange-500/30', hoverBorderClass: 'hover:border-orange-500/50', textClass: 'text-orange-400', activeIndicator: 'bg-orange-500 shadow-[0_0_8px_#f97316]' }
                          ].map((portal, idx) => {
                            const registeredWorkspaces = userProfile?.registered_workspaces || [];
                            const allowedWorkspaces = userProfile?.allowed_workspaces || [];
                            const currentRole = userProfile?.active_workspace || userProfile?.account_type;
                            const isActive = currentRole === portal.key || (portal.key === 'fan_only' && (currentRole === 'fan' || currentRole === 'fan_only')) || (portal.key === 'industry_pro' && (currentRole === 'industry_pro' || currentRole === 'industry pro'));
                            const isIndustryPro = userProfile?.account_type === 'industry_pro' ||
                              ['band', 'promoter', 'creative', 'label'].includes(userProfile?.account_type) ||
                              ['band', 'promoter', 'creative', 'label'].some(w => hasRegisteredWorkspace(userProfile, w));

                            if (portal.key === 'fan_only' && isIndustryPro) {
                              return (
                                <div key={`portal-locked-${portal.key}-${idx}`} className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950/20 border border-zinc-900/30 text-zinc-650 opacity-40 select-none cursor-not-allowed">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs grayscale opacity-50">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{portal.name}</p>
                                      <p className="text-[8px] font-mono leading-none text-zinc-600">downgrade not possible</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-mono text-zinc-700">LOCKED</span>
                                </div>
                              );
                            }
                            const isAllowed = (portal.key === 'industry_pro' || portal.key === 'fan' || portal.key === 'fan_only') || (
                              hasRegisteredWorkspace(userProfile, portal.key) || 
                              (userProfile?.email === 'admin@nexus.com' || userProfile?.account_type === 'admin')
                            );

                            if (isActive) {
                              return (
                                <div key={`portal-active-${portal.key}-${idx}`} className={`w-full flex items-center justify-between p-2 rounded-xl ${portal.bgClass} border ${portal.hoverBorderClass.replace('hover:', '')} ${portal.textClass}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                      <p className="text-[8px] opacity-80 font-mono leading-none">Active Environment</p>
                                    </div>
                                  </div>
                                  <span className={`w-1.5 h-1.5 rounded-full ${portal.activeIndicator} animate-pulse`} />
                                </div>
                              );
                            }

                            if (isAllowed) {
                              return (
                                <button
                                  key={`portal-btn-${portal.key}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setV2RoleMenuOpen(false);
                                    const targetAcc = (portal.key === 'fan' || portal.key === 'fan_only') ? 'fan_only' : (portal.key === 'industry_pro') ? 'industry_pro' : portal.key;
                                    const updated = { ...userProfile, account_type: targetAcc as any, active_workspace: portal.key as any };
                                    setUserProfile(updated);
                                    try { localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated)); } catch (_) {}
                                    window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                                    const supabase = getSupabase();
                                    if (supabase && userProfile.id) {
                                      supabase.from('profiles').update({ account_type: targetAcc, active_workspace: portal.key }).eq('id', userProfile.id).then(() => {});
                                    }
                                    triggerNotification?.(`⚡ Switched to ${portal.name}.`);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 ${portal.hoverBorderClass} text-zinc-400 hover:text-white transition-all cursor-pointer group`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs group-hover:scale-110 transition-transform">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                      <p className="text-[8px] text-zinc-500 font-mono leading-none">{portal.desc}</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            }

                            // Not allowed/locked
                            return (
                              <button
                                key={`${portal.key}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setV2RoleMenuOpen(false);
                                  triggerNotification?.(`💡 Upgrade clearance to unlock ${portal.name}.`);
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl bg-black/40 border border-zinc-950 text-zinc-550 hover:text-zinc-400 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs group-hover:scale-110 transition-transform">{portal.icon}</span>
                                  <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                    <p className="text-[8px] text-zinc-650 font-mono leading-none">Upgrade to Unlock</p>
                                  </div>
                                </div>
                                <Lock className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          onClick={onLogout}
                          className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-950/10 hover:bg-rose-950/20 text-rose-400 font-bold hover:text-white text-center transition-all cursor-pointer active:scale-98"
                        >
                          LOGOUT CORE SESSION
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Glowing Icon Navigation Bar */}
        <div className="flex items-center justify-around px-2 py-1 relative w-full bg-[#0c0e12]">
          {[
            { id: 'JOBS', label: 'Jobs', icon: Briefcase },
            { id: 'BOOKINGS', label: 'Bookings', icon: Calendar },
            { id: 'PORTFOLIO', label: 'Portfolio', icon: Palette },
            { id: 'TEAMS', label: 'Teams', icon: Users },
            { id: 'SOCIAL', label: 'Social', icon: Globe },
            { id: 'SETTINGS', label: 'Settings', icon: Settings },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => {
                  if (item.id === 'SOCIAL') {
                    if (setPortalActiveTab) {
                      setPortalActiveTab('social');
                      return;
                    }
                  }
                  setActiveTab(item.id as any);
                  setSubTab('');
                }}
                className="flex flex-col items-center justify-center w-full py-2 group relative transition-colors cursor-pointer"
              >
                {isActive && (
                  <div className="absolute inset-0 bg-fuchsia-500/10 blur-xl rounded-full w-10 h-10 mx-auto -z-10 animate-pulse" />
                )}
                <IconComponent className={`w-5 h-5 mb-1 transition-all ${
                  isActive
                    ? 'text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] scale-110'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`} />
                <span className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors ${
                  isActive ? 'text-fuchsia-500 font-black' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-8 h-[3px] bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.8)] rounded-t-full absolute bottom-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: ACTIVE LABEL CONSOLE BLOCK */}
      <div 
        className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 py-2"
      >
        <div className="flex items-center gap-3 w-full min-w-0 border-b border-zinc-900/60 pb-2">
          <div className="min-w-0 max-w-[calc(100%-140px)] flex-grow">
            <MarqueeText 
              text={businessName || userProfile.creative_metadata?.business_name || userProfile.creative_name || 'Vortex Graphics'}
              className="font-display font-black tracking-wider text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.65)] uppercase font-sans text-[18px]"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fuchsia-500/20 bg-fuchsia-950/15 text-fuchsia-400 text-[8.5px] font-bold uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(217,70,239,0.15)] select-none">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-fuchsia-500 shadow-[0_0_8px_#d946ef]" />
              <span>LIVE CLOUD SYNC</span>
            </div>
          </div>
        </div>
      </div>

      <main className={`w-full mx-auto flex-1 flex flex-col gap-6 ${
        activeTab === 'SETTINGS'
          ? 'max-w-full p-0 sm:p-0 pb-2'
          : (activeTab === 'SOCIAL') 
            ? 'max-w-full p-0 sm:p-0 pb-16' 
            : 'max-w-[1480px] p-4 sm:p-6 pb-16'
      }`}>
        {/* Content Viewport */}
        
      
      <section className="min-h-[500px] w-full">

          {activeTab === 'JOBS' && (
            <div className="space-y-6">
              {/* MOBILE ONLY PROFILE HEADER */}
              <div className="block lg:hidden tab-chase-border-fuchsia pulse-glow-magenta w-full shadow-2xl mb-6">
                <div className="backdrop-blur-md rounded-[calc(1rem-2px)] bg-[#090b0e]/95 flex flex-col items-center sm:items-stretch justify-between gap-5 relative overflow-hidden p-5 sm:p-6 w-full shadow-2xl border border-zinc-800/10" id="label-profile-card-mobile-v2">
                  {/* Optional Cover Image in Top Half with bottom fade-out */}
                  {(userProfile.creative_banner || userProfile.banner_url) && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0">
                      <img 
                        src={userProfile.creative_banner || userProfile.banner_url} 
                        alt="Label Banner" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/50 to-[#090b0e]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(#d946ef07_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" id="label-tonal-mobile" />
                  <div className="absolute top-0 right-1/4 w-[200px] h-[200px] rounded-full bg-[#d946ef]/5 blur-[70px] pointer-events-none" />

                  {/* Upper Action Buttons - Administration Tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                    <button
                      type="button"
                      onClick={handleOpenMyCreativeProfile}
                      className="bg-fuchsia-950/60 hover:bg-fuchsia-900/80 border border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-black text-[9px] font-mono font-bold uppercase tracking-wider"
                      title="View Public Profile Card"
                    >
                      <Globe className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>CARD</span>
                    </button>
                    <label className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#d946ef] text-[#d946ef]/90 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
                      className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#d946ef] text-zinc-450 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black group"
                      title="REDEFINE LABEL SPECS"
                    >
                      <Settings className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Profile Avatar & Primary Identification */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10 w-full mb-1 mt-6">
                    {/* Profile Picture Upload Indicator */}
                    <label className="relative group shrink-0 cursor-pointer mx-auto sm:mx-0">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d946ef] via-[#fdba74] to-[#ffedd5] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 fuchsia-pulse-glow" />
                      <div className="relative w-32 h-32 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/80 flex items-center justify-center shadow-lg group-hover:border-[#d946ef] transition-colors fuchsia-pulse-glow">
                        {userProfile.creative_avatar || userProfile.avatar_url ? (
                          <img 
                            src={userProfile.creative_avatar || userProfile.avatar_url} 
                            alt="Logo" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Globe className="w-12 h-12 text-[#d946ef] group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {/* Invisible file input */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1 py-0.5 rounded border border-[#d946ef]/30">Edit</span>
                        </div>
                      </div>
                    </label>

                    {/* Company Details Stack */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h1 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                        <span>{businessName || userProfile.creative_metadata?.business_name || userProfile.creative_name || 'Vortex Graphics'}</span>
                      </h1>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs text-zinc-450 font-mono leading-relaxed">
                        <span className="lowercase text-zinc-400 bg-zinc-950/60 px-2.5 py-1 rounded-xl border border-zinc-850 font-sans">
                          nexus-core.app/{creativeHandle || userProfile.console_handle || userProfile.screen_name || 'vortexgraphics'}
                        </span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-[#d946ef] uppercase tracking-wider font-extrabold flex items-center gap-1">
                          🛡️ LLC VERIFIED SECURE NODE
                        </span>
                        <span className="text-zinc-805">•</span>
                        <span className="text-[#00ffcc] font-black flex items-center gap-1 uppercase tracking-wide animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
                          </span>
                          ONLINE
                        </span>
                      </div>

                      {/* Active Operator info */}
                      <div className="pt-2 flex justify-center sm:justify-start">
                        <div className="inline-flex items-center gap-1.5 text-zinc-450 bg-black/40 border border-fuchsia-500/20 px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase tracking-wider">
                          <span className="text-zinc-550">Active Operator:</span>
                          <span className="text-white font-bold">({userProfile?.name || 'Guest'})</span>
                          <span className="text-[#d946ef] font-bold">/ {(!userProfile?.role || userProfile.role.toLowerCase().includes('fan')) ? 'Industry Pro' : userProfile.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Centered Subscription/Roster details for mobile view */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2 w-full text-[10px] font-mono tracking-wider uppercase z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-[#d946ef] font-bold">{'PRO CREATIVE'}</span>
                      <span className="text-zinc-500 text-[8px]">SUBSCRIPTION TIER</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">UNLIMITED</span>
                      <span className="text-zinc-500 text-[8px]">ROSTER CAP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">{30} DAYS REMAINING</span>
                      <span className="text-zinc-500 text-[8px]">TRIAL PERIOD</span>
                    </div>
                  </div>

                  {/* Real-time Message Center Card (Mobile) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsInboxOpen(true);
                      setInboxSubTab('conversations');
                    }}
                    className="w-full mt-2 py-3 px-4 rounded-xl border border-fuchsia-500/25 hover:border-fuchsia-500/55 bg-fuchsia-950/20 hover:bg-fuchsia-950/40 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-[#d946ef] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-250 animate-pulse" />
                      <div>
                        <span className="block font-bold text-white text-[10px] tracking-wider uppercase">Label Message Center</span>
                        <span className="text-[8.5px] text-zinc-500 block uppercase font-bold mt-0.5">💬 View and reply to direct band discussions</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-500/40 animate-pulse">
                      Active
                    </span>
                  </button>
                </div>
              </div>

              {/* DESKTOP ONLY PROFILE HEADER */}
              <div className="hidden lg:block tab-chase-border-fuchsia pulse-glow-magenta w-full shadow-2xl relative mb-6">
                <div className="backdrop-blur-md rounded-[calc(1.5rem-2.2px)] bg-[#090b0e]/95 flex flex-col items-center justify-between gap-6 relative overflow-hidden p-8 w-full animate-fade-in" id="label-profile-card-desktop-v2">
                  {/* Optional Cover Image in Top Half with bottom fade-out */}
                  {(userProfile.creative_banner || userProfile.banner_url) && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0">
                      <img 
                        src={userProfile.creative_banner || userProfile.banner_url} 
                        alt="Label Banner" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/50 to-[#090b0e]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(#d946ef07_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" id="label-tonal-desktop" />
                  <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#d946ef]/5 blur-[90px] pointer-events-none" />

                  {/* Action buttons - Administration Tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
                    <button
                      type="button"
                      onClick={handleOpenMyCreativeProfile}
                      className="bg-fuchsia-950/60 hover:bg-fuchsia-900/80 border border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase"
                      title="View Public Profile Card"
                    >
                      <Globe className="w-4 h-4 text-fuchsia-400" />
                      <span>VIEW PUBLIC CARD</span>
                    </button>

                    <label className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#d946ef] text-[#d946ef]/90 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase">
                      <Upload className="w-4 h-4" />
                      <span>CHANGE BANNER</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                    </label>

                    <button 
                      type="button"
                      onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
                      className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#d946ef] text-[#d946ef]/90 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black group"
                      title="REDEFINE LABEL SPECS"
                    >
                      <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                    </button>
                  </div>

                  {/* Central Column Profile Avatar & Visual details */}
                  <div className="flex max-w-7xl flex-col items-center gap-5 text-center relative z-10 w-full animate-fade-in mt-2">
                    <label className="relative group shrink-0 cursor-pointer mx-auto" title="Click to upload/change corporate corporate avatar">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d946ef] via-[#fdba74] to-[#ffedd5] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 fuchsia-pulse-glow" />
                      <div className="relative w-48 h-48 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/85 flex items-center justify-center shadow-lg group-hover:border-[#d946ef] transition-colors fuchsia-pulse-glow">
                        {userProfile.creative_avatar || userProfile.avatar_url ? (
                          <img 
                            src={userProfile.creative_avatar || userProfile.avatar_url} 
                            alt="Logo" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Globe className="w-16 h-16 text-[#d946ef] group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {/* Real file upload input triggers on label click */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1.5 py-1 rounded border border-[#d946ef]/30">Upload</span>
                        </div>
                      </div>
                    </label>

                    {/* Label Specifications Stack */}
                    <div className="flex flex-col items-center text-center space-y-3 w-full">
                      <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center gap-2">
                        <span>{businessName || userProfile.creative_metadata?.business_name || userProfile.creative_name || 'Vortex Graphics'}</span>
                      </h1>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono w-full">
                        <div className="lowercase bg-zinc-950/60 px-3.5 py-1.5 rounded-xl border border-zinc-900/50 font-bold text-zinc-400 font-sans">
                          nexus-core.app/{creativeHandle || userProfile.console_handle || userProfile.screen_name || 'vortexgraphics'}
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        <div className="text-xs text-zinc-350 font-mono flex items-center justify-center gap-1.5 p-1.5 px-3 bg-[#101319]/80 border border-zinc-900/80 rounded-xl shrink-0">
                          <span className="text-[#d946ef] uppercase tracking-wider font-extrabold flex items-center gap-1">
                            🛡️ LLC VERIFIED SECURE NODE
                          </span>
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        <div className="flex items-center gap-1.5 text-zinc-450 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-900/50">
                          <span className="text-[#00ffcc] font-black flex items-center gap-1.5 uppercase tracking-wide animate-pulse">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
                            </span>
                            ONLINE
                          </span>
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        {/* Active Operator info */}
                        <div className="flex items-center gap-1.5 text-zinc-450 bg-black border border-[#d946ef]/25 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase shadow-[0_2px_10px_rgba(217,70,239,0.1)]">
                          <span className="text-zinc-550">Active Operator:</span>
                          <span className="text-white font-black">({userProfile?.name || 'Guest'})</span>
                          <span className="text-[#d946ef] font-bold">/ {(!userProfile?.role || userProfile.role.toLowerCase().includes('fan')) ? 'Industry Pro' : userProfile.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Subscription caps & metadata */}
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-[11px] font-mono tracking-widest uppercase z-10 w-full">
                    <div className="flex flex-col items-center">
                      <span className="text-[#d946ef] font-extrabold">{'PRO CREATIVE'}</span>
                      <span className="text-zinc-500 text-[9px] mt-0.5">SUBSCRIPTION TIER</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">UNLIMITED</span>
                      <span className="text-zinc-500 text-[9px] mt-0.5">ROSTER CAP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">{30} DAYS REMAINING</span>
                      <span className="text-zinc-500 text-[9px] mt-0.5">TRIAL PERIOD</span>
                    </div>
                  </div>

                  {/* Real-time Message Center Card (Desktop) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsInboxOpen(true);
                      setInboxSubTab('conversations');
                    }}
                    className="w-full max-w-2xl mx-auto mt-2 py-3.5 px-5 rounded-2xl border border-fuchsia-500/20 hover:border-fuchsia-500/55 bg-fuchsia-950/20 hover:bg-fuchsia-950/35 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <MessageSquare className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-250 animate-pulse" />
                      <div>
                        <span className="block font-bold text-white text-[11px] tracking-wider uppercase">Label Message Center</span>
                        <span className="text-[9px] text-[#d946ef] block uppercase font-bold mt-0.5">💬 Access direct discussions and booking inquiries with signed bands</span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-500/40 animate-pulse">
                      Active
                    </span>
                  </button>

                </div>
              </div>

              {/* TWO COLUMN INTERACTIVE LAYOUT (MIGRATED FROM V1 HUB) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                
                {/* LEFT COLUMN: AUTH CARD, METRICS TILES & PROFILE SPEC MATCHING */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* AUTHENTICATED USER CARD (Fuchsia Re-Styled) */}
                  <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-900/80 shadow-md space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/[0.02] rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Authenticated User Specs</span>
                        <h2 className="text-sm font-black font-mono text-white tracking-tight flex items-center gap-1.5 truncate">
                          <span className="text-fuchsia-400 shrink-0">👋</span> <span className="text-zinc-350">Hello,</span> <span className="text-fuchsia-400 truncate block font-extrabold">{userProfile?.name}</span>
                        </h2>
                      </div>

                      {/* Vault Balance display */}
                      <div className="flex items-center justify-between bg-zinc-900/40 p-2.5 rounded-xl border border-fuchsia-500/20">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono font-bold">Vault Balance</span>
                        <div className="flex items-center gap-1.5 bg-fuchsia-950/40 border border-fuchsia-500/30 px-2.5 py-1 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse shrink-0" />
                          <span className="text-xs font-black text-fuchsia-300 font-mono">${clearedBalance.toLocaleString()} USD</span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Availability Status Node */}
                    <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between font-mono text-xs">
                      <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">Availability</span>
                      {isEditingAvailability ? (
                        <select
                          autoFocus
                          value={availabilityStatus}
                          onChange={(e) => {
                            setAvailabilityStatus(e.target.value);
                            handleSaveProfile({ availability_status: e.target.value });
                            setIsEditingAvailability(false);
                          }}
                          onBlur={() => setIsEditingAvailability(false)}
                          className="bg-zinc-950 border border-fuchsia-500/50 text-[10px] font-black uppercase text-zinc-300 px-2.5 py-1 rounded-lg focus:outline-none"
                        >
                          <option value="Available">🟢 Available</option>
                          <option value="On Tour">🟣 On Tour</option>
                          <option value="Busy">🟡 Busy</option>
                        </select>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900/50 p-1.5 -mr-1.5 rounded-xl transition-colors"
                          onClick={() => setIsEditingAvailability(true)}
                        >
                          <span className="text-[10px] font-bold text-zinc-300 uppercase">
                            {availabilityStatus === 'Available' ? '🟢 Available' : availabilityStatus === 'On Tour' ? '🟣 On Tour' : '🟡 Busy'}
                          </span>
                          <Edit3 className="w-3 h-3 text-zinc-500" />
                        </div>
                      )}
                    </div>

                    {/* Inline Live Bulletin Board */}
                    <div className="border-t border-zinc-900/60 pt-3 flex flex-col gap-1.5 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">My Bulletin Status</span>
                        <button 
                          onClick={() => {
                            if (isEditingBroadcast) {
                              handleSaveProfile({ quick_broadcast: quickBroadcast });
                            }
                            setIsEditingBroadcast(!isEditingBroadcast);
                          }}
                          className="text-[9px] text-fuchsia-400 uppercase font-bold tracking-wider hover:underline"
                        >
                          {isEditingBroadcast ? 'Save' : 'Update'}
                        </button>
                      </div>
                      {isEditingBroadcast ? (
                        <input 
                          type="text"
                          value={quickBroadcast}
                          onChange={(e) => setQuickBroadcast(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveProfile({ quick_broadcast: quickBroadcast });
                              setIsEditingBroadcast(false);
                            }
                          }}
                          className="bg-zinc-950 border border-fuchsia-500/40 p-2 text-xs rounded-lg text-white font-mono focus:outline-none w-full"
                        />
                      ) : (
                        <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                          "{quickBroadcast}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* MY ACTIVE MATCHING PROFILE SPECS */}
                  <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-2xl p-5 relative overflow-hidden shadow-md group">
                    <div className="bg-[radial-gradient(#d946ef02_1px,transparent_1px)] bg-[size:10px_10px] absolute inset-0 rounded-2xl pointer-events-none" />
                    
                    <div 
                      onClick={() => setIsProfileCardExpanded(prev => !prev)}
                      className="flex justify-between items-center pb-1 relative z-10 cursor-pointer select-none"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-widest block flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                          Matching Pro Specifications
                        </span>
                        <h3 className="text-xs font-black text-white uppercase font-mono tracking-wide">{businessName || displayName || userProfile?.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-fuchsia-950/50 border border-fuchsia-500/30 text-fuchsia-300 px-2 py-0.5 rounded-full font-mono font-extrabold uppercase">
                          Live Spec
                        </span>
                        {isProfileCardExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-fuchsia-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-fuchsia-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isProfileCardExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 pt-4 border-t border-zinc-900/60 mt-3"
                        >
                          <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed font-mono">
                            <div>
                              <span className="block text-[8px] uppercase text-zinc-500 font-extrabold mb-0.5">Discipline Placements</span>
                              <p className="text-white text-[11px] font-bold">
                                Primary: <strong className="text-fuchsia-300 font-black">{primaryCategory}</strong>
                                {secondaryCategory && (
                                  <span> / Secondary: <strong className="text-zinc-300 font-medium">{secondaryCategory}</strong></span>
                                )}
                              </p>
                            </div>

                            <div>
                              <span className="block text-[8px] uppercase text-zinc-500 font-extrabold mb-0.5">Base Rate Details</span>
                              <p className="text-emerald-400 text-[11px] font-bold">
                                ${dayRate} {rateType === 'day' ? '/ Day' : 'Project Tier'}
                                {pricingNotes && <span className="text-zinc-400 font-normal"> ({pricingNotes})</span>}
                              </p>
                            </div>

                            {selectedSkills.length > 0 && (
                              <div>
                                <span className="block text-[8px] uppercase text-zinc-500 font-extrabold mb-1">Assigned Specialized Skills ({selectedSkills.length})</span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedSkills.map((tag, idx) => (
                                    <span key={`${tag}-${idx}`} className="bg-zinc-950 border border-zinc-900 text-[9px] text-zinc-300 px-2 py-0.5 rounded">
                                      ⚡ {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {gearTags.length > 0 && (
                              <div>
                                <span className="block text-[8px] uppercase text-zinc-500 font-extrabold mb-1">Gear Inventory & Tech Specs</span>
                                <div className="flex flex-wrap gap-1">
                                  {gearTags.map((tag, idx) => (
                                    <span key={`${tag}-${idx}`} className="bg-zinc-950 border border-zinc-900 text-[9px] text-zinc-300 px-2 py-0.5 rounded">
                                      🔧 {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {genreTags.length > 0 && (
                              <div>
                                <span className="block text-[8px] uppercase text-zinc-500 font-extrabold mb-1">Underground Genres Supported</span>
                                <div className="flex flex-wrap gap-1">
                                  {genreTags.map((tag, idx) => (
                                    <span key={`${tag}-${idx}`} className="bg-zinc-950 border border-fuchsia-950 text-[9px] text-fuchsia-300 px-2 py-0.5 rounded">
                                      🎵 {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t border-zinc-900 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleOpenMyCreativeProfile}
                                className="bg-fuchsia-950/50 hover:bg-fuchsia-900/60 border border-fuchsia-500/40 text-fuchsia-300 px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              >
                                <Globe className="w-3.5 h-3.5 text-fuchsia-400" />
                                View Public Card
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingProfile(true)}
                                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              >
                                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                                Edit Profile Specs
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* GIGS METRICS TILES */}
                  <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-2xl p-4.5 space-y-3 font-mono relative overflow-hidden shadow-md">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Live Placement Statistics</span>
                    <div className="grid grid-cols-2 gap-3 text-center text-xs relative z-10">
                      <div className="bg-zinc-950/85 p-3 rounded-xl border border-zinc-900/70 hover:border-fuchsia-500/30 transition-all">
                        <span className="text-[9px] text-zinc-500 block uppercase tracking-wider mb-1">Gigs Applied</span>
                        <span className="text-xl font-bold font-mono text-white">{appliedGigIds.length}</span>
                      </div>
                      <div className="bg-zinc-950/85 p-3 rounded-xl border border-zinc-900/70 hover:border-fuchsia-500/30 transition-all">
                        <span className="text-[9px] text-zinc-500 block uppercase tracking-wider mb-1">Portfolio Items</span>
                        <span className="text-xl font-bold font-mono text-white">{portfolioItems.length}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center text-xs relative z-10">
                      <div className="bg-fuchsia-950/20 p-3 rounded-xl border border-fuchsia-900/40 hover:border-fuchsia-500/40 transition-all">
                        <span className="text-[9px] text-zinc-400 block uppercase tracking-wider mb-1">Gigs Accepted</span>
                        <span className="text-xl font-bold font-mono text-fuchsia-400">{proposals.filter(p => p.status === 'accepted').length}</span>
                      </div>
                      <div className="bg-zinc-950/85 p-3 rounded-xl border border-zinc-900/70 hover:border-fuchsia-500/30 transition-all flex flex-col justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase tracking-wider mb-1">Gigs Completed</span>
                          <span className="text-xl font-bold font-mono text-fuchsia-400 font-bold">4</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-fuchsia-500 mt-1">Verified Deliveries</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: PREMIUM GIGS MATCHMAKER & PITCH TEMPLATES */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Opportunities Header card */}
                  <div className="bg-gradient-to-r from-fuchsia-950/20 via-zinc-950 to-zinc-950 border border-fuchsia-500/20 rounded-2xl p-5 space-y-1 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full bg-fuchsia-600/5 blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                      <h2 className="text-sm font-black uppercase tracking-wider font-mono text-white flex items-center gap-2">
                        <Zap className="text-fuchsia-400 w-4 h-4 animate-bounce" />
                        PREMIUM GIG PLACEMENTS
                      </h2>
                      <span className="text-[9px] bg-fuchsia-950/60 border border-fuchsia-500/30 px-2 py-0.5 rounded text-fuchsia-300 font-mono font-bold uppercase animate-pulse">
                        Live Matchmaking Activated
                      </span>
                    </div>
                    <p className="text-[11.5px] text-zinc-400 relative z-10 leading-relaxed font-sans">
                      These premium project opportunities match your specific creative discipline. Express interest to instantly pitch your rates and portfolio specifications.
                    </p>
                  </div>

                  {/* PITCH TEMPLATE EDITOR CARD (Fuchsia styled) */}
                  <div 
                    className="bg-zinc-950/80 border rounded-2xl p-4.5 space-y-4 font-mono transition-all duration-300 border-fuchsia-500/20 hover:border-fuchsia-500/45"
                  >
                    <div 
                      onClick={() => setIsPitchTemplatesExpanded(prev => !prev)}
                      className="flex flex-col items-center justify-center gap-1.5 pb-1 relative z-10 cursor-pointer select-none"
                    >
                      <span className="text-xs font-black uppercase text-white tracking-widest text-center flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5 text-fuchsia-400" />
                        Pitch Cover Letter Template Editor
                      </span>
                      <span className="text-[9px] text-fuchsia-300 bg-fuchsia-950/30 border border-fuchsia-500/30 px-3 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase">3 Slots Configured</span>
                    </div>

                    <AnimatePresence initial={false}>
                      {isPitchTemplatesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 pt-4 border-t border-zinc-900 mt-2"
                        >
                          <div className="w-full space-y-4">
                            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                              Store custom pitch statements (such as design rate-cards, photo-shoot packages, or audio mastering workflows) to speed up applying to leads. Selecting a job opens a custom preview featuring these templates.
                            </p>

                            {/* Templates list */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                              {pitchTemplates.map((temp, index) => {
                                const isSelected = editingTemplateId === temp.id;
                                let colorClass = 'border-zinc-900 bg-zinc-950/60 hover:bg-zinc-950 text-zinc-400 hover:border-zinc-800';
                                if (isSelected) colorClass = 'border-fuchsia-500 bg-fuchsia-950/20 text-fuchsia-300';

                                return (
                                  <button
                                    key={`${temp.id}-${index}`}
                                    type="button"
                                    onClick={() => {
                                      if (editingTemplateId === temp.id) {
                                        setEditingTemplateId(null);
                                      } else {
                                        setEditingTemplateId(temp.id);
                                        setEditingTemplateTitle(temp.title);
                                        setEditingTemplateContent(temp.content);
                                      }
                                    }}
                                    className={`text-left p-3.5 border rounded-xl transition-all flex flex-col justify-between cursor-pointer ${colorClass}`}
                                  >
                                    <div className="space-y-1">
                                      <span className="font-extrabold uppercase text-[9px] tracking-widest text-fuchsia-400 flex items-center gap-1.5">
                                        Slot #{index + 1}
                                      </span>
                                      <h4 className="text-[10.5px] font-black text-white uppercase tracking-wide truncate max-w-full">{temp.title}</h4>
                                      <p className="text-[10px] text-zinc-400 italic line-clamp-3 mt-1.5 font-sans leading-relaxed">
                                        "{temp.content}"
                                      </p>
                                    </div>
                                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-3.5 font-black block">Click to Edit Specs</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Template editor sub-form */}
                            {editingTemplateId && (
                              <div className="p-4 bg-zinc-950/80 rounded-xl border border-fuchsia-500/20 space-y-3.5">
                                <span className="text-[9px] uppercase text-fuchsia-400 font-extrabold tracking-widest block">Modify Template Details</span>
                                <div className="grid grid-cols-1 gap-2.5">
                                  <input 
                                    type="text"
                                    placeholder="Template Title"
                                    value={editingTemplateTitle}
                                    onChange={(e) => setEditingTemplateTitle(e.target.value)}
                                    className="w-full bg-black border border-zinc-900 p-2 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500"
                                  />
                                  <textarea 
                                    rows={3}
                                    placeholder="Pitch Template Content"
                                    value={editingTemplateContent}
                                    onChange={(e) => setEditingTemplateContent(e.target.value)}
                                    className="w-full bg-black border border-zinc-900 p-2.5 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTemplateId(null)}
                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPitchTemplates(prev => prev.map(t => t.id === editingTemplateId ? { ...t, title: editingTemplateTitle, content: editingTemplateContent } : t));
                                      setEditingTemplateId(null);
                                      safeTriggerNotification('✓ Pitch cover template modified successfully.');
                                    }}
                                    className="px-3.5 py-1.5 bg-fuchsia-900/40 hover:bg-fuchsia-900/60 border border-fuchsia-500/30 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* LEADS FEED SELECTION TABS */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setLeadsSubFilter('primary')}
                          className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            leadsSubFilter === 'primary'
                              ? 'bg-fuchsia-900/30 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
                          }`}
                        >
                          📋 Primary Leads ({matchingGigs.length})
                        </button>

                        {secondaryCategory && (
                          <button
                            type="button"
                            onClick={() => setLeadsSubFilter('secondary')}
                            className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold border transition-all flex items-center gap-1.5 cursor-pointer relative ${
                              leadsSubFilter === 'secondary'
                                ? 'bg-purple-900/30 text-white border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
                            }`}
                          >
                            🎨 Secondary Leads ({secondaryGigsCount})
                            {leadsSubFilter === 'primary' && hasSecondaryAlerts && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 z-20">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-90" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500" />
                              </span>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setLeadsSubFilter('all')}
                          className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            leadsSubFilter === 'all'
                              ? 'bg-zinc-800 text-white border-zinc-700'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
                          }`}
                        >
                          🌐 Other Industry Gigs ({otherGigs.length})
                        </button>
                      </div>
                    </div>

                    {/* Floating alert bulletin */}
                    {leadsSubFilter === 'primary' && hasSecondaryAlerts && (
                      <div className="bg-[#1a0a25] border border-fuchsia-900/60 px-3.5 py-2 rounded-xl flex items-center gap-2 animate-pulse font-mono text-[10px]">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
                        </span>
                        <span className="uppercase text-fuchsia-300 font-bold leading-none">
                          Secondary alert: <strong className="text-white font-black">{secondaryGigsCount} live gigs</strong> matching your secondary specifications!
                        </span>
                      </div>
                    )}

                    {/* Gigs lists based on subtab */}
                    <div className="space-y-4">
                      {leadsSubFilter === 'primary' && (
                        <div className="space-y-4">
                          <div className="flash-box-fuchsia rounded-xl px-4 py-2.5 flex items-center justify-between bg-fuchsia-950/[0.02] shadow-[inset_0_1px_1px_rgba(217,70,239,0.04)] font-mono text-xs relative z-10 select-none">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse shrink-0" />
                              <h3 className="font-black uppercase tracking-widest text-fuchsia-300">
                                Primary Specialties: {primaryCategory}
                              </h3>
                            </div>
                            <span className="bg-zinc-950 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded relative z-10">
                              {matchingGigs.length} Match{matchingGigs.length === 1 ? '' : 'es'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {matchingGigs.map((gig, idx) => renderGigItem(gig, 'primary', idx))}
                            {matchingGigs.length === 0 && (
                              <div className="p-8 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl font-mono">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">No matching opportunities in this specialty today.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {leadsSubFilter === 'secondary' && secondaryCategory && (
                        <div className="space-y-4">
                          <div className="flash-box-purple rounded-xl px-4 py-2.5 flex items-center justify-between bg-purple-950/[0.02] shadow-[inset_0_1px_1px_rgba(147,51,234,0.04)] font-mono text-xs relative z-10 select-none">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
                              <h3 className="font-black uppercase tracking-widest text-purple-300">
                                Secondary Specialties: {secondaryCategory}
                              </h3>
                            </div>
                            <span className="bg-zinc-950 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded relative z-10">
                              {secondaryGigsCount} Match{secondaryGigsCount === 1 ? '' : 'es'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {secondaryMatchingGigs.map((gig, idx) => renderGigItem(gig, 'secondary', idx))}
                            {secondaryMatchingGigs.length === 0 && (
                              <div className="p-8 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl font-mono">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">No matching secondary opportunities today.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {leadsSubFilter === 'all' && (
                        <div className="space-y-4">
                          <div className="border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center justify-between bg-zinc-900/[0.02] font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 shrink-0" />
                              <h3 className="font-black uppercase tracking-widest text-zinc-300">
                                All Other Industry Placements
                              </h3>
                            </div>
                            <span className="bg-zinc-950 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded">
                              {otherGigs.length} Opportunity slots
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {otherGigs.map((gig, idx) => renderGigItem(gig, 'other', idx))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* PORTFOLIO TAB RENDERING (WITH DUPLICATED CLIENT REVIEWS) */}
          {activeTab === 'PORTFOLIO' && (
            <div className="space-y-10 max-w-5xl mx-auto animate-fade-in w-full pb-16 px-4">
              <div className="bg-gradient-to-r from-[#170e23] via-[#0b0c10] to-[#07080a] border border-violet-500/20 rounded-2xl p-4.5 space-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[100px] h-[100px] rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />
                <h2 className="text-sm font-black uppercase tracking-wider font-mono text-white flex items-center gap-2 relative z-10">
                  <Layers className="text-violet-400 w-4 h-4" />
                  MY VERIFIED WORKS PORTFOLIO & SHOWCASE
                </h2>
                <p className="text-[11.5px] text-zinc-400 relative z-10 leading-relaxed">
                  Build trust by publishing live links to vector designs, sound recordings, film shoots, or booking history. Your directory card displays these documents directly to band operators looking to hire.
                </p>
              </div>

              {/* 1. MEDIA GALLERY */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-black block">Live Showreel Portfolio Gallery</span>
                    <h3 className="text-xs font-bold uppercase text-white font-mono mt-0.5">Interactive Creative Media Slides</h3>
                  </div>
                  <span className="text-[9.5px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded font-mono">
                    {galleryItems.length} {galleryItems.length === 1 ? 'Slide' : 'Slides'} Programmed
                  </span>
                </div>

                {galleryItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5">
                    {/* Interactive Slide Viewer */}
                    <div className="w-full bg-zinc-950/80 border border-zinc-900/80 rounded-2xl overflow-hidden relative shadow-inner">
                      <div 
                        className="w-full h-56 sm:h-[450px] bg-zinc-900 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                        onClick={() => setFullscreenSlide(galleryItems[activeSlideIndex] || null)}
                      >
                        {(() => {
                          const item = galleryItems[activeSlideIndex];
                          if (!item) return null;
                          if ((item as any).mediaType === 'external' || !!(item as any).externalUrl) {
                            const embed = getEmbedData((item as any).externalUrl || item.imageUrl);
                            return (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center select-none">
                                <div className="absolute inset-0 bg-violet-600/5 pulse animate-pulse opacity-60" />
                                <span className="text-4xl mb-3 animate-bounce">🎬</span>
                                <span className="text-[10px] font-black tracking-widest text-[#00ffcc] uppercase font-mono mb-1">CONNECTED STREAMING PREVIEW</span>
                                <span className="text-xs text-zinc-400 font-sans max-w-xs">{item.title} ({embed.type.toUpperCase()})</span>
                                <span className="text-[9px] bg-violet-955 border border-violet-800 text-violet-300 px-3 py-1 mt-4 rounded uppercase font-mono tracking-wider">Click to Play Live stream ➜</span>
                              </div>
                            );
                          }
                          if ((item as any).mediaType === 'video') {
                            return <video src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover filter brightness-[0.45] transition-all duration-700 group-hover:brightness-[0.35]" autoPlay muted loop playsInline />;
                          } else if ((item as any).mediaType === 'audio') {
                            return (
                              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-6 flex-col">
                                <div className="absolute inset-0 bg-violet-500/5 pulse animate-pulse" />
                                <audio src={item.imageUrl} controls className="w-full max-w-sm z-20" onClick={e => e.stopPropagation()} />
                              </div>
                            );
                          }
                          return (
                            <div 
                              className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] transition-all duration-700 group-hover:brightness-[0.35] group-hover:scale-105" 
                              style={{ backgroundImage: `url('${item.imageUrl}')` }} 
                            />
                          );
                        })()}
                        
                        <div className="absolute inset-0 p-4 flex flex-col justify-between select-none">
                          <div className="flex justify-between items-center w-full">
                            <span className="self-start text-[8px] sm:text-[9px] uppercase bg-black/80 font-black border border-zinc-800 text-violet-300 px-2 py-0.5 rounded leading-none font-mono">
                              SHOWREEL SLIDE {activeSlideIndex + 1}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm border border-zinc-800">
                              <Maximize className="w-3.5 h-3.5 text-zinc-300" />
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide leading-tight font-mono">
                              {galleryItems[activeSlideIndex]?.title}
                            </h4>
                            {galleryItems[activeSlideIndex]?.subtitle && (
                              <p className="text-[10px] text-[#00ffcc] italic font-mono mt-1">
                                {galleryItems[activeSlideIndex]?.subtitle}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {(galleryItems[activeSlideIndex] as any)?.year && (
                                <span className="text-[10px] text-zinc-400 font-mono font-bold shrink-0">
                                  {(galleryItems[activeSlideIndex] as any)?.year}
                                </span>
                              )}
                              {(galleryItems[activeSlideIndex] as any)?.genre && (
                                <span className="text-[8px] uppercase tracking-wider font-extrabold font-mono bg-violet-955/80 border border-violet-800 text-violet-300 px-1.5 py-0.2 rounded-md leading-tight">
                                  {(galleryItems[activeSlideIndex] as any).genre}
                                </span>
                              )}
                              {(galleryItems[activeSlideIndex] as any)?.microGenre && (
                                <span className="text-[8px] uppercase tracking-wider font-extrabold font-mono bg-emerald-955/80 border border-emerald-800 text-emerald-300 px-1.5 py-0.2 rounded-md leading-tight">
                                  {(galleryItems[activeSlideIndex] as any).microGenre}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Slider Toggles */}
                      <div className="bg-black/95 border-t border-zinc-900 px-4 py-3 flex items-center justify-between font-mono text-[9px] text-zinc-400">
                        <span className="text-zinc-500">
                          {galleryItems.length} Items Available
                        </span>
                        <div className="flex gap-4 font-bold text-violet-400 select-none">
                          <button 
                            type="button"
                            className="hover:text-white cursor-pointer transition-colors flex items-center gap-1" 
                            onClick={() => setActiveSlideIndex(prev => prev === 0 ? galleryItems.length - 1 : prev - 1)}
                          >
                            <ChevronLeft className="w-4 h-4 ml-[-4px]" /> PREV
                          </button>
                          <span className="text-zinc-800 font-normal">|</span>
                          <button 
                            type="button"
                            className="hover:text-white cursor-pointer transition-colors flex items-center gap-1" 
                            onClick={() => setActiveSlideIndex(prev => prev === galleryItems.length - 1 ? 0 : prev + 1)}
                          >
                            NEXT <ChevronRight className="w-4 h-4 mr-[-4px]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail Matrix & Manage List */}
                    <div className="w-full flex flex-col justify-between space-y-3.5">
                      <span className="text-[8.5px] uppercase text-zinc-500 block tracking-widest font-black font-mono">
                        Gallery Matrix
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                        {galleryItems.map((item, idx) => {
                          const isLookbookSelected = activeLookbookItemIds.includes(item.id);
                          return (
                            <div 
                              key={`${item.id}-${idx}`} 
                              className={`group h-20 rounded-xl cursor-pointer overflow-hidden transition-all relative border-2 ${
                                isLookbookSelected 
                                  ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/30' 
                                  : idx === activeSlideIndex 
                                    ? 'border-violet-500 ring-1 ring-violet-500/50 shadow-md shadow-violet-950/40' 
                                    : 'border-zinc-850 hover:border-zinc-700'
                              }`}
                              onClick={() => setActiveSlideIndex(idx)}
                            >
                              {(() => {
                                if ((item as any).mediaType === 'video') {
                                  return <video src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-105 transition-all duration-300 pointer-events-none" />;
                                }
                                if ((item as any).mediaType === 'audio') {
                                  return (
                                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center brightness-[0.4] group-hover:scale-105 transition-all duration-300 pointer-events-none">
                                      <Music className="w-5 h-5 text-violet-500 opacity-50" />
                                    </div>
                                  );
                                }
                                return <div className="absolute inset-0 bg-cover bg-center brightness-[0.4] group-hover:scale-105 transition-all duration-300" style={{ backgroundImage: `url('${item.imageUrl}')` }} />;
                              })()}
                              <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-transparent transition-colors z-0" />
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGalleryItem(item.id);
                                }}
                                className="absolute top-1.5 right-1.5 text-zinc-500 hover:text-red-400 bg-zinc-955/90 hover:bg-black p-1.5 rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                title="Remove artwork"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const myId = userProfile?.id || 'default';
                                  const key = 'nexus_core_lookbook_feed';
                                  try {
                                    let existing = JSON.parse(localStorage.getItem(key) || '[]');
                                    if (isLookbookSelected) {
                                      // Toggle off: remove
                                      existing = existing.filter((l: any) => l.id !== item.id);
                                      localStorage.setItem(key, JSON.stringify(existing));
                                      setActiveLookbookItemIds(prev => prev.filter(id => id !== item.id));
                                      
                                      // Optional Supabase integration clean
                                      const supabase = getSupabase();
                                      if (supabase) {
                                        supabase.from('creative_lookbook_feed').delete().eq('id', item.id).then(({error}) => { if (error) console.log(error) });
                                      }
                                      triggerNotification('Removed showcase highlight from public Lookbook.');
                                      safeAddLog(`Removed "${item.title}" from active lookbook selection.`);
                                    } else {
                                      // Toggle on: Check limit of 5 concurrent
                                      if (activeLookbookItemIds.length >= 5) {
                                        triggerNotification('⚠️ Lookbook limit reached! You can select up to 5 concurrent showcase items per account.');
                                        return;
                                      }

                                      const newItem = {
                                        id: item.id,
                                        talentId: myId,
                                        imageUrl: item.imageUrl,
                                        mediaType: (item as any).mediaType || 'image',
                                        externalUrl: (item as any).externalUrl || '',
                                        timestamp: Date.now(),
                                        genre: (item as any).genre,
                                        microGenre: (item as any).microGenre
                                      };
                                      localStorage.setItem(key, JSON.stringify([newItem, ...existing]));
                                      setActiveLookbookItemIds(prev => [...prev, item.id]);
                                      
                                      const supabase = getSupabase();
                                      if (supabase && userProfile?.id) {
                                        supabase.from('creative_lookbook_feed').insert({
                                            id: item.id,
                                            talent_id: userProfile?.id,
                                            asset_id: null,
                                            external_url: (item as any).externalUrl || null,
                                            image_url: item.imageUrl,
                                            media_type: (item as any).mediaType || 'image'
                                        }).then(({error}) => { if (error) console.log(error) });
                                      }
                                      triggerNotification('⭐ Showcase asset highlighted in primary Lookbook!');
                                      safeAddLog(`Highlighted "${item.title}" to public Lookbook.`);
                                    }
                                  } catch (err) {
                                    console.warn(err);
                                  }
                                }}
                                className="absolute bottom-1.5 right-1.5 text-zinc-500 bg-zinc-955/95 hover:bg-black p-1.5 rounded-full hover:scale-110 transition-transform z-10 shadow-md"
                                title={isLookbookSelected ? "Remove highlight" : "Highlight in Lookbook"}
                              >
                                <Star className={`w-3.5 h-3.5 ${isLookbookSelected ? 'text-amber-400 fill-amber-400' : 'text-zinc-500 hover:text-amber-300'}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-zinc-950/40 border border-dashed border-zinc-900 rounded-2xl">
                    <Camera className="w-8 h-8 text-zinc-650 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Your Interactive Showreel is currently empty. Upload images below.</p>
                  </div>
                )}

                {/* New Slide Creator block */}
                <form onSubmit={handleAddGalleryItem} className="bg-gradient-to-br from-[#120e1f] via-[#090a0f] to-[#050608] border border-violet-500/20 p-5 rounded-2xl space-y-4 font-mono shadow-[0_4px_25px_rgba(139,92,246,0.02)] relative overflow-hidden">
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400/80 animate-pulse" />
                      Publish Showcase Asset
                    </span>
                    
                    {/* Stream and File Selector Tabs */}
                    <div className="flex gap-1.5 bg-zinc-950/80 border border-zinc-855 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setGalUploadMethod('file')}
                        className={`px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-widest rounded-md transition-all cursor-pointer ${
                          galUploadMethod === 'file'
                            ? 'bg-violet-955 text-violet-300 shadow-inner'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalUploadMethod('external')}
                        className={`px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-widest rounded-md transition-all cursor-pointer ${
                          galUploadMethod === 'external'
                            ? 'bg-violet-955 text-violet-300 shadow-inner'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Stream Link
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    <div>
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Slide Title *</label>
                      <input 
                        type="text" 
                        required 
                        value={newGalTitle} 
                        onChange={(e) => setNewGalTitle(e.target.value)} 
                        placeholder={galUploadMethod === 'external' ? "e.g. Official Showreel Video" : "e.g. Venue Show 2025"}
                        className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-violet-500 rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Description (Optional)</label>
                      <input 
                        type="text" 
                        value={newGalSubtitle} 
                        onChange={(e) => setNewGalSubtitle(e.target.value)} 
                        placeholder={galUploadMethod === 'external' ? "e.g. Music video showcase" : "e.g. Live stage photography"}
                        className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-violet-500 rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    <div>
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Genre Specialty *</label>
                      <select 
                        value={newGalGenre} 
                        onChange={(e) => {
                          const selectedGenre = e.target.value;
                          setNewGalGenre(selectedGenre);
                          const micros = GENRE_MICRO_GENRES[selectedGenre];
                          if (micros && micros.length > 0) {
                              setNewGalMicroGenre(micros[0]);
                          }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-855 rounded-xl p-2.5 text-xs text-white cursor-pointer hover:border-zinc-700 transition"
                      >
                        {Object.keys(GENRE_MICRO_GENRES).map((g, gIdx) => (
                          <option key={`${g}-${gIdx}`} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Micro-Genre Sub-tag *</label>
                      <select 
                        value={newGalMicroGenre} 
                        onChange={(e) => setNewGalMicroGenre(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-855 rounded-xl p-2.5 text-xs text-white cursor-pointer hover:border-zinc-700 transition"
                      >
                        {(GENRE_MICRO_GENRES[newGalGenre] || []).map((mg, idx) => (
                          <option key={`${mg}-${idx}`} value={mg}>{mg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end relative z-10">
                    <div className="sm:col-span-3">
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Year *</label>
                      <select 
                        value={newGalYear} 
                        onChange={(e) => setNewGalYear(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-855 rounded-xl p-2.5 text-xs text-white cursor-pointer hover:border-zinc-700 transition"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                      </select>
                    </div>

                    {galUploadMethod === 'file' ? (
                      <div className="sm:col-span-6">
                        <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Upload Media (Images / Audio / Video)</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            required 
                            accept="image/*,video/*,audio/*"
                            multiple
                            ref={fileInputRef}
                            className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-violet-500 rounded-xl p-1.5 text-[10px] text-zinc-400 focus:outline-none transition-all file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-violet-955/60 file:text-violet-300 hover:file:bg-violet-900/60 cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="sm:col-span-6">
                        <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Streaming Media Link *</label>
                        <input 
                          type="url" 
                          required 
                          value={externalEmbedUrl}
                          onChange={(e) => setExternalEmbedUrl(e.target.value)}
                          placeholder="YouTube, Vimeo, Spotify, or SoundCloud URL"
                          className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-violet-500 rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-3">
                      <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:from-violet-550 hover:to-indigo-500 text-white font-black text-[10px] px-6 py-2.5 rounded-xl uppercase border border-violet-500/30 shadow-md shadow-violet-950/40 cursor-pointer transition-all duration-150 active:scale-95 whitespace-nowrap h-[38px] flex items-center justify-center"
                      >
                        {galUploadMethod === 'external' ? 'Link Showreel' : 'Upload Gallery'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* 2. EXTERNAL VERIFIED URL REFERENCE LINKS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#ff6b00] uppercase tracking-widest font-black block">External References Stream</span>
                    <h3 className="text-xs font-bold uppercase text-white font-mono mt-0.5">Verified Work Showcase Links</h3>
                  </div>
                </div>

                {/* Portfolio Form Custom Warm Orange-Copper texture style */}
                <form onSubmit={handleAddPortfolio} className="bg-gradient-to-br from-[#1c130d] via-[#100d0a] to-[#07080a] border border-[#ff6b00]/25 hover:border-[#ff6b00]/45 p-5 rounded-2xl space-y-4 font-mono shadow-[0_4px_25px_rgba(255,107,0,0.04)] relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-[80px] h-[80px] rounded-full bg-[#ff6b00]/5 blur-3xl pointer-events-none" />
                  <span className="text-[9.5px] font-black text-[#ff6b00] uppercase tracking-widest block relative z-10 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff6b00]/80 animate-pulse" />
                    Publish New Showcase Link
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
                    <div>
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Project Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={newPortTitle} 
                        onChange={(e) => setNewPortTitle(e.target.value)} 
                        placeholder="e.g. Goregrind Festival Backdrop"
                        className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-[#ff6b00] rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Target Client / Band Name</label>
                      <input 
                        type="text" 
                        value={newPortClient} 
                        onChange={(e) => setNewPortClient(e.target.value)} 
                        placeholder="e.g Gravehunter LP"
                        className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-[#ff6b00] rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end relative z-10">
                    <div className="sm:col-span-8">
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Reference URL Link *</label>
                      <input 
                        type="url" 
                        required 
                        value={newPortLink} 
                        onChange={(e) => setNewPortLink(e.target.value)} 
                        placeholder="e.g. https://instagram.com/my_art"
                        className="w-full bg-zinc-950/90 border border-zinc-855 hover:border-zinc-700 focus:border-[#ff6b00] rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[8.5px] uppercase font-bold text-zinc-400 mb-1 tracking-wide">Year</label>
                      <select 
                        value={newPortYear} 
                        onChange={(e) => setNewPortYear(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-855 rounded-xl p-2.5 text-xs text-white cursor-pointer hover:border-zinc-700 transition"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <button 
                        type="submit" 
                        className="w-full bg-[#ff6b00] hover:bg-[#e05e00] text-white font-black text-[10px] py-3 rounded-xl uppercase border border-[#ff6b00]/30 shadow-md shadow-orange-950/40 cursor-pointer transition-all duration-150 active:scale-95"
                      >
                        Publish Link
                      </button>
                    </div>
                  </div>
                </form>

                {/* Portfolio Cards Grid - custom stylized portfolio badges */}
                <div className="grid grid-cols-1 gap-3.5">
                  {portfolioItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="bg-gradient-to-r from-[#0d0d12] to-[#12121a] border border-zinc-855 hover:border-violet-500/40 p-4 rounded-xl flex items-center justify-between font-mono transition-all duration-200 shadow-md group">
                      <div className="space-y-1">
                        <span className="text-[8.5px] bg-zinc-900 border border-zinc-800 text-zinc-505 font-extrabold px-2 py-0.5 rounded-md uppercase">{item.client} • {item.year}</span>
                        <h4 className="text-xs font-black text-white uppercase mt-1.5 transition-colors group-hover:text-[#ff6b00]">{item.title}</h4>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[#ff6b00]/70 hover:underline text-[10px] flex items-center gap-1 mt-1 shrink-0">
                          {item.link.substring(0, 30)}... <ExternalLink className="w-2.5 h-2.5 text-[#ff6b00]/70" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="text-zinc-650 hover:text-red-400 p-2 rounded-lg hover:bg-red-955/20 transition-colors cursor-pointer"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {portfolioItems.length === 0 && (
                    <div className="w-full p-10 text-center bg-[#07080a] border border-dashed border-zinc-855 rounded-2xl">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Your custom showcase queue is empty. Publish links to enable.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* DUPLICATED CLIENT REVIEWS & ENDORSEMENTS SECTION (Fuchsia styled) */}
              <div 
                className="bg-zinc-950/45 border border-fuchsia-500/20 rounded-2xl p-6 space-y-4 font-mono relative overflow-hidden shadow-md"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/[0.01] rounded-full blur-2xl pointer-events-none" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center gap-1.5">
                  ⭐ Client Reviews & Endorsements
                </span>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400 opacity-50" />
                  </div>
                  <span className="text-white font-bold text-sm">4.8</span>
                  <span className="text-zinc-500 text-[10px]">(12 Verified Reviews)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">
                    <p className="text-[11px] text-zinc-300 italic mb-2 leading-relaxed font-sans">"Delivered exactly what we needed for the tour. Highly responsive and professional. The vector assets were perfectly separated for merch printing."</p>
                    <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">- Promoter, TX</span>
                  </div>
                  <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">
                    <p className="text-[11px] text-zinc-300 italic mb-2 leading-relaxed font-sans">"Great work on the event graphics. Crushed the midnight deadline. Would definitely hire again for our next run."</p>
                    <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">- Tour Manager, CA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOOKINGS TAB RENDERING */}
          {activeTab === 'BOOKINGS' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in w-full pb-16 px-4">
              {/* LARGE INTERACTIVE BOOKING CALENDAR (Only displayed on Leads/Booking tab) */}
              <div className="w-auto -mx-4 sm:mx-0 bg-gradient-to-b from-[#0b0d13] via-[#090b0f] to-[#06070a] border-y sm:border border-emerald-500/25 rounded-none sm:rounded-3xl p-4 sm:p-8 space-y-6 shadow-[0_10px_40px_rgba(16,185,129,0.06)] backdrop-blur-md relative overflow-hidden animate-fade-in">
                {/* Visual decoration: Grid and Glowing Orbs similar to promoter portal calendar */}
                <div className="absolute inset-0 bg-[radial-gradient(#10b98108_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-[280px] h-[280px] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-[280px] h-[280px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

                {/* Calendar Header with Stats summary */}
                <div className="flex flex-col items-center justify-center gap-4 border-b border-zinc-900 pb-5 relative z-10 text-center w-full">
                  <div className="space-y-1.5 flex flex-col items-center justify-center text-center w-full">
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2 text-center">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                      Interactive Bookings Oracle v1.4
                    </span>
                    <h2 
                      style={{ textAlign: 'center' }}
                      className="text-xl font-black font-mono uppercase tracking-wide text-white flex items-center justify-center gap-2 text-center w-[284.157px] md:w-auto md:max-w-none mx-auto"
                    >
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      MY AVAILABILITY & GIG CALENDAR
                    </h2>
                  </div>

                  {/* Micro stats banner inside calendar header */}
                  <div 
                    style={{ minWidth: 'max-content' }}
                    className="flex items-center gap-3 bg-zinc-950/70 border border-zinc-850 p-2.5 rounded-2xl text-[10px] font-mono text-white mx-auto"
                  >
                    <div className="flex items-center gap-1 px-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-zinc-400 uppercase">Booked:</span>
                      <span className="text-white font-bold ml-1">{proposals.filter(p => p.status === 'accepted').length}</span>
                    </div>
                    <div className="h-3 w-[1px] bg-zinc-850" />
                    <div className="flex items-center gap-1 px-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-zinc-405 uppercase">Offers:</span>
                      <span className="text-white font-bold ml-1">{proposals.filter(p => p.status === 'pending').length}</span>
                    </div>
                    <div className="h-3 w-[1px] bg-zinc-850" />
                    <div className="flex items-center gap-1 px-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="text-zinc-405 uppercase">Restricted:</span>
                      <span className="text-white font-bold ml-1">{manualBlockedDates.length}</span>
                    </div>
                  </div>
                </div>

                {/* Calendar Layout: Columns on Desktop */}
                <div className="grid grid-cols-1 gap-6 relative z-10">
                  {/* Left Column: Swipeable Calendar Grid */}
                  <div className="w-full space-y-4">
                    {/* Month Picker Header */}
                    <div className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-2xl p-2.5 font-mono shadow-inner text-white">
                      <button
                        type="button"
                        onClick={calPreviousMonth}
                        className="p-1 px-3 bg-zinc-900/85 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 animate-fade-in"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black tracking-widest text-[#00ffcc] uppercase font-mono">
                        {monthNames[calendarCurrentDate.getMonth()]} {calendarCurrentDate.getFullYear()}
                      </span>
                      <button
                        type="button"
                        onClick={calNextMonth}
                        className="p-1 px-3 bg-zinc-900/85 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 animate-fade-in"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest py-1 border-b border-zinc-900/40">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    {/* Calendar Days Matrix */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {(() => {
                        const totalDays = calDaysInMonth(calendarCurrentDate);
                        const startOffset = calStartDayOfMonth(calendarCurrentDate);
                        const daysArr = [];

                        // Empty start offsets
                        for (let i = 0; i < startOffset; i++) {
                          daysArr.push(<div key={`empty-leads-cal-${i}`} className="aspect-square bg-transparent rounded-xl" />);
                        }

                        // Generate actual days
                        for (let d = 1; d <= totalDays; d++) {
                          const dayDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), d);
                          const isToday = dayDate.toDateString() === new Date().toDateString();
                          const isSelected = dayDate.toDateString() === calendarSelectedDate.toDateString();
                          
                          const dayEvents = getDayEvents(dayDate);
                          const hasConfirmed = (dayEvents || []).some(e => e.type === 'proposal' && e.status === 'accepted');
                          const hasPending = (dayEvents || []).some(e => e.type === 'proposal' && e.status === 'pending');
                          const hasBlocked = (dayEvents || []).some(e => e.type === 'blocked');

                          let dayStyles = 'bg-zinc-950/40 border-zinc-900/80 text-zinc-450 hover:bg-zinc-900/60';
                          let markerDot = null;

                          if (hasConfirmed) {
                            dayStyles = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-350 hover:bg-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.1)] font-extrabold';
                            markerDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1 right-1" />;
                          } else if (hasPending) {
                            dayStyles = 'bg-amber-950/60 border-amber-500/50 text-amber-350 hover:bg-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] font-bold';
                            markerDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1 right-1 animate-pulse" />;
                          } else if (hasBlocked) {
                            dayStyles = 'bg-sky-950/60 border-sky-500/50 text-sky-350 hover:bg-sky-900/50 shadow-[0_0_10px_rgba(14,165,233,0.1)]';
                            markerDot = <span className="w-1.5 h-1.5 rounded-full bg-sky-400 absolute bottom-1 right-1" />;
                          }

                          if (isSelected) {
                            dayStyles += ' ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-[1.05] z-10';
                          }
                          if (isToday) {
                            dayStyles += ' border-white font-extrabold text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.15)]';
                          }

                          daysArr.push(
                            <button
                              key={`leads-cal-day-${calendarCurrentDate.getFullYear()}-${calendarCurrentDate.getMonth()}-${d}`}
                              type="button"
                              onClick={() => {
                                setCalendarSelectedDate(dayDate);
                                setIsDateProfileExpanded(true);
                              }}
                              className={`aspect-square hover:scale-[1.05] transition-all flex flex-col justify-between p-2 rounded-xl border cursor-pointer relative overflow-hidden select-none ${dayStyles}`}
                            >
                              <span className="text-[11px] font-mono font-bold leading-none">{d}</span>
                              {markerDot}
                            </button>
                          );
                        }

                        return daysArr;
                      })()}
                    </div>

                    {/* Color Legends */}
                    <div className="flex flex-wrap gap-4 items-center justify-center pt-2.5 text-[9.5px] font-mono text-zinc-500 border-t border-zinc-900/40">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-md bg-emerald-950/60 border border-emerald-500/50" />
                        <span className="uppercase font-bold text-zinc-400">Booked & Locked</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-md bg-amber-950/60 border border-amber-500/50" />
                        <span className="uppercase font-bold text-zinc-400">Offer Pending</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-md bg-sky-950/60 border border-sky-500/50" />
                        <span className="uppercase font-bold text-zinc-400">Date Restricted / focus</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Date Action Details */}
                  <div className="w-full flex flex-col">
                    <AnimatePresence mode="wait">
                      {isDateProfileExpanded && (
                        <motion.div
                          key={calendarSelectedDate.toDateString()}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex flex-col h-full space-y-4"
                        >
                          {/* Schedule Panel Detail Card */}
                          <div 
                            style={{ width: '310.157px', marginRight: 'auto', marginLeft: 'auto' }}
                            className="bg-[#08090d] border border-zinc-850 rounded-2xl p-4.5 space-y-4 flex-1 shadow-inner flex flex-col justify-between relative md:!w-full md:!mx-0"
                          >
                            <div>
                              <div className="flex items-center justify-center border-b border-zinc-900 pb-3 mb-3 relative">
                                <div className="space-y-0.5 text-center flex flex-col items-center justify-center w-full">
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block text-center">Selected Planner</span>
                                  <h3 className="text-xs font-black uppercase text-white font-mono tracking-wide text-center">
                                    📅 {calendarSelectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsDateProfileExpanded(false)}
                                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 cursor-pointer absolute right-0 top-0.5"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Day Status and Events list */}
                              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                                {(() => {
                                  const selectedEvents = getDayEvents(calendarSelectedDate);
                                  if (selectedEvents.length === 0) {
                                    return (
                                      <div className="text-center py-6 px-4 border border-dashed border-zinc-855 rounded-xl space-y-2">
                                        <p className="text-[11px] font-mono text-zinc-500 leading-relaxed uppercase tracking-wider text-center font-bold">
                                          No commitments or focus blocks recorded for this date.
                                        </p>
                                      </div>
                                    );
                                  }

                                  return selectedEvents.map((ev, evIdx) => {
                                    if (ev.type === 'proposal') {
                                      return (
                                        <div key={`cal-event-prop-${ev.id || 'ev'}-${evIdx}`} className={`p-4 border rounded-xl space-y-2.5 transition-all shadow ${
                                          ev.status === 'accepted' ? 'bg-emerald-950/20 border-emerald-500/30' : 
                                          ev.status === 'declined' ? 'bg-red-950/20 border-red-500/30' : 'bg-amber-950/20 border-amber-500/30'
                                        }`}>
                                          <div className="flex flex-col items-center justify-center gap-2 text-center w-full">
                                            <div className="space-y-1 flex flex-col items-center justify-center text-center">
                                              <span className={`text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded block w-max ${
                                                ev.status === 'accepted' ? 'text-emerald-400 bg-emerald-950/60' :
                                                ev.status === 'declined' ? 'text-red-400 bg-red-950/60' : 'text-amber-400 bg-amber-950/60'
                                              }`}>
                                                [{ev.status?.toUpperCase()}] ENQUIRY
                                              </span>
                                              <h4 className="text-xs font-black text-white font-mono uppercase tracking-wide mt-1 text-center">
                                                {ev.name}
                                              </h4>
                                            </div>
                                            <span className="text-xs font-bold font-mono text-emerald-400 text-center">{ev.fee}</span>
                                          </div>
                                          <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed text-center">
                                            {ev.description}
                                          </p>
                                          
                                          {/* Accept/Decline action buttons directly inside the calendar */}
                                          {ev.status === 'pending' && (
                                            <div className="flex gap-2 pt-1 justify-center items-center w-full">
                                              <button
                                                onClick={() => handleProposalStatus(ev.id, 'accepted')}
                                                className="bg-emerald-900/30 hover:bg-[#00ffcc] text-emerald-400 hover:text-black border border-emerald-500/30 hover:border-emerald-400 text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                              >
                                                <Check className="w-3 h-3" />
                                                Accept Offer
                                              </button>
                                              <button
                                                onClick={() => handleProposalStatus(ev.id, 'declined')}
                                                className="bg-zinc-900 hover:bg-red-955 border border-zinc-800 text-zinc-550 hover:text-red-400 text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition-colors"
                                              >
                                                <X className="w-3 h-3" />
                                                Decline
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // Blocked date
                                      return (
                                        <div key={`cal-event-block-${ev.id || 'ev'}-${evIdx}`} className="p-4 bg-sky-950/10 border border-sky-500/20 rounded-xl space-y-2 text-center flex flex-col items-center justify-center w-full">
                                          <div className="flex flex-col items-center justify-center gap-2 w-full">
                                            <div className="flex flex-col items-center justify-center text-center">
                                              <span className="text-[9.5px] font-mono font-bold text-sky-450 bg-sky-950/50 border border-sky-500/25 px-2 py-0.5 rounded tracking-wide uppercase">
                                                ⛔ DATE RESTRICTED
                                              </span>
                                              <h4 className="text-xs font-black text-white font-mono uppercase tracking-wide mt-1.5 text-center">
                                                {ev.name}
                                              </h4>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const iso = `${calendarSelectedDate.getFullYear()}-${String(calendarSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(calendarSelectedDate.getDate()).padStart(2, '0')}`;
                                                setManualBlockedDates(prev => prev.filter(b => b.dateStr !== iso));
                                                triggerNotification('✓ Availability blockout removed safely from database.');
                                              }}
                                              className="text-zinc-650 hover:text-red-400 p-1 rounded-lg hover:bg-red-955 cursor-pointer transition-colors"
                                              title="Remove date blockout"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                          <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed italic border-t border-sky-500/10 pt-2 text-center w-full">
                                            "{ev.description}"
                                          </p>
                                        </div>
                                      );
                                    }
                                  });
                                })()}
                              </div>
                            </div>

                            {/* Form to insert manual blockout if the day doesn't already have one */}
                            {getDayEvents(calendarSelectedDate).filter(ev => ev.type === 'blocked').length === 0 && (
                              <div className="border-t border-zinc-900 pt-3.5 space-y-3 font-mono text-center flex flex-col items-center w-full">
                                <span className="text-[9.5px] text-zinc-500 uppercase tracking-widest font-black block text-center">🚫 Place Availability Lock</span>
                                <div className="space-y-2 text-xs w-full flex flex-col items-center justify-center">
                                  <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                                    <input
                                      type="text"
                                      placeholder="Label (e.g. Studio Session)"
                                      value={newBlockoutLabel}
                                      onChange={(e) => setNewBlockoutLabel(e.target.value)}
                                      className="w-full bg-zinc-950/90 border border-zinc-900 hover:border-zinc-850 rounded-lg p-2 text-[10.5px] text-white focus:outline-none focus:border-emerald-500 text-center"
                                    />
                                    <button
                                      type="button"
                                      disabled={!newBlockoutLabel.trim()}
                                      onClick={() => {
                                        const iso = `${calendarSelectedDate.getFullYear()}-${String(calendarSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(calendarSelectedDate.getDate()).padStart(2, '0')}`;
                                        const newBlock = {
                                          dateStr: iso,
                                          reason: newBlockoutReason || 'No specific reasoning listed.',
                                          label: newBlockoutLabel.trim()
                                        };
                                        setManualBlockedDates(prev => [...prev, newBlock]);
                                        setNewBlockoutLabel('');
                                        setNewBlockoutReason('');
                                        triggerNotification('✓ Availability restriction locked in on selected date.');
                                      }}
                                      className={`py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                        newBlockoutLabel.trim() 
                                          ? 'bg-sky-900/30 border border-sky-500/40 text-sky-400 hover:bg-[#0ea5e9]/20 hover:text-white' 
                                          : 'bg-zinc-950 text-zinc-650 border border-zinc-900 cursor-not-allowed'
                                      }`}
                                    >
                                      <Lock className="w-3 h-3" />
                                      Lockout Date
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Brief blockout details / reason..."
                                    value={newBlockoutReason}
                                    onChange={(e) => setNewBlockoutReason(e.target.value)}
                                    className="w-full bg-zinc-950/90 border border-zinc-900 hover:border-zinc-850 rounded-lg p-2 text-[10.5px] text-white focus:outline-none focus:border-emerald-500 text-center"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* DIRECT INCOMING BAND BOOKINGS + PROPOSALS OFFER CARDS + COGNITIVE EXPLANATORY COLLAPSED BAND MATRIC SECURITY SETUP */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4.5"
              >
                <div 
                  style={{ borderColor: '#04ea5d', borderWidth: '1px' }}
                  className="bg-gradient-to-r from-[#0a181b] via-[#0b0c10] to-[#07080a] border rounded-2xl p-4.5 space-y-2 relative overflow-hidden flex flex-col items-center justify-center text-center"
                >
                  <div className="absolute top-0 right-0 w-[100px] h-[100px] rounded-full bg-teal-500/5 blur-2xl pointer-events-none" />
                  <h2 className="text-sm font-black uppercase tracking-wider font-mono text-white flex items-center justify-center gap-2 relative z-10">
                    <MessageSquare className="text-[#00ffcc] w-4 h-4" />
                    DIRECT INCOMING BAND BOOKINGS
                  </h2>
                  <p className="text-[11.5px] text-zinc-400 relative z-10 leading-relaxed max-w-xl">
                    These are direct incoming request proposals matching your base location and day-rate targets. Respond to seal active agreements.
                  </p>
                </div>

                {/* PROPOSALS OFFER CARDS */}
                <div className="space-y-3.5">
                  {proposals.map((prop, idx) => {
                    const isExpanded = !!expandedProposals[prop.id];
                    return (
                      <div key={`${prop.id}-${idx}`} className="bg-gradient-to-br from-[#0c181f] via-[#070d10] to-[#050608] border border-sky-500/25 hover:border-sky-400/50 rounded-2xl shadow-[0_4px_25px_rgba(14,165,233,0.05)] transition-all duration-300 relative overflow-hidden flex flex-col">
                        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-sky-500/5 blur-2xl pointer-events-none" />
                        
                        {/* COLLAPSIBLE HEADER (Always visible) */}
                        <div 
                          onClick={() => toggleProposalExpand(prop.id)}
                          className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none relative z-10 w-full"
                        >
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                              <span className="text-[9.5px] font-mono font-bold uppercase bg-sky-600/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded">
                                {prop.projectType}
                              </span>
                              <span className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                prop.status === 'accepted' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30' :
                                prop.status === 'declined' ? 'text-red-400 bg-red-950/40 border border-red-900/30' : 'text-amber-400 bg-amber-950/40 border border-amber-900/10'
                              }`}>
                                {prop.status}
                              </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-black text-white uppercase font-mono mt-1 tracking-wide">
                              Enquiry from {prop.bandName}
                            </h3>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-center sm:text-right">
                              <span className="text-sm font-mono font-black text-emerald-400 block tracking-wide">{prop.proposedFee}</span>
                              <span className="text-[9px] font-mono text-zinc-550 block font-bold">Required: {prop.deadline}</span>
                            </div>
                            
                            <div className="text-zinc-400 p-1.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:text-white transition-colors">
                              {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                            </div>
                          </div>
                        </div>

                        {/* EXPANDABLE DETAILS */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-zinc-900/60"
                            >
                              <div className="p-5 space-y-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-zinc-400 leading-relaxed font-sans relative z-10 text-center w-full max-w-lg mx-auto">
                                  {prop.description}
                                </p>

                                <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 border-t border-zinc-900/60 pt-4 relative z-10 select-none w-full">
                                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                                    <span className="text-zinc-500">Status Check: </span>
                                    <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                                      prop.status === 'accepted' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30' :
                                      prop.status === 'declined' ? 'text-red-400 bg-red-950/40 border border-red-900/30' : 'text-amber-400 bg-amber-950/40 border border-amber-900/10'
                                    }`}>
                                      [{prop.status}]
                                    </span>
                                  </div>

                                  {prop.status === 'pending' && (
                                    <div className="flex gap-2 justify-center items-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleProposalStatus(prop.id, 'accepted');
                                        }}
                                        className="bg-emerald-900/20 hover:bg-[#00ffcc] text-emerald-400 hover:text-black border border-emerald-500/30 hover:border-emerald-400 text-[10px] font-mono font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow animate-fade-in"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        Accept Securely
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleProposalStatus(prop.id, 'declined');
                                        }}
                                        className="bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/20 text-[10px] font-mono font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        decline
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* FREELANCER ACTIVE WORKSTATION VERIFICATION WRAPPER */}
                                {prop.status === 'accepted' && (
                                  <div className="mt-4 border-t border-zinc-900/85 pt-4 space-y-4 relative z-10 w-full">
                                    {releasedEscrowProjIds.includes(prop.id) ? (
                                      <div className="p-4 border border-[#00ffcc]/30 bg-[#00ffcc]/5 text-center font-mono rounded-xl">
                                        <span className="text-[#00ffcc] font-black text-xs uppercase tracking-widest block">
                                          [ STATUS: ESCROW AUTHORIZED & RELEASED SUCCESSFULLY ]
                                        </span>
                                        <span className="text-[10px] text-zinc-400 mt-1.5 block">
                                          Deliverables have passed high-fidelity verification and are deployed to the archive. Payout of {prop.proposedFee} cleared.
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="space-y-6">
                                        {/* Upwork Milestones Schedule */}
                                        <div className="space-y-2 font-mono text-center flex flex-col items-center">
                                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">📍 Smart Milestones Schedule</span>
                                          <div className="w-full max-w-md flex items-center justify-between bg-zinc-950 border border-emerald-900/40 p-2.5 rounded-lg text-[10px]">
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                                              </div>
                                              <span className="text-zinc-300">Phase 1: Concept & Setup</span>
                                            </div>
                                            <span className="text-emerald-400 font-bold">$100 (Funded)</span>
                                          </div>
                                          <div className="w-full max-w-md flex items-center justify-between bg-zinc-950 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)] p-2.5 rounded-lg text-[10px]">
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center animate-pulse shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                              </div>
                                              <span className="text-white font-bold">Phase 2: Final Delivery</span>
                                            </div>
                                            <span className="text-violet-400 font-bold">
                                              {(() => {
                                                const cleanFee = parseFloat(prop.proposedFee.replace(/[^0-9.]/g, '')) || 250;
                                                return (cleanFee > 100 ? cleanFee - 100 : cleanFee).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                                              })()} (In Escrow)
                                            </span>
                                          </div>
                                        </div>

                                        {/* Lower Half: Verification and Terminals */}
                                        <div className="border-t border-zinc-900/90 pt-5 mt-5 space-y-4 w-full">
                                          <div className="text-center font-mono">
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">📁 Deliverables Verification & Pipeline</span>
                                            <p className="text-[9px] text-zinc-650 mt-0.5">Fulfill verification checklists below to authorize final contract release</p>
                                          </div>

                                          <div className="p-3 bg-zinc-950 border border-zinc-900 flex justify-center gap-2 items-center text-[10px] font-mono text-center max-w-md w-full mx-auto rounded-lg">
                                            <span className="text-zinc-500 uppercase">RUNNING WORKSPACE PIPELINE:</span>
                                            <span className="text-violet-400 font-bold uppercase">[ PRO TERMINAL ]</span>
                                          </div>
                                          <CreativeWorkspaceProtocols
                                            workerCategory={
                                              primaryCategory === 'Artist/Designer' ? 'visual' :
                                              (primaryCategory === 'Sound Engineer/Recording' || primaryCategory === 'Session Musician/Techs') ? 'audio' : 'media'
                                            }
                                            activeProtocols={proposalEnforcedProtocols[prop.id] || bandConfiguredProtocols}
                                            verifiedProtocols={proposalVerifiedProtocols[prop.id] || {}}
                                            onCompletedItemsChange={(completedMap) => handleContractChecklistChange(prop.id, completedMap)}
                                            isEditableByBand={false}
                                            onSubmitVerification={async () => {
                                              setActiveReceiptProposal(prop);
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {proposals.length === 0 && (
                    <div className="p-10 text-center bg-[#07080a] border border-dashed border-zinc-850 rounded-xl">
                      <p className="text-xs font-mono text-zinc-500">Your direct inbox queue is absolutely empty.</p>
                    </div>
                  )}
                </div>

                {/* COGNITIVE EXPLANATORY COLLAPSED BAND MATRIC SECURITY SETUP */}
                <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-2xl overflow-hidden transition-all duration-300 mt-4 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setIsSecurityMatrixExpanded(!isSecurityMatrixExpanded)}
                    className="w-full flex flex-col items-center justify-center p-5 gap-3 text-center font-mono hover:bg-zinc-900/20 transition-colors cursor-pointer select-none"
                  >
                    <div className="space-y-1.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block leading-none">
                        [ Testing & Sandbox Configurations ]
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center justify-center gap-1.5">
                        ⚙️ Setup Simulated Band Security compliance rules
                      </h4>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                      <span className="text-[10px] text-zinc-500 bg-black/50 border border-zinc-900 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                        {isSecurityMatrixExpanded ? 'Hide Rules Settings' : 'Expand Rules Config'}
                      </span>
                      {isSecurityMatrixExpanded ? (
                        <ChevronUp className="w-4.5 h-4.5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4.5 h-4.5 text-zinc-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isSecurityMatrixExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-zinc-900/50 w-full"
                      >
                        <div className="p-4.5 space-y-4 bg-zinc-950/70 flex flex-col items-center justify-center text-center">
                          <div className="bg-violet-950/20 border border-violet-900/30 p-4 rounded-xl space-y-1 text-xs text-center flex flex-col items-center justify-center w-full max-w-xl mx-auto">
                            <p className="text-violet-300 font-bold uppercase text-[9.5px] tracking-wider">
                              💡 Why does a Creative sandbox need this?
                            </p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans normal-case text-center">
                              Since this is an interactive simulation sandbox, you operate as both the candidate and the hiring entity. This pane represents the band&apos;s enforcement requirements setup. By altering these, you can test how different strict protocol configurations affect your interactive workstation pipeline below when delivering final files to release payment escrow!
                            </p>
                          </div>

                          <CreativeWorkspaceProtocols
                            workerCategory={
                              primaryCategory === 'Artist/Designer' ? 'visual' :
                              (primaryCategory === 'Sound Engineer/Recording' || primaryCategory === 'Session Musician/Techs') ? 'audio' : 'media'
                            }
                            activeProtocols={bandConfiguredProtocols}
                            isEditableByBand={true}
                            onProtocolsChange={(nextProtocols) => {
                              setBandConfiguredProtocols(nextProtocols);
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}

          {/* TEAMS TAB RENDERING */}
          {activeTab === 'TEAMS' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in w-full pb-16 px-4">
              <div className="bg-gradient-to-r from-fuchsia-950/20 to-zinc-950 border border-fuchsia-500/20 rounded-2xl p-6 space-y-2">
                <h2 className="text-xl font-black font-mono text-white flex items-center gap-2 uppercase tracking-wide">
                  <Users className="text-fuchsia-400 w-5 h-5 animate-pulse" />
                  Alliances & Collaborative Teams
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Form collaborative alliances with other specialist creatives. Partner with vector illustrators, color separators, layout technicians, or mastering engineers to execute complex project packages together.
                </p>
              </div>

              <div className="w-full">
                <CreativeAlliancesView
                  userProfile={userProfile}
                  triggerNotification={safeTriggerNotification}
                  addLog={addLog}
                />
              </div>
            </div>
          )}

          {/* SETTINGS TAB RENDERING */}
          {activeTab === 'SETTINGS' && (
            <div className="w-full animate-fade-in">
              <CreativeSettingsTab 
                userProfile={userProfile} 
                setUserProfile={setUserProfile} 
                activeClearanceLevel={5} 
                showLocalToast={safeTriggerNotification} 
                setLabelOAuthProcessor={() => {}}
                setLabelOAuthStep={() => {}}
                onLogout={onLogout}
              />
            </div>
          )}

          {/* QUICK PITCH APPLICATION MODAL OVERLAY */}
          <AnimatePresence>
            {applyingGig && (
              <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md"
                  onClick={() => setApplyingGig(null)}
                />

                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#090b0e] border border-fuchsia-500/20 w-full max-w-xl rounded-2xl overflow-hidden relative z-10 shadow-2xl flex flex-col font-mono"
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-zinc-900 bg-black flex justify-between items-center">
                    <span className="text-xs font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                      Select Pitch Template & Dispatch
                    </span>
                    <button 
                      onClick={() => setApplyingGig(null)}
                      className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Gig Summary */}
                  <div className="p-4 bg-zinc-950 border-b border-zinc-900 space-y-1 text-xs">
                    <span className="text-fuchsia-400 font-extrabold uppercase text-[9px] block">Target Placement Lead:</span>
                    <h3 className="text-white font-black uppercase text-xs">{applyingGig.title}</h3>
                    <div className="flex gap-4 text-[10px] text-zinc-400 mt-1.5 flex-wrap">
                      <span>Client: <strong className="text-fuchsia-300 font-medium">{applyingGig.client}</strong></span>
                      <span>Budget: <strong className="text-emerald-400 font-medium">{applyingGig.budget}</strong></span>
                      <span>Timeline: <strong className="text-amber-400 font-medium">{applyingGig.timeline}</strong></span>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-black block">
                        Choose Cover Pitch Template:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {pitchTemplates.map((temp, index) => (
                          <button
                            key={`${temp.id}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedTemplateIndex(index);
                              setCustomPitchLetter(temp.content);
                            }}
                            className={`text-left p-3.5 border rounded-xl transition-all flex flex-col justify-between cursor-pointer ${
                              selectedTemplateIndex === index 
                                ? 'border-fuchsia-500 bg-fuchsia-950/20 text-white' 
                                : 'border-zinc-900 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-950'
                            }`}
                          >
                            <span className="font-extrabold uppercase text-[9.5px] tracking-wide flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${selectedTemplateIndex === index ? 'bg-fuchsia-400' : 'bg-zinc-600'}`} />
                              {temp.title}
                            </span>
                            <p className="text-[10px] text-zinc-500 italic truncate w-full mt-1.5 font-sans">
                              "{temp.content}"
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cover letter editor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-black block">
                        Customized Pitch Cover Letter:
                      </label>
                      <textarea 
                        rows={4}
                        value={customPitchLetter}
                        onChange={(e) => setCustomPitchLetter(e.target.value)}
                        className="w-full bg-black border border-zinc-900 rounded-xl p-3 text-xs text-zinc-350 focus:outline-none focus:border-fuchsia-500 leading-relaxed font-mono"
                        placeholder="Provide customized pitch details here..."
                      />
                      <p className="text-[9px] text-zinc-550 leading-relaxed font-sans">
                        This pitch gets attached to your candidate profile of skills, verified portfolio work-samples, and active dry-hire gear specs when transmitted.
                      </p>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="p-4 bg-black border-t border-zinc-900 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setApplyingGig(null)}
                      className="bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-xl text-xs font-black uppercase text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyGig(applyingGig.id, customPitchLetter)}
                      className="bg-fuchsia-500 hover:bg-fuchsia-400 text-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-black" />
                      Transmit Encoded Pitch
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* EDIT PROFILE MODAL (REDEFINE PROFILE SPECS) */}
          <AnimatePresence>
            {isEditingProfile && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  onClick={() => setIsEditingProfile(false)}
                />

                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#090b0e] border border-zinc-900 w-full max-w-2xl rounded-2xl overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
                >
                  <div className="px-5 py-4 border-b border-zinc-900 bg-black flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-fuchsia-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                      REDEFINE PROFILE SPECIFICATIONS
                    </span>
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
                    
                    {/* 1. Primary Specialty */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-fuchsia-300">Primary Specialty Placement</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'Artist/Designer', label: 'Artist / Designer' },
                          { id: 'Sound Engineer/Recording', label: 'Sound / Recording' },
                          { id: 'Media/Photography', label: 'Photo / Video / Social' },
                          { id: 'Session Musician/Techs', label: 'Session / Tech' }
                        ].map((cat, idx) => (
                          <button
                            key={`${cat.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              setPrimaryCategory(cat.id);
                              // Assign category default preset skills
                              const presets = categoryTags[cat.id as keyof typeof categoryTags] || [];
                              setSelectedSkills(presets);
                              if (secondaryCategory === cat.id) {
                                setSecondaryCategory('');
                              }
                            }}
                            className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border text-center cursor-pointer ${
                              primaryCategory === cat.id 
                                ? 'bg-fuchsia-950/30 border-fuchsia-500 text-white shadow shadow-fuchsia-500/20'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 1b. Secondary Specialty Switcher */}
                    <div className="space-y-1.5 border-t border-zinc-900 pt-2.5">
                      <label className="block text-[10px] font-black uppercase text-purple-400">Secondary Specialty (Optional)</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {[
                          { id: 'Artist/Designer', label: 'Artist / Designer' },
                          { id: 'Sound Engineer/Recording', label: 'Sound / Recording' },
                          { id: 'Media/Photography', label: 'Photo / Video / Social' },
                          { id: 'Session Musician/Techs', label: 'Session / Tech' },
                          { id: '', label: 'None' }
                        ].map((cat, idx) => (
                          <button
                            key={`${cat.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (cat.id === '') {
                                setSecondaryCategory('');
                              } else {
                                if (cat.id === primaryCategory) {
                                  safeTriggerNotification('⚠️ Secondary specialty cannot be the same as your primary specialty!');
                                  return;
                                }
                                setSecondaryCategory(cat.id);
                              }
                            }}
                            className={`py-2 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border text-center cursor-pointer ${
                              (cat.id === '' && !secondaryCategory) || (secondaryCategory === cat.id)
                                ? 'bg-purple-950/30 border-purple-500 text-white shadow shadow-purple-500/20'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Personal Detail Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Full Name / Alias</label>
                        <input 
                          type="text" 
                          value={displayName} 
                          onChange={(e) => setDisplayName(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Business Name</label>
                        <input 
                          type="text" 
                          value={businessName} 
                          onChange={(e) => setBusinessName(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Creative Handle / Slug</label>
                        <input 
                          type="text" 
                          value={creativeHandle} 
                          onChange={(e) => setCreativeHandle(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Booking Email</label>
                        <input 
                          type="email" 
                          value={bookingEmail} 
                          onChange={(e) => setBookingEmail(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">City</label>
                          <input 
                            type="text" 
                            value={city} 
                            onChange={(e) => setCity(e.target.value)} 
                            placeholder="e.g. Austin"
                            className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">State / Province</label>
                          <select 
                            value={stateProvince} 
                            onChange={(e) => setStateProvince(e.target.value)} 
                            className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs"
                          >
                            <option value="">SELECT STATE...</option>
                            {US_STATES.map((st, idx) => (
                              <option key={`${st.code}-${idx}`} value={st.code}>{st.name.toUpperCase()} ({st.code})</option>
                            ))}
                            <option value="OUTSIDE_US">Outside US / Int'l</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Country</label>
                          <select 
                            value={country} 
                            onChange={(e) => setCountry(e.target.value)} 
                            className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs"
                          >
                            {COUNTRIES.map((c, cIdx) => (
                              <option key={`${c.code}-${cIdx}`} value={c.code}>{c.name.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio and rates details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-zinc-900 pt-3">
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Portfolio Link URL</label>
                        <input 
                          type="url" 
                          value={portfolioLink} 
                          onChange={(e) => setPortfolioLink(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Base Day Rate Setup ($)</label>
                        <div className="flex gap-2">
                          <select
                            value={rateType}
                            onChange={(e) => setRateType(e.target.value as any)}
                            className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono text-[10px] uppercase focus:outline-none"
                          >
                            <option value="day">Day Rate</option>
                            <option value="project">Project Tier</option>
                          </select>
                          <input 
                            type="text" 
                            value={dayRate} 
                            onChange={(e) => setDayRate(e.target.value)} 
                            className="flex-grow bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-fuchsia-500 text-xs" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Biography tagline summary */}
                    <div>
                      <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Biography Summary</label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-fuchsia-500 leading-normal"
                      />
                    </div>

                    {/* Skills tags config */}
                    <div className="space-y-1.5 border-t border-zinc-900 pt-3">
                      <label className="block text-[9px] uppercase font-black text-fuchsia-300">Assign Specialized Skills</label>
                      <div className="flex flex-wrap gap-1 pt-1 font-sans">
                        {(categoryTags[primaryCategory as keyof typeof categoryTags] || []).map((tag, idx) => {
                          const selected = selectedSkills.includes(tag);
                          return (
                            <button
                              key={`${tag}-${idx}`}
                              type="button"
                              onClick={() => toggleSkillTag(tag)}
                              className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                                selected 
                                  ? 'bg-fuchsia-950/40 border-fuchsia-500 text-white shadow' 
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                              }`}
                            >
                              {selected ? '✓ ' : ''}{tag}
                            </button>
                          );
                        })}
                      </div>

                      {/* Add Custom Skill form */}
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={customSkill} 
                            onChange={(e) => setCustomSkill(e.target.value)} 
                            placeholder="Add custom specialized skills..." 
                            className="flex-grow bg-zinc-950 border border-zinc-900 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-fuchsia-500 font-mono"
                          />
                          <button 
                            type="button" 
                            onClick={addCustomSkill}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-2 font-black text-[10px] rounded-lg tracking-wider uppercase cursor-pointer"
                          >
                            Add Skill
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gear specifications */}
                    <div className="space-y-1.5 border-t border-zinc-900 pt-3">
                      <label className="block text-[9px] uppercase font-black text-fuchsia-400">Gear Specifications & Equipment Inventory</label>
                      <div className="flex flex-wrap gap-1.5 font-sans">
                        {gearTags.map((g, gIdx) => (
                          <span key={`${g}-${gIdx}`} className="bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-mono">
                            🔧 {g}
                            <button type="button" onClick={() => removeGearTag(g)} className="text-zinc-500 hover:text-red-400 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <input 
                          type="text" 
                          value={newGearTag} 
                          onChange={(e) => setNewGearTag(e.target.value)} 
                          placeholder="Add gear or tech spec (e.g. Behringer X32, Wacom Cintiq)..." 
                          className="flex-grow bg-zinc-950 border border-zinc-900 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-fuchsia-500"
                        />
                        <button 
                          type="button" 
                          onClick={addGearTag}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-2 font-black text-[10px] rounded-lg tracking-wider uppercase cursor-pointer"
                        >
                          Add Gear
                        </button>
                      </div>
                    </div>

                    {/* Music genres specialties */}
                    <div className="space-y-2 border-t border-zinc-900 pt-3">
                      <label className="block text-[9px] uppercase font-black text-purple-400">Music Genres Specialty</label>
                      <div className="flex flex-wrap gap-1.5 pt-1 font-sans">
                        {[
                          'Grindcore', 'Hardcore', 'Death Metal', 'Crust Punk', 'Doom Metal', 
                          'Sludge', 'Darkwave', 'Synthwave', 'Post-Punk', 'Indie Rock'
                        ].map((genre, idx) => {
                          const selected = genreTags.includes(genre);
                          return (
                            <button
                              key={`${genre}-${idx}`}
                              type="button"
                              onClick={() => toggleGenrePreset(genre)}
                              className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                                selected 
                                  ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow' 
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                              }`}
                            >
                              {selected ? '●' : '○'} {genre}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <input 
                          type="text" 
                          value={newGenreInput} 
                          onChange={(e) => setNewGenreInput(e.target.value)} 
                          placeholder="Add custom musical genre specialty..." 
                          className="flex-grow bg-zinc-950 border border-zinc-900 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-fuchsia-500"
                        />
                        <button 
                          type="button" 
                          onClick={addGenreTag}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-2 font-black text-[10px] rounded-lg tracking-wider uppercase cursor-pointer"
                        >
                          Add Genre
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="p-4 bg-black border-t border-zinc-900 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-lg text-xs font-mono font-black uppercase text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveProfile();
                        setIsEditingProfile(false);
                      }}
                      className="bg-fuchsia-500 hover:bg-fuchsia-400 text-black px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Apply Specifications
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </section>
      </main>

      {/* CREATIVE PUBLIC PROFILE MODAL */}
      {selectedUserProfile && (
        <ProfileCard
          selectedUserProfile={selectedUserProfile}
          setSelectedUserProfile={setSelectedUserProfile}
          targetProfile={selectedUserProfile}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          portalRole="creative"
          profileActiveTab={profileActiveTab}
          setProfileActiveTab={setProfileActiveTab}
          triggerNotification={safeTriggerNotification}
          profileBlurb={bio}
          setProfileBlurb={setBio}
          saveProfileData={() => handleSaveProfile()}
          profilePrimaryGenres={genreTags}
          profileGenres={genreTags}
          profileTopSongArtist=""
          setProfileTopSongArtist={() => {}}
          profileTopSongTitle=""
          setProfileTopSongTitle={() => {}}
          setProfileFavoriteSong={() => {}}
          setProfileTopSongUrl={() => {}}
          rosterExpanded={false}
          setRosterExpanded={() => {}}
          collectionTab="all"
          setCollectionTab={() => {}}
          myCollections={[]}
          collPlayerActiveId=""
          setCollPlayerActiveId={() => {}}
          collPlayerActiveTrackId=""
          setCollPlayerActiveTrackId={() => {}}
          collPlayerIsPlaying={false}
          setCollPlayerIsPlaying={() => {}}
          selectedLabelBand=""
          setSelectedLabelBand={() => {}}
          profileActivePlaybackTrackId={null}
          setProfileActivePlaybackTrackId={() => {}}
          profileIsPlaying={false}
          setProfileIsPlaying={() => {}}
          profilePlaybackProgress={0}
          setProfilePlaybackProgress={() => {}}
          getProfileForUser={(u: any) => u}
          supabase={getSupabase()}
        />
      )}
    </div>
  );
}
