import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import webpush from 'web-push';
import {
  getSupabaseService,
  getUserOwnedEntityIds,
  hasAnyOwnershipMatch,
} from '../lib/supabaseAdmin';
import {
  uploadsDir,
  loadPushSubscriptionsAsync,
} from '../lib/clients';
import {
  requireAuth,
} from '../middleware/auth';
import {
  uploadLimiter,
  apiMutationLimiter,
} from '../middleware/security';

export const socialRouter = express.Router();

// ============================================================
// AVATAR INTERACTIONS (LIKES & COMMENTS)
// ============================================================
const avatarInteractionsFile = path.join(uploadsDir, 'avatar_interactions.json');

async function loadAvatarInteractions(): Promise<
  Record<
    string,
    {
      reactions: Record<string, number>;
      userReactions: Record<string, Record<string, boolean>>;
      comments: any[];
    }
  >
> {
  try {
    if (fs.existsSync(avatarInteractionsFile)) {
      const content = await fs.promises.readFile(avatarInteractionsFile, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('[AVATAR INTERACTIONS] Failed to load file:', e);
  }
  return {};
}

async function saveAvatarInteractions(data: any) {
  try {
    await fs.promises.writeFile(
      avatarInteractionsFile,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch (e) {
    console.warn('[AVATAR INTERACTIONS] Failed to save file:', e);
  }
}

socialRouter.get(
  '/api/avatar-interactions/:profileId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { profileId } = req.params;
      const all = await loadAvatarInteractions();
      const entry = all[profileId] || {
        reactions: { horns: 0, fire: 0, skull: 0, heart: 0 },
        userReactions: {},
        comments: [],
      };
      res.json(entry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

socialRouter.post(
  '/api/avatar-interactions/:profileId/react',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const { profileId } = req.params;
      const { reactionType } = req.body;
      const userId = req.authUser!.id;
      if (!reactionType) {
        return res.status(400).json({ error: 'Missing reactionType' });
      }
      const allowedReactions = new Set(['horns', 'fire', 'skull', 'heart', 'likes']);
      if (!allowedReactions.has(String(reactionType))) {
        return res.status(400).json({ error: 'Invalid reactionType' });
      }
      const all = await loadAvatarInteractions();
      if (!all[profileId]) {
        all[profileId] = {
          reactions: { horns: 0, fire: 0, skull: 0, heart: 0 },
          userReactions: {},
          comments: [],
        };
      }
      const entry = all[profileId];
      if (!entry.userReactions[userId]) entry.userReactions[userId] = {};

      const wasActive = Boolean(entry.userReactions[userId][reactionType]);
      entry.userReactions[userId][reactionType] = !wasActive;
      const currentCount = entry.reactions[reactionType] || 0;
      entry.reactions[reactionType] = wasActive
        ? Math.max(0, currentCount - 1)
        : currentCount + 1;

      await saveAvatarInteractions(all);
      res.json(entry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

socialRouter.post(
  '/api/avatar-interactions/:profileId/comment',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const { profileId } = req.params;
      const { comment } = req.body;
      if (!comment || !comment.text || typeof comment.text !== 'string') {
        return res.status(400).json({ error: 'Missing comment text' });
      }
      const all = await loadAvatarInteractions();
      if (!all[profileId]) {
        all[profileId] = {
          reactions: { horns: 0, fire: 0, skull: 0, heart: 0 },
          userReactions: {},
          comments: [],
        };
      }
      const newComment = {
        id: comment.id || `avc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: req.authUser!.id,
        authorName: String(
          comment.authorName || req.authUser!.userMetadata?.name || 'Scene Member'
        ).slice(0, 80),
        authorAvatar: comment.authorAvatar || '',
        authorRole: String(comment.authorRole || 'Fan').slice(0, 50),
        text: comment.text.trim().slice(0, 1000),
        createdAt: new Date().toISOString(),
      };
      all[profileId].comments.push(newComment);
      await saveAvatarInteractions(all);
      res.json(all[profileId]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================
// MEDIA UPLOAD (SUPABASE CLOUD + LOCAL PERSISTENT FALLBACK)
// ============================================================
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'mp4',
  'webm',
  'mov',
  'm4v',
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'aac',
  'flac',
  'pdf',
]);

socialRouter.post(
  '/api/upload',
  requireAuth,
  uploadLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const { fileData, fileName, mimeType } = req.body;
      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ error: 'Missing fileData payload' });
      }

      const matches = fileData.match(/^data:([^;]+);base64,([\s\S]+)$/);
      let buffer: Buffer;
      let resolvedMime = mimeType || 'application/octet-stream';
      let ext = 'bin';

      if (matches && matches.length === 3) {
        resolvedMime = matches[1];
        const cleanBase64 = matches[2].replace(/\s+/g, '');
        buffer = Buffer.from(cleanBase64, 'base64');
      } else {
        const cleanBase64 = fileData.replace(/\s+/g, '');
        buffer = Buffer.from(cleanBase64, 'base64');
      }

      if (fileName && fileName.includes('.')) {
        ext =
          fileName
            .split('.')
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '') || 'bin';
      } else if (resolvedMime.includes('/')) {
        ext =
          resolvedMime
            .split('/')[1]
            .split(';')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') || 'bin';
        if (ext === 'quicktime') ext = 'mov';
        if (ext === 'mpeg') ext = 'mp3';
      }

      if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
        return res.status(400).json({
          error: `Unsupported file type (.${ext}). Only image, video, audio, and PDF files are permitted.`,
        });
      }

      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const supabase = getSupabaseService();
      if (supabase) {
        try {
          const isVideo =
            resolvedMime.startsWith('video/') ||
            ['mp4', 'webm', 'mov', 'm4v'].includes(ext);
          const bucketName = isVideo ? 'nexus_clips' : 'nexus_media';
          const storagePath = `uploads/${uniqueName}`;

          const { data: buckets } = await supabase.storage.listBuckets();
          if (buckets && !buckets.some((b: any) => b.name === bucketName)) {
            await supabase.storage.createBucket(bucketName, { public: true });
          }

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
              contentType: resolvedMime,
              upsert: true,
            });

          if (!uploadError) {
            const { data: pubData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(storagePath);
            if (pubData?.publicUrl) {
              const filePath = path.join(uploadsDir, uniqueName);
              await fs.promises.writeFile(filePath, buffer).catch(() => {});
              return res.json({
                url: pubData.publicUrl,
                localUrl: `/uploads/${uniqueName}`,
                size: buffer.length,
                mimeType: resolvedMime,
                cloudPersisted: true,
              });
            }
          } else {
            console.warn(
              '[UPLOAD CLOUD NOTICE] Falling back to local disk storage:',
              uploadError.message
            );
          }
        } catch (cloudErr: any) {
          console.warn('[UPLOAD CLOUD EXCEPTION] Falling back to local disk:', cloudErr.message);
        }
      }

      const filePath = path.join(uploadsDir, uniqueName);
      await fs.promises.writeFile(filePath, buffer);

      return res.json({
        url: `/uploads/${uniqueName}`,
        size: buffer.length,
        mimeType: resolvedMime,
        cloudPersisted: false,
      });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]:', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
  }
);

// ============================================================
// STORIES PERSISTENCE & CROSS-DEVICE SYNC APIS
// ============================================================
const storiesCacheFile = path.join(uploadsDir, 'stories_cache.json');

async function loadCachedStories(): Promise<any[]> {
  try {
    if (fs.existsSync(storiesCacheFile)) {
      const content = await fs.promises.readFile(storiesCacheFile, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        return parsed.filter((s: any) => {
          const ts = new Date(s.created_at || 0).getTime();
          return isNaN(ts) || ts >= cutoff;
        });
      }
    }
  } catch (e) {
    console.warn('[SERVER STORIES] Local cache read warning:', e);
  }
  return [];
}

async function saveCachedStories(stories: any[]): Promise<void> {
  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const valid = stories
      .filter((s: any) => {
        if (!s || !s.id) return false;
        const ts = new Date(s.created_at || 0).getTime();
        return isNaN(ts) || ts >= cutoff;
      })
      .slice(0, 100);
    await fs.promises.writeFile(
      storiesCacheFile,
      JSON.stringify(valid, null, 2),
      'utf8'
    );
  } catch (e) {
    console.warn('[SERVER STORIES] Local cache write warning:', e);
  }
}

socialRouter.get('/api/stories', async (_req: express.Request, res: express.Response) => {
  try {
    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let dbStories: any[] = [];

    const supabase = getSupabaseService();
    if (supabase) {
      const { data: storiesData, error: storiesErr } = await supabase
        .from('nexus_stories')
        .select('*')
        .gte('created_at', cutoffIso)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!storiesErr && storiesData && storiesData.length > 0) {
        dbStories = storiesData.map((row: any) => ({
          ...(typeof row.data === 'object' && row.data !== null ? row.data : {}),
          id: row.id,
          user_id: row.user_id,
          media_url: row.media_url || row.data?.media_url,
          media_type: row.media_type || row.data?.media_type || 'image',
          created_at: row.created_at,
        }));
      }

      const { data: postsData, error: postsErr } = await supabase
        .from('nexus_posts')
        .select('*')
        .gte('created_at', cutoffIso)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!postsErr && postsData && postsData.length > 0) {
        const storyPosts = postsData
          .filter(
            (row: any) =>
              String(row.id).startsWith('story_') || row.data?.is_story === true
          )
          .map((row: any) => ({
            ...(typeof row.data === 'object' && row.data !== null ? row.data : {}),
            id: row.id,
            user_id: row.user_id || row.data?.user_id,
            media_url: row.data?.media_url || row.media_url,
            media_type: row.data?.media_type || 'image',
            created_at: row.created_at || row.data?.created_at,
          }));
        dbStories = [...dbStories, ...storyPosts];
      }
    }

    const localStories = await loadCachedStories();
    const mergedMap = new Map<string, any>();

    for (const s of [...dbStories, ...localStories]) {
      if (s && s.id && s.media_url && !String(s.media_url).startsWith('blob:')) {
        if (!mergedMap.has(s.id)) {
          mergedMap.set(s.id, s);
        }
      }
    }

    const merged = Array.from(mergedMap.values()).sort(
      (a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    if (merged.length > 0) {
      await saveCachedStories(merged);
    }

    return res.json({ stories: merged });
  } catch (err: any) {
    console.error('[SERVER STORIES GET ERROR]:', err);
    const fallback = await loadCachedStories();
    return res.json({ stories: fallback });
  }
});

socialRouter.post(
  '/api/stories',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const rawStory = req.body;
      if (!rawStory || !rawStory.id || !rawStory.media_url) {
        return res
          .status(400)
          .json({ error: 'Invalid story payload (missing id or media_url)' });
      }

      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const requestedOwner = rawStory.user_id || authUser.id;
      const verifiedOwner = hasAnyOwnershipMatch(authUser, ownedIds, [requestedOwner])
        ? requestedOwner
        : authUser.id;

      const story = {
        ...rawStory,
        user_id: verifiedOwner,
        auth_user_id: authUser.id,
        created_at: rawStory.created_at || new Date().toISOString(),
        expires_at:
          rawStory.expires_at ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const existing = await loadCachedStories();
      const existingTarget = existing.find((s: any) => s.id === story.id);
      if (existingTarget) {
        const canModify =
          existingTarget.auth_user_id === authUser.id ||
          hasAnyOwnershipMatch(authUser, ownedIds, [existingTarget.user_id]);
        if (!canModify) {
          return res
            .status(403)
            .json({ error: 'Forbidden: Cannot overwrite another user story.' });
        }
      }

      const filtered = existing.filter((s: any) => s.id !== story.id);
      await saveCachedStories([story, ...filtered]);

      let persistedToSupabase = false;
      if (sb) {
        const { error: sErr } = await sb.from('nexus_stories').upsert(
          {
            id: story.id,
            user_id: story.user_id,
            media_url: story.media_url,
            media_type: story.media_type || 'image',
            created_at: story.created_at,
            expires_at: story.expires_at,
            data: story,
          },
          { onConflict: 'id' }
        );

        if (!sErr) {
          persistedToSupabase = true;
        } else {
          console.warn(
            '[SERVER STORIES] nexus_stories upsert notice, writing to nexus_posts backup:',
            sErr.message
          );
        }

        const { error: pErr } = await sb.from('nexus_posts').upsert(
          {
            id: story.id.startsWith('story_') ? story.id : `story_${story.id}`,
            user_id: story.user_id,
            created_at: story.created_at,
            data: { ...story, is_story: true },
          },
          { onConflict: 'id' }
        );

        if (!pErr) {
          persistedToSupabase = true;
        }
      }

      return res.json({ success: true, persistedToSupabase, story });
    } catch (err: any) {
      console.error('[SERVER STORIES POST ERROR]:', err);
      return res.status(500).json({ error: err.message || 'Failed to save story' });
    }
  }
);

socialRouter.post(
  '/api/stories/sync',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const { storyId, story } = req.body;
      if (!storyId || !story) {
        return res.status(400).json({ error: 'Missing storyId or story data' });
      }

      const existing = await loadCachedStories();
      const idx = existing.findIndex((s: any) => s.id === storyId);
      const mergedStory = idx !== -1 ? { ...existing[idx], ...story } : story;
      const nextList = [
        mergedStory,
        ...existing.filter((s: any) => s.id !== storyId),
      ];
      await saveCachedStories(nextList);

      const supabase = getSupabaseService();
      if (supabase) {
        await supabase
          .from('nexus_stories')
          .upsert(
            {
              id: storyId,
              user_id: mergedStory.user_id || 'anonymous',
              media_url: mergedStory.media_url,
              media_type: mergedStory.media_type || 'image',
              created_at: mergedStory.created_at || new Date().toISOString(),
              data: mergedStory,
            },
            { onConflict: 'id' }
          )
          .catch(() => {});

        await supabase
          .from('nexus_posts')
          .upsert(
            {
              id: String(storyId).startsWith('story_') ? storyId : `story_${storyId}`,
              user_id: mergedStory.user_id || 'anonymous',
              created_at: mergedStory.created_at || new Date().toISOString(),
              data: { ...mergedStory, is_story: true },
            },
            { onConflict: 'id' }
          )
          .catch(() => {});
      }

      return res.json({ success: true, story: mergedStory });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Story sync failed' });
    }
  }
);

socialRouter.delete(
  '/api/stories/:id',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const storyId = req.params.id;
      if (!storyId) {
        return res.status(400).json({ error: 'Missing story ID' });
      }

      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const existing = await loadCachedStories();
      const target = existing.find(
        (s: any) =>
          s.id === storyId ||
          `story_${s.id}` === storyId ||
          s.id === storyId.replace(/^story_/, '')
      );

      if (target) {
        const canDelete =
          target.auth_user_id === authUser.id ||
          hasAnyOwnershipMatch(authUser, ownedIds, [target.user_id]);
        if (!canDelete) {
          return res.status(403).json({
            error: 'Forbidden: Only the story creator or admin may delete this story.',
          });
        }
      } else if (sb && !authUser.isAdmin) {
        const cleanId = storyId.replace(/^story_/, '');
        const { data: row } = await sb
          .from('nexus_stories')
          .select('user_id')
          .eq('id', cleanId)
          .maybeSingle();
        if (row && !hasAnyOwnershipMatch(authUser, ownedIds, [row.user_id])) {
          return res.status(403).json({
            error: 'Forbidden: Only the story creator or admin may delete this story.',
          });
        }
      }

      const filtered = existing.filter(
        (s: any) =>
          s.id !== storyId &&
          `story_${s.id}` !== storyId &&
          s.id !== storyId.replace(/^story_/, '')
      );
      await saveCachedStories(filtered);

      if (sb) {
        const cleanId = storyId.replace(/^story_/, '');
        const prefixedId = storyId.startsWith('story_') ? storyId : `story_${storyId}`;
        await sb.from('nexus_stories').delete().in('id', [storyId, cleanId, prefixedId]);
        await sb.from('nexus_posts').delete().in('id', [storyId, cleanId, prefixedId]);
      }

      return res.json({ success: true, deletedId: storyId });
    } catch (err: any) {
      console.error('[SERVER STORIES DELETE ERROR]:', err);
      return res.status(500).json({ error: err.message || 'Failed to delete story' });
    }
  }
);

// ============================================================
// CLIPS PERSISTENCE & CROSS-DEVICE SYNC APIS
// ============================================================
const clipsCacheFile = path.join(uploadsDir, 'clips_cache.json');

async function loadCachedClips(): Promise<any[]> {
  try {
    if (fs.existsSync(clipsCacheFile)) {
      const content = await fs.promises.readFile(clipsCacheFile, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (c: any) => c && c.id && c.video_url && !String(c.video_url).startsWith('blob:')
        );
      }
    }
  } catch (e) {
    console.warn('[SERVER CLIPS] Local cache read warning:', e);
  }
  return [];
}

async function saveCachedClips(clips: any[]): Promise<void> {
  try {
    const valid = clips
      .filter(
        (c: any) => c && c.id && c.video_url && !String(c.video_url).startsWith('blob:')
      )
      .slice(0, 150);
    await fs.promises.writeFile(clipsCacheFile, JSON.stringify(valid, null, 2), 'utf8');
  } catch (e) {
    console.warn('[SERVER CLIPS] Local cache write warning:', e);
  }
}

socialRouter.get('/api/clips', async (_req: express.Request, res: express.Response) => {
  try {
    let dbClips: any[] = [];
    const supabase = getSupabaseService();

    if (supabase) {
      const { data: clipsData, error: clipsErr } = await supabase
        .from('nexus_clips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!clipsErr && clipsData && clipsData.length > 0) {
        dbClips = clipsData.map((row: any) => ({
          ...(typeof row.data === 'object' && row.data !== null ? row.data : {}),
          id: row.id,
          user_id: row.user_id || row.data?.user_id,
          video_url: row.video_url || row.data?.video_url,
          created_at: row.created_at || row.data?.created_at,
        }));
      }

      const { data: postsData, error: postsErr } = await supabase
        .from('nexus_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      if (!postsErr && postsData && postsData.length > 0) {
        const clipPosts = postsData
          .filter(
            (row: any) =>
              String(row.id).startsWith('clip_') || row.data?.is_clip === true
          )
          .map((row: any) => ({
            ...(typeof row.data === 'object' && row.data !== null ? row.data : {}),
            id: String(row.id).replace(/^clip_post_/, ''),
            user_id: row.user_id || row.data?.user_id,
            video_url: row.data?.video_url || row.media_url,
            created_at: row.created_at || row.data?.created_at,
          }));
        dbClips = [...dbClips, ...clipPosts];
      }
    }

    const localClips = await loadCachedClips();
    const mergedMap = new Map<string, any>();

    for (const c of [...dbClips, ...localClips]) {
      if (c && c.id && c.video_url && !String(c.video_url).startsWith('blob:')) {
        if (!mergedMap.has(c.id)) {
          mergedMap.set(c.id, c);
        } else {
          const existing = mergedMap.get(c.id);
          const existingComments = Array.isArray(existing.comments_list)
            ? existing.comments_list.length
            : 0;
          const incomingComments = Array.isArray(c.comments_list)
            ? c.comments_list.length
            : 0;
          if (
            incomingComments > existingComments ||
            (c.likes || 0) > (existing.likes || 0)
          ) {
            mergedMap.set(c.id, { ...existing, ...c });
          }
        }
      }
    }

    const merged = Array.from(mergedMap.values()).sort(
      (a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    if (merged.length > 0) {
      await saveCachedClips(merged);
    }

    return res.json({ clips: merged });
  } catch (err: any) {
    console.error('[SERVER CLIPS GET ERROR]:', err);
    const fallback = await loadCachedClips();
    return res.json({ clips: fallback });
  }
});

socialRouter.post(
  '/api/clips',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const rawClip = req.body;
      if (!rawClip || !rawClip.id || !rawClip.video_url) {
        return res
          .status(400)
          .json({ error: 'Invalid clip payload (missing id or video_url)' });
      }

      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const requestedOwner = rawClip.user_id || authUser.id;
      const verifiedOwner = hasAnyOwnershipMatch(authUser, ownedIds, [requestedOwner])
        ? requestedOwner
        : authUser.id;

      const clip = {
        ...rawClip,
        user_id: verifiedOwner,
        auth_user_id: authUser.id,
        created_at: rawClip.created_at || new Date().toISOString(),
      };

      const existing = await loadCachedClips();
      const existingTarget = existing.find((c: any) => c.id === clip.id);
      if (existingTarget) {
        const canModify =
          existingTarget.auth_user_id === authUser.id ||
          hasAnyOwnershipMatch(authUser, ownedIds, [existingTarget.user_id]);
        if (!canModify) {
          return res
            .status(403)
            .json({ error: 'Forbidden: Cannot overwrite another user clip.' });
        }
      }

      const filtered = existing.filter((c: any) => c.id !== clip.id);
      await saveCachedClips([clip, ...filtered]);

      let persistedToSupabase = false;
      if (sb) {
        const { error: cErr } = await sb.from('nexus_clips').upsert(
          {
            id: clip.id,
            user_id: clip.user_id,
            band_name: clip.band_name,
            handle: clip.handle,
            avatar_url: clip.avatar_url,
            video_url: clip.video_url,
            caption: clip.caption || '',
            song_title: clip.song_title || 'Original Sound',
            likes: clip.likes || 0,
            comments: clip.comments || 0,
            shares: clip.shares || 0,
            location: clip.location || 'THE PIT',
            verified: clip.verified ?? true,
            created_at: clip.created_at,
            data: clip,
          },
          { onConflict: 'id' }
        );

        if (!cErr) {
          persistedToSupabase = true;
        }

        const backupPostId = String(clip.id).startsWith('clip_')
          ? clip.id
          : `clip_${clip.id}`;
        const { error: pErr } = await sb.from('nexus_posts').upsert(
          {
            id: backupPostId,
            user_id: clip.user_id,
            created_at: clip.created_at,
            data: { ...clip, is_clip: true },
          },
          { onConflict: 'id' }
        );

        if (!pErr) {
          persistedToSupabase = true;
        }
      }

      return res.json({ success: true, persistedToSupabase, clip });
    } catch (err: any) {
      console.error('[SERVER CLIPS POST ERROR]:', err);
      return res.status(500).json({ error: err.message || 'Failed to save clip' });
    }
  }
);

socialRouter.post(
  '/api/clips/sync',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const { clipId, clip } = req.body;
      if (!clipId || !clip) {
        return res.status(400).json({ error: 'Missing clipId or clip data' });
      }

      const existing = await loadCachedClips();
      const idx = existing.findIndex((c: any) => c.id === clipId);
      const mergedClip = idx !== -1 ? { ...existing[idx], ...clip } : clip;
      const nextList = [
        mergedClip,
        ...existing.filter((c: any) => c.id !== clipId),
      ];
      await saveCachedClips(nextList);

      const supabase = getSupabaseService();
      if (supabase) {
        await supabase
          .from('nexus_clips')
          .upsert(
            {
              id: clipId,
              user_id: mergedClip.user_id || 'anonymous',
              band_name: mergedClip.band_name,
              video_url: mergedClip.video_url,
              likes: mergedClip.likes || 0,
              comments: mergedClip.comments || 0,
              shares: mergedClip.shares || 0,
              created_at: mergedClip.created_at || new Date().toISOString(),
              data: mergedClip,
            },
            { onConflict: 'id' }
          )
          .catch(() => {});

        const backupPostId = String(clipId).startsWith('clip_')
          ? clipId
          : `clip_${clipId}`;
        await supabase
          .from('nexus_posts')
          .upsert(
            {
              id: backupPostId,
              user_id: mergedClip.user_id || 'anonymous',
              created_at: mergedClip.created_at || new Date().toISOString(),
              data: { ...mergedClip, is_clip: true },
            },
            { onConflict: 'id' }
          )
          .catch(() => {});
      }

      return res.json({ success: true, clip: mergedClip });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Clip sync failed' });
    }
  }
);

socialRouter.delete(
  '/api/clips/:id',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const clipId = req.params.id;
      if (!clipId) {
        return res.status(400).json({ error: 'Missing clip ID' });
      }

      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const existing = await loadCachedClips();
      const target = existing.find(
        (c: any) =>
          c.id === clipId ||
          `clip_${c.id}` === clipId ||
          c.id === clipId.replace(/^clip_/, '')
      );

      if (target) {
        const canDelete =
          target.auth_user_id === authUser.id ||
          hasAnyOwnershipMatch(authUser, ownedIds, [target.user_id]);
        if (!canDelete) {
          return res.status(403).json({
            error: 'Forbidden: Only the clip creator or admin may delete this clip.',
          });
        }
      } else if (sb && !authUser.isAdmin) {
        const cleanId = clipId.replace(/^clip_/, '');
        const { data: row } = await sb
          .from('nexus_clips')
          .select('user_id')
          .eq('id', cleanId)
          .maybeSingle();
        if (row && !hasAnyOwnershipMatch(authUser, ownedIds, [row.user_id])) {
          return res.status(403).json({
            error: 'Forbidden: Only the clip creator or admin may delete this clip.',
          });
        }
      }

      const filtered = existing.filter(
        (c: any) =>
          c.id !== clipId &&
          `clip_${c.id}` !== clipId &&
          c.id !== clipId.replace(/^clip_/, '')
      );
      await saveCachedClips(filtered);

      if (sb) {
        const cleanId = clipId.replace(/^clip_/, '');
        const prefixedId = clipId.startsWith('clip_') ? clipId : `clip_${clipId}`;
        await sb.from('nexus_clips').delete().in('id', [clipId, cleanId, prefixedId]);
        await sb.from('nexus_posts').delete().in('id', [clipId, cleanId, prefixedId]);
      }

      return res.json({ success: true, deletedId: clipId });
    } catch (err: any) {
      console.error('[SERVER CLIPS DELETE ERROR]:', err);
      return res.status(500).json({ error: err.message || 'Failed to delete clip' });
    }
  }
);

// ============================================================
// SOCIAL FEED POST INTERACTIONS (COMMENTS & REACTIONS)
// ============================================================
const primaryInteractionsFile = path.join(
  process.cwd(),
  'data',
  'post_interactions_cache.json'
);
const uploadsInteractionsFile = path.join(
  uploadsDir,
  'post_interactions_cache.json'
);

async function loadCachedInteractions(): Promise<{
  comments: Record<string, any[]>;
  reactions: Record<string, any>;
}> {
  let result: { comments: Record<string, any[]>; reactions: Record<string, any> } = {
    comments: {},
    reactions: {},
  };

  for (const file of [primaryInteractionsFile, uploadsInteractionsFile]) {
    if (fs.existsSync(file)) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        if (content && content.trim()) {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            result = {
              comments: { ...result.comments, ...(parsed.comments || {}) },
              reactions: { ...result.reactions, ...(parsed.reactions || {}) },
            };
          }
        }
      } catch (err) {
        console.warn('[POST INTERACTIONS CACHE] Read warning:', err);
      }
    }
  }

  if (result.reactions) {
    Object.keys(result.reactions).forEach((pId) => {
      const rx = result.reactions[pId];
      if (rx && rx.users) {
        delete rx.users['user_sarah_blast_venue'];
        delete rx.users['user_metal_dan_creative'];
        if (rx.user_reactions) {
          delete rx.user_reactions['user_sarah_blast_venue'];
          delete rx.user_reactions['user_metal_dan_creative'];
        }
        Object.keys(rx.users).forEach((uId) => {
          if (
            uId.startsWith('user_sarah_') ||
            uId.startsWith('user_metal_') ||
            uId.startsWith('seed_')
          ) {
            delete rx.users[uId];
            if (rx.user_reactions) delete rx.user_reactions[uId];
          }
        });

        if (rx.users['5403162d-1947-43aa-b5f6-38a1bd2a1b80']) {
          rx.users['5403162d-1947-43aa-b5f6-38a1bd2a1b80'].userRole =
            'Industry Pro';
        }

        const cleanCounts: Record<string, number> = {
          likes: 0,
          horns: 0,
          hype: 0,
          brutal: 0,
          respect: 0,
          crushed: 0,
        };
        Object.values(rx.users).forEach((u: any) => {
          if (u && u.reactionType) {
            cleanCounts[u.reactionType] = (cleanCounts[u.reactionType] || 0) + 1;
          }
        });
        rx.reactions = cleanCounts;
        rx.likes_count = rx.reactions.likes || 0;
      }
    });
  }

  return result;
}

async function saveCachedInteractions(data: {
  comments: Record<string, any[]>;
  reactions: Record<string, any>;
}) {
  try {
    const serialized = JSON.stringify(data, null, 2);
    const dataDir = path.dirname(primaryInteractionsFile);
    if (!fs.existsSync(dataDir))
      await fs.promises.mkdir(dataDir, { recursive: true });
    await fs.promises.writeFile(primaryInteractionsFile, serialized, 'utf8');
    if (fs.existsSync(uploadsDir)) {
      await fs.promises.writeFile(uploadsInteractionsFile, serialized, 'utf8');
    }
  } catch (err) {
    console.warn('[POST INTERACTIONS CACHE] Write error:', err);
  }
}

socialRouter.get(
  '/api/posts/interactions',
  async (_req: express.Request, res: express.Response) => {
    try {
      const interactions = await loadCachedInteractions();
      res.json({
        success: true,
        comments: interactions.comments,
        reactions: interactions.reactions,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || 'Failed to get post interactions' });
    }
  }
);

socialRouter.post(
  '/api/posts/comments',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const { postId, comment } = req.body || {};
      if (!postId || !comment || (!comment.text && !comment.content)) {
        return res
          .status(400)
          .json({ error: 'Missing postId or comment content' });
      }

      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const requestedActorId = comment.userId || comment.user_id || authUser.id;
      const userId = hasAnyOwnershipMatch(authUser, ownedIds, [requestedActorId])
        ? requestedActorId
        : authUser.id;

      const interactions = await loadCachedInteractions();
      if (!interactions.comments[postId]) {
        interactions.comments[postId] = [];
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validId =
        comment.id && uuidRegex.test(comment.id)
          ? comment.id
          : typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;

      const text = (comment.text || comment.content || '').trim();
      const author = comment.username || comment.author || 'Fan';
      const nowIso = comment.created_at || new Date().toISOString();

      const newCommentObj = {
        id: validId,
        post_id: postId,
        user_id: userId,
        auth_user_id: authUser.id,
        username: author,
        author: author,
        text: text,
        content: text,
        parent_comment_id:
          comment.parent_comment_id || comment.parentCommentId || null,
        created_at: nowIso,
        time: comment.time || 'Just now',
        timeAgo: comment.timeAgo || 'Just now',
        timestamp: nowIso,
      };

      const existingIdx = interactions.comments[postId].findIndex(
        (c: any) => c.id === validId
      );
      if (existingIdx >= 0) {
        const existingComment = interactions.comments[postId][existingIdx];
        const canEdit =
          existingComment.auth_user_id === authUser.id ||
          hasAnyOwnershipMatch(authUser, ownedIds, [existingComment.user_id]);
        if (!canEdit) {
          return res.status(403).json({
            error: "Forbidden: You cannot overwrite another user's comment.",
          });
        }
        interactions.comments[postId][existingIdx] = {
          ...existingComment,
          ...newCommentObj,
        };
      } else {
        interactions.comments[postId].push(newCommentObj);
      }

      await saveCachedInteractions(interactions);

      try {
        const cleanPostId = String(postId).replace(/^nexus_post_/, '');
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            cleanPostId
          );
        let postAuthorId: string | null = null;
        let postAuthorEmail: string | null = null;

        if (sb && isUUID) {
          const { data: pData } = await sb
            .from('nexus_posts')
            .select('profile_id, data')
            .eq('id', cleanPostId)
            .limit(1);
          if (pData && pData.length > 0) {
            postAuthorId = pData[0].profile_id;
            const pObj =
              typeof pData[0].data === 'string'
                ? JSON.parse(pData[0].data)
                : pData[0].data || {};
            postAuthorEmail = pObj.author?.email || pObj.email || null;
            if (!postAuthorId)
              postAuthorId = pObj.author?.id || pObj.author_id || null;

            const existingComments: any[] = Array.isArray(pObj.comments)
              ? pObj.comments
              : [];
            const updatedComments = [
              ...existingComments.filter((c: any) => c.id !== validId),
              newCommentObj,
            ];
            await sb
              .from('nexus_posts')
              .update({ data: { ...pObj, comments: updatedComments } })
              .eq('id', pData[0].id);
          }

          try {
            await sb.from('nexus_post_comments').upsert(
              {
                id: validId,
                post_id: cleanPostId,
                user_id: userId,
                author_name: author,
                content: text,
                parent_comment_id:
                  comment.parent_comment_id || comment.parentCommentId || null,
                created_at: nowIso,
              },
              { onConflict: 'id' }
            );
          } catch (_) {}
        }

        if (
          postAuthorId &&
          postAuthorId !== userId &&
          postAuthorId !== authUser.id
        ) {
          const allSubs = await loadPushSubscriptionsAsync();
          const targetSubs = allSubs.filter((s) => {
            if (s.userId && s.userId === postAuthorId) return true;
            if (
              postAuthorEmail &&
              s.userEmail &&
              s.userEmail.toLowerCase() === postAuthorEmail.toLowerCase()
            )
              return true;
            return false;
          });

          if (targetSubs.length > 0) {
            const pushPayload = JSON.stringify({
              title: `💬 ${author} commented on your transmission`,
              body: `"${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              targetTab: 'social',
              category: 'artist_interactions',
              priority: 'P1',
              data: {
                postId: cleanPostId,
                commentId: validId,
                type: 'comment',
                commenterId: userId,
              },
              timestamp: Date.now(),
            });

            targetSubs.forEach(async (entry) => {
              try {
                if (
                  entry.subscription &&
                  !entry.subscription.endpoint?.startsWith('native://')
                ) {
                  await webpush.sendNotification(entry.subscription, pushPayload);
                }
              } catch (_) {}
            });
          }
        }
      } catch (pushErr) {
        console.warn('[PUSH COMMENT DISPATCH NOTICE]', pushErr);
      }

      res.json({
        success: true,
        comment: newCommentObj,
        comments: interactions.comments[postId],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save comment' });
    }
  }
);

socialRouter.put(
  '/api/posts/comments/:commentId',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const { commentId } = req.params;
      const {
        text,
        content,
        postId,
        author,
        username,
        avatar,
        user_id,
        userId,
      } = req.body || {};
      const newText = (text || content || '').trim();

      if (!newText) {
        return res.status(400).json({ error: 'Comment text cannot be empty' });
      }

      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const interactions = await loadCachedInteractions();
      let updatedComment: any = null;
      let unauthorized = false;

      Object.keys(interactions.comments).forEach((pId) => {
        const comment = interactions.comments[pId].find(
          (c: any) => c.id === commentId
        );
        if (comment) {
          const isOwner =
            comment.auth_user_id === authUser.id ||
            hasAnyOwnershipMatch(authUser, ownedIds, [comment.user_id]);
          if (!isOwner) {
            unauthorized = true;
            return;
          }
          comment.text = newText;
          comment.content = newText;
          comment.updated_at = new Date().toISOString();
          comment.edited = true;
          updatedComment = comment;
        }
      });

      if (unauthorized) {
        return res.status(403).json({
          error:
            'Forbidden: Only the comment author or admin can edit this comment.',
        });
      }

      if (!updatedComment && postId) {
        let authorizedToCreateEdit = false;
        const requestedActor = userId || user_id;
        if (
          !requestedActor ||
          hasAnyOwnershipMatch(authUser, ownedIds, [requestedActor])
        ) {
          if (sb) {
            const { data: existingSbComment } = await sb
              .from('nexus_post_comments')
              .select('user_id')
              .eq('id', commentId)
              .maybeSingle();
            if (
              !existingSbComment ||
              hasAnyOwnershipMatch(authUser, ownedIds, [
                existingSbComment.user_id,
              ])
            ) {
              authorizedToCreateEdit = true;
            }
          } else {
            authorizedToCreateEdit = true;
          }
        }

        if (!authorizedToCreateEdit) {
          return res.status(403).json({
            error: "Forbidden: You cannot edit another user's comment.",
          });
        }

        if (!interactions.comments[postId]) {
          interactions.comments[postId] = [];
        }
        const resolvedActorId =
          requestedActor &&
          hasAnyOwnershipMatch(authUser, ownedIds, [requestedActor])
            ? requestedActor
            : authUser.id;
        const authorName = username || author || 'Fan';
        const nowIso = new Date().toISOString();
        updatedComment = {
          id: commentId,
          post_id: postId,
          user_id: resolvedActorId,
          auth_user_id: authUser.id,
          username: authorName,
          author: authorName,
          avatar: avatar || '',
          userAvatar: avatar || '',
          text: newText,
          content: newText,
          edited: true,
          created_at: nowIso,
          updated_at: nowIso,
          time: 'Just now',
          timeAgo: 'Edited just now',
          timestamp: nowIso,
        };
        interactions.comments[postId].push(updatedComment);
      }

      if (updatedComment) {
        await saveCachedInteractions(interactions);

        if (sb && postId) {
          try {
            const cleanPostId = String(postId).replace(/^nexus_post_/, '');
            const isUUID =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                cleanPostId
              );
            if (isUUID) {
              const { data: rows } = await sb
                .from('nexus_posts')
                .select('id, data')
                .eq('id', cleanPostId)
                .limit(1);
              if (rows && rows.length > 0) {
                const postObj =
                  typeof rows[0].data === 'string'
                    ? JSON.parse(rows[0].data)
                    : rows[0].data || {};
                const existing = Array.isArray(postObj.comments)
                  ? postObj.comments
                  : [];
                let foundInSb = false;
                const nextComms = existing.map((c: any) => {
                  if (c.id === commentId) {
                    foundInSb = true;
                    return {
                      ...c,
                      text: newText,
                      content: newText,
                      edited: true,
                      updated_at: updatedComment.updated_at,
                    };
                  }
                  return c;
                });
                if (!foundInSb) {
                  nextComms.push(updatedComment);
                }
                await sb
                  .from('nexus_posts')
                  .update({ data: { ...postObj, comments: nextComms } })
                  .eq('id', rows[0].id);
              }
              await sb.from('nexus_post_comments').upsert(
                {
                  id: commentId,
                  post_id: cleanPostId,
                  content: newText,
                  edited: true,
                  updated_at: updatedComment.updated_at,
                },
                { onConflict: 'id' }
              );
            }
          } catch (sbPutErr) {
            console.warn(
              '[SERVER COMMENT EDIT SUPABASE SYNC NOTICE]',
              sbPutErr
            );
          }
        }

        return res.json({ success: true, comment: updatedComment });
      }

      res.status(404).json({ error: 'Comment not found' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update comment' });
    }
  }
);

socialRouter.delete(
  '/api/posts/comments/:commentId',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const { commentId } = req.params;
      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(sb, authUser);

      const interactions = await loadCachedInteractions();
      let modified = false;
      let unauthorized = false;

      for (const pId of Object.keys(interactions.comments)) {
        const targetComment = interactions.comments[pId].find(
          (c: any) => c.id === commentId
        );
        if (targetComment) {
          let isAuthorized =
            targetComment.auth_user_id === authUser.id ||
            hasAnyOwnershipMatch(authUser, ownedIds, [targetComment.user_id]);
          if (!isAuthorized && sb) {
            const cleanPostId = String(pId).replace(/^nexus_post_/, '');
            if (/^[0-9a-f-]{36}$/i.test(cleanPostId)) {
              const { data: postRow } = await sb
                .from('nexus_posts')
                .select('profile_id')
                .eq('id', cleanPostId)
                .maybeSingle();
              if (
                postRow &&
                hasAnyOwnershipMatch(authUser, ownedIds, [postRow.profile_id])
              ) {
                isAuthorized = true;
              }
            }
          }
          if (!isAuthorized) {
            unauthorized = true;
            break;
          }
          const prevLen = interactions.comments[pId].length;
          interactions.comments[pId] = interactions.comments[pId].filter(
            (c: any) => c.id !== commentId && c.parent_comment_id !== commentId
          );
          if (interactions.comments[pId].length !== prevLen) modified = true;
        }
      }

      if (unauthorized) {
        return res.status(403).json({
          error:
            'Forbidden: Only the comment author, post owner, or admin can delete this comment.',
        });
      }

      if (modified) {
        await saveCachedInteractions(interactions);
      }

      res.json({ success: true, deleted: modified });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete comment' });
    }
  }
);

socialRouter.post(
  '/api/posts/reactions',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const {
        postId,
        userId: requestedUserId,
        reactionType = 'likes',
        userName,
        userAvatar,
        userRole,
      } = req.body || {};

      if (!postId) {
        return res.status(400).json({ error: 'Missing postId' });
      }

      const authUser = req.authUser!;
      const ownedIds = await getUserOwnedEntityIds(getSupabaseService(), authUser);
      const userId =
        requestedUserId &&
        hasAnyOwnershipMatch(authUser, ownedIds, [requestedUserId])
          ? requestedUserId
          : authUser.id;

      const keyMap: Record<string, string> = {
        like: 'likes',
        likes: 'likes',
        thumbs: 'likes',
        heart: 'likes',
        flame: 'hype',
        hype: 'hype',
        fire: 'hype',
        heavy: 'brutal',
        brutal: 'brutal',
        skull: 'brutal',
        horns: 'horns',
        respect: 'respect',
        crushed: 'crushed',
        rocket: 'hype',
      };
      const reactionKey = keyMap[reactionType] || reactionType;

      const interactions = await loadCachedInteractions();
      if (!interactions.reactions[postId]) {
        interactions.reactions[postId] = {
          reactions: {
            likes: 0,
            horns: 0,
            hype: 0,
            brutal: 0,
            respect: 0,
            crushed: 0,
          },
          likes_count: 0,
          user_reactions: {},
          users: {},
          updatedAt: Date.now(),
        };
      }

      const postRx = interactions.reactions[postId];
      if (!postRx.user_reactions) postRx.user_reactions = {};
      if (!postRx.user_reactions[userId]) postRx.user_reactions[userId] = {};
      if (!postRx.users) postRx.users = {};

      delete postRx.users['user_sarah_blast_venue'];
      delete postRx.users['user_metal_dan_creative'];
      delete postRx.user_reactions['user_sarah_blast_venue'];
      delete postRx.user_reactions['user_metal_dan_creative'];
      Object.keys(postRx.users).forEach((uId) => {
        if (
          uId.startsWith('user_sarah_') ||
          uId.startsWith('user_metal_') ||
          uId.startsWith('seed_')
        ) {
          delete postRx.users[uId];
          delete postRx.user_reactions[uId];
        }
      });

      const userMap = postRx.user_reactions[userId];
      const wasActive = Boolean(userMap[reactionKey]);

      if (!wasActive) {
        Object.keys(userMap).forEach((k) => {
          if (k !== reactionKey && userMap[k]) {
            userMap[k] = false;
          }
        });
        userMap[reactionKey] = true;

        const isMiguel =
          userId === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' ||
          (userName && userName.toLowerCase().includes('miguel'));
        let resolvedRole = userRole;
        if (!resolvedRole) {
          if (userId.startsWith('band:')) {
            resolvedRole = 'Band / Artist';
          } else if (userId.startsWith('promoter:')) {
            resolvedRole = 'Venue Promoter';
          } else if (userId.startsWith('creative:')) {
            resolvedRole = 'Creative Pro';
          } else if (userId.startsWith('label:')) {
            resolvedRole = 'Record Label';
          } else if (isMiguel) {
            resolvedRole = 'Industry Pro';
          } else {
            resolvedRole = 'Scene Fan';
          }
        }

        postRx.users[userId] = {
          userId,
          userName:
            userName ||
            (isMiguel ? 'Miguel Goregrinder Medina' : 'Scene Member'),
          userAvatar:
            userAvatar ||
            (isMiguel
              ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
          userRole: resolvedRole,
          reactionType: reactionKey,
          reactedAt: new Date().toISOString(),
        };
      } else {
        userMap[reactionKey] = false;
        delete postRx.users[userId];
      }

      const freshCounts: Record<string, number> = {
        likes: 0,
        horns: 0,
        hype: 0,
        brutal: 0,
        respect: 0,
        crushed: 0,
      };
      Object.values(postRx.users).forEach((u: any) => {
        if (u && u.reactionType) {
          freshCounts[u.reactionType] = (freshCounts[u.reactionType] || 0) + 1;
        }
      });
      postRx.reactions = freshCounts;
      postRx.likes_count = postRx.reactions.likes || 0;
      postRx.updatedAt = Date.now();

      await saveCachedInteractions(interactions);

      res.json({
        success: true,
        reactions: postRx.reactions,
        likes_count: postRx.likes_count,
        user_reactions: userMap,
        users: postRx.users,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save reaction' });
    }
  }
);
