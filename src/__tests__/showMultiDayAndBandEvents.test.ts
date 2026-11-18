import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildUpcomingShowsAndCities,
  calculateShowDistanceMiles,
  doesShowFeatureBand,
  findMatchingExistingShowForBatchStop,
  formatShowDateRange,
  getBandBillingRoleInShow,
  getEffectiveShowEndDate,
  getEffectiveShowStartDate,
  getFullShowLineup,
  getLocalTodayIso,
  getMultiDaySpanDays,
  getShowDateBadgeParts,
  isMultiDayShow,
  isShowPastOrEnded,
  shiftIsoDateYear,
} from '../utils/showDisplayUtils';
import { sanitizeShowForDb } from '../services/schemaResilienceService';
import { loadAllMergedShows } from '../services/showEventsLoader';
import { deduplicatePromoterEventItems } from '../components/social/modals/PromoterEventsModal';

describe('Multi-day festival dates & band profile show auto-linking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Multi-day show date utilities', () => {
    it('extracts start and end dates from direct fields and additional_notes JSON', () => {
      const fromDirect = { date: '2026-07-16', end_date: '2026-07-18' };
      expect(getEffectiveShowStartDate(fromDirect)).toBe('2026-07-16');
      expect(getEffectiveShowEndDate(fromDirect)).toBe('2026-07-18');
      expect(isMultiDayShow(fromDirect)).toBe(true);
      expect(getMultiDaySpanDays('2026-07-16', '2026-07-18')).toBe(3);

      const fromNotes = {
        date: '2026-07-30T19:00:00Z',
        additional_notes: JSON.stringify({ end_date: '2026-08-02', festival_name: 'Maryland Deathfest' }),
      };
      expect(getEffectiveShowStartDate(fromNotes)).toBe('2026-07-30');
      expect(getEffectiveShowEndDate(fromNotes)).toBe('2026-08-02');
      expect(isMultiDayShow(fromNotes)).toBe(true);
      expect(getMultiDaySpanDays('2026-07-30', '2026-08-02')).toBe(4);
    });

    it('keeps multi-day festivals active through the end of the final day', () => {
      const fest = { date: '2026-07-16', end_date: '2026-07-18' };
      // During day 2 (start date already passed, end date is tomorrow)
      const dayTwoAfternoon = new Date(2026, 6, 17, 15, 0, 0);
      expect(isShowPastOrEnded(fest, dayTwoAfternoon)).toBe(false);

      // Final day evening (still active)
      const finalDayEvening = new Date(2026, 6, 18, 22, 30, 0);
      expect(isShowPastOrEnded(fest, finalDayEvening)).toBe(false);

      // Day after festival ends (now past)
      const dayAfterFest = new Date(2026, 6, 19, 0, 5, 0);
      expect(isShowPastOrEnded(fest, dayAfterFest)).toBe(true);
    });

    it('formats same-month, cross-month, and cross-year multi-day date ranges cleanly', () => {
      const sameMonth = formatShowDateRange('2026-07-16', '2026-07-18');
      expect(sameMonth).toContain('Jul 16');
      expect(sameMonth).toContain('18');

      const crossMonth = formatShowDateRange('2026-07-30', '2026-08-02');
      expect(crossMonth).toContain('Jul 30');
      expect(crossMonth).toContain('Aug 2');

      const crossYear = formatShowDateRange('2026-12-30', '2027-01-02');
      expect(crossYear).toContain('Dec 30, 2026');
      expect(crossYear).toContain('Jan 2, 2027');

      const badge = getShowDateBadgeParts('2026-07-16', '2026-07-18');
      expect(badge).toEqual({ month: 'JUL', day: '16–18', year: '2026' });
    });

    it('persists end_date inside additional_notes during schema sanitization', () => {
      const sanitized = sanitizeShowForDb({
        id: 'show-fest-1',
        headliner: 'Suffocation',
        date: '2026-08-14',
        end_date: '2026-08-16',
        venue_name: 'Reggies Rock Club',
        city: 'Chicago',
        additional_notes: '4-day death metal weekender',
      });

      expect((sanitized as any).end_date).toBeUndefined();
      const parsedNotes = JSON.parse(String(sanitized.additional_notes));
      expect(parsedNotes.end_date).toBe('2026-08-16');
      expect(parsedNotes.notes).toBe('4-day death metal weekender');
      expect(getEffectiveShowEndDate(sanitized)).toBe('2026-08-16');
    });
  });

  describe('Automatic show matching for headliner & support band profiles', () => {
    const communityFest = {
      id: 'fest-1',
      festival_name: 'Chicago Domination Fest',
      headliner: 'Suffocation',
      support_lineup: [
        { band_name: 'Incantation', is_local: false },
        { band_name: 'Gorgasm', band_id: 'band-gorgasm-uuid' },
      ],
      support_bands: 'Incantation, Gorgasm, Necroticgorebeast',
      date: '2026-09-10',
      end_date: '2026-09-12',
      user_id: 'submitter-user-uuid',
      creator_id: 'submitter-user-uuid',
    };

    it('detects headliner and all support bands cleanly', () => {
      expect(getFullShowLineup(communityFest)).toEqual([
        'Suffocation',
        'Incantation',
        'Gorgasm',
        'Necroticgorebeast',
      ]);

      expect(getBandBillingRoleInShow(communityFest, { name: 'Suffocation', band_name: 'Suffocation' })).toBe('headliner');
      expect(getBandBillingRoleInShow(communityFest, { name: 'Incantation' })).toBe('support');
      expect(getBandBillingRoleInShow(communityFest, { id: 'band-gorgasm-uuid', band_name: 'Gorgasm' })).toBe('support');
      expect(getBandBillingRoleInShow(communityFest, { band_name: 'Necroticgorebeast' })).toBe('support');

      expect(doesShowFeatureBand(communityFest, 'Suffocation (NY)')).toBe(true);
      expect(doesShowFeatureBand(communityFest, 'Gorgasm')).toBe(true);
      expect(doesShowFeatureBand(communityFest, 'Necroticgorebeast')).toBe(true);
    });

    it('prevents false substring matches and submitter leak to unrelated owned band profiles', () => {
      const show = {
        id: 'show-2',
        headliner: 'Aborted',
        support_lineup: ['Cannibal Corpse'],
        date: '2026-10-05',
        user_id: 'fan-who-also-runs-a-band',
        creator_id: 'fan-who-also-runs-a-band',
      };

      expect(doesShowFeatureBand(show, { band_name: 'Unaborted' })).toBe(false);
      expect(doesShowFeatureBand(show, { band_name: 'Aborted' })).toBe(true);
      // Fan who submitted a show for Aborted should not have Aborted appear on their own band's Events tab
      expect(
        doesShowFeatureBand(show, {
          id: 'fan-who-also-runs-a-band',
          user_id: 'fan-who-also-runs-a-band',
          band_id: 'unrelated-band-uuid',
          band_name: 'My Own Band',
          account_type: 'band',
        })
      ).toBe(false);
    });
  });

  describe('loadAllMergedShows hydration', () => {
    it('hydrates end_date and merges passed + extended localStorage shows without deleted/embargoed entries', async () => {
      localStorage.setItem(
        'nexus_core_shows_extended',
        JSON.stringify({
          'show-ext-1': {
            id: 'show-ext-1',
            headliner: 'Dying Fetus',
            support_bands: '200 Stab Wounds, Fulci',
            date: '2026-08-20',
            end_date: '2026-08-22',
            city: 'Milwaukee, WI',
            venue_name: 'The Rave',
          },
          'show-deleted': {
            id: 'show-deleted',
            headliner: 'Ghost Show',
            date: '2026-08-25',
          },
        })
      );
      localStorage.setItem('nexus_deleted_community_shows', JSON.stringify(['show-deleted']));

      const passed = [
        {
          id: 'show-embargoed',
          headliner: 'Secret Tour',
          date: '2026-11-01',
          publication_status: 'embargoed_private',
        },
        {
          id: 'show-ext-1',
          headliner: 'Dying Fetus',
          date: '2026-08-20',
          additional_notes: JSON.stringify({ end_date: '2026-08-22' }),
          city: 'Milwaukee, WI',
        },
      ];

      const merged = await loadAllMergedShows(null, passed);
      expect(merged.length).toBe(1);
      expect(merged[0].id).toBe('show-ext-1');
      expect(merged[0].end_date).toBe('2026-08-22');
      expect(doesShowFeatureBand(merged[0], 'Fulci')).toBe(true);
      expect(doesShowFeatureBand(merged[0], '200 Stab Wounds')).toBe(true);
    });
  });

  describe('PromoterEventsModal deduplication', () => {
    it('deduplicates overlapping live and archive shows sharing the same DB id even with different formatted titles/dates', () => {
      const merged = deduplicatePromoterEventItems([
        {
          id: 'df000000-0000-4000-a000-000000000021',
          title: 'Chicago Domination Fest 2021',
          type: 'festival',
          date: 'Sat, Jul 17, 2021',
          dateRaw: '2021-07-17',
          venue: 'Brauer House',
          city: 'Lombard, IL',
          lineup: ['Suffocation', 'Gorgasm'],
          ticketStatus: 'on_sale',
          isPast: true,
        },
        {
          id: 'df000000-0000-4000-a000-000000000021',
          title: 'Suffocation at Brauer House',
          type: 'festival',
          date: 'JUL 17, 2021',
          dateRaw: 'JUL 17, 2021',
          venue: 'Brauer House',
          city: 'Lombard, IL',
          lineup: ['Suffocation'],
          ticketStatus: 'sold_out',
          isPast: true,
          milestone: 'Sold Out Annual Fest',
          attendance: '600 Capacity',
        },
      ]);

      expect(merged.length).toBe(1);
      expect(merged[0].id).toBe('df000000-0000-4000-a000-000000000021');
      expect(merged[0].milestone).toBe('Sold Out Annual Fest');
      expect(merged[0].attendance).toBe('600 Capacity');
    });
  });

  describe('Batch tour date safety & local calendar helpers', () => {
    it('formats getLocalTodayIso using local calendar components instead of UTC', () => {
      const localLateEvening = new Date(2026, 10, 17, 23, 45, 0);
      expect(getLocalTodayIso(localLateEvening)).toBe('2026-11-17');
    });

    it('shifts tour stop ISO dates forward cleanly across normal and leap years', () => {
      expect(shiftIsoDateYear('2026-03-04', 1)).toBe('2027-03-04');
      expect(shiftIsoDateYear('2024-02-29', 1)).toBe('2025-02-28');
      expect(shiftIsoDateYear('2027-02-28', 1)).toBe('2028-02-28');
    });

    it('prevents batch tour stops from overwriting prior-year shows in the same city', () => {
      const existingShows = [
        {
          id: 'old-chicago-show',
          headliner: 'Dying Fetus',
          city: 'Chicago',
          date: '2026-10-15',
        },
      ];

      // New 2027 tour stop in Chicago must NOT match the 2026 Chicago show
      expect(
        findMatchingExistingShowForBatchStop(existingShows, 'Dying Fetus', '2027-02-24', 'Chicago')
      ).toBeUndefined();

      // Exact same headliner + date + city DOES match for idempotent updates
      expect(
        findMatchingExistingShowForBatchStop(existingShows, 'Dying Fetus', '2026-10-15', 'Chicago')?.id
      ).toBe('old-chicago-show');
    });
  });

  describe('GPS-based closest tour stop selection & All Cities trip-planning dropdown', () => {
    const dyingFetusTourStops = [
      {
        id: 'df-dc',
        headliner: 'Dying Fetus',
        tour_name: 'Dying Fetus Fall Tour',
        venue: 'Howard Theatre',
        city: 'Washington',
        state_province: 'DC',
        rawDate: '2027-10-22',
        date: 'Oct 22, 2027',
        time: '7:00 PM',
      },
      {
        id: 'df-chicago',
        headliner: 'Dying Fetus',
        tour_name: 'Dying Fetus Fall Tour',
        venue: 'Concord Music Hall',
        city: 'Chicago',
        state_province: 'IL',
        rawDate: '2027-10-28',
        date: 'Oct 28, 2027',
        time: '7:00 PM',
      },
      {
        id: 'df-dallas',
        headliner: 'Dying Fetus',
        tour_name: 'Dying Fetus Fall Tour',
        venue: 'The Studio at the Factory',
        city: 'Dallas',
        state_province: 'TX',
        rawDate: '2027-11-04',
        date: 'Nov 4, 2027',
        time: '7:00 PM',
      },
      {
        id: 'df-austin',
        headliner: 'Dying Fetus',
        tour_name: 'Dying Fetus Fall Tour',
        venue: 'Come and Take It Live',
        city: 'Austin',
        state_province: 'TX',
        rawDate: '2027-11-05',
        date: 'Nov 5, 2027',
        time: '7:00 PM',
      },
    ];

    it('populates availableCities with ALL tour cities (sorted by GPS proximity) and defaults to the Dallas date instead of Washington, DC', () => {
      const dallasGps = { lat: 32.7767, lng: -96.7970 };
      const result = buildUpcomingShowsAndCities({
        liveEvents: dyingFetusTourStops,
        userProfile: null,
        selectedCity: 'ALL',
        gpsCoords: dallasGps,
        activeTours: [],
      });

      // All 4 tour cities must appear in the dropdown
      expect(result.availableCities).toEqual([
        'Dallas, TX',
        'Austin, TX',
        'Chicago, IL',
        'Washington, DC',
      ]);
      expect(result.allValidUpcomingGigs.length).toBe(4);

      // Default view (selectedCity === 'ALL') collapses the tour to 1 featured stop: Dallas, TX (nearest to user GPS)
      expect(result.featuredByProximityGigs.length).toBe(1);
      expect(result.featuredByProximityGigs[0].id).toBe('df-dallas');
      expect(result.featuredByProximityGigs[0].city).toBe('Dallas, TX');
      expect(result.filteredGigs[0].id).toBe('df-dallas');
    });

    it('allows selecting any other tour city in the dropdown to plan a trip', () => {
      const dallasGps = { lat: 32.7767, lng: -96.7970 };

      const dcTrip = buildUpcomingShowsAndCities({
        liveEvents: dyingFetusTourStops,
        userProfile: null,
        selectedCity: 'Washington, DC',
        gpsCoords: dallasGps,
        activeTours: [],
      });
      expect(dcTrip.filteredGigs.length).toBe(1);
      expect(dcTrip.filteredGigs[0].id).toBe('df-dc');
      expect(dcTrip.filteredGigs[0].city).toBe('Washington, DC');

      const chicagoTrip = buildUpcomingShowsAndCities({
        liveEvents: dyingFetusTourStops,
        userProfile: null,
        selectedCity: 'Chicago, IL',
        gpsCoords: dallasGps,
        activeTours: [],
      });
      expect(chicagoTrip.filteredGigs.length).toBe(1);
      expect(chicagoTrip.filteredGigs[0].id).toBe('df-chicago');
      expect(chicagoTrip.filteredGigs[0].city).toBe('Chicago, IL');
    });

    it('computes accurate Haversine distances for tour stops without explicit lat/lng', () => {
      const dallasGps = { lat: 32.7767, lng: -96.7970 };
      const distDallas = calculateShowDistanceMiles({ city: 'Dallas', state_province: 'TX' }, null, dallasGps);
      const distAustin = calculateShowDistanceMiles({ city: 'Austin', state_province: 'TX' }, null, dallasGps);
      const distDc = calculateShowDistanceMiles({ city: 'Washington', state_province: 'DC' }, null, dallasGps);

      expect(distDallas).toBeLessThan(5);
      expect(distAustin).toBeGreaterThan(150);
      expect(distAustin).toBeLessThan(220);
      expect(distDc).toBeGreaterThan(1100);
    });
  });
});

