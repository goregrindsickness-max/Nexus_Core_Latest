import { getSupabase, executeSanitizedProfileUpsert } from '../../../supabase';

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'f' + Date.now().toString(16) + '-4000-8000-8000-' + Math.floor(Math.random() * 1e12).toString(16).padStart(12, '0');
};

export const getPersistentUserUuid = (requestedId?: string | null, postAuthor?: any): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (requestedId && uuidRegex.test(requestedId)) {
    return requestedId;
  }

  // Look in localStorage for a saved persistent UUID specifically for this session/user
  const authorIdentifier = postAuthor?.name || postAuthor?.email || requestedId || 'active_user';
  const storageKey = `nexus_user_uuid_${authorIdentifier.toLowerCase().replace(/\s+/g, '_')}`;
  const saved = localStorage.getItem(storageKey);
  if (saved && uuidRegex.test(saved)) {
    return saved;
  }

  const globalSaved = localStorage.getItem('nexus_active_user_uuid');
  if (globalSaved && uuidRegex.test(globalSaved)) {
    return globalSaved;
  }

  const newUuid = generateUUID();
  try {
    localStorage.setItem(storageKey, newUuid);
    localStorage.setItem('nexus_active_user_uuid', newUuid);
  } catch (e) {}

  return newUuid;
};

export const resolveActiveUserId = async (supabase: any): Promise<string | null> => {
  // 1. Try standard Supabase auth session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (e) {
    /* ignore session errors */
  }

  // 2. Scan localStorage for known Nexus profile / user storage keys
  const targetKeys = [
    'nexus_user',
    'nexus_profile',
    'nexus_active_profile',
    'currentUser',
    'activeProfile',
    'sb-cyjnpuneruonskfzpmqo-auth-token',
    'nexus_core_auth_token'
  ];

  for (const key of targetKeys) {
    const item = localStorage.getItem(key);
    if (!item) continue;
    try {
      const parsed = JSON.parse(item);
      const possibleId =
        parsed?.id ||
        parsed?.user?.id ||
        parsed?.profile?.id ||
        parsed?.currentSession?.user?.id;

      if (possibleId && typeof possibleId === 'string' && possibleId.length > 10) {
        console.log(`[Profile Resolver] Found active ID from localStorage key (${key}):`, possibleId);
        return possibleId;
      }
    } catch (e) {
      if (item.length > 20) return item;
    }
  }

  // 3. Scan localStorage values for any UUID match
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) || '';
    const match = val.match(uuidRegex);
    if (match) {
      console.log(`[Profile Resolver] Extracted fallback UUID from key (${key}):`, match[0]);
      return match[0];
    }
  }

  return null;
};

export const ensureProfileRowExists = async (
  supabase: any,
  requestedId: string | null,
  postAuthor?: any
): Promise<string | null> => {
  if (!supabase) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // 1. If requestedId is provided and exists in DB, return it
  if (requestedId && uuidRegex.test(requestedId)) {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', requestedId)
        .maybeSingle();

      if (existing?.id) return existing.id;
    } catch (err) {
      console.warn('[ensureProfileRowExists] Check error:', err);
    }
  }

  // 2. Try auth session user ID
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const authId = session.user.id;
      const roleStr = String(postAuthor?.role || '').toLowerCase();
      const accountType = (roleStr.includes('fan') || roleStr.includes('user') || !roleStr) ? 'fan' : 'industry pro';
      const stub = {
        id: authId,
        full_name: postAuthor?.name || session.user.user_metadata?.full_name || session.user.email || 'Nexus Member',
        name: postAuthor?.name || session.user.user_metadata?.full_name || 'Nexus Member',
        email: session.user.email || '',
        account_type: accountType,
        role: postAuthor?.role || 'Fan Listener',
        avatar_url: postAuthor?.avatar || '',
        updated_at: new Date().toISOString()
      };
      const { error: authUpsertErr } = await executeSanitizedProfileUpsert(supabase, stub);
      if (!authUpsertErr) return authId;
    }
  } catch (err) {
    /* ignore */
  }

  // 3. Resolve or generate a persistent UUID specifically for THIS user/session
  const targetUuid = getPersistentUserUuid(requestedId, postAuthor);

  try {
    const roleStr = String(postAuthor?.role || '').toLowerCase();
    const accountType = (roleStr.includes('fan') || roleStr.includes('user') || !roleStr) ? 'fan' : 'industry pro';
    const stub = {
      id: targetUuid,
      full_name: postAuthor?.name || 'Nexus Member',
      name: postAuthor?.name || 'Nexus Member',
      account_type: accountType,
      role: postAuthor?.role || 'Fan Listener',
      avatar_url: postAuthor?.avatar || '',
      updated_at: new Date().toISOString()
    };

    const { error: upsertErr } = await executeSanitizedProfileUpsert(supabase, stub);

    if (!upsertErr) {
      console.log('[ensureProfileRowExists] Upserted profile stub for user UUID:', targetUuid);
      return targetUuid;
    } else {
      console.warn('[ensureProfileRowExists] Stub upsert warning:', upsertErr.message);
    }
  } catch (err) {
    console.warn('[ensureProfileRowExists] Stub upsert exception:', err);
  }

  return targetUuid;
};

export function extractYouTubeId(urlOrText: string | undefined | null): string | undefined {
  if (!urlOrText || typeof urlOrText !== 'string') return undefined;
  const str = urlOrText.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i;
  const match = str.match(regExp);
  return (match && match[1] && match[1].length === 11) ? match[1] : undefined;
}

export const syncPostToSupabase = async (post: any, directUserId?: string): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const contentText = post.content || post.text || ' ';

    // Reliable YouTube ID and URL extraction
    const ytId =
      post.youtubeId ||
      post.youtube_id ||
      extractYouTubeId(post.youtubeUrl || post.youtube_url || post.mediaUrl || post.media_url || post.image || contentText);

    const ytUrl =
      post.youtubeUrl ||
      post.youtube_url ||
      (ytId ? `https://www.youtube.com/watch?v=${ytId}` : null);

    const tapeAudio = post.tapeData?.audioUrl || post.tapeData?.audio_url || post.tapeData?.audio;
    const songAudio = post.songData?.audioUrl || post.songData?.audio_url || post.songData?.coverArt;
    const directAudio = post.audioUrl || post.audio_url;
    const attachmentUrl = Array.isArray(post.attachments) && post.attachments.length > 0
      ? (typeof post.attachments[0] === 'string' ? post.attachments[0] : post.attachments[0]?.url)
      : (post.attachment || post.attachment_url || null);

    const flyerUrl = post.eventData?.flyerUrl;
    const merchUrl = post.merchData?.imageUrl;

    // Extract media URL reliably across images, video links, audio files, and attachments
    const mediaUrl =
      post.mediaUrl ||
      post.image ||
      post.media_url ||
      post.image_url ||
      (Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null) ||
      flyerUrl ||
      merchUrl ||
      ytUrl ||
      tapeAudio ||
      songAudio ||
      directAudio ||
      attachmentUrl ||
      null;

    const imagesArray = Array.isArray(post.images) && post.images.length > 0
      ? post.images
      : (mediaUrl ? [mediaUrl] : []);

    // Resolve profile ID specifically tied to this user
    const rawUserId = directUserId || post?.author?.id || post?.author?.profile_id || post?.profile_id || (await resolveActiveUserId(supabase));
    const userId = await ensureProfileRowExists(supabase, rawUserId, post?.author);

    if (!userId) {
      console.warn('[syncPostToSupabase] Skipped: Could not resolve active profile_id.');
      return null;
    }

    // Ensure a valid UUID is used for the post ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const postUuid = (post.id && uuidRegex.test(post.id)) ? post.id : generateUUID();

    const workspaceType = post.workspace_type || post.workspaceType || post.author?.workspace_type || post.author?.workspaceType || post.author?.portalRole || post.portalRole || post.account_type || 'social';

    const normalizedPost = {
      ...post,
      id: postUuid,
      content: contentText,
      youtubeId: ytId || post.youtubeId,
      youtube_id: ytId || post.youtube_id,
      youtubeUrl: ytUrl || post.youtubeUrl,
      youtube_url: ytUrl || post.youtube_url,
      mediaUrl: mediaUrl,
      media_url: mediaUrl,
      image: post.image || mediaUrl,
      images: imagesArray,
      workspace_type: workspaceType,
      workspaceType: workspaceType,
      tapeData: post.tapeData,
      songData: post.songData,
      pollData: post.pollData,
      merchData: post.merchData,
      eventData: post.eventData,
      author: {
        ...post.author,
        isYou: true,
        workspace_type: workspaceType,
        workspaceType: workspaceType
      }
    };

    console.log('[syncPostToSupabase] Publishing post UUID:', postUuid, 'for user UUID:', userId, 'workspace:', workspaceType);

    let insertedPostId: string | null = null;

    // Direct table insert/upsert into nexus_posts
    try {
      const { data: dbData, error: dbErr } = await supabase
        .from('nexus_posts')
        .upsert([{
          id: postUuid,
          profile_id: userId,
          content: post.content || post.text || ' ',
          media_url: mediaUrl,
          workspace_type: workspaceType,
          data: normalizedPost,
          created_at: post.created_at || new Date().toISOString()
        }], { onConflict: 'id' })
        .select('id')
        .maybeSingle();

      if (!dbErr && dbData?.id) {
        insertedPostId = dbData.id;
      } else if (dbErr) {
        // Fallback without workspace_type top-level column if column doesn't exist yet on Supabase table
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('nexus_posts')
          .upsert([{
            id: postUuid,
            profile_id: userId,
            content: post.content || post.text || ' ',
            media_url: mediaUrl,
            data: normalizedPost,
            created_at: post.created_at || new Date().toISOString()
          }], { onConflict: 'id' })
          .select('id')
          .maybeSingle();

        if (!fallbackErr && fallbackData?.id) {
          insertedPostId = fallbackData.id;
        }
      }
    } catch (dbEx) {
      console.warn('[syncPostToSupabase] Direct insert note:', dbEx);
    }

    // RPC fallback if direct insert didn't return an ID
    if (!insertedPostId) {
      let { data, error } = await supabase.rpc('publish_post_direct', {
        p_content: post.content || post.text || ' ',
        p_media_url: mediaUrl,
        p_profile_id: userId
      });

      if (!error && data) {
        insertedPostId = typeof data === 'string' ? data : (data?.id || postUuid);
      }
    }

    const finalPostId = insertedPostId || postUuid;

    if (post.pollData) {
      try {
        await supabase.from('nexus_polls').insert({
          post_id: finalPostId,
          question: post.pollData.question,
          options: post.pollData.options,
          category: post.pollData.variant || 'standard',
          is_unbiased: !post.pollData.isTimed,
          expires_at: post.pollData.expiresAt || null
        });
      } catch (err) {
        console.error('[syncPostToSupabase] Error creating poll:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_post_created', {
        detail: { id: finalPostId, post: { ...normalizedPost, id: finalPostId } }
      }));
    }

    return finalPostId;
  } catch (e) {
    console.warn('[syncPostToSupabase] Unexpected sync exception:', e);
    return null;
  }
};
