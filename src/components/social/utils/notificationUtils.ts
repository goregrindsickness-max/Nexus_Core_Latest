import { extractUUID } from '../../../utils/socialFeedUtils';
import { generateDeterministicUUID } from '../follows/followService';

export function buildUserOwnedRecipientIds(userProfile?: any): Set<string> {
  const ids = new Set<string>();
  if (!userProfile) return ids;

  const rawCandidates = [
    userProfile.id,
    userProfile.user_id,
    userProfile.profile_id,
    userProfile.band_id,
    userProfile.band_profile_id,
    userProfile.promoter_id,
    userProfile.label_id,
    userProfile.email,
    userProfile.name,
    userProfile.full_name,
    userProfile.username,
    userProfile.console_handle,
    userProfile.handle,
    userProfile.band_name,
    userProfile.bandName,
  ];

  const emailLower = String(userProfile.email || '').toLowerCase().trim();
  const idLower = String(userProfile.id || '').toLowerCase().trim();
  const isMiguel =
    emailLower === 'goregrindsickness@gmail.com' ||
    idLower === '5403162d-1947-43aa-b5f6-38a1bd2a1b80' ||
    String(userProfile.console_handle || '').toLowerCase().includes('bdmceo');

  if (isMiguel) {
    rawCandidates.push(
      '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
      'cbddb810-259b-4230-9968-3d402dfdb872',
      'goregrindsickness@gmail.com',
      'Virulent Excision',
      'bdmCEO',
      '@bdmCEO',
      'Miguel'
    );
  }

  for (const cand of rawCandidates) {
    if (typeof cand !== 'string') continue;
    const trimmed = cand.trim();
    if (!trimmed) continue;
    ids.add(trimmed.toLowerCase());
    const withoutAt = trimmed.replace(/^@/, '').toLowerCase();
    if (withoutAt) ids.add(withoutAt);

    const extracted = extractUUID(trimmed);
    if (extracted) {
      ids.add(extracted.toLowerCase());
    }
    try {
      const det = generateDeterministicUUID(trimmed);
      if (det) ids.add(det.toLowerCase());
      if (withoutAt && withoutAt !== trimmed.toLowerCase()) {
        const detNoAt = generateDeterministicUUID(withoutAt);
        if (detNoAt) ids.add(detNoAt.toLowerCase());
      }
    } catch (_) {}
  }

  return ids;
}

export function buildUserPersonalActorIds(userProfile?: any): Set<string> {
  const actorIds = new Set<string>();
  if (!userProfile) return actorIds;

  const rawActorCandidates = [
    userProfile.id,
    userProfile.user_id,
    userProfile.email,
  ];

  for (const cand of rawActorCandidates) {
    if (typeof cand !== 'string') continue;
    const trimmed = cand.trim();
    if (!trimmed) continue;
    actorIds.add(trimmed.toLowerCase());
    const extracted = extractUUID(trimmed);
    if (extracted) actorIds.add(extracted.toLowerCase());
    try {
      const det = generateDeterministicUUID(trimmed);
      if (det) actorIds.add(det.toLowerCase());
    } catch (_) {}
  }

  return actorIds;
}

export function normalizeNotificationItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return null;
  const nested = raw.data && typeof raw.data === 'object' ? raw.data : {};
  const isRead = Boolean(
    raw.is_read === true ||
      raw.read === true ||
      nested.is_read === true ||
      nested.read === true
  );
  const createdAt =
    raw.created_at ||
    nested.created_at ||
    (typeof raw.timestamp === 'string' ? raw.timestamp : null) ||
    new Date().toISOString();

  const rawType = String(raw.type || nested.type || raw.category || nested.category || 'system').toLowerCase();

  return {
    ...nested,
    ...raw,
    id:
      raw.id ||
      nested.id ||
      `notif_${raw.title || nested.title || 'notice'}_${raw.message || nested.message || ''}`,
    user_id: raw.user_id || nested.user_id || null,
    actor_id: raw.actor_id || nested.actor_id || null,
    actor_email: raw.actor_email || nested.actor_email || null,
    title: raw.title || nested.title || 'Notification',
    message: raw.message || raw.text || raw.content || nested.message || nested.text || nested.content || '',
    text: raw.text || raw.message || raw.content || nested.text || nested.message || '',
    category: raw.category || nested.category || raw.type || 'SYSTEM',
    type: rawType,
    postId: raw.postId || nested.postId || raw.post_id || nested.post_id || undefined,
    targetTab: raw.targetTab || nested.targetTab || raw.linkTab || nested.linkTab || 'feed',
    read: isRead,
    is_read: isRead,
    created_at: createdAt,
    timestamp: raw.timestamp || createdAt,
    time:
      raw.time ||
      raw.timeAgo ||
      nested.time ||
      nested.timeAgo ||
      (createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
  };
}

export function isNotificationForCurrentUser(
  rawNotif: any,
  userProfile?: any,
  feed?: any[]
): boolean {
  const n = normalizeNotificationItem(rawNotif);
  if (!n) return false;

  const actorIds = buildUserPersonalActorIds(userProfile);
  const ownedRecipientIds = buildUserOwnedRecipientIds(userProfile);

  // 1. Never display self-triggered notifications (where current user was the actor)
  const notifActorId = String(n.actor_id || n.data?.actor_id || '').toLowerCase().trim();
  const notifActorEmail = String(n.actor_email || n.data?.actor_email || '').toLowerCase().trim();
  if (notifActorId && actorIds.has(notifActorId)) return false;
  if (notifActorEmail && actorIds.has(notifActorEmail)) return false;

  // 2. Check recipient user_id if specified
  const targetUserId = String(n.user_id || n.data?.user_id || '').toLowerCase().trim();
  if (!targetUserId) {
    // Local or system broadcast notification with no explicit target user_id
    return true;
  }

  if (ownedRecipientIds.has(targetUserId)) {
    return true;
  }

  // 3. Fallback: if notification references a postId in the feed that is authored by the current user
  const postId = n.postId || n.data?.postId;
  if (postId && Array.isArray(feed) && feed.length > 0) {
    const matchedPost = feed.find((p) => p && String(p.id) === String(postId));
    if (matchedPost) {
      const postAuthorCandidates = [
        matchedPost.user_id,
        matchedPost.author_id,
        matchedPost.profile_id,
        matchedPost.authorId,
        matchedPost.author?.id,
        matchedPost.author?.email,
        matchedPost.author?.name,
        matchedPost.authorName,
      ]
        .filter((v) => typeof v === 'string' && v.trim())
        .map((v) => String(v).toLowerCase().trim());

      if (
        matchedPost.author?.isYou ||
        postAuthorCandidates.some((c) => ownedRecipientIds.has(c))
      ) {
        return true;
      }
    }
  }

  return false;
}

export function filterAndDeduplicateNotifications(
  rawList: any[],
  userProfile?: any,
  feed?: any[]
): any[] {
  if (!Array.isArray(rawList)) return [];
  const seenIds = new Set<string>();
  const seenMessages = new Set<string>();
  const result: any[] = [];

  for (const item of rawList) {
    const norm = normalizeNotificationItem(item);
    if (!norm) continue;
    if (!isNotificationForCurrentUser(norm, userProfile, feed)) continue;

    const idStr = String(norm.id || '');
    if (idStr && seenIds.has(idStr)) continue;
    if (idStr) seenIds.add(idStr);

    const msgKey = `${norm.title || ''}:${norm.message || ''}:${norm.postId || ''}`;
    if (seenMessages.has(msgKey)) continue;
    seenMessages.add(msgKey);

    result.push(norm);
  }

  return result;
}
