import { getSupabase } from '../supabase';

export type SonicMetricId = 'show_attendance' | 'crate_digger' | 'physical_collector' | 'signal_contributor';

export interface SonicActivityItem {
  id: string;
  metricId: SonicMetricId;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface SonicFootprintData {
  show_attendance: number; // Pit Frequency (0 to 1000)
  crate_digger: number;    // Underground Loyalty (0 to 1000)
  physical_collector: number; // Physical Collector (0 to 1000)
  signal_contributor: number; // Signal Contributor (0 to 1000)
  totalXP: number;
  activities: SonicActivityItem[];
}

export const METRIC_LABELS: Record<SonicMetricId, string> = {
  show_attendance: 'Pit Frequency',
  crate_digger: 'Underground Loyalty',
  physical_collector: 'Physical Collector',
  signal_contributor: 'Signal Contributor',
};

const STORAGE_XP_KEY = 'nexus_sonic_footprint_xp';
const STORAGE_LOG_KEY = 'nexus_sonic_activity_log';
const RESET_FLAG_KEY = 'nexus_sonic_footprint_zero_reset_v2';

// Baseline starts strictly at 0 XP to track real user events forward
const DEFAULT_BASELINE: Record<SonicMetricId, number> = {
  show_attendance: 0,
  crate_digger: 0,
  physical_collector: 0,
  signal_contributor: 0,
};

/**
 * Resets all Sonic Footprint XP to 0 across all categories.
 */
export function resetSonicFootprint(): SonicFootprintData {
  const zeroData: SonicFootprintData = {
    show_attendance: 0,
    crate_digger: 0,
    physical_collector: 0,
    signal_contributor: 0,
    totalXP: 0,
    activities: []
  };

  if (typeof window !== 'undefined') {
    try {
      const zeroPayload = {
        show_attendance: 0,
        crate_digger: 0,
        physical_collector: 0,
        signal_contributor: 0,
      };
      localStorage.setItem(STORAGE_XP_KEY, JSON.stringify(zeroPayload));
      localStorage.setItem(STORAGE_LOG_KEY, JSON.stringify([]));
      localStorage.setItem(RESET_FLAG_KEY, 'true');

      // Update nexus_core_user_profile
      const rawProfile = localStorage.getItem('nexus_core_user_profile');
      let profileObj: any = rawProfile ? JSON.parse(rawProfile) : {};
      profileObj = {
        ...profileObj,
        pit_frequency: 0,
        show_attendance: 0,
        underground_loyalty: 0,
        crate_digger: 0,
        physical_collector: 0,
        signal_contributor: 0,
      };
      localStorage.setItem('nexus_core_user_profile', JSON.stringify(profileObj));

      // Dispatch global sync events
      window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: profileObj }));
      window.dispatchEvent(
        new CustomEvent('nexus_sonic_xp_awarded', {
          detail: {
            metricId: 'show_attendance',
            metricLabel: 'Reset',
            amount: 0,
            newXP: 0,
            totalXP: 0,
            reason: 'Footprint reset to zero — tracking real events forward',
            activity: null
          }
        })
      );
    } catch (err) {
      console.warn('[SonicFootprint] Error resetting XP:', err);
    }

    // Also attempt Supabase update
    try {
      const supabase = getSupabase();
      if (supabase) {
        const rawUser = localStorage.getItem('nexus_user') || localStorage.getItem('nexus_core_user_profile');
        const userId = rawUser ? JSON.parse(rawUser)?.id : null;
        if (userId) {
          supabase
            .from('profiles')
            .update({
              pit_frequency: 0,
              underground_loyalty: 0,
              physical_collector: 0,
              signal_contributor: 0,
            })
            .eq('id', userId)
            .then();
        }
      }
    } catch (_) {}
  }

  return zeroData;
}

/**
 * Retrieve current Sonic Footprint XP, merging profile data, stored local cache, and realistic baseline.
 */
export function getSonicFootprint(profile?: any): SonicFootprintData {
  let storedXP: Partial<Record<SonicMetricId, number>> = {};
  let activities: SonicActivityItem[] = [];

  if (typeof window !== 'undefined') {
    try {
      // If we haven't executed the zero reset migration yet, run it now to clear previous seeded values
      if (localStorage.getItem(RESET_FLAG_KEY) !== 'true') {
        return resetSonicFootprint();
      }

      const rawXP = localStorage.getItem(STORAGE_XP_KEY);
      if (rawXP) storedXP = JSON.parse(rawXP);
      const rawLog = localStorage.getItem(STORAGE_LOG_KEY);
      if (rawLog) activities = JSON.parse(rawLog);
    } catch (_) {}
  }

  const hasReset = typeof window !== 'undefined' && localStorage.getItem(RESET_FLAG_KEY) === 'true';

  // Check profile fields (only if not reset)
  const pPit = !hasReset ? (profile?.pit_frequency ?? profile?.show_attendance ?? profile?.pit_xp) : 0;
  const pDigger = !hasReset ? (profile?.underground_loyalty ?? profile?.crate_digger ?? profile?.loyalty_xp) : 0;
  const pCollector = !hasReset ? (profile?.physical_collector ?? profile?.merch_collector ?? profile?.collector_xp) : 0;
  const pSignal = !hasReset ? (profile?.signal_contributor ?? profile?.community_signal ?? profile?.signal_xp) : 0;

  // Resolve values with priority: storedXP > profile > 0 baseline
  const show_attendance = Math.min(1000, Math.max(0, storedXP.show_attendance ?? (pPit != null && pPit > 0 ? pPit : DEFAULT_BASELINE.show_attendance)));
  const crate_digger = Math.min(1000, Math.max(0, storedXP.crate_digger ?? (pDigger != null && pDigger > 0 ? pDigger : DEFAULT_BASELINE.crate_digger)));
  const physical_collector = Math.min(1000, Math.max(0, storedXP.physical_collector ?? (pCollector != null && pCollector > 0 ? pCollector : DEFAULT_BASELINE.physical_collector)));
  const signal_contributor = Math.min(1000, Math.max(0, storedXP.signal_contributor ?? (pSignal != null && pSignal > 0 ? pSignal : DEFAULT_BASELINE.signal_contributor)));

  const totalXP = show_attendance + crate_digger + physical_collector + signal_contributor;

  return {
    show_attendance,
    crate_digger,
    physical_collector,
    signal_contributor,
    totalXP,
    activities: Array.isArray(activities) ? activities.slice(0, 25) : []
  };
}

/**
 * Award points in real time to a specific sonic footprint metric.
 */
export function awardSonicPoints(
  metricId: SonicMetricId,
  amount: number,
  reason: string,
  notifyUser: boolean = true
): SonicFootprintData {
  if (typeof window === 'undefined') {
    return {
      show_attendance: DEFAULT_BASELINE.show_attendance,
      crate_digger: DEFAULT_BASELINE.crate_digger,
      physical_collector: DEFAULT_BASELINE.physical_collector,
      signal_contributor: DEFAULT_BASELINE.signal_contributor,
      totalXP: 2010,
      activities: []
    };
  }

  const current = getSonicFootprint();
  const currentXP = current[metricId] || 0;
  const updatedXP = Math.min(1000, currentXP + amount);

  const updatedData: SonicFootprintData = {
    ...current,
    [metricId]: updatedXP,
    totalXP: current.totalXP + (updatedXP - currentXP)
  };

  const newActivity: SonicActivityItem = {
    id: `xp_act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    metricId,
    amount,
    reason,
    timestamp: new Date().toISOString()
  };

  const updatedActivities = [newActivity, ...(current.activities || [])].slice(0, 30);
  updatedData.activities = updatedActivities;

  // 1. Save to local storage
  try {
    const xpPayload = {
      show_attendance: updatedData.show_attendance,
      crate_digger: updatedData.crate_digger,
      physical_collector: updatedData.physical_collector,
      signal_contributor: updatedData.signal_contributor,
    };
    localStorage.setItem(STORAGE_XP_KEY, JSON.stringify(xpPayload));
    localStorage.setItem(STORAGE_LOG_KEY, JSON.stringify(updatedActivities));

    // Also update nexus_core_user_profile
    const rawProfile = localStorage.getItem('nexus_core_user_profile');
    let profileObj: any = rawProfile ? JSON.parse(rawProfile) : {};
    profileObj = {
      ...profileObj,
      pit_frequency: updatedData.show_attendance,
      show_attendance: updatedData.show_attendance,
      underground_loyalty: updatedData.crate_digger,
      crate_digger: updatedData.crate_digger,
      physical_collector: updatedData.physical_collector,
      signal_contributor: updatedData.signal_contributor,
    };
    localStorage.setItem('nexus_core_user_profile', JSON.stringify(profileObj));

    // 2. Dispatch global events
    window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: profileObj }));
    window.dispatchEvent(
      new CustomEvent('nexus_sonic_xp_awarded', {
        detail: {
          metricId,
          metricLabel: METRIC_LABELS[metricId],
          amount,
          newXP: updatedXP,
          totalXP: updatedData.totalXP,
          reason,
          activity: newActivity
        }
      })
    );

    if (notifyUser) {
      const toastMsg = `⚡ +${amount} XP [${METRIC_LABELS[metricId]}]: ${reason}`;
      window.dispatchEvent(new CustomEvent('nexus_sonic_toast', { detail: toastMsg }));
    }
  } catch (err) {
    console.warn('[SonicFootprint] Error updating XP in localStorage:', err);
  }

  // 3. Asynchronously attempt Supabase sync
  try {
    const supabase = getSupabase();
    if (supabase) {
      const rawUser = localStorage.getItem('nexus_user') || localStorage.getItem('nexus_core_user_profile');
      const userId = rawUser ? JSON.parse(rawUser)?.id : null;
      if (userId) {
        supabase
          .from('profiles')
          .update({
            pit_frequency: updatedData.show_attendance,
            underground_loyalty: updatedData.crate_digger,
            physical_collector: updatedData.physical_collector,
            signal_contributor: updatedData.signal_contributor,
          })
          .eq('id', userId)
          .then();
      }
    }
  } catch (_) {}

  return updatedData;
}

let listenersInitialized = false;

/**
 * Initializes automatic real-time activity listeners across the application.
 */
export function initializeSonicActivityListeners() {
  if (typeof window === 'undefined' || listenersInitialized) return;
  listenersInitialized = true;

  // Feed post broadcast
  window.addEventListener('nexus_post_created', (e: any) => {
    const hasMedia = Boolean(e.detail?.media_url || e.detail?.mediaUrl || e.detail?.bandcampUrl);
    awardSonicPoints(
      'signal_contributor',
      10,
      hasMedia ? 'Broadcasted release / transmission to underground network' : 'Dispatched timeline signal'
    );
  });

  // Forum thread / reply
  window.addEventListener('nexus_forum_cache_updated', () => {
    // Throttled forum contribution reward
    const lastForumReward = Number(sessionStorage.getItem('last_forum_xp_time') || 0);
    if (Date.now() - lastForumReward > 3000) {
      sessionStorage.setItem('last_forum_xp_time', String(Date.now()));
      awardSonicPoints('signal_contributor', 8, 'Contributed to underground scene forum');
    }
  });

  // Poll voting
  window.addEventListener('nexus_poll_voted', () => {
    awardSonicPoints('signal_contributor', 5, 'Voted in community BDM debate poll');
  });

  // Show RSVP
  window.addEventListener('nexus_show_rsvped', (e: any) => {
    const showTitle = e.detail?.title || 'Live Gig';
    awardSonicPoints('show_attendance', 20, `Confirmed RSVP for ${showTitle}`);
  });

  // Bandcamp interactions
  window.addEventListener('nexus_bandcamp_support_clicked', (e: any) => {
    const title = e.detail?.title || 'Bandcamp Release';
    awardSonicPoints('crate_digger', 15, `Supported underground artist on Bandcamp: ${title}`);
  });

  window.addEventListener('nexus_bandcamp_played', (e: any) => {
    const title = e.detail?.title || 'Bandcamp Player';
    awardSonicPoints('crate_digger', 5, `Streamed direct release preview: ${title}`);
  });

  // Tape and audio listening
  window.addEventListener('nexus_tape_played', (e: any) => {
    const title = e.detail?.title || 'Live Soundboard Tape';
    awardSonicPoints('crate_digger', 5, `Audited tape recording: ${title}`);
  });

  // Scene radio track
  window.addEventListener('nexus_radio_track_played', (e: any) => {
    const title = e.detail?.title || 'Scene Radio Stream';
    awardSonicPoints('crate_digger', 2, `Tuned in to underground frequency: ${title}`);
  });

  // Merch order / transaction
  window.addEventListener('nexus_merch_ordered', (e: any) => {
    const item = e.detail?.name || 'Band Merch / Vinyl';
    awardSonicPoints('physical_collector', 30, `Added to physical archive: ${item}`);
  });

  // Reactions
  window.addEventListener('nexus_flame_clicked', () => {
    awardSonicPoints('signal_contributor', 3, 'Endorsed underground transmission (Flame reaction)');
  });
}
