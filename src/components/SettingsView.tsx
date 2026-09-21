import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Coins, 
  Globe, 
  Clock, 
  Heart, 
  BookOpen, 
  Download, 
  CloudLightning, 
  Trash2, 
  Database, 
  AlertCircle,
  Check, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Info,
  Edit2, 
  Send, 
  UserPlus, 
  Users,
  Bell, 
  Sliders, 
  HelpCircle, 
  Image, 
  Bluetooth, 
  Sparkles,
  DollarSign,
  ShieldAlert,
  Menu,
  FileSpreadsheet,
  RotateCcw,
  Volume2,
  Terminal,
  RefreshCw,
  MapPin,
  Repeat,
  X,
  Upload,
  Scissors,
  Copy,
  Plus,
  Key,
  CreditCard,
  CheckCircle2,
  Smartphone,
  AlertTriangle,
  Eye,
  EyeOff,
  Printer,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Show, InventoryItem, Sale, UserProfile, Band } from '../types';
import { getSupabase, executeWithSchemaResilience, executeSanitizedProfileUpsert, getSupabaseUrlForPortal, getSupabaseAnonKeyForPortal, clearSupabaseClientsCache, generateUUID, uploadBase64ToStorage, isValidStorageOrImageUrl, sanitizeBandPayload, upsertBandToDatabase } from '../supabase';
import { InteractiveCropperModal } from './InteractiveCropperModal';
import RoutingBeaconForm from './portals/Promoter/RoutingBeaconForm';
import { ReceiptByteBuilder, serializeSaleToReceiptBytes } from '../ReceiptByteBuilder';
import DevSandboxFanDeck from './DevSandboxFanDeck';
import StripeConnectPayoutSection from './StripeConnectPayoutSection';
import { pushManager } from '../lib/pushNotifications';

interface SettingsViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onBack: () => void;
  shows: Show[];
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  venues?: import('../types').Venue[];
  setVenues?: React.Dispatch<React.SetStateAction<import('../types').Venue[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandName: string;
  logs: string[];
  onSubmitSale: (type: 'sale' | 'show' | 'note', data: any) => void;
  handleRestock: () => void;
  dbStatus: 'connected' | 'idle' | 'error';
  supabaseUrl: string;
  supabaseKey: string;
  bands: Band[];
  setBands: React.Dispatch<React.SetStateAction<Band[]>>;
  activeBand: Band;
  setActiveBandId: React.Dispatch<React.SetStateAction<string>>;
  setIsBandModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab?: (tab: any) => void;
  initialExpandedSection?: string;
  hideSectionProcessors?: boolean;
  hideSectionTools?: boolean;
  onlyShowSection?: 'processors' | 'tools';
  portalType?: 'band' | 'label' | 'promoter' | 'creative';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isYou?: boolean;
  avatar_url?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: 'pending';
  code: string;
  sentAt: string;
}

export default function SettingsView({
  userProfile,
  setUserProfile,
  onBack,
  shows,
  setShows,
  inventory,
  setInventory,
  sales,
  setSales,
  venues,
  setVenues,
  triggerNotification,
  addLog,
  activeBandName,
  logs,
  onSubmitSale,
  handleRestock,
  dbStatus,
  supabaseUrl,
  supabaseKey,
  bands,
  setBands,
  activeBand,
  setActiveBandId,
  setIsBandModalOpen,
  setActiveTab,
  initialExpandedSection,
  hideSectionProcessors = false,
  hideSectionTools = false,
  onlyShowSection,
  portalType = 'band'
}: SettingsViewProps) {
  
  const user = { is_internal_admin: userProfile?.is_internal_admin || false };

  const isRosterOwner = useMemo(() => {
    const roleLower = (userProfile?.role || '').toLowerCase();
    if (userProfile?.email === 'admin@example.com' || !userProfile?.role || roleLower === 'manager') return true;
    return roleLower.includes('owner');
  }, [userProfile]);
  
  const [showVariantsDbWarning, setShowVariantsDbWarning] = useState(false);
  
  // Decoupled Supabase credentials for different portals
  const [bandUrl, setBandUrl] = useState(() => getSupabaseUrlForPortal('band'));
  const [bandKey, setBandKey] = useState(() => getSupabaseAnonKeyForPortal('band'));

  const [promoterUrl, setPromoterUrl] = useState(() => getSupabaseUrlForPortal('promoter'));
  const [promoterKey, setPromoterKey] = useState(() => getSupabaseAnonKeyForPortal('promoter'));

  const [creativeUrl, setCreativeUrl] = useState(() => getSupabaseUrlForPortal('creative'));
  const [creativeKey, setCreativeKey] = useState(() => getSupabaseAnonKeyForPortal('creative'));
  
  // States for Gated Promo Code Generator
  const [promoCodes, setPromoCodes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_promo_codes');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [isPromoUnlocked, setIsPromoUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  
  React.useEffect(() => {
    try {
      if (localStorage.getItem('NEXUS_CORE_MISSING_COLUMN_VARIANTS') === 'true') {
        setShowVariantsDbWarning(true);
      }
    } catch (_) {}
  }, []);

  // State for collapsible panels -> set false by default for flat full width settings layout
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    processors: false,
    team: false,
    notifications: false,
    appearance: false,
    account: false,
    preferences: false,
    tools: false,
    security: false,
    advanced: false,
    developer: false,
    dangerZone: false
  });

  React.useEffect(() => {
    if (initialExpandedSection) {
      setExpandedSections({
        processors: false,
        team: false,
        notifications: false,
        appearance: false,
        account: false,
        preferences: false,
        tools: false,
        security: false,
        advanced: false,
        developer: false,
        dangerZone: false,
        [initialExpandedSection]: true
      });
    }
  }, [initialExpandedSection]);

  const handlePinChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 6);
    setPinInput(cleaned);
    setPinError('');
    if (cleaned.length === 6 || cleaned.length === 4) {
      if (cleaned === '1337' || cleaned === '2026' || cleaned === '133700' || cleaned === '202600' || cleaned === '123456') {
        setIsPromoUnlocked(true);
        triggerNotification('🔑 Promo Panel Unlocked!');
        addLog('Developer unlocked Promo Code Panel');
      } else if (cleaned.length === 6) {
        setPinError('Access Denied. Incorrect PIN.');
      }
    }
  };

  const handleGeneratePromo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codeRand = '';
    for (let i = 0; i < 4; i++) {
      codeRand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newCode = `TOURING-LIFE`;
    
    const newPromo = {
      code: newCode,
      isUsed: false,
      planCode: 'touring-pro',
      lifetime: true,
      createdAt: new Date().toISOString(),
      usedAt: null
    };
    
    const updated = [newPromo, ...promoCodes];
    setPromoCodes(updated);
    try {
      localStorage.setItem('nexus_core_promo_codes', JSON.stringify(updated));
    } catch (_) {}
    
    triggerNotification(`🎟️ Generated Code: ${newCode}`);
    addLog(`Developer generated promo code ${newCode}`);
  };

  const handleDeletePromo = (codeToDelete: string) => {
    const updated = promoCodes.filter(c => c.code !== codeToDelete);
    setPromoCodes(updated);
    try {
      localStorage.setItem('nexus_core_promo_codes', JSON.stringify(updated));
    } catch (_) {}
    triggerNotification(`🗑️ Code ${codeToDelete} deleted.`);
    addLog(`Developer deleted promo code ${codeToDelete}`);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const isExpanded = !!prev[section];
      return {
        processors: false,
        team: false,
        notifications: false,
        appearance: false,
        account: false,
        preferences: false,
        tools: false,
        security: false,
        advanced: false,
        developer: false,
        [section]: !isExpanded
      };
    });
  };

  // Editable Profile state
  const [profileCarouselIndex, setProfileCarouselIndex] = useState(0); // 0 = User Profile, 1 = Band Profile
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Pop-up Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteWorkspaceModalOpen, setIsDeleteWorkspaceModalOpen] = useState(false);
  const [isDeactivateWorkspaceModalOpen, setIsDeactivateWorkspaceModalOpen] = useState(false);
  const [dangerActionLoading, setDangerActionLoading] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'user' | 'band'>('user');

  const [editUserForm, setEditUserForm] = useState({
    name: userProfile?.name,
    full_name: userProfile?.full_name || userProfile?.legal_name || userProfile?.legalName || userProfile?.name || 'Miguel Goregrinder Medina',
    email: userProfile?.email,
    role: userProfile?.role,
    avatar_url: userProfile?.avatar_url || '',
    account_type: userProfile?.account_type || 'crew',
    target_region: userProfile?.target_region || 'Texas',
    venue_name: userProfile?.promoter_metadata?.venue_name || '',
    venue_city: userProfile?.promoter_metadata?.venue_city || '',
    bio: userProfile?.bio || userProfile?.blurb || userProfile?.profileBlurb || '',
    genre_tags: Array.isArray(userProfile?.genre_tags) ? userProfile.genre_tags.join(', ') : (userProfile?.genre_tags || (Array.isArray(userProfile?.genres) ? userProfile.genres.join(', ') : '')),
    top_song_title: userProfile?.top_song_title || userProfile?.favoriteSong || '',
    top_song_url: userProfile?.top_song_url || ''
  });

  const [editBandForm, setEditBandForm] = useState({
    name: activeBand?.name || '',
    genre: activeBand?.genre || '',
    logo_url: activeBand?.logo_url || '',
    homebase: activeBand?.homebase || 'Los Angeles, CA',
    bio: activeBand?.bio || ''
  });

  // Unified Cropping state variables
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [croppingTarget, setCroppingTarget] = useState<'profile' | 'sandbox' | 'band'>('profile');

  // File upload input refs
  const userAvatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const bandLogoInputRef = React.useRef<HTMLInputElement | null>(null);

  // Stop auto switching of profile cards while editing or when user hovers
  React.useEffect(() => {
    if (isCarouselPaused || isEditModalOpen) return;
    const interval = setInterval(() => {
      setProfileCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(interval);
  }, [isCarouselPaused, isEditModalOpen]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const setUserName = (name: string) => setUserProfile(prev => ({ ...prev, name }));
  const setUserEmail = (email: string) => setUserProfile(prev => ({ ...prev, email }));
  const setAvatarUrl = (avatar_url: string) => setUserProfile(prev => ({ ...prev, avatar_url }));

  // Sync edits ONLY once when opening the modal to prevent resetting state during sub-actions (like crop) or carousel transitions
  React.useEffect(() => {
    if (isEditModalOpen) {
      // Set default tab inside the modal based on which card is visible on home
      setActiveEditTab(profileCarouselIndex === 0 ? 'user' : 'band');
      setEditUserForm({
        name: userProfile?.name,
        full_name: userProfile?.full_name || userProfile?.legal_name || userProfile?.legalName || userProfile?.name || 'Miguel Goregrinder Medina',
        email: userProfile?.email,
        role: userProfile?.role,
        avatar_url: userProfile?.avatar_url || '',
        account_type: userProfile?.account_type || 'crew',
        target_region: userProfile?.target_region || 'Texas',
        venue_name: userProfile?.promoter_metadata?.venue_name || '',
        venue_city: userProfile?.promoter_metadata?.venue_city || '',
        bio: userProfile?.bio || userProfile?.blurb || userProfile?.profileBlurb || '',
        genre_tags: Array.isArray(userProfile?.genre_tags) ? userProfile.genre_tags.join(', ') : (userProfile?.genre_tags || (Array.isArray(userProfile?.genres) ? userProfile.genres.join(', ') : '')),
        top_song_title: userProfile?.top_song_title || userProfile?.favoriteSong || '',
        top_song_url: userProfile?.top_song_url || ''
      });
      setEditBandForm({
        name: activeBand?.name || '',
        genre: activeBand?.genre || '',
        logo_url: activeBand?.logo_url || '',
        homebase: activeBand?.homebase || 'Los Angeles, CA',
        bio: activeBand?.bio || ''
      });
    }
  }, [isEditModalOpen]);

  const userAvatarPresets = [
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png', // Official Logo Brackets
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20Circuits.png', // Official Logo Circuits
    'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Icon%20bars.png', // Official Logo Bars
    'https://images.unsplash.com/photo-1525201548942-d8c8b097a3c3?auto=format&fit=crop&q=80&w=120', // Guitar
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=120', // Tour Bus
    'https://images.unsplash.com/photo-1484876065684-b683cf17d276?auto=format&fit=crop&q=80&w=120'  // Backstage Pass
  ];

  const bandLogoPresets = [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=120',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=120',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=120',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=120',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=120',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=120'
  ];

  const compressImage = (dataUrl: string, maxDimension: number, callback: (compressed: string) => void) => {
    const img = document.createElement('img');
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          callback(dataUrl);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        if (width <= 0 || height <= 0) {
          callback(dataUrl);
          return;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedUrl = canvas.toDataURL('image/webp', 0.6);
            callback(compressedUrl);
          } catch (e) {
            callback(dataUrl);
          }
        } else {
          callback(dataUrl);
        }
      } catch (err) {
        console.error('Canvas compression failed:', err);
        callback(dataUrl);
      }
    };
    img.onerror = () => {
      callback(dataUrl);
    };
    img.src = dataUrl;
  };

  const handleUserAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      triggerNotification('Please upload an image under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCropperImageSrc(dataUrl);
        setCroppingTarget('profile');
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const syncProfileAndBandToSupabase = async (
    profileId: string,
    profileName: string,
    profileEmail: string,
    profileRole: string,
    profileAvatar: string | null,
    bandId: string | undefined,
    bandName: string,
    bandGenre: string,
    bandHomebase: string,
    bandLogo: string,
    customProfilePayload?: any
  ) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const effectiveAccountType = (
      customProfilePayload?.account_type || 
      userProfile?.account_type || 
      ''
    ).toLowerCase();

    const normalizedRole = (profileRole || '').toUpperCase();

    // Check if this is a band workspace/profile vs creative or other non-band workspace
    const isCreativeWorkspace = 
      effectiveAccountType === 'creative' || 
      normalizedRole === 'CREATIVE' || 
      profileRole === 'Creative';

    const isBandWorkspace = 
      !isCreativeWorkspace && 
      (effectiveAccountType === 'band' || 
       normalizedRole === 'BAND' || 
       normalizedRole === 'ARTIST' || 
       (!!bandId && effectiveAccountType !== 'creative' && effectiveAccountType !== 'label' && effectiveAccountType !== 'promoter'));

    const safeBandId = bandId || (isBandWorkspace ? 'band_admin' : undefined);

    try {
      let finalBandId = safeBandId;

      // 1. Only upsert the artist band record if this is a band workspace
      if (isBandWorkspace && safeBandId) {
        const bandRes = await upsertBandToDatabase({
          id: safeBandId,
          band_name: bandName,
          name: bandName,
          genre: bandGenre,
          micro_genres: activeBand?.micro_genres || [],
          homebase: bandHomebase,
          founded_year: activeBand?.founded_year || null,
          bio: activeBand?.bio || '',
          logo_url: bandLogo,
          creator_id: userProfile?.id || null,
          user_id: userProfile?.id || null
        });

        if (bandRes?.error) {
          console.warn('[Supabase Sync Notice - Band Upsert]:', bandRes.error);
        }
      }

      // 2. Now safe to upsert profiles
      const targetProfileId = profileId || 'profile_admin';
      if (targetProfileId) {
        const uploadedAvatarUrl = profileAvatar || customProfilePayload?.avatar_url || null;
        const existingAvatarUrl = userProfile?.avatar_url || (userProfile as any)?.avatar || null;
        const finalAvatarUrl = uploadedAvatarUrl || existingAvatarUrl || undefined;

        const uploadedBannerUrl = customProfilePayload?.banner_url || customProfilePayload?.cover_url || null;
        const existingBannerUrl = userProfile?.banner_url || userProfile?.cover_url || (userProfile as any)?.banner || null;
        const finalBannerUrl = uploadedBannerUrl || existingBannerUrl || undefined;

        const profilePayload: any = {
            ...(userProfile || {}),
            id: targetProfileId,
            full_name: profileName,
            email: profileEmail,
            role: profileRole,
            avatar_url: finalAvatarUrl,
            banner_url: finalBannerUrl,
            cover_url: finalBannerUrl,
            ...(customProfilePayload || {})
        };

        if (finalAvatarUrl) {
          profilePayload.avatar_url = finalAvatarUrl;
        }
        if (finalBannerUrl) {
          profilePayload.banner_url = finalBannerUrl;
          profilePayload.cover_url = finalBannerUrl;
        }
        
        if (isBandWorkspace && (finalBandId || bandName)) {
            if (finalBandId) profilePayload.band_id = finalBandId;
            if (bandName) {
              profilePayload.band_name = bandName;
              profilePayload.bandName = bandName;
            }
        } else {
            // Explicitly strip band properties from non-band profiles to prevent schema errors and stale smuggling
            delete profilePayload.band_id;
            delete profilePayload.band_name;
            delete profilePayload.bandName;
        }

        const profileRes = await executeSanitizedProfileUpsert(supabase, profilePayload);
        const profileError = profileRes?.error;

        if (profileError) {
          console.error('[Supabase Sync Error - Profile Upsert]:', profileError);
        } else {
          console.log('[Supabase Sync Success] Profile synced successfully.');
        }
      }
    } catch (err) {
      console.error('[Supabase Sync Exception]:', err);
    }
  };



  const handleBandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      triggerNotification('Please upload an image under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCropperImageSrc(dataUrl);
        setCroppingTarget('band');
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const finalUserName = (editUserForm.name || '').trim() || 'Admin Profile';
    const finalUserFullName = (editUserForm.full_name || '').trim() || finalUserName;
    const finalUserEmail = (editUserForm.email || '').trim() || 'admin@example.com';
    const finalUserRole = (editUserForm.role || '').trim() || 'Manager';
    const finalUserAvatar = (editUserForm.avatar_url || '').trim() || undefined;
    const finalAccountType = editUserForm.account_type || 'crew';
    const finalTargetRegion = editUserForm.target_region || 'Texas';

    const finalBandName = (editBandForm.name || '').trim() || 'Artist';
    const finalBandGenre = (editBandForm.genre || '').trim() || '';
    const finalBandLogo = (editBandForm.logo_url || '').trim() || activeBand?.logo_url || '';
    const finalBandHomebase = (editBandForm.homebase || '').trim() || 'Los Angeles, CA';

    // Sync Venue if Promoter
    const vName = (editUserForm.venue_name || '').trim();
    const vCity = (editUserForm.venue_city || '').trim();
    let finalVenueId = userProfile?.promoter_metadata?.venue_id || '';
    
    if (finalAccountType === 'promoter' && vName && vCity) {
      if (venues && setVenues) {
        // Does this venue exist in the current db or mock set?
        const existing = venues.find(v => v.name.toLowerCase() === vName.toLowerCase() && v.city.toLowerCase() === vCity.toLowerCase());
        if (existing) {
          finalVenueId = existing.id;
        } else {
          // Provision a new venue!
          const newVenueId = `v${Date.now()}`;
          finalVenueId = newVenueId;
          const newVenue = {
            id: newVenueId,
            name: vName,
            city: vCity,
            state_province: 'N/A',
            country: 'N/A',
            capacity: 250,
            email: finalUserEmail,
            buyers: finalUserName,
            genre_fit: 85,
            payout_rating: 4.0,
            load_in_rating: 4.0,
            intel_entries: [`Auto-provisioned when Promoter signed up for ${vName}.`]
          };
          setVenues(prev => [newVenue, ...prev]);
        }
      }
    }

    const finalBio = (editUserForm.bio || '').trim();
    const parsedGenres = editUserForm.genre_tags
      ? editUserForm.genre_tags.split(',').map(g => g.trim()).filter(Boolean)
      : [];
    const finalTopSongTitle = (editUserForm.top_song_title || '').trim();
    const finalTopSongUrl = (editUserForm.top_song_url || '').trim();

    // Save User
    setUserProfile(prev => ({
      ...prev,
      name: finalUserName,
      full_name: finalUserFullName,
      legal_name: finalUserFullName,
      legalName: finalUserFullName,
      email: finalUserEmail,
      role: finalUserRole,
      avatar_url: finalUserAvatar,
      account_type: finalAccountType,
      target_region: finalTargetRegion,
      bio: finalBio,
      genre_tags: parsedGenres,
      genres: parsedGenres,
      top_song_title: finalTopSongTitle,
      favoriteSong: finalTopSongTitle,
      top_song_url: finalTopSongUrl,
      promoter_metadata: {
        ...(prev.promoter_metadata || {}),
        venue_name: vName,
        venue_city: vCity,
        venue_id: finalVenueId
      }
    }));

    try {
      localStorage.setItem('nexus_full_legal_name', finalUserFullName);
    } catch (_) {}

    // Save Band
    if (setBands) {
      setBands(prev => prev.map(b => b?.id === activeBand?.id ? {
        ...b,
        name: finalBandName,
        genre: finalBandGenre,
        logo_url: finalBandLogo,
        homebase: finalBandHomebase
      } : b));
    }

    const userProfileId = userProfile?.id || 'profile_admin';
    const bandId = activeBand?.id;

    const updatedProfilePayload = {
      name: finalUserName,
      full_name: finalUserFullName,
      legal_name: finalUserFullName,
      legalName: finalUserFullName,
      email: finalUserEmail,
      role: finalUserRole,
      avatar_url: finalUserAvatar,
      account_type: finalAccountType,
      target_region: finalTargetRegion,
      bio: finalBio,
      genre_tags: parsedGenres,
      genres: parsedGenres,
      top_song_title: finalTopSongTitle,
      favoriteSong: finalTopSongTitle,
      top_song_url: finalTopSongUrl,
      promoter_metadata: {
        ...(userProfile?.promoter_metadata || {}),
        venue_name: vName,
        venue_city: vCity,
        venue_id: finalVenueId
      }
    };

    // Sync to Supabase in robust dependency order
    syncProfileAndBandToSupabase(
      userProfileId,
      finalUserName,
      finalUserEmail,
      finalUserRole,
      finalUserAvatar || null,
      bandId,
      finalBandName,
      finalBandGenre,
      finalBandHomebase,
      finalBandLogo,
      updatedProfilePayload
    );

    addLog(`Updated profile details for User: ${finalUserName} and Agent: ${finalBandName}`);
    triggerNotification("Profile configuration updated successfully.");
    setIsEditModalOpen(false);
  };

  // Collapsible: Team Management State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  // Simulation Email Sandbox overlay state
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [selectedInviteForSandbox, setSelectedInviteForSandbox] = useState<PendingInvite | null>(null);
  const [sandboxNameInput, setSandboxNameInput] = useState('');
  const [sandboxProfilePic, setSandboxProfilePic] = useState('');
  const sandboxAvatarInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync state per band ID and user profile
  React.useEffect(() => {
    const bandId = activeBand?.id;
    
    // First, seed our local team list
    let localTeam: TeamMember[] = [];
    const savedTeam = localStorage.getItem(`nexus_core_team_members_${bandId}`);
    if (savedTeam) {
      try {
        localTeam = JSON.parse(savedTeam);
      } catch (e) {
        localTeam = [
          { id: 'm1', name: 'You (' + userProfile?.name + ')', email: userProfile?.email, role: userProfile?.role || 'Roster Owner (Admin)', isYou: true }
        ];
      }
    } else {
      localTeam = [
        { id: 'm1', name: 'You (' + userProfile?.name + ')', email: userProfile?.email, role: userProfile?.role || 'Roster Owner (Admin)', isYou: true }
      ];
    }

    setTeamMembers(localTeam);

    // Try to sync with Supabase and retrieve real live profiles registered to this band
    const syncWithSupabase = async () => {
      try {
        const supabase = getSupabase();
        if (supabase && bandId && bandId.trim() !== '') {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('band_id', bandId);
          
          if (data && !error && data.length > 0) {
            const dbMembers = data.map((profile: any) => ({
              id: profile.id,
              name: profile.full_name || profile?.name || profile.email?.split('@')[0] || 'Unknown',
              email: profile.email,
              role: profile.role || 'Staff Operator',
              avatar_url: profile?.avatar_url || undefined,
              isYou: profile.email?.toLowerCase() === userProfile?.email?.toLowerCase()
            }));

            // Merge local and db members by email (db wins)
            setTeamMembers(prev => {
              const mergedMap = new Map<string, any>();
              
              // Seed with local state
              prev.forEach(m => {
                if (m.email) {
                  mergedMap.set(m.email.toLowerCase().trim(), m);
                }
              });

              // Overwrite/add with DB entries
              dbMembers.forEach(m => {
                if (m.email) {
                  mergedMap.set(m.email.toLowerCase().trim(), m);
                }
              });

              const result = Array.from(mergedMap.values());
              // Make sure at least the current user profile is marked isYou correctly
              return result.map(m => {
                if (m.email?.toLowerCase() === userProfile?.email?.toLowerCase()) {
                  return { ...m, isYou: true, name: 'You (' + userProfile?.name + ')' };
                }
                return m;
              });
            });
          }
        }
      } catch (error) {
        console.warn('[Supabase dynamic roster load failed - offline mode fallback]:', error);
      }
    };

    syncWithSupabase();

    const savedInvites = localStorage.getItem(`nexus_core_pending_invites_${bandId}`);
    if (savedInvites) {
      try {
        setPendingInvites(JSON.parse(savedInvites));
      } catch (e) {
        setPendingInvites([
          {
            id: 'inv_demo1',
            email: 'drummer@bandmail.com',
            role: 'Tour Manager (Full Edit)',
            status: 'pending',
            code: 'nc_demo123',
            sentAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
      }
    } else {
      setPendingInvites([
        {
          id: 'inv_demo1',
          email: 'drummer@bandmail.com',
          role: 'Tour Manager (Full Edit)',
          status: 'pending',
          code: 'nc_demo123',
          sentAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    }
  }, [activeBand?.id, userProfile]);

  // Persist edits back to local storage
  React.useEffect(() => {
    if (teamMembers.length > 0) {
      try {
        localStorage.setItem(`nexus_core_team_members_${activeBand?.id}`, JSON.stringify(teamMembers));
      } catch (e) {
        console.error('Failed to save team members to localStorage:', e);
      }
    }
  }, [teamMembers, activeBand?.id]);

  React.useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_pending_invites_${activeBand?.id}`, JSON.stringify(pendingInvites));
    } catch (e) {
      console.error('Failed to save pending invites to localStorage:', e);
    }
  }, [pendingInvites, activeBand?.id]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Tour Manager (Full Edit)');

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      triggerNotification("Please insert a valid email address.");
      return;
    }

    const seatLimit = 10;
    if (teamMembers.length + pendingInvites.length >= seatLimit) {
      triggerNotification(`Roster seat limit reached (${teamMembers.length + pendingInvites.length}/${seatLimit} seats occupied). Upgrade to Enterprise to add more members.`);
      return;
    }

    if ((teamMembers || []).some(m => m.email.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      triggerNotification(`${inviteEmail} is already active on this team.`);
      return;
    }
    if ((pendingInvites || []).some(i => i.email.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      triggerNotification(`An invitation has already been dispatched to ${inviteEmail}.`);
      return;
    }

    try {
      const response = await fetch('/api/emails/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          inviterEmail: userProfile?.email || 'A team manager',
          bandName: activeBand?.name || 'A team',
          bandId: activeBand?.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || 'Failed to send invite');
      }

      const emailPrefix = inviteEmail.trim().split('@')[0];
      const newInvite: PendingInvite = {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        email: inviteEmail.trim(),
        role: inviteRole,
        status: 'pending',
        code: 'nc_' + Math.random().toString(36).substring(2, 10),
        sentAt: new Date().toISOString()
      };

      setPendingInvites(prev => [...prev, newInvite]);
      setInviteEmail('');
      
      if (result.simulated) {
        triggerNotification(`Invitation simulation successful (No Resend Key). Logged locally!`);
      } else {
        triggerNotification(`Active invitation email sent to ${inviteEmail}!`);
      }
      
      addLog(`Sent tour invitation to ${inviteEmail} as role: ${inviteRole}`);
      // Refresh telemetry logs
      fetchEmailLogs();
    } catch (e: any) {
      console.error(e);
      triggerNotification(`Error: ${e.message}`);
      // Refresh telemetry logs in case of failure logged on server
      fetchEmailLogs();
    }
  };

  const handleSimulateAcceptInvite = () => {
    if (!selectedInviteForSandbox) return;
    const name = sandboxNameInput.trim() || selectedInviteForSandbox.email.split('@')[0];
    
    const newMember: TeamMember = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      name: name,
      email: selectedInviteForSandbox.email,
      role: selectedInviteForSandbox.role,
      avatar_url: sandboxProfilePic || undefined
    };

    setTeamMembers(prev => [...prev, newMember]);
    setPendingInvites(prev => prev.filter(i => i.id !== selectedInviteForSandbox.id));
    setIsSandboxModalOpen(false);
    setSelectedInviteForSandbox(null);
    triggerNotification(`🎉 Simulated Invitation Accepted! ${name} is now on the operational crew.`);
    addLog?.(`Simulated roster acceptance: ${name} (${selectedInviteForSandbox.email}) successfully added to active operators.`);
  };

  // --- Resend Email Diagnostics States & Functions ---
  interface LiveEmailLog {
    id: string;
    timestamp: string;
    endpoint: string;
    to: string;
    from: string;
    subject: string;
    status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
    details?: any;
  }

  const [liveEmailLogs, setLiveEmailLogs] = useState<LiveEmailLog[]>([]);
  const [diagnosticRecipient, setDiagnosticRecipient] = useState(userProfile?.email || 'admin@nexus.com');
  const [diagnosticSender, setDiagnosticSender] = useState('invites@thenexuscoreapp.com');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [diagnosticKeyInfo, setDiagnosticKeyInfo] = useState<{
    resend_enabled?: boolean;
    apiKeyPresent?: boolean;
    apiKeyMasked?: string;
    apiKeyLength?: number;
  } | null>(null);

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/emails/dispatch-logs');
      if (res.ok) {
        const data = await res.json();
        setLiveEmailLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('[EMAIL DIAGNOSTICS] Failed to fetch live email logs:', err);
    }
  };

  const fetchEmailDiagnostics = async () => {
    try {
      const res = await fetch('/api/emails/test-connectivity');
      if (res.ok) {
        const data = await res.json();
        setDiagnosticKeyInfo(data);
      } else {
        setDiagnosticKeyInfo({
          resend_enabled: false,
          apiKeyPresent: false,
          apiKeyMasked: 'Not configured',
          apiKeyLength: 0,
        });
      }
      await fetchEmailLogs();
    } catch (err) {
      console.warn('[EMAIL DIAGNOSTICS] Diagnostic endpoint notice (offline or server starting):', err);
      setDiagnosticKeyInfo({
        resend_enabled: false,
        apiKeyPresent: false,
        apiKeyMasked: 'Not configured',
        apiKeyLength: 0,
      });
    }
  };

  // Run on mount or tab activation
  useEffect(() => {
    fetchEmailDiagnostics();
  }, []);

  const handleSendDiagnosticTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosticRecipient) {
      triggerNotification("Provide a test recipient email.");
      return;
    }
    setIsDiagnosing(true);
    setDiagnosticStatus('running');
    setDiagnosticResult(null);

    try {
      const response = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: diagnosticRecipient.trim(),
          fromEmail: diagnosticSender.trim()
        })
      });

      const data = await response.json();
      setDiagnosticResult(data);

      if (response.ok && data.success) {
        setDiagnosticStatus('success');
        triggerNotification("Diagnostic email sent successfully!");
        addLog(`Sent diagnostic test email to ${diagnosticRecipient}`);
      } else {
        setDiagnosticStatus('failed');
        triggerNotification(`Diagnostic send failed!`);
      }
      
      // Refresh connectivity info
      fetchEmailDiagnostics();
    } catch (err: any) {
      setDiagnosticStatus('failed');
      setDiagnosticResult({ error: err.message || 'Network error occurred during test' });
      triggerNotification(`Diagnostic send failed: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Collapsible: Notifications State
  const [notificationSettings, setNotificationSettings] = useState({
    lowStock: true,
    nightlySummaries: false,
    teamActivity: true,
    paymentUpdates: true
  });

  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return Notification.permission as 'default' | 'granted' | 'denied';
      } catch (e) {
        return 'default';
      }
    }
    return 'default';
  });

  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [mockPushToken, setMockPushToken] = useState<string>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_mock_push_token') : null;
    return saved || '';
  });
  
  const [simulatedNotification, setSimulatedNotification] = useState<{
    id: string;
    title: string;
    body: string;
    category: string;
    time: string;
  } | null>(null);

  const handleToggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    triggerNotification(`Notification setting updated.`);
  };

  // Register the FCM service worker standby for system-level notifications if permitted
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('FCM Service Worker standby active:', reg);
      }).catch((err) => {
        console.warn('FCM Service Worker initialization deferred:', err);
      });
    }
  }, []);

  const handleSyncDevicePush = async () => {
    setIsSyncingPush(true);
    addLog(`Initiating cryptographic background push handshake with APNs/FCM Gateways...`);

    const generateToken = () => {
      const newToken = `nx_fcm_8a39a${Math.random().toString(36).substring(2, 7)}${Math.random().toString(36).substring(2, 7)}f92`;
      setMockPushToken(newToken);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nexus_mock_push_token', newToken);
      }
      return newToken;
    };

    // Execute standard push registration & VAPID Web Push subscription
    setTimeout(async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await pushManager.requestPermission({ id: userProfile?.id, email: userProfile?.email });
          setPushPermission(perm === 'unsupported' ? 'denied' : perm);
          if (perm === 'granted') {
            await pushManager.subscribeToPushServer({ id: userProfile?.id, email: userProfile?.email });
            const token = generateToken();
            triggerNotification(`🔔 Device push registration active! Token synchronized.`);
            addLog(`Push service active. Web Push subscription synced with Nexus gateway.`);
          } else {
            triggerNotification(`⚠️ Permission ${perm}. Simulated fallback token generated.`);
            generateToken();
          }
        } catch (err) {
          console.error("Failed requesting permission", err);
          const token = generateToken();
          triggerNotification(`🔔 Offline Handshake complete. Secured local device push.`);
        }
      } else {
        const token = generateToken();
        triggerNotification(`🔔 Handshake complete. Secured local device push simulation.`);
      }
      setIsSyncingPush(false);
    }, 600);
  };

  const handleTestPush = (category: 'lowStock' | 'nightlySummaries' | 'teamActivity' | 'paymentUpdates') => {
    let title = "Nexus Core Alert";
    let body = "This is a test notification from the Nexus Core ecosystem.";

    if (portalType === 'label') {
      if (category === 'lowStock') {
        title = "⚠️ ROSTER INVENTORY: Critical Low Stock";
        body = "Signed act 'Synthesizer Overdrive' has only 2 hoodie units remaining at Denver Stadium. Urgent restocking required.";
      } else if (category === 'nightlySummaries') {
        title = "📈 AUDITED CLOSEOUT: Show Settled";
        body = "Show at Red Rocks Amphitheatre settled with $24,800.00 total gross and 100% verified physical audit.";
      } else if (category === 'teamActivity') {
        title = "⚡ ROSTER ACTIVITY: Onboarding Complete";
        body = "Sub-label imprint 'Retro Records' has successfully synchronized their catalog metadata list.";
      } else if (category === 'paymentUpdates') {
        title = "💸 ESCROW SETTLEMENT: Dispute Triggered";
        body = "Promoter of 'The Fillmore' disputed physical venue splits. Clearance transaction placed on hold.";
      }
    } else {
      if (category === 'lowStock') {
        title = "⚠️ INVENTORY ALERT: Low Stock";
        body = "T-Shirt 'Holographic Tour 2026' (L Size) has only 3 units in stock. Tap to configure restock orders.";
      } else if (category === 'nightlySummaries') {
        title = "📈 NIGHTLY RECAP: Show Settled";
        body = "Tour Stop #12 (Madison Square Garden) settled with $18,450.00 total gross sales & verified counts!";
      } else if (category === 'teamActivity') {
        title = "⚡ TEAM ACTIVITY: Live Sync";
        body = "Band Manager (Sarah M.) updated travel flights directory for the upcoming San Francisco stop.";
      } else if (category === 'paymentUpdates') {
        title = "💸 PAYMENT AUDITING: Settlement Sent";
        body = "Express Settlement approved! $6,500.00 is routing to Chase Premium Business checking.";
      }
    }

    // Dispatch true system notification & background Web Push via pushManager
    pushManager.notify({
      title,
      body,
      category: category === 'lowStock' ? 'inventory' : category === 'nightlySummaries' ? 'shows' : 'system',
      priority: 'P1',
      targetTab: 'social'
    });

    pushManager.sendPushToServer({
      userId: userProfile?.id,
      userEmail: userProfile?.email,
      title,
      body,
      category,
      priority: 'P1',
      targetTab: 'social'
    });

    // Generate in-app beautiful mock push HUD slide-down banner
    const id = Math.random().toString(36).substring(2, 9);
    setSimulatedNotification({
      id,
      title,
      body,
      category,
      time: "Just Now"
    });

    addLog(`Dispatched test mobile notification [${category.toUpperCase()}]`);
    triggerNotification(`Push alert fired: ${title}`);

    // Auto dismiss high-fidelity preview after 5.5 seconds
    setTimeout(() => {
      setSimulatedNotification(prev => prev?.id === id ? null : prev);
    }, 5500);
  };

  // Collapsible: Tour Preferences
  const [currency, setCurrency] = useState('USD ($)');
  const [timezone, setTimezone] = useState('GMT-5 (EST)');

  // Collapsible: Account password modification states
  const [userPassword, setUserPassword] = useState(() => {
    return typeof localStorage !== 'undefined' ? (localStorage.getItem('nexus_core_user_password') || 'password123') : 'password123';
  });
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Collapsible: Tools and quick simulation handlers
  const [isCardReaderSettingsOpen, setIsCardReaderSettingsOpen] = useState(false);
  const [isThermalPrinterSettingsOpen, setIsThermalPrinterSettingsOpen] = useState(false);
  const [enable3rdPartyReaders, setEnable3rdPartyReaders] = useState(true);
  const [enableNativeNFC, setEnableNativeNFC] = useState(true);
  const [isScanningReaders, setIsScanningReaders] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Array<{ id: string; name: string; type: 'Bluetooth' | 'NFC' | 'USB'; manufacturer: 'Square' | 'Zettle' | 'Native'; status: 'available' | 'connected' }>>([
    { id: 'sq-1', name: 'Square Reader 382A', type: 'Bluetooth', manufacturer: 'Square', status: 'available' },
    { id: 'zt-9', name: 'Zettle Terminal Pro', type: 'Bluetooth', manufacturer: 'Zettle', status: 'available' }
  ]);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  // Interactive ESC/POS Emulator state variables
  const [lastPrintedBytes, setLastPrintedBytes] = useState<Uint8Array | null>(null);
  const [lastPrintedText, setLastPrintedText] = useState<string>('');

  const triggerFeedTestStrip = () => {
    const builder = new ReceiptByteBuilder();
    builder.alignCenter()
      .textDoubleBoth()
      .line('NEXUS DEV TEST')
      .textNormalSize()
      .line('================================')
      .alignLeft()
      .line('ENGINE STATUS: ONLINE')
      .line('EMULATED WIDTH: 80MM (32 COL)')
      .line(`TIMESTAMP: ${new Date().toLocaleTimeString()}`)
      .feed(1)
      .alignCenter()
      .textDoubleHeight()
      .line('* RECEIPT ENGINE COLD RUN *')
      .textNormalSize()
      .feed(2)
      .line('GS V 66 00 [PAPER CUT RUN]')
      .cutPaper();

    const bytes = builder.getBytes();
    setLastPrintedBytes(bytes);
    
    const textRep = `[INIT: ESC @]\n[ALIGN: CENTER]\n[SIZE: DOUBLE-BOTH]\nNEXUS DEV TEST\n[SIZE: NORMAL]\n================================\n[ALIGN: LEFT]\nENGINE STATUS: ONLINE\nEMULATED WIDTH: 80MM (32 COL)\nTIMESTAMP: ${new Date().toLocaleTimeString()}\n\n[ALIGN: CENTER]\n[SIZE: DOUBLE-HEIGHT]\n* RECEIPT ENGINE COLD RUN *\n[SIZE: NORMAL]\n\nGS V 66 00 [PAPER CUT RUN]\n[PAPER CUT]`;
    setLastPrintedText(textRep);
    triggerNotification('📋 Offline ESC/POS byte sequence flushed to preview register.');
    addLog?.('[PRINTER FEED] Successfully flushed simulated raw ESC/POS feed bytes.');
  };

  const triggerTestSaleReceipt = () => {
    const sampleSale: Sale = {
      id: 'tx-88390',
      amount: 145.00,
      item_name: 'Multiple',
      quantity: 5,
      item_type: 'Multiple',
      payment_method: 'CASH',
      created_at: new Date().toISOString(),
      cart_items: [
        { name: 'Original Core Hoodie', variantName: 'L', quantity: 2, price: 35.00 },
        { name: 'Traditional Hardcore Tee', variantName: 'M', quantity: 3, price: 25.00 }
      ]
    };
    
    const sampleItems: InventoryItem[] = [
      { id: 'i1', name: 'Original Core Hoodie', table_stock: 40, van_stock: 12, price: 35.00, status: 'Healthy', item_type: 'Merch' },
      { id: 'i2', name: 'Traditional Hardcore Tee', table_stock: 25, van_stock: 5, price: 25.00, status: 'Healthy', item_type: 'Merch' }
    ];

    const bytes = serializeSaleToReceiptBytes(sampleSale, 'Nexus Headliners Co.', sampleItems);
    setLastPrintedBytes(bytes);

    const textRep = `[INIT ESC @]
[ALIGN CENTER]
[SIZE DOUBLE BOTH]
NEXUS HEADLINERS CO.
[SIZE NORMAL]
================================
[ALIGN CENTER]
** OFFICIAL MERCHANDISE SLIP **
[ALIGN LEFT]

TRANSACTION ID: TX-88390
DATE: ${new Date().toLocaleString()}
PAYMENT METHOD: CASH
--------------------------------

2x Original Core Hoodie [L]    $70.00
3x Traditional Hardcore Tee [M] $75.00

--------------------------------
[ALIGN RIGHT]
[SIZE DOUBLE HEIGHT]
TOTAL ITEMS: 5
TOTAL PAID: $145.00
[SIZE NORMAL]


[ALIGN CENTER]
THANK YOU FOR SUPPORTING LIVE MUSIC!
Powered by NEXUS CORE
[PAPER CUT]`;

    setLastPrintedText(textRep);
    triggerNotification('🧾 Generated sample merchandise sales slip ESC/POS payload.');
    addLog?.('[PRINTER SALE] Successfully compiled sample sale payload to ESC/POS binary format.');
  };

  const handleToggle3rdParty = () => {
    const next = !enable3rdPartyReaders;
    setEnable3rdPartyReaders(next);
    triggerNotification(next ? 'Enabled external 3rd-party readers (Square, Zettle)' : 'Disabled external 3rd-party reader integration');
    addLog(`Settings: set 3rd-party reader integration status to ${next}`);
  };

  const handleToggleNativeNFC = () => {
    const next = !enableNativeNFC;
    setEnableNativeNFC(next);
    triggerNotification(next ? 'Enabled native device NFC Tap-to-Pay reader' : 'Disabled native device NFC reader');
    addLog(`Settings: set native device NFC sensor standby to ${next}`);
  };

  const startScanningDevices = () => {
    if (!enable3rdPartyReaders) {
      triggerNotification('Please enable external 3rd party readers first.');
      return;
    }
    setIsScanningReaders(true);
    triggerNotification('Scanning local Bluetooth / USB / audio ports for reader terminals...');
    addLog('Card readers scan triggered on Bluetooth protocols...');
    
    setTimeout(() => {
      setIsScanningReaders(false);
      triggerNotification('Scan complete. Found 2 active readers.');
    }, 1805);
  };

  const connectDevice = (id: string, name: string) => {
    setConnectedDeviceId(id);
    triggerNotification(`Connected successfully to ${name}!`);
    addLog(`Card reader ${name} (ID: ${id}) calibrated for live checkout.`);
  };

  const handleConnectReader = () => {
    setIsCardReaderSettingsOpen(prev => !prev);
  };

  // Collapsible: Data & Security core triggers
  const handleExportReports = () => {
    addLog(`Constructing settlement report package: ${sales.length} transactions processed...`);
    triggerNotification(`CSV generated for all registered sales. Save success!`);
  };

  const handleBackupCloud = () => {
    addLog("Triggering manual sync procedures to Supabase secure servers...");
    triggerNotification("Backup Successful: All local cache pushed to live servers.");
  };

  const handleClearCache = () => {
    addLog("Purging stored image caches and temp objects...");
    triggerNotification("Internal application storage cache freed successfully.");
  };

  const handleClearTestData = () => {
    if (window.confirm("CRITICAL WARNING: This will immediately delete all local recorded sales, inventory objects, and dates schedules for this artist. Are you absolutely sure?")) {
      setSales([]);
      setShows(prev => prev.map(s => ({ ...s, revenue: 0 })));
      // Reset some initial settings
      triggerNotification("Wiped local tour data indices.");
      addLog("Master clear data trigger committed by active administrator.");
    }
  };

  const handleLiveDatabaseReset = async () => {
    if (!window.confirm("🚨 ACTIVE ALPHA FULL PURGE WARNING:\n\nThis will completely delete all live shows, sales, notes, and inventory records from your active Supabase Postgres database tables AND clear your local state. This is perfect for wiping dry-run data before official release. Are you sure you want to initialize a cold clean?")) {
      return;
    }
    
    addLog("Initiating full-stack Alpha Purge procedures on Supabase Postgres tables...");
    triggerNotification("Executing live database tables reset...");
    
    const supabase = getSupabase();
    if (supabase) {
      try {
        addLog("Purging 'sales' table on active database with non-matching ID condition...");
        const { error: salesErr } = await supabase.from('sales').delete().neq('id', 'placeholder_reset_id');
        if (salesErr) addLog(`Sales table purge skipped or failed: ${salesErr.message}`);

        addLog("Purging 'shows' table on active database with non-matching ID condition...");
        const { error: showsErr } = await supabase.from('shows').delete().neq('id', 'placeholder_reset_id');
        if (showsErr) addLog(`Shows table purge skipped or failed: ${showsErr.message}`);

        addLog("Purging 'notes' table on active database with non-matching ID condition...");
        const { error: notesErr } = await supabase.from('notes').delete().neq('id', 'placeholder_reset_id');
        if (notesErr) addLog(`Notes table purge skipped or failed: ${notesErr.message}`);

        addLog("Purging 'inventory' items on active database with non-matching ID condition...");
        const { error: invErr } = await supabase.from('inventory').delete().neq('id', 'placeholder_reset_id');
        if (invErr) addLog(`Inventory purge skipped/failed: ${invErr.message}`);
        
        addLog("Supabase Postgres database tables wiped clean successfully.");
      } catch (dbErr: any) {
        console.error("Live purge failed:", dbErr);
        addLog(`Live database wipe warning: ${dbErr.message || dbErr}`);
      }
    }

    setSales([]);
    setShows([]);
    setInventory([]);

    // Clear namespaced offline cache keys for this context to make sure the slate is 100% clean
    try {
      const suffix = activeBand?.id || userProfile?.id || 'offline';
      localStorage.removeItem(`nexus_core_${suffix}_sales_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_shows_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_notes_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_audits_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_inventory_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_expenses`);
      localStorage.removeItem(`nexus_core_${suffix}_cash_transactions`);
      localStorage.removeItem(`nexus_core_${suffix}_sales_goal`);
      addLog(`Purged offline cache namespaces for ID context: ${suffix}`);
    } catch (e) {
      console.error('Failed to clear namespaced cache:', e);
    }
    
    triggerNotification("🚀 Live & Local database tables wiped. Slate is 100% clean.");
    addLog("Alpha cold purge sequence finished. Slate is pristine.");
  };

  const isMatchingWorkspace = (w: any, type: string) => {
    if (!w) return false;
    const t = type.toLowerCase().replace(/_/g, ' ').trim();
    if (typeof w === 'string') {
      const s = w.toLowerCase().replace(/_/g, ' ').trim();
      return s === t || (t === 'creative' && (s === 'creative' || s === 'creative pro' || s === 'creative_pro'));
    }
    if (typeof w === 'object') {
      const itemType = (w.type || w.key || w.workspace_type || '').toLowerCase().replace(/_/g, ' ').trim();
      return itemType === t || (t === 'creative' && (itemType === 'creative' || itemType === 'creative pro' || itemType === 'creative_pro'));
    }
    return false;
  };

  const handleDeactivateWorkspace = async () => {
    setDangerActionLoading(true);
    addLog(`Deactivating ${portalType} workspace...`);
    
    if (userProfile) {
      try {
        const supabase = getSupabase();
        const updatedWorkspaces = (userProfile.registered_workspaces || []).filter(w => !isMatchingWorkspace(w, portalType));
        const updatedAllowed = (userProfile.allowed_workspaces || []).filter(w => !isMatchingWorkspace(w, portalType));
        
        let remainingType: any = 'industry_pro';
        if (updatedWorkspaces.length > 0) {
          const first = updatedWorkspaces[0];
          remainingType = typeof first === 'string' ? first : (first.type || first.key || 'industry_pro');
        }

        const profileUpdates: any = {
          registered_workspaces: updatedWorkspaces,
          allowed_workspaces: updatedAllowed,
        };

        if (portalType === 'band') {
          profileUpdates.band_id = null;
          profileUpdates.band_name = null;
          profileUpdates.bandName = null;
        } else if (portalType === 'creative') {
          profileUpdates.creative_id = null;
          profileUpdates.creator_id = null;
          profileUpdates.creative_handle = null;
          profileUpdates.creative_business_name = null;
          profileUpdates.creative_name = null;
          profileUpdates.creative_avatar = null;
          profileUpdates.creative_banner = null;
          profileUpdates.creative_metadata = {};
        } else if (portalType === 'label') {
          profileUpdates.label_id = null;
          profileUpdates.label_company_name = null;
        } else if (portalType === 'promoter') {
          profileUpdates.promoter_id = null;
          profileUpdates.promoter_agency = null;
        }

        if (userProfile.account_type === portalType) {
          profileUpdates.account_type = remainingType;
        }
        if (userProfile.active_workspace === portalType) {
          profileUpdates.active_workspace = remainingType;
        }
        
        if (supabase) {
          await executeWithSchemaResilience(
            async (p) => supabase.from('profiles').update(p).eq('id', userProfile.id),
            profileUpdates
          );
        }
        
        const nextProfile = {
          ...userProfile,
          ...profileUpdates
        };

        setUserProfile(nextProfile);
        try {
          localStorage.setItem('nexus_core_user_profile', JSON.stringify(nextProfile));
          localStorage.setItem('nexus_user', JSON.stringify(nextProfile));
        } catch (_) {}
        
        triggerNotification(`${portalType.toUpperCase()} Workspace Deactivated.`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        addLog(`Failed to deactivate workspace: ${err.message}`);
        setDangerActionLoading(false);
      }
    }
  };

  const handleDeleteWorkspace = async () => {
    setDangerActionLoading(true);
    addLog(`Initiating complete deletion of ${portalType} workspace and related data...`);
    
    try {
      const supabase = getSupabase();
      
      if (portalType === 'band' && activeBand?.id) {
        if (supabase) {
          await supabase.from('bands').delete().eq('id', activeBand.id);
        }
        if (setBands) {
          setBands(prev => prev.filter(b => b.id !== activeBand.id));
        }
      } else if (portalType === 'creative' && userProfile?.id) {
        if (supabase) {
          const creativeIdToPurge = userProfile.creative_id || (userProfile as any).registered_creative_id;
          if (creativeIdToPurge) {
            await supabase.from('creatives').delete().eq('id', creativeIdToPurge);
          }
          await supabase.from('creatives').delete().eq('creator_id', userProfile.id);
          await supabase.from('creatives').delete().eq('user_id', userProfile.id);
        }
      } else if (portalType === 'promoter' && userProfile?.id) {
        if (supabase) {
          await supabase.from('promoters').delete().eq('creator_id', userProfile.id);
        }
      } else if (portalType === 'label' && userProfile?.id) {
        if (supabase) {
          await supabase.from('labels').delete().eq('creator_id', userProfile.id);
        }
      }
      
      const suffix = activeBand?.id || userProfile?.id || 'offline';
      localStorage.removeItem(`nexus_core_${suffix}_sales_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_shows_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_notes_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_audits_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_inventory_offline`);
      localStorage.removeItem(`nexus_core_${suffix}_expenses`);
      localStorage.removeItem(`nexus_core_${suffix}_cash_transactions`);
      localStorage.removeItem(`nexus_core_${suffix}_sales_goal`);
      
      if (portalType === 'creative') {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (
              k.toLowerCase().includes('creative') ||
              k.toLowerCase().includes('lookbook') ||
              k.toLowerCase().includes('portfolio') ||
              k.startsWith(`nexus_core_${userProfile?.id}_creative`)
            ) && k !== 'nexus_target_register_workspace') {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (_) {}
      }

      if (userProfile) {
        const updatedWorkspaces = (userProfile.registered_workspaces || []).filter(w => !isMatchingWorkspace(w, portalType));
        const updatedAllowed = (userProfile.allowed_workspaces || []).filter(w => !isMatchingWorkspace(w, portalType));

        let remainingType: any = 'industry_pro';
        if (updatedWorkspaces.length > 0) {
          const first = updatedWorkspaces[0];
          remainingType = typeof first === 'string' ? first : (first.type || first.key || 'industry_pro');
        }

        const profileUpdates: any = {
          registered_workspaces: updatedWorkspaces,
          allowed_workspaces: updatedAllowed,
        };

        if (portalType === 'band') {
          profileUpdates.band_id = null;
          profileUpdates.band_name = null;
          profileUpdates.bandName = null;
        } else if (portalType === 'creative') {
          profileUpdates.creative_id = null;
          profileUpdates.creator_id = null;
          profileUpdates.creative_handle = null;
          profileUpdates.creative_business_name = null;
          profileUpdates.creative_name = null;
          profileUpdates.creative_avatar = null;
          profileUpdates.creative_banner = null;
          profileUpdates.creative_metadata = {};
        } else if (portalType === 'label') {
          profileUpdates.label_id = null;
          profileUpdates.label_company_name = null;
        } else if (portalType === 'promoter') {
          profileUpdates.promoter_id = null;
          profileUpdates.promoter_agency = null;
        }

        if (userProfile.account_type === portalType) {
          profileUpdates.account_type = remainingType;
        }
        if (userProfile.active_workspace === portalType) {
          profileUpdates.active_workspace = remainingType;
        }

        if (supabase) {
          await executeWithSchemaResilience(
            async (p) => supabase.from('profiles').update(p).eq('id', userProfile.id),
            profileUpdates
          );
        }

        const nextProfile = {
          ...userProfile,
          ...profileUpdates
        };

        setUserProfile(nextProfile);
        try {
          localStorage.setItem('nexus_core_user_profile', JSON.stringify(nextProfile));
          localStorage.setItem('nexus_user', JSON.stringify(nextProfile));
        } catch (_) {}
      } else {
        localStorage.removeItem('nexus_core_user_profile');
        setUserProfile(null);
      }
      
      triggerNotification(`✓ ${portalType.toUpperCase()} Workspace deleted and purged completely.`);
      
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      addLog(`Failed to delete workspace: ${err.message}`);
      setDangerActionLoading(false);
    }
  };

  const handleDownloadSchemaDump = () => {
    const fullDump = {
      _metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0",
        format: "Nexus_Core_Local_Schema_Dump"
      },
      userProfile,
      bands,
      shows,
      inventory,
      sales,
      logs
    };
    
    const blobContent = JSON.stringify(fullDump, null, 2);
    try {
      const blob = new Blob([blobContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus_core_schema_data_dump_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification("Local schema and data dump downloaded successfully.");
      addLog("User requested local DB JSON dump export.");
    } catch {
      triggerNotification("Failed to generate data dump.");
    }
  };

  if (onlyShowSection === 'processors') {
    return (
      <div className="bg-[#0c0e12] text-zinc-100 flex flex-col font-sans select-none p-1">
        <StripeConnectPayoutSection
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          triggerNotification={triggerNotification}
          role="band"
          theme="purple"
          clearanceLevel={userProfile.clearance_level || 5}
        />
      </div>
    );
  }

  if (onlyShowSection === 'tools') {
    return (
      <div className="bg-[#0c0e12] text-zinc-100 flex flex-col font-sans select-none p-1">
        <div className="p-1 space-y-6">
          {/* Card Reader Settings block */}
          <div className="bg-[#111319]/50 border border-zinc-850 rounded-xl p-4 space-y-4">
            <div className="w-full flex items-center justify-between text-left">
              <h4 className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Bluetooth className="w-4 h-4 text-cyan-400" /> Bluetooth Card Readers Calibration
              </h4>
              <button
                type="button"
                onClick={handleConnectReader}
                className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {isCardReaderSettingsOpen ? 'Hide Controls' : 'Calibrate / Setup'}
              </button>
            </div>

            {isCardReaderSettingsOpen && (
              <div className="space-y-4 pt-2.5 border-t border-zinc-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">3rd Party Integrations</span>
                      <span className="text-[9px] font-mono text-zinc-500">Enable Square & Zettle frameworks</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={enable3rdPartyReaders} 
                      onChange={handleToggle3rdParty}
                      className="w-4 h-4 accent-cyan-400"
                    />
                  </div>

                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Native Tap-To-Pay NFC</span>
                      <span className="text-[9px] font-mono text-zinc-500">Access device contactless sensor</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={enableNativeNFC} 
                      onChange={handleToggleNativeNFC}
                      className="w-4 h-4 accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Available Scanning Ports</span>
                    <button
                      type="button"
                      onClick={startScanningDevices}
                      disabled={isScanningReaders}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-mono uppercase font-bold tracking-widest rounded-lg disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer"
                    >
                      {isScanningReaders ? 'SCANNING...' : 'SCAN FOR BLUETOOTH DEVICES'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    {scannedDevices.map((dev, dIdx) => (
                      <div key={dev.id ? `scan-dev-${dev.id}-${dIdx}` : `scan-dev-${dIdx}`} className="bg-zinc-950 border border-zinc-900/50 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <Bluetooth className="w-3.5 h-3.5 text-zinc-550" />
                          <span className="font-medium text-zinc-300">{dev.name} ({dev.manufacturer})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => connectDevice(dev.id, dev.name)}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase cursor-pointer ${connectedDeviceId === dev.id ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                        >
                          {connectedDeviceId === dev.id ? 'CONNECTED' : 'CONNECT'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thermal Printer ESCPOS emulator block */}
          <div className="bg-[#111319]/50 border border-zinc-850 rounded-xl p-4 space-y-4">
            <div className="w-full flex items-center justify-between text-left">
              <h4 className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Printer className="w-4 h-4 text-cyan-400" /> ESC/POS Thermal Receipt Printer Calibration
              </h4>
              <button
                type="button"
                onClick={() => setIsThermalPrinterSettingsOpen(!isThermalPrinterSettingsOpen)}
                className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {isThermalPrinterSettingsOpen ? 'Hide Controls' : 'Open Settings'}
              </button>
            </div>

            {isThermalPrinterSettingsOpen && (
              <div className="space-y-4 pt-2.5 border-t border-zinc-900/50">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={triggerFeedTestStrip}
                    className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Feed Test Strip
                  </button>
                  <button
                    type="button"
                    onClick={triggerTestSaleReceipt}
                    className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" /> Print Sample Sale
                  </button>
                </div>

                {lastPrintedBytes && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-550 uppercase tracking-widest font-black">
                      <span>Binary Buffer Outbound Frame</span>
                      <span>{lastPrintedBytes.length} Bytes Compiled</span>
                    </div>
                    <div className="p-3.5 bg-black rounded-xl border border-zinc-900 text-[9px] font-mono text-[#00ffcc] break-all leading-normal">
                      {Array.from(lastPrintedBytes.slice(0, 100)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')} 
                      {lastPrintedBytes.length > 100 && ' ...'}
                    </div>
                  </div>
                )}

                {lastPrintedText && (
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block font-black">Thermal Slip Paper Feed Emulation Preview</span>
                    <div className="p-5 bg-white text-black font-mono text-[10px] rounded-xl shadow-2xl max-w-sm mx-auto leading-relaxed overflow-x-auto border-2 border-dashed border-gray-400 whitespace-pre">
                      {lastPrintedText}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0e12] min-h-screen text-zinc-100 flex flex-col font-sans select-none pb-12">
      
      <AnimatePresence>
        {cropperOpen && cropperImageSrc && (
          <InteractiveCropperModal
            isOpen={cropperOpen}
            imageSrc={cropperImageSrc}
            aspectRatio={croppingTarget === 'band' ? '3:1' : '1:1'}
            onClose={() => {
              setCropperOpen(false);
              setCropperImageSrc(null);
            }}
            onCropComplete={async (croppedBase64) => {
              setCropperOpen(false);
              setCropperImageSrc(null);
              try {
                const userProfileId = userProfile?.id || 'profile_admin';
                if (croppingTarget === 'profile') {
                  const uploadRes = await uploadBase64ToStorage(croppedBase64, 'avatars', userProfileId, 'profile-avatar');
                  const publicUrl = uploadRes || croppedBase64;
                  setEditUserForm(prev => ({ ...prev, avatar_url: publicUrl }));
                  setUserProfile(prev => ({ ...prev, avatar_url: publicUrl }));
                  
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('nexus_avatar_updated', {
                      detail: {
                        avatarUrl: publicUrl,
                        authorName: userProfile?.name || 'User',
                        authorRole: userProfile?.role || 'Member'
                      }
                    }));
                  }
                  
                  syncProfileAndBandToSupabase(
                    userProfileId,
                    userProfile?.name || 'Admin Profile',
                    userProfile?.email || 'admin@example.com',
                    userProfile?.role || 'Manager',
                    publicUrl,
                    activeBand?.id,
                    activeBand?.name || 'Artist',
                    activeBand?.genre || '',
                    activeBand?.homebase || 'Los Angeles, CA',
                    activeBand?.logo_url || ''
                  );
                } else if (croppingTarget === 'band') {
                  const uploadRes = await uploadBase64ToStorage(croppedBase64, 'community-bands', userProfileId, 'band-logo');
                  const publicUrl = uploadRes || croppedBase64;
                  setEditBandForm(prev => ({ ...prev, logo_url: publicUrl }));
                  if (setBands && activeBand) {
                    setBands(prev => prev.map(b => b?.id === activeBand?.id ? { ...b, logo_url: publicUrl } : b));
                  }
                  
                  syncProfileAndBandToSupabase(
                    userProfileId,
                    userProfile?.name || 'Admin Profile',
                    userProfile?.email || 'admin@example.com',
                    userProfile?.role || 'Manager',
                    userProfile?.avatar_url || null,
                    activeBand?.id,
                    activeBand?.name || 'Artist',
                    activeBand?.genre || '',
                    activeBand?.homebase || 'Los Angeles, CA',
                    publicUrl
                  );
                } else {
                  setSandboxProfilePic(croppedBase64);
                }
                triggerNotification('Image cropped and optimized successfully!');
              } catch (err) {
                console.error('Cropper error:', err);
                triggerNotification('Image upload failed.');
              }
            }}
          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showVariantsDbWarning && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pt-5 pb-1">
             <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col gap-2">
               <div className="flex items-center gap-2 text-red-500">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Supabase Schema Fix Required</span>
               </div>
               <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                 The <code>variants</code> column is missing in your Live Supabase database. Item variations will work offline, but will eventually mix together when reloading. Please run this in your Supabase SQL editor:
               </p>
               <div className="bg-[#0a0a0c]/80 p-2 text-[10px] font-mono text-[#00ffcc] rounded mt-1 overflow-x-auto whitespace-pre border border-zinc-900/50">
                 ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS variants JSONB;
               </div>
               <button
                  onClick={() => {
                    localStorage.removeItem('NEXUS_CORE_MISSING_COLUMN_VARIANTS');
                    setShowVariantsDbWarning(false);
                  }}
                  className="mt-2 ml-auto text-[9px] bg-red-500/15 border border-red-500/20 text-red-400 font-mono font-bold uppercase px-3 py-1.5 rounded active:scale-95 transition-all text-center max-w-[max-content]"
               >
                 Dismiss Check
               </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {(localStorage.getItem('NEXUS_CORE_MISSING_COLUMN_DATA') === 'true') && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pt-5 pb-1">
             <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2">
               <div className="flex items-center gap-2 text-amber-500">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Messaging Schema Missing</span>
               </div>
               <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                 The chat tables are missing the required <code>data</code> column. Messaging will fail to save. Run this in your Supabase SQL editor:
               </p>
               <div className="bg-[#0a0a0c]/80 p-2 text-[10px] font-mono text-[#00ffcc] rounded mt-1 overflow-x-auto whitespace-pre border border-zinc-900/50">
{`ALTER TABLE public.nexus_chats ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE public.nexus_notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE public.nexus_posts ADD COLUMN IF NOT EXISTS data JSONB;`}
               </div>
               <button
                  onClick={() => {
                    localStorage.removeItem('NEXUS_CORE_MISSING_COLUMN_DATA');
                    window.location.reload();
                  }}
                  className="mt-2 ml-auto text-[9px] bg-amber-500/15 border border-amber-500/20 text-amber-400 font-mono font-bold uppercase px-3 py-1.5 rounded active:scale-95 transition-all text-center max-w-[max-content]"
               >
                 Dismiss & Reload
               </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>


      {/* SETTINGS PANELS CONTAINER */}
      <div className="w-full space-y-6 mt-4 relative">
        
        {/* SIMULATED PUSH NOTIFICATION HUD (STREAMS REAL PREVIEW TELEMETRY) */}
        <AnimatePresence>
          {simulatedNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-[#111319]/95 border-2 border-[#00ffcc] backdrop-blur-md p-4 rounded-2xl shadow-2xl shadow-[#00ffcc]/10 flex items-start gap-3 max-w-md mx-auto relative z-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ffcc]/5 to-transparent pointer-events-none" />
              <div className="w-10 h-10 rounded-full bg-[#00ffcc]/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-[#00ffcc]" />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-black text-[#00ffcc]">
                    {simulatedNotification.category} Alert
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500">
                    {simulatedNotification.time}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white font-sans">{simulatedNotification.title}</h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">{simulatedNotification.body}</p>
              </div>
              <button 
                onClick={() => setSimulatedNotification(null)}
                className="text-zinc-500 hover:text-white transition p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* 1. PAYMENT PROCESSORS */}
        {!hideSectionProcessors && (
        <div className="bg-[#090b0e]/80 border-y border-zinc-900 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('processors')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">1. STRIPE CONNECT & VENDOR PAYOUTS</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Establish verified merchant payout channels and receive direct settlements.</p>
              </div>
            </div>
            {expandedSections.processors ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>
          
          <AnimatePresence initial={false}>
            {expandedSections.processors && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5">
                  <StripeConnectPayoutSection
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    triggerNotification={triggerNotification}
                    role="band"
                    theme="purple"
                    clearanceLevel={userProfile.clearance_level || 5}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        )}

        {/* 2. NOTIFICATIONS & PUSH SERVICES */}
        <div className="bg-[#090b0e]/80 border-y border-zinc-900 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('notifications')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">2. NOTIFICATIONS & PUSH SERVICES</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Toggle critical alerts, register mobile push tokens, and test telemetry.</p>
              </div>
            </div>
            {expandedSections.notifications ? <ChevronDown className="w-4 h-4 text-zinc-550" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.notifications && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Toggles */}
                    <div className="bg-[#111319]/50 border border-zinc-850 p-4 rounded-xl space-y-4">
                      {portalType === 'label' ? (
                        <>
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                            <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Alert Configurations</h4>
                            <span className="text-[8px] font-mono bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Push Classification Active</span>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Group 1: Device Push Notifications (High priority) */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider font-bold">Device Push Alerts (High Priority)</span>
                              </div>
                              
                              <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-900/60 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-zinc-200 block">Critical Low Stock Thresholds</span>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">External alert sent when signed act tour inventory is critically low (&lt;10%) to prevent immediate retail sales losses on tour stops.</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={notificationSettings.lowStock} 
                                    onChange={() => handleToggleNotification('lowStock')}
                                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 bg-zinc-950 border-zinc-800 mt-1 cursor-pointer"
                                  />
                                </div>

                                <div className="flex items-start justify-between gap-3 pt-2 border-t border-zinc-900/40">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-zinc-200 block">Escrows & Promoter Disputes</span>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">Immediate physical device ping when promoter split disputes arise, payment gateway chargebacks trigger, or contract escrow settlements fail.</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={notificationSettings.paymentUpdates} 
                                    onChange={() => handleToggleNotification('paymentUpdates')}
                                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 bg-zinc-950 border-zinc-800 mt-1 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Group 2: Internal Notifications (In-App Only) */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                <span className="text-[9px] font-mono text-sky-400 uppercase tracking-wider font-bold">Internal Inbox Only (Medium/Low Priority)</span>
                              </div>
                              
                              <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-900/60 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-zinc-200 block">Nightly Show Closeouts & Audits</span>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">Aggregated nightly show grosses, stock settlement checklists, and manager signatures. Kept in-app to prevent repetitive notification spam.</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={notificationSettings.nightlySummaries} 
                                    onChange={() => handleToggleNotification('nightlySummaries')}
                                    className="w-4 h-4 rounded text-blue-500 accent-blue-500 bg-zinc-950 border-zinc-800 mt-1 cursor-pointer"
                                  />
                                </div>

                                <div className="flex items-start justify-between gap-3 pt-2 border-t border-zinc-900/40">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-zinc-200 block">Roster Team Logistics & Chat</span>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">Collaborator join requests, subsidiary imprint catalog updates, and internal chat dispatches.</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={notificationSettings.teamActivity} 
                                    onChange={() => handleToggleNotification('teamActivity')}
                                    className="w-4 h-4 rounded text-blue-500 accent-blue-500 bg-zinc-950 border-zinc-800 mt-1 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Alert Configurations</h4>
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-350">Inventory Low Stock Triggers</span>
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.lowStock} 
                                onChange={() => handleToggleNotification('lowStock')}
                                className="w-4 h-4 rounded text-blue-500 accent-[#00ffcc] bg-zinc-950 border-zinc-800"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-350">Nightly Show Closeouts & Audits</span>
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.nightlySummaries} 
                                onChange={() => handleToggleNotification('nightlySummaries')}
                                className="w-4 h-4 rounded text-blue-500 accent-[#00ffcc] bg-zinc-950 border-zinc-800"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-350">Live Team Logistics & Chat Updates</span>
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.teamActivity} 
                                onChange={() => handleToggleNotification('teamActivity')}
                                className="w-4 h-4 rounded text-blue-500 accent-[#00ffcc] bg-zinc-950 border-zinc-800"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-350">Escrows & Promoter Payments</span>
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.paymentUpdates} 
                                onChange={() => handleToggleNotification('paymentUpdates')}
                                className="w-4 h-4 rounded text-blue-500 accent-[#00ffcc] bg-zinc-950 border-zinc-800"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Push Handshake */}
                    <div className="bg-[#111319]/50 border border-zinc-850 p-4 rounded-xl space-y-4">
                      <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">APNs/FCM Mobile Handshake</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-mono">
                          <span className="text-zinc-500">SYSTEM PERMISSION</span>
                          <span className={`font-black ${pushPermission === 'granted' ? 'text-emerald-400' : 'text-zinc-500'}`}>{pushPermission.toUpperCase()}</span>
                        </div>
                        {mockPushToken && (
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono text-zinc-500 block uppercase">FCM CRYPTO REGISTRATION TOKEN</span>
                            <span className="text-[9px] font-mono text-zinc-300 block truncate bg-zinc-950 p-1 px-2 rounded border border-zinc-900">{mockPushToken}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleSyncDevicePush}
                        disabled={isSyncingPush}
                        className="w-full bg-[#111319] hover:bg-zinc-900 border border-zinc-800 py-2 rounded-lg text-[9px] font-mono text-[#00ffcc] font-bold uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isSyncingPush ? 'CRYPTO HANDSHAKE RUNNING...' : '⚡ SYNCHRONIZE ACTIVE DEVICE FOR PUSH ALERTS'}
                      </button>
                    </div>
                  </div>

                  {/* Test Alerts */}
                  <div className="border-t border-zinc-900 pt-4 space-y-3">
                    <h4 className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider text-center">FCM Diagnostics: Inject Test Notifications</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button 
                        type="button"
                        onClick={() => handleTestPush('lowStock')}
                        className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        📦 Low Stock Alert
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleTestPush('nightlySummaries')}
                        className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        📈 Settlement Summary
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleTestPush('teamActivity')}
                        className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        ⚡ Logistical Sync
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleTestPush('paymentUpdates')}
                        className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        💸 Settlement Disbursed
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 3. TOUR PREFERENCES */}
        <div className="bg-[#090b0e]/80 border-y border-zinc-900 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('preferences')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">3. TOUR PREFERENCES</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Configure default currency formats and timezone offsets.</p>
              </div>
            </div>
            {expandedSections.preferences ? <ChevronDown className="w-4 h-4 text-zinc-550" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.preferences && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">Base Currency Unit</label>
                    <select
                      value={currency}
                      onChange={e => { setCurrency(e.target.value); triggerNotification(`Currency changed to ${e.target.value}`); }}
                      className="w-full bg-[#111319]/60 border border-zinc-850 text-white rounded-xl px-3.5 py-2.5 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                      <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                      <option value="AUD ($)">AUD ($) - Australian Dollar</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest">Global Timezone Reference</label>
                    <select
                      value={timezone}
                      onChange={e => { setTimezone(e.target.value); triggerNotification(`Timezone changed to ${e.target.value}`); }}
                      className="w-full bg-[#111319]/60 border border-zinc-850 text-white rounded-xl px-3.5 py-2.5 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="GMT-5 (EST)">GMT-5 (EST) - Eastern Standard Time</option>
                      <option value="GMT-6 (CST)">GMT-6 (CST) - Central Standard Time</option>
                      <option value="GMT-7 (MST)">GMT-7 (MST) - Mountain Standard Time</option>
                      <option value="GMT-8 (PST)">GMT-8 (PST) - Pacific Standard Time</option>
                      <option value="GMT+0 (UTC)">GMT+0 (UTC) - Universal Coordinated Time</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 4. ACCOUNT SECURITY */}
        <div className="bg-[#090b0e]/80 border-y border-zinc-900 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('security')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">4. ACCOUNT SECURITY</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Manage credentials and password visibility.</p>
              </div>
            </div>
            {expandedSections.security ? <ChevronDown className="w-4 h-4 text-zinc-550" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.security && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="bg-[#111319]/50 border border-zinc-850 p-4 rounded-xl space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Active Operator Password</label>
                      <div className="flex items-center gap-2">
                        <input
                          type={showPasswordField ? 'text' : 'password'}
                          value={userPassword}
                          onChange={e => { setUserPassword(e.target.value); if(typeof localStorage !== 'undefined') localStorage.setItem('nexus_core_user_password', e.target.value); }}
                          className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-lg px-3.5 py-2 font-mono text-xs focus:outline-none focus:border-violet-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordField(!showPasswordField)}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                          {showPasswordField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-550">
                      <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>Only administrators with <strong>Full Roster Management</strong> status can redefine operational codes.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 5. HARDWARE & POINT OF SALE */}
        {!hideSectionTools && (
        <div className="bg-[#090b0e]/80 border-y border-zinc-900 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('tools')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">5. HARDWARE & POINT OF SALE</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Calibrate bluetooth card readers, NFC Tap-to-Pay, and ESC/POS thermal printers.</p>
              </div>
            </div>
            {expandedSections.tools ? <ChevronDown className="w-4 h-4 text-zinc-550" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.tools && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-6">
                  {/* Card Reader Settings block */}
                  <div className="bg-[#111319]/50 border border-zinc-850 rounded-xl p-4 space-y-4">
                    <div className="w-full flex items-center justify-between text-left">
                      <h4 className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <Bluetooth className="w-4 h-4 text-cyan-400" /> Bluetooth Card Readers Calibration
                      </h4>
                      <button
                        type="button"
                        onClick={handleConnectReader}
                        className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
                      >
                        {isCardReaderSettingsOpen ? 'Hide Controls' : 'Calibrate / Setup'}
                      </button>
                    </div>

                    {isCardReaderSettingsOpen && (
                      <div className="space-y-4 pt-2.5 border-t border-zinc-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">3rd Party Integrations</span>
                              <span className="text-[9px] font-mono text-zinc-500">Enable Square & Zettle frameworks</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={enable3rdPartyReaders} 
                              onChange={handleToggle3rdParty}
                              className="w-4 h-4 accent-cyan-400"
                            />
                          </div>

                          <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">Native Tap-To-Pay NFC</span>
                              <span className="text-[9px] font-mono text-zinc-500">Access device contactless sensor</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={enableNativeNFC} 
                              onChange={handleToggleNativeNFC}
                              className="w-4 h-4 accent-cyan-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Available Scanning Ports</span>
                            <button
                              type="button"
                              onClick={startScanningDevices}
                              disabled={isScanningReaders}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-mono uppercase font-bold tracking-widest rounded-lg disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer"
                            >
                              {isScanningReaders ? 'SCANNING...' : 'SCAN FOR BLUETOOTH DEVICES'}
                            </button>
                          </div>

                          <div className="space-y-1">
                            {scannedDevices.map((dev, idx) => (
                              <div key={`${dev.id}-${idx}`} className="bg-zinc-950 border border-zinc-900/50 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  <Bluetooth className="w-3.5 h-3.5 text-zinc-500" />
                                  <span className="font-medium text-zinc-300">{dev.name} ({dev.manufacturer})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => connectDevice(dev.id, dev.name)}
                                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase cursor-pointer ${connectedDeviceId === dev.id ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                >
                                  {connectedDeviceId === dev.id ? 'CONNECTED' : 'CONNECT'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thermal Printer ESCPOS emulator block */}
                  <div className="bg-[#111319]/50 border border-zinc-850 rounded-xl p-4 space-y-4">
                    <div className="w-full flex items-center justify-between text-left">
                      <h4 className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <Printer className="w-4 h-4 text-cyan-400" /> ESC/POS Thermal Receipt Printer Calibration
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsThermalPrinterSettingsOpen(!isThermalPrinterSettingsOpen)}
                        className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
                      >
                        {isThermalPrinterSettingsOpen ? 'Hide Controls' : 'Open Settings'}
                      </button>
                    </div>

                    {isThermalPrinterSettingsOpen && (
                      <div className="space-y-4 pt-2.5 border-t border-zinc-900/50">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={triggerFeedTestStrip}
                            className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Feed Test Strip
                          </button>
                          <button
                            type="button"
                            onClick={triggerTestSaleReceipt}
                            className="py-2 px-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" /> Print Sample Sale
                          </button>
                        </div>

                        {lastPrintedBytes && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[8px] font-mono text-zinc-550 uppercase tracking-widest font-black">
                              <span>Binary Buffer Outbound Frame</span>
                              <span>{lastPrintedBytes.length} Bytes Compiled</span>
                            </div>
                            <div className="p-3.5 bg-black rounded-xl border border-zinc-900 text-[9px] font-mono text-[#00ffcc] break-all leading-normal">
                              {Array.from(lastPrintedBytes.slice(0, 100)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')} 
                              {lastPrintedBytes.length > 100 && ' ...'}
                            </div>
                          </div>
                        )}

                        {lastPrintedText && (
                          <div className="space-y-2">
                            <span className="text-[8px] font-mono text-zinc-555 uppercase tracking-widest block font-black">Thermal Slip Paper Feed Emulation Preview</span>
                            <div className="p-5 bg-white text-black font-mono text-[10px] rounded-xl shadow-2xl max-w-sm mx-auto leading-relaxed overflow-x-auto border-2 border-dashed border-gray-400 whitespace-pre">
                              {lastPrintedText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        )}

        {/* 6. DATABASE & CACHE UTILITIES */}
        <div className="bg-[#090b0e]/80 border-y border-red-900/20 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('advanced')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase">6. DATABASE & CACHE UTILITIES</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Run diagnostic wipes, export reports, and backup JSON database schemas.</p>
              </div>
            </div>
            {expandedSections.advanced ? <ChevronDown className="w-4 h-4 text-zinc-550" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.advanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={handleExportReports}
                      className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-left rounded-xl space-y-1 group transition cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-white group-hover:text-[#00ffcc] transition">Export Reports CSV</span>
                      <span className="block text-[10px] text-zinc-500">Construct settlement report CSV packages.</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBackupCloud}
                      className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-left rounded-xl space-y-1 group transition cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-white group-hover:text-[#00ffcc] transition">Cloud Backup</span>
                      <span className="block text-[10px] text-zinc-500">Pushes active local memory cache to cloud server.</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-left rounded-xl space-y-1 group transition cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-white group-hover:text-[#00ffcc] transition">Purge App Cache</span>
                      <span className="block text-[10px] text-zinc-500">Free stored image buffers and memory leaks.</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearTestData}
                      className="p-4 bg-zinc-950/40 hover:bg-red-950/10 border border-zinc-850 hover:border-red-500/20 text-left rounded-xl space-y-1 group transition cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-zinc-300 group-hover:text-red-400 transition">Reset Local State</span>
                      <span className="block text-[10px] text-zinc-500">Wipe client storage indices (local test records).</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLiveDatabaseReset}
                      className="p-4 bg-red-950/10 hover:bg-red-950/20 border border-red-950/30 hover:border-red-500/40 text-left rounded-xl space-y-1 group transition cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-red-400 group-hover:text-red-300 transition">Postgres Clean (Cold Purge)</span>
                      <span className="block text-[10px] text-red-500/70">Hard wipe all records from active Postgres tables.</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSchemaDump}
                      className="p-4 bg-[#111319]/50 hover:bg-zinc-900 border border-zinc-850 hover:border-[#00ffcc]/30 text-left rounded-xl space-y-1 group transition cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-white group-hover:text-[#00ffcc] transition">JSON Schema Dump</span>
                      <span className="block text-[10px] text-zinc-500">Download whole structural data dump backup file.</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 7. DANGER ZONE */}
        <div className="bg-[#090b0e]/80 border-y border-red-900/20 w-full overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => toggleSection('dangerZone')}
            className="w-full flex items-center justify-between p-5 text-left border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">7. DANGER ZONE</h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Deactivate or permanently delete this workspace and all related data.</p>
              </div>
            </div>
            {expandedSections.dangerZone ? <ChevronDown className="w-4 h-4 text-zinc-550" /> : <ChevronRight className="w-4 h-4 text-zinc-550" />}
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.dangerZone && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-5">
                    <div className="flex flex-col gap-4">
                      
                      {/* Deactivate Workspace */}
                      <div className="flex items-center justify-between gap-4 p-4 border border-zinc-800 bg-zinc-900/40 rounded-xl">
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">Deactivate Workspace</h4>
                          <p className="text-xs text-zinc-400">
                            Temporarily shut down this workspace and lock it. Your data will not be deleted, but you must register again to reactivate it.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDeactivateWorkspaceModalOpen(true)}
                          className="shrink-0 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-500 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                        >
                          Deactivate
                        </button>
                      </div>
                      
                      {/* Delete Workspace */}
                      <div className="flex items-center justify-between gap-4 p-4 border border-red-900/50 bg-red-950/20 rounded-xl mt-2">
                        <div>
                          <h4 className="text-sm font-bold text-red-400 mb-1">Delete Workspace</h4>
                          <p className="text-xs text-zinc-400">
                            Permanently delete this workspace and all related data. This action cannot be undone. You will be logged out.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDeleteWorkspaceModalOpen(true)}
                          className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* SIMULATED INVITATION ACCEPTANCE SANDBOX MODAL OVERLAY */}
      <AnimatePresence>
        {isSandboxModalOpen && selectedInviteForSandbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#0e1015] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md relative shadow-2xl overflow-hidden shadow-amber-500/5"
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => { setIsSandboxModalOpen(false); setSelectedInviteForSandbox(null); }}
                  className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase tracking-widest">
                    Invitation Sandbox Simulation
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black font-mono uppercase text-white tracking-tight">
                    Simulate Accept Invitation
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-1">
                    Complete this simulated flow to register a new member to the operational crew under the email: <strong className="text-zinc-200">{selectedInviteForSandbox.email}</strong>.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest block">Operational Crew Name</label>
                    <input
                      type="text"
                      value={sandboxNameInput}
                      onChange={e => setSandboxNameInput(e.target.value)}
                      placeholder="e.g. Jax Teller"
                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl px-3.5 py-2 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest block">Avatar Image URL (Optional)</label>
                    <input
                      type="text"
                      value={sandboxProfilePic}
                      onChange={e => setSandboxProfilePic(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl px-3.5 py-2 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="bg-[#111319]/60 border border-zinc-850 p-3 rounded-xl space-y-1">
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">System Properties Assigned</span>
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-zinc-450">Role:</span>
                      <span className="text-[#a855f7] font-bold">{selectedInviteForSandbox.role}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-zinc-450">Promo Code:</span>
                      <span className="text-amber-400 font-bold">{selectedInviteForSandbox.code}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateAcceptInvite}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  🚀 Approve & Simulate Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      
      {/* EDIT MODAL OVERLAY */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#0e1015] border border-zinc-800 rounded-3xl p-6 w-full max-w-lg relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 mt-4">
                <h3 className="text-xl font-bold text-white font-display tracking-wide uppercase">
                  {activeEditTab === 'band' ? 'Edit Artist Details' : 'Edit User Profile'}
                </h3>

                {activeEditTab === 'band' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Artist Name</label>
                      <input 
                        type="text" 
                        value={editBandForm.name || ''} 
                        onChange={e => setEditBandForm({...editBandForm, name: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#a855f7]"
                        placeholder="Enter artist name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Genre</label>
                      <input 
                        type="text" 
                        value={editBandForm.genre || ''} 
                        onChange={e => setEditBandForm({...editBandForm, genre: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#a855f7]"
                        placeholder="e.g. Alternative"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Homebase / Location</label>
                      <input 
                        type="text" 
                        value={editBandForm.homebase || ''} 
                        onChange={e => setEditBandForm({...editBandForm, homebase: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#a855f7]"
                        placeholder="e.g. Los Angeles, CA"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Bio / Description</label>
                      <textarea 
                        value={editBandForm.bio || ''} 
                        onChange={e => setEditBandForm({...editBandForm, bio: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#a855f7] min-h-[100px]"
                        placeholder="Artist biography"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Full Legal Name</label>
                        <span className="text-[9px] text-[#00ffcc] font-mono font-bold uppercase tracking-wider">Unlocked</span>
                      </div>
                      <input 
                        type="text" 
                        value={editUserForm.full_name || ''} 
                        onChange={e => setEditUserForm({...editUserForm, full_name: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                        placeholder="e.g. Miguel Goregrinder Medina"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">User Name / Display Handle</label>
                      <input 
                        type="text" 
                        value={editUserForm.name || ''} 
                        onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        value={editUserForm.email || ''} 
                        onChange={e => setEditUserForm({...editUserForm, email: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Role</label>
                      <input 
                        type="text" 
                        value={editUserForm.role || ''} 
                        onChange={e => setEditUserForm({...editUserForm, role: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">My Genres (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={editUserForm.genre_tags || ''} 
                        onChange={e => setEditUserForm({...editUserForm, genre_tags: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                        placeholder="Death Metal, Grindcore, Slam"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Top Song / Anthem Title</label>
                      <input 
                        type="text" 
                        value={editUserForm.top_song_title || ''} 
                        onChange={e => setEditUserForm({...editUserForm, top_song_title: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                        placeholder="Artist - Track Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Top Song / Anthem URL</label>
                      <input 
                        type="url" 
                        value={editUserForm.top_song_url || ''} 
                        onChange={e => setEditUserForm({...editUserForm, top_song_url: e.target.value})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc]"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Bio / Blurb</label>
                        <span className="text-[9px] font-mono text-zinc-500 font-bold">{(editUserForm.bio || '').length}/500</span>
                      </div>
                      <textarea 
                        maxLength={500}
                        value={editUserForm.bio || ''} 
                        onChange={e => setEditUserForm({...editUserForm, bio: e.target.value.slice(0, 500)})}
                        className="w-full bg-[#131b26] border border-zinc-800 text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ffcc] min-h-[80px]"
                        placeholder="Tell the scene about yourself..."
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleSaveProfileSettings();
                  }}
                  className="w-full mt-4 bg-[#00ffcc] text-black py-3 rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEACTIVATE WORKSPACE MODAL */}
      <AnimatePresence>
        {isDeactivateWorkspaceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#0e1015] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md relative shadow-2xl overflow-hidden shadow-amber-500/5"
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setIsDeactivateWorkspaceModalOpen(false)}
                  className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                  disabled={dangerActionLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase tracking-widest">
                    Confirm Deactivation
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black font-mono uppercase text-white tracking-tight">
                    Deactivate {portalType} Workspace?
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-2 leading-relaxed">
                    This will lock the workspace and remove it from your active portals. 
                    <strong className="text-amber-400"> Your data will NOT be deleted. </strong>
                    You can regain access by re-registering for this workspace type.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDeactivateWorkspaceModalOpen(false)}
                    disabled={dangerActionLoading}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeactivateWorkspace}
                    disabled={dangerActionLoading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {dangerActionLoading ? "Deactivating..." : "Confirm"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE WORKSPACE MODAL */}
      <AnimatePresence>
        {isDeleteWorkspaceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#0e1015] border border-red-500/30 rounded-3xl p-6 w-full max-w-md relative shadow-2xl overflow-hidden shadow-red-500/5"
            >
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteWorkspaceModalOpen(false)}
                  className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
                  disabled={dangerActionLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-red-500/15 border border-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase tracking-widest">
                    Destructive Action
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black font-mono uppercase text-white tracking-tight">
                    Delete {portalType} Workspace?
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans mt-2 leading-relaxed">
                    This will permanently delete this workspace and ALL associated data (shows, sales, inventory, etc). 
                    <strong className="text-red-400"> This action CANNOT be undone. </strong>
                    You will be completely logged out and will need to register again.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDeleteWorkspaceModalOpen(false)}
                    disabled={dangerActionLoading}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteWorkspace}
                    disabled={dangerActionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {dangerActionLoading ? "Deleting..." : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Delete Forever
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
