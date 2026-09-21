import { getSupabase, executeWithSchemaResilience } from '../../../supabase';

export interface FollowRecord {
  id?: string;
  follower_id: string;
  followed_id: string;
  target_type?: string;
  created_at?: string;
}

export const isValidUUID = (str: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const extractUUID = (idOrStr: any): string | null => {
  if (!idOrStr) return null;
  const str = typeof idOrStr === 'object' ? String(idOrStr.id || idOrStr.user_id || idOrStr.profile_id || '') : String(idOrStr);
  const match = str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return match ? match[0] : null;
};

const generateDeterministicUUID = (seed: string): string => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = ((h2 >>> 16) & 0xffff).toString(16).padStart(4, '0');
  const part3 = ((h2 & 0x0fff) | 0x4000).toString(16).padStart(4, '0');
  const part4 = ((h1 & 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const part5 = (((h1 >>> 8) ^ h2) >>> 0).toString(16).padStart(8, '0') + ((h2 >>> 8) & 0xffff).toString(16).padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}-${part5.slice(0, 12)}`;
};

/**
 * Persists a follow relationship to Supabase database.
 * Gracefully handles permissions / RLS sandbox warnings.
 */
export async function persistFollowToSupabase(
  followerId: string,
  targetId: string,
  targetType: string = 'band'
): Promise<{ success: boolean; error?: any }> {
  const supabase = getSupabase();
  if (!supabase || !isValidUUID(followerId) || !isValidUUID(targetId)) {
    return { success: false, error: 'Invalid parameters or missing Supabase client' };
  }

  try {
    const followId = generateDeterministicUUID(`follow-${followerId}-${targetId}`);
    const payload = {
      id: followId,
      follower_id: followerId,
      followed_id: targetId,
      target_type: targetType || 'band',
    };

    const res = await executeWithSchemaResilience(
      async (p) => supabase.from('follows').upsert([p], { onConflict: 'follower_id,followed_id' }),
      payload
    );

    if (res.error) {
      const insertRes = await executeWithSchemaResilience(
        async (p) => supabase.from('follows').insert([p]),
        payload
      );
      if (insertRes.error) {
        return { success: false, error: insertRes.error.message };
      }
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Persist follow exception:', err?.message || err);
    return { success: false, error: err };
  }
}

/**
 * Removes a follow relationship from Supabase database.
 */
export async function persistUnfollowToSupabase(
  followerId: string,
  targetId: string
): Promise<{ success: boolean; error?: any }> {
  const supabase = getSupabase();
  if (!supabase || !isValidUUID(followerId) || !isValidUUID(targetId)) {
    return { success: false, error: 'Invalid parameters or missing Supabase client' };
  }

  const { data: { session } } = await supabase.auth.getSession();
  console.log("🔍 Session Check before Unfollow:", {
    isAuthenticated: !!session,
    sessionUserId: session?.user?.id,
    passedFollowerId: followerId
  });

  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', targetId);

    if (error) {
      const isPerm = error.code === '42501' || error.message?.toLowerCase().includes('permission denied');
      if (isPerm) {
        console.warn('Supabase Unfollow Notice (RLS/Permission restricted in database sandbox):', error.message);
      } else {
        console.warn('Supabase Unfollow error:', error.message);
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Persist unfollow exception:', err?.message || err);
    return { success: false, error: err };
  }
}

/**
 * Fetches all active followers or following records for a given user ID.
 */
export async function fetchFollowsForUser(
  userId: string,
  type: 'followers' | 'following'
): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase || !isValidUUID(userId)) return [];

  try {
    const column = type === 'followers' ? 'followed_id' : 'follower_id';
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq(column, userId);

    if (error) {
      console.warn(`Fetch ${type} notice:`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn(`Fetch ${type} exception:`, err);
    return [];
  }
}
