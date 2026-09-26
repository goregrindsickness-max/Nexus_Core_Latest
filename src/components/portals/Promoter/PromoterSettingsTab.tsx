import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { 
  Users, Shield, Zap, X, Trash2, Mail, CheckCircle2, Clock, 
  Globe, Upload, Disc, CreditCard, Banknote, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Lock, Settings,
  Star, MessageSquare, HelpCircle, Palette, Briefcase, Heart, Code, RefreshCw,
  Building, MapPin, Phone, FileText, Check, Plus, DollarSign, Layers, Calendar, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import SettingsView from '../../SettingsView';
import HelpDeskView from '../../HelpDeskView';
import TermsOfServiceView from '../../TermsOfServiceView';
import PromoterSettings from './PromoterSettings';
import BillingSettingsView from '../../BillingSettingsView';
import StripeConnectPayoutSection from '../../StripeConnectPayoutSection';
import { getSupabase, uploadBase64ToStorage, executeWithSchemaResilience } from '../../../supabase';
import { GENRE_CLUSTERS } from '../../auth/authConstants';

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

// Promoter Billing Matrix
const PROMOTER_BILLING_MATRIX = {
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
    sovereign_promoter: {
      name: 'Sovereign Promoter Group',
      monthlyPrice: 119.99,
      annualMonthlyPrice: 89.99,
      rosterArtistLimit: 99999,
      adminSeatLimit: 99999,
      features: ['priority_api_placement', 'custom_legal_templates', 'automated_splits_distribution', 'high_res_bulk_exports']
    }
  }
};

interface PromoterSettingsTabProps {
  userProfile: UserProfile;
  setUserProfile?: any;
  activeClearanceLevel?: number;
  showLocalToast?: (msg: string) => void;
  setLabelOAuthProcessor?: (proc: { id: 'stripe' | 'paypal'; name: string } | null) => void;
  setLabelOAuthStep?: (step: number) => void;
  onLogout?: () => void;
}

export default function PromoterSettingsTab({ 
  userProfile, 
  setUserProfile: externalSetUserProfile, 
  activeClearanceLevel = 5, 
  showLocalToast = (msg) => console.log(msg),
  setLabelOAuthProcessor: externalSetLabelOAuthProcessor,
  setLabelOAuthStep: externalSetLabelOAuthStep,
  onLogout
}: PromoterSettingsTabProps) {
  
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Local states for System Preferences (SettingsView props)
  const [localShows, setLocalShows] = useState<any[]>([]);
  const [localInventory, setLocalInventory] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localVenues, setLocalVenues] = useState<any[]>([]);
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  const [showSubscriptionTiers, setShowSubscriptionTiers] = useState(false);
  const [localBands, setLocalBands] = useState<any[]>([]);
  const [localActiveBand, setLocalActiveBand] = useState<any>({ id: 'b1', name: 'Promoter Active Group' });
  const [localActiveBandId, setLocalActiveBandId] = useState('b1');
  const [isBandModalOpen, setIsBandModalOpen] = useState(false);

  // Local states for Review / Experience feedback
  const [reviewLeft, setReviewLeft] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerGroup, setReviewerGroup] = useState('');
  const [userReviews, setUserReviews] = useState<any[]>(() => {
    const existing = localStorage.getItem('nexus_core_user_reviews');
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Promoter Profile states matching Promoter Onboarding Form
  // 1. Media Assets
  const [promoterLogo, setPromoterLogo] = useState(
    userProfile.promoter_logo || (userProfile as any)?.logo_url || userProfile.promoter_metadata?.logo_url || ''
  );
  const [promoterCoverImage, setPromoterCoverImage] = useState(
    userProfile.promoter_cover_image || (userProfile as any)?.banner_url || userProfile.promoter_metadata?.banner_url || userProfile.promoter_metadata?.cover_url || ''
  );

  // 2. Section A: Agency & Operating Identity (Matching Promoter Onboarding Form Section A)
  const [promoterPipeline, setPromoterPipeline] = useState<'subscription' | 'festival'>(
    userProfile.promoter_metadata?.pipeline || 'subscription'
  );
  const [promoterAgency, setPromoterAgency] = useState(
    userProfile.promoter_agency || userProfile.promoter_brand || userProfile.promoter_name || userProfile.promoter_metadata?.agency_name || userProfile.promoter_metadata?.brand_name || userProfile.promoter_metadata?.business_name || ''
  );
  const [promoterTitle, setPromoterTitle] = useState(
    userProfile.promoter_metadata?.title || 'TALENT BUYER'
  );
  const [promoterRegion, setPromoterRegion] = useState(
    userProfile.promoter_region || userProfile.promoter_metadata?.region || userProfile.promoter_metadata?.target_region || userProfile.promoter_metadata?.base_location || ''
  );
  const [promoterPhone, setPromoterPhone] = useState(
    userProfile.promoter_metadata?.phone || ''
  );
  const [promoterAdminEmail, setPromoterAdminEmail] = useState(
    userProfile.promoter_metadata?.admin_email || userProfile.email || ''
  );
  const [promoterBookingEmail, setPromoterBookingEmail] = useState(
    userProfile.promoter_booking_email || userProfile.promoter_metadata?.booking_email || ''
  );
  const [promoterVenueClass, setPromoterVenueClass] = useState(
    userProfile.promoter_metadata?.venue_class || 'Club'
  );
  const [promoterCapacity, setPromoterCapacity] = useState(
    String(userProfile.promoter_metadata?.capacity || userProfile.promoter_metadata?.home_venue?.capacity || '350')
  );
  const [promoterCurrency, setPromoterCurrency] = useState(
    userProfile.promoter_metadata?.currency || 'USD'
  );
  const [promoterSocialOpen, setPromoterSocialOpen] = useState(false);
  const [promoterInstagram, setPromoterInstagram] = useState(
    userProfile.promoter_metadata?.instagram || ''
  );
  const [promoterTwitter, setPromoterTwitter] = useState(
    userProfile.promoter_metadata?.twitter || ''
  );
  const [promoterWebsite, setPromoterWebsite] = useState(
    userProfile.promoter_metadata?.website || userProfile.promoter_metadata?.portfolio_link || ''
  );
  const [bio, setBio] = useState(
    userProfile.promoter_metadata?.bio || (userProfile as any)?.promoter_bio || (typeof window !== 'undefined' ? localStorage.getItem('nexus_promoter_bio') : null) || ''
  );

  // 3. Section B: Tax Hygiene & Venue Specifications (Matching Promoter Onboarding Form Section B)
  const [promoterLegalFullName, setPromoterLegalFullName] = useState(
    userProfile.promoter_metadata?.legal_full_name || userProfile.name || ''
  );
  const [promoterLegalEntityType, setPromoterLegalEntityType] = useState(
    userProfile.promoter_metadata?.legal_entity_type || 'LLC'
  );
  const [promoterTaxId, setPromoterTaxId] = useState(
    userProfile.promoter_metadata?.tax_id || ''
  );
  const [promoterStreetAddress, setPromoterStreetAddress] = useState(
    userProfile.promoter_metadata?.street_address || userProfile.promoter_metadata?.home_venue?.address || ''
  );
  const [promoterCity, setPromoterCity] = useState(
    userProfile.promoter_metadata?.city || userProfile.promoter_metadata?.home_venue?.city || ''
  );
  const [promoterState, setPromoterState] = useState(
    userProfile.promoter_metadata?.state || userProfile.promoter_metadata?.state_province || userProfile.promoter_metadata?.home_venue?.state_province || ''
  );
  const [promoterCountry, setPromoterCountry] = useState(
    userProfile.promoter_metadata?.country || userProfile.promoter_metadata?.home_venue?.country || 'USA'
  );
  const [promoterTechRider, setPromoterTechRider] = useState(
    userProfile.promoter_metadata?.tech_rider || userProfile.promoter_metadata?.home_venue?.gear_provided || ''
  );
  const [promoterSecurityMap, setPromoterSecurityMap] = useState(
    userProfile.promoter_metadata?.security_map || userProfile.promoter_metadata?.home_venue?.backline_requirements || ''
  );
  const [promoterDeferTechSpecs, setPromoterDeferTechSpecs] = useState(
    Boolean(userProfile.promoter_metadata?.defer_tech_specs)
  );
  const [venueProductionNotes, setVenueProductionNotes] = useState(
    userProfile.promoter_metadata?.venue_specs || userProfile.promoter_metadata?.home_venue?.audio_requirements || ''
  );

  // 4. Section C: Standard Offer & Settlement Defaults (Promoter Deal & Offer Structures)
  const [dealStructure, setDealStructure] = useState(
    userProfile.promoter_metadata?.deal_structure || 'DOOR_SPLIT'
  );
  const [defaultGuarantee, setDefaultGuarantee] = useState(
    String(userProfile.promoter_metadata?.default_guarantee || '350')
  );
  const [defaultSplitPercentage, setDefaultSplitPercentage] = useState(
    String(userProfile.promoter_metadata?.default_split_percentage || '80')
  );
  const [standardHouseNut, setStandardHouseNut] = useState(
    String(userProfile.promoter_metadata?.standard_house_nut || '150')
  );
  const [merchSplitPolicy, setMerchSplitPolicy] = useState(
    userProfile.promoter_metadata?.merch_split_policy || '0% - Band Keeps 100% of Merch Sales'
  );
  const [offerNotes, setOfferNotes] = useState(
    userProfile.promoter_metadata?.offer_notes || userProfile.promoter_metadata?.pricing_notes || ''
  );

  // 5. Genre Taxonomy & Booking Matrix (Matching Promoter Onboarding Form Genre Matrix)
  const [isPromoterGenresExpanded, setIsPromoterGenresExpanded] = useState(true);
  const [promoterGenres, setPromoterGenres] = useState<string[]>(() => {
    if (Array.isArray(userProfile.promoter_metadata?.genres) && userProfile.promoter_metadata.genres.length > 0) {
      return userProfile.promoter_metadata.genres;
    }
    if (Array.isArray(userProfile.promoter_metadata?.genre_tags) && userProfile.promoter_metadata.genre_tags.length > 0) {
      return userProfile.promoter_metadata.genre_tags;
    }
    return ['DEATH METAL', 'GRINDCORE', 'HARDCORE', 'PUNK ROCK', 'SLUDGE METAL'];
  });
  const [newGenreInput, setNewGenreInput] = useState('');
  const [targetBookingScopes, setTargetBookingScopes] = useState<string[]>(() => {
    if (Array.isArray(userProfile.promoter_metadata?.booking_scopes) && userProfile.promoter_metadata.booking_scopes.length > 0) {
      return userProfile.promoter_metadata.booking_scopes;
    }
    return ['Local Support & Openers', 'Regional Touring Packages', 'All-Ages Community Showcases'];
  });

  // Subscription states
  const [currentPlan, setCurrentPlan] = useState<'freelance_specialist' | 'crew_syndicate' | 'sovereign_promoter'>('crew_syndicate');
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Team states
  const [teamMembers, setTeamMembers] = useState(() => {
    if (userProfile.email || userProfile.name) {
      return [{ id: userProfile.id || 'u1', name: userProfile.name || 'Promoter Leader', email: userProfile.email || '', role: userProfile.role || 'CHIEF OPERATOR / PROMOTER' }];
    }
    return [];
  });

  // Payout Config State from V1
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'paypal' | 'none'>(
    (userProfile?.promoter_metadata?.payout_method as 'stripe' | 'paypal' | 'none') || 'none'
  );
  const [stripeAccountId, setStripeAccountId] = useState(userProfile?.promoter_metadata?.stripe_account_id || '');
  const [paypalEmail, setPaypalEmail] = useState(userProfile?.promoter_metadata?.paypal_email || '');
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [isSuccessfullyConnected, setIsSuccessfullyConnected] = useState<boolean>(() => {
    return (userProfile?.promoter_metadata?.stripe_account_id || '').startsWith('acct_');
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
    if (userProfile) {
      const meta = userProfile.promoter_metadata || {};
      setPromoterLogo(userProfile.promoter_logo || (userProfile as any)?.logo_url || meta.logo_url || '');
      setPromoterCoverImage(userProfile.promoter_cover_image || (userProfile as any)?.banner_url || meta.banner_url || meta.cover_url || '');
      setPromoterPipeline(meta.pipeline || 'subscription');
      setPromoterAgency(userProfile.promoter_agency || userProfile.promoter_brand || userProfile.promoter_name || meta.agency_name || meta.brand_name || meta.business_name || '');
      setPromoterTitle(meta.title || 'TALENT BUYER');
      setPromoterRegion(userProfile.promoter_region || meta.region || meta.target_region || meta.base_location || '');
      setPromoterPhone(meta.phone || '');
      setPromoterAdminEmail(meta.admin_email || userProfile.email || '');
      setPromoterBookingEmail(userProfile.promoter_booking_email || meta.booking_email || '');
      setPromoterVenueClass(meta.venue_class || 'Club');
      setPromoterCapacity(String(meta.capacity || meta.home_venue?.capacity || '350'));
      setPromoterCurrency(meta.currency || 'USD');
      setPromoterInstagram(meta.instagram || '');
      setPromoterTwitter(meta.twitter || '');
      setPromoterWebsite(meta.website || meta.portfolio_link || '');
      setBio(meta.bio || (userProfile as any)?.promoter_bio || (typeof window !== 'undefined' ? localStorage.getItem('nexus_promoter_bio') : null) || '');

      setPromoterLegalFullName(meta.legal_full_name || userProfile.name || '');
      setPromoterLegalEntityType(meta.legal_entity_type || 'LLC');
      setPromoterTaxId(meta.tax_id || '');
      setPromoterStreetAddress(meta.street_address || meta.home_venue?.address || '');
      setPromoterCity(meta.city || meta.home_venue?.city || '');
      setPromoterState(meta.state || meta.state_province || meta.home_venue?.state_province || '');
      setPromoterCountry(meta.country || meta.home_venue?.country || 'USA');
      setPromoterTechRider(meta.tech_rider || meta.home_venue?.gear_provided || '');
      setPromoterSecurityMap(meta.security_map || meta.home_venue?.backline_requirements || '');
      setPromoterDeferTechSpecs(Boolean(meta.defer_tech_specs));
      setVenueProductionNotes(meta.venue_specs || meta.home_venue?.audio_requirements || '');

      setDealStructure(meta.deal_structure || 'DOOR_SPLIT');
      setDefaultGuarantee(String(meta.default_guarantee || '350'));
      setDefaultSplitPercentage(String(meta.default_split_percentage || '80'));
      setStandardHouseNut(String(meta.standard_house_nut || '150'));
      setMerchSplitPolicy(meta.merch_split_policy || '0% - Band Keeps 100% of Merch Sales');
      setOfferNotes(meta.offer_notes || meta.pricing_notes || '');

      if (Array.isArray(meta.genres) && meta.genres.length > 0) {
        setPromoterGenres(meta.genres);
      } else if (Array.isArray(meta.genre_tags) && meta.genre_tags.length > 0) {
        setPromoterGenres(meta.genre_tags);
      }
      if (Array.isArray(meta.booking_scopes) && meta.booking_scopes.length > 0) {
        setTargetBookingScopes(meta.booking_scopes);
      }
    }
  }, [userProfile?.id]);

  const PLAN_LIMITS: Record<string, number> = {
    'freelance_specialist': PROMOTER_BILLING_MATRIX.tiers.freelance_specialist.adminSeatLimit,
    'crew_syndicate': PROMOTER_BILLING_MATRIX.tiers.crew_syndicate.adminSeatLimit,
    'sovereign_promoter': PROMOTER_BILLING_MATRIX.tiers.sovereign_promoter.adminSeatLimit
  };

  const activeTierId = userProfile?.sub_tier || currentPlan;
  const currentLimit = PLAN_LIMITS[activeTierId] || PROMOTER_BILLING_MATRIX.tiers.freelance_specialist.adminSeatLimit;
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
      role: 'PROMOTER / CREW'
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    showLocalToast(`Invitation sent to ${inviteEmail}.`);
  };

  const handleRemove = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showLocalToast(`Collaborator removed from promoter group.`);
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
            const compressed = await compressImage(event.target.result, 256, 256, 0.75);
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'promoter-avatar');
            setPromoterLogo(publicUrl);
            setUserProfile((prev: any) => ({ ...prev, promoter_logo: publicUrl }));
            // Persist to Supabase
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              const promoterId = userProfile?.promoter_id || userProfile?.registered_promoter_id || userProfile?.id;
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
              if (promoterId) {
                await executeWithSchemaResilience(
                  async (payload) => supabase.from('promoters').upsert(payload, { onConflict: 'id' }),
                  { id: promoterId, promoter_logo: publicUrl, logo_url: publicUrl }
                );
              }
            }
            showLocalToast("Promoter avatar updated successfully.");
          } catch (err) {
            console.error("Avatar upload failed:", err);
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
            const compressed = await compressImage(event.target.result, 800, 450, 0.75);
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'promoter-banner');
            setPromoterCoverImage(publicUrl);
            setUserProfile((prev: any) => ({ ...prev, promoter_cover_image: publicUrl }));
            // Persist to Supabase
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              const promoterId = userProfile?.promoter_id || userProfile?.registered_promoter_id || userProfile?.id;
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
              if (promoterId) {
                await executeWithSchemaResilience(
                  async (payload) => supabase.from('promoters').upsert(payload, { onConflict: 'id' }),
                  { id: promoterId, promoter_cover_image: publicUrl, cover_url: publicUrl, banner_url: publicUrl }
                );
              }
            }
            showLocalToast("Billboard portfolio cover banner updated successfully.");
          } catch (err) {
            console.error("Banner upload failed:", err);
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
    handleSavePromoterProfile({
      payout_method: overrides?.payout_method !== undefined ? overrides.payout_method : payoutMethod,
      stripe_account_id: overrides?.stripe_account_id !== undefined ? overrides.stripe_account_id : stripeAccountId,
      paypal_email: overrides?.paypal_email !== undefined ? overrides.paypal_email.trim() : paypalEmail.trim()
    });
  };

  const handleSavePromoterProfile = async (overrides?: any) => {
    const pAgency = overrides?.promoter_agency !== undefined ? overrides.promoter_agency : (overrides?.agency_name !== undefined ? overrides.agency_name : promoterAgency);
    const pTitle = overrides?.promoter_title !== undefined ? overrides.promoter_title : (overrides?.title !== undefined ? overrides.title : promoterTitle);
    const pRegion = overrides?.promoter_region !== undefined ? overrides.promoter_region : (overrides?.region !== undefined ? overrides.region : promoterRegion);
    const pPhone = overrides?.promoter_phone !== undefined ? overrides.promoter_phone : (overrides?.phone !== undefined ? overrides.phone : promoterPhone);
    const pAdminEmail = overrides?.promoter_admin_email !== undefined ? overrides.promoter_admin_email : (overrides?.admin_email !== undefined ? overrides.admin_email : promoterAdminEmail);
    const pBookingEmail = overrides?.promoter_booking_email !== undefined ? overrides.promoter_booking_email : (overrides?.booking_email !== undefined ? overrides.booking_email : promoterBookingEmail);
    const pVenueClass = overrides?.promoter_venue_class !== undefined ? overrides.promoter_venue_class : (overrides?.venue_class !== undefined ? overrides.venue_class : promoterVenueClass);
    const pCapacity = overrides?.promoter_capacity !== undefined ? overrides.promoter_capacity : (overrides?.capacity !== undefined ? overrides.capacity : promoterCapacity);
    const pCurrency = overrides?.promoter_currency !== undefined ? overrides.promoter_currency : (overrides?.currency !== undefined ? overrides.currency : promoterCurrency);
    const pPipeline = overrides?.promoter_pipeline !== undefined ? overrides.promoter_pipeline : (overrides?.pipeline !== undefined ? overrides.pipeline : promoterPipeline);
    const pInstagram = overrides?.promoter_instagram !== undefined ? overrides.promoter_instagram : (overrides?.instagram !== undefined ? overrides.instagram : promoterInstagram);
    const pTwitter = overrides?.promoter_twitter !== undefined ? overrides.promoter_twitter : (overrides?.twitter !== undefined ? overrides.twitter : promoterTwitter);
    const pWebsite = overrides?.promoter_website !== undefined ? overrides.promoter_website : (overrides?.website !== undefined ? overrides.website : promoterWebsite);
    const pBio = overrides?.bio !== undefined ? overrides.bio : bio;
    const pLegalName = overrides?.legal_full_name !== undefined ? overrides.legal_full_name : promoterLegalFullName;
    const pLegalEntity = overrides?.legal_entity_type !== undefined ? overrides.legal_entity_type : promoterLegalEntityType;
    const pTaxId = overrides?.tax_id !== undefined ? overrides.tax_id : promoterTaxId;
    const pStreet = overrides?.street_address !== undefined ? overrides.street_address : promoterStreetAddress;
    const pCity = overrides?.city !== undefined ? overrides.city : promoterCity;
    const pState = overrides?.state !== undefined ? overrides.state : promoterState;
    const pCountry = overrides?.country !== undefined ? overrides.country : promoterCountry;
    const pTechRider = overrides?.tech_rider !== undefined ? overrides.tech_rider : promoterTechRider;
    const pSecurityMap = overrides?.security_map !== undefined ? overrides.security_map : promoterSecurityMap;
    const pDeferTech = overrides?.defer_tech_specs !== undefined ? overrides.defer_tech_specs : promoterDeferTechSpecs;
    const pVenueSpecs = overrides?.venue_specs !== undefined ? overrides.venue_specs : venueProductionNotes;
    const pDealStructure = overrides?.deal_structure !== undefined ? overrides.deal_structure : dealStructure;
    const pGuarantee = overrides?.default_guarantee !== undefined ? overrides.default_guarantee : defaultGuarantee;
    const pSplit = overrides?.default_split_percentage !== undefined ? overrides.default_split_percentage : defaultSplitPercentage;
    const pHouseNut = overrides?.standard_house_nut !== undefined ? overrides.standard_house_nut : standardHouseNut;
    const pMerchPolicy = overrides?.merch_split_policy !== undefined ? overrides.merch_split_policy : merchSplitPolicy;
    const pOfferNotes = overrides?.offer_notes !== undefined ? overrides.offer_notes : offerNotes;
    const pGenres = overrides?.genres !== undefined ? overrides.genres : promoterGenres;
    const pScopes = overrides?.booking_scopes !== undefined ? overrides.booking_scopes : targetBookingScopes;
    const pPayout = overrides?.payout_method !== undefined ? overrides.payout_method : payoutMethod;
    const pStripeId = overrides?.stripe_account_id !== undefined ? overrides.stripe_account_id : stripeAccountId;
    const pPaypalEmail = overrides?.paypal_email !== undefined ? overrides.paypal_email : paypalEmail;
    const pLogo = overrides?.promoter_logo !== undefined ? overrides.promoter_logo : promoterLogo;
    const pCover = overrides?.promoter_cover_image !== undefined ? overrides.promoter_cover_image : promoterCoverImage;

    const updatedHomeVenue = {
      name: pAgency.trim() || 'Main Operating Venue',
      address: pStreet.trim(),
      city: pCity.trim(),
      state_province: pState.trim(),
      country: pCountry.trim() || 'USA',
      capacity: pCapacity ? (Number(pCapacity) || pCapacity) : undefined,
      gear_provided: pTechRider.trim(),
      audio_requirements: pVenueSpecs.trim() || pTechRider.trim(),
      backline_requirements: pSecurityMap.trim()
    };

    setUserProfile((prev: any) => {
      const updatedMetadata = {
        ...prev.promoter_metadata,
        agency_name: pAgency.trim(),
        brand_name: pAgency.trim(),
        business_name: pAgency.trim(),
        promoter_name: pAgency.trim(),
        title: pTitle.trim(),
        region: pRegion.trim(),
        target_region: pRegion.trim(),
        phone: pPhone.trim(),
        admin_email: pAdminEmail.trim(),
        booking_email: pBookingEmail.trim(),
        venue_class: pVenueClass,
        capacity: pCapacity ? (Number(pCapacity) || pCapacity) : undefined,
        currency: pCurrency,
        pipeline: pPipeline,
        instagram: pInstagram.trim(),
        twitter: pTwitter.trim(),
        website: pWebsite.trim(),
        bio: pBio.trim(),
        legal_full_name: pLegalName.trim(),
        legal_entity_type: pLegalEntity,
        tax_id: pTaxId.trim(),
        street_address: pStreet.trim(),
        city: pCity.trim(),
        state: pState.trim(),
        state_province: pState.trim(),
        country: pCountry.trim() || 'USA',
        tech_rider: pTechRider.trim(),
        security_map: pSecurityMap.trim(),
        defer_tech_specs: pDeferTech,
        venue_specs: pVenueSpecs.trim(),
        deal_structure: pDealStructure,
        default_guarantee: pGuarantee,
        default_split_percentage: pSplit,
        standard_house_nut: pHouseNut,
        merch_split_policy: pMerchPolicy,
        offer_notes: pOfferNotes.trim(),
        genres: pGenres,
        genre_tags: pGenres,
        booking_scopes: pScopes,
        payout_method: pPayout,
        stripe_account_id: pStripeId,
        paypal_email: pPaypalEmail,
        home_venue: updatedHomeVenue,
        logo_url: pLogo || prev?.promoter_logo || undefined,
        banner_url: pCover || prev?.promoter_cover_image || undefined
      };

      const supabase = getSupabase();
      if (supabase && prev?.id) {
        const promoterId = prev?.promoter_id || prev?.registered_promoter_id || prev?.id;

        executeWithSchemaResilience(
          async (payload) => supabase.from('profiles').update(payload).eq('id', prev.id),
          {
            promoter_metadata: updatedMetadata,
            ...(promoterId ? { promoter_id: promoterId } : {})
          }
        ).then(({ error }) => {
          if (error) console.error("Promoter DB profile save failed:", error);
          else console.log("✓ Successfully saved promoter profile to profiles table.");
        });

        if (promoterId) {
          executeWithSchemaResilience(
            async (payload) => supabase.from('promoters').upsert(payload, { onConflict: 'id' }),
            {
              id: promoterId,
              user_id: prev.id,
              creator_id: prev.id,
              owner_id: prev.id,
              corporate_name: pAgency.trim() || 'Nexus Live Productions',
              brand_name: pAgency.trim(),
              agency_name: pAgency.trim(),
              promoter_name: pAgency.trim(),
              name: pAgency.trim(),
              title: pTitle.trim(),
              region: pRegion.trim(),
              target_region: pRegion.trim(),
              phone: pPhone.trim() || null,
              admin_email: pAdminEmail.trim() || null,
              booking_email: pBookingEmail.trim() || null,
              venue_class: pVenueClass,
              capacity: pCapacity ? (Number(pCapacity) || pCapacity) : null,
              currency: pCurrency,
              pipeline: pPipeline,
              instagram: pInstagram.trim() || null,
              twitter: pTwitter.trim() || null,
              website: pWebsite.trim() || null,
              bio: pBio.trim() || null,
              description: pBio.trim() || null,
              genres: pGenres,
              street_address: pStreet.trim() || null,
              city: pCity.trim() || null,
              state: pState.trim() || null,
              state_province: pState.trim() || null,
              country: pCountry.trim() || 'USA',
              tech_rider: pTechRider.trim() || null,
              security_map: pSecurityMap.trim() || null,
              defer_tech_specs: pDeferTech,
              home_venue: updatedHomeVenue,
              promoter_logo: pLogo || prev?.promoter_logo || null,
              logo_url: pLogo || prev?.promoter_logo || null,
              cover_url: pCover || prev?.promoter_cover_image || null,
              banner_url: pCover || prev?.promoter_cover_image || null
            }
          ).then(({ error }) => {
            if (error) console.warn("Promoter table secondary upsert warning:", error);
            else console.log("✓ Successfully saved to promoters table.");
          });
        }
      }

      return {
        ...prev,
        promoter_agency: pAgency.trim(),
        promoter_brand: pAgency.trim(),
        promoter_name: pAgency.trim(),
        promoter_title: pTitle.trim(),
        promoter_region: pRegion.trim(),
        promoter_booking_email: pBookingEmail.trim(),
        promoter_logo: pLogo || prev?.promoter_logo,
        promoter_cover_image: pCover || prev?.promoter_cover_image,
        promoter_bio: pBio.trim(),
        promoter_metadata: updatedMetadata
      };
    });

    try {
      localStorage.setItem('nexus_promoter_bio', pBio.trim());
    } catch (_) {}

    showLocalToast("✓ Promoter specifications updated successfully.");
  };

  // Genre specialties presets
  const togglePromoterGenre = (genre: string) => {
    let updated: string[];
    if (promoterGenres.includes(genre)) {
      updated = promoterGenres.filter(x => x !== genre);
    } else {
      updated = [...promoterGenres, genre];
    }
    setPromoterGenres(updated);
    handleSavePromoterProfile({ genres: updated });
  };

  const addCustomPromoterGenre = () => {
    if (!newGenreInput.trim()) return;
    const clean = newGenreInput.trim().toUpperCase();
    if (promoterGenres.includes(clean)) {
      showLocalToast("Genre already selected.");
      return;
    }
    const updated = [...promoterGenres, clean];
    setPromoterGenres(updated);
    setNewGenreInput('');
    handleSavePromoterProfile({ genres: updated });
  };

  const toggleBookingScope = (scope: string) => {
    let updated: string[];
    if (targetBookingScopes.includes(scope)) {
      updated = targetBookingScopes.filter(s => s !== scope);
    } else {
      updated = [...targetBookingScopes, scope];
    }
    setTargetBookingScopes(updated);
    handleSavePromoterProfile({ booking_scopes: updated });
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

  const plans = [
    {
      id: 'freelance_specialist',
      title: PROMOTER_BILLING_MATRIX.tiers.freelance_specialist.name,
      price: `$${PROMOTER_BILLING_MATRIX.tiers.freelance_specialist.monthlyPrice} / MONTH`,
      details: `Includes 1 secure freelance workspace seat, 1 active placement profile, basic gig bidding tools, and essential portfolio analytics.`,
    },
    {
      id: 'crew_syndicate',
      title: PROMOTER_BILLING_MATRIX.tiers.crew_syndicate.name,
      price: `$${PROMOTER_BILLING_MATRIX.tiers.crew_syndicate.monthlyPrice} / MONTH`,
      details: `Includes up to ${PROMOTER_BILLING_MATRIX.tiers.crew_syndicate.adminSeatLimit} secure collaborative workspace seats, custom billing invoices & contracts, shared team calendar, and advanced filter routing.`,
    },
    {
      id: 'sovereign_promoter',
      title: PROMOTER_BILLING_MATRIX.tiers.sovereign_promoter.name,
      price: `$${PROMOTER_BILLING_MATRIX.tiers.sovereign_promoter.monthlyPrice} / MONTH`,
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
          <Settings className="w-5 h-5 text-lime-500 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h2 className="text-sm font-black font-mono tracking-widest text-zinc-100 uppercase">
              PROMOTER PORTAL SETTINGS & CONTRACTS
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
          <span className="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_8px_#ccff00] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Profile Settings</h3>
        </div>

        <div className="space-y-3">
          {/* 1. ACCORDION TAB: Promoter Profile & Media */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Promoter Profile & Media" 
            isExpanded={expandedSection === 'profile_ab'} 
            onToggle={() => toggleSection('profile_ab')}
          >
            <div className="p-5 space-y-8 text-left">
              
              {/* SECTION A: MEDIA ASSETS */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-lime-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                  Section A: Portfolio Media Assets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Avatar / Logo */}
                  <div className="space-y-3 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Promoter Emblem / Avatar</span>
                    <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                      {promoterLogo || userProfile.promoter_logo || userProfile.avatar_url ? (
                        <>
                          <img 
                            src={promoterLogo || userProfile.promoter_logo || userProfile.avatar_url} 
                            alt="Logo" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPromoterLogo('');
                              handleSavePromoterProfile({ promoter_logo: '' });
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove emblem"
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
                        const input = document.getElementById('promoter-avatar-uploader-acc') as HTMLInputElement;
                        input?.click();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[10px] font-mono text-lime-400 uppercase hover:brightness-110 transition-all cursor-pointer font-bold"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Avatar (PNG/JPG)
                    </button>
                    <input 
                      id="promoter-avatar-uploader-acc"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLocalImageUpload} 
                    />
                  </div>

                  {/* Cover Picture / Banner */}
                  <div className="space-y-3 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Billboard Background Cover Banner</span>
                    <div className="relative group w-full h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                      {promoterCoverImage || userProfile.promoter_cover_image || userProfile.banner_url ? (
                        <>
                          <img 
                            src={promoterCoverImage || userProfile.promoter_cover_image || userProfile.banner_url} 
                            alt="Banner" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPromoterCoverImage('');
                              handleSavePromoterProfile({ promoter_cover_image: '' });
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove banner"
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
                        const input = document.getElementById('promoter-cover-uploader-acc') as HTMLInputElement;
                        input?.click();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[10px] font-mono text-lime-400 uppercase hover:brightness-110 transition-all cursor-pointer font-bold"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Banner (Aspect 16:9)
                    </button>
                    <input 
                      id="promoter-cover-uploader-acc"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLocalCoverImageUpload} 
                    />
                  </div>
                </div>
              </div>

              <hr className="border-zinc-900/60" />

              {/* SECTION B: AGENCY & VENUE SHOWCASE (MATCHING ONBOARDING FORM SECTION A) */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-lime-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                  Section B: Agency & Operating Identity
                </h4>

                {/* Account Pipeline Toggle */}
                <div className="space-y-1.5 text-left border-b border-zinc-900/80 pb-3 font-mono">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">
                    Operational Account Pipeline
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPromoterPipeline('subscription')}
                      className={`p-3 rounded-xl font-mono text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        promoterPipeline === 'subscription'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 font-bold shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <span>🏢</span>
                      <span>VENUE / YEAR-ROUND AGENCY</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoterPipeline('festival')}
                      className={`p-3 rounded-xl font-mono text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                        promoterPipeline === 'festival'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 font-bold shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <span>🎪</span>
                      <span>ANNUAL FESTIVAL OPERATOR</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-sans leading-normal mt-1.5">
                    {promoterPipeline === 'subscription'
                      ? 'Configured for year-round venues, nightclubs, or active booking agencies with calendar planning grids and routing engines.'
                      : 'Configured for standalone annual festivals, seasonal outdoor series, and multi-day showcases with dedicated ticketing manifests.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono">
                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Booking Agency / Production Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-yellow-400 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterAgency}
                      onChange={(e) => setPromoterAgency(e.target.value)}
                      placeholder="ENTER BOOKING AGENCY OR VENUE PRODUCTION"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">My Title / Role</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterTitle}
                      onChange={(e) => setPromoterTitle(e.target.value)}
                      placeholder="e.g. TALENT BUYER, OWNER, Lead Booker"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Promoting Jurisdiction / Region</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterRegion}
                      onChange={(e) => setPromoterRegion(e.target.value)}
                      placeholder="e.g. Texas, South-West USA"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Admin Phone Number</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterPhone}
                      onChange={(e) => setPromoterPhone(e.target.value)}
                      placeholder="e.g. +1 (512) 555-0199"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Administrative Email</label>
                    <input
                      type="email"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterAdminEmail}
                      onChange={(e) => setPromoterAdminEmail(e.target.value)}
                      placeholder="e.g. admin@agency.com"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Booking Submissions Email</label>
                    <input
                      type="email"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterBookingEmail}
                      onChange={(e) => setPromoterBookingEmail(e.target.value)}
                      placeholder="e.g. booking@agency.com"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Venue Classification</label>
                    <select
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono uppercase"
                      value={promoterVenueClass}
                      onChange={(e) => setPromoterVenueClass(e.target.value)}
                    >
                      <option value="Club">CLUB</option>
                      <option value="Theater">THEATER</option>
                      <option value="Arena">ARENA</option>
                      <option value="Festival">FESTIVAL</option>
                      <option value="Outdoor">OUTDOOR STAGE</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Venue Capacity</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                      value={promoterCapacity}
                      onChange={(e) => setPromoterCapacity(e.target.value)}
                      placeholder="e.g. 350, 1500"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Default Settlement Currency</label>
                    <select
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono uppercase"
                      value={promoterCurrency}
                      onChange={(e) => setPromoterCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($ United States Dollar)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                      <option value="GBP">GBP (£ British Pound)</option>
                      <option value="CAD">CAD ($ Canadian Dollar)</option>
                      <option value="AUD">AUD ($ Australian Dollar)</option>
                      <option value="JPY">JPY (¥ Japanese Yen)</option>
                    </select>
                  </div>

                  {/* Socials & Website Links Toggle */}
                  <div className="md:col-span-2 border border-zinc-900 rounded-xl p-3.5 bg-zinc-950/40">
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => setPromoterSocialOpen(!promoterSocialOpen)}
                    >
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Official Social Channels & Public Website</span>
                      </span>
                      <span className="text-zinc-500 text-[10px] group-hover:text-yellow-500 transition-colors">
                        {promoterSocialOpen ? '▼ [ COLLAPSE ]' : '▶ [ EXPAND ]'}
                      </span>
                    </div>

                    {promoterSocialOpen && (
                      <div className="mt-3.5 space-y-3 pt-3 border-t border-zinc-900">
                        <div className="space-y-1 text-left">
                          <label className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-bold">Instagram Handle</label>
                          <input 
                            type="text" 
                            placeholder="@HANDLE"
                            value={promoterInstagram}
                            onChange={(e) => setPromoterInstagram(e.target.value)}
                            className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-bold">Twitter / X Handle</label>
                          <input 
                            type="text" 
                            placeholder="@HANDLE"
                            value={promoterTwitter}
                            onChange={(e) => setPromoterTwitter(e.target.value)}
                            className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-bold">Official Website URL</label>
                          <input 
                            type="url" 
                            placeholder="HTTPS://DOMAIN.COM"
                            value={promoterWebsite}
                            onChange={(e) => setPromoterWebsite(e.target.value)}
                            className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Biography & Agency Overview Summary</label>
                    <textarea
                      rows={3}
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-sans leading-relaxed"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Give a brief summary of your promoter background, booking history, venue affiliations, and subcultural specialties..."
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSavePromoterProfile()}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Agency Specifications</span>
                  </button>
                </div>
              </div>

            </div>
          </V2ExpandableCard>

          {/* 2. ACCORDION TAB: Tax Hygiene & Venue Specifications */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Tax Hygiene & Venue Specifications" 
            isExpanded={expandedSection === 'profile_c'} 
            onToggle={() => toggleSection('profile_c')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-yellow-400 block">
                  Legal Entity, Tax Verification & Venue Production Coordinates
                </span>
                <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                  Configure tax reporting entities and physical venue infrastructure specifications. These technical production links and house specifications automatically populate rider agreements and incoming tour routing sheets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 font-mono">
                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Legal Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterLegalFullName}
                    onChange={(e) => setPromoterLegalFullName(e.target.value)}
                    placeholder="LEGAL FULL NAME"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Legal Entity Type</label>
                  <select
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono uppercase"
                    value={promoterLegalEntityType}
                    onChange={(e) => setPromoterLegalEntityType(e.target.value)}
                  >
                    <option value="SOLE_PROPRIETORSHIP">SOLE PROPRIETORSHIP</option>
                    <option value="LLC">LLC</option>
                    <option value="CORPORATION">CORPORATION</option>
                    <option value="PARTNERSHIP">PARTNERSHIP</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Taxpayer Identification (EIN / SSN)</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterTaxId}
                    onChange={(e) => setPromoterTaxId(e.target.value)}
                    placeholder="12-3456789 or SSN"
                  />
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Venue Operational Street Address</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterStreetAddress}
                    onChange={(e) => setPromoterStreetAddress(e.target.value)}
                    placeholder="Venue Operational Street Address"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">City</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterCity}
                    onChange={(e) => setPromoterCity(e.target.value)}
                    placeholder="City (e.g. Austin)"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">State / Province</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterState}
                    onChange={(e) => setPromoterState(e.target.value)}
                    placeholder="e.g. TX"
                  />
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Country</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterCountry}
                    onChange={(e) => setPromoterCountry(e.target.value)}
                    placeholder="e.g. USA"
                  />
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Tech Rider Document Link / URL</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterTechRider}
                    onChange={(e) => setPromoterTechRider(e.target.value)}
                    placeholder="HTTPS://DRIVE.GOOGLE.COM/FILE/... or N/A"
                  />
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Security Map Document Link / URL</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={promoterSecurityMap}
                    onChange={(e) => setPromoterSecurityMap(e.target.value)}
                    placeholder="HTTPS://DRIVE.GOOGLE.COM/FILE/... or N/A"
                  />
                </div>

                <div className="md:col-span-2 pt-1">
                  <label className="w-full p-3 rounded-xl border bg-zinc-950/60 border-zinc-850 text-zinc-400 flex items-center gap-2.5 cursor-pointer hover:border-zinc-700 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={Boolean(promoterDeferTechSpecs)}
                      onChange={(e) => setPromoterDeferTechSpecs(e.target.checked)}
                      className="w-3.5 h-3.5 accent-yellow-500 rounded border-zinc-700 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-zinc-300">DEFER DETAILED TECHNICAL SPECIFICATIONS</span>
                  </label>
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">In-House Audio, PA, Lighting & Staging Specifications</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-sans leading-relaxed"
                    value={venueProductionNotes}
                    onChange={(e) => setVenueProductionNotes(e.target.value)}
                    placeholder="List house FOH console, stage dimensions, monitor wedges, sub arrays, lighting rig details, and backline provided..."
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end font-mono">
                <button
                  type="button"
                  onClick={() => handleSavePromoterProfile()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-yellow-500/10 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Venue Specifications</span>
                </button>
              </div>
            </div>
          </V2ExpandableCard>

          {/* 3. ACCORDION TAB: Standard Offer Defaults */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Standard Offer Defaults" 
            isExpanded={expandedSection === 'profile_d'} 
            onToggle={() => toggleSection('profile_d')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="space-y-1.5 font-mono">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-yellow-400 block">Standard Booking Deal & Split Matrix</span>
                <p className="text-[10px] text-zinc-400 font-sans leading-normal">
                  Configure default payment models, door revenue splits, house nut deductions, and rider policies automatically attached to generated artist contracts and gig offers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 font-mono">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Default Deal Structure Format</label>
                  <select
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs uppercase"
                    value={dealStructure}
                    onChange={(e) => setDealStructure(e.target.value)}
                  >
                    <option value="DOOR_SPLIT">Door Split % (After Production Expenses)</option>
                    <option value="GUARANTEE_PLUS_BONUS">Fixed Guarantee + Door Bonus</option>
                    <option value="FLAT_GUARANTEE">Flat Guaranteed Payout</option>
                    <option value="VERSUS_DEAL">Versus Deal (Guarantee vs % whichever higher)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Standard Base Guarantee ($ USD)</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={defaultGuarantee}
                    onChange={(e) => setDefaultGuarantee(e.target.value)}
                    placeholder="e.g. 350"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Default Band Door Split Percentage (%)</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={defaultSplitPercentage}
                    onChange={(e) => setDefaultSplitPercentage(e.target.value)}
                    placeholder="e.g. 80"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Standard House Nut / Production Fee ($ USD)</label>
                  <input
                    type="text"
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-mono"
                    value={standardHouseNut}
                    onChange={(e) => setStandardHouseNut(e.target.value)}
                    placeholder="e.g. 150"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Merch Commission Policy</label>
                  <select
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs uppercase"
                    value={merchSplitPolicy}
                    onChange={(e) => setMerchSplitPolicy(e.target.value)}
                  >
                    <option value="0% - Band Keeps 100% of Merch Sales">0% - Band Keeps 100% of Merch Sales</option>
                    <option value="10% - Soft Goods Only">10% - Soft Goods Only (Apparel/Posters)</option>
                    <option value="15% - Standard Hall Fee (Venue Sells)">15% - Standard Hall Fee (Venue Staffs Counter)</option>
                    <option value="20% - Full Venue POS Operation">20% - Full Venue POS Operation</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Hospitality, Buyouts & Curfew Terms</label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-yellow-500 text-xs font-sans leading-relaxed"
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    placeholder="e.g. Includes 2 hot meal buyouts ($25/each), 2 cases water, 1 case local beer. Strict 11:30 PM sound curfew."
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end font-mono">
                <button
                  type="button"
                  onClick={() => handleSavePromoterProfile()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-yellow-500/10 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Offer Defaults</span>
                </button>
              </div>
            </div>
          </V2ExpandableCard>

          {/* 4. ACCORDION TAB: Genre & Booking Preferences */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Genre & Booking Preferences" 
            isExpanded={expandedSection === 'profile_e'} 
            onToggle={() => toggleSection('profile_e')}
          >
            <div className="p-5 space-y-6 text-left">
              
              {/* TARGET BOOKING RADIUS & SCOPE */}
              <div className="space-y-3 font-mono">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-yellow-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  Booking Scope & Talent Routing Priorities
                </span>
                <p className="text-[10px] text-zinc-400 font-sans">
                  Select your primary booking priorities to optimize automated routing recommendations and tour package proposals.
                </p>

                <div className="flex flex-wrap gap-2 pt-1 font-mono">
                  {[
                    'Local Support & Openers',
                    'Regional Touring Packages',
                    'National Co-Headliners',
                    'International Festival Routing',
                    'All-Ages Community Showcases',
                    'Late-Night 21+ Club Shows'
                  ].map((scope, idx) => {
                    const selected = targetBookingScopes.includes(scope);
                    return (
                      <button
                        key={`scope-${idx}`}
                        type="button"
                        onClick={() => toggleBookingScope(scope)}
                        className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-yellow-950/20 border-yellow-500/40 text-yellow-400 shadow shadow-yellow-500/20'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-400'
                        }`}
                      >
                        {selected ? '●' : '○'} {scope}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GENRE TAXONOMY MATRIX (MATCHING ONBOARDING FORM) */}
              <div className="space-y-3 pt-3 border-t border-zinc-900/70 font-mono">
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsPromoterGenresExpanded(!isPromoterGenresExpanded)}
                >
                  <div>
                    <label className="block text-[9.5px] font-mono tracking-wider text-yellow-500 font-bold uppercase cursor-pointer">
                      Genre Taxonomy Matrix ({promoterGenres.length} Selected)
                    </label>
                    <div className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5">
                      [ SELECT PRIMARY SONIC CLUSTERS FOR BOOKING & ROUTING DISPATCH ]
                    </div>
                  </div>
                  <span className="text-zinc-500 text-[10px] group-hover:text-yellow-500 transition-colors">
                    {isPromoterGenresExpanded ? '▼ [ COLLAPSE ]' : '▶ [ EXPAND ]'}
                  </span>
                </div>

                {isPromoterGenresExpanded && (
                  <div className="mt-3 space-y-3">
                    {GENRE_CLUSTERS.map((cluster, clusterIdx) => (
                      <div key={`promoter-settings-cluster-${clusterIdx}-${cluster.name}`} className="bg-zinc-950/50 border border-zinc-850/80 rounded-xl p-3">
                        <div className="text-[8.5px] font-mono font-bold text-zinc-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                          <span>{cluster.name}</span>
                          <span className="text-zinc-600 text-[8px]">
                            {cluster.genres.filter(g => promoterGenres.includes(g)).length} Active
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cluster.genres.map((genre, gIdx) => {
                            const isSelected = promoterGenres.includes(genre);
                            return (
                              <button
                                key={`promoter-settings-cluster-${clusterIdx}-genre-${gIdx}-${genre}`}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  togglePromoterGenre(genre);
                                }}
                                className={`text-[8.5px] font-mono px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.25)] font-bold'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                                }`}
                              >
                                {genre}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-3 font-mono">
                  <input
                    type="text"
                    className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-yellow-500 text-xs"
                    placeholder="Add custom musical subgenre affinity..."
                    value={newGenreInput}
                    onChange={(e) => setNewGenreInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomPromoterGenre()}
                  />
                  <button
                    type="button"
                    onClick={addCustomPromoterGenre}
                    className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Genre</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end font-mono">
                <button
                  type="button"
                  onClick={() => handleSavePromoterProfile()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-yellow-500/10 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Booking Preferences</span>
                </button>
              </div>

            </div>
          </V2ExpandableCard>
        </div>
      </div>

      {/* WORKSPACE MANAGEMENT GROUP */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Workspace Management</h3>
        </div>

        <div className="space-y-3">
          {/* 5. ACCORDION TAB: Collaborator Team & Roster */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Team Members & Roles" 
            isExpanded={expandedSection === 'team'} 
            onToggle={() => toggleSection('team')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 flex-wrap gap-4">
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-wider text-lime-400 font-bold">Group Seat Capacity & Roster</h4>
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
                      <div className="w-8 h-8 rounded-full bg-lime-950/40 border border-lime-500/20 text-lime-300 flex items-center justify-center text-xs font-black">
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
                        <option value="CHIEF OPERATOR / PROMOTER">CHIEF OPERATOR / PROMOTER</option>
                        <option value="PROMOTER / CREW">PROMOTER / CREW</option>
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
                      className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-lime-500 text-xs"
                      placeholder="e.g. collaborator@soundcrew-alliance.net"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleInvite}
                      className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    >
                      Issue Seat Invite
                    </button>
                  </div>
                </div>
              )}
            </div>
          </V2ExpandableCard>

          {/* 6. ACCORDION TAB: Payout Accounts */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Payout Accounts" 
            isExpanded={expandedSection === 'profile_f'} 
            onToggle={() => toggleSection('profile_f')}
          >
            <div className="p-5 space-y-6 text-left">
              <StripeConnectPayoutSection
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                triggerNotification={(msg) => showLocalToast(msg)}
                showLocalToast={showLocalToast}
                role="promoter"
                theme="green"
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
            </div>
          </V2ExpandableCard>

          {/* 7. ACCORDION TAB: Hardware Workstations & Tablet Setup */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Ticketing & POS Integrations" 
            isExpanded={expandedSection === 'tools'} 
            onToggle={() => toggleSection('tools')}
          >
            <div className="bg-[#090b0e] border-t border-zinc-900/60 p-0">
              <SettingsView
                portalType="promoter"
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
                activeBandName="Promoter Active Group"
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
              <div className="p-4 border-t border-zinc-900 bg-black/25">
                <PromoterSettings 
                  ticketingEventId="demo-sandbox" 
                  triggerNotification={showLocalToast} 
                />
              </div>
            </div>
          </V2ExpandableCard>

          {/* 8. ACCORDION TAB: Subscription & Billing */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Subscription & Billing" 
            isExpanded={expandedSection === 'billing'} 
            onToggle={() => toggleSection('billing')}
          >
            {!showSubscriptionTiers ? (
              <div className="p-5 space-y-4 text-left font-mono bg-zinc-950/60 border-t border-zinc-900">
                <div className="border border-[#36ff00]/40 bg-zinc-950/95 hover:bg-zinc-900/90 p-5 rounded-xl flex flex-col gap-4 text-center transition-all duration-300 relative overflow-hidden shadow-[0_0_15px_rgba(54,255,0,0.2)]">
                  {/* Subtle glowing accent overlay */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/20 via-[#36ff00]/40 to-purple-800/20" />
                  
                  <div className="flex items-center justify-center gap-2 border-b border-zinc-900 pb-3 w-full">
                    <span className="text-xs">💳</span>
                    <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest">[ SUBSCRIPTIONS & ACCOUNT STATUS ]</h4>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4 font-mono text-center w-full">
                    <div className="space-y-2 max-w-xl mx-auto">
                      <p className="text-[11px] text-zinc-300 leading-relaxed uppercase">
                        STATUS: <span className="text-[#00ffcc] font-black underline bg-[#00ffcc]/10 px-2 py-0.5 rounded ml-1 border border-[#00ffcc]/20">LIFETIME FREE ACCESS ACTIVE</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 font-sans leading-normal">
                        Promoters managing up to TWO (2) active venues or stages are 100% free for life. Adding 3 or more properties will automatically prompt a subscription upgrade. Our tiers are designed to keep the underground circuit fair—we support independent venue spaces for free and scale pricing only as operations expand.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSubscriptionTiers(true)}
                      className="px-6 py-3 border border-emerald-500/50 hover:border-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/65 text-emerald-300 hover:text-white text-[9.5px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-emerald-950/10 shrink-0 whitespace-nowrap min-h-[44px] flex items-center justify-center rounded-xl mx-auto"
                    >
                      [ VIEW SUBSCRIPTION TIERS ]
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#090b0e] border-t border-zinc-900 flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionTiers(false)}
                  className="self-start px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> [ Back to Summary ]
                </button>
                <BillingSettingsView 
                  userProfile={userProfile}
                  onClose={() => setShowSubscriptionTiers(false)}
                  onNotification={showLocalToast}
                  isAccordionMode={true}
                />
              </div>
            )}
          </V2ExpandableCard>

          {/* 9. ACCORDION TAB: System Preferences */}
          <V2ExpandableCard 
            theme="yellow" 
            title="System Preferences" 
            isExpanded={expandedSection === 'system'} 
            onToggle={() => toggleSection('system')}
          >
            <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5">
              <SettingsView
                portalType="promoter"
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
                activeBandName="Promoter Active Group"
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

          {/* 10. ACCORDION TAB: Help Desk */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Help Desk" 
            isExpanded={expandedSection === 'help'} 
            onToggle={() => toggleSection('help')}
          >
            <div className="bg-[#090b0e] border-t border-zinc-900/60 p-0">
              <HelpDeskView onBack={() => {}} triggerNotification={showLocalToast} />
            </div>
          </V2ExpandableCard>
        </div>
      </div>

      {/* UTILITIES GROUP */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Utilities</h3>
        </div>

        <div className="space-y-3">
          {/* 11. ACCORDION TAB: Share Your Experience */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Share Your Experience" 
            isExpanded={expandedSection === 'experience'} 
            onToggle={() => toggleSection('experience')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="space-y-1 text-left font-mono">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-lime-400 font-bold block">
                  Add Verified Reviews & Client Feedback
                </span>
                <p className="text-[10.5px] text-zinc-400 font-sans leading-normal">
                  Publish testimonials from past tours, promoters, and label directors. These verified reviews display prominently on your portfolio tab.
                </p>
              </div>

              {/* Feedback Form */}
              <div className="bg-[#090b0e] border border-zinc-900 rounded-xl p-4 space-y-4 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Client / Reviewer Name</label>
                    <input
                      type="text"
                      className="w-full bg-black border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      placeholder="e.g. Vera Collins"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Agency / Association Title</label>
                    <input
                      type="text"
                      className="w-full bg-black border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      placeholder="e.g. Tour Manager, Necrosynth Records"
                      value={reviewerGroup}
                      onChange={(e) => setReviewerGroup(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Experience Testimonial Content</label>
                  <textarea
                    rows={3}
                    className="w-full bg-black border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs font-sans leading-relaxed"
                    placeholder="Provide the testimonial message details here..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-550 font-black">Aesthetic Rating Score:</span>
                    <div className="flex items-center gap-1 bg-black border border-zinc-900 p-1.5 rounded-lg">
                      {[1, 2, 3, 4, 5].map((val, idx) => (
                        <button
                          key={`${val}-${idx}`}
                          type="button"
                          onClick={() => setReviewScore(val)}
                          className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star className={`w-4 h-4 ${reviewScore >= val ? 'fill-lime-400 text-lime-400' : 'text-zinc-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitReview}
                    className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-lime-500/10"
                  >
                    Publish Testimonial
                  </button>
                </div>
              </div>

              {/* Active Reviews Manager */}
              <div className="space-y-3 pt-3">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Manage Published Testimonials</span>
                <div className="space-y-2 font-mono">
                  {userReviews.map((rev, idx) => (
                    <div key={`${rev.id}-${idx}`} className="p-3.5 bg-zinc-950/45 border border-zinc-900 rounded-xl flex items-start justify-between gap-4">
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white">{rev.name}</span>
                          <span className="text-[9px] text-zinc-550 uppercase font-bold">({rev.group})</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: rev.score }).map((_, i) => (
                              <Star key={`rev-star-${idx}-${i}`} className="w-3 h-3 fill-lime-400 text-lime-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10.5px] text-zinc-400 leading-normal font-sans italic">"{rev.text}"</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteReview(rev.id)}
                        className="text-zinc-650 hover:text-red-400 transition-colors p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {userReviews.length === 0 && (
                    <p className="text-[10px] italic text-zinc-550">[ No custom published reviews listed. Complete the feedback form above to seed your showcase review board. ]</p>
                  )}
                </div>
              </div>

            </div>
          </V2ExpandableCard>

          {/* 12. ACCORDION TAB: Terms of Service */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Terms of Service" 
            isExpanded={expandedSection === 'tos'} 
            onToggle={() => toggleSection('tos')}
          >
            <div className="bg-[#090b0e] border-t border-zinc-900/60 p-0">
              <TermsOfServiceView onBack={() => {}} triggerNotification={showLocalToast} />
            </div>
          </V2ExpandableCard>

        </div>
      </div>

    </div>
  );
}
