export interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
  handle?: string;
  role?: string;
  email?: string;
}

export type GroupSystemAction = 'created' | 'renamed' | 'members_added' | 'member_left';

export interface ReplyReference {
  msgId: string;
  senderName: string;
  excerpt: string;
}

export interface AudioCardPayload {
  id: string;
  kind: 'demo' | 'voice';
  title: string;
  artist?: string;
  durationSec: number;
  audioUrl?: string;
  peaks?: number[];
}

export interface OfferCardPayload {
  id: string;
  type: 'tour_offer' | 'show_share' | 'offer_response';
  targetOfferId?: string;
  title: string;
  venue?: string;
  city?: string;
  date?: string;
  guarantee?: string;
  terms?: string;
  showId?: string;
  status?: 'pending' | 'accepted' | 'countered';
  respondedBy?: string;
}

export interface GroupEnvelope {
  v: 1;
  groupId: string;
  groupName: string;
  members: GroupMember[];
  msgId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mediaUrl?: string;
  systemAction?: GroupSystemAction;
  replyTo?: ReplyReference;
  audioCard?: AudioCardPayload;
  offerCard?: OfferCardPayload;
}

export interface MediaEnvelope {
  v: 1;
  text: string;
  mediaUrl?: string;
}

export interface RichMessageEnvelope {
  v: 1;
  msgId?: string;
  text: string;
  mediaUrl?: string;
  replyTo?: ReplyReference;
  audioCard?: AudioCardPayload;
  offerCard?: OfferCardPayload;
}

export interface ParsedChatPayload {
  text: string;
  mediaUrl?: string;
  group?: GroupEnvelope;
  replyTo?: ReplyReference;
  audioCard?: AudioCardPayload;
  offerCard?: OfferCardPayload;
  isSystemEvent: boolean;
}

export interface InboxConversation {
  contactId: string;
  email?: string;
  profileName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastSenderName?: string;
  timestamp: string;
  isRead: boolean;
  unreadCount?: number;
  unread?: number;
  roleBadge?: string;
  isMuted?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  isRestricted?: boolean;
  nickname?: string;
  isGroup?: boolean;
  groupId?: string;
  groupName?: string;
  members?: GroupMember[];
}

export const GROUP_PREFIX = '[[NX_GROUP_V1]]';
export const MEDIA_PREFIX = '[[NX_MEDIA_V1]]';
export const RICH_PREFIX = '[[NX_RICH_V1]]';

export function isValidUuid(str: string | undefined | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function createClientMsgId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createGroupId(): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `grp_${Date.now().toString(36)}_${rand}`;
}

export function deriveAudioPeaks(seedInput: string, barCount: number = 36): number[] {
  const seedStr = seedInput || 'nexus-demo';
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
  }
  const peaks: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const pos = i / barCount;
    const envelope =
      pos < 0.12
        ? 0.35 + pos * 3
        : pos > 0.85
        ? Math.max(0.22, (1 - pos) * 5)
        : 0.55 + Math.sin(pos * Math.PI * 3) * 0.25;
    const pseudo = Math.abs(Math.sin(i * 19.37 + seed) * 43758.5453) % 1;
    const val = Math.max(0.18, Math.min(1, envelope * 0.72 + pseudo * 0.42));
    peaks.push(Number(val.toFixed(2)));
  }
  return peaks;
}

export function encodeGroupMessagePayload(envelope: GroupEnvelope): string {
  return `${GROUP_PREFIX}${JSON.stringify(envelope)}`;
}

export function encodeMediaMessagePayload(text: string, mediaUrl?: string | null): string {
  const cleanText = String(text || '').trim();
  if (!mediaUrl) return cleanText || 'Sent a message';
  const payload: MediaEnvelope = {
    v: 1,
    text: cleanText,
    mediaUrl,
  };
  return `${MEDIA_PREFIX}${JSON.stringify(payload)}`;
}

export function encodeRichMessagePayload(envelope: RichMessageEnvelope): string {
  const hasRichFields = Boolean(
    envelope.replyTo || envelope.audioCard || envelope.offerCard
  );
  if (!hasRichFields) {
    return encodeMediaMessagePayload(envelope.text, envelope.mediaUrl);
  }
  return `${RICH_PREFIX}${JSON.stringify(envelope)}`;
}

/**
 * Automatically upgrades legacy quick-template demo/offer plain text strings
 * into structured interactive cards so existing messages look great too.
 */
function inferLegacyCards(rawText: string, fallbackId: string): {
  audioCard?: AudioCardPayload;
  offerCard?: OfferCardPayload;
} {
  const text = rawText.trim();
  if (!text) return {};

  if (text.includes('🎵 DEMO TRACK ATTACHMENT')) {
    const cleanedTitle = text
      .replace(/^🎵\s*DEMO TRACK ATTACHMENT:\s*/i, '')
      .replace(/^Check out our unreleased master track\.?/i, '')
      .trim();
    return {
      audioCard: {
        id: `legacy_demo_${fallbackId}`,
        kind: 'demo',
        title: cleanedTitle || 'Unreleased Master Demo',
        artist: 'Band Demo Signal',
        durationSec: 168,
        peaks: deriveAudioPeaks(cleanedTitle || fallbackId, 36),
      },
    };
  }

  if (text.includes('📋 TOUR BOOKING OFFER')) {
    const body = text.replace(/^📋\s*TOUR BOOKING OFFER:\s*/i, '').trim();
    return {
      offerCard: {
        id: `legacy_offer_${fallbackId}`,
        type: 'tour_offer',
        title: 'Tour Routing Slot Offer',
        venue: 'Venue TBA',
        date: 'Upcoming Date',
        guarantee: 'Guarantee + Backline',
        terms: body || 'Requesting routing slot for upcoming tour date.',
        status: 'pending',
      },
    };
  }

  return {};
}

export function parseChatMessagePayload(rawMessage: any): ParsedChatPayload {
  const rawStr =
    typeof rawMessage === 'string'
      ? rawMessage
      : String(rawMessage?.message || rawMessage?.content || '');

  const rowMedia =
    typeof rawMessage === 'object' && rawMessage
      ? rawMessage.media_url || rawMessage.attachment_url || rawMessage.image || undefined
      : undefined;

  const fallbackId = String(rawMessage?.id || rawStr.slice(0, 24) || 'msg');

  if (rawStr.startsWith(GROUP_PREFIX)) {
    try {
      const jsonStr = rawStr.slice(GROUP_PREFIX.length);
      const parsed = JSON.parse(jsonStr) as GroupEnvelope;
      if (parsed && parsed.groupId) {
        const legacy =
          !parsed.audioCard && !parsed.offerCard
            ? inferLegacyCards(String(parsed.text || ''), parsed.msgId || fallbackId)
            : {};
        return {
          text: String(parsed.text || ''),
          mediaUrl: parsed.mediaUrl || rowMedia,
          group: parsed,
          replyTo: parsed.replyTo,
          audioCard: parsed.audioCard || legacy.audioCard,
          offerCard: parsed.offerCard || legacy.offerCard,
          isSystemEvent: Boolean(parsed.systemAction),
        };
      }
    } catch {
      // Fall through to plain text if malformed
    }
  }

  if (rawStr.startsWith(RICH_PREFIX)) {
    try {
      const jsonStr = rawStr.slice(RICH_PREFIX.length);
      const parsed = JSON.parse(jsonStr) as RichMessageEnvelope;
      if (parsed) {
        return {
          text: String(parsed.text || ''),
          mediaUrl: parsed.mediaUrl || rowMedia,
          replyTo: parsed.replyTo,
          audioCard: parsed.audioCard,
          offerCard: parsed.offerCard,
          isSystemEvent: false,
        };
      }
    } catch {
      // Fall through to plain text if malformed
    }
  }

  if (rawStr.startsWith(MEDIA_PREFIX)) {
    try {
      const jsonStr = rawStr.slice(MEDIA_PREFIX.length);
      const parsed = JSON.parse(jsonStr) as MediaEnvelope;
      const legacy = inferLegacyCards(String(parsed?.text || ''), fallbackId);
      return {
        text: String(parsed?.text || ''),
        mediaUrl: parsed?.mediaUrl || rowMedia,
        audioCard: legacy.audioCard,
        offerCard: legacy.offerCard,
        isSystemEvent: false,
      };
    } catch {
      // Fall through to plain text
    }
  }

  const legacy = inferLegacyCards(rawStr, fallbackId);
  return {
    text: rawStr,
    mediaUrl: rowMedia,
    audioCard: legacy.audioCard,
    offerCard: legacy.offerCard,
    isSystemEvent: false,
  };
}

export function formatDefaultGroupName(
  members: GroupMember[],
  excludeUserIds: string[] = []
): string {
  const excluded = new Set(excludeUserIds.map((id) => String(id).toLowerCase()));
  const others = members.filter((m) => !excluded.has(String(m.id).toLowerCase()));
  const source = others.length > 0 ? others : members;
  if (source.length === 0) return 'Group Thread';
  const firstNames = source.map((m) => (m.name || 'Member').trim().split(/\s+/)[0]);
  if (firstNames.length <= 3) {
    return firstNames.join(', ');
  }
  return `${firstNames.slice(0, 2).join(', ')} +${firstNames.length - 2}`;
}

export function getDisplayPreviewForMessage(rawRow: any): {
  preview: string;
  senderName?: string;
  group?: GroupEnvelope;
  isSystemEvent: boolean;
} {
  const parsed = parseChatMessagePayload(rawRow);
  let preview = parsed.text.trim();
  if (!preview) {
    if (parsed.audioCard) {
      preview =
        parsed.audioCard.kind === 'voice'
          ? '🎤 Voice note'
          : `🎵 Demo: ${parsed.audioCard.title}`;
    } else if (parsed.offerCard) {
      preview =
        parsed.offerCard.type === 'show_share'
          ? `🎟 Show: ${parsed.offerCard.title}`
          : `📋 Offer: ${parsed.offerCard.title}`;
    } else if (parsed.mediaUrl) {
      preview = 'Sent an attachment';
    } else {
      preview = 'New message';
    }
  }
  return {
    preview,
    senderName: parsed.group?.senderName,
    group: parsed.group,
    isSystemEvent: parsed.isSystemEvent,
  };
}

export interface HydratedThreadMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  recipient_id?: string;
  created_at: string;
  is_read: boolean;
  textContent: string;
  mediaUrl?: string;
  group?: GroupEnvelope;
  replyTo?: ReplyReference;
  audioCard?: AudioCardPayload;
  offerCard?: OfferCardPayload;
  isSystemEvent: boolean;
  raw: any;
}

/**
 * Collapses fanned-out group rows that share the same `group.msgId` into one
 * chronological timeline and normalizes text, media, replies, audio, and offers.
 */
export function buildThreadTimeline(
  rows: any[],
  options?: { groupId?: string; contactId?: string; myIds?: string[] }
): HydratedThreadMessage[] {
  const myIdSet = new Set((options?.myIds || []).map((id) => String(id).toLowerCase()));
  const seenMsgKeys = new Set<string>();
  const normalized: HydratedThreadMessage[] = [];

  const sorted = [...(rows || [])].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  for (const row of sorted) {
    const parsed = parseChatMessagePayload(row);

    if (options?.groupId) {
      if (!parsed.group || parsed.group.groupId !== options.groupId) continue;
    } else if (options?.contactId) {
      // 1-on-1 thread must exclude group envelopes so group chats don't leak into DMs
      if (parsed.group) continue;
      const targetLower = options.contactId.toLowerCase();
      const senderLower = String(row.sender_id || '').toLowerCase();
      const recLower = String(row.receiver_id || row.recipient_id || '').toLowerCase();
      const involvesTarget = senderLower === targetLower || recLower === targetLower;
      const involvesMe =
        myIdSet.size === 0 || myIdSet.has(senderLower) || myIdSet.has(recLower);
      if (!involvesTarget || !involvesMe) continue;
    }

    const dedupeKey = parsed.group?.msgId ? `grp:${parsed.group.msgId}` : `id:${row.id}`;
    if (seenMsgKeys.has(dedupeKey)) continue;
    seenMsgKeys.add(dedupeKey);

    normalized.push({
      id: String(row.id || dedupeKey),
      sender_id: String(row.sender_id || ''),
      receiver_id: row.receiver_id,
      recipient_id: row.recipient_id,
      created_at: row.created_at || new Date().toISOString(),
      is_read: Boolean(row.is_read),
      textContent: parsed.text,
      mediaUrl: parsed.mediaUrl,
      group: parsed.group,
      replyTo: parsed.replyTo,
      audioCard: parsed.audioCard,
      offerCard: parsed.offerCard,
      isSystemEvent: parsed.isSystemEvent,
      raw: row,
    });
  }

  return normalized;
}

/**
 * Resolves latest offer acceptance/counter state across chronological thread messages.
 */
export function computeOfferStatuses(
  timeline: HydratedThreadMessage[]
): Record<
  string,
  { status: 'pending' | 'accepted' | 'countered'; guarantee?: string; respondedBy?: string }
> {
  const statuses: Record<
    string,
    { status: 'pending' | 'accepted' | 'countered'; guarantee?: string; respondedBy?: string }
  > = {};

  for (const msg of timeline) {
    const card = msg.offerCard;
    if (!card) continue;
    if (card.type === 'tour_offer') {
      statuses[card.id] = {
        status: card.status || 'pending',
        guarantee: card.guarantee,
        respondedBy: card.respondedBy,
      };
    } else if (card.type === 'offer_response' && card.targetOfferId) {
      statuses[card.targetOfferId] = {
        status: card.status || 'countered',
        guarantee: card.guarantee || statuses[card.targetOfferId]?.guarantee,
        respondedBy: card.respondedBy,
      };
    }
  }
  return statuses;
}

export interface SharedThreadLink {
  msgId: string;
  url: string;
  createdAt: string;
}

/**
 * Extracts HTTP/HTTPS links shared inside thread messages for In-Thread Search.
 */
export function extractSharedLinks(timeline: HydratedThreadMessage[]): SharedThreadLink[] {
  const links: SharedThreadLink[] = [];
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  for (const msg of timeline) {
    const matches = (msg.textContent || '').match(urlRegex) || [];
    for (const url of matches) {
      links.push({
        msgId: msg.id,
        url,
        createdAt: msg.created_at,
      });
    }
  }
  return links;
}

/**
 * Aggregates raw `nexus_chats` rows across ALL identifiers of the current user
 * into unified 1-on-1 and Group conversation headers, deduplicating fanned-out messages.
 */
export function aggregateInboxConversations(
  rows: any[],
  myIdentifiers: string[],
  profileLookup: Map<string, any>
): InboxConversation[] {
  const myIdSet = new Set(
    (myIdentifiers || []).map((id) => String(id || '').toLowerCase().trim()).filter(Boolean)
  );

  const dmMap = new Map<string, InboxConversation>();
  const groupMap = new Map<
    string,
    {
      conv: InboxConversation;
      seenMsgIds: Set<string>;
      memberMap: Map<string, GroupMember>;
      latestNameTs: number;
    }
  >();

  const sortedDesc = [...(rows || [])].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  for (const row of sortedDesc) {
    const senderLower = String(row.sender_id || '').toLowerCase().trim();
    const isMe = myIdSet.has(senderLower);
    const parsed = parseChatMessagePayload(row);
    const displayMeta = getDisplayPreviewForMessage(row);
    const msgUnread = !isMe && (row.is_read === false || row.is_read === null || row.is_read === undefined);

    if (parsed.group) {
      const grp = parsed.group;
      const gId = grp.groupId;
      const tsMs = new Date(row.created_at || 0).getTime() || 0;

      if (!groupMap.has(gId)) {
        const memberMap = new Map<string, GroupMember>();
        (grp.members || []).forEach((m) => {
          if (m?.id) memberMap.set(String(m.id).toLowerCase(), m);
        });

        const formattedLast =
          parsed.isSystemEvent || !grp.senderName
            ? displayMeta.preview
            : `${isMe ? 'You' : grp.senderName.split(' ')[0]}: ${displayMeta.preview}`;

        groupMap.set(gId, {
          conv: {
            contactId: gId,
            groupId: gId,
            isGroup: true,
            groupName: grp.groupName,
            profileName: grp.groupName || formatDefaultGroupName(grp.members || [], myIdentifiers),
            lastMessage: formattedLast,
            lastSenderName: grp.senderName,
            timestamp: row.created_at || new Date().toISOString(),
            isRead: !msgUnread,
            unreadCount: msgUnread ? 1 : 0,
            unread: msgUnread ? 1 : 0,
            roleBadge: `GROUP · ${Math.max(2, memberMap.size || (grp.members || []).length)}`,
            members: Array.from(memberMap.values()),
          },
          seenMsgIds: new Set(grp.msgId ? [grp.msgId] : []),
          memberMap,
          latestNameTs: tsMs,
        });
      } else {
        const entry = groupMap.get(gId)!;
        (grp.members || []).forEach((m) => {
          if (m?.id && !entry.memberMap.has(String(m.id).toLowerCase())) {
            entry.memberMap.set(String(m.id).toLowerCase(), m);
          }
        });
        if (tsMs >= entry.latestNameTs && grp.groupName) {
          entry.conv.groupName = grp.groupName;
          entry.conv.profileName = grp.groupName;
          entry.latestNameTs = tsMs;
        }
        entry.conv.members = Array.from(entry.memberMap.values());
        entry.conv.roleBadge = `GROUP · ${Math.max(2, entry.conv.members.length)}`;

        const dedupeKey = grp.msgId || String(row.id);
        if (!entry.seenMsgIds.has(dedupeKey)) {
          entry.seenMsgIds.add(dedupeKey);
          if (msgUnread) {
            entry.conv.unreadCount = (entry.conv.unreadCount || 0) + 1;
            entry.conv.unread = entry.conv.unreadCount;
            entry.conv.isRead = false;
          }
        }
      }
      continue;
    }

    // Standard 1-on-1 DM
    const otherId = isMe ? row.receiver_id || row.recipient_id : row.sender_id;
    if (!otherId) continue;

    const otherKey = String(otherId).trim();
    const otherLower = otherKey.toLowerCase();
    if (isMe && myIdSet.has(otherLower)) continue;

    if (!dmMap.has(otherLower)) {
      const profile = profileLookup.get(otherKey) || profileLookup.get(otherLower);
      const nameStr =
        profile?.full_name ||
        profile?.name ||
        profile?.console_handle ||
        otherKey ||
        'Direct Contact';

      dmMap.set(otherLower, {
        contactId: otherKey,
        email: profile?.email || (otherKey.includes('@') ? otherKey : undefined),
        profileName: nameStr,
        avatarUrl: profile?.avatar_url || profile?.avatar || undefined,
        lastMessage: displayMeta.preview,
        timestamp: row.created_at || new Date().toISOString(),
        isRead: !msgUnread,
        unreadCount: msgUnread ? 1 : 0,
        unread: msgUnread ? 1 : 0,
        roleBadge: (profile?.account_type || profile?.role || 'USER').toUpperCase(),
        isGroup: false,
      });
    } else if (msgUnread) {
      const existing = dmMap.get(otherLower)!;
      existing.unreadCount = (existing.unreadCount || 0) + 1;
      existing.unread = existing.unreadCount;
      existing.isRead = false;
    }
  }

  return [...Array.from(groupMap.values()).map((g) => g.conv), ...Array.from(dmMap.values())].sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );
}

export function getInboxCacheKey(identifiers: string[]): string {
  const primary = (identifiers || []).find((id) => Boolean(id && String(id).trim()));
  return `nexus_inbox_threads_${String(primary || 'default').toLowerCase().trim()}`;
}

export function readCachedConversations(identifiers: string[]): InboxConversation[] {
  if (typeof localStorage === 'undefined') return [];
  const keys = Array.from(
    new Set(
      (identifiers || [])
        .filter(Boolean)
        .map((id) => `nexus_inbox_threads_${String(id).toLowerCase().trim()}`)
    )
  );
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore malformed cache
    }
  }
  return [];
}

export function writeCachedConversations(
  identifiers: string[],
  conversations: InboxConversation[]
): void {
  if (typeof localStorage === 'undefined') return;
  const key = getInboxCacheKey(identifiers);
  try {
    localStorage.setItem(key, JSON.stringify(conversations.slice(0, 80)));
  } catch {
    // ignore storage quota errors
  }
}

export function hasCustomProfileImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (
    trimmed.includes('placeholder') ||
    trimmed.includes('default-avatar') ||
    trimmed.includes('default_avatar') ||
    trimmed === 'default'
  ) {
    return false;
  }
  return true;
}

function seededSceneWeight(key: string, seed: number): number {
  let h = Math.floor(seed * 1000003) | 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 2654435761) | 0;
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Places profiles with real avatar images up front and randomizes order within
 * both the image-backed group and the initials-only group using a stable seed.
 */
export function prioritizeAndRandomizeSceneNotes<
  T extends { id?: string; profileName?: string; handle?: string; avatarUrl?: string }
>(items: T[], seed: number): T[] {
  const withImages: T[] = [];
  const withoutImages: T[] = [];

  for (const item of items) {
    if (hasCustomProfileImage(item.avatarUrl)) {
      withImages.push(item);
    } else {
      withoutImages.push(item);
    }
  }

  const compareBySeed = (a: T, b: T) => {
    const keyA = String(a.id || a.handle || a.profileName || '');
    const keyB = String(b.id || b.handle || b.profileName || '');
    return seededSceneWeight(keyA, seed) - seededSceneWeight(keyB, seed);
  };

  withImages.sort(compareBySeed);
  withoutImages.sort(compareBySeed);

  return [...withImages, ...withoutImages];
}
