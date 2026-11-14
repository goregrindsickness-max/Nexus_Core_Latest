import { useState, useEffect, useMemo, useCallback } from 'react';
import { Show } from '../types';
import { getSupabase, executeWithSchemaResilience, sanitizeShowForDb, ensureUUID } from '../supabase';
import { tourPackageManager } from '../lib/tourPackageManager';
import { getScopedFollowsMap } from '../utils/followSyncService';
import { isPastShowDate } from '../utils/socialFeedUtils';
import { formatTimeTo12Hour } from '../lib/timeUtils';
import { mockLiveTonight, bandSetlists } from '../data/socialFeedMockData';

/**
 * Helper to persist extra show metadata in localStorage when columns are not yet in the remote Supabase schema
 */
export function saveShowExtraMetadata(id: string, extraData: Record<string, any>) {
  try {
    const raw = localStorage.getItem('nexus_core_shows_extended');
    const existing = raw ? JSON.parse(raw) : {};
    existing[id] = { ...(existing[id] || {}), ...extraData };
    localStorage.setItem('nexus_core_shows_extended', JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not save extended show metadata to localStorage', e);
  }
}

export interface UseShowsOptions {
  activeBandId?: string;
  activeBand?: any;
  userProfile?: any;
  isInitialHydrated?: boolean;
  triggerNotification?: (msg: string, subMsg?: string) => void;
}

/**
 * Domain hook for managing shows, tour dates, public announced shows, settlement tracking,
 * and community event submissions across the application.
 */
export function useShows(options: UseShowsOptions = {}) {
  const {
    activeBandId,
    activeBand,
    userProfile,
    isInitialHydrated = false,
    triggerNotification,
  } = options;

  const [shows, setShows] = useState<Show[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_shows_offline');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // Sync shows with localStorage namespaced by activeBandId / userProfile.id
  useEffect(() => {
    if (!isInitialHydrated) return;
    try {
      const suffix = activeBandId || userProfile?.id || 'offline';
      localStorage.setItem(`nexus_core_${suffix}_shows_offline`, JSON.stringify(shows));
    } catch (_) {}
  }, [shows, isInitialHydrated, activeBandId, userProfile?.id]);

  // Listen for TourPackageManager updates so tour dates created in Promoter/Admin immediately sync to state
  useEffect(() => {
    const handleTourManagerShowUpdate = (e: any) => {
      const newShows = e.detail;
      if (Array.isArray(newShows) && newShows.length > 0) {
        setShows((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueToAdd = newShows.filter((s: Show) => !existingIds.has(s.id));
          return [...uniqueToAdd, ...prev];
        });
      }
    };
    window.addEventListener('shows_updated_from_tour_manager', handleTourManagerShowUpdate);
    return () => window.removeEventListener('shows_updated_from_tour_manager', handleTourManagerShowUpdate);
  }, []);

  // Filtered shows for the active band workspace
  const filteredShows = useMemo(() => {
    const curBandName = (activeBand?.name || 'Virulent Excision').trim().toLowerCase();
    const curBandId = (activeBandId || 'b1').trim();

    return shows.filter((show) => {
      const isCommunityOnly =
        show.is_community_submitted === true ||
        (typeof show.id === 'string' &&
          (show.id.startsWith('sh_comm_') || show.id.startsWith('df000000'))) ||
        (show.band_id &&
          (show.band_id === 'community_hub' || show.band_id.startsWith('community')));

      if (isCommunityOnly) {
        return Boolean(
          show.band_id && show.band_id === curBandId && show.band_id !== 'community_hub'
        );
      }

      let tourId = '';
      let tourHeadliner = '';
      let tourTitle = '';
      if (show.additional_notes) {
        try {
          const extra =
            typeof show.additional_notes === 'string'
              ? JSON.parse(show.additional_notes)
              : show.additional_notes;
          tourId = extra.tour_id || '';
          tourHeadliner = extra.headliner || '';
          tourTitle = extra.tour_title || extra.tour_name || '';
        } catch (_) {}
      }

      const showHeadliner = (show.headliner || tourHeadliner || '').toLowerCase().trim();
      const showTitle = (
        show.name ||
        show.show_name ||
        show.festival_name ||
        tourTitle ||
        ''
      )
        .toLowerCase()
        .trim();

      if (
        showHeadliner &&
        !showHeadliner.includes(curBandName) &&
        !curBandName.includes(showHeadliner)
      ) {
        return false;
      }

      if (
        showTitle.includes('primordial hatred') ||
        showTitle.includes('dying fetus') ||
        showTitle.includes('reign forever kingdom')
      ) {
        if (
          !curBandName.includes('molested') &&
          !curBandName.includes('dying fetus') &&
          !curBandName.includes('vader')
        ) {
          return false;
        }
      }

      if (show.band_id) {
        return show.band_id === curBandId;
      }

      if (show.is_managed_client_booking || tourId) {
        return false;
      }

      return true;
    });
  }, [shows, activeBandId, activeBand?.name]);

  const sortedShows = useMemo(() => {
    return [...filteredShows].sort(
      (a, b) =>
        new Date(a.date || (a as any).show_date || 0).getTime() -
        new Date(b.date || (b as any).show_date || 0).getTime()
    );
  }, [filteredShows]);

  // Publicly announced shows (embargoed private tours are hidden from public feeds/maps)
  const publicAnnouncedShows = useMemo(() => {
    const allTours = tourPackageManager.getAllTours();
    return shows.filter((show) => {
      if (
        show.is_published === false ||
        show.publication_status === 'embargoed_private' ||
        show.publication_status === 'draft' ||
        show.status === 'Draft' ||
        show.status === 'Embargoed'
      ) {
        return false;
      }
      if (show.additional_notes) {
        try {
          const extra =
            typeof show.additional_notes === 'string'
              ? JSON.parse(show.additional_notes)
              : show.additional_notes;
          if (extra.tour_id) {
            const matchedTour = allTours.find((t) => t.id === extra.tour_id);
            if (matchedTour && matchedTour.publicationStatus === 'embargoed_private') {
              return false;
            }
          }
        } catch (_) {}
      }
      return true;
    });
  }, [shows]);

  const currentOrNextShow = useMemo(() => {
    const active = sortedShows.find((s) => s.status === 'Active');
    if (active) return active;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = sortedShows.find((s) => (s.date || (s as any).show_date || '') >= today);
    return upcoming || sortedShows[sortedShows.length - 1];
  }, [sortedShows]);

  const showsNeedingSettlement = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sortedShows.filter((s) => {
      const sDate = s.date || (s as any).show_date || '';
      return sDate < today && !(s as any).is_settled && s.status !== 'Completed';
    });
  }, [sortedShows]);

  const getNextShow = useCallback(() => {
    if (!filteredShows.length) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = filteredShows
      .filter((s) => {
        if (!s.date) return false;
        const [year, month, day] = s.date.split('-').map(Number);
        const showDate = new Date(year, month - 1, day);
        return showDate >= now;
      })
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [filteredShows]);

  return {
    shows,
    setShows,
    filteredShows,
    sortedShows,
    publicAnnouncedShows,
    currentOrNextShow,
    showsNeedingSettlement,
    getNextShow,
    saveShowExtraMetadata,
  };
}
