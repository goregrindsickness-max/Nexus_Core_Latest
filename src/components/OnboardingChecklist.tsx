import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Check,
  Sparkles,
  Camera,
  Compass,
  Bell,
  MessageSquarePlus,
  Calendar,
  Building2,
  Disc,
  Minus,
  X,
  ChevronRight,
  ChevronDown,
  Award,
  ShieldCheck,
  Cake,
} from 'lucide-react';
import { FOLLOW_EVENT_NAME } from '../utils/followSyncService';
import {
  BIRTHDAY_UPDATED_EVENT,
  hasValidBirthday,
  loadBirthdayPrefsFromStorage,
  resolveEffectiveBirthdayProfile,
} from '../utils/birthdayUtils';

export type ChecklistRoleCategory = 'fan' | 'industry';

export type ChecklistActionType =
  | 'none'
  | 'edit_profile'
  | 'edit_birthday'
  | 'select_circles'
  | 'enable_push'
  | 'create_post'
  | 'rsvp_show'
  | 'claim_entity'
  | 'publish_release';

export interface OnboardingChecklistStep {
  stepNumber: number;
  id: string;
  label: string;
  sublabel: string;
  completed: boolean;
  roleCategory: 'shared' | ChecklistRoleCategory;
  actionType: ChecklistActionType;
  ctaLabel?: string;
}

export interface OnboardingEvaluationInput {
  role?: string;
  portalRole?: string;
  userProfile?: any;
  avatar_url?: string | null;
  cover_url?: string | null;
  subscribedCircles?: string[];
  pushEnabled?: boolean;
  birthday_month?: number | null;
  birthday_day?: number | null;
  hasFirstPostOrReply?: boolean;
  hasBookmarkedOrRsvpedShow?: boolean;
  hasCreatedOrClaimedEntity?: boolean;
  hasPublishedFlyerTrackOrMerch?: boolean;
}

export interface ChecklistProgressSummary {
  completedCount: number;
  totalCount: number;
  percentage: number;
  pillLabel: string;
  isComplete: boolean;
  unlockedBadge: string | null;
}

export interface ChecklistPersistedState {
  minimized: boolean;
  dismissed: boolean;
  scenePioneerUnlocked: boolean;
  autoCollapsedOnComplete: boolean;
}

export const SCENE_PIONEER_BADGE_LABEL = 'Scene Pioneer';
export const ONBOARDING_STATE_CHANGED_EVENT = 'nexus_onboarding_checklist_updated';
export const SCENE_PIONEER_UNLOCKED_EVENT = 'nexus_scene_pioneer_unlocked';

const INDUSTRY_ROLE_TOKENS = new Set([
  'industry',
  'industry_pro',
  'industry pro',
  'artist',
  'band',
  'artist/band',
  'band / artist',
  'venue',
  'promoter',
  'event promoter',
  'label',
  'record label',
  'creative',
  'creative pro',
]);

const FAN_ROLE_TOKENS = new Set([
  'fan',
  'fan_only',
  'fan listener',
  'listener',
]);

export function resolveUserChecklistKey(userProfile?: any): string {
  const raw = String(
    userProfile?.id || userProfile?.email || userProfile?.handle || userProfile?.console_handle || 'guest'
  )
    .trim()
    .toLowerCase();
  return raw || 'guest';
}

export function getChecklistStorageKey(userKey: string): string {
  const normalized = String(userKey || 'guest').trim().toLowerCase() || 'guest';
  return `nexus_onboarding_checklist_state_${normalized}`;
}

export function isIndustryChecklistRole(role?: string, userProfile?: any): boolean {
  const explicitRole = String(role || '').trim().toLowerCase();
  if (explicitRole && FAN_ROLE_TOKENS.has(explicitRole)) {
    return false;
  }
  if (explicitRole && INDUSTRY_ROLE_TOKENS.has(explicitRole)) {
    return true;
  }

  const profileAccountType = String(userProfile?.account_type || '').trim().toLowerCase();
  const profileWorkspace = String(userProfile?.active_workspace || '').trim().toLowerCase();
  const profileRole = String(userProfile?.role || userProfile?.portalRole || '').trim().toLowerCase();

  if (FAN_ROLE_TOKENS.has(profileAccountType) && !INDUSTRY_ROLE_TOKENS.has(profileWorkspace)) {
    return false;
  }

  for (const candidate of [explicitRole, profileWorkspace, profileAccountType, profileRole]) {
    if (!candidate) continue;
    if (INDUSTRY_ROLE_TOKENS.has(candidate)) return true;
    if (
      candidate.includes('band') ||
      candidate.includes('artist') ||
      candidate.includes('venue') ||
      candidate.includes('promoter') ||
      candidate.includes('label') ||
      candidate.includes('creative') ||
      candidate.includes('industry')
    ) {
      return true;
    }
  }

  return false;
}

export function resolveOnboardingChecklistSteps(
  input: OnboardingEvaluationInput
): OnboardingChecklistStep[] {
  const effectiveRole = input.role ?? input.portalRole;
  const isIndustry = isIndustryChecklistRole(effectiveRole, input.userProfile);

  const resolvedAvatar =
    input.avatar_url ??
    input.userProfile?.avatar_url ??
    input.userProfile?.avatar ??
    null;
  const resolvedCover =
    input.cover_url ??
    input.userProfile?.cover_url ??
    input.userProfile?.banner_url ??
    input.userProfile?.banner ??
    null;

  const step2Completed = Boolean(
    typeof resolvedAvatar === 'string' &&
      resolvedAvatar.trim().length > 0 &&
      typeof resolvedCover === 'string' &&
      resolvedCover.trim().length > 0
  );

  const circlesList = Array.isArray(input.subscribedCircles)
    ? input.subscribedCircles.filter((c) => typeof c === 'string' && c.trim().length > 0)
    : [];
  const step3Completed = circlesList.length >= 3;

  const step4Completed = Boolean(input.pushEnabled);

  const resolvedBdayMonth =
    input.birthday_month !== undefined
      ? input.birthday_month
      : input.userProfile?.birthday_month;
  const resolvedBdayDay =
    input.birthday_day !== undefined
      ? input.birthday_day
      : input.userProfile?.birthday_day;
  const step5BirthdayCompleted = hasValidBirthday({
    birthday_month: resolvedBdayMonth,
    birthday_day: resolvedBdayDay,
  });

  const sharedSteps: OnboardingChecklistStep[] = [
    {
      stepNumber: 1,
      id: 'account_created',
      label: 'Account Created',
      sublabel: 'Your Nexus Core identity is initialized',
      completed: true, // Step 1 is always pre-checked for endowed progress
      roleCategory: 'shared',
      actionType: 'none',
      ctaLabel: 'Completed',
    },
    {
      stepNumber: 2,
      id: 'upload_avatar_cover',
      label: 'Upload Profile Avatar & Cover Banner',
      sublabel: step2Completed
        ? 'Avatar and cover banner uploaded'
        : 'Add both your profile photo and cover banner',
      completed: step2Completed,
      roleCategory: 'shared',
      actionType: 'edit_profile',
      ctaLabel: 'Edit Profile',
    },
    {
      stepNumber: 3,
      id: 'subscribe_circles',
      label: 'Subscribe to 3+ Circles/Scenes',
      sublabel: step3Completed
        ? `${circlesList.length} scenes subscribed`
        : `${circlesList.length}/3 subscribed — pick your underground scenes`,
      completed: step3Completed,
      roleCategory: 'shared',
      actionType: 'select_circles',
      ctaLabel: 'Choose Circles',
    },
    {
      stepNumber: 4,
      id: 'enable_push',
      label: 'Enable Push Notifications for DMs & Show Alerts',
      sublabel: step4Completed
        ? 'Push alerts active for DMs & show drops'
        : 'Get instant alerts for pit RSVPs, tour dates & DMs',
      completed: step4Completed,
      roleCategory: 'shared',
      actionType: 'enable_push',
      ctaLabel: 'Enable Alerts',
    },
    {
      stepNumber: 5,
      id: 'add_birthday',
      label: 'Add Your Birthday (Month & Day) for Scene Shoutouts',
      sublabel: step5BirthdayCompleted
        ? 'Month & day set for scene birthday shoutouts'
        : 'Optional Month & Day only — no birth year asked',
      completed: step5BirthdayCompleted,
      roleCategory: 'shared',
      actionType: 'edit_birthday',
      ctaLabel: 'Add Birthday',
    },
  ];

  if (isIndustry) {
    const step6IndustryDone = Boolean(input.hasCreatedOrClaimedEntity);
    const step7IndustryDone = Boolean(input.hasPublishedFlyerTrackOrMerch);

    return [
      ...sharedSteps,
      {
        stepNumber: 6,
        id: 'industry_create_claim_entity',
        label: 'Create or claim a Band/Venue/Brand entity page',
        sublabel: step6IndustryDone
          ? 'Official entity workspace connected'
          : 'Set up your Band, Venue, Promoter, Label, or Creative page',
        completed: step6IndustryDone,
        roleCategory: 'industry',
        actionType: 'claim_entity',
        ctaLabel: 'Claim Page',
      },
      {
        stepNumber: 7,
        id: 'industry_publish_flyer_track_merch',
        label: 'Publish your first show flyer, track/clip, or merch listing',
        sublabel: step7IndustryDone
          ? 'First release, flyer, or merch drop live'
          : 'Post a show flyer, streamable track/clip, or merch item',
        completed: step7IndustryDone,
        roleCategory: 'industry',
        actionType: 'publish_release',
        ctaLabel: 'Publish Drop',
      },
    ];
  }

  const step6FanDone = Boolean(input.hasFirstPostOrReply);
  const step7FanDone = Boolean(input.hasBookmarkedOrRsvpedShow);

  return [
    ...sharedSteps,
    {
      stepNumber: 6,
      id: 'fan_first_post_or_reply',
      label: 'Make your first post or forum reply',
      sublabel: step6FanDone
        ? 'First community post or reply published'
        : 'Drop a post in the feed or reply to a Circle thread',
      completed: step6FanDone,
      roleCategory: 'fan',
      actionType: 'create_post',
      ctaLabel: 'Create Post',
    },
    {
      stepNumber: 7,
      id: 'fan_bookmark_rsvp_show',
      label: 'Bookmark/RSVP to an upcoming show',
      sublabel: step7FanDone
        ? 'Show RSVP locked in on your radar'
        : 'RSVP to an upcoming gig or tour stop near you',
      completed: step7FanDone,
      roleCategory: 'fan',
      actionType: 'rsvp_show',
      ctaLabel: 'Browse Shows',
    },
  ];
}

export function calculateChecklistSummary(
  steps: OnboardingChecklistStep[]
): ChecklistProgressSummary {
  const totalCount = steps.length || 7;
  const completedCount = steps.filter((s) => Boolean(s.completed)).length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount >= totalCount && totalCount > 0;
  return {
    completedCount,
    totalCount,
    percentage,
    pillLabel: `Profile Setup • ${completedCount}/${totalCount} (${percentage}%)`,
    isComplete,
    unlockedBadge: isComplete ? SCENE_PIONEER_BADGE_LABEL : null,
  };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function getDefaultStorage(customStorage?: StorageLike): StorageLike | null {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getChecklistPersistedState(
  userKey = 'guest',
  customStorage?: StorageLike
): ChecklistPersistedState {
  const storage = getDefaultStorage(customStorage);
  const fallback: ChecklistPersistedState = {
    minimized: false,
    dismissed: false,
    scenePioneerUnlocked: false,
    autoCollapsedOnComplete: false,
  };
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(getChecklistStorageKey(userKey));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      minimized: Boolean(parsed?.minimized),
      dismissed: Boolean(parsed?.dismissed),
      scenePioneerUnlocked: Boolean(parsed?.scenePioneerUnlocked),
      autoCollapsedOnComplete: Boolean(parsed?.autoCollapsedOnComplete),
    };
  } catch {
    return fallback;
  }
}

export function saveChecklistPersistedState(
  userKey: string,
  nextState: Partial<ChecklistPersistedState>,
  customStorage?: StorageLike
): ChecklistPersistedState {
  const storage = getDefaultStorage(customStorage);
  const current = getChecklistPersistedState(userKey, customStorage);
  const merged: ChecklistPersistedState = {
    ...current,
    ...nextState,
  };
  if (storage) {
    try {
      storage.setItem(getChecklistStorageKey(userKey), JSON.stringify(merged));
    } catch {
      // ignore storage errors
    }
  }
  if (typeof window !== 'undefined' && !customStorage) {
    window.dispatchEvent(
      new CustomEvent(ONBOARDING_STATE_CHANGED_EVENT, {
        detail: { userKey, state: merged },
      })
    );
  }
  return merged;
}

export function setChecklistMinimized(
  userKey: string,
  minimized: boolean,
  customStorage?: StorageLike
): ChecklistPersistedState {
  return saveChecklistPersistedState(userKey, { minimized }, customStorage);
}

export function dismissChecklistConfirmed(
  userKey: string,
  customStorage?: StorageLike
): ChecklistPersistedState {
  return saveChecklistPersistedState(userKey, { dismissed: true }, customStorage);
}

export function setShowSetupChecklist(
  userKey: string,
  show: boolean,
  customStorage?: StorageLike
): ChecklistPersistedState {
  return saveChecklistPersistedState(
    userKey,
    {
      dismissed: !show,
      minimized: show ? false : getChecklistPersistedState(userKey, customStorage).minimized,
    },
    customStorage
  );
}

export function syncCompletionAndPioneerBadge(
  userKey: string,
  summary: ChecklistProgressSummary,
  customStorage?: StorageLike
): ChecklistPersistedState {
  const current = getChecklistPersistedState(userKey, customStorage);
  if (summary.isComplete && (!current.scenePioneerUnlocked || !current.autoCollapsedOnComplete)) {
    const updated = saveChecklistPersistedState(
      userKey,
      {
        scenePioneerUnlocked: true,
        autoCollapsedOnComplete: true,
        minimized: true,
      },
      customStorage
    );
    if (typeof window !== 'undefined' && !customStorage) {
      window.dispatchEvent(
        new CustomEvent(SCENE_PIONEER_UNLOCKED_EVENT, {
          detail: {
            userKey,
            badge: SCENE_PIONEER_BADGE_LABEL,
          },
        })
      );
    }
    return updated;
  }
  return current;
}

export function hasScenePioneerBadge(
  userProfile?: any,
  customStorage?: StorageLike
): boolean {
  const badges: string[] = [
    ...(Array.isArray(userProfile?.badges) ? userProfile.badges : []),
    ...(Array.isArray(userProfile?.customBadges) ? userProfile.customBadges : []),
  ];
  if (
    badges.some((b) =>
      String(b || '')
        .toLowerCase()
        .includes('scene pioneer')
    )
  ) {
    return true;
  }
  const userKey = resolveUserChecklistKey(userProfile);
  const persisted = getChecklistPersistedState(userKey, customStorage);
  return Boolean(persisted.scenePioneerUnlocked);
}

export interface OnboardingChecklistProps {
  userProfile?: any;
  setUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  portalRole?: string;
  activeBand?: any;
  bands?: any[];
  feed?: any[];
  clips?: any[];
  shopItems?: any[];
  liveEvents?: any[];
  discoverProfiles?: any[];
  profileAvatarUrl?: string | null;
  profileCoverUrl?: string | null;
  profileBlurb?: string;
  subscribedCircles?: string[];
  prefPushNotifications?: boolean;
  setPrefPushNotifications?: (val: boolean) => void;
  onFollowBandsAction?: () => void;
  onCustomizeProfileAction?: () => void;
  onOpenProfileSettingsAction?: (section?: string) => void;
  onDropPostAction?: () => void;
  onSelectCirclesAction?: () => void;
  onEnablePushAction?: () => void;
  onRsvpShowAction?: () => void;
  onClaimEntityAction?: () => void;
  onPublishReleaseAction?: () => void;
  triggerNotification?: (msg: string) => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  userProfile,
  setUserProfile,
  portalRole,
  activeBand,
  bands = [],
  feed = [],
  clips = [],
  shopItems = [],
  liveEvents = [],
  profileAvatarUrl,
  profileCoverUrl,
  subscribedCircles: propSubscribedCircles,
  prefPushNotifications,
  setPrefPushNotifications,
  onCustomizeProfileAction,
  onOpenProfileSettingsAction,
  onDropPostAction,
  onSelectCirclesAction,
  onEnablePushAction,
  onRsvpShowAction,
  onClaimEntityAction,
  onPublishReleaseAction,
  triggerNotification,
}) => {
  const userKey = useMemo(() => resolveUserChecklistKey(userProfile), [userProfile]);

  const [persistedState, setPersistedState] = useState<ChecklistPersistedState>(() =>
    getChecklistPersistedState(userKey)
  );
  const [confirmDismissOpen, setConfirmDismissOpen] = useState(false);
  const [liveSignalTick, setLiveSignalTick] = useState(0);
  const [liveAvatarOverride, setLiveAvatarOverride] = useState<string | null>(null);
  const [liveCoverOverride, setLiveCoverOverride] = useState<string | null>(null);
  const [manualStepCompletions, setManualStepCompletions] = useState<Record<string, boolean>>({});

  // Sync persisted state when userKey or external Settings toggle changes
  useEffect(() => {
    setPersistedState(getChecklistPersistedState(userKey));
  }, [userKey]);

  useEffect(() => {
    const refresh = () => {
      setPersistedState(getChecklistPersistedState(userKey));
      setLiveSignalTick((t) => t + 1);
    };
    const handleAvatar = (e: any) => {
      const url = e?.detail?.avatarUrl || e?.detail?.avatar_url || e?.detail?.avatar;
      if (url) setLiveAvatarOverride(url);
      setLiveSignalTick((t) => t + 1);
    };
    const handleCover = (e: any) => {
      const url =
        e?.detail?.coverUrl ||
        e?.detail?.cover_url ||
        e?.detail?.banner_url ||
        e?.detail?.bannerUrl;
      if (url) setLiveCoverOverride(url);
      setLiveSignalTick((t) => t + 1);
    };

    window.addEventListener(ONBOARDING_STATE_CHANGED_EVENT, refresh);
    window.addEventListener(BIRTHDAY_UPDATED_EVENT, refresh);
    window.addEventListener(FOLLOW_EVENT_NAME, refresh);
    window.addEventListener('nexus_avatar_updated', handleAvatar);
    window.addEventListener('nexus_cover_updated', handleCover);
    window.addEventListener('nexus_show_rsvped', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(ONBOARDING_STATE_CHANGED_EVENT, refresh);
      window.removeEventListener(BIRTHDAY_UPDATED_EVENT, refresh);
      window.removeEventListener(FOLLOW_EVENT_NAME, refresh);
      window.removeEventListener('nexus_avatar_updated', handleAvatar);
      window.removeEventListener('nexus_cover_updated', handleCover);
      window.removeEventListener('nexus_show_rsvped', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [userKey]);

  // Live evaluation of subscribed circles
  const resolvedSubscribedCircles = useMemo(() => {
    void liveSignalTick;
    if (Array.isArray(propSubscribedCircles)) {
      return propSubscribedCircles;
    }
    if (Array.isArray(userProfile?.subscribed_circles)) {
      return userProfile.subscribed_circles;
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nexus_forum_subscriptions');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  }, [propSubscribedCircles, userProfile?.subscribed_circles, liveSignalTick]);

  // Live evaluation of push notification permission / subscription state
  const resolvedPushEnabled = useMemo(() => {
    void liveSignalTick;
    if (manualStepCompletions.enable_push) return true;
    if (typeof prefPushNotifications === 'boolean') {
      if (
        typeof window !== 'undefined' &&
        localStorage.getItem(`nexus_push_enabled_${userKey}`) === 'true'
      ) {
        return true;
      }
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        prefPushNotifications
      ) {
        return true;
      }
    }
    if (userProfile?.push_enabled === true || userProfile?.pushNotificationsEnabled === true) {
      return true;
    }
    if (typeof window !== 'undefined') {
      try {
        if (
          localStorage.getItem(`nexus_push_enabled_${userKey}`) === 'true' ||
          localStorage.getItem('nexus_push_enabled') === 'true'
        ) {
          return true;
        }
      } catch {
        // ignore
      }
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      return true;
    }
    return false;
  }, [prefPushNotifications, userProfile, userKey, liveSignalTick, manualStepCompletions]);

  // Live evaluation of user posts or forum replies
  const hasFirstPostOrReply = useMemo(() => {
    void liveSignalTick;
    if (manualStepCompletions.fan_first_post_or_reply) return true;
    const uid = String(userProfile?.id || '').trim();
    const uHandle = String(userProfile?.console_handle || userProfile?.handle || '')
      .replace(/^@+/, '')
      .trim()
      .toLowerCase();
    const uName = String(userProfile?.full_name || userProfile?.name || '')
      .trim()
      .toLowerCase();

    if (Array.isArray(feed)) {
      const hasFeedPostOrComment = feed.some((post: any) => {
        if (!post) return false;
        const pUid = String(
          post.user_id || post.profile_id || post.author_id || post.author?.id || ''
        ).trim();
        if (uid && pUid && uid === pUid) return true;
        const pHandle = String(post.author?.handle || post.handle || post.console_handle || '')
          .replace(/^@+/, '')
          .trim()
          .toLowerCase();
        if (uHandle && uHandle !== 'user' && uHandle !== 'member' && pHandle === uHandle) {
          return true;
        }
        const pName = String(post.author?.name || post.authorName || '')
          .trim()
          .toLowerCase();
        if (
          uName &&
          uName !== 'user' &&
          uName !== 'member' &&
          uName !== 'nexus member' &&
          pName === uName
        ) {
          return true;
        }
        if (Array.isArray(post.comments)) {
          return post.comments.some((c: any) => {
            const cUid = String(c?.user_id || c?.userId || '').trim();
            if (uid && cUid && uid === cUid) return true;
            const cAuthor = String(c?.author || c?.username || c?.author_name || '')
              .trim()
              .toLowerCase();
            return Boolean(uName && cAuthor && cAuthor === uName);
          });
        }
        return false;
      });
      if (hasFeedPostOrComment) return true;
    }

    if (typeof window !== 'undefined') {
      try {
        const cachedThreads = localStorage.getItem('nexus_forum_threads_v2');
        if (cachedThreads) {
          const threads = JSON.parse(cachedThreads);
          if (Array.isArray(threads)) {
            const matchedThread = threads.some((t: any) => {
              const tHandle = String(t?.authorHandle || t?.author || '')
                .replace(/^@+/, '')
                .trim()
                .toLowerCase();
              if (uHandle && tHandle === uHandle) return true;
              if (Array.isArray(t?.commentsList)) {
                return t.commentsList.some((c: any) => {
                  const cHandle = String(c?.authorHandle || c?.author || '')
                    .replace(/^@+/, '')
                    .trim()
                    .toLowerCase();
                  return Boolean(uHandle && cHandle === uHandle);
                });
              }
              return false;
            });
            if (matchedThread) return true;
          }
        }
      } catch {
        // ignore
      }
    }

    return false;
  }, [feed, userProfile, liveSignalTick, manualStepCompletions]);

  // Live evaluation of Bookmarked / RSVP'd show
  const hasBookmarkedOrRsvpedShow = useMemo(() => {
    void liveSignalTick;
    if (manualStepCompletions.fan_bookmark_rsvp_show) return true;
    if (
      Array.isArray(userProfile?.rsvped_shows) &&
      userProfile.rsvped_shows.length > 0
    ) {
      return true;
    }
    if (
      Array.isArray(userProfile?.bookmarked_shows) &&
      userProfile.bookmarked_shows.length > 0
    ) {
      return true;
    }
    if (typeof window !== 'undefined') {
      try {
        const savedRsvps = localStorage.getItem('nexus_rsvped_shows');
        if (savedRsvps) {
          const parsed = JSON.parse(savedRsvps);
          if (Array.isArray(parsed) && parsed.length > 0) return true;
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('nexus_event_rsvp_')) {
            const val = localStorage.getItem(k);
            if (val === 'going' || val === 'maybe') return true;
          }
        }
      } catch {
        // ignore
      }
    }
    return false;
  }, [userProfile, liveSignalTick, manualStepCompletions]);

  // Live evaluation of Industry Step 5: Create or claim a Band/Venue/Brand entity page
  const hasCreatedOrClaimedEntity = useMemo(() => {
    void liveSignalTick;
    if (manualStepCompletions.industry_create_claim_entity) return true;
    if (activeBand && (activeBand.id || activeBand.name)) return true;
    if (Array.isArray(bands) && bands.length > 0) return true;
    if (
      Boolean(
        userProfile?.band_id ||
          userProfile?.band_name ||
          userProfile?.promoter_id ||
          userProfile?.promoter_agency ||
          userProfile?.promoter_metadata?.brand_name ||
          userProfile?.creative_id ||
          userProfile?.creative_name ||
          userProfile?.label_id ||
          userProfile?.label_name ||
          userProfile?.venue_id ||
          userProfile?.venue_name ||
          (Array.isArray(userProfile?.claimed_entities) &&
            userProfile.claimed_entities.length > 0)
      )
    ) {
      return true;
    }
    if (typeof window !== 'undefined') {
      try {
        const activeBandCache = localStorage.getItem('nexus_active_band');
        if (activeBandCache) {
          const parsed = JSON.parse(activeBandCache);
          if (parsed && (parsed.id || parsed.name)) return true;
        }
        const claimedCache = localStorage.getItem(`nexus_claimed_entity_${userKey}`);
        if (claimedCache === 'true') return true;
      } catch {
        // ignore
      }
    }
    return false;
  }, [activeBand, bands, userProfile, userKey, liveSignalTick, manualStepCompletions]);

  // Live evaluation of Industry Step 6: Publish first show flyer, track/clip, or merch listing
  const hasPublishedFlyerTrackOrMerch = useMemo(() => {
    void liveSignalTick;
    if (manualStepCompletions.industry_publish_flyer_track_merch) return true;
    if (Array.isArray(clips) && clips.length > 0) return true;
    if (Array.isArray(shopItems) && shopItems.some((item: any) => Boolean(item?.isCustom || item?.owner_id === userProfile?.id))) {
      return true;
    }
    if (Array.isArray(liveEvents) && liveEvents.some((ev: any) => Boolean(ev?.created_by === userProfile?.id || ev?.isCommunityShow))) {
      return true;
    }
    const uid = String(userProfile?.id || '').trim();
    const uHandle = String(userProfile?.console_handle || userProfile?.handle || '')
      .replace(/^@+/, '')
      .trim()
      .toLowerCase();

    if (Array.isArray(feed)) {
      const hasReleasePost = feed.some((post: any) => {
        if (!post) return false;
        const pUid = String(
          post.user_id || post.profile_id || post.author_id || post.author?.id || ''
        ).trim();
        const pHandle = String(post.author?.handle || post.handle || post.console_handle || '')
          .replace(/^@+/, '')
          .trim()
          .toLowerCase();
        const isMine =
          (uid && pUid && uid === pUid) ||
          (uHandle && uHandle !== 'user' && pHandle === uHandle);
        if (!isMine) return false;
        return Boolean(
          post.eventData ||
            post.event_data ||
            post.songData ||
            post.attached_song ||
            post.tapeData ||
            post.merchData ||
            post.merch_data ||
            post.image ||
            post.image_url ||
            (Array.isArray(post.images) && post.images.length > 0) ||
            post.youtubeId
        );
      });
      if (hasReleasePost) return true;
    }

    return false;
  }, [clips, shopItems, liveEvents, feed, userProfile, liveSignalTick, manualStepCompletions]);

  const effectiveAvatar =
    liveAvatarOverride ||
    profileAvatarUrl ||
    userProfile?.avatar_url ||
    userProfile?.avatar ||
    null;
  const effectiveCover =
    liveCoverOverride ||
    profileCoverUrl ||
    userProfile?.cover_url ||
    userProfile?.banner_url ||
    userProfile?.banner ||
    null;

  const effectiveBirthday = useMemo(() => {
    void liveSignalTick;
    const stored = loadBirthdayPrefsFromStorage(userKey);
    const resolved = resolveEffectiveBirthdayProfile(userProfile, userProfile);
    return {
      birthday_month: resolved.birthday_month ?? stored.birthday_month,
      birthday_day: resolved.birthday_day ?? stored.birthday_day,
    };
  }, [userProfile, userKey, liveSignalTick]);

  const steps = useMemo(
    () =>
      resolveOnboardingChecklistSteps({
        role: portalRole,
        userProfile,
        avatar_url: effectiveAvatar,
        cover_url: effectiveCover,
        subscribedCircles: resolvedSubscribedCircles,
        pushEnabled: resolvedPushEnabled,
        birthday_month: effectiveBirthday.birthday_month,
        birthday_day: effectiveBirthday.birthday_day,
        hasFirstPostOrReply,
        hasBookmarkedOrRsvpedShow,
        hasCreatedOrClaimedEntity,
        hasPublishedFlyerTrackOrMerch,
      }),
    [
      portalRole,
      userProfile,
      effectiveAvatar,
      effectiveCover,
      resolvedSubscribedCircles,
      resolvedPushEnabled,
      effectiveBirthday.birthday_month,
      effectiveBirthday.birthday_day,
      hasFirstPostOrReply,
      hasBookmarkedOrRsvpedShow,
      hasCreatedOrClaimedEntity,
      hasPublishedFlyerTrackOrMerch,
    ]
  );

  const summary = useMemo(() => calculateChecklistSummary(steps), [steps]);

  const pioneerToastedKeysRef = React.useRef<Set<string>>(new Set());

  // Auto-unlock "Scene Pioneer" badge and auto-collapse when all 7 steps reach 100%
  useEffect(() => {
    if (!summary.isComplete) return;

    // Always read authoritative storage for the current userKey to avoid stale React state on userKey transitions
    const authoritativeState = getChecklistPersistedState(userKey);
    const alreadyHadBadge =
      authoritativeState.scenePioneerUnlocked ||
      hasScenePioneerBadge(userProfile) ||
      pioneerToastedKeysRef.current.has(userKey) ||
      (typeof window !== 'undefined' &&
        localStorage.getItem(`nexus_scene_pioneer_toasted_${userKey}`) === 'true');

    if (!authoritativeState.scenePioneerUnlocked || !authoritativeState.autoCollapsedOnComplete) {
      const updated = syncCompletionAndPioneerBadge(userKey, summary);
      setPersistedState(updated);
    } else if (!persistedState.scenePioneerUnlocked || !persistedState.autoCollapsedOnComplete) {
      setPersistedState(authoritativeState);
    }

    if (setUserProfile) {
      setUserProfile((prev: any) => {
        if (!prev) return prev;
        const existingBadges = Array.isArray(prev.badges) ? prev.badges : [];
        const hasBadge = existingBadges.some((b: string) =>
          String(b).toLowerCase().includes('scene pioneer')
        );
        if (hasBadge) return prev;
        const nextBadges = [...existingBadges, `🏆 ${SCENE_PIONEER_BADGE_LABEL}`];
        return {
          ...prev,
          badges: nextBadges,
          customBadges: nextBadges,
        };
      });
    }

    if (!alreadyHadBadge && userKey && userKey !== 'guest') {
      pioneerToastedKeysRef.current.add(userKey);
      try {
        localStorage.setItem(`nexus_scene_pioneer_toasted_${userKey}`, 'true');
      } catch (_) {}
      triggerNotification?.('🏆 All 7 setup steps complete! Unlocked "Scene Pioneer" profile badge.');
    }
  }, [summary, persistedState.scenePioneerUnlocked, persistedState.autoCollapsedOnComplete, userKey, userProfile, setUserProfile, triggerNotification]);

  const handleMinimizeToggle = useCallback(
    (minimized: boolean) => {
      const next = setChecklistMinimized(userKey, minimized);
      setPersistedState(next);
    },
    [userKey]
  );

  const handleConfirmDismiss = useCallback(() => {
    const next = dismissChecklistConfirmed(userKey);
    setPersistedState(next);
    setConfirmDismissOpen(false);
    triggerNotification?.('Setup checklist hidden. You can re-enable it anytime in Profile Settings.');
  }, [userKey, triggerNotification]);

  const handleStepClick = useCallback(
    async (step: OnboardingChecklistStep) => {
      if (step.completed || step.actionType === 'none') return;

      switch (step.actionType) {
        case 'edit_profile': {
          onCustomizeProfileAction?.();
          break;
        }
        case 'edit_birthday': {
          if (onOpenProfileSettingsAction) {
            onOpenProfileSettingsAction('birthday');
          } else {
            onCustomizeProfileAction?.();
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('nexus:open-profile-settings', {
                detail: { section: 'birthday' },
              })
            );
          }
          break;
        }
        case 'select_circles': {
          if (onSelectCirclesAction) {
            onSelectCirclesAction();
          } else if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nexus:open-circle-selector'));
          }
          break;
        }
        case 'enable_push': {
          if (onEnablePushAction) {
            onEnablePushAction();
          } else {
            try {
              if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                await Notification.requestPermission();
              }
            } catch {
              // ignore browser permission prompt error
            }
            setPrefPushNotifications?.(true);
            try {
              localStorage.setItem(`nexus_push_enabled_${userKey}`, 'true');
              localStorage.setItem('nexus_push_enabled', 'true');
            } catch {
              // ignore
            }
            setManualStepCompletions((prev) => ({ ...prev, enable_push: true }));
            triggerNotification?.('🔔 Push notifications enabled for DMs & Show Alerts!');
          }
          break;
        }
        case 'create_post': {
          onDropPostAction?.();
          break;
        }
        case 'rsvp_show': {
          if (onRsvpShowAction) {
            onRsvpShowAction();
          } else if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nexus:open-events-directory'));
          }
          break;
        }
        case 'claim_entity': {
          if (onClaimEntityAction) {
            onClaimEntityAction();
          } else {
            onCustomizeProfileAction?.();
          }
          break;
        }
        case 'publish_release': {
          if (onPublishReleaseAction) {
            onPublishReleaseAction();
          } else {
            onDropPostAction?.();
          }
          break;
        }
        default:
          break;
      }
    },
    [
      onCustomizeProfileAction,
      onOpenProfileSettingsAction,
      onSelectCirclesAction,
      onEnablePushAction,
      onDropPostAction,
      onRsvpShowAction,
      onClaimEntityAction,
      onPublishReleaseAction,
      setPrefPushNotifications,
      triggerNotification,
      userKey,
    ]
  );

  if (persistedState.dismissed) {
    return null;
  }

  const isIndustry = isIndustryChecklistRole(portalRole, userProfile);

  // Minimized Compact Pill State (never overlaps bottom Scene Radio player or floating side tabs)
  if (persistedState.minimized) {
    return (
      <div
        className="mb-3 flex items-center justify-between gap-2 rounded-full bg-[#0b0b12]/95 border border-violet-500/45 hover:border-teal-400/70 px-3.5 py-2 shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all"
        data-testid="onboarding-checklist-pill"
      >
        <button
          type="button"
          onClick={() => handleMinimizeToggle(false)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
          aria-label="Expand Profile Setup Checklist"
        >
          <span className="w-6 h-6 rounded-full bg-violet-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
            {summary.isComplete ? (
              <Award className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            )}
          </span>
          <span className="text-xs font-extrabold tracking-tight text-white font-mono tabular-nums truncate group-hover:text-teal-300 transition-colors">
            {summary.pillLabel}
          </span>
          {summary.isComplete && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">
              🏆 {SCENE_PIONEER_BADGE_LABEL}
            </span>
          )}
          <div className="hidden sm:flex items-center w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-teal-400 transition-all duration-300"
              style={{ width: `${summary.percentage}%` }}
            />
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-teal-300 shrink-0 ml-auto" />
        </button>

        <button
          type="button"
          onClick={() => {
            handleMinimizeToggle(false);
            setConfirmDismissOpen(true);
          }}
          aria-label="Dismiss setup checklist"
          title="Dismiss setup checklist"
          className="w-6 h-6 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const getStepIcon = (step: OnboardingChecklistStep) => {
    switch (step.id) {
      case 'account_created':
        return ShieldCheck;
      case 'upload_avatar_cover':
        return Camera;
      case 'subscribe_circles':
        return Compass;
      case 'enable_push':
        return Bell;
      case 'add_birthday':
        return Cake;
      case 'fan_first_post_or_reply':
        return MessageSquarePlus;
      case 'fan_bookmark_rsvp_show':
        return Calendar;
      case 'industry_create_claim_entity':
        return Building2;
      case 'industry_publish_flyer_track_merch':
        return Disc;
      default:
        return Sparkles;
    }
  };

  return (
    <div
      className="mb-3 rounded-2xl bg-gradient-to-br from-[#0e0b16] via-[#09090e] to-[#071517] border border-violet-500/45 shadow-[0_0_24px_rgba(139,92,246,0.18)] p-3.5 sm:p-4 text-left relative overflow-hidden"
      data-testid="onboarding-checklist-card"
    >
      {/* Top Header with Role Badge, Progress Pill, Minimize (—) & Dismiss (×) */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-teal-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Welcome to Nexus Core
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums bg-teal-500/15 text-teal-300 border border-teal-400/30">
                {summary.completedCount}/{summary.totalCount} ({summary.percentage}%)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-400/30">
                {isIndustry ? 'Industry Track' : 'Fan Track'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
              Complete all 7 profile activation steps to unlock the{' '}
              <span className="text-amber-300 font-bold">Scene Pioneer</span> badge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleMinimizeToggle(true)}
            aria-label="Minimize setup checklist"
            title="Minimize to compact pill"
            className="w-7 h-7 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-teal-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDismissOpen(true)}
            aria-label="Dismiss setup checklist"
            title="Hide setup checklist"
            className="w-7 h-7 rounded-lg bg-zinc-900/90 hover:bg-rose-950/70 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-3 border border-zinc-800/80">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-400 transition-all duration-500"
          style={{ width: `${summary.percentage}%` }}
        />
      </div>

      {/* Confirmed Dismissal Dialog */}
      {confirmDismissOpen && (
        <div
          className="mb-3 rounded-xl bg-zinc-950/95 border border-rose-500/40 p-3.5 space-y-2.5 shadow-xl"
          role="dialog"
          aria-label="Confirm hide setup checklist"
          data-testid="onboarding-dismiss-dialog"
        >
          <p className="text-xs font-bold text-zinc-100 leading-snug">
            Hide setup checklist? You can re-enable it anytime in Profile Settings.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDismissOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40 transition-colors cursor-pointer"
            >
              Hide Checklist
            </button>
          </div>
        </div>
      )}

      {/* 7 Role-Aware Checklist Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map((step) => {
          const IconComp = getStepIcon(step);
          const isInteractive = !step.completed && step.actionType !== 'none';
          return (
            <button
              key={step.id}
              type="button"
              disabled={!isInteractive}
              onClick={() => handleStepClick(step)}
              data-testid={`checklist-step-${step.stepNumber}`}
              className={`min-h-[48px] flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                step.completed
                  ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-300 cursor-default'
                  : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/90 hover:border-teal-400/55 text-zinc-100 cursor-pointer group active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold ${
                    step.completed
                      ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'bg-zinc-800 text-teal-300 group-hover:bg-violet-500/30 border border-zinc-700'
                  }`}
                >
                  {step.completed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <IconComp className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold leading-tight truncate ${
                      step.completed
                        ? 'line-through text-emerald-300/85'
                        : 'text-white group-hover:text-teal-300'
                    }`}
                  >
                    {step.stepNumber}. {step.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{step.sublabel}</div>
                </div>
              </div>

              {isInteractive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-300 group-hover:text-teal-200 shrink-0">
                  <span className="hidden xs:inline">{step.ctaLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
