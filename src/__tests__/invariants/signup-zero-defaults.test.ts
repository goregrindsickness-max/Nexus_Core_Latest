import { describe, it, expect } from 'vitest';
import {
  normalizeLoadedProfile,
  sanitizeProfilePayload,
  extractGlobalProfilePayload,
  executeSanitizedProfileUpsert,
} from '@/src/services/profileService';
import { fetchUserBands } from '@/src/services/bandService';
import {
  isProfileFollowedGlobally,
  getScopedFollowsMap,
} from '@/src/utils/followSyncService';
import { fetchFollowsForUser } from '@/src/components/social/follows/followService';
import { INITIAL_COMMUNITY_BANDS } from '@/server/seeds/seedBandsData';
import {
  mockSupabaseClient,
  seedSupabaseTable,
  getSupabaseTableRows,
} from '@/src/__tests__/mocks';

describe('Invariant 1: Signup Zero Defaults & Strict Opt-In Ownership', () => {
  const NEW_USER_UUID = '11111111-2222-4333-8444-555555555555';

  it('initializes a newly registered user profile with zero inherited entities/bands and clean default metadata', async () => {
    const rawRegistrationInput = {
      id: NEW_USER_UUID,
      email: 'newartist@underground.org',
      full_name: 'Elena Vance',
      console_handle: '@elenavance',
      account_type: 'fan',
      active_workspace: 'fan_only',
      registered_workspaces: ['fan_only'],
    };

    const sanitized = sanitizeProfilePayload(rawRegistrationInput);
    expect(sanitized.id).toBe(NEW_USER_UUID);
    expect(sanitized.band_id).toBeUndefined();
    expect(sanitized.band_name).toBeUndefined();
    expect(sanitized.promoter_id).toBeUndefined();
    expect(sanitized.creative_id).toBeUndefined();
    expect(sanitized.label_id).toBeUndefined();
    expect(sanitized.registered_workspaces).toEqual(['fan_only']);

    await executeSanitizedProfileUpsert(mockSupabaseClient, rawRegistrationInput);

    const savedProfiles = getSupabaseTableRows('profiles');
    expect(savedProfiles).toHaveLength(1);

    const normalized = normalizeLoadedProfile(savedProfiles[0]);
    expect(normalized.id).toBe(NEW_USER_UUID);
    expect(normalized.band_id).toBeUndefined();
    expect(normalized.band_name).toBeUndefined();
    expect(normalized.promoter_id).toBeUndefined();
    expect(normalized.promoter_name).toBeUndefined();
    expect(normalized.promoter_metadata).toBeUndefined();
    expect(normalized.creative_id).toBeUndefined();
    expect(normalized.label_id).toBeUndefined();
  });

  it('strips accidental demo or unconfirmed promoter/band pollution from non-owner accounts on load', () => {
    const pollutedNewProfile = {
      id: NEW_USER_UUID,
      email: 'freshfan@scene.net',
      full_name: 'Fresh Fan',
      account_type: 'fan',
      active_workspace: 'fan_only',
      band_name: 'NecroticGoreBeast',
      promoter_name: 'Nexus Live Productions',
      promoter_agency: 'Nexus Live Productions',
      registered_workspaces: ['fan_only', 'promoter'],
    };

    const normalized = normalizeLoadedProfile(pollutedNewProfile);

    expect(normalized.band_name).toBeUndefined();
    expect(normalized.bandName).toBeUndefined();
    expect(normalized.promoter_name).toBeUndefined();
    expect(normalized.promoter_agency).toBeUndefined();
    expect(normalized.promoter_metadata).toBeUndefined();
    expect(normalized.registered_workspaces).toEqual(['fan_only']);
  });

  it('never pulls static seed bands into a new user account when querying owned bands', async () => {
    // Seed the database with bands owned by other users or community archives (creator_id: null)
    seedSupabaseTable(
      'bands',
      INITIAL_COMMUNITY_BANDS.slice(0, 5).map((seed, idx) => ({
        id: `00000000-0000-4000-8000-00000000010${idx}`,
        band_name: seed.name,
        creator_id: null,
        logo_url: seed.logo_url,
      }))
    );

    const userBands = await fetchUserBands(NEW_USER_UUID);
    expect(userBands).toEqual([]);
  });

  it('starts new profiles with zero auto-followed bands or accounts in both Supabase and localStorage', async () => {
    localStorage.setItem(
      'nexus_core_user_profile',
      JSON.stringify({
        id: NEW_USER_UUID,
        email: 'newartist@underground.org',
        account_type: 'fan',
      })
    );

    const serverFollows = await fetchFollowsForUser(NEW_USER_UUID, 'following');
    expect(serverFollows).toEqual([]);

    const scopedMap = getScopedFollowsMap(NEW_USER_UUID);
    expect(Object.keys(scopedMap)).toHaveLength(0);

    for (const seedBand of INITIAL_COMMUNITY_BANDS.slice(0, 10)) {
      expect(
        isProfileFollowedGlobally(seedBand, serverFollows, NEW_USER_UUID)
      ).toBe(false);
    }
  });

  it('isolates global profile payload extraction from unrequested workspace metadata', () => {
    const rawSignup = {
      id: NEW_USER_UUID,
      email: 'solo@artist.io',
      name: 'Solo Member',
      handle: '@solomember',
      role: 'fan',
      active_workspace: 'fan_only',
      registered_workspaces: ['fan_only'],
      band_name: 'NecroticGoreBeast',
    };

    const globalPayload = extractGlobalProfilePayload(rawSignup, NEW_USER_UUID);
    expect(globalPayload.id).toBe(NEW_USER_UUID);
    expect(globalPayload.account_type).toBe('fan');
    expect(globalPayload.band_name).toBeUndefined();
    expect(globalPayload.band_id).toBeUndefined();
  });
});
