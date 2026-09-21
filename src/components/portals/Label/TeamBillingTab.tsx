import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { 
  Users, Shield, Zap, X, Trash2, Mail, CheckCircle2, Clock, 
  Globe, Upload, Disc, CreditCard, Banknote, ChevronDown, ChevronUp, ChevronRight, Lock, Settings,
  Star, MessageSquare, HelpCircle
} from 'lucide-react';
import { LABEL_BILLING_MATRIX } from '../../../config/labelBilling';
import { uploadBase64ToStorage } from '../../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import SettingsView from '../../SettingsView';
import HelpDeskView from '../../HelpDeskView';
import TermsOfServiceView from '../../TermsOfServiceView';
import StripeConnectPayoutSection from '../../StripeConnectPayoutSection';

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

interface TeamBillingTabProps {
  userProfile: UserProfile;
  setUserProfile?: (profile: UserProfile) => void;
  activeClearanceLevel?: number;
  showLocalToast?: (msg: string) => void;
  setLabelOAuthProcessor?: (proc: { id: 'stripe' | 'paypal'; name: string } | null) => void;
  setLabelOAuthStep?: (step: number) => void;
}

export default function TeamBillingTab({ 
  userProfile, 
  setUserProfile: externalSetUserProfile, 
  activeClearanceLevel = 5, 
  showLocalToast = (msg) => console.log(msg),
  setLabelOAuthProcessor: externalSetLabelOAuthProcessor,
  setLabelOAuthStep: externalSetLabelOAuthStep
}: TeamBillingTabProps) {
  // Safe local wrapper functions
  const setUserProfile = (updatedProfile: UserProfile) => {
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
  const [localBands, setLocalBands] = useState<any[]>([]);
  const [localActiveBand, setLocalActiveBand] = useState<any>({ id: 'b1', name: 'Label Default Band' });
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

  // Subscription states
  const [currentPlan, setCurrentPlan] = useState<'independent_imprint' | 'underground_syndicate' | 'sovereign_record_group'>('underground_syndicate');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Team states
  const [teamMembers, setTeamMembers] = useState(() => {
    if (userProfile?.email || userProfile?.name) {
      return [{ id: userProfile.id || 'u1', name: userProfile.name || 'Account Owner', email: userProfile.email || '', role: userProfile.role || 'OWNER / ADMIN' }];
    }
    return [];
  });

  // Local text states for inputs to prevent character lockout during typing
  const [bandRosterInput, setBandRosterInput] = useState(() => 
    Array.isArray(userProfile.label_band_roster) ? userProfile.label_band_roster.join(', ') : ''
  );
  const [subLabelsInput, setSubLabelsInput] = useState(() => 
    Array.isArray(userProfile.label_sub_labels) ? userProfile.label_sub_labels.join(', ') : ''
  );
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  // Sync inputs if userProfile updates externally
  useEffect(() => {
    const joined = Array.isArray(userProfile.label_band_roster) ? userProfile.label_band_roster.join(', ') : '';
    const cleanedJoined = bandRosterInput.split(',').map(x => x.trim()).filter(Boolean).join(', ');
    const profileJoined = Array.isArray(userProfile.label_band_roster) ? userProfile.label_band_roster.map(x => x.trim()).filter(Boolean).join(', ') : '';
    if (cleanedJoined !== profileJoined) {
      setBandRosterInput(joined);
    }
  }, [userProfile.label_band_roster]);

  useEffect(() => {
    const joined = Array.isArray(userProfile.label_sub_labels) ? userProfile.label_sub_labels.join(', ') : '';
    const cleanedJoined = subLabelsInput.split(',').map(x => x.trim()).filter(Boolean).join(', ');
    const profileJoined = Array.isArray(userProfile.label_sub_labels) ? userProfile.label_sub_labels.map(x => x.trim()).filter(Boolean).join(', ') : '';
    if (cleanedJoined !== profileJoined) {
      setSubLabelsInput(joined);
    }
  }, [userProfile.label_sub_labels]);

  const PLAN_LIMITS: Record<string, number> = {
    'independent_imprint': LABEL_BILLING_MATRIX.tiers.independent_imprint.adminSeatLimit,
    'underground_syndicate': LABEL_BILLING_MATRIX.tiers.underground_syndicate.adminSeatLimit,
    'sovereign_record_group': LABEL_BILLING_MATRIX.tiers.sovereign_record_group.adminSeatLimit
  };

  const activeTierId = userProfile?.sub_tier || currentPlan;
  const currentLimit = PLAN_LIMITS[activeTierId] || LABEL_BILLING_MATRIX.tiers.independent_imprint.adminSeatLimit;
  const occupiedSeats = teamMembers.length;
  const isLimitReached = occupiedSeats >= currentLimit;

  // Invite handling
  const handleInvite = () => {
    if (isLimitReached) return;
    if (!inviteEmail.trim()) return;
    
    const newMember = {
      id: `u${Date.now()}`,
      name: 'Pending Invite',
      email: inviteEmail,
      role: 'ROSTER COORDINATOR'
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    showLocalToast(`Invitation sent to ${inviteEmail}.`);
  };

  const handleRemove = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showLocalToast(`Team member removed from workspace.`);
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    showLocalToast(`Updated member role to ${newRole}.`);
  };

  // Profile Image Uploads
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          try {
            const compressed = await compressImage(event.target.result, 256, 256, 0.75);
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'label-avatar');
            setUserProfile({...userProfile, label_avatar: publicUrl});
            showLocalToast("Corporate avatar emblem updated successfully.");
          } catch (err) {
            console.error("Upload failed:", err);
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
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'label-banner');
            setUserProfile({...userProfile, label_banner: publicUrl});
            showLocalToast("Billboard cover banner updated successfully.");
          } catch (err) {
            console.error("Upload failed:", err);
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const plans = [
    {
      id: 'independent_imprint',
      title: LABEL_BILLING_MATRIX.tiers.independent_imprint.name,
      price: billingCycle === 'monthly' ? `$${LABEL_BILLING_MATRIX.tiers.independent_imprint.monthlyPrice} / MONTH` : `$${LABEL_BILLING_MATRIX.tiers.independent_imprint.annualMonthlyPrice} / MONTH`,
      annualSubtitle: billingCycle === 'annual' ? `(BILLED ANNUALLY AT $${LABEL_BILLING_MATRIX.tiers.independent_imprint.annualTotalPrice.toFixed(2)} / YR)` : '',
      details: `Includes up to ${LABEL_BILLING_MATRIX.tiers.independent_imprint.adminSeatLimit} secure workspace seats, ${LABEL_BILLING_MATRIX.tiers.independent_imprint.rosterArtistLimit} active roster artists, and core distribution tools.`,
    },
    {
      id: 'underground_syndicate',
      title: LABEL_BILLING_MATRIX.tiers.underground_syndicate.name,
      price: billingCycle === 'monthly' ? `$${LABEL_BILLING_MATRIX.tiers.underground_syndicate.monthlyPrice} / MONTH` : `$${LABEL_BILLING_MATRIX.tiers.underground_syndicate.annualMonthlyPrice} / MONTH`,
      annualSubtitle: billingCycle === 'annual' ? `(BILLED ANNUALLY AT $${LABEL_BILLING_MATRIX.tiers.underground_syndicate.annualTotalPrice.toFixed(2)} / YR)` : '',
      details: `Includes up to ${LABEL_BILLING_MATRIX.tiers.underground_syndicate.adminSeatLimit} secure workspace seats, ${LABEL_BILLING_MATRIX.tiers.underground_syndicate.rosterArtistLimit} active roster artists, and roster accounting analytics.`,
    },
    {
      id: 'sovereign_record_group',
      title: LABEL_BILLING_MATRIX.tiers.sovereign_record_group.name,
      price: billingCycle === 'monthly' ? `$${LABEL_BILLING_MATRIX.tiers.sovereign_record_group.monthlyPrice} / MONTH` : `$${LABEL_BILLING_MATRIX.tiers.sovereign_record_group.annualMonthlyPrice} / MONTH`,
      annualSubtitle: billingCycle === 'annual' ? `(BILLED ANNUALLY AT $${LABEL_BILLING_MATRIX.tiers.sovereign_record_group.annualTotalPrice.toFixed(2)} / YR)` : '',
      details: `Unlimited workspace seats, unlimited active roster artists, sub-label clearance, priority geo-targeting, and bulk distro exports.`,
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-6">
      
      {/* PROFILE SETTINGS GROUP */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Profile settings</h3>
        </div>

        <div className="space-y-3">
          {/* 1. ACCORDION TAB: Label Profile & Media */}
          <V2ExpandableCard 
            theme="orange" 
            title="Label Profile & Media" 
            isExpanded={expandedSection === 'profile_ab'} 
            onToggle={() => toggleSection('profile_ab')}
          >
        <div className="p-5 space-y-8 text-left">
                
                {/* SECTION A: MEDIA ASSETS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-orange-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                    Section A: Corporate Media Assets
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Avatar / Logo */}
                    <div className="space-y-3 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Corporate Emblem / Avatar Logo</span>
                      <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                        {userProfile.label_avatar ? (
                          <>
                            <img 
                              src={userProfile.label_avatar} 
                              alt="Av" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setUserProfile({...userProfile, label_avatar: ''});
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                              title="Remove logo"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <Globe className="w-10 h-10 text-zinc-650" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('label-avatar-uploader-acc') as HTMLInputElement;
                          input?.click();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[10px] font-mono text-[#f97316] uppercase hover:brightness-110 transition-all cursor-pointer font-bold"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Logo (PNG/JPG)
                      </button>
                      <input 
                        id="label-avatar-uploader-acc"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLocalImageUpload} 
                      />
                    </div>

                    {/* Cover Picture / Banner */}
                    <div className="space-y-3 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start font-bold">Cover Banner / Billboard Artwork</span>
                      <div className="relative group w-full h-24 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center shadow-md">
                        {userProfile.label_banner ? (
                          <>
                            <img 
                              src={userProfile.label_banner} 
                              alt="Cov" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setUserProfile({...userProfile, label_banner: ''});
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                              title="Remove cover"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-zinc-650 gap-1">
                            <Disc className="w-8 h-8 opacity-40 animate-spin" style={{ animationDuration: '10s' }} />
                            <span className="text-[8px] font-mono">[ NO BANNER LOADED ]</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('label-cover-uploader-acc') as HTMLInputElement;
                          input?.click();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded text-[10px] font-mono text-[#f97316] uppercase hover:brightness-110 transition-all cursor-pointer font-bold"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Banner (Aspect 16:9)
                      </button>
                      <input 
                        id="label-cover-uploader-acc"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLocalCoverImageUpload} 
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-zinc-900/60" />

                {/* SECTION B: IDENTITY & ROSTER CONFIG */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-orange-400 font-bold border-b border-zinc-900 pb-2">
                    Section B: Corporate Profile & Artist Roster
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Corporate Entity Name</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs uppercase"
                        value={userProfile.label_company_name || ''}
                        onChange={(e) => setUserProfile({...userProfile, label_company_name: e.target.value.toUpperCase()})}
                        placeholder="e.g. SLAM CORP RECORDS"
                      />
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">URL Namespace Slug</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs lowercase"
                        value={userProfile.label_url_slug || ''}
                        onChange={(e) => setUserProfile({...userProfile, label_url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        placeholder="e.g. slamcorp"
                      />
                    </div>
                    
                    <div className="space-y-1 text-left md:col-span-2">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500">Primary Contact Route (Email)</label>
                      <input
                        type="email"
                        className="w-full bg-[#090b0e]/40 border border-zinc-900/60 text-zinc-650 px-3 py-2 rounded font-mono text-xs"
                        value={userProfile?.email || ''}
                        disabled
                      />
                      <p className="text-[8px] font-mono text-zinc-550 mt-1">[!] Security credential locked dynamically.</p>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Distribution HQ</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={userProfile.label_headquarters || ''}
                        onChange={(e) => setUserProfile({...userProfile, label_headquarters: e.target.value})}
                        placeholder="e.g. New York, NY"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Founded Year</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={userProfile.label_founded_year || ''}
                        onChange={(e) => setUserProfile({...userProfile, label_founded_year: e.target.value})}
                        placeholder="e.g. 2018"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Roster Count</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={userProfile.label_roster_count || ''}
                        onChange={(e) => setUserProfile({...userProfile, label_roster_count: e.target.value})}
                        placeholder="e.g. 14"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Security Pin</label>
                      <input
                        type="password"
                        maxLength={4}
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs tracking-widest"
                        value={userProfile.label_security_pin || ''}
                        onChange={(e) => setUserProfile({...userProfile, label_security_pin: e.target.value.replace(/\D/g, '')})}
                        placeholder="****"
                      />
                    </div>

                    <div className="space-y-1 text-left md:col-span-2">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Default Band Roster (Comma-Separated)</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={bandRosterInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBandRosterInput(val);
                          setUserProfile({
                            ...userProfile,
                            label_band_roster: val.split(',').map(x => x.trim()).filter(Boolean)
                          });
                        }}
                        placeholder="e.g. TOMB MOLD, SANGUISUGABOGG, GOREGRIND SICKNESS"
                      />
                      <p className="text-[8.5px] text-zinc-550 font-mono">Input active roster keys separated by commas for internal mapping.</p>
                    </div>

                    <div className="space-y-1 text-left md:col-span-2">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Associated Imprints & Sub-Labels</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={subLabelsInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubLabelsInput(val);
                          setUserProfile({
                            ...userProfile,
                            label_sub_labels: val.split(',').map(x => x.trim()).filter(Boolean)
                          });
                        }}
                        placeholder="e.g. Gore Grind Imprints, Special Series"
                      />
                    </div>
                  </div>
                </div>

        </div>
      </V2ExpandableCard>

      {/* 2. ACCORDION TAB: Logistics & Legal */}
      <V2ExpandableCard 
        theme="orange" 
        title="Logistics & Legal" 
        isExpanded={expandedSection === 'profile_c'} 
        onToggle={() => toggleSection('profile_c')}
      >
        <div className="p-5 space-y-8 text-left">

                {/* SECTION C: LOGISTICS & OPERATIONS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-orange-400 font-bold border-b border-zinc-900 pb-2">
                    Section C: Merchant Logistics & Legal Registry
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Legal Entity Classification</label>
                      <select
                        value={userProfile.label_legal_entity_type || 'LLC'}
                        onChange={(e) => setUserProfile({ ...userProfile, label_legal_entity_type: e.target.value })}
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                      >
                        {['SOLE_PROPRIETORSHIP', 'LLC', 'C_CORP', 'S_CORP', 'PARTNERSHIP'].map((t, tIdx) => (
                          <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-orange-400 font-bold">Tax Compliance ID / EIN</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={userProfile.label_tax_registration_number || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, label_tax_registration_number: e.target.value })}
                        placeholder="e.g. 12-3456789"
                      />
                    </div>

                    <div className="space-y-1 text-left md:col-span-2">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Global Distro / Fulfillment Model</label>
                      <select
                        value={userProfile.label_master_distro_model || 'IN_HOUSE_FULFILLMENT'}
                        onChange={(e) => setUserProfile({ ...userProfile, label_master_distro_model: e.target.value })}
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs select-none"
                      >
                        {['IN_HOUSE_FULFILLMENT', 'THIRD_PARTY_DISTRIBUTION', 'PRINT_ON_DEMAND_DROP_SHIP'].map((t, tIdx) => (
                          <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Shipping Origin Zip / Postal Code</label>
                      <input
                        type="text"
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                        value={userProfile.label_shipping_postal_code || ''}
                        onChange={(e) => setUserProfile({ ...userProfile, label_shipping_postal_code: e.target.value })}
                        placeholder="e.g. 90210"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Fulfillment Shipping Region</label>
                      <select
                        value={userProfile.label_shipping_country || 'US'}
                        onChange={(e) => setUserProfile({ ...userProfile, label_shipping_country: e.target.value })}
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs"
                      >
                        <option value="US" className="bg-black">United States (US)</option>
                        <option value="UK" className="bg-black">United Kingdom (UK)</option>
                        <option value="EU" className="bg-black">European Union (EU)</option>
                        <option value="CA" className="bg-black">Canada (CA)</option>
                        <option value="AU" className="bg-black">Australia (AU)</option>
                        <option value="GLOBAL" className="bg-black">Global (GLOBAL)</option>
                      </select>
                    </div>
                  </div>
                </div>

        </div>
      </V2ExpandableCard>

      {/* 3. ACCORDION TAB: Label/ Band Splits */}
      <V2ExpandableCard 
        theme="orange" 
        title="Label/ Band Splits" 
        isExpanded={expandedSection === 'profile_d'} 
        onToggle={() => toggleSection('profile_d')}
      >
        <div className="p-5 space-y-8 text-left">

                {/* SECTION D: ACQUISITIONS & CONTRACTS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-orange-400 font-bold border-b border-zinc-900 pb-2">
                    Section D: Acquisition Splitting Ledger
                  </h4>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center bg-[#090b0e] p-3 border border-zinc-900 rounded-lg">
                      <label className="text-[9.5px] uppercase font-mono tracking-widest text-orange-400 font-bold">Default Contract Split Percentage</label>
                      <div className="text-xs font-mono font-black text-zinc-200 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-900">
                        LABEL: <span className="text-orange-400">{userProfile.label_default_contract_split ?? 50}%</span> / ARTIST: <span className="text-[#00ffcc]">{100 - (userProfile.label_default_contract_split ?? 50)}%</span>
                      </div>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="w-full accent-[#f97316] cursor-pointer h-2 bg-zinc-950 rounded-lg appearance-none border border-zinc-900"
                      value={userProfile.label_default_contract_split ?? 50}
                      onChange={(e) => setUserProfile({ ...userProfile, label_default_contract_split: Number(e.target.value) })}
                    />
                    <p className="text-[8.5px] text-zinc-550 font-mono uppercase">[ DRAG TO EDIT DEFAULT SPLIT. ALL DIRECT STOREFRONT TRANSACTIONS AUTOMATICALLY ROUTED BASED ON THESE VALUES. ]</p>

                    <div className="space-y-1 text-left mt-3 pt-2">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Digital Accreditation Scheme</label>
                      <select
                        value={userProfile.label_digital_accreditation_scheme || 'LABEL_PROVIDES_INDEPENDENT_CODES'}
                        onChange={(e) => setUserProfile({ ...userProfile, label_digital_accreditation_scheme: e.target.value })}
                        className="w-full bg-[#090b0e] border border-zinc-900 text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-mono text-xs select-none"
                      >
                        {['LABEL_PROVIDES_INDEPENDENT_CODES', 'PLATFORM_GENERATES_AUTOMATICALLY'].map((t, tIdx) => (
                          <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

        </div>
      </V2ExpandableCard>

      {/* 4. ACCORDION TAB: Genre Preferences */}
      <V2ExpandableCard 
        theme="orange" 
        title="Genre Preferences" 
        isExpanded={expandedSection === 'profile_e'} 
        onToggle={() => toggleSection('profile_e')}
      >
        <div className="p-5 space-y-8 text-left">

                {/* SECTION E: TAXONOMY */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-orange-400 font-bold border-b border-zinc-900 pb-2">
                    Section E: Label's Genre Preferences
                  </h4>
                  
                  <div className="space-y-4 pt-2">
                    {[
                      {
                        name: 'CLUSTER 01: EXTREME METAL',
                        genres: ['DEATH METAL', 'SLAMMING BDM', 'BRUTAL DEATH METAL', 'BRUTAL DEATHCORE', 'TECHNICAL BDM', 'DEATH N\' ROLL', 'TECH DEATH', 'BLASTING BDM', 'GRINDCORE', 'DEATHGRIND', 'GOREGRIND/PORNOGRIND', 'THRASH METAL', 'DEATH THRASH', 'MELODIC DEATH', 'OSDM', 'DOOM', 'BLACK METAL', 'BLACKENED DEATH', 'SYMPHONIC BLACK', 'DEATHCORE', 'PROGRESSIVE DEATH']
                      },
                      {
                        name: 'CLUSTER 02: ROCK/HEAVY METAL',
                        genres: ['TRADITIONAL HEAVY METAL', 'DOOM METAL', 'STONER METAL', 'SLUDGE METAL', 'STONER ROCK', 'PROG METAL', 'POWER METAL', 'ALTERNATIVE ROCK', 'GOTHIC ROCK', 'HARD ROCK', 'NEW WAVE', 'FOLK METAL', 'AVANT-GARDE', 'DJENT', 'MATHCORE', 'MATH ROCK', 'SHOE GAZE', 'NOISE ROCK', 'INDIE ROCK', 'NU METAL']
                      },
                      {
                        name: 'CLUSTER 03: HARDCORE',
                        genres: ['TRADITIONAL HARDCORE', 'METALCORE', 'BEATDOWN', 'YOUTH CREW', 'FASTCORE', 'POST HARDCORE', 'MELODIC HARDCORE', 'SKRAMZ/SCREAMO', 'POWER VIOLENCE', 'MINCECORE']
                      },
                      {
                        name: 'CLUSTER 04: PUNK/ALTERNATIVE',
                        genres: ['PUNK ROCK', 'POP PUNK', 'MATH ROCK', 'MIDWEST EMO', 'SKATE PUNK', 'MELODIC PUNK', 'INDIE PUNK', 'POST PUNK', 'GRUNGE']
                      },
                      {
                        name: 'CLUSTER 05: INDUSTRIAL/EDM',
                        genres: ['EBM', 'SYNTHWAVE', 'DARKWAVE/COLD WAVE', 'AGGROTECH/TERROR EBM', 'TECHNO', 'INDUSTRIAL METAL', 'DUBSTEP', 'DRUM & BASS', 'GABBER/HARDSTYLE', 'BREAKCORE', 'HARSH NOISE WALL', 'WITCH HOUSE']
                      },
                      {
                        name: 'CLUSTER 06: HIP HOP/RAP',
                        genres: ['UNDERGROUND RAP', 'TRAP', 'BOOM BAP', 'PHONK', 'DRILL', 'CLOUD RAP', 'EXPERIMENTAL', 'GRIME']
                      }
                    ].map((cluster, idx) => {
                      const currentGenres = userProfile.label_genres || [];
                      const activeInCluster = cluster.genres.filter(genre => currentGenres.includes(genre));
                      const isExpanded = !!expandedClusters[cluster.name];
                      
                      return (
                        <div key={`${cluster.name}-${idx}`} className="p-3 bg-[#090b0e] border border-zinc-900 rounded-lg space-y-3">
                          <button
                            type="button"
                            onClick={() => setExpandedClusters(prev => {
                              const wasExpanded = !!prev[cluster.name];
                              return { [cluster.name]: !wasExpanded };
                            })}
                            className="w-full flex items-center justify-between text-left select-none group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[8.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                                {cluster.name}
                              </span>
                              {activeInCluster.length > 0 && (
                                <span className="text-[8px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full leading-none">
                                  {activeInCluster.length} ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                              {isExpanded ? '[ COLLAPSE ]' : '[ EXPAND ]'}
                            </span>
                          </button>
                          
                          {isExpanded && (
                            <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                              {cluster.genres.map((genre, idx) => {
                                const isActive = currentGenres.includes(genre);
                                return (
                                  <button
                                    key={`${genre}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                      const updated = isActive 
                                        ? currentGenres.filter(x => x !== genre) 
                                        : [...currentGenres, genre];
                                      setUserProfile({ ...userProfile, label_genres: updated });
                                    }}
                                    className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded border transition-all ${
                                      isActive 
                                        ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-sm shadow-orange-500/10'
                                        : 'bg-black border-zinc-900 text-zinc-550 hover:border-zinc-850 hover:text-zinc-400'
                                    }`}
                                  >
                                    {genre}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

        </div>
      </V2ExpandableCard>
        </div>
      </div>

      {/* WORKSPACE MANAGEMENT GROUP */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Workspace Management</h3>
        </div>
        <div className="space-y-3">

      {/* Team Members & Roles */}
      <V2ExpandableCard 
        theme="orange" 
        title="Team Members & Roles" 
        isExpanded={expandedSection === 'team'} 
        onToggle={() => toggleSection('team')}
      >
        <div className="p-5 space-y-8 text-left">
                
                {/* Limit stats */}
                <div className="space-y-2 pb-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-400 font-mono tracking-widest uppercase">
                      WORKSPACE SEATS OCCUPIED: {occupiedSeats} OF {currentLimit === 99999 ? 'UNLIMITED' : currentLimit} USED
                    </span>
                    <span className="text-[10px] font-mono text-[#00ffcc] font-bold">
                      {currentLimit === 99999 ? 'UNLIMITED' : Math.max(0, currentLimit - occupiedSeats)} AVAILABLE
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-zinc-900">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-[#00ffcc] transition-all duration-500"
                      style={{ width: currentLimit === 99999 ? '100%' : `${Math.min(100, (occupiedSeats / currentLimit) * 100)}%` }}
                    />
                  </div>
                </div>

                <hr className="border-zinc-900/60" />

                {/* Invite Console */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-[#00ffcc] font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Workspace Onboarding Terminal
                  </h4>
                  
                  {isLimitReached ? (
                    <div className="bg-red-950/20 border border-red-500/30 p-4 rounded flex items-start gap-3">
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-500 font-mono text-[10px] font-black tracking-widest uppercase">
                          SEAT ALLOCATION LIMIT REACHED — UPGRADE SUBSCRIPTION TIER TO EXPAND WORKSPACE
                        </p>
                        <p className="text-red-500/70 font-mono text-[9px] mt-1">
                          You are currently utilizing {occupiedSeats} out of {currentLimit} available seats.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <div className="w-full flex-1 text-left">
                        <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-bold">
                          INVITE NEW TEAM MEMBER BY EMAIL
                        </label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="new.operative@domain.com"
                          className="w-full bg-[#090b0e] border border-zinc-900 focus:border-[#00ffcc] text-white font-mono text-xs rounded p-3 outline-none"
                        />
                      </div>
                      <button
                        onClick={handleInvite}
                        disabled={!inviteEmail.trim()}
                        className="w-full sm:w-auto self-end py-3 px-6 bg-[#00ffcc] hover:bg-[#0fd9ae] text-black font-mono text-[10px] font-black tracking-widest uppercase rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer font-bold"
                      >
                        SEND SECURE WORKSPACE INVITATION
                      </button>
                    </div>
                  )}
                </div>

                <hr className="border-zinc-900/60" />

                {/* Personnel Grids */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-[#00ffcc] font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Active Team Personnel Directory
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {teamMembers.map((member, idx) => (
                      <div key={`${member.id}-${idx}`} className="bg-[#090b0e] border border-zinc-900 rounded-xl p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h5 className="text-xs font-bold text-white font-mono uppercase tracking-wider">{member?.name}</h5>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">{member.email}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-400 font-mono text-xs font-bold uppercase">
                            {member?.name.charAt(0)}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-bold text-left">
                              ROLE PERMISSIONS
                            </label>
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              className="w-full bg-black border border-zinc-900 text-[#00ffcc] font-mono text-[10px] uppercase font-bold tracking-wider rounded p-2.5 focus:outline-none focus:border-[#00ffcc] cursor-pointer"
                            >
                              <option value="OWNER / ADMIN">OWNER / ADMIN</option>
                              <option value="FULFILLMENT / LOGISTICS">FULFILLMENT / LOGISTICS</option>
                              <option value="ROSTER COORDINATOR">ROSTER COORDINATOR</option>
                            </select>
                          </div>
                          
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="w-full py-2 border border-zinc-900 hover:border-red-500/50 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 font-mono text-[9px] font-black tracking-widest uppercase rounded transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            REMOVE FROM WORKSPACE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
      </V2ExpandableCard>

      {/* 5. ACCORDION TAB: Payout Accounts */}
      <V2ExpandableCard 
        theme="orange" 
        title="Payout Accounts" 
        isExpanded={expandedSection === 'profile_f'} 
        onToggle={() => toggleSection('profile_f')}
      >
        <div className="p-5 space-y-8 text-left">

                {/* SECTION F: MERCHANT KEYS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-orange-400 font-bold border-b border-zinc-900 pb-2">
                    Section F: Merchant Payout Accounts & OAuth Connections
                  </h4>
                  
                  {activeClearanceLevel < 5 && (
                    <div className="p-3 bg-red-950/15 border border-red-950/40 rounded-xl text-red-400 text-[10px] leading-relaxed font-sans text-left">
                      ⚠️ <strong>FINANCIAL ACCOUNT LOCKOUT:</strong> Level 5 Owner privilege is required to disconnect or update merchant payout routers. Level {activeClearanceLevel} has view-only telemetry rights over billing parameters.
                    </div>
                  )}
                  
                  <div className="space-y-4 pt-2">
                    {/* Stripe Area */}
                    <StripeConnectPayoutSection
                      userProfile={userProfile}
                      setUserProfile={setUserProfile}
                      triggerNotification={(msg) => showLocalToast(msg)}
                      showLocalToast={showLocalToast}
                      role="label"
                      theme="orange"
                      clearanceLevel={activeClearanceLevel}
                    />

                    {/* PayPal Area */}
                    <div className="p-4 bg-[#090b0e] border border-zinc-900 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-sky-400" />
                          <span className="text-[10px] font-mono text-white font-bold uppercase">PayPal Business Wallet</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-mono text-[8.5px] font-bold ${
                          userProfile.label_paypal_connected && userProfile.paypal_email
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-zinc-950 text-zinc-550 border border-zinc-900'
                        }`}>
                          {userProfile.label_paypal_connected && userProfile.paypal_email ? '● LIVE SYNCED' : '○ DISCONNECTED'}
                        </span>
                      </div>

                      {userProfile.paypal_email ? (
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between bg-black border border-zinc-900 p-3 rounded-lg text-left">
                            <div className="min-w-0">
                              <span className="text-[8.5px] font-mono text-zinc-550 uppercase tracking-wider block">Connected PayPal Account</span>
                              <span className="text-xs font-mono text-sky-400 font-bold truncate block">{userProfile.paypal_email}</span>
                            </div>
                            <button
                              type="button"
                              disabled={activeClearanceLevel < 5}
                              onClick={() => {
                                setUserProfile({
                                  ...userProfile,
                                  paypal_email: '',
                                  label_paypal_connected: false
                                });
                                showLocalToast("PayPal Account disconnected.");
                              }}
                              className="text-[9.5px] font-mono text-red-400 hover:text-red-300 font-bold px-2.5 py-1.5 bg-red-950/20 border border-red-950/40 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={activeClearanceLevel < 5}
                            onClick={() => {
                              setLabelOAuthProcessor({ id: 'paypal', name: 'PayPal' });
                              setLabelOAuthStep(0);
                            }}
                            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold uppercase text-[9.5px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-md shadow-sky-500/10 disabled:bg-zinc-800 disabled:text-zinc-550 disabled:cursor-not-allowed disabled:shadow-none"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Connect PayPal via OAuth
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Deferred Checkbox */}
                    <div className="flex items-center gap-2.5 p-1 text-left">
                      <input
                        id="payment-deferred-switch-acc"
                        type="checkbox"
                        checked={!!userProfile.label_setup_payment_later}
                        onChange={(e) => setUserProfile({ ...userProfile, label_setup_payment_later: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#f97316] bg-black border-zinc-900 cursor-pointer"
                      />
                      <label htmlFor="payment-deferred-switch-acc" className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider cursor-pointer">
                        Deferred: setup direct checking gateways at payout phase
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-900/40">
                  <span className="text-[9px] font-mono text-orange-400 uppercase bg-orange-500/5 border border-orange-500/20 px-3 py-1.5 rounded animate-pulse">
                    ✨ CONSOLE AUTO-SAVES STATE ACTIVELY
                  </span>
                </div>

              </div>
      </V2ExpandableCard>

      {/* Hardware & Point of Sale */}
      <V2ExpandableCard 
        theme="orange" 
        title="Hardware & Point of Sale" 
        isExpanded={expandedSection === 'tools'} 
        onToggle={() => toggleSection('tools')}
      >
        <div className="bg-[#090b0e] border-t border-zinc-900/60 p-0">
          <SettingsView
            portalType="label"
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
            activeBandName="Label Default Band"
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
            onlyShowSection="tools"
          />
        </div>
      </V2ExpandableCard>

      {/* Subscription & Billing */}
      <V2ExpandableCard 
        theme="orange" 
        title="Subscription & Billing" 
        isExpanded={expandedSection === 'billing'} 
        onToggle={() => toggleSection('billing')}
      >
        <div className="p-5 space-y-8 text-left">
                
                {/* Plan Info Banner */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-4">
                    <div>
                      <h4 className="text-xs uppercase font-mono tracking-widest text-yellow-400 font-bold">
                        ACTIVE PLAN: {LABEL_BILLING_MATRIX.tiers[currentPlan].name.toUpperCase()} ({billingCycle === 'monthly' ? `$${LABEL_BILLING_MATRIX.tiers[currentPlan].monthlyPrice}/MO` : `$${LABEL_BILLING_MATRIX.tiers[currentPlan].annualMonthlyPrice}/MO`})
                      </h4>
                      <p className="text-[10px] text-zinc-550 font-mono tracking-wider uppercase mt-1">
                        Billing Cycle: {billingCycle === 'monthly' ? '1st of every month' : 'Annually'} • Next invoice: Oct 1, 2026
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-[#090b0e] px-3 py-1.5 rounded border border-zinc-900">
                        <Clock className="w-3.5 h-3.5 text-[#00ffcc]" />
                        <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest">{LABEL_BILLING_MATRIX.trialPeriodDays}-DAY FREE TRIAL ACTIVE</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#090b0e] px-3 py-1.5 rounded border border-zinc-900">
                        <Shield className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest">Secure Billing Portal</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-zinc-400 font-mono tracking-widest uppercase">
                        ACTIVE ROSTER ARTISTS: 14 OF {LABEL_BILLING_MATRIX.tiers[currentPlan].rosterArtistLimit === 99999 ? 'UNLIMITED' : LABEL_BILLING_MATRIX.tiers[currentPlan].rosterArtistLimit} USED
                      </span>
                      <span className="text-[10px] font-mono text-[#00ffcc] font-bold">
                        {LABEL_BILLING_MATRIX.tiers[currentPlan].rosterArtistLimit === 99999 ? 'UNLIMITED' : Math.max(0, LABEL_BILLING_MATRIX.tiers[currentPlan].rosterArtistLimit - 14)} AVAILABLE
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-[#00ffcc] transition-all duration-500"
                        style={{ width: LABEL_BILLING_MATRIX.tiers[currentPlan].rosterArtistLimit === 99999 ? '14%' : `${Math.min(100, (14 / LABEL_BILLING_MATRIX.tiers[currentPlan].rosterArtistLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-zinc-900/60" />

                {/* Billing Toggle Switch */}
                <div className="flex justify-center pt-2 pb-4">
                  <div className="flex items-center bg-[#000000] rounded-xl border border-[#1A1A1A] p-1 font-mono text-[10px] tracking-widest font-bold uppercase overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 py-2 rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-[#1A1A1A] text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      [ MONTHLY BILLING ]
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-4 py-2 rounded-lg transition-all ${billingCycle === 'annual' ? 'bg-[#1A1A1A] text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      [ ANNUAL BILLING (SAVE 20%) ]
                    </button>
                  </div>
                </div>

                {/* Plan pricing grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {plans.map((plan, idx) => {
                    const isCurrent = currentPlan === plan.id;
                    return (
                      <div key={`${plan.id}-${idx}`} className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-5 flex flex-col justify-between h-full hover:border-zinc-700 transition-all">
                        <div className="space-y-4 mb-6 text-left">
                          <div className="flex justify-between items-start">
                            <h5 className="text-xs font-black text-white font-mono uppercase tracking-widest">{plan.title}</h5>
                            {isCurrent && (
                              <Zap className="w-4 h-4 text-[#00ffcc] animate-pulse" />
                            )}
                          </div>
                          <div>
                            <div className="text-amber-400 font-mono font-bold text-xs">{plan.price}</div>
                            {plan.annualSubtitle && (
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 tracking-widest uppercase">{plan.annualSubtitle}</div>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono tracking-wider leading-relaxed">
                            {plan.details}
                          </p>
                        </div>
                        
                        <button
                          disabled={isCurrent}
                          type="button"
                          onClick={() => {
                            setCurrentPlan(plan.id as any);
                            showLocalToast(`Switched plan to ${plan.title.toUpperCase()}`);
                          }}
                          className={`w-full py-2.5 px-4 font-mono text-[9px] font-black tracking-widest rounded transition-all uppercase flex items-center justify-center gap-2 cursor-pointer ${
                            isCurrent 
                              ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30 shadow-[0_0_15px_rgba(0,255,204,0.15)] cursor-default' 
                              : 'bg-white text-black hover:bg-zinc-200 border border-transparent'
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              CURRENT ACTIVE PLAN
                            </>
                          ) : (
                            '[ ACTIVATE PLAN CHANGE ]'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

              </div>
      </V2ExpandableCard>

      {/* SYSTEM PREFERENCES */}
      <V2ExpandableCard 
        theme="orange" 
        title="System Preferences" 
        isExpanded={expandedSection === 'system'} 
        onToggle={() => toggleSection('system')}
      >
        <div className="bg-[#090b0e] border-t border-zinc-900/60 p-5">
          <SettingsView
            portalType="label"
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
            activeBandName="Label Default Band"
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

      {/* HELP DESK */}
      <V2ExpandableCard 
        theme="orange" 
        title="Help Desk" 
        isExpanded={expandedSection === 'help'} 
        onToggle={() => toggleSection('help')}
      >
        <div className="bg-[#090b0e] border-t border-zinc-900/60">
          <HelpDeskView onBack={() => {}} triggerNotification={showLocalToast} portalType="label" />
        </div>
      </V2ExpandableCard>
        </div>
      </div>

      {/* UTILITIES GROUP */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">Utilities</h3>
        </div>
        <div className="space-y-3">

      {/* SHARE YOUR EXPERIENCE */}
      <V2ExpandableCard 
        theme="orange" 
        title="Share Your Experience" 
        isExpanded={expandedSection === 'experience'} 
        onToggle={() => toggleSection('experience')}
      >
        <div className="bg-[#0c0d12] border-t border-zinc-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">Leave a Review</h4>
            </div>
            <span className="text-[8.5px] font-mono tracking-widest text-[#f97316] font-extrabold bg-[#f97316]/10 px-2 py-0.5 rounded border border-[#f97316]/20 uppercase">
              Live Link Enabled
            </span>
          </div>

          {reviewLeft ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-center space-y-1">
                <span className="text-xl">🌟</span>
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Review Submitted Successfully!</h5>
                <p className="text-[10.5px] text-zinc-400 font-mono">
                  Thank you for supporting Nexus Core. Your live review is dynamically integrated and featured on the Plans Page!
                </p>
              </div>

              {/* List of user reviews saved locally */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {userReviews && userReviews.length > 0 && (
                  <div className="space-y-2 text-left">
                    <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest">My Recent Reviews ({userReviews.length})</span>
                    {userReviews.map((rev: any, idx) => (
                      <div key={`${rev.id}-${idx}`} className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={`label-rev-star-${rev.id || idx}-${i}`} className={`w-3 h-3 ${rev.rating > i ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                            ))}
                          </div>
                          <span className="text-[8.5px] font-mono text-zinc-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-300 pr-1 italic">"{rev.text}"</p>
                        <div className="text-[9.5px] font-mono text-[#f97316] flex items-center justify-between pt-0.5 border-t border-zinc-850">
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
                Help independent record labels manage and monitor operations securely. Your review instantly publishes to the plans/billing showcase.
              </p>

              {/* Stars Selector Row */}
              <div className="space-y-1 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Tap Star Rating</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star, idx) => (
                      <button
                        key={`${star}-${idx}`}
                        type="button"
                        onClick={() => setReviewScore(star)}
                        className="p-1 text-orange-500 transition-transform active:scale-90 hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${reviewScore >= star ? 'fill-orange-500 text-orange-500' : 'text-zinc-700'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10.5px] text-orange-400 font-mono font-bold">
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
                  placeholder="e.g. Saved our split billing in Berlin, fantastic roster coordinator..."
                  className="w-full h-20 bg-zinc-950/85 hover:bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-orange-500/60 rounded-xl p-3 text-xs text-white font-sans focus:outline-none transition resize-none placeholder-zinc-600"
                />
              </div>

              {/* Two-column Input row (Your Name & Your Label) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Your Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500/50 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none transition font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Your Label</label>
                  <input
                    type="text"
                    value={reviewerGroup}
                    onChange={(e) => setReviewerGroup(e.target.value)}
                    placeholder="e.g. Horizon Records"
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500/50 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none transition font-sans"
                  />
                </div>
              </div>

              {/* Submission CTA */}
              <button
                type="button"
                onClick={() => {
                  const finalComment = reviewText.trim() || "Full-featured label hub. Love the split management and multi-artist billing!";
                  const finalName = reviewerName.trim() || userProfile?.name || "Label Administrator";
                  const finalGroup = reviewerGroup.trim() || "Independent Imprint";

                  const newReviewObj = {
                    id: Math.random().toString(36).substring(2, 9),
                    rating: reviewScore,
                    text: finalComment,
                    name: finalName,
                    group: finalGroup,
                    created_at: new Date().toISOString()
                  };

                  const existing = localStorage.getItem('nexus_core_user_reviews');
                  let reviews = [];
                  if (existing) {
                    try { reviews = JSON.parse(existing); } catch (e) {}
                  }
                  reviews.unshift(newReviewObj);
                  localStorage.setItem('nexus_core_user_reviews', JSON.stringify(reviews));
                  setUserReviews(reviews);

                  setReviewLeft(true);
                  showLocalToast('⭐ Live experience review submitted and registered!');
                }}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400 rounded-xl font-mono text-[10.5px] font-black uppercase tracking-widest leading-none shadow-md shadow-orange-500/10 active:scale-95 transition-all text-center cursor-pointer"
              >
                Submit Live Experience Feedback ★
              </button>
            </div>
          )}
        </div>
      </V2ExpandableCard>

      {/* TERMS OF SERVICE */}
      <V2ExpandableCard 
        theme="orange" 
        title="Terms of Service" 
        isExpanded={expandedSection === 'tos'} 
        onToggle={() => toggleSection('tos')}
      >
        <div className="bg-[#090b0e] border-t border-zinc-900/60">
          <TermsOfServiceView onBack={() => {}} triggerNotification={showLocalToast} />
        </div>
      </V2ExpandableCard>
        </div>
      </div>

    </div>
  );
}
