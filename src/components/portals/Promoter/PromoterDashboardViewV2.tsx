import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Band, Offer, Show, hasRegisteredWorkspace } from '../../../types';
import { Power, Globe, Users, User, DollarSign, Database, Activity, RefreshCw, Settings, X, Home, Lock, Sparkles, Layers, LogOut, Bell, Building, MapPin, MessageSquare, ArrowLeft, Send, CheckSquare, Check, Plus, AlertTriangle, TrendingUp, Shield, BarChart3, Radio, Heart, MessageCircle, Play, Pause, Square, SkipBack, SkipForward, Disc, Volume2, Truck, Tag, Edit, Trash2, Upload, ShoppingBag, ShoppingCart, CreditCard, Calendar, ArrowRightLeft, Package, Box, Banknote, ChevronDown, Calculator, Palette, Info, Search, Pin, Flame, Rocket, ThumbsUp, Menu, Briefcase, Star, Mail, ExternalLink, ChevronUp, Camera, Zap, Edit3, ChevronLeft, ChevronRight, Music, Maximize } from 'lucide-react';
import MarqueeText from '../../MarqueeText';
import { getSupabase, uploadBase64ToStorage, executeWithSchemaResilience } from '../../../supabase';
import { MASTER_GENRES } from '../../../constants/genres';

import PromoterSettingsTab from './PromoterSettingsTab';
import PromoterPortalView from "./PromoterPortalView";
import PromoterAlliancesView from './PromoterAlliancesView';
import PromoterWorkspaceProtocols from './PromoterWorkspaceProtocols';

interface PromoterDashboardViewV2Props {
  userProfile: UserProfile;

  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLogout: () => void;
  onBack?: () => void;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  bands: Band[];
  offers: Offer[];
  onCreateOffer?: (offer: Offer) => void;
  onUpdateOffer?: (offer: Offer) => void;
  shows?: Show[];
  notifications?: any[];
  onMarkAsRead?: (id: string) => void;
  onOpenNotifications?: () => void;
  activeBand?: any;
  activeBandId?: string;
  setActiveBandId?: (id: string) => void;
  isOfflineSimActive?: boolean;
  setIsOfflineSimActive?: React.Dispatch<React.SetStateAction<boolean>>;
  isOnline?: boolean;
  onUpgradeToPro?: () => void;
  setActiveTab?: (tab: string) => void;
}


// Preloaded beautiful gig leads that match different promoter categories
const SAMPLE_GIG_LEADS = [
  {
    id: 'route-1',
    category: 'Avails Request',
    title: 'Tour Booking Request: Iron Crypt / Starspawn',
    client: 'Goregrind Overlord Records',
    budget: '$1,500 Guarantee',
    timeline: 'Hold for July 12',
    tags: ['Death Metal', 'Package Tour'],
    description: 'Looking to route through the Southwest on a 5-date run. We need a 300+ cap room for this package. Radius clause applies.',
    region: 'Texas / New Mexico',
    difficulty: 'Priority Routing'
  },
  {
    id: 'route-2',
    category: 'Festival Submission',
    title: 'Local Support for Obsidian Moon Fest',
    client: 'Obsidian Moon Agency',
    budget: 'Door Split 70/30',
    timeline: 'August 28',
    tags: ['Doom', 'Fest'],
    description: 'Looking for strong regional doom/sludge support acts to open the main stage at 2PM.',
    region: 'Austin, TX',
    difficulty: 'Local Draw Required'
  },
  // We'll keep the rest truncated or replaced as well
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

export default function PromoterDashboardViewV2({
  userProfile,
  setUserProfile,
  onLogout,
  triggerNotification: propTriggerNotification,
  addLog: propAddLog,
  bands,
  offers,
  onCreateOffer,
  onUpdateOffer,
  shows,
  notifications,
  onMarkAsRead,
  onOpenNotifications,
  activeBand,
  activeBandId,
  setActiveBandId,
  isOfflineSimActive,
  setIsOfflineSimActive,
  isOnline,
  setActiveTab: setPortalActiveTab
}: PromoterDashboardViewV2Props) {
  const [activeTab, setActiveTab] = useState<'ROUTING'|'WORKSPACE'|'OFFERS'|'SALES'|'SOCIAL'|'SETTINGS'>('ROUTING');
  const [subTab, setSubTab] = useState<string>('');
  const [v2RoleMenuOpen, setV2RoleMenuOpen] = useState(false);
  const [isSpecsDrawerOpen, setIsSpecsDrawerOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxSubTab, setInboxSubTab] = useState('');

  // 72-Hour Promoter Trial Hook / States
  const isTrialActive = !!userProfile.promoter_setup_payment_later;
  const trialStartTime = Number(userProfile.promoter_trial_start_time) || Number(localStorage.getItem('promoter_trial_start_time')) || Date.now();
  const trialDurationMs = 72 * 60 * 60 * 1000; // 72 Hours
  const [currentTimeLeft, setCurrentTimeLeft] = useState<number>(() => {
    const end = trialStartTime + trialDurationMs;
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    if (!isTrialActive) return;
    const interval = setInterval(() => {
      const end = trialStartTime + trialDurationMs;
      const left = Math.max(0, end - Date.now());
      setCurrentTimeLeft(left);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTrialActive, trialStartTime]);

  const isTrialExpired = isTrialActive && currentTimeLeft <= 0;

  // Formatting hours, minutes, seconds remaining
  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const [localCheckoutCardName, setLocalCheckoutCardName] = useState('');
  const [localCheckoutCardNumber, setLocalCheckoutCardNumber] = useState('');
  const [localCheckoutCardExpiry, setLocalCheckoutCardExpiry] = useState('');
  const [localCheckoutCardCvc, setLocalCheckoutCardCvc] = useState('');
  const [localCheckoutCardZip, setLocalCheckoutCardZip] = useState('');
  const [localCheckoutError, setLocalCheckoutError] = useState('');
  const [localCheckoutLoading, setLocalCheckoutLoading] = useState(false);

  const handleVerifyPromoterPayment = async () => {
    setLocalCheckoutLoading(true);
    setLocalCheckoutError('');

    try {
      if (!localCheckoutCardName.trim()) {
        setLocalCheckoutError('CARDHOLDER NAME IS REQUIRED.');
        setLocalCheckoutLoading(false);
        return;
      }
      if (!localCheckoutCardNumber.trim() || localCheckoutCardNumber.replace(/\s/g, '').length < 16) {
        setLocalCheckoutError('INVALID CARD NUMBER. ENTER A VALID 16-DIGIT CARD NUMBER.');
        setLocalCheckoutLoading(false);
        return;
      }
      if (!localCheckoutCardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(localCheckoutCardExpiry)) {
        setLocalCheckoutError('INVALID EXPIRY DATE. USE MM/YY FORMAT.');
        setLocalCheckoutLoading(false);
        return;
      }
      if (!localCheckoutCardCvc.trim() || localCheckoutCardCvc.length < 3) {
        setLocalCheckoutError('INVALID CVC. ENTER 3 OR 4 DIGIT SECURITY CODE.');
        setLocalCheckoutLoading(false);
        return;
      }
      if (!localCheckoutCardZip.trim()) {
        setLocalCheckoutError('BILLING POSTAL CODE IS REQUIRED.');
        setLocalCheckoutLoading(false);
        return;
      }

      const updatedProfile = {
        ...userProfile,
        promoter_setup_payment_later: false,
        promoter_trial_start_time: null,
      };

      // Sync with Supabase if online
      const supabase = getSupabase();
      if (supabase) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(updatedProfile);
        if (profileError) {
          console.error("Supabase profile syncing failure in lockout promoter checkout:", profileError);
        }
      }

      // Update LocalStorage user_auth_store
      if (typeof window !== 'undefined') {
        const storeStr = localStorage.getItem('user_auth_store');
        if (storeStr) {
          try {
            const store = JSON.parse(storeStr);
            store.promoter_setup_payment_later = false;
            store.promoter_trial_start_time = null;
            localStorage.setItem('user_auth_store', JSON.stringify(store));
          } catch (e) {
            console.error(e);
          }
        }
        localStorage.removeItem('promoter_payment_deferred');
        localStorage.removeItem('promoter_trial_start_time');
      }

      // Update state
      setUserProfile(updatedProfile);
      setLocalCheckoutLoading(false);
      if (propTriggerNotification) {
        propTriggerNotification("⚡ PAYMENT VERIFIED successfully! Your Promoter Workspace is now fully unlocked.");
      } else {
        console.log("⚡ PAYMENT VERIFIED successfully!");
      }

    } catch (err: any) {
      console.error(err);
      setLocalCheckoutError(err.message || 'Payment authorization failed');
      setLocalCheckoutLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const oneYearFromNowStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sortedShows = shows ? [...shows].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const currentOrNextShow = sortedShows.find(s => s.date >= todayStr && s.date <= oneYearFromNowStr) || null;

  const allowedWorkspaces = userProfile.allowed_workspaces || [];

  // Safe notifications and logs
  const safeTriggerNotification = propTriggerNotification || ((msg: string) => console.log('NOTIFICATION:', msg));
  const safeAddLog = propAddLog || ((msg: string) => console.log('LOG:', msg));
  const triggerNotification = safeTriggerNotification;
  const addLog = safeAddLog;

  // --- MIGRATED V1 STATE HOOKS ---
  const [clearedBalance, setClearedBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`nexus_core_promoter_balance_${userProfile?.id || 'default'}`);
      return stored ? Number(stored) : 5100;
    } catch (_) {
      return 5100;
    }
  });

  const [availabilityStatus, setAvailabilityStatus] = useState<string>(() => {
    return userProfile.promoter_metadata?.availability_status || 'Available';
  });

  const [quickBroadcast, setQuickBroadcast] = useState<string>(() => {
    return userProfile.promoter_metadata?.quick_broadcast || 'Preparing artwork specs and mixing layouts for Q3 tour rosters.';
  });

  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [isEditingBroadcast, setIsEditingBroadcast] = useState(false);
  const [isPayoutExpanded, setIsPayoutExpanded] = useState(false);

  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'paypal' | 'none'>(() => {
    return (userProfile.promoter_metadata?.payout_method as any) || 'none';
  });

  const [stripeAccountId, setStripeAccountId] = useState<string>(() => {
    return userProfile.promoter_metadata?.stripe_account_id || '';
  });

  const [paypalEmail, setPaypalEmail] = useState<string>(() => {
    return userProfile.promoter_metadata?.paypal_email || '';
  });

  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [isSuccessfullyConnected, setIsSuccessfullyConnected] = useState(false);

  const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile fields state
  const [displayName, setDisplayName] = useState(userProfile.name || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.promoter_logo || '');
  const [businessName, setBusinessName] = useState(userProfile.promoter_metadata?.business_name || '');
  const [bookingEmail, setBookingEmail] = useState(userProfile.promoter_metadata?.booking_email || '');
  const [baseLocation, setBaseLocation] = useState(userProfile.promoter_metadata?.base_location || 'Austin, TX');
  const [portfolioLink, setPortfolioLink] = useState(userProfile.promoter_metadata?.portfolio_link || '');
  const [bio, setBio] = useState(userProfile.promoter_metadata?.bio || 'Full stack production assistant');
  const [dayRate, setDayRate] = useState<string>(String(userProfile.promoter_metadata?.day_rate || '350'));
  const [rateType, setRateType] = useState<'day' | 'project'>(userProfile.promoter_metadata?.rate_type || 'day');
  const [pricingNotes, setPricingNotes] = useState(userProfile.promoter_metadata?.pricing_notes || 'Flexible depending on label sizes.');

  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    return userProfile.promoter_metadata?.selected_skills || [];
  });

  const [genreTags, setGenreTags] = useState<string[]>(() => {
    return userProfile.promoter_metadata?.genre_tags || ['Death Metal', 'Grindcore', 'Hardcore Punk', 'Doom'];
  });

  const [gearTags, setGearTags] = useState<string[]>(() => {
    return userProfile.promoter_metadata?.gear_tags || ['Wacom Cintiq Pro', 'Adobe Promoter Suite', 'Nikon Z6 II DSLR'];
  });

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
    return userProfile.promoter_metadata?.primary_category || 'Artist/Designer';
  });

  const [secondaryCategory, setSecondaryCategory] = useState<string>(() => {
    return userProfile.promoter_metadata?.secondary_category || '';
  });

  // Gigs matching & feed persistence
  const [appliedGigIds, setAppliedGigIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`nexus_core_promoter_gigs_applied_${userProfile?.id || 'default'}`);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const [expandedGigs, setExpandedGigs] = useState<Record<string, boolean>>({});
  const [leadsSubFilter, setLeadsSubFilter] = useState<'primary' | 'secondary' | 'all'>('primary');

  const [pitchTemplates, setPitchTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem(`nexus_core_promoter_pitch_templates_${userProfile?.id || 'default'}`);
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
      const saved = localStorage.getItem(`nexus_core_promoter_portfolio_${userProfile?.id || 'default'}`);
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
      const saved = localStorage.getItem(`nexus_core_promoter_gallery_${userProfile?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
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
      const saved = localStorage.getItem(`nexus_core_promoter_proposals_${userProfile?.id || 'default'}`);
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
      const saved = localStorage.getItem(`nexus_core_promoter_blocked_dates_${userProfile?.id || 'default'}`);
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
      localStorage.setItem(`nexus_core_promoter_blocked_dates_${userProfile?.id || 'default'}`, JSON.stringify(manualBlockedDates));
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
      const saved = localStorage.getItem('nexus_core_promoter_contracts_v1');
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
      const saved = localStorage.getItem('nexus_core_promoter_contracts_v1');
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
      const savedContractsStr = localStorage.getItem('nexus_core_promoter_contracts_v1');
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

        localStorage.setItem('nexus_core_promoter_contracts_v1', JSON.stringify(updatedContracts));

        // Sync to Supabase
        const supabase = getSupabase();
        if (supabase) {
          supabase.from('promoter_contracts_v1')
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
        const savedContractsStr = localStorage.getItem('nexus_core_promoter_contracts_v1');
        if (savedContractsStr) {
          const savedContracts = JSON.parse(savedContractsStr);
          
          // Match the user profile's name or allow general sandbox match
          const matchingContracts = savedContracts.filter((c: any) => {
            return c.promoter_name === displayName || c.promoter_id === 'c-vortex' || !c.promoter_name;
          });

          if (matchingContracts.length > 0) {
            const contractProposals = matchingContracts.map((c: any) => ({
              id: c.id,
              bandName: c.band_name || 'Hiring Band',
              projectType: c.promoter_category === 'visual' ? 'Logo & Custom Cover Merch illustration' :
                           c.promoter_category === 'audio' ? 'FOH Playback Mix Support & EQ check' : 'Promotional Tour Video Teaser',
              deadline: `${c.timeline_days || 5} Days`,
              description: c.project_title || 'Direct hired promoter contract with quality control protocols.',
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
      localStorage.setItem(`nexus_core_promoter_balance_${userProfile?.id || 'default'}`, String(clearedBalance));
    } catch (_) {}
  }, [clearedBalance, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_promoter_gigs_applied_${userProfile?.id || 'default'}`, JSON.stringify(appliedGigIds));
    } catch (_) {}
  }, [appliedGigIds, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_promoter_pitch_templates_${userProfile?.id || 'default'}`, JSON.stringify(pitchTemplates));
    } catch (_) {}
  }, [pitchTemplates, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_promoter_portfolio_${userProfile?.id || 'default'}`, JSON.stringify(portfolioItems));
    } catch (_) {}
  }, [portfolioItems, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_promoter_gallery_${userProfile?.id || 'default'}`, JSON.stringify(galleryItems));
    } catch (_) {}
  }, [galleryItems, userProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_promoter_proposals_${userProfile?.id || 'default'}`, JSON.stringify(proposals));
    } catch (_) {}
  }, [proposals, userProfile?.id]);

  // Synchronize state from userProfile object changes (database reload)
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || '');
      setAvatarUrl(userProfile.promoter_logo || '');
      setBusinessName(userProfile.promoter_metadata?.business_name || '');
      setBookingEmail(userProfile.promoter_metadata?.booking_email || '');
      setBaseLocation(userProfile.promoter_metadata?.base_location || 'Austin, TX');
      setPortfolioLink(userProfile.promoter_metadata?.portfolio_link || '');
      setBio(userProfile.promoter_metadata?.bio || '');
      setDayRate(String(userProfile.promoter_metadata?.day_rate || '350'));
      setPricingNotes(userProfile.promoter_metadata?.pricing_notes || '');
      setAvailabilityStatus(userProfile.promoter_metadata?.availability_status || 'Available');
      setQuickBroadcast(userProfile.promoter_metadata?.quick_broadcast || 'Ready for assignments.');
      setSelectedSkills(Array.isArray(userProfile.promoter_metadata?.selected_skills) ? userProfile.promoter_metadata.selected_skills : (userProfile.promoter_metadata?.selected_skills ? [userProfile.promoter_metadata.selected_skills as string] : []));
      setPayoutMethod((userProfile.promoter_metadata?.payout_method as any) || 'none');
      setStripeAccountId(userProfile.promoter_metadata?.stripe_account_id || '');
      setPaypalEmail(userProfile.promoter_metadata?.paypal_email || '');
    }
  }, [userProfile?.id]);

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
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'promoter-avatar');
            setAvatarUrl(publicUrl);
            setUserProfile((prev: any) => ({
              ...prev,
              promoter_logo: publicUrl
            }));
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              await executeWithSchemaResilience(
                async (payload) => supabase.from('profiles').update(payload).eq('id', userProfile.id),
                {
                  promoter_metadata: {
                    ...(userProfile?.promoter_metadata || {}),
                    promoter_logo: publicUrl,
                    logo_url: publicUrl
                  }
                }
              );
            }
            safeTriggerNotification('✓ Profile photo updated.');
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
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'promoter-banner');
            setUserProfile((prev: any) => ({
              ...prev,
              promoter_cover_image: publicUrl
            }));
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              await executeWithSchemaResilience(
                async (payload) => supabase.from('profiles').update(payload).eq('id', userProfile.id),
                {
                  promoter_metadata: {
                    ...(userProfile?.promoter_metadata || {}),
                    promoter_cover_image: publicUrl,
                    cover_url: publicUrl,
                    banner_url: publicUrl
                  }
                }
              );
            }
            safeTriggerNotification('✓ Banner background updated.');
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
      ...userProfile.promoter_metadata,
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

    setUserProfile((prev: any) => ({
      ...prev,
      name: displayName,
      promoter_logo: avatarUrl,
      promoter_metadata: updatedMetadata
    }));

    // Persist to Supabase
    const supabase = getSupabase();
    if (supabase && userProfile?.id) {
      try {
        await executeWithSchemaResilience(
          async (payload) => supabase.from('profiles').update(payload).eq('id', userProfile.id),
          {
            full_name: displayName,
            promoter_metadata: updatedMetadata
          }
        );
        console.log('✓ Successfully synced promoter specifications with Supabase ledger.');
      } catch (err) {
        console.error('Failed to update Supabase promoter profile metadata:', err);
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

  const renderGigItem = (gig: typeof SAMPLE_GIG_LEADS[0]) => {
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
      borderColor = 'border-lime-500/40';
      hoverBorderColor = 'hover:border-lime-400/80 hover:shadow-[0_4px_30px_rgba(217,70,239,0.15)]';
      dotColor = 'bg-lime-400';
      textColor = 'text-lime-400';
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
      <div key={`promoter-gig-lead-${gig.id}`} className={`${currentStyles.bg} ${currentStyles.hover} border rounded-2xl transition-all duration-300 relative overflow-hidden group`}>
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
            <h3 className={`text-xs sm:text-sm font-black uppercase font-mono mt-2.5 tracking-wide leading-snug transition-colors ${currentStyles.isMetallic ? 'bg-gradient-to-r from-yellow-100 via-yellow-400 to-amber-500 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : currentStyles.isSilver ? 'bg-gradient-to-r from-white via-zinc-100 via-white to-zinc-350 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white group-hover:text-lime-400'}`}>{gig.title}</h3>
            <p className="text-[11px] font-mono text-zinc-400">Client Hub: <strong className="text-lime-300 font-medium">{gig.client}</strong></p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="text-right">
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 block tracking-wide">{gig.budget}</span>
              <span className="text-[9.5px] font-mono text-zinc-550 block font-bold mt-0.5">{gig.timeline}</span>
            </div>
            <div className="text-zinc-500 group-hover:text-zinc-300 pt-0.5 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-lime-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-lime-400 transition-colors" />
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
                        : 'bg-lime-900/20 hover:bg-lime-900/40 border border-lime-500/50 hover:border-lime-400 text-white active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lime-950/40'
                    }`}
                  >
                    {hasApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        PITCH TRANSMITTED
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 text-lime-400" />
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

  if (isTrialExpired) {
    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black p-4 select-none overflow-y-auto">
        <div className="w-full max-w-md bg-zinc-950 border border-yellow-500 rounded-2xl p-6 shadow-2xl relative space-y-6 text-left">
          {/* Border accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse" />
          
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-950/40 border border-red-500/50 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-black tracking-widest uppercase text-white">
              🛑 72-HOUR TRIAL EXPIRED
            </h3>
            <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
              PROMOTER WORKSPACE ACCESS SUSPENDED
            </p>
          </div>

          <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-4 space-y-2 text-left">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your 72-hour temporary trial access to the integrated Venue Promoter Gateway has expired. Enter and verify a valid payment method below to resume your licensing key access, calendar routes, and booking ledgers.
            </p>
          </div>

          {/* Card Details form */}
          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">CARDHOLDER NAME</label>
              <input 
                type="text" 
                placeholder="ENTER CARDHOLDER FULL NAME"
                value={localCheckoutCardName}
                onChange={(e) => setLocalCheckoutCardName(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">CARD NUMBER</label>
              <input 
                type="text" 
                maxLength={19}
                placeholder="0000 0000 0000 0000"
                value={localCheckoutCardNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                  const matches = v.match(/\d{4,16}/g);
                  const match = matches && matches[0] || '';
                  const parts = [];
                  for (let i=0, len=match.length; i<len; i+=4) {
                    parts.push(match.substring(i, i+4));
                  }
                  if (parts.length > 0) {
                    setLocalCheckoutCardNumber(parts.join(' '));
                  } else {
                    setLocalCheckoutCardNumber(v);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left col-span-1">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">EXPIRY</label>
                <input 
                  type="text" 
                  maxLength={5}
                  placeholder="MM/YY"
                  value={localCheckoutCardExpiry}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    if (v.length >= 2) {
                      setLocalCheckoutCardExpiry(`${v.slice(0, 2)}/${v.slice(2, 4)}`);
                    } else {
                      setLocalCheckoutCardExpiry(v);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left col-span-1">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">CVC</label>
                <input 
                  type="text" 
                  maxLength={4}
                  placeholder="123"
                  value={localCheckoutCardCvc}
                  onChange={(e) => setLocalCheckoutCardCvc(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left col-span-1">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">POSTAL CODE</label>
                <input 
                  type="text" 
                  placeholder="12345"
                  value={localCheckoutCardZip}
                  onChange={(e) => setLocalCheckoutCardZip(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
            </div>
          </div>

          {localCheckoutError && (
            <p className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-widest text-left">
              ⚠️ {localCheckoutError}
            </p>
          )}

          {/* Unlock / Logout buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleVerifyPromoterPayment}
              disabled={localCheckoutLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-neutral-950 font-black py-3 rounded-lg text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {localCheckoutLoading ? 'VERIFYING CREDENTIALS...' : 'AUTHORIZE CARD & RESTORE ACCESS'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              LOGOUT / RETURN TO LANDING
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-100 flex flex-col items-center selection:bg-lime-500/30 selection:text-lime-400">
      {isTrialActive && !isTrialExpired && (
        <div className="w-full bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-600/10 border-b border-yellow-500/20 px-4 py-1.5 flex flex-wrap items-center justify-between text-left gap-2 z-[41]">
          <div className="flex items-center gap-2">
            <span className="animate-pulse flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <p className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-widest leading-none">
              ⚡ 72-HOUR WORKSPACE TRIAL ACTIVE • {formatTimeLeft(currentTimeLeft)} REMAINING
            </p>
          </div>
          <button
            onClick={() => {
              const verify = window.confirm("WOULD YOU LIKE TO CONVERT YOUR TRIAL AND CONFIGURE YOUR PERMANENT PAYMENT METHOD NOW?");
              if (verify) {
                const name = window.prompt("ENTER CARDHOLDER FULL NAME:");
                if (name && name.trim()) {
                  alert("CREDIT CARD SECURELY AUTHORIZED & SUBSCRIPTION ACTIVATED!");
                  const updatedProfile = {
                    ...userProfile,
                    promoter_setup_payment_later: false,
                    promoter_trial_start_time: null,
                  };
                  setUserProfile(updatedProfile);
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('promoter_payment_deferred');
                    localStorage.removeItem('promoter_trial_start_time');
                    const storeStr = localStorage.getItem('user_auth_store');
                    if (storeStr) {
                      try {
                        const store = JSON.parse(storeStr);
                        store.promoter_setup_payment_later = false;
                        store.promoter_trial_start_time = null;
                        localStorage.setItem('user_auth_store', JSON.stringify(store));
                      } catch (e) { console.error(e); }
                    }
                  }
                  getSupabase()?.from('profiles').upsert(updatedProfile).then();
                }
              }
            }}
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer"
          >
            VERIFY PAYMENT METHOD
          </button>
        </div>
      )}
      {/* STICKY TOP HEADER ROW */}
      <div className="sticky top-0 z-20 bg-[#0c0e12]/95 backdrop-blur-md border-b border-zinc-900 w-full shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col">
        {/* BRAND NAVIGATION HEADER */}
        <div className="px-5 py-3 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('ROUTING');
                setSubTab('');
              }}
              className="flex items-center select-none shrink-0 cursor-pointer hover:opacity-85 active:scale-98 transition-all focus:outline-none"
              title="Return to Home Dashboard"
            >
              <img 
                src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png" 
                alt="Nexus Core" 
                className="object-contain"
                style={{ width: '130px', height: '48.7px' }}
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Tonight's Active Show Pill */}
            <button
              type="button"
              onClick={() => {
                if (currentOrNextShow) {
                  setActiveTab('WORKSPACE');
                  triggerNotification?.(`Direct route: tonight's stop details (${currentOrNextShow.festival_name || currentOrNextShow.name})`);
                } else {
                  triggerNotification?.(`Direct route: no active show tonight`);
                }
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-850 text-[8px] font-bold uppercase tracking-wider font-mono shrink-0 transition-all cursor-pointer bg-zinc-900/80 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 shadow-md"
              title="Tonight's active show stop - Click to open show details"
            >
              <MapPin className="w-3 h-3 text-[#39ff14] animate-pulse" />
              <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest leading-none mr-0.5">TONIGHT:</span>
              <span className="truncate max-w-[100px] text-[#39ff14] font-black uppercase">
                {currentOrNextShow ? (currentOrNextShow.festival_name || currentOrNextShow.name) : "Day Off"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2"><button
              onClick={() => {
                setActiveTab('SETTINGS');
                setSubTab('team_subscription');
              }}
              className="hidden md:flex rounded-full px-2 py-0.5 items-center gap-1.5 transition text-[7.5px] sm:text-[8px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30"
            >
              <span className="w-1 h-1 rounded-full animate-pulse bg-lime-500 shrink-0" />
              <span className="text-lime-400">LEVEL 5 CLEARANCE</span>
            </button>

            {/* Notifications Button */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all text-[8px] font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                <div className="relative">
                  <Bell className="w-3.5 h-3.5" />
                  {notifications && (notifications || []).some(n => !n.is_read) && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse shadow-[0_0_8px_#ccff00]" />
                  )}
                </div>
                <span className="hidden sm:inline">NOTICES</span>
              </button>
            )}

            {/* Interactive Profile Avatar Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setV2RoleMenuOpen(!v2RoleMenuOpen)}
                className="w-8 h-8 rounded-full bg-lime-950/40 border border-lime-500/50 flex items-center justify-center font-black text-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all active:scale-95 overflow-hidden shadow-md cursor-pointer hover:border-lime-400"
              >
                {userProfile.promoter_logo ? (
                  <img src={userProfile.promoter_logo} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <Globe className="w-4 h-4 text-lime-500" />
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
                          <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900/90 overflow-hidden flex items-center justify-center font-bold text-lime-500 text-sm font-mono uppercase relative">
                            {userProfile.promoter_logo ? (
                              <img src={userProfile.promoter_logo} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <Globe className="w-4 h-4 text-lime-500" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImageUpload(e); setV2RoleMenuOpen(false); }} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[7px] uppercase font-bold text-lime-400">
                              Edit
                            </div>
                          </div>
                        </label>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-black text-zinc-100 truncate uppercase tracking-tight">
                            {(userProfile.promoter_metadata?.business_name) || 'PROMOTER HQ'}
                          </p>
                          <p className="text-[8.5px] text-zinc-500 font-mono truncate">
                            slug: {userProfile.console_handle || 'hq'}
                          </p>
                        </div>
                        <span className="bg-lime-500/10 border border-lime-500/20 text-lime-400 text-[8px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
                          SECURE NODE
                        </span>
                      </div>

                      <div className="pt-3 pb-3 border-b border-zinc-800/80">
                        <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase mb-1.5">CONSOLE ARCHITECTURE</span>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            disabled
                            className="flex items-center justify-center py-2 rounded-xl bg-lime-950/20 border border-lime-500/50 text-lime-400 font-black font-mono tracking-wider text-[9px]"
                          >
                            ⚙️ V2 CONSOLE
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
            { id: 'ROUTING', label: 'Routing', icon: MapPin },
            { id: 'WORKSPACE', label: 'Workspace', icon: CheckSquare },
            { id: 'OFFERS', label: 'Offers', icon: Banknote },
            { id: 'SALES', label: 'Sales', icon: ShoppingCart },
            { id: 'SOCIAL', label: 'Social', icon: MessageSquare },
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
                  <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full w-10 h-10 mx-auto -z-10 animate-pulse" />
                )}
                <IconComponent className={`w-5 h-5 mb-1 transition-all ${
                  isActive
                    ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] scale-110'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`} />
                <span className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors ${
                  isActive ? 'text-yellow-400 font-black' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-8 h-[3px] bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.8)] rounded-t-full absolute bottom-0" />
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
              text={(userProfile.promoter_metadata?.business_name) || 'PROMOTER HQ'}
              className="font-display font-black tracking-wider text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.65)] uppercase font-sans text-[18px]"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-500/20 bg-yellow-950/15 text-yellow-400 text-[8.5px] font-bold uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(234,179,8,0.15)] select-none">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-yellow-400 shadow-[0_0_8px_#facc15]" />
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
            : (activeTab === 'SALES')
              ? 'max-w-full p-0 sm:p-0 pb-16'
              : 'max-w-[1480px] p-4 sm:p-6 pb-16'
      }`}>
        {/* Content Viewport */}
        
      
      <section className="min-h-[500px] w-full">

          {activeTab === 'ROUTING' && (
            <div className="space-y-6">
              {/* MOBILE ONLY PROFILE HEADER */}
              <div className="block lg:hidden yellow-chase-border-mobile pulse-glow-yellow w-full shadow-2xl mb-6">
                <div className="backdrop-blur-md rounded-[calc(1rem-2px)] bg-[#090b0e]/95 flex flex-col items-center sm:items-stretch justify-between gap-5 relative overflow-hidden p-5 sm:p-6 w-full shadow-2xl border border-zinc-800/10" id="label-profile-card-mobile-v2">
                  {/* Optional Cover Image in Top Half with bottom fade-out */}
                  {userProfile.promoter_cover_image && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0">
                      <img 
                        src={userProfile.promoter_cover_image} 
                        alt="Label Banner" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/50 to-[#090b0e]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(#ccff0007_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" id="label-tonal-mobile" />
                  <div className="absolute top-0 right-1/4 w-[200px] h-[200px] rounded-full bg-[#ccff00]/5 blur-[70px] pointer-events-none" />

                  {/* Upper Action Buttons - Administration Tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                    <label className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#ccff00] text-[#ccff00]/90 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
                      className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#ccff00] text-zinc-450 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black group"
                      title="REDEFINE LABEL SPECS"
                    >
                      <Settings className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Profile Avatar & Primary Identification */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10 w-full mb-1 mt-6">
                    {/* Profile Picture Upload Indicator */}
                    <label className="relative group shrink-0 cursor-pointer mx-auto sm:mx-0">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ccff00] via-[#fdba74] to-[#ffedd5] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 lime-pulse-glow" />
                      <div className="relative w-32 h-32 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/80 flex items-center justify-center shadow-lg group-hover:border-[#ccff00] transition-colors lime-pulse-glow">
                        {userProfile.promoter_logo ? (
                          <img 
                            src={userProfile.promoter_logo} 
                            alt="Logo" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Globe className="w-12 h-12 text-[#ccff00] group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {/* Invisible file input */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1 py-0.5 rounded border border-[#ccff00]/30">Edit</span>
                        </div>
                      </div>
                    </label>

                    {/* Company Details Stack */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h1 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                        <span>{(userProfile.promoter_metadata?.business_name) || 'PROMOTER HQ'}</span>
                      </h1>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs text-zinc-450 font-mono leading-relaxed">
                        <span className="lowercase text-zinc-400 bg-zinc-950/60 px-2.5 py-1 rounded-xl border border-zinc-850 font-sans">
                          nexus-core.app/{userProfile.console_handle || 'hq'}
                        </span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-[#ccff00] uppercase tracking-wider font-extrabold flex items-center gap-1">
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
                    </div>
                  </div>

                  {/* Centered Subscription/Roster details for mobile view */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2 w-full text-[10px] font-mono tracking-wider uppercase z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-[#ccff00] font-bold">{'PRO PROMOTER'}</span>
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
                    className="w-full mt-2 py-3 px-4 rounded-xl border border-lime-500/25 hover:border-lime-500/55 bg-lime-950/20 hover:bg-lime-950/40 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-[#ccff00] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-250 animate-pulse" />
                      <div>
                        <span className="block font-bold text-white text-[10px] tracking-wider uppercase">Label Message Center</span>
                        <span className="text-[8.5px] text-zinc-500 block uppercase font-bold mt-0.5">💬 View and reply to direct band discussions</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-lime-950/80 text-lime-400 border border-lime-500/40 animate-pulse">
                      Active
                    </span>
                  </button>
                </div>
              </div>

              {/* DESKTOP ONLY PROFILE HEADER */}
              <div className="hidden lg:block yellow-chase-border pulse-glow-yellow w-full shadow-2xl relative mb-6">
                <div className="backdrop-blur-md rounded-[calc(1.5rem-2.2px)] bg-[#090b0e]/95 flex flex-col items-center justify-between gap-6 relative overflow-hidden p-8 w-full animate-fade-in" id="label-profile-card-desktop-v2">
                  {/* Optional Cover Image in Top Half with bottom fade-out */}
                  {userProfile.promoter_cover_image && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0">
                      <img 
                        src={userProfile.promoter_cover_image} 
                        alt="Label Banner" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/50 to-[#090b0e]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(#ccff0007_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" id="label-tonal-desktop" />
                  <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#ccff00]/5 blur-[90px] pointer-events-none" />

                  {/* Action buttons - Administration Tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
                    <label className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#ccff00] text-[#ccff00]/90 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase">
                      <Upload className="w-4 h-4" />
                      <span>CHANGE BANNER</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                    </label>

                    <button 
                      type="button"
                      onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
                      className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#ccff00] text-[#ccff00]/90 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black group"
                      title="REDEFINE LABEL SPECS"
                    >
                      <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                    </button>
                  </div>

                  {/* Central Column Profile Avatar & Visual details */}
                  <div className="flex max-w-7xl flex-col items-center gap-5 text-center relative z-10 w-full animate-fade-in mt-2">
                    <label className="relative group shrink-0 cursor-pointer mx-auto" title="Click to upload/change corporate corporate avatar">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ccff00] via-[#fdba74] to-[#ffedd5] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 lime-pulse-glow" />
                      <div className="relative w-48 h-48 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/85 flex items-center justify-center shadow-lg group-hover:border-[#ccff00] transition-colors lime-pulse-glow">
                        {userProfile.promoter_logo ? (
                          <img 
                            src={userProfile.promoter_logo} 
                            alt="Logo" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Globe className="w-16 h-16 text-[#ccff00] group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {/* Real file upload input triggers on label click */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1.5 py-1 rounded border border-[#ccff00]/30">Upload</span>
                        </div>
                      </div>
                    </label>

                    {/* Label Specifications Stack */}
                    <div className="flex flex-col items-center text-center space-y-3 w-full">
                      <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center gap-2">
                        <span>{(userProfile.promoter_metadata?.business_name) || 'PROMOTER HQ'}</span>
                      </h1>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono w-full">
                        <div className="lowercase bg-zinc-950/60 px-3.5 py-1.5 rounded-xl border border-zinc-900/50 font-bold text-zinc-400 font-sans">
                          nexus-core.app/{userProfile.console_handle || 'hq'}
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        <div className="text-xs text-zinc-350 font-mono flex items-center justify-center gap-1.5 p-1.5 px-3 bg-[#101319]/80 border border-zinc-900/80 rounded-xl shrink-0">
                          <span className="text-[#ccff00] uppercase tracking-wider font-extrabold flex items-center gap-1">
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
                      </div>
                    </div>
                  </div>

                  {/* Custom Subscription caps & metadata */}
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-[11px] font-mono tracking-widest uppercase z-10 w-full">
                    <div className="flex flex-col items-center">
                      <span className="text-[#ccff00] font-extrabold">{'PRO PROMOTER'}</span>
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
                    className="w-full max-w-2xl mx-auto mt-2 py-3.5 px-5 rounded-2xl border border-lime-500/20 hover:border-lime-500/55 bg-lime-950/20 hover:bg-lime-950/35 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <MessageSquare className="w-5 h-5 text-lime-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-250 animate-pulse" />
                      <div>
                        <span className="block font-bold text-white text-[11px] tracking-wider uppercase">Label Message Center</span>
                        <span className="text-[9px] text-[#ccff00] block uppercase font-bold mt-0.5">💬 Access direct discussions and booking inquiries with signed bands</span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-lime-950/80 text-lime-400 border border-lime-500/40 animate-pulse">
                      Active
                    </span>
                  </button>

                </div>
              </div>

              {/* TWO COLUMN INTERACTIVE LAYOUT (REPLACED WITH HIGH-DENSITY COMMAND DECK) */}
              <div className="w-full mt-6 space-y-4">
                {/* High-Velocity Launcher Deck - Refactored to 2x2 Grid with Custom Color Borders */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    onClick={() => setActiveTab('WORKSPACE')}
                    className="bg-zinc-900/40 border-2 border-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-white font-mono text-[11px] py-3 rounded-xl text-center font-bold transition-all truncate px-2 cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.1)] active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>📅</span> EVENT WORKSPACE
                  </button>
                  <button 
                    onClick={() => setActiveTab('OFFERS')}
                    className="bg-zinc-900/40 border-2 border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white font-mono text-[11px] py-3 rounded-xl text-center font-bold transition-all truncate px-2 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.1)] active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>📝</span> CONTRACTS HUB
                  </button>
                  <button 
                    onClick={() => setActiveTab('SALES')}
                    className="bg-zinc-900/40 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white font-mono text-[11px] py-3 rounded-xl text-center font-bold transition-all truncate px-2 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>📊</span> SALES MANAGER
                  </button>
                  <button 
                    onClick={() => setActiveTab('SALES')}
                    className="bg-zinc-900/40 border-2 border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-white font-mono text-[11px] py-3 rounded-xl text-center font-bold transition-all truncate px-2 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.1)] active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>🎟️</span> DOOR TERMINAL
                  </button>
                </div>

                {/* Tab Switcher Ribbon */}
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <button 
                    onClick={() => setSubTab('calendar')}
                    className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider rounded-t-md transition-all ${(!subTab || subTab === 'calendar') ? 'text-lime-400 border-b-2 border-lime-400 bg-lime-950/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Calendar & Show Itineraries
                  </button>
                  <button 
                    onClick={() => setSubTab('regional')}
                    className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider rounded-t-md transition-all ${(subTab === 'regional') ? 'text-lime-400 border-b-2 border-lime-400 bg-lime-950/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Regional Routing Control
                  </button>
                </div>

                {/* Calendar & Show Itineraries */}
                {(!subTab || subTab === 'calendar') && (
                  <div className="w-full animate-fade-in -mt-2">
                    <PromoterPortalView 
                      isolatedTab="routing"
                      userProfile={userProfile}
                      setUserProfile={setUserProfile}
                      onLogout={onLogout}
                      triggerNotification={triggerNotification}
                      addLog={addLog}
                      bands={bands}
                      offers={offers}
                      onCreateOffer={onCreateOffer!}
                      onUpdateOffer={onUpdateOffer!}
                      shows={shows}
                      showOnlyCalendar={true}
                    />
                  </div>
                )}

                {/* Regional Routing Control Room */}
                {subTab === 'regional' && (
                  <div className="w-full animate-fade-in -mt-2">
                    <PromoterPortalView 
                      isolatedTab="routing"
                      userProfile={userProfile}
                      setUserProfile={setUserProfile}
                      onLogout={onLogout}
                      triggerNotification={triggerNotification}
                      addLog={addLog}
                      bands={bands}
                      offers={offers}
                      onCreateOffer={onCreateOffer!}
                      onUpdateOffer={onUpdateOffer!}
                      shows={shows}
                      showOnlyRoutingAndAvailability={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PORTFOLIO TAB RENDERING (WITH DUPLICATED CLIENT REVIEWS) */}
          {activeTab === 'WORKSPACE' && (
            <div className="w-full h-full animate-fade-in">
              <PromoterPortalView 
                isolatedTab="workspace"
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onLogout={onLogout}
                triggerNotification={triggerNotification}
                addLog={addLog}
                bands={bands}
                offers={offers}
                onCreateOffer={onCreateOffer!}
                onUpdateOffer={onUpdateOffer!}
                shows={shows}
              />
            </div>
          )}

          {/* BOOKINGS TAB RENDERING */}
          {activeTab === 'OFFERS' && (
            <div className="w-full h-full animate-fade-in">
              <PromoterPortalView 
                isolatedTab="offers"
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onLogout={onLogout}
                triggerNotification={triggerNotification}
                addLog={addLog}
                bands={bands}
                offers={offers}
                onCreateOffer={onCreateOffer!}
                onUpdateOffer={onUpdateOffer!}
                shows={shows}
              />
            </div>
          )}

          {/* TEAMS TAB RENDERING */}
          {activeTab === 'SALES' && (
            <div className="w-full h-full animate-fade-in">
              <PromoterPortalView 
                isolatedTab="sales"
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onLogout={onLogout}
                triggerNotification={triggerNotification}
                addLog={addLog}
                bands={bands}
                offers={offers}
                onCreateOffer={onCreateOffer!}
                onUpdateOffer={onUpdateOffer!}
                shows={shows}
              />
            </div>
          )}

          {/* SETTINGS TAB RENDERING */}
          {activeTab === 'SETTINGS' && (
            <div className="w-full animate-fade-in">
              <PromoterSettingsTab 
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
                  className="bg-[#090b0e] border border-lime-500/20 w-full max-w-xl rounded-2xl overflow-hidden relative z-10 shadow-2xl flex flex-col font-mono"
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-zinc-900 bg-black flex justify-between items-center">
                    <span className="text-xs font-black text-lime-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-lime-400 animate-pulse" />
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
                    <span className="text-lime-400 font-extrabold uppercase text-[9px] block">Target Placement Lead:</span>
                    <h3 className="text-white font-black uppercase text-xs">{applyingGig.title}</h3>
                    <div className="flex gap-4 text-[10px] text-zinc-400 mt-1.5 flex-wrap">
                      <span>Client: <strong className="text-lime-300 font-medium">{applyingGig.client}</strong></span>
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
                                ? 'border-lime-500 bg-lime-950/20 text-white' 
                                : 'border-zinc-900 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-950'
                            }`}
                          >
                            <span className="font-extrabold uppercase text-[9.5px] tracking-wide flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${selectedTemplateIndex === index ? 'bg-lime-400' : 'bg-zinc-600'}`} />
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
                        className="w-full bg-black border border-zinc-900 rounded-xl p-3 text-xs text-zinc-350 focus:outline-none focus:border-lime-500 leading-relaxed font-mono"
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
                      className="bg-lime-500 hover:bg-lime-400 text-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
                    <span className="text-xs font-bold font-mono text-lime-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-lime-400" />
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
                      <label className="block text-[10px] font-black uppercase text-lime-300">Primary Specialty Placement</label>
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
                                ? 'bg-lime-950/30 border-lime-500 text-white shadow shadow-lime-500/20'
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
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-lime-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Business Name</label>
                        <input 
                          type="text" 
                          value={businessName} 
                          onChange={(e) => setBusinessName(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-lime-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Booking Email</label>
                        <input 
                          type="email" 
                          value={bookingEmail} 
                          onChange={(e) => setBookingEmail(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-lime-500 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-zinc-400 mb-1 font-mono">Base Location / City</label>
                        <input 
                          type="text" 
                          value={baseLocation} 
                          onChange={(e) => setBaseLocation(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-lime-500 text-xs" 
                        />
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
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-lime-500 text-xs" 
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
                            className="flex-grow bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-mono focus:outline-none focus:border-lime-500 text-xs" 
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
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-lime-500 leading-normal"
                      />
                    </div>

                    {/* Skills tags config */}
                    <div className="space-y-1.5 border-t border-zinc-900 pt-3">
                      <label className="block text-[9px] uppercase font-black text-lime-300">Assign Specialized Skills</label>
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
                                  ? 'bg-lime-950/40 border-lime-500 text-white shadow' 
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
                            className="flex-grow bg-zinc-950 border border-zinc-900 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-lime-500 font-mono"
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
                      <label className="block text-[9px] uppercase font-black text-lime-400">Gear Specifications & Equipment Inventory</label>
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
                          className="flex-grow bg-zinc-950 border border-zinc-900 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-lime-500"
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
                          className="flex-grow bg-zinc-950 border border-zinc-900 p-2 text-xs rounded-lg text-white focus:outline-none focus:border-lime-500"
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
                      className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1"
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
    </div>
  );
}
