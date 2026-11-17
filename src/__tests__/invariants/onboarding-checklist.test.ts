import { describe, it, expect } from 'vitest';
import {
  isIndustryChecklistRole,
  resolveOnboardingChecklistSteps,
  calculateChecklistSummary,
  getChecklistPersistedState,
  setChecklistMinimized,
  dismissChecklistConfirmed,
  setShowSetupChecklist,
  syncCompletionAndPioneerBadge,
  hasScenePioneerBadge,
  SCENE_PIONEER_BADGE_LABEL,
} from '../../components/OnboardingChecklist';
import {
  hasValidBirthday,
  isBirthdayToday,
  shouldShowBirthdayShoutout,
  clampBirthdayDay,
  formatBirthdayMonthDay,
  saveBirthdayPrefsToStorage,
  loadBirthdayPrefsFromStorage,
  buildBirthdayHornsMessage,
  isMutualConnection,
} from '../../utils/birthdayUtils';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('INVARIANT: Role-Aware 7-Step Profile Activation Checklist & Birthday Shoutout System', () => {
  it('resolves Fan role vs. Industry roles (Artist/Band, Venue, Promoter, Label, Creative) across all 7 steps accurately', () => {
    expect(isIndustryChecklistRole('fan')).toBe(false);
    expect(isIndustryChecklistRole('fan_only')).toBe(false);
    expect(isIndustryChecklistRole(undefined, { account_type: 'fan_only' })).toBe(false);

    for (const industryRole of ['band', 'artist', 'venue', 'promoter', 'label', 'creative', 'industry_pro']) {
      expect(isIndustryChecklistRole(industryRole)).toBe(true);
    }

    const fanSteps = resolveOnboardingChecklistSteps({ role: 'fan_only' });
    expect(fanSteps).toHaveLength(7);
    expect(fanSteps[0].id).toBe('account_created');
    expect(fanSteps[0].completed).toBe(true); // Endowed progress: always pre-checked
    expect(fanSteps[1].id).toBe('upload_avatar_cover');
    expect(fanSteps[2].id).toBe('subscribe_circles');
    expect(fanSteps[3].id).toBe('enable_push');
    expect(fanSteps[4].id).toBe('add_birthday');
    expect(fanSteps[4].label).toContain('Add Your Birthday (Month & Day) for Scene Shoutouts');
    expect(fanSteps[4].actionType).toBe('edit_birthday');
    expect(fanSteps[5].id).toBe('fan_first_post_or_reply');
    expect(fanSteps[5].label).toContain('Make your first post or forum reply');
    expect(fanSteps[6].id).toBe('fan_bookmark_rsvp_show');
    expect(fanSteps[6].label).toContain('Bookmark/RSVP to an upcoming show');

    const industrySteps = resolveOnboardingChecklistSteps({ role: 'band' });
    expect(industrySteps).toHaveLength(7);
    expect(industrySteps[0].id).toBe('account_created');
    expect(industrySteps[0].completed).toBe(true);
    expect(industrySteps[4].id).toBe('add_birthday');
    expect(industrySteps[5].id).toBe('industry_create_claim_entity');
    expect(industrySteps[5].label).toContain('Create or claim a Band/Venue/Brand entity page');
    expect(industrySteps[6].id).toBe('industry_publish_flyer_track_merch');
    expect(industrySteps[6].label).toContain('Publish your first show flyer, track/clip, or merch listing');
  });

  it('enforces exact auto-completion thresholds across all 7 steps including Step 5 (Month & Day Birthday)', () => {
    // Only avatar uploaded (no cover), only 2 circles subscribed, and only birthday_month (missing day) -> Steps 2, 3, and 5 remain incomplete
    const partialSteps = resolveOnboardingChecklistSteps({
      role: 'fan',
      avatar_url: 'https://example.com/avatar.jpg',
      cover_url: '',
      subscribedCircles: ['Death Metal', 'Grindcore'],
      pushEnabled: false,
      birthday_month: 10,
      birthday_day: null,
      hasFirstPostOrReply: false,
      hasBookmarkedOrRsvpedShow: false,
    });

    expect(partialSteps[0].completed).toBe(true); // Step 1 pre-checked
    expect(partialSteps[1].completed).toBe(false); // Requires BOTH avatar_url && cover_url
    expect(partialSteps[2].completed).toBe(false); // Requires >= 3 circles
    expect(partialSteps[3].completed).toBe(false);
    expect(partialSteps[4].completed).toBe(false); // Requires BOTH birthday_month && birthday_day

    const partialSummary = calculateChecklistSummary(partialSteps);
    expect(partialSummary.completedCount).toBe(1);
    expect(partialSummary.totalCount).toBe(7);
    expect(partialSummary.percentage).toBe(14);
    expect(partialSummary.pillLabel).toBe('Profile Setup • 1/7 (14%)');
    expect(partialSummary.isComplete).toBe(false);

    // 3/7 completed (43% pill label check)
    const threeOfSevenSteps = resolveOnboardingChecklistSteps({
      role: 'fan',
      avatar_url: 'https://example.com/avatar.jpg',
      cover_url: 'https://example.com/cover.jpg',
      subscribedCircles: ['Death Metal', 'Black Metal', 'Grindcore'],
      pushEnabled: false,
      birthday_month: null,
      birthday_day: null,
      hasFirstPostOrReply: false,
      hasBookmarkedOrRsvpedShow: false,
    });
    const threeSummary = calculateChecklistSummary(threeOfSevenSteps);
    expect(threeSummary.completedCount).toBe(3);
    expect(threeSummary.totalCount).toBe(7);
    expect(threeSummary.percentage).toBe(43);
    expect(threeSummary.pillLabel).toBe('Profile Setup • 3/7 (43%)');

    // Adding Month & Day birthday completes Step 5 automatically (4/7 = 57%)
    const withBirthdaySteps = resolveOnboardingChecklistSteps({
      role: 'fan',
      avatar_url: 'https://example.com/avatar.jpg',
      cover_url: 'https://example.com/cover.jpg',
      subscribedCircles: ['Death Metal', 'Black Metal', 'Grindcore'],
      pushEnabled: false,
      birthday_month: 10,
      birthday_day: 31,
      hasFirstPostOrReply: false,
      hasBookmarkedOrRsvpedShow: false,
    });
    expect(withBirthdaySteps[4].completed).toBe(true);
    const fourSummary = calculateChecklistSummary(withBirthdaySteps);
    expect(fourSummary.completedCount).toBe(4);
    expect(fourSummary.percentage).toBe(57);
    expect(fourSummary.pillLabel).toBe('Profile Setup • 4/7 (57%)');
  });

  it('unlocks Scene Pioneer badge and auto-collapses when all 7 steps reach 100%', () => {
    const storage = createMemoryStorage();
    const userKey = 'pioneer_user_1';

    const completeSteps = resolveOnboardingChecklistSteps({
      role: 'promoter',
      avatar_url: 'https://example.com/avatar.jpg',
      cover_url: 'https://example.com/cover.jpg',
      subscribedCircles: ['Death Metal', 'Black Metal', 'Grindcore', 'Doom'],
      pushEnabled: true,
      birthday_month: 6,
      birthday_day: 6,
      hasCreatedOrClaimedEntity: true,
      hasPublishedFlyerTrackOrMerch: true,
    });

    const summary = calculateChecklistSummary(completeSteps);
    expect(summary.completedCount).toBe(7);
    expect(summary.totalCount).toBe(7);
    expect(summary.percentage).toBe(100);
    expect(summary.isComplete).toBe(true);
    expect(summary.unlockedBadge).toBe(SCENE_PIONEER_BADGE_LABEL);

    const syncedState = syncCompletionAndPioneerBadge(userKey, summary, storage);
    expect(syncedState.scenePioneerUnlocked).toBe(true);
    expect(syncedState.autoCollapsedOnComplete).toBe(true);
    expect(syncedState.minimized).toBe(true);
    expect(hasScenePioneerBadge({ id: userKey }, storage)).toBe(true);
  });

  it('persists minimize, confirmed dismissal, and Profile Settings restore state cleanly', () => {
    const storage = createMemoryStorage();
    const userKey = 'user_settings_test';

    // Default state
    expect(getChecklistPersistedState(userKey, storage)).toEqual({
      minimized: false,
      dismissed: false,
      scenePioneerUnlocked: false,
      autoCollapsedOnComplete: false,
    });

    // Minimize into compact pill
    setChecklistMinimized(userKey, true, storage);
    expect(getChecklistPersistedState(userKey, storage).minimized).toBe(true);

    // Dismiss after confirmation dialog
    dismissChecklistConfirmed(userKey, storage);
    expect(getChecklistPersistedState(userKey, storage).dismissed).toBe(true);

    // Restore from Profile Settings ("Show Setup Checklist" toggle)
    setShowSetupChecklist(userKey, true, storage);
    const restored = getChecklistPersistedState(userKey, storage);
    expect(restored.dismissed).toBe(false);
    expect(restored.minimized).toBe(false);
  });

  it('validates Month & Day birthdays without requiring birth year, and controls Birthday Shoutout visibility', () => {
    const storage = createMemoryStorage();
    const referenceDate = new Date(2026, 9, 31); // October 31 (month index 9 = October)

    // Valid Month & Day (no birth year needed)
    expect(hasValidBirthday(10, 31)).toBe(true);
    expect(hasValidBirthday(2, 29)).toBe(true);
    expect(formatBirthdayMonthDay(10, 31)).toBe('October 31');

    // Invalid or incomplete dates
    expect(hasValidBirthday(null, 31)).toBe(false);
    expect(hasValidBirthday(10, null)).toBe(false);
    expect(hasValidBirthday(2, 30)).toBe(false);
    expect(hasValidBirthday(4, 31)).toBe(false);
    expect(hasValidBirthday(13, 10)).toBe(false);
    expect(clampBirthdayDay(2, 31)).toBe(29);

    // Matching today's date & shoutout toggle (defaults to true)
    const birthdayUserDefault = {
      id: 'bday_user_1',
      name: 'Alex Mercer',
      birthday_month: 10,
      birthday_day: 31,
    };
    expect(isBirthdayToday(birthdayUserDefault, referenceDate, storage)).toBe(true);
    expect(shouldShowBirthdayShoutout(birthdayUserDefault, referenceDate, storage)).toBe(true);

    // Different day -> does not show
    expect(
      shouldShowBirthdayShoutout(
        { ...birthdayUserDefault, birthday_day: 30 },
        referenceDate,
        storage
      )
    ).toBe(false);

    // Explicit show_birthday_shoutout = false hides the badge even on the user's birthday
    const birthdayUserOptedOut = {
      ...birthdayUserDefault,
      show_birthday_shoutout: false,
    };
    expect(isBirthdayToday(birthdayUserOptedOut, referenceDate, storage)).toBe(true);
    expect(shouldShowBirthdayShoutout(birthdayUserOptedOut, referenceDate, storage)).toBe(false);

    // Persistence in storage
    saveBirthdayPrefsToStorage(
      'stored_user_99',
      { birthday_month: 10, birthday_day: 31, show_birthday_shoutout: true },
      storage
    );
    const loadedPrefs = loadBirthdayPrefsFromStorage('stored_user_99', storage);
    expect(loadedPrefs).toEqual({
      birthday_month: 10,
      birthday_day: 31,
      show_birthday_shoutout: true,
    });
    expect(shouldShowBirthdayShoutout({ id: 'stored_user_99' }, referenceDate, storage)).toBe(true);

    // Mutual connection & Birthday Horns message builder
    expect(isMutualConnection({ id: 'u2', isMutual: true }, { id: 'u1' })).toBe(true);
    expect(isMutualConnection({ id: 'u2' }, { id: 'u1', following: ['u2'] })).toBe(true);
    expect(isMutualConnection({ id: 'u2' }, { id: 'u1', following: [] })).toBe(false);
    expect(buildBirthdayHornsMessage('Alex Mercer')).toContain('Happy Birthday Alex Mercer! Sending Birthday Horns 🤘🎂🔥');
  });

  it('persists birthday preferences across id, email, console_handle keys and syncs into nexus_core_user_profile', () => {
    const storage = createMemoryStorage();
    const initialCoreProfile = {
      id: 'uuid-miguel-123',
      email: 'miguel@nexuslive.io',
      console_handle: '@bdmCEO',
      name: 'Miguel Medina',
      promoter_metadata: {
        brand_name: 'Nexus Live Productions',
      },
    };
    storage.setItem('nexus_core_user_profile', JSON.stringify(initialCoreProfile));

    // Save using console_handle key (e.g., from checklistUserKey)
    saveBirthdayPrefsToStorage(
      '@bdmCEO',
      { birthday_month: 11, birthday_day: 15, show_birthday_shoutout: true },
      storage
    );

    // Loading by id, email, or full profile object all resolve the saved birthday
    expect(loadBirthdayPrefsFromStorage('uuid-miguel-123', storage)).toEqual({
      birthday_month: 11,
      birthday_day: 15,
      show_birthday_shoutout: true,
    });
    expect(loadBirthdayPrefsFromStorage('miguel@nexuslive.io', storage)).toEqual({
      birthday_month: 11,
      birthday_day: 15,
      show_birthday_shoutout: true,
    });
    expect(loadBirthdayPrefsFromStorage({ id: 'uuid-miguel-123' }, storage)).toEqual({
      birthday_month: 11,
      birthday_day: 15,
      show_birthday_shoutout: true,
    });

    // And nexus_core_user_profile in storage is updated automatically
    const updatedCore = JSON.parse(storage.getItem('nexus_core_user_profile') || '{}');
    expect(updatedCore.birthday_month).toBe(11);
    expect(updatedCore.birthday_day).toBe(15);
    expect(updatedCore.show_birthday_shoutout).toBe(true);
    expect(updatedCore.promoter_metadata?.birthday_month).toBe(11);
    expect(updatedCore.promoter_metadata?.birthday_day).toBe(15);
  });
});

