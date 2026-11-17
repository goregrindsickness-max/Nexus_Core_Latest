import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueOfflineAction,
  getOfflineQueue,
  saveOfflineQueue,
  processOfflineQueue,
} from '@/src/services/offlineSyncService';
import { communityBandManager } from '@/src/lib/communityBands';
import {
  seedSupabaseTable,
  getSupabaseTableRows,
} from '@/src/__tests__/mocks';

describe('Invariant 4: Authoritative Online Sync & Chronological Offline Queue Replay', () => {
  const BAND_ID = '44444444-5555-4666-8777-888888888888';

  beforeEach(() => {
    saveOfflineQueue([]);
  });

  it('ensures Supabase records win over stale localStorage cache entries when online', async () => {
    // 1. Seed stale local cache in localStorage
    const staleLogo = 'https://stale.example.com/old_logo.webp';
    const staleLineup = [{ id: 'stale-1', name: 'Old Member', role: 'Vocals' }];

    localStorage.setItem(`nexus_core_band_logo_${BAND_ID}`, staleLogo);
    localStorage.setItem(
      `nexus_core_band_lineup_${BAND_ID}`,
      JSON.stringify(staleLineup)
    );
    localStorage.setItem(
      'nexus_community_bands_v2',
      JSON.stringify([
        {
          id: BAND_ID,
          name: 'Suffocation',
          band_name: 'Suffocation',
          genre: 'Brutal Death Metal',
          logo_url: staleLogo,
          avatar_url: staleLogo,
          lineup: staleLineup,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          verification_status: 'verified_official',
        },
      ])
    );

    // 2. Seed newer authoritative record in Supabase
    const authoritativeLogo =
      'https://mock.supabase.co/storage/v1/object/public/community-bands/suffocation_2026.webp';
    const authoritativeLineup = [
      { id: 'auth-1', name: 'Terrance Hobbs', role: 'Lead Guitar', status: 'active' },
      { id: 'auth-2', name: 'Derek Boyer', role: 'Bass', status: 'active' },
      { id: 'auth-3', name: 'Ricky Myers', role: 'Vocals', status: 'active' },
    ];

    seedSupabaseTable('bands', [
      {
        id: BAND_ID,
        band_name: 'Suffocation',
        custom_slug: 'suffocation',
        logo_url: authoritativeLogo,
        lineup: JSON.stringify(authoritativeLineup),
        bio: 'Authoritative Supabase biography.',
        updated_at: '2026-11-13T14:00:00.000Z',
      },
    ]);

    // 3. Fetch from Supabase while online -> Supabase wins and updates read-through localStorage cache
    const synced = await communityBandManager.fetchFromSupabase();
    const suffocation = synced.find((b) => b.id === BAND_ID);

    expect(suffocation).toBeDefined();
    expect(suffocation?.logo_url).toBe(authoritativeLogo);
    expect(suffocation?.lineup).toHaveLength(3);
    expect(suffocation?.lineup?.map((m) => m.name)).toContain('Terrance Hobbs');

    // Read-through cache is updated to match Supabase
    expect(localStorage.getItem(`nexus_core_band_logo_${BAND_ID}`)).toBe(
      authoritativeLogo
    );
    expect(
      JSON.parse(localStorage.getItem(`nexus_core_band_lineup_${BAND_ID}`) || '[]')
    ).toHaveLength(3);
  });

  it('queues offline mutations cleanly without duplicates and replays them in strict chronological order upon reconnect', async () => {
    const ITEM_ID = '55555555-6666-4777-8888-999999999999';

    // Enqueue 1: Insert new inventory item while offline
    enqueueOfflineAction({
      id: 'act-1',
      table: 'inventory',
      action: 'insert',
      payload: {
        id: ITEM_ID,
        name: 'Tour Hoodie 2026',
        table_stock: 25,
        van_stock: 50,
        price: 45,
      },
      eqFilters: [],
      timestamp: '2026-11-13T10:00:00.000Z',
    });

    // Duplicate of Enqueue 1 should be ignored
    enqueueOfflineAction({
      id: 'act-1-dup',
      table: 'inventory',
      action: 'insert',
      payload: {
        id: ITEM_ID,
        name: 'Tour Hoodie 2026',
        table_stock: 25,
        van_stock: 50,
        price: 45,
      },
      eqFilters: [],
      timestamp: '2026-11-13T10:00:01.000Z',
    });

    // Enqueue 2: Update table_stock after a POS sale while still offline
    enqueueOfflineAction({
      id: 'act-2',
      table: 'inventory',
      action: 'update',
      payload: {
        table_stock: 22,
      },
      eqFilters: [{ column: 'id', value: ITEM_ID }],
      timestamp: '2026-11-13T10:05:00.000Z',
    });

    // Enqueue 3: Second update to table_stock while offline
    enqueueOfflineAction({
      id: 'act-3',
      table: 'inventory',
      action: 'update',
      payload: {
        table_stock: 19,
      },
      eqFilters: [{ column: 'id', value: ITEM_ID }],
      timestamp: '2026-11-13T10:10:00.000Z',
    });

    expect(getOfflineQueue()).toHaveLength(3);

    // Replay offline queue upon reconnect
    await processOfflineQueue();

    expect(getOfflineQueue()).toHaveLength(0);

    const inventoryRows = getSupabaseTableRows('inventory');
    expect(inventoryRows).toHaveLength(1);
    // Chronological replay: insert(25) -> update(22) -> update(19)
    expect(inventoryRows[0].id).toBe(ITEM_ID);
    expect(inventoryRows[0].name).toBe('Tour Hoodie 2026');
    expect(inventoryRows[0].table_stock).toBe(19);
    expect(inventoryRows[0].van_stock).toBe(50);
  });

  it('preserves unrelated server-edited columns when replaying targeted field updates from the offline queue', async () => {
    const SHOW_ID = '66666666-7777-4888-8999-000000000000';

    // Server already has a newer edit on `venue_capacity` and `ticket_link`
    seedSupabaseTable('shows', [
      {
        id: SHOW_ID,
        venue: 'Reggies Rock Club',
        city: 'Chicago',
        date: '2026-12-01',
        status: 'Upcoming',
        guarantee: 1500,
        notes: 'Server-updated production notes from promoter',
      },
    ]);

    // Client queued a targeted status update while offline
    enqueueOfflineAction({
      id: 'act-show-update',
      table: 'shows',
      action: 'update',
      payload: {
        status: 'Active',
      },
      eqFilters: [{ column: 'id', value: SHOW_ID }],
      timestamp: '2026-11-13T11:00:00.000Z',
    });

    await processOfflineQueue();

    const showRows = getSupabaseTableRows('shows');
    expect(showRows).toHaveLength(1);
    expect(showRows[0].status).toBe('Active');
    // Server's existing columns (`notes`, `guarantee`, `venue`) were not clobbered
    expect(showRows[0].notes).toBe('Server-updated production notes from promoter');
    expect(showRows[0].guarantee).toBe(1500);
  });
});
