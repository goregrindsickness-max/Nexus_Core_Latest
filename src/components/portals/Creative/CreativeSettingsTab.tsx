import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { 
  Users, Shield, Zap, X, Trash2, Mail, CheckCircle2, Clock, 
  Globe, Upload, Disc, CreditCard, Banknote, ChevronDown, ChevronUp, ChevronRight, Lock, Settings,
  Star, MessageSquare, MessageCircle, HelpCircle, Palette, Briefcase, Heart, Code, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import SettingsView from '../../SettingsView';
import HelpDeskView from '../../HelpDeskView';
import TermsOfServiceView from '../../TermsOfServiceView';
import StripeConnectPayoutSection from '../../StripeConnectPayoutSection';
import { getSupabase, uploadBase64ToStorage, sanitizeCreativePayload, formatCreativePayload, extractGlobalProfilePayload, executeWithSchemaResilience, autoSyncCreativeProfile } from '../../../supabase';
import { COUNTRIES, US_STATES } from '../../../constants/location';
import { CREATIVE_CORE_SKILLS, GENRE_CLUSTERS } from '../../auth/authConstants';

// Helper to compress uploaded images to avoid LocalStorage quota overflow
function compressImage(base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
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

// Creative Billing Matrix
const CREATIVE_BILLING_MATRIX = {
  trialPeriodDays: 30,
  tiers: {
    freelance_specialist: {
      name: 'Freelance Specialist',
      monthlyPrice: 19.99,
      annualMonthlyPrice: 14.99,
      rosterArtistLimit: 1,
      adminSeatLimit: 1,
      features: ['portfolio_hosting', 'booking_pitch_dispatch', 'basic_accounting_metrics']
    },
    crew_syndicate: {
      name: 'Production Crew Syndicate',
      monthlyPrice: 49.99,
      annualMonthlyPrice: 39.99,
      rosterArtistLimit: 3,
      adminSeatLimit: 5,
      features: ['multi_seat_management', 'custom_contracts_invoices', 'team_calendar_sync', 'advanced_routing_filters']
    },
    sovereign_creative: {
      name: 'Sovereign Creative Group',
      monthlyPrice: 119.99,
      annualMonthlyPrice: 89.99,
      rosterArtistLimit: 99999,
      adminSeatLimit: 99999,
      features: ['priority_api_placement', 'custom_legal_templates', 'automated_splits_distribution', 'high_res_bulk_exports']
    }
  }
};

interface CreativeSettingsTabProps {
  userProfile: UserProfile;
  setUserProfile?: any;
  activeClearanceLevel?: number;
  showLocalToast?: (msg: string) => void;
  setLabelOAuthProcessor?: (proc: { id: 'stripe' | 'paypal'; name: string } | null) => void;
  setLabelOAuthStep?: (step: number) => void;
  onLogout?: () => void;
}

export default function CreativeSettingsTab({ 
  userProfile, 
  setUserProfile: externalSetUserProfile, 
  activeClearanceLevel = 5, 
  showLocalToast = (msg) => console.log(msg),
  setLabelOAuthProcessor: externalSetLabelOAuthProcessor,
  setLabelOAuthStep: externalSetLabelOAuthStep,
  onLogout
}: CreativeSettingsTabProps) {
  
  const setUserProfile = (updatedProfile: any) => {
    if (externalSetUserProfile) {
      externalSetUserProfile(updatedProfile);
    }
  };

  const setLabelOAuthProcessor = (proc: { id: 'stripe' | 'paypal'; name: string } | null) => {
    if (externalSetLabelOAuthProcessor) {
      externalSetLabelOAuthProcessor(proc);
    }
  };

  const setLabelOAuthStep = (step: number) => {
    if (externalSetLabelOAuthStep) {
      externalSetLabelOAuthStep(step);
    }
  };

  // Accordion expansion state
  const [expandedSection, setExpandedSection] = useState<string | null>('profile_ab');

  // Local states for System Preferences (SettingsView props)
  const [localShows, setLocalShows] = useState<any[]>([]);
  const [localInventory, setLocalInventory] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localVenues, setLocalVenues] = useState<any[]>([]);
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  const [localBands, setLocalBands] = useState<any[]>([]);
  const [localActiveBand, setLocalActiveBand] = useState<any>({ id: 'b1', name: 'Creative Active Group' });
  const [localActiveBandId, setLocalActiveBandId] = useState('b1');
  const [isBandModalOpen, setIsBandModalOpen] = useState(false);

  // Local states for Review / Experience feedback & Creative responses
  const [reviewLeft, setReviewLeft] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerGroup, setReviewerGroup] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [userReviews, setUserReviews] = useState<any[]>(() => {
    const existing = localStorage.getItem('nexus_core_user_reviews');
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'rev-sample-1',
        name: 'Vera Collins',
        group: 'Relapse Records / Devourment',
        score: 5,
        text: 'Incredible turnaround on the vinyl gatefold artwork. Highest print fidelity we have seen this season.',
        date: '2026-07-14',
        creativeResponse: 'Honored to work with the Relapse team on this release!'
      },
      {
        id: 'rev-sample-2',
        name: 'Darius Vance',
        group: 'North American Tour Ops',
        score: 5,
        text: 'Handled our 18-date tour screenprinting logistics without a single hitch. Total professional.',
        date: '2026-08-02'
      }
    ];
  });

  // Creative Profile states linked directly to metadata
  const [businessName, setBusinessName] = useState(userProfile.creative_metadata?.business_name || '');
  const [city, setCity] = useState(userProfile.city || userProfile.creative_metadata?.city || '');
  const [stateProvince, setStateProvince] = useState(userProfile.state_province || userProfile.creative_metadata?.state_province || '');
  const [country, setCountry] = useState(userProfile.country || userProfile.creative_metadata?.country || 'USA');
  const [portfolioLink, setPortfolioLink] = useState(userProfile.creative_metadata?.portfolio_link || '');
  const [bio, setBio] = useState(userProfile.creative_metadata?.bio || '');
  const [dayRate, setDayRate] = useState(userProfile.creative_metadata?.day_rate || '350');
  const [pricingNotes, setPricingNotes] = useState(userProfile.creative_metadata?.pricing_notes || '');
  const [primaryCategory, setPrimaryCategory] = useState(userProfile.creative_metadata?.primary_category || 'GRAPHIC_DESIGN');
  const [primarySkill, setPrimarySkill] = useState(userProfile.creative_metadata?.primary_skill || 'MERCH_DESIGN');
  const [secondaryCategory, setSecondaryCategory] = useState(userProfile.creative_metadata?.secondary_category || '');
  const [secondarySkill, setSecondarySkill] = useState(userProfile.creative_metadata?.secondary_skill || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(userProfile.creative_metadata?.availability_status || 'Available');
  const [quickBroadcast, setQuickBroadcast] = useState(userProfile.creative_metadata?.live_update_ticker || userProfile.creative_metadata?.quick_broadcast || userProfile.creative_metadata?.broadcast_bulletin || 'Ready for assignments.');
  const [rateType, setRateType] = useState<'day' | 'project'>('day');

  // Additional schema-aligned states: Socials, Legal, Tax
  const [instagram, setInstagram] = useState(userProfile.creative_metadata?.instagram || '');
  const [artstation, setArtstation] = useState(userProfile.creative_metadata?.artstation || '');
  const [legalFullName, setLegalFullName] = useState(userProfile.creative_metadata?.legal_full_name || userProfile.creative_metadata?.legal_name || userProfile.full_name || '');
  const [legalEntityType, setLegalEntityType] = useState(userProfile.creative_metadata?.legal_entity_type || 'sole_proprietorship');
  const [taxId, setTaxId] = useState(userProfile.creative_metadata?.tax_id || '');

  // Subscription states
  const [currentPlan, setCurrentPlan] = useState<'freelance_specialist' | 'crew_syndicate' | 'sovereign_creative'>('crew_syndicate');
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Team states
  const [teamMembers, setTeamMembers] = useState(() => {
    if (userProfile.email || userProfile.name) {
      return [{ id: userProfile.id || 'u1', name: userProfile.name || 'Creative Leader', email: userProfile.email || '', role: userProfile.role || 'CHIEF OPERATOR / CREATIVE' }];
    }
    return [];
  });

  // Gear & specialty local states
  const [gearTags, setGearTags] = useState<string[]>(Array.isArray(userProfile.creative_metadata?.gear_tags) ? userProfile.creative_metadata.gear_tags : (userProfile.creative_metadata?.gear_tags ? [userProfile.creative_metadata.gear_tags as string] : ['Sony Alpha 7S III', 'Adobe Creative Cloud', 'DJI Ronin SC2']));
  const [newGearTag, setNewGearTag] = useState('');
  const [genreTags, setGenreTags] = useState<string[]>(Array.isArray(userProfile.creative_metadata?.genre_tags) ? userProfile.creative_metadata.genre_tags : (Array.isArray(userProfile.creative_metadata?.genres) ? userProfile.creative_metadata.genres : (userProfile.creative_metadata?.genre_tags ? [userProfile.creative_metadata.genre_tags as string] : ['Grindcore', 'Darkwave', 'Hardcore'])));
  const [newGenreInput, setNewGenreInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(Array.isArray(userProfile.creative_metadata?.selected_skills) ? userProfile.creative_metadata.selected_skills : (Array.isArray(userProfile.creative_metadata?.skills) ? userProfile.creative_metadata.skills : (userProfile.creative_metadata?.selected_skills ? [userProfile.creative_metadata.selected_skills as string] : ['Flyer Art', 'Logo Design', 'Merch Prepress'])));
  const [newSkillInput, setNewSkillInput] = useState('');

  // Payout Config State from V1
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'paypal' | 'none'>(
    (userProfile?.creative_metadata?.payout_method as 'stripe' | 'paypal' | 'none') || 'none'
  );
  const [stripeAccountId, setStripeAccountId] = useState(userProfile?.creative_metadata?.stripe_account_id || '');
  const [paypalEmail, setPaypalEmail] = useState(userProfile?.creative_metadata?.paypal_email || '');
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [isSuccessfullyConnected, setIsSuccessfullyConnected] = useState<boolean>(() => {
    return (userProfile?.creative_metadata?.stripe_account_id || '').startsWith('acct_');
  });

  // Sync state with userProfile
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      
      if (event.data?.type === 'PAYPAL_AUTH_SUCCESS') {
        const email = event.data.email;
        setPaypalEmail(email);
        setPayoutMethod('paypal');
        setIsConnectingPaypal(false);
        handleSaveProfile({
          paypal_email: email,
          payout_method: 'paypal'
        });
        showLocalToast('✓ PayPal Account successfully connected via secure OAuth!');
      }
    };
    
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  useEffect(() => {
    async function loadCreativeProfileData() {
      const supabase = getSupabase();
      if (!supabase || !userProfile?.id) return;
      try {
        const upAny = userProfile as any;
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
          if (creativeRow.business_name || creativeRow.creative_name || creativeRow.name) setBusinessName(creativeRow.business_name || creativeRow.creative_name || creativeRow.name || '');
          if (creativeRow.city) setCity(creativeRow.city);
          if (creativeRow.state_province) setStateProvince(creativeRow.state_province);
          if (creativeRow.country) setCountry(creativeRow.country);
          if (creativeRow.portfolio_link || creativeRow.website) setPortfolioLink(creativeRow.portfolio_link || creativeRow.website);
          if (creativeRow.biography || creativeRow.bio) setBio(creativeRow.biography || creativeRow.bio);
          if (creativeRow.day_rate || creativeRow.base_rate_value) setDayRate(String(creativeRow.day_rate || creativeRow.base_rate_value));
          if (creativeRow.pricing_notes) setPricingNotes(creativeRow.pricing_notes);
          if (creativeRow.primary_category || creativeRow.category) setPrimaryCategory(creativeRow.primary_category || creativeRow.category);
          if (creativeRow.primary_skill || (Array.isArray(creativeRow.skills) && creativeRow.skills[0])) setPrimarySkill(creativeRow.primary_skill || creativeRow.skills[0]);
          if (creativeRow.secondary_category) setSecondaryCategory(creativeRow.secondary_category);
          if (creativeRow.secondary_skill || (Array.isArray(creativeRow.skills) && creativeRow.skills[1])) setSecondarySkill(creativeRow.secondary_skill || creativeRow.skills[1]);
          if (creativeRow.availability_status) setAvailabilityStatus(creativeRow.availability_status);
          if (creativeRow.live_update_ticker || creativeRow.quick_broadcast || creativeRow.broadcast_bulletin) setQuickBroadcast(creativeRow.live_update_ticker || creativeRow.quick_broadcast || creativeRow.broadcast_bulletin);
          if (Array.isArray(creativeRow.gear) && creativeRow.gear.length > 0) setGearTags(creativeRow.gear);
          if (Array.isArray(creativeRow.genres) && creativeRow.genres.length > 0) setGenreTags(creativeRow.genres);
          if (Array.isArray(creativeRow.skills) && creativeRow.skills.length > 0) setSelectedSkills(creativeRow.skills);
          if (creativeRow.instagram) setInstagram(creativeRow.instagram);
          if (creativeRow.artstation) setArtstation(creativeRow.artstation);
          if (creativeRow.legal_full_name || creativeRow.legal_name) setLegalFullName(creativeRow.legal_full_name || creativeRow.legal_name);
          if (creativeRow.legal_entity_type) setLegalEntityType(creativeRow.legal_entity_type);
          if (creativeRow.tax_id) setTaxId(creativeRow.tax_id);
          if (creativeRow.payout_method) setPayoutMethod(creativeRow.payout_method);
          if (creativeRow.stripe_account_id) setStripeAccountId(creativeRow.stripe_account_id);
          if (creativeRow.paypal_email) setPaypalEmail(creativeRow.paypal_email);

          // Keep userProfile state in sync with loaded creative avatar & banner from Supabase
          setUserProfile((prev: any) => ({
            ...prev,
            creative_avatar: creativeRow.avatar_url || prev?.creative_avatar || null,
            creative_banner: creativeRow.banner_url || prev?.creative_banner || null,
            creative_name: creativeRow.business_name || creativeRow.name || prev?.creative_name,
            creative_id: creativeRow.id || prev?.creative_id
          }));
        } else if (userProfile.creative_metadata) {
          setBusinessName(userProfile.creative_metadata.business_name || '');
          if (userProfile.creative_metadata.city || userProfile.city) setCity(userProfile.creative_metadata.city || userProfile.city || '');
          if (userProfile.creative_metadata.state_province || userProfile.state_province) setStateProvince(userProfile.creative_metadata.state_province || userProfile.state_province || '');
          if (userProfile.creative_metadata.country || userProfile.country) setCountry(userProfile.creative_metadata.country || userProfile.country || 'USA');
          setPortfolioLink(userProfile.creative_metadata.portfolio_link || '');
          setBio(userProfile.creative_metadata.bio || '');
          setDayRate(String(userProfile.creative_metadata.day_rate || '350'));
          setPricingNotes(userProfile.creative_metadata.pricing_notes || '');
          setPrimaryCategory(userProfile.creative_metadata.primary_category || 'GRAPHIC_DESIGN');
          setPrimarySkill(userProfile.creative_metadata.primary_skill || 'MERCH_DESIGN');
          setSecondaryCategory(userProfile.creative_metadata.secondary_category || '');
          setSecondarySkill(userProfile.creative_metadata.secondary_skill || '');
          setAvailabilityStatus(userProfile.creative_metadata.availability_status || 'Available');
          setQuickBroadcast(userProfile.creative_metadata.live_update_ticker || userProfile.creative_metadata.quick_broadcast || userProfile.creative_metadata.broadcast_bulletin || 'Ready for assignments.');
          if (userProfile.creative_metadata.instagram) setInstagram(userProfile.creative_metadata.instagram);
          if (userProfile.creative_metadata.artstation) setArtstation(userProfile.creative_metadata.artstation);
          if (userProfile.creative_metadata.legal_full_name || userProfile.creative_metadata.legal_name) setLegalFullName(userProfile.creative_metadata.legal_full_name || userProfile.creative_metadata.legal_name);
          if (userProfile.creative_metadata.legal_entity_type) setLegalEntityType(userProfile.creative_metadata.legal_entity_type);
          if (userProfile.creative_metadata.tax_id) setTaxId(userProfile.creative_metadata.tax_id);
          if (Array.isArray(userProfile.creative_metadata.gear_tags)) setGearTags(userProfile.creative_metadata.gear_tags);
          if (Array.isArray(userProfile.creative_metadata.genre_tags) || Array.isArray(userProfile.creative_metadata.genres)) setGenreTags(userProfile.creative_metadata.genre_tags || userProfile.creative_metadata.genres);
          if (Array.isArray(userProfile.creative_metadata.selected_skills) || Array.isArray(userProfile.creative_metadata.skills)) setSelectedSkills(userProfile.creative_metadata.selected_skills || userProfile.creative_metadata.skills);
        }
      } catch (err) {
        console.warn('Creative settings load error:', err);
      }
    }

    loadCreativeProfileData();
  }, [userProfile?.id, (userProfile as any)?.creative_id]);

  const PLAN_LIMITS: Record<string, number> = {
    'freelance_specialist': CREATIVE_BILLING_MATRIX.tiers.freelance_specialist.adminSeatLimit,
    'crew_syndicate': CREATIVE_BILLING_MATRIX.tiers.crew_syndicate.adminSeatLimit,
    'sovereign_creative': CREATIVE_BILLING_MATRIX.tiers.sovereign_creative.adminSeatLimit
  };

  const activeTierId = userProfile?.sub_tier || currentPlan;
  const currentLimit = PLAN_LIMITS[activeTierId] || CREATIVE_BILLING_MATRIX.tiers.freelance_specialist.adminSeatLimit;
  const occupiedSeats = teamMembers.length;
  const isLimitReached = occupiedSeats >= currentLimit;

  // Invite handling
  const handleInvite = () => {
    if (isLimitReached) return;
    if (!inviteEmail.trim()) return;
    
    const newMember = {
      id: `u${Date.now()}`,
      name: 'Pending Collaborator',
      email: inviteEmail,
      role: 'CREATIVE / CREW'
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    showLocalToast(`Invitation sent to ${inviteEmail}.`);
  };

  const handleRemove = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showLocalToast(`Collaborator removed from creative group.`);
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    showLocalToast(`Updated member role to ${newRole}.`);
  };

  // Image Uploads
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          try {
            const compressed = await compressImage(event.target.result, 800, 800, 0.88);
            const publicUrl = await uploadBase64ToStorage(compressed, 'avatars', userProfile.id, 'creative-avatar');
            if (publicUrl) {
              setUserProfile((prev: any) => ({ ...prev, creative_avatar: publicUrl }));
              // Update only avatar_url on creatives row
              const supabase = getSupabase();
              if (supabase && userProfile?.id) {
                const creativeIdToUse = (userProfile as any).creative_id || (userProfile as any).registered_creative_id || userProfile.id;
                await supabase.from('creatives').update({ avatar_url: publicUrl }).or(`id.eq.${creativeIdToUse},creator_id.eq.${userProfile.id}`);
              }
              showLocalToast("Creative logo updated successfully.");
            }
          } catch (err) {
            console.error("Creative logo upload failed:", err);
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLocalCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          try {
            const compressed = await compressImage(event.target.result, 1920, 1080, 0.88);
            const publicUrl = await uploadBase64ToStorage(compressed, 'bannersv2', userProfile.id, 'creative-banner');
            if (publicUrl) {
              setUserProfile((prev: any) => ({ ...prev, creative_banner: publicUrl }));
              // Update only banner_url on creatives row
              const supabase = getSupabase();
              if (supabase && userProfile?.id) {
                const creativeIdToUse = (userProfile as any).creative_id || (userProfile as any).registered_creative_id || userProfile.id;
                await supabase.from('creatives').update({ banner_url: publicUrl }).or(`id.eq.${creativeIdToUse},creator_id.eq.${userProfile.id}`);
              }
              showLocalToast("Creative cover banner updated successfully.");
            }
          } catch (err) {
            console.error("Creative cover upload failed:", err);
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Persist Profile changes helper
  const handleSaveProfile = async (overrides?: Partial<{
    payout_method: 'stripe' | 'paypal' | 'none';
    stripe_account_id: string;
    paypal_email: string;
  }>) => {
    handleSaveCreativeProfile({
      payout_method: overrides?.payout_method !== undefined ? overrides.payout_method : payoutMethod,
      stripe_account_id: overrides?.stripe_account_id !== undefined ? overrides.stripe_account_id : stripeAccountId,
      paypal_email: overrides?.paypal_email !== undefined ? overrides.paypal_email.trim() : paypalEmail.trim()
    });
  };

  const handleSaveCreativeProfile = async (overrides?: any) => {
    const updatedBizName = overrides?.business_name !== undefined ? overrides.business_name : businessName;
    const updatedCity = overrides?.city !== undefined ? overrides.city : city;
    const updatedState = overrides?.state_province !== undefined ? overrides.state_province : stateProvince;
    const updatedCountry = overrides?.country !== undefined ? overrides.country : country;
    const updatedLink = overrides?.portfolio_link !== undefined ? overrides.portfolio_link : portfolioLink;
    const updatedBio = overrides?.bio !== undefined ? overrides.bio : bio;
    const updatedRate = String(overrides?.day_rate !== undefined ? overrides.day_rate : dayRate);
    const updatedNotes = overrides?.pricing_notes !== undefined ? overrides.pricing_notes : pricingNotes;
    const updatedCat = overrides?.primary_category !== undefined ? overrides.primary_category : primaryCategory;
    const updatedSkill = overrides?.primary_skill !== undefined ? overrides.primary_skill : primarySkill;
    const updatedSecCat = overrides?.secondary_category !== undefined ? overrides.secondary_category : secondaryCategory;
    const updatedSecSkill = overrides?.secondary_skill !== undefined ? overrides.secondary_skill : secondarySkill;
    const updatedAvail = overrides?.availability_status !== undefined ? overrides.availability_status : availabilityStatus;
    const updatedBcast = overrides?.live_update_ticker !== undefined ? overrides.live_update_ticker : (overrides?.quick_broadcast !== undefined ? overrides.quick_broadcast : quickBroadcast);
    const updatedGear = overrides?.gear_tags !== undefined ? overrides.gear_tags : (overrides?.gear !== undefined ? overrides.gear : gearTags);
    const updatedGenres = overrides?.genre_tags !== undefined ? overrides.genre_tags : (overrides?.genres !== undefined ? overrides.genres : genreTags);
    const updatedSkills = overrides?.selected_skills !== undefined ? overrides.selected_skills : (overrides?.skills !== undefined ? overrides.skills : selectedSkills);
    const updatedInstagram = overrides?.instagram !== undefined ? overrides.instagram : instagram;
    const updatedArtstation = overrides?.artstation !== undefined ? overrides.artstation : artstation;
    const updatedLegalFullName = overrides?.legal_full_name !== undefined ? overrides.legal_full_name : (overrides?.legal_name !== undefined ? overrides.legal_name : legalFullName);
    const updatedLegalEntityType = overrides?.legal_entity_type !== undefined ? overrides.legal_entity_type : legalEntityType;
    const updatedTaxId = overrides?.tax_id !== undefined ? overrides.tax_id : taxId;
    const updatedPayout = overrides?.payout_method !== undefined ? overrides.payout_method : payoutMethod;
    const updatedStripe = overrides?.stripe_account_id !== undefined ? overrides.stripe_account_id : stripeAccountId;
    const updatedPaypal = overrides?.paypal_email !== undefined ? overrides.paypal_email : paypalEmail;

    const creativeIdToUse = (userProfile as any).creative_id || (userProfile as any).registered_creative_id || userProfile.id;

    setUserProfile((prev: any) => ({
      ...prev,
      creative_id: creativeIdToUse,
      creative_name: updatedBizName || prev.name,
      creative_avatar: prev.creative_avatar || null,
      creative_banner: prev.creative_banner || null,
      creative_metadata: {
        ...(prev.creative_metadata || {}),
        business_name: updatedBizName,
        city: updatedCity,
        state_province: updatedState,
        country: updatedCountry,
        portfolio_link: updatedLink,
        bio: updatedBio,
        day_rate: updatedRate,
        pricing_notes: updatedNotes,
        primary_category: updatedCat,
        primary_skill: updatedSkill,
        secondary_category: updatedSecCat,
        secondary_skill: updatedSecSkill,
        availability_status: updatedAvail,
        live_update_ticker: updatedBcast,
        quick_broadcast: updatedBcast,
        broadcast_bulletin: updatedBcast,
        gear_tags: updatedGear,
        gear: updatedGear,
        genre_tags: updatedGenres,
        genres: updatedGenres,
        selected_skills: updatedSkills,
        skills: updatedSkills,
        instagram: updatedInstagram,
        artstation: updatedArtstation,
        legal_full_name: updatedLegalFullName,
        legal_name: updatedLegalFullName,
        legal_entity_type: updatedLegalEntityType,
        tax_id: updatedTaxId,
        payout_method: updatedPayout,
        stripe_account_id: updatedStripe,
        paypal_email: updatedPaypal,
      }
    }));

    const supabase = getSupabase();
    if (supabase && userProfile?.id) {
      try {
        // 1. Separate Creative Payload: Update/Upsert the creatives table separately with schema-aligned fields
        const creativePayload = formatCreativePayload({
          id: creativeIdToUse,
          creator_id: userProfile.id,
          user_id: userProfile.id,
          name: updatedBizName || (userProfile as any).creative_name || userProfile.name || 'Creative',
          business_name: updatedBizName || (userProfile as any).creative_name || userProfile.name || 'Creative',
          creative_name: updatedBizName || (userProfile as any).creative_name || userProfile.name || 'Creative',
          handle: (userProfile as any).creative_handle || userProfile.console_handle,
          creative_handle: (userProfile as any).creative_handle || userProfile.console_handle,
          avatar_url: (userProfile as any).creative_avatar || null,
          banner_url: (userProfile as any).creative_banner || null,
          creative_avatar: (userProfile as any).creative_avatar || null,
          creative_banner: (userProfile as any).creative_banner || null,
          primary_category: updatedCat || 'GRAPHIC_DESIGN',
          primary_skill: updatedSkill || 'MERCH_DESIGN',
          secondary_category: updatedSecCat || null,
          secondary_skill: updatedSecSkill || null,
          skills: updatedSkills,
          selected_skills: updatedSkills,
          primary_gear: updatedGear?.[0] || '',
          gear: updatedGear,
          gear_tags: updatedGear,
          genres: updatedGenres,
          genre_tags: updatedGenres,
          biography: updatedBio,
          bio: updatedBio,
          day_rate: updatedRate,
          base_rate_value: Number(updatedRate) || 0,
          rate_range: updatedRate ? `$${updatedRate} / Day` : '$350 / Day',
          pricing_notes: updatedNotes,
          city: updatedCity.trim() || undefined,
          state_province: updatedState.trim() || undefined,
          country: updatedCountry || 'USA',
          portfolio_link: updatedLink,
          website: updatedLink,
          instagram: updatedInstagram || null,
          artstation: updatedArtstation || null,
          legal_full_name: updatedLegalFullName || null,
          legal_name: updatedLegalFullName || null,
          legal_entity_type: updatedLegalEntityType || 'sole_proprietorship',
          tax_id: updatedTaxId || null,
          payout_method: updatedPayout,
          stripe_account_id: updatedStripe,
          paypal_email: updatedPaypal,
          availability_status: updatedAvail,
          live_update_ticker: updatedBcast,
          quick_broadcast: updatedBcast,
          broadcast_bulletin: updatedBcast,
        }, creativeIdToUse, userProfile.id);

        const { error: cErr } = await executeWithSchemaResilience(
          async (p) => supabase.from('creatives').upsert(p, { onConflict: 'id' }),
          creativePayload
        );
        if (cErr) {
          console.warn('Notice saving to creatives table:', cErr);
        } else {
          console.log('✓ Successfully saved creative profile directly to creatives table.');
        }

        // Brief delay before updating profiles table to ensure PostgREST foreign key cache registers the creative row
        await new Promise(r => setTimeout(r, 300));

        // 2. Separate Profile Payload: Update the profiles table with ONLY global user fields
        const globalProfilePayload = extractGlobalProfilePayload({
          id: userProfile.id,
          creative_id: creativeIdToUse,
          creative_name: updatedBizName || userProfile.name,
          city: updatedCity.trim() || userProfile.city,
          state_province: updatedState.trim() || userProfile.state_province,
          country: updatedCountry || userProfile.country || 'USA',
          registered_workspaces: Array.from(new Set([...(userProfile.registered_workspaces || []), 'creative'])),
          allowed_workspaces: Array.from(new Set([...(userProfile.allowed_workspaces || []), 'creative']))
        }, userProfile.id);

        await executeWithSchemaResilience(
          async (p) => supabase.from('profiles').update(p).eq('id', userProfile.id),
          globalProfilePayload
        );
      } catch (err) {
        console.error('Failed to update Supabase creative profile:', err);
      }
    }

    showLocalToast("✓ Creative portfolio specifications saved directly to cloud database.");
  };

  // Gear Management
  const addGearItem = () => {
    if (!newGearTag.trim()) return;
    if (gearTags.includes(newGearTag.trim())) {
      showLocalToast("Gear item already exists.");
      return;
    }
    const updated = [...gearTags, newGearTag.trim()];
    setGearTags(updated);
    setNewGearTag('');
    handleSaveCreativeProfile({ gear_tags: updated });
  };

  const removeGearItem = (item: string) => {
    const updated = gearTags.filter(x => x !== item);
    setGearTags(updated);
    handleSaveCreativeProfile({ gear_tags: updated });
  };

  // Genre specialties presets
  const toggleGenreTag = (genre: string) => {
    let updated;
    if (genreTags.includes(genre)) {
      updated = genreTags.filter(x => x !== genre);
    } else {
      updated = [...genreTags, genre];
    }
    setGenreTags(updated);
    handleSaveCreativeProfile({ genre_tags: updated });
  };

  const addCustomGenre = () => {
    if (!newGenreInput.trim()) return;
    if (genreTags.includes(newGenreInput.trim())) {
      showLocalToast("Genre already exists.");
      return;
    }
    const updated = [...genreTags, newGenreInput.trim()];
    setGenreTags(updated);
    setNewGenreInput('');
    handleSaveCreativeProfile({ genre_tags: updated });
  };

  // Skill specialties presets & custom skills
  const toggleSkillTag = (skill: string) => {
    let updated;
    if (selectedSkills.includes(skill)) {
      updated = selectedSkills.filter(x => x !== skill);
    } else {
      updated = [...selectedSkills, skill];
    }
    setSelectedSkills(updated);
    handleSaveCreativeProfile({ selected_skills: updated });
  };

  const addCustomSkill = () => {
    if (!newSkillInput.trim()) return;
    if (selectedSkills.includes(newSkillInput.trim())) {
      showLocalToast("Skill already exists.");
      return;
    }
    const updated = [...selectedSkills, newSkillInput.trim()];
    setSelectedSkills(updated);
    setNewSkillInput('');
    handleSaveCreativeProfile({ selected_skills: updated });
  };

  const removeSkillTag = (skill: string) => {
    const updated = selectedSkills.filter(x => x !== skill);
    setSelectedSkills(updated);
    handleSaveCreativeProfile({ selected_skills: updated });
  };

  // Review submission
  const submitReview = () => {
    if (!reviewText.trim()) return;
    const newRev = {
      id: `rev-${Date.now()}`,
      name: reviewerName || 'Anonymous Client',
      group: reviewerGroup || 'Independent Promoter',
      score: reviewScore,
      text: reviewText,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedReviews = [newRev, ...userReviews];
    setUserReviews(updatedReviews);
    localStorage.setItem('nexus_core_user_reviews', JSON.stringify(updatedReviews));
    setReviewText('');
    setReviewerName('');
    setReviewerGroup('');
    setReviewLeft(true);
    showLocalToast("Thank you for sharing your experience. Review published to your portfolio!");
  };

  const deleteReview = (id: string) => {
    const updated = userReviews.filter(r => r.id !== id);
    setUserReviews(updated);
    localStorage.setItem('nexus_core_user_reviews', JSON.stringify(updated));
    showLocalToast("Review deleted.");
  };

  const handleSaveReviewResponse = (reviewId: string) => {
    if (!responseText.trim()) return;
    const updated = userReviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, creativeResponse: responseText.trim(), responseDate: new Date().toISOString().split('T')[0] };
      }
      return r;
    });
    setUserReviews(updated);
    localStorage.setItem('nexus_core_user_reviews', JSON.stringify(updated));
    setRespondingToId(null);
    setResponseText('');
    showLocalToast("✓ Response published to public client review.");
  };

  const handleDeleteReviewResponse = (reviewId: string) => {
    const updated = userReviews.map(r => {
      if (r.id === reviewId) {
        const { creativeResponse, responseDate, ...rest } = r;
        return rest;
      }
      return r;
    });
    setUserReviews(updated);
    localStorage.setItem('nexus_core_user_reviews', JSON.stringify(updated));
    showLocalToast("Response removed.");
  };

  const plans = [
    {
      id: 'freelance_specialist',
      title: CREATIVE_BILLING_MATRIX.tiers.freelance_specialist.name,
      price: `$${CREATIVE_BILLING_MATRIX.tiers.freelance_specialist.monthlyPrice} / MONTH`,
      details: `Includes 1 secure freelance workspace seat, 1 active placement profile, basic gig bidding tools, and essential portfolio analytics.`,
    },
    {
      id: 'crew_syndicate',
      title: CREATIVE_BILLING_MATRIX.tiers.crew_syndicate.name,
      price: `$${CREATIVE_BILLING_MATRIX.tiers.crew_syndicate.monthlyPrice} / MONTH`,
      details: `Includes up to ${CREATIVE_BILLING_MATRIX.tiers.crew_syndicate.adminSeatLimit} secure collaborative workspace seats, custom billing invoices & contracts, shared team calendar, and advanced filter routing.`,
    },
    {
      id: 'sovereign_creative',
      title: CREATIVE_BILLING_MATRIX.tiers.sovereign_creative.name,
      price: `$${CREATIVE_BILLING_MATRIX.tiers.sovereign_creative.monthlyPrice} / MONTH`,
      details: `Unlimited seats, unlimited placement profiles, automated co-op splits, custom legal templates, high-resolution bulk reports, and priority dispatch.`,
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16 px-4 max-w-5xl mx-auto">
      
      {/* HEADER CAPTION */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-fuchsia-500 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h2 className="text-sm font-black font-mono tracking-widest text-zinc-100 uppercase">
              CREATIVE PORTAL SETTINGS & CONTRACTS
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono">MANAGE CO-OP WORKSPACE, SPECIFICATIONS & MERCHANT CHANNELS</p>
          </div>
        </div>
        
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 hover:border-red-500 hover:text-red-400 text-zinc-400 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold transition-all cursor-pointer"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* PROFILE SETTINGS GROUP */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Creative Profile settings</h3>
        </div>

        <div className="space-y-3">
          {/* 1. ACCORDION TAB: Creative Profile & Media */}
          <V2ExpandableCard 
            theme="fuchsia" 
            title="Creative Profile & Portfolio Media" 
            isExpanded={expandedSection === 'profile_ab'} 
            onToggle={() => toggleSection('profile_ab')}
          >
            <div className="p-5 space-y-8 text-left">
              
              {/* SECTION A: MEDIA ASSETS */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-fuchsia-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse" />
                  Section A: Portfolio Media Assets
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Avatar / Logo */}
                  <div className="space-y-3 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Creative Studio Logo / Emblem</span>
                    <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                      {userProfile.creative_avatar ? (
                        <>
                          <img 
                            src={userProfile.creative_avatar} 
                            alt="Creative Logo" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserProfile((prev: any) => ({ ...prev, creative_avatar: '' }));
                              const supabase = getSupabase();
                              if (supabase && userProfile?.id) {
                                await supabase.from('profiles').update({ creative_avatar: null }).eq('id', userProfile.id);
                                const creativeIdToUse = (userProfile as any).creative_id || userProfile.id;
                                await supabase.from('creatives').update({ avatar_url: null }).eq('id', creativeIdToUse);
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove creative logo"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <Palette className="w-10 h-10 text-zinc-700 animate-pulse" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('creative-avatar-uploader-acc') as HTMLInputElement;
                        input?.click();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[10px] font-mono text-fuchsia-400 uppercase hover:brightness-110 transition-all cursor-pointer font-bold"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Creative Logo (PNG/JPG)
                    </button>
                    <input 
                      id="creative-avatar-uploader-acc"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLocalImageUpload} 
                    />
                  </div>

                  {/* Cover Picture / Banner */}
                  <div className="space-y-3 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Creative Portfolio Cover Banner</span>
                    <div className="relative group w-full h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                      {userProfile.creative_banner ? (
                        <>
                          <img 
                            src={userProfile.creative_banner} 
                            alt="Creative Cover" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserProfile((prev: any) => ({ ...prev, creative_banner: '' }));
                              const supabase = getSupabase();
                              if (supabase && userProfile?.id) {
                                await supabase.from('profiles').update({ creative_banner: null }).eq('id', userProfile.id);
                                const creativeIdToUse = (userProfile as any).creative_id || userProfile.id;
                                await supabase.from('creatives').update({ banner_url: null, cover_url: null }).eq('id', creativeIdToUse);
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove creative cover"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-zinc-750 gap-1">
                          <Disc className="w-8 h-8 opacity-30 animate-spin" style={{ animationDuration: '10s' }} />
                          <span className="text-[8px] font-mono">[ NO BANNER LOADED ]</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('creative-cover-uploader-acc') as HTMLInputElement;
                        input?.click();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[10px] font-mono text-fuchsia-400 uppercase hover:brightness-110 transition-all cursor-pointer font-bold"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Banner (Aspect 16:9)
                    </button>
                    <input 
                      id="creative-cover-uploader-acc"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLocalCoverImageUpload} 
                    />
                  </div>
                </div>
              </div>

              <hr className="border-zinc-900/60" />

              {/* SECTION B: IDENTITY & METADATA */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-fuchsia-400 font-bold border-b border-zinc-900 pb-2">
                  Section B: Studio Identity & Profile Variables
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Studio / Brand Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. OBITUARY DESIGNS CO"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Live Update Ticker</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                      value={quickBroadcast}
                      onChange={(e) => setQuickBroadcast(e.target.value)}
                      placeholder="e.g. Ready for commissions & tour assignments"
                    />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">City</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Portland"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">State / Province</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
                      >
                        <option value="">SELECT STATE...</option>
                        {US_STATES.map((st, idx) => (
                          <option key={`${st.code}-${idx}`} value={st.code}>{st.name.toUpperCase()} ({st.code})</option>
                        ))}
                        <option value="OUTSIDE_US">Outside US / Int'l</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Country</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        {COUNTRIES.map((c, cIdx) => (
                          <option key={`${c.code}-${cIdx}`} value={c.code}>{c.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Portfolio / Website Link URL</label>
                    <input
                      type="url"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      placeholder="e.g. https://behance.net/obituary"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Instagram Handle / Profile</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="e.g. @obituary_art or https://instagram.com/obituary_art"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">ArtStation / Behance Handle</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                      value={artstation}
                      onChange={(e) => setArtstation(e.target.value)}
                      placeholder="e.g. obituarydesigns"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Current Availability Status</label>
                    <select
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                      value={availabilityStatus}
                      onChange={(e) => setAvailabilityStatus(e.target.value)}
                    >
                      <option value="Available">🟢 Available for Bookings / Touring</option>
                      <option value="Booked">🟡 Limited Availability / Mostly Booked</option>
                      <option value="On Tour">🔵 Active on Tour / In Field</option>
                      <option value="Unavailable">🔴 Currently Unavailable / Hiatus</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Quick Broadcast / Live Bulletin</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs font-mono"
                      value={quickBroadcast}
                      onChange={(e) => setQuickBroadcast(e.target.value)}
                      placeholder="e.g. Available for West Coast Fall tour dates / Flyer commissions open"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Biography Tagline Summary</label>
                    <textarea
                      rows={2}
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs font-sans"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Give a brief summary of your creative background, tour experience, and subcultural specialties..."
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveCreativeProfile()}
                    className="bg-fuchsia-500 hover:bg-fuchsia-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                  >
                    Save Identity Specifications
                  </button>
                </div>
              </div>

              <hr className="border-zinc-900" />

              {/* SECTION C: SUBCULTURAL GENRES & CORE SKILLS */}
              <div className="space-y-6">
                {/* PRIMARY & SECONDARY SPECIALTIES */}
                <div className="space-y-4 font-mono">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest text-fuchsia-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse" />
                    Primary & Secondary Placements & Core Skills
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-400">Primary Placement Category</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={primaryCategory}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const defaultSkill = (CREATIVE_CORE_SKILLS[newCat] && CREATIVE_CORE_SKILLS[newCat][0]) || 'MERCH_DESIGN';
                          setPrimaryCategory(newCat);
                          setPrimarySkill(defaultSkill);
                          handleSaveCreativeProfile({ primary_category: newCat, primary_skill: defaultSkill });
                        }}
                      >
                        <option value="GRAPHIC_DESIGN">Graphic Design</option>
                        <option value="PHOTOGRAPHY">Photography</option>
                        <option value="VIDEO_PRODUCTION">Video Production</option>
                        <option value="AUDIO_ENGINEERING">Audio Engineering</option>
                        <option value="SESSION_MUSICIAN_TECHS">Session Musician / Stage Tech</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-400">Primary Core Skill</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={primarySkill}
                        onChange={(e) => {
                          setPrimarySkill(e.target.value);
                          handleSaveCreativeProfile({ primary_skill: e.target.value });
                        }}
                      >
                        {(CREATIVE_CORE_SKILLS[primaryCategory] || ['MERCH_DESIGN']).map((skill, idx) => (
                          <option key={`${skill}-${idx}`} value={skill}>
                            {skill.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-400">Secondary Specialty (Optional)</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={secondaryCategory}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const defaultSkill = newCat && CREATIVE_CORE_SKILLS[newCat] ? CREATIVE_CORE_SKILLS[newCat][0] : '';
                          setSecondaryCategory(newCat);
                          setSecondarySkill(defaultSkill);
                          handleSaveCreativeProfile({ secondary_category: newCat, secondary_skill: defaultSkill });
                        }}
                      >
                        <option value="">None Selected</option>
                        <option value="GRAPHIC_DESIGN">Graphic Design</option>
                        <option value="PHOTOGRAPHY">Photography</option>
                        <option value="VIDEO_PRODUCTION">Video Production</option>
                        <option value="AUDIO_ENGINEERING">Audio Engineering</option>
                        <option value="SESSION_MUSICIAN_TECHS">Session Musician / Stage Tech</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase text-zinc-400">Secondary Core Skill (Optional)</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs"
                        value={secondarySkill}
                        disabled={!secondaryCategory}
                        onChange={(e) => {
                          setSecondarySkill(e.target.value);
                          handleSaveCreativeProfile({ secondary_skill: e.target.value });
                        }}
                      >
                        <option value="">None Selected</option>
                        {secondaryCategory && (CREATIVE_CORE_SKILLS[secondaryCategory] || []).map((skill, idx) => (
                          <option key={`${skill}-${idx}`} value={skill}>
                            {skill.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* COMMUNITY GENRES (Using Registration Form Taxonomy) */}
                <div className="space-y-3 pt-2 font-mono">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest text-purple-400 font-bold border-b border-zinc-900 pb-2 block">
                    Subcultural Scene Affinity Presets (Taxonomy)
                  </span>
                  <p className="text-[10px] text-zinc-400 font-sans">Select which underground genre clusters fit your creative style best.</p>

                  <div className="space-y-3">
                    {GENRE_CLUSTERS.map((cluster, clusterIdx) => (
                      <div key={`creative-settings-cluster-${clusterIdx}-${cluster.name}`} className="space-y-1.5">
                        <span className="text-[8.5px] font-mono text-zinc-500 font-bold uppercase tracking-wider">{cluster.name}</span>
                        <div className="flex flex-wrap gap-1.5 font-mono">
                          {cluster.genres.map((genre, gIdx) => {
                            const selected = genreTags.includes(genre);
                            return (
                              <button
                                key={`creative-settings-cluster-${clusterIdx}-genre-${gIdx}-${genre}`}
                                type="button"
                                onClick={() => toggleGenreTag(genre)}
                                className={`px-2.5 py-1 border rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                  selected 
                                    ? 'bg-purple-950/40 border-purple-500 text-purple-300' 
                                    : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-400'
                                }`}
                              >
                                {selected ? '●' : '○'} {genre}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2 font-mono">
                    <input
                      type="text"
                      className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500 text-xs"
                      placeholder="Add custom musical subgenre affinity..."
                      value={newGenreInput}
                      onChange={(e) => setNewGenreInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomGenre()}
                    />
                    <button
                      type="button"
                      onClick={addCustomGenre}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Add Custom Genre
                    </button>
                  </div>
                </div>

                {/* CORE CREATIVE SKILLS & DELIVERABLES */}
                <div className="space-y-3 pt-2 border-t border-zinc-900/60 font-mono">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest text-fuchsia-400 font-bold border-b border-zinc-900 pb-2 block">
                    Core Creative Skills & Deliverables
                  </span>
                  <p className="text-[10px] text-zinc-400 font-sans">Tag specific services and deliverables you offer to bands, labels, and production teams.</p>

                  <div className="flex flex-wrap gap-2 pt-1 font-mono">
                    {[
                      'Flyer Art', 'Logo Design', 'Album Art', 'Merch Prepress', 'Screenprinting',
                      'Tour Photography', 'Music Video Production', 'Live Sound Engineering', 'Stage Lighting',
                      'Mix / Master', 'Guitar Tech', 'Drum Tech', 'Social Media Management'
                    ].map((skill, idx) => {
                      const selected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={`${skill}-${idx}`}
                          type="button"
                          onClick={() => toggleSkillTag(skill)}
                          className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                            selected 
                              ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-300' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-400'
                          }`}
                        >
                          {selected ? '●' : '○'} {skill}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Skills List */}
                  {selectedSkills.filter(s => ![
                    'Flyer Art', 'Logo Design', 'Album Art', 'Merch Prepress', 'Screenprinting',
                    'Tour Photography', 'Music Video Production', 'Live Sound Engineering', 'Stage Lighting',
                    'Mix / Master', 'Guitar Tech', 'Drum Tech', 'Social Media Management'
                  ].includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedSkills.filter(s => ![
                        'Flyer Art', 'Logo Design', 'Album Art', 'Merch Prepress', 'Screenprinting',
                        'Tour Photography', 'Music Video Production', 'Live Sound Engineering', 'Stage Lighting',
                        'Mix / Master', 'Guitar Tech', 'Drum Tech', 'Social Media Management'
                      ].includes(s)).map((customSkill, idx) => (
                        <div key={`${customSkill}-${idx}`} className="bg-fuchsia-950/30 border border-fuchsia-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-fuchsia-200 font-mono">
                          <span>⚡ {customSkill}</span>
                          <button 
                            type="button" 
                            onClick={() => removeSkillTag(customSkill)}
                            className="text-zinc-500 hover:text-red-400 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 font-mono">
                    <input
                      type="text"
                      className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500 text-xs"
                      placeholder="Add custom creative skill (e.g. 3D Stage Animation, Tape Mastering)..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Add Skill
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </V2ExpandableCard>

          {/* 2. HUB: Rates & Payouts */}
          <V2ExpandableCard 
            theme="fuchsia" 
            title="Rates & Payouts" 
            isExpanded={expandedSection === 'profile_d'} 
            onToggle={() => toggleSection('profile_d')}
          >
            <div className="p-5 space-y-8 text-left">
              {/* SUBSECTION A: RATES CONFIGURATION */}
              <div className="space-y-4 font-mono">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-fuchsia-400 block">Base Rate Matrix Configuration</span>
                  <p className="text-[10px] text-zinc-400 font-sans leading-normal">
                    Configure your standard pricing structures, invoicing preferences, and security authorization for processing agency co-op payouts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Standard Pricing Tier Format</label>
                    <select
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs uppercase"
                      value={rateType}
                      onChange={(e) => setRateType(e.target.value as any)}
                    >
                      <option value="day">Fixed Day Rate Basis</option>
                      <option value="project">Project / Retainer Basis</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Standard Base Rate ($ USD)</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs font-mono"
                      value={dayRate}
                      onChange={(e) => setDayRate(e.target.value)}
                      placeholder="e.g. 350"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Pricing Conditions & Expense Coverage Notes</label>
                    <textarea
                      rows={2}
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs font-sans leading-relaxed"
                      value={pricingNotes}
                      onChange={(e) => setPricingNotes(e.target.value)}
                      placeholder="e.g. Travel and hotel accommodations must be covered for gigs outside base location. Day rate includes standard post-production editing files."
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end font-mono">
                  <button
                    type="button"
                    onClick={() => handleSaveCreativeProfile()}
                    className="bg-fuchsia-500 hover:bg-fuchsia-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-fuchsia-500/10"
                  >
                    Save Rates Configuration
                  </button>
                </div>
              </div>

              <hr className="border-zinc-900" />

              {/* SUBSECTION B: FULFILLMENT GATEWAY CONFIGURATION */}
              <div className="space-y-6">
                <StripeConnectPayoutSection
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  triggerNotification={(msg) => showLocalToast(msg)}
                  showLocalToast={showLocalToast}
                  role="creative"
                  theme="purple"
                  clearanceLevel={5}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono">

                  {/* PayPal Merchant Node */}
                  <div className="p-4 bg-zinc-950/45 border border-zinc-900 rounded-xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">PayPal Processing Node</span>
                      <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-[#0070BA]" />
                        PAYPAL PAYOUTS
                      </h5>
                      {payoutMethod === 'paypal' && (
                        <span className="text-[9px] bg-[#0070BA]/20 text-[#0070BA] font-black uppercase px-1.5 py-0.5 rounded tracking-wide inline-block mt-1">
                          Active Method
                        </span>
                      )}
                    </div>

                    {paypalEmail ? (
                      <div className="space-y-2">
                        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2.5 flex items-center justify-between">
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] uppercase font-black text-emerald-400 tracking-wider">Active Address</span>
                            <span className="text-[10.5px] text-[#0070BA] font-mono font-bold truncate max-w-[150px]">{paypalEmail}</span>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {payoutMethod !== 'paypal' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPayoutMethod('paypal');
                                  handleSaveProfile({ payout_method: 'paypal' });
                                  showLocalToast('✓ Switched active payout method to PayPal.');
                                }}
                                className="text-[8.5px] bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold px-2 py-1 rounded border border-zinc-800 transition-colors cursor-pointer uppercase"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Are you sure you want to disconnect your PayPal email?')) {
                                  setPaypalEmail('');
                                  let nextMethod: 'stripe' | 'paypal' | 'none' = 'none';
                                  if (stripeAccountId && stripeAccountId.startsWith('acct_')) {
                                    nextMethod = 'stripe';
                                  }
                                  setPayoutMethod(nextMethod);
                                  handleSaveProfile({
                                    paypal_email: '',
                                    payout_method: nextMethod
                                  });
                                  showLocalToast('PayPal credentials removed.');
                                }
                              }}
                              className="text-[8px] text-zinc-500 hover:text-red-400 font-bold px-1 transition-colors cursor-pointer uppercase"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isConnectingPaypal}
                        onClick={async () => {
                          setIsConnectingPaypal(true);
                          try {
                            const response = await fetch('/api/auth/paypal/url');
                            if (!response.ok) throw new Error('Failed to fetch PayPal auth URL');
                            const { url } = await response.json();
                            const width = 600, height = 700;
                            const left = window.screen.width / 2 - width / 2;
                            const top = window.screen.height / 2 - height / 2;
                            const win = window.open(url, 'paypal_oauth_popup', `width=${width},height=${height},top=${top},left=${left}`);
                            if (!win) {
                              showLocalToast("⚠️ POPUP BLOCKED: Please enable popups.");
                              setIsConnectingPaypal(false);
                            }
                          } catch (err: any) {
                            showLocalToast(`⚠️ PAYPAL CONNECT ERROR: ${err.message}`);
                            setIsConnectingPaypal(false);
                          }
                        }}
                        className="w-full py-2 bg-[#0070BA] hover:bg-[#005ea6] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(0,112,186,0.25)] flex items-center justify-center gap-1.5 cursor-pointer disabled:brightness-75"
                      >
                        {isConnectingPaypal ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <Banknote className="w-3.5 h-3.5 animate-pulse" />
                            <span>Connect PayPal via OAuth</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* LEGAL ENTITY & TAX SPECIFICATIONS */}
                <div className="space-y-4 pt-3 border-t border-zinc-900/60 font-mono">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-fuchsia-400 font-bold block">
                      Legal Entity & Tax Compliance Specifications
                    </span>
                    <p className="text-[10px] text-zinc-400 font-sans">
                      Provide accurate legal tax metadata for 1099 disbursements, automated invoicing headers, and payment compliance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Legal Full / Entity Name</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs font-mono"
                        value={legalFullName}
                        onChange={(e) => setLegalFullName(e.target.value)}
                        placeholder="e.g. John Doe / Obituary Creative LLC"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Entity Structure Type</label>
                      <select
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs uppercase"
                        value={legalEntityType}
                        onChange={(e) => setLegalEntityType(e.target.value)}
                      >
                        <option value="sole_proprietorship">Sole Proprietorship / Freelance Individual</option>
                        <option value="single_member_llc">Single-Member LLC</option>
                        <option value="llc">Limited Liability Company (LLC)</option>
                        <option value="s_corp">S-Corporation (S-Corp)</option>
                        <option value="c_corp">C-Corporation (C-Corp)</option>
                        <option value="partnership">Partnership / Collective</option>
                        <option value="individual">Individual</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Tax ID (SSN / EIN / VAT)</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-fuchsia-500 text-xs font-mono"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="e.g. XX-XXXXXXX or EIN"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveCreativeProfile()}
                      className="bg-fuchsia-500 hover:bg-fuchsia-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition-all cursor-pointer shadow-md shadow-fuchsia-500/10"
                    >
                      Save Tax & Payout Specifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </V2ExpandableCard>

          {/* 3. HUB: Gear & Inventory */}
          <V2ExpandableCard 
            theme="fuchsia" 
            title="Gear & Inventory" 
            isExpanded={expandedSection === 'profile_c'} 
            onToggle={() => toggleSection('profile_c')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-fuchsia-400 block">Tech Specifications Inventory</span>
                <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                  List your professional hardware setup, cameras, active sub-mix boards, synthesis gear, or specific portable rigs that travel with you to assignments. This inventory is attached to matching bids automatically.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {gearTags.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-zinc-200 font-mono">
                    <span>🔧 {item}</span>
                    <button 
                      type="button" 
                      onClick={() => removeGearItem(item)}
                      className="text-zinc-500 hover:text-red-400 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {gearTags.length === 0 && (
                  <span className="text-[10px] italic text-zinc-500 font-mono">[ No custom dry-hire gear listed ]</span>
                )}
              </div>

              <div className="pt-2 flex gap-3 font-mono">
                <input
                  type="text"
                  className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500 text-xs"
                  placeholder="e.g. Behringer X32, Wacom Cintiq 24 Pro, Canon EOS R5"
                  value={newGearTag}
                  onChange={(e) => setNewGearTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGearItem()}
                />
                <button
                  type="button"
                  onClick={addGearItem}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Add Custom Gear
                </button>
              </div>
            </div>
          </V2ExpandableCard>
          <V2ExpandableCard 
            theme="fuchsia" 
            title="Team & Seat Licenses" 
            isExpanded={expandedSection === 'team'} 
            onToggle={() => toggleSection('team')}
          >
            <div className="p-5 space-y-8 text-left">
              
              {/* SUBSECTION A: CO-OP ROSTER & SEATS */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 flex-wrap gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-fuchsia-400 font-bold">Group Seat Capacity & Roster</h4>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5">Delegate contract management, scheduling access, and invoicing authorization.</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-xl shrink-0 font-mono">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase font-black">Seats occupied</span>
                      <span className="text-sm font-black text-white">{occupiedSeats} / {currentLimit}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-zinc-900" />
                    <div className="text-[10px] text-zinc-400 uppercase font-extrabold px-1">
                      {isLimitReached ? '🔴 FULL CAPACITY' : '🟢 OPEN SLOTS'}
                    </div>
                  </div>
                </div>

                {/* LIST MEMBERS */}
                <div className="space-y-2 pt-1 font-mono">
                  {teamMembers.map((member, idx) => (
                    <div 
                      key={`${member.id}-${idx}`} 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-zinc-950/45 border border-zinc-900 rounded-xl gap-3 hover:border-zinc-850 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fuchsia-950/40 border border-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center text-xs font-black">
                          {member?.name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-black text-white">{member?.name}</span>
                          <span className="text-[9.5px] text-zinc-500">{member.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <select
                          className="bg-[#090b0e] border border-zinc-900 text-zinc-400 text-[10px] px-2 py-1 rounded focus:outline-none uppercase font-bold"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={member.role.includes('CHIEF OPERATOR')}
                        >
                          <option value="CHIEF OPERATOR / CREATIVE">CHIEF OPERATOR / CREATIVE</option>
                          <option value="CREATIVE / CREW">CREATIVE / CREW</option>
                          <option value="LIGHTING ASSISTANT">LIGHTING ASSISTANT</option>
                          <option value="SOUND ENGINEER">SOUND ENGINEER</option>
                        </select>

                        {!member.role.includes('CHIEF OPERATOR') && (
                          <button 
                            type="button" 
                            onClick={() => handleRemove(member.id)}
                            className="text-zinc-650 hover:text-red-400 p-1 cursor-pointer transition-colors"
                            title="Remove collaborator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* INVITE FORM */}
                {!isLimitReached && (
                  <div className="pt-2 border-t border-zinc-900/60 font-mono">
                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Transcribe Crew Invitation Token</span>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500 text-xs"
                        placeholder="e.g. collaborator@soundcrew-alliance.net"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleInvite}
                        className="bg-fuchsia-500 hover:bg-fuchsia-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                      >
                        Issue Seat Invite
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-zinc-900" />

              {/* SUBSECTION B: SUBSCRIPTION TIERS & BILLING */}
              <div className="space-y-6 font-mono">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-fuchsia-400 block">Workspace Subscription Matrices</span>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    Evaluate and transition between co-op platform packages. Higher-tier models unlock additional administrative seats, gig-match alerts, and high-volume media storage quotas.
                  </p>
                </div>

                {/* ACTIVE TIER OVERVIEW */}
                <div className="bg-zinc-950/45 border border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 text-left">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-550 font-black">ACTIVE MEMBERSHIP TIER</span>
                    <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                      {CREATIVE_BILLING_MATRIX.tiers[activeTierId as keyof typeof CREATIVE_BILLING_MATRIX.tiers]?.name || 'Production Crew Syndicate'}
                    </h4>
                    <p className="text-[10px] text-zinc-400 leading-normal font-sans max-w-lg mt-0.5">
                      Your account is set to the {CREATIVE_BILLING_MATRIX.tiers[activeTierId as keyof typeof CREATIVE_BILLING_MATRIX.tiers]?.name} package, renewal cycles process on the first of each month.
                    </p>
                  </div>

                  <div className="flex flex-col text-left sm:text-right shrink-0">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-550 font-black">Renewal Cycle Status</span>
                    <span className="text-[10px] text-fuchsia-400 uppercase font-black tracking-widest mt-0.5">🟢 ACTIVE / TRIAL LIFE-CYCLE</span>
                  </div>
                </div>

                {/* THREE PLANS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-left font-sans">
                  {plans.map((p, pIdx) => {
                    const isCurrent = activeTierId === p.id;
                    return (
                      <div 
                        key={`${p.id}-${pIdx}`}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                          isCurrent 
                            ? 'border-fuchsia-500 bg-fuchsia-950/15 shadow-[0_0_15px_rgba(217,70,239,0.15)]' 
                            : 'border-zinc-900 bg-[#090b0e] hover:border-zinc-800'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute top-2 right-2 bg-fuchsia-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest font-mono">
                            ACTIVE TIER
                          </span>
                        )}

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">CO-OP LICENSE</span>
                          <h5 className="text-xs font-black text-white uppercase font-mono">{p.title}</h5>
                          <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                            {p.details}
                          </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-zinc-900/60 font-mono">
                          <span className="text-xs font-black text-white">{p.price}</span>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPlan(p.id as any);
                                setUserProfile({...userProfile, sub_tier: p.id as any});
                                showLocalToast(`Upgraded license to ${p.title}. Subscription modified.`);
                              }}
                              className="w-full py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                            >
                              SELECT LICENSE TIER
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </V2ExpandableCard>

          {/* 5. HUB: Workstation & System Preferences */}
          <V2ExpandableCard 
            theme="fuchsia" 
            title="Workstation & System Preferences" 
            isExpanded={expandedSection === 'tools'} 
            onToggle={() => toggleSection('tools')}
          >
            <div className="bg-[#090b0e] border-t border-zinc-900/60 p-0">
              <SettingsView
                portalType="creative"
                userProfile={userProfile}
                setUserProfile={setUserProfile as any}
                shows={localShows}
                setShows={setLocalShows}
                inventory={localInventory}
                setInventory={setLocalInventory}
                sales={localSales}
                setSales={setLocalSales}
                venues={localVenues}
                setVenues={setLocalVenues}
                onBack={() => {}}
                triggerNotification={showLocalToast}
                addLog={(msg) => setLocalLogs(prev => [...prev, msg])}
                activeBandName="Creative Active Group"
                logs={localLogs}
                onSubmitSale={() => {}}
                handleRestock={() => {}}
                dbStatus="idle"
                supabaseUrl=""
                supabaseKey=""
                bands={localBands}
                setBands={setLocalBands}
                activeBand={localActiveBand}
                setActiveBandId={setLocalActiveBandId}
                setIsBandModalOpen={setIsBandModalOpen}
                hideSectionProcessors
                hideSectionTools
              />
            </div>
          </V2ExpandableCard>

          {/* 6. HUB: Support, Reviews & Legal */}
          <V2ExpandableCard 
            theme="fuchsia" 
            title="Support, Reviews & Legal" 
            isExpanded={expandedSection === 'help'} 
            onToggle={() => toggleSection('help')}
          >
            <div className="p-5 space-y-8 text-left">
              
              {/* SUBSECTION: REVIEWS & TESTIMONIAL MANAGEMENT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] uppercase font-mono tracking-widest text-fuchsia-400 font-bold flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-fuchsia-400 text-fuchsia-400" />
                      Client Reviews & Responses
                    </span>
                    <p className="text-[10px] text-zinc-400 font-sans">
                      Read, respond to, and manage verified testimonials left by clients from your public profile card.
                    </p>
                  </div>
                </div>

                {/* Published Reviews List with Creative Responses */}
                <div className="space-y-3 font-mono">
                  {userReviews.map((rev, idx) => (
                    <div key={`${rev.id}-${idx}`} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-left space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white">{rev.name}</span>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold">({rev.group})</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: rev.score }).map((_, i) => (
                                <Star key={`rev-star-${idx}-${i}`} className="w-3 h-3 fill-fuchsia-400 text-fuchsia-400" />
                              ))}
                            </div>
                            {rev.date && (
                              <span className="text-[9px] text-zinc-600 font-mono">· {rev.date}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-normal font-sans italic">"{rev.text}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteReview(rev.id)}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-1 cursor-pointer shrink-0"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display Existing Response */}
                      {rev.creativeResponse && respondingToId !== rev.id && (
                        <div className="bg-fuchsia-950/20 border-l-2 border-fuchsia-500 rounded-r-xl p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> Your Response {rev.responseDate && `(${rev.responseDate})`}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRespondingToId(rev.id);
                                  setResponseText(rev.creativeResponse || '');
                                }}
                                className="text-[9px] text-fuchsia-400 hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReviewResponse(rev.id)}
                                className="text-[9px] text-red-400 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-300 font-sans">{rev.creativeResponse}</p>
                        </div>
                      )}

                      {/* Respond Form */}
                      {respondingToId === rev.id ? (
                        <div className="pt-2 border-t border-zinc-900 space-y-2">
                          <span className="text-[9px] uppercase font-bold text-fuchsia-400 tracking-wider block">
                            Compose Response to {rev.name}
                          </span>
                          <textarea
                            rows={2}
                            className="w-full bg-black border border-zinc-800 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500 text-xs font-sans"
                            placeholder="Write your public response to this client review..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRespondingToId(null);
                                setResponseText('');
                              }}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveReviewResponse(rev.id)}
                              className="px-3 py-1.5 bg-fuchsia-500 hover:bg-fuchsia-400 text-black text-[9px] font-black uppercase rounded-lg cursor-pointer font-bold"
                            >
                              Save Response
                            </button>
                          </div>
                        </div>
                      ) : !rev.creativeResponse && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setRespondingToId(rev.id);
                              setResponseText('');
                            }}
                            className="text-[9px] text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" /> Reply to Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {userReviews.length === 0 && (
                    <p className="text-[10px] italic text-zinc-500">[ No client reviews submitted yet. When clients leave feedback on your public profile, it will appear here. ]</p>
                  )}
                </div>
              </div>

              <hr className="border-zinc-900" />

              {/* SUBSECTION: HELP DESK */}
              <div className="space-y-3">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-fuchsia-400 font-bold block">
                  Support Help Desk
                </span>
                <div className="bg-[#090b0e] border border-zinc-900 rounded-xl overflow-hidden">
                  <HelpDeskView onBack={() => {}} triggerNotification={showLocalToast} />
                </div>
              </div>

              <hr className="border-zinc-900" />

              {/* SUBSECTION: TERMS OF SERVICE */}
              <div className="space-y-3">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-fuchsia-400 font-bold block">
                  Co-Op Terms of Service & Privacy Shield
                </span>
                <div className="bg-[#090b0e] border border-zinc-900 rounded-xl overflow-hidden">
                  <TermsOfServiceView onBack={() => {}} triggerNotification={showLocalToast} />
                </div>
              </div>

            </div>
          </V2ExpandableCard>

        </div>
      </div>

    </div>
  );
}
