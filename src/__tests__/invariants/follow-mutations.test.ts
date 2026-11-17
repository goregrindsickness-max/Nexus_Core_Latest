import { describe, it, expect } from 'vitest';
import {
  isProfileFollowedGlobally,
  saveFollowStateGlobally,
  syncScopedFollowsFromServer,
  getTargetFollowKeys,
} from '@/src/utils/followSyncService';
import {
  persistFollowToSupabase,
  persistUnfollowToSupabase,
  fetchFollowsForUser,
} from '@/src/components/social/follows/followService';
import { getSupabaseTableRows } from '@/src/__tests__/mocks';

describe('Invariant 3: Follow / Unfollow Mutations & Optimistic Reconciliation', () => {
  const FOLLOWER_ID = '33333333-4444-4555-8666-777777777777';
  const BAND_A_ID = 'aaaaaaaa-1111-4222-8333-444444444444';
  const BAND_B_ID = 'bbbbbbbb-1111-4222-8333-444444444444';
  const SHARED_CREATOR_ID = 'cccccccc-1111-4222-8333-444444444444';

  const bandA = {
    id: BAND_A_ID,
    band_name: 'Defeated Sanity',
    name: 'Defeated Sanity',
    type: 'band',
    isBandProfile: true,
    creator_id: SHARED_CREATOR_ID,
  };

  const bandB = {
    id: BAND_B_ID,
    band_name: 'Disgorge (USA)',
    name: 'Disgorge (USA)',
    type: 'band',
    isBandProfile: true,
    creator_id: SHARED_CREATOR_ID,
  };

  it('mutates only the explicitly targeted entity ID without bleeding follow state to other bands sharing the same creator_id', async () => {
    localStorage.setItem(
      'nexus_core_user_profile',
      JSON.stringify({ id: FOLLOWER_ID, email: 'fan@nexus.org' })
    );

    // Confirm creator_id is excluded from entity follow keys
    const bandAKeys = getTargetFollowKeys(bandA);
    expect(bandAKeys).toContain(BAND_A_ID);
    expect(bandAKeys).not.toContain(SHARED_CREATOR_ID);

    // Follow Band A
    saveFollowStateGlobally(bandA, true, FOLLOWER_ID);
    const res = await persistFollowToSupabase(FOLLOWER_ID, BAND_A_ID, 'band');
    expect(res.success).toBe(true);

    const serverFollows = await fetchFollowsForUser(FOLLOWER_ID, 'following');
    expect(serverFollows).toHaveLength(1);
    expect(serverFollows[0].followed_id).toBe(BAND_A_ID);

    // Band A is followed, Band B (same creator_id) remains unfollowed
    expect(isProfileFollowedGlobally(bandA, serverFollows, FOLLOWER_ID)).toBe(true);
    expect(isProfileFollowedGlobally(bandB, serverFollows, FOLLOWER_ID)).toBe(false);
  });

  it('prevents duplicate follow rows in Supabase when following the same entity multiple times', async () => {
    await persistFollowToSupabase(FOLLOWER_ID, BAND_A_ID, 'band');
    await persistFollowToSupabase(FOLLOWER_ID, BAND_A_ID, 'band');
    await persistFollowToSupabase(FOLLOWER_ID, BAND_A_ID, 'band');

    const allFollowRows = getSupabaseTableRows('follows');
    expect(allFollowRows).toHaveLength(1);
    expect(allFollowRows[0]).toMatchObject({
      follower_id: FOLLOWER_ID,
      followed_id: BAND_A_ID,
    });
  });

  it('reconciles optimistic UI localStorage state with authoritative Supabase responses on unfollow and server sync', async () => {
    localStorage.setItem(
      'nexus_core_user_profile',
      JSON.stringify({ id: FOLLOWER_ID, email: 'fan@nexus.org' })
    );

    // 1. Optimistically follow Band A and persist to Supabase
    saveFollowStateGlobally(bandA, true, FOLLOWER_ID);
    await persistFollowToSupabase(FOLLOWER_ID, BAND_A_ID, 'band');

    let serverFollows = await fetchFollowsForUser(FOLLOWER_ID, 'following');
    expect(isProfileFollowedGlobally(bandA, serverFollows, FOLLOWER_ID)).toBe(true);

    // 2. Unfollow Band A
    saveFollowStateGlobally(bandA, false, FOLLOWER_ID);
    const unfollowRes = await persistUnfollowToSupabase(FOLLOWER_ID, BAND_A_ID);
    expect(unfollowRes.success).toBe(true);

    serverFollows = await fetchFollowsForUser(FOLLOWER_ID, 'following');
    expect(serverFollows).toHaveLength(0);
    expect(isProfileFollowedGlobally(bandA, serverFollows, FOLLOWER_ID)).toBe(false);
    // Offline/local fallback also reflects unfollowed state
    expect(isProfileFollowedGlobally(bandA, undefined, FOLLOWER_ID)).toBe(false);

    // 3. Reconcile local cache from authoritative server list (e.g. Band B followed on another device)
    await persistFollowToSupabase(FOLLOWER_ID, BAND_B_ID, 'band');
    serverFollows = await fetchFollowsForUser(FOLLOWER_ID, 'following');
    syncScopedFollowsFromServer(
      serverFollows.map((r) => r.followed_id),
      FOLLOWER_ID
    );

    expect(isProfileFollowedGlobally(bandA, serverFollows, FOLLOWER_ID)).toBe(false);
    expect(isProfileFollowedGlobally(bandB, serverFollows, FOLLOWER_ID)).toBe(true);
    expect(isProfileFollowedGlobally(bandB, undefined, FOLLOWER_ID)).toBe(true);
  });
});
