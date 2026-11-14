import { describe, it, expect } from 'vitest';
import {
  sanitizeBandPayload,
  upsertBandToDatabase,
} from '@/src/services/bandService';
import { communityBandManager } from '@/src/lib/communityBands';
import { INITIAL_COMMUNITY_BANDS } from '@/server/seeds/seedBandsData';
import {
  seedSupabaseTable,
  getSupabaseTableRows,
} from '@/src/__tests__/mocks';

describe('Invariant 2: Band Curation Persistence & Entity Claims', () => {
  const OWNER_USER_ID = '22222222-3333-4444-8555-666666666666';
  const CLAIMING_USER_ID = '77777777-8888-4999-8000-111111111111';
  const MORTICIAN_UUID = '99999999-aaaa-4bbb-8ccc-dddddddddddd';

  it('preserves user-curated band lineups and custom uploaded logos without reverting to seed defaults during Supabase sync', async () => {
    const customLogoUrl =
      'https://mock.supabase.co/storage/v1/object/public/community-bands/custom_mortician_logo.webp';
    const customCoverUrl =
      'https://mock.supabase.co/storage/v1/object/public/bannersv2/custom_mortician_banner.webp';
    const curatedLineup = [
      {
        id: 'mem-will-rahmer',
        name: 'Will Rahmer',
        role: 'Bass / Vocals',
        status: 'active' as const,
        years: '1989–Present',
      },
      {
        id: 'mem-roger-beaujard',
        name: 'Roger J. Beaujard',
        role: 'Guitars / Drum Programming',
        status: 'active' as const,
        years: '1989–Present',
      },
    ];

    seedSupabaseTable('bands', [
      {
        id: MORTICIAN_UUID,
        band_name: 'Mortician',
        custom_slug: 'mortician',
        creator_id: OWNER_USER_ID,
        logo_url: customLogoUrl,
        cover_url: customCoverUrl,
        lineup: JSON.stringify(curatedLineup),
        bio: 'Custom curated bio from band owner.',
        updated_at: '2026-11-13T12:00:00.000Z',
      },
    ]);

    const syncedBands = await communityBandManager.fetchFromSupabase();
    const mortician = syncedBands.find(
      (b) => b.name.toLowerCase() === 'mortician'
    );

    expect(mortician).toBeDefined();
    expect(mortician?.logo_url).toBe(customLogoUrl);
    expect(mortician?.avatar_url).toBe(customLogoUrl);
    expect(mortician?.cover_url).toBe(customCoverUrl);
    expect(mortician?.lineup).toHaveLength(2);
    expect(mortician?.lineup?.map((m) => m.name)).toEqual([
      'Will Rahmer',
      'Roger J. Beaujard',
    ]);
  });

  it('preserves an intentionally empty lineup ([]) when a user removes all members, never re-injecting static seed members', async () => {
    // Seed band in INITIAL_COMMUNITY_BANDS has a non-empty seed lineup
    const seedMortician = INITIAL_COMMUNITY_BANDS.find(
      (b) => b.name.toLowerCase() === 'mortician'
    );
    expect((seedMortician?.lineup || []).length).toBeGreaterThan(0);

    // User intentionally clears all lineup members and saves to Supabase
    const sanitizedEmpty = sanitizeBandPayload({
      id: MORTICIAN_UUID,
      band_name: 'Mortician',
      custom_slug: 'mortician',
      creator_id: OWNER_USER_ID,
      lineup: [],
    });
    expect(sanitizedEmpty.lineup).toBe('[]');

    await upsertBandToDatabase(
      {
        id: MORTICIAN_UUID,
        band_name: 'Mortician',
        custom_slug: 'mortician',
        creator_id: OWNER_USER_ID,
        logo_url: 'https://mock.supabase.co/storage/v1/object/public/community-bands/mortician_custom.webp',
        lineup: [],
      },
      { allowEmptyLineup: true }
    );

    const dbRows = getSupabaseTableRows('bands');
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].lineup).toBe('[]');

    // Now run full Supabase-to-client sync and verify the empty lineup is respected and NOT overwritten by seedMatch.lineup
    const syncedBands = await communityBandManager.fetchFromSupabase();
    const morticianAfterSync = syncedBands.find(
      (b) => b.name.toLowerCase() === 'mortician'
    );

    expect(morticianAfterSync).toBeDefined();
    expect(morticianAfterSync?.lineup).toEqual([]);
    expect(
      localStorage.getItem(`nexus_core_band_lineup_${MORTICIAN_UUID}`)
    ).toBe('[]');
  });

  it('transfers ownership cleanly when claiming an unowned community band entity without duplicating records', async () => {
    const seedDevourment = INITIAL_COMMUNITY_BANDS.find(
      (b) => b.name.toLowerCase() === 'devourment'
    )!;
    communityBandManager.upsertCommunityBand({ ...seedDevourment, creator_id: undefined });

    const allBefore = communityBandManager.getAll();
    const targetBand = allBefore.find(
      (b) => b.name.toLowerCase() === 'devourment'
    );
    expect(targetBand).toBeDefined();
    const originalCount = allBefore.filter(
      (b) => b.name.toLowerCase() === 'devourment'
    ).length;
    expect(originalCount).toBe(1);

    const originalDiscographyLength = targetBand?.discography?.length || 0;

    const claimResult = communityBandManager.claimBandHandover(
      targetBand!.id,
      CLAIMING_USER_ID
    );

    expect(claimResult.success).toBe(true);
    expect(claimResult.bandRecord.id).toBe(targetBand!.id);
    expect(claimResult.bandRecord.creator_id).toBe(CLAIMING_USER_ID);
    expect(claimResult.bandRecord.claimed_by_user_id).toBe(CLAIMING_USER_ID);
    expect(claimResult.bandRecord.verification_status).toBe('verified_official');
    expect(claimResult.bandRecord.discography?.length || 0).toBe(
      originalDiscographyLength
    );

    // Ensure zero duplicate records were created in communityBandManager
    const allAfter = communityBandManager.getAll();
    const matchingAfter = allAfter.filter(
      (b) => b.name.toLowerCase() === 'devourment'
    );
    expect(matchingAfter).toHaveLength(1);
    expect(matchingAfter[0].id).toBe(targetBand!.id);
    expect(matchingAfter[0].creator_id).toBe(CLAIMING_USER_ID);
  });
});
