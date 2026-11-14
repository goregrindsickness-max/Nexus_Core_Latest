import React, { useState, useEffect, useMemo } from 'react';
import { Check, Sparkles, UserPlus, UserCheck, PlusCircle, X, ChevronRight } from 'lucide-react';
import { FOLLOW_EVENT_NAME, getScopedFollowsMap } from '../../utils/followSyncService';
import { isMiguelNameOrProfile } from '../social/utils/profileUtils';

export interface WelcomeStarterCardProps {
  userProfile?: any;
  feed?: any[];
  discoverProfiles?: any[];
  profileAvatarUrl?: string | null;
  profileCoverUrl?: string | null;
  profileBlurb?: string;
  onFollowBandsAction?: () => void;
  onCustomizeProfileAction?: () => void;
  onDropPostAction?: () => void;
}

export const WelcomeStarterCard: React.FC<WelcomeStarterCardProps> = ({
  userProfile,
  feed = [],
  discoverProfiles = [],
  profileAvatarUrl,
  profileCoverUrl,
  profileBlurb,
  onFollowBandsAction,
  onCustomizeProfileAction,
  onDropPostAction,
}) => {
  const userKey = useMemo(() => {
    return String(userProfile?.id || userProfile?.email || 'guest').trim().toLowerCase();
  }, [userProfile?.id, userProfile?.email]);

  const dismissStorageKey = `nexus_welcome_starter_dismissed_${userKey}`;
  const eligibleStorageKey = `nexus_welcome_starter_eligible_${userKey}`;
  const profileStepStorageKey = `nexus_welcome_starter_profile_done_${userKey}`;

  const [followTick, setFollowTick] = useState(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(dismissStorageKey) === 'true';
    } catch {
      return false;
    }
  });
  const [profileStepClicked, setProfileStepClicked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(profileStepStorageKey) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setIsDismissed(localStorage.getItem(dismissStorageKey) === 'true');
      setProfileStepClicked(localStorage.getItem(profileStepStorageKey) === 'true');
    } catch {
      // ignore storage errors
    }
  }, [dismissStorageKey, profileStepStorageKey]);

  useEffect(() => {
    const handleFollowChange = () => setFollowTick((t) => t + 1);
    const handleProfileUpdated = () => setProfileStepClicked(true);
    window.addEventListener(FOLLOW_EVENT_NAME, handleFollowChange);
    window.addEventListener('nexus_avatar_updated', handleProfileUpdated);
    window.addEventListener('nexus_cover_updated', handleProfileUpdated);
    return () => {
      window.removeEventListener(FOLLOW_EVENT_NAME, handleFollowChange);
      window.removeEventListener('nexus_avatar_updated', handleProfileUpdated);
      window.removeEventListener('nexus_cover_updated', handleProfileUpdated);
    };
  }, []);

  const followsCount = useMemo(() => {
    void followTick;
    const scopedMap = getScopedFollowsMap(userProfile?.id);
    const mapFollows = Object.values(scopedMap || {}).filter(Boolean).length;
    const profileFollowing = Array.isArray(userProfile?.following) ? userProfile.following.length : 0;
    const profileArtists = Array.isArray(userProfile?.followed_artists) ? userProfile.followed_artists.length : 0;
    const savedBands = Array.isArray(userProfile?.saved_bands) ? userProfile.saved_bands.length : 0;
    const discoverFollowed = Array.isArray(discoverProfiles)
      ? discoverProfiles.filter((p: any) => Boolean(p?.followed)).length
      : 0;
    return Math.max(mapFollows, profileFollowing, profileArtists, savedBands, discoverFollowed);
  }, [followTick, userProfile?.id, userProfile?.following, userProfile?.followed_artists, userProfile?.saved_bands, discoverProfiles]);

  const userPostsCount = useMemo(() => {
    if (!userProfile || !Array.isArray(feed)) return 0;
    const uid = String(userProfile?.id || '').trim();
    const uHandle = String(userProfile?.console_handle || userProfile?.handle || '')
      .replace(/^@+/, '')
      .trim()
      .toLowerCase();
    const uName = String(userProfile?.full_name || userProfile?.name || '').trim().toLowerCase();

    return feed.filter((post: any) => {
      if (!post) return false;
      const pUid = String(post.user_id || post.profile_id || post.author_id || post.author?.id || '').trim();
      if (uid && pUid && uid === pUid) return true;
      const pHandle = String(post.author?.handle || post.handle || post.console_handle || '')
        .replace(/^@+/, '')
        .trim()
        .toLowerCase();
      if (uHandle && uHandle !== 'user' && uHandle !== 'member' && pHandle === uHandle) return true;
      const pName = String(post.author?.name || post.authorName || '').trim().toLowerCase();
      if (uName && uName !== 'user' && uName !== 'member' && uName !== 'nexus member' && pName === uName) {
        return true;
      }
      return false;
    }).length;
  }, [feed, userProfile]);

  const hasCustomizedProfile = useMemo(() => {
    if (profileStepClicked) return true;
    const hasAvatar = Boolean(profileAvatarUrl || userProfile?.avatar_url || userProfile?.avatar);
    const hasCover = Boolean(profileCoverUrl || userProfile?.banner_url || userProfile?.cover_url);
    const rawBio = String(profileBlurb || userProfile?.bio || userProfile?.blurb || '').trim();
    const hasCustomBio =
      Boolean(rawBio) &&
      !rawBio.toLowerCase().includes('new member of the nexus core') &&
      !rawBio.toLowerCase().includes('user profile on the nexus network');
    return hasAvatar || hasCover || hasCustomBio;
  }, [profileStepClicked, profileAvatarUrl, profileCoverUrl, profileBlurb, userProfile]);

  const isEligibleBrandNewAccount = useMemo(() => {
    if (!userProfile || isMiguelNameOrProfile(userProfile)) return false;
    if (typeof window === 'undefined') return followsCount === 0 && userPostsCount === 0;
    try {
      const existingFlag = localStorage.getItem(eligibleStorageKey);
      if (existingFlag === 'true') return true;
      if (existingFlag === 'false') return false;
      const isNew = followsCount === 0 && userPostsCount === 0;
      localStorage.setItem(eligibleStorageKey, isNew ? 'true' : 'false');
      return isNew;
    } catch {
      return followsCount === 0 && userPostsCount === 0;
    }
  }, [userProfile, followsCount, userPostsCount, eligibleStorageKey]);

  const step1Done = followsCount > 0;
  const step2Done = hasCustomizedProfile;
  const step3Done = userPostsCount > 0;
  const completedCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const allCompleted = step1Done && step2Done && step3Done;

  useEffect(() => {
    if (allCompleted && !isDismissed) {
      try {
        localStorage.setItem(dismissStorageKey, 'true');
      } catch {
        // ignore storage errors
      }
      setIsDismissed(true);
    }
  }, [allCompleted, isDismissed, dismissStorageKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissStorageKey, 'true');
    } catch {
      // ignore storage errors
    }
    setIsDismissed(true);
  };

  if (isDismissed || !isEligibleBrandNewAccount || allCompleted) {
    return null;
  }

  const steps = [
    {
      id: 1,
      label: '1. Follow local bands & venues',
      sublabel: 'Populate your live stream & tour alerts',
      done: step1Done,
      icon: UserPlus,
      onClick: () => {
        if (onFollowBandsAction) {
          onFollowBandsAction();
        } else if (typeof document !== 'undefined') {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Bands, Venues"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      },
    },
    {
      id: 2,
      label: '2. Customize your profile',
      sublabel: 'Add your avatar, banner, bio & scene tags',
      done: step2Done,
      icon: UserCheck,
      onClick: () => {
        try {
          localStorage.setItem(profileStepStorageKey, 'true');
        } catch {
          // ignore
        }
        setProfileStepClicked(true);
        onCustomizeProfileAction?.();
      },
    },
    {
      id: 3,
      label: '3. Drop a post or flyer',
      sublabel: 'Share music, show flyers, photos or gear',
      done: step3Done,
      icon: PlusCircle,
      onClick: () => {
        onDropPostAction?.();
      },
    },
  ];

  return (
    <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#0e0b16] via-[#09090e] to-[#071517] border border-violet-500/40 shadow-[0_0_24px_rgba(139,92,246,0.16)] p-3.5 sm:p-4 text-left relative overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Welcome to Nexus Core
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-400/30">
                {completedCount}/3
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono truncate">
              Complete your 3-step starter checklist to unlock your scene feed
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss Welcome to Nexus Core checklist"
          title="Dismiss checklist"
          className="w-6 h-6 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {steps.map((step) => {
          const IconComp = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              onClick={step.onClick}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer group ${
                step.done
                  ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900/75 hover:bg-zinc-900 border-zinc-800/90 hover:border-teal-400/50 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-teal-300 group-hover:bg-violet-500/30'
                  }`}
                >
                  {step.done ? <Check className="w-3 h-3 stroke-[3]" /> : <IconComp className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[11px] font-bold leading-tight truncate ${
                      step.done ? 'line-through text-emerald-300/80' : 'text-white group-hover:text-teal-300'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[9px] text-zinc-400 truncate mt-0.5">{step.sublabel}</div>
                </div>
              </div>
              {!step.done && (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WelcomeStarterCard;
