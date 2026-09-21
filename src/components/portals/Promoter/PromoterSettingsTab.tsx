import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { 
  Users, Shield, Zap, X, Trash2, Mail, CheckCircle2, Clock, 
  Globe, Upload, Disc, CreditCard, Banknote, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Lock, Settings,
  Star, MessageSquare, HelpCircle, Palette, Briefcase, Heart, Code, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import SettingsView from '../../SettingsView';
import HelpDeskView from '../../HelpDeskView';
import TermsOfServiceView from '../../TermsOfServiceView';
import PromoterSettings from './PromoterSettings';
import BillingSettingsView from '../../BillingSettingsView';
import StripeConnectPayoutSection from '../../StripeConnectPayoutSection';
import { getSupabase, uploadBase64ToStorage } from '../../../supabase';

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

  // Promoter Profile states linked directly to metadata
  const [businessName, setBusinessName] = useState(userProfile.promoter_metadata?.business_name || '');
  const [bookingEmail, setBookingEmail] = useState(userProfile.promoter_metadata?.booking_email || '');
  const [baseLocation, setBaseLocation] = useState(userProfile.promoter_metadata?.base_location || '');
  const [portfolioLink, setPortfolioLink] = useState(userProfile.promoter_metadata?.portfolio_link || '');
  const [bio, setBio] = useState(userProfile.promoter_metadata?.bio || '');
  const [dayRate, setDayRate] = useState(userProfile.promoter_metadata?.day_rate || '350');
  const [pricingNotes, setPricingNotes] = useState(userProfile.promoter_metadata?.pricing_notes || '');
  const [primaryCategory, setPrimaryCategory] = useState(userProfile.promoter_metadata?.primary_category || 'Artist/Designer');
  const [secondaryCategory, setSecondaryCategory] = useState(userProfile.promoter_metadata?.secondary_category || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(userProfile.promoter_metadata?.availability_status || 'Available');
  const [quickBroadcast, setQuickBroadcast] = useState(userProfile.promoter_metadata?.quick_broadcast || 'Ready for assignments.');
  const [rateType, setRateType] = useState<'day' | 'project'>('day');

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

  // Gear & specialty local states
  const [gearTags, setGearTags] = useState<string[]>(Array.isArray(userProfile.promoter_metadata?.gear_tags) ? userProfile.promoter_metadata.gear_tags : (userProfile.promoter_metadata?.gear_tags ? [userProfile.promoter_metadata.gear_tags as string] : ['Sony Alpha 7S III', 'Adobe Promoter Cloud', 'DJI Ronin SC2']));
  const [newGearTag, setNewGearTag] = useState('');
  const [genreTags, setGenreTags] = useState<string[]>(Array.isArray(userProfile.promoter_metadata?.genre_tags) ? userProfile.promoter_metadata.genre_tags : (userProfile.promoter_metadata?.genre_tags ? [userProfile.promoter_metadata.genre_tags as string] : ['Grindcore', 'Darkwave', 'Hardcore']));
  const [newGenreInput, setNewGenreInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(Array.isArray(userProfile.promoter_metadata?.selected_skills) ? userProfile.promoter_metadata.selected_skills : (userProfile.promoter_metadata?.selected_skills ? [userProfile.promoter_metadata.selected_skills as string] : ['Flyer Art', 'Logo Design', 'Merch Prepress']));

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
    if (userProfile.promoter_metadata) {
      setBusinessName(userProfile.promoter_metadata.business_name || '');
      setBookingEmail(userProfile.promoter_metadata.booking_email || '');
      setBaseLocation(userProfile.promoter_metadata.base_location || '');
      setPortfolioLink(userProfile.promoter_metadata.portfolio_link || '');
      setBio(userProfile.promoter_metadata.bio || '');
      setDayRate(String(userProfile.promoter_metadata.day_rate || '350'));
      setPricingNotes(userProfile.promoter_metadata.pricing_notes || '');
      setPrimaryCategory(userProfile.promoter_metadata.primary_category || 'Artist/Designer');
      setSecondaryCategory(userProfile.promoter_metadata.secondary_category || '');
      setAvailabilityStatus(userProfile.promoter_metadata.availability_status || 'Available');
      setQuickBroadcast(userProfile.promoter_metadata.quick_broadcast || 'Ready for assignments.');
      setGearTags(Array.isArray(userProfile.promoter_metadata.gear_tags) ? userProfile.promoter_metadata.gear_tags : (userProfile.promoter_metadata.gear_tags ? [userProfile.promoter_metadata.gear_tags as string] : ['Sony Alpha 7S III', 'Adobe Promoter Cloud', 'DJI Ronin SC2']));
      setGenreTags(Array.isArray(userProfile.promoter_metadata.genre_tags) ? userProfile.promoter_metadata.genre_tags : (userProfile.promoter_metadata.genre_tags ? [userProfile.promoter_metadata.genre_tags as string] : ['Grindcore', 'Darkwave', 'Hardcore']));
      setSelectedSkills(Array.isArray(userProfile.promoter_metadata.selected_skills) ? userProfile.promoter_metadata.selected_skills : (userProfile.promoter_metadata.selected_skills ? [userProfile.promoter_metadata.selected_skills as string] : ['Flyer Art', 'Logo Design', 'Merch Prepress']));
    }
  }, [userProfile]);

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
            setUserProfile((prev: any) => ({ ...prev, promoter_logo: publicUrl }));
            // Persist to Supabase
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              await supabase.from('profiles').update({ promoter_logo: publicUrl }).eq('id', userProfile.id);
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
            setUserProfile((prev: any) => ({ ...prev, promoter_cover_image: publicUrl }));
            // Persist to Supabase
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              await supabase.from('profiles').update({ promoter_cover_image: publicUrl }).eq('id', userProfile.id);
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
    setUserProfile((prev: any) => {
      const updatedMetadata = {
        ...prev.promoter_metadata,
        business_name: overrides?.business_name !== undefined ? overrides.business_name : businessName,
        booking_email: overrides?.booking_email !== undefined ? overrides.booking_email : bookingEmail,
        base_location: overrides?.base_location !== undefined ? overrides.base_location : baseLocation,
        portfolio_link: overrides?.portfolio_link !== undefined ? overrides.portfolio_link : portfolioLink,
        bio: overrides?.bio !== undefined ? overrides.bio : bio,
        day_rate: String(overrides?.day_rate !== undefined ? overrides.day_rate : dayRate),
        pricing_notes: overrides?.pricing_notes !== undefined ? overrides.pricing_notes : pricingNotes,
        primary_category: overrides?.primary_category !== undefined ? overrides.primary_category : primaryCategory,
        secondary_category: overrides?.secondary_category !== undefined ? overrides.secondary_category : secondaryCategory,
        availability_status: overrides?.availability_status !== undefined ? overrides.availability_status : availabilityStatus,
        quick_broadcast: overrides?.quick_broadcast !== undefined ? overrides.quick_broadcast : quickBroadcast,
        gear_tags: overrides?.gear_tags !== undefined ? overrides.gear_tags : gearTags,
        genre_tags: overrides?.genre_tags !== undefined ? overrides.genre_tags : genreTags,
        selected_skills: overrides?.selected_skills !== undefined ? overrides.selected_skills : selectedSkills,
        payout_method: overrides?.payout_method !== undefined ? overrides.payout_method : payoutMethod,
        stripe_account_id: overrides?.stripe_account_id !== undefined ? overrides.stripe_account_id : stripeAccountId,
        paypal_email: overrides?.paypal_email !== undefined ? overrides.paypal_email : paypalEmail
      };

      const supabase = getSupabase();
      if (supabase && prev?.id) {
        supabase.from('profiles').update({ promoter_metadata: updatedMetadata }).eq('id', prev.id).then(({error}) => {
          if (error) console.error("Promoter DB save failed:", error);
        });
      }

      return {
        ...prev,
        promoter_metadata: updatedMetadata
      };
    });

    showLocalToast("✓ Promoter portfolio specifications saved successfully.");
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
    handleSavePromoterProfile({ gear_tags: updated });
  };

  const removeGearItem = (item: string) => {
    const updated = gearTags.filter(x => x !== item);
    setGearTags(updated);
    handleSavePromoterProfile({ gear_tags: updated });
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
    handleSavePromoterProfile({ genre_tags: updated });
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
    handleSavePromoterProfile({ genre_tags: updated });
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
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Profile Photo / Studio Emblem</span>
                    <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                      {userProfile.promoter_logo || userProfile.avatar_url ? (
                        <>
                          <img 
                            src={userProfile.promoter_logo || userProfile.avatar_url} 
                            alt="Av" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserProfile({...userProfile, promoter_logo: ''});
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove photo"
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
                      {userProfile.promoter_cover_image || userProfile.banner_url ? (
                        <>
                          <img 
                            src={userProfile.promoter_cover_image || userProfile.banner_url} 
                            alt="Cov" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserProfile({...userProfile, promoter_cover_image: ''});
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove cover"
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

              {/* SECTION B: IDENTITY & METADATA */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-lime-400 font-bold border-b border-zinc-900 pb-2">
                  Section B: Studio Identity & Profile Variables
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Studio / Brand Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. OBITUARY DESIGNS CO"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Primary Booking Contact</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      placeholder="e.g. art@obituarydesigns.com"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Base Location City</label>
                    <input
                      type="text"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      value={baseLocation}
                      onChange={(e) => setBaseLocation(e.target.value)}
                      placeholder="e.g. Portland, OR"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Portfolio Link URL</label>
                    <input
                      type="url"
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      placeholder="e.g. https://behance.net/obituary"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Biography Tagline Summary</label>
                    <textarea
                      rows={2}
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs font-sans"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Give a brief summary of your promoter background, tour experience, and subcultural specialties..."
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSavePromoterProfile()}
                    className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                  >
                    Save Identity Specifications
                  </button>
                </div>
              </div>

            </div>
          </V2ExpandableCard>

          {/* 2. ACCORDION TAB: Dry-Hire Gear & Specifications */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Venue Profiles & Specs" 
            isExpanded={expandedSection === 'profile_c'} 
            onToggle={() => toggleSection('profile_c')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-lime-400 block">Tech Specifications Inventory</span>
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
                  className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-lime-500 text-xs"
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

          {/* 3. ACCORDION TAB: Promoter Rates & Splits */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Standard Offer Defaults" 
            isExpanded={expandedSection === 'profile_d'} 
            onToggle={() => toggleSection('profile_d')}
          >
            <div className="p-5 space-y-6 text-left">
              <div className="space-y-1.5 font-mono">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-lime-400 block">Base Rate Matrix Configuration</span>
                <p className="text-[10px] text-zinc-400 font-sans leading-normal">
                  Configure your standard pricing structures, invoicing preferences, and security authorization for processing agency co-op payouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 font-mono">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Standard Pricing Tier Format</label>
                  <select
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs uppercase"
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
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs font-mono"
                    value={dayRate}
                    onChange={(e) => setDayRate(e.target.value)}
                    placeholder="e.g. 350"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Pricing Conditions & Expense Coverage Notes</label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs font-sans leading-relaxed"
                    value={pricingNotes}
                    onChange={(e) => setPricingNotes(e.target.value)}
                    placeholder="e.g. Travel and hotel accommodations must be covered for gigs outside base location. Day rate includes standard post-production editing files."
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end font-mono">
                <button
                  type="button"
                  onClick={() => handleSavePromoterProfile()}
                  className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-lime-500/10"
                >
                  Save Rates Configuration
                </button>
              </div>
            </div>
          </V2ExpandableCard>

          {/* 4. ACCORDION TAB: Subcultural Genres & Skills */}
          <V2ExpandableCard 
            theme="yellow" 
            title="Genre & Booking Preferences" 
            isExpanded={expandedSection === 'profile_e'} 
            onToggle={() => toggleSection('profile_e')}
          >
            <div className="p-5 space-y-6 text-left">
              
              {/* PRIMARY & SECONDARY SPECIALTIES */}
              <div className="space-y-4">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-lime-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                  Primary & Secondary Placements
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-400">Primary Placement Category</label>
                    <select
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      value={primaryCategory}
                      onChange={(e) => {
                        setPrimaryCategory(e.target.value);
                        handleSavePromoterProfile({ primary_category: e.target.value });
                      }}
                    >
                      <option value="Artist/Designer">Artist / Graphic Designer</option>
                      <option value="Sound Engineer/Recording">Sound Engineer / Recording</option>
                      <option value="Media/Photography">Media / Photo / Video / Social</option>
                      <option value="Session Musician/Techs">Session Musician / Stage Tech</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase text-zinc-400">Secondary Specialty (Optional)</label>
                    <select
                      className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-lime-500 text-xs"
                      value={secondaryCategory}
                      onChange={(e) => {
                        setSecondaryCategory(e.target.value);
                        handleSavePromoterProfile({ secondary_category: e.target.value });
                      }}
                    >
                      <option value="">None Selected</option>
                      <option value="Artist/Designer">Artist / Graphic Designer</option>
                      <option value="Sound Engineer/Recording">Sound Engineer / Recording</option>
                      <option value="Media/Photography">Media / Photo / Video / Social</option>
                      <option value="Session Musician/Techs">Session Musician / Stage Tech</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* COMMUINITY GENRES */}
              <div className="space-y-3 pt-3">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-yellow-400 font-bold border-b border-zinc-900 pb-2 block">
                  Subcultural Scene Affinity Presets
                </span>
                <p className="text-[10px] text-zinc-400 font-sans">Select which underground scene styles fit your aesthetic best to filter targeted placement invitations.</p>

                <div className="flex flex-wrap gap-2 pt-2 font-mono">
                  {[
                    'Grindcore', 'Hardcore', 'Death Metal', 'Crust Punk', 'Doom Metal', 
                    'Sludge', 'Darkwave', 'Synthwave', 'Post-Punk', 'Indie Rock'
                  ].map((genre, idx) => {
                    const selected = genreTags.includes(genre);
                    return (
                      <button
                        key={`${genre}-${idx}`}
                        type="button"
                        onClick={() => toggleGenreTag(genre)}
                        className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          selected 
                            ? 'bg-yellow-950/20 border-yellow-500/40 text-yellow-400 shadow shadow-yellow-500/20' 
                            : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-400'
                        }`}
                      >
                        {selected ? '●' : '○'} {genre}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-3 font-mono">
                  <input
                    type="text"
                    className="flex-grow bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-lime-500 text-xs"
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
