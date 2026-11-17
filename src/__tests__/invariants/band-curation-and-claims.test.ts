import { describe, it, expect, afterEach } from 'vitest';
import {
  sanitizeBandPayload,
  upsertBandToDatabase,
} from '@/src/services/bandService';
import {
  sanitizeReleaseForDb,
  upsertReleasesBatchToDatabase,
} from '@/src/services/releasesService';
import { executeWithSchemaResilience } from '@/src/services/schemaResilienceService';
import { communityBandManager, parseBandLineup } from '@/src/lib/communityBands';
import { INITIAL_COMMUNITY_BANDS } from '@/server/seeds/seedBandsData';
import {
  seedSupabaseTable,
  getSupabaseTableRows,
} from '@/src/__tests__/mocks';

describe('Invariant 2: Band Curation Persistence & Entity Claims', () => {
  const OWNER_USER_ID = '22222222-3333-4444-8555-666666666666';
  const CLAIMING_USER_ID = '77777777-8888-4999-8000-111111111111';
  const MORTICIAN_UUID = '99999999-aaaa-4bbb-8ccc-dddddddddddd';

  afterEach(() => {
    communityBandManager.resetAuthoritativeSync();
  });

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

  it('prevents partial band saves without allowEmptyLineup from wiping existing lineups in Supabase', async () => {
    const initialLineup = [
      { id: 'df-1', name: 'John Gallagher', role: 'Guitars, Vocals', status: 'active' as const, years: '1991–present' },
      { id: 'df-2', name: 'Sean Beasley', role: 'Bass, Vocals', status: 'active' as const, years: '2001–present' },
      { id: 'df-3', name: 'Trey Williams', role: 'Drums', status: 'active' as const, years: '2007–present' },
    ];
    const DYING_FETUS_UUID = 'be50f294-36d8-4a1c-8e50-f29436d87a1c';

    seedSupabaseTable('bands', [
      {
        id: DYING_FETUS_UUID,
        band_name: 'Dying Fetus',
        custom_slug: 'dying-fetus',
        lineup: JSON.stringify(initialLineup),
        bio: 'Original bio',
      },
    ]);

    // Perform an update where lineup is empty array [] but allowEmptyLineup is false/omitted
    await upsertBandToDatabase(
      {
        id: DYING_FETUS_UUID,
        band_name: 'Dying Fetus',
        custom_slug: 'dying-fetus',
        bio: 'Updated bio without touching lineup',
        lineup: [],
      },
      { allowEmptyLineup: false }
    );

    const dbRows = getSupabaseTableRows('bands');
    const updatedRow = dbRows.find((r) => r.id === DYING_FETUS_UUID);
    expect(updatedRow).toBeDefined();
    expect(updatedRow?.bio).toBe('Updated bio without touching lineup');
    expect(parseBandLineup(updatedRow?.lineup)).toHaveLength(3);
  });

  it('parses comma-separated roles inside parentheses without splitting members and heals legacy split fragments', () => {
    const parsedFromString = parseBandLineup(
      'John Gallagher (Lead Guitars, Vocals), Sean Beasley (Bass, Vocals), Trey Williams (Drums)'
    );
    expect(parsedFromString).toHaveLength(3);
    expect(parsedFromString[0]).toMatchObject({
      name: 'John Gallagher',
      role: 'Lead Guitars, Vocals',
    });
    expect(parsedFromString[1]).toMatchObject({
      name: 'Sean Beasley',
      role: 'Bass, Vocals',
    });
    expect(parsedFromString[2]).toMatchObject({
      name: 'Trey Williams',
      role: 'Drums',
    });

    // Also heals previously corrupted array fragments
    const corruptedFragments = [
      { name: 'John Gallagher (Lead Guitars', role: 'Musician' },
      { name: 'Vocals)', role: 'Musician' },
      { name: 'Sean Beasley (Bass', role: 'Musician' },
      { name: 'Vocals)', role: 'Musician' },
      { name: 'Trey Williams', role: 'Drums' },
    ];
    const healed = parseBandLineup(corruptedFragments);
    expect(healed).toHaveLength(3);
    expect(healed.map((m) => ({ name: m.name, role: m.role }))).toEqual([
      { name: 'John Gallagher', role: 'Lead Guitars, Vocals' },
      { name: 'Sean Beasley', role: 'Bass, Vocals' },
      { name: 'Trey Williams', role: 'Drums' },
    ]);
  });

  it('never misclassifies release payloads containing band_name as band rows during schema resilience', async () => {
    const CANNIBAL_UUID = 'def01697-734a-43fa-8b88-66166b28f743';
    const releaseInput = {
      id: 'a3cd69b7-85e4-433c-b660-ba11d65161e8',
      band_id: CANNIBAL_UUID,
      band: 'Cannibal Corpse',
      band_name: 'Cannibal Corpse',
      artist: 'Cannibal Corpse',
      title: 'Eaten Back to Life',
      type: 'album',
      release_date: '1990',
      tracks: [{ id: 't1', title: 'Shredded Humans', duration: '5:11' }],
    };

    const sanitized = sanitizeReleaseForDb(releaseInput);
    expect(sanitized.band_id).toBe(CANNIBAL_UUID);
    expect(sanitized.band).toBe('Cannibal Corpse');
    expect(sanitized.band_name).toBeUndefined();
    expect(sanitized.artist).toBeUndefined();
    expect(sanitized.title).toBe('Eaten Back to Life');

    let capturedPayload: any = null;
    await executeWithSchemaResilience(async (payload) => {
      capturedPayload = payload;
      return { data: payload, error: null };
    }, [releaseInput]);

    expect(Array.isArray(capturedPayload)).toBe(true);
    expect(capturedPayload[0].band_id).toBe(CANNIBAL_UUID);
    expect(capturedPayload[0].title).toBe('Eaten Back to Life');
    expect(capturedPayload[0].band_name).toBeUndefined();

    const batchRes = await upsertReleasesBatchToDatabase([releaseInput as any], CANNIBAL_UUID);
    expect(batchRes.success).toBe(true);
    const dbReleases = getSupabaseTableRows('releases');
    expect(dbReleases.some((r) => r.id === releaseInput.id && r.band_id === CANNIBAL_UUID)).toBe(true);
  });

  it('ensures all 50 canonical bands in INITIAL_COMMUNITY_BANDS have valid UUIDs, non-empty lineups, and releases', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(INITIAL_COMMUNITY_BANDS.length).toBeGreaterThanOrEqual(50);

    for (const band of INITIAL_COMMUNITY_BANDS) {
      expect(uuidRegex.test(band.id)).toBe(true);
      expect(Array.isArray(band.lineup)).toBe(true);
      expect((band.lineup || []).length).toBeGreaterThan(0);
      expect(Array.isArray(band.discography)).toBe(true);
      expect((band.discography || []).length).toBeGreaterThan(0);
    }
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

  it('syncs 50+ band records authoritatively in alphabetical order, resolves avatar_url/logo_url/image_url/logo/profile.avatar_url, overwrites stale localStorage, and never injects Unsplash URLs', async () => {
    const TOTAL_BANDS = 55;
    const staleUnsplash =
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=120';

    const rows = Array.from({ length: TOTAL_BANDS }, (_, idx) => {
      const num = String(TOTAL_BANDS - idx).padStart(2, '0');
      const id = `00000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`;
      const bandName = `Archive Band ${num}`;
      const logoUrl = `https://mock.supabase.co/storage/v1/object/public/community-bands/band_${num}.webp`;

      if (idx % 6 === 0) {
        return { id, band_name: bandName, custom_slug: `archive-band-${num}`, avatar_url: logoUrl };
      }
      if (idx % 6 === 1) {
        return { id, band_name: bandName, custom_slug: `archive-band-${num}`, logo_url: logoUrl };
      }
      if (idx % 6 === 2) {
        return { id, band_name: bandName, custom_slug: `archive-band-${num}`, image_url: logoUrl };
      }
      if (idx % 6 === 3) {
        return { id, band_name: bandName, custom_slug: `archive-band-${num}`, logo: logoUrl };
      }
      if (idx % 6 === 4) {
        return {
          id,
          band_name: bandName,
          custom_slug: `archive-band-${num}`,
          profile: { avatar_url: logoUrl },
        };
      }
      // Every 6th band intentionally has NO saved logo (must stay empty, never Unsplash)
      return {
        id,
        band_name: bandName,
        custom_slug: `archive-band-${num}`,
        avatar_url: null,
        logo_url: null,
      };
    });

    // Pre-seed stale localStorage cache with Unsplash fallback URLs and an outdated band entry
    const noLogoRow = rows.find((r) => r.avatar_url === null)!;
    const avatarRow = rows.find((r) => Boolean(r.avatar_url))!;
    localStorage.setItem(`nexus_core_band_logo_${noLogoRow.id}`, staleUnsplash);
    localStorage.setItem(`nexus_core_band_logo_${avatarRow.id}`, staleUnsplash);
    localStorage.setItem(
      'nexus_community_bands_v2',
      JSON.stringify([
        {
          id: avatarRow.id,
          name: avatarRow.band_name,
          logo_url: staleUnsplash,
          avatar_url: staleUnsplash,
          updated_at: '2099-01-01T00:00:00.000Z',
        },
        {
          id: 'stale-local-only-band',
          name: 'Stale Local Ghost Band',
          logo_url: staleUnsplash,
          avatar_url: staleUnsplash,
        },
      ])
    );

    seedSupabaseTable('bands', rows);

    const synced = await communityBandManager.fetchFromSupabase({ authoritative: true });

    // 1. All 55 bands appear without 44 or 50 truncation, and stale local-only band is gone
    expect(synced).toHaveLength(TOTAL_BANDS);
    expect(synced.some((b) => b.id === 'stale-local-only-band')).toBe(false);

    // 2. Strict alphabetical order
    const names = synced.map((b) => b.name);
    const expectedOrder = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
    );
    expect(names).toEqual(expectedOrder);

    // 3. Every logo column source resolves cleanly & zero Unsplash URLs anywhere
    for (const row of rows) {
      const matched = synced.find((b) => b.id === row.id);
      expect(matched).toBeDefined();
      const expectedUrl =
        row.avatar_url ||
        (row as any).logo_url ||
        (row as any).image_url ||
        (row as any).logo ||
        (row as any).profile?.avatar_url ||
        '';
      expect(matched?.logo_url).toBe(expectedUrl);
      expect(matched?.avatar_url).toBe(expectedUrl);
    }

    for (const b of synced) {
      expect((b.avatar_url || '').toLowerCase()).not.toContain('unsplash');
      expect((b.logo_url || '').toLowerCase()).not.toContain('unsplash');
    }

    // 4. Stale Unsplash localStorage entries were overwritten or cleared
    expect(localStorage.getItem(`nexus_core_band_logo_${avatarRow.id}`)).toBe(avatarRow.avatar_url);
    expect(localStorage.getItem(`nexus_core_band_logo_${noLogoRow.id}`)).toBeNull();
  });
});

