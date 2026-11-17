import { describe, expect, it } from 'vitest';
import {
  aggregateInboxConversations,
  buildThreadTimeline,
  computeOfferStatuses,
  encodeGroupMessagePayload,
  encodeMediaMessagePayload,
  encodeRichMessagePayload,
  extractSharedLinks,
  formatDefaultGroupName,
  getDisplayPreviewForMessage,
  parseChatMessagePayload,
  prioritizeAndRandomizeSceneNotes,
  GroupMember,
} from '../../utils/groupMessagingUtils';
import { computeThreadPresenceKey } from '../../hooks/useThreadPresence';

describe('Inbox sync and group messaging invariants', () => {
  const meId = '5403162d-1947-43aa-b5f6-38a1bd2a1b80';
  const meAltId = '11111111-1111-4111-8111-111111111111';
  const aliceId = '2ae108ae-cda7-4f0c-a94c-8492391bac4c';
  const bobId = '3be208ae-cda7-4f0c-a94c-8492391bac99';
  const carolId = '4cf308ae-cda7-4f0c-a94c-8492391bac88';

  const members: GroupMember[] = [
    { id: meId, name: 'Miguel Medina', role: 'PROMOTER' },
    { id: aliceId, name: 'Alice Vance', role: 'ARTIST' },
    { id: bobId, name: 'Bob Thrash', role: 'BAND' },
    { id: carolId, name: 'Carol Riff', role: 'USER' },
  ];

  it('encodes and decodes group and media message envelopes safely', () => {
    const encodedGroup = encodeGroupMessagePayload({
      v: 1,
      groupId: 'grp_tour_123',
      groupName: 'Midwest Routing Crew',
      members,
      msgId: 'msg_abc',
      senderName: 'Alice Vance',
      text: 'Load-in is at 6 PM sharp',
      mediaUrl: 'https://example.com/flyer.jpg',
    });

    const parsedGroup = parseChatMessagePayload(encodedGroup);
    expect(parsedGroup.group?.groupId).toBe('grp_tour_123');
    expect(parsedGroup.group?.groupName).toBe('Midwest Routing Crew');
    expect(parsedGroup.text).toBe('Load-in is at 6 PM sharp');
    expect(parsedGroup.mediaUrl).toBe('https://example.com/flyer.jpg');
    expect(parsedGroup.isSystemEvent).toBe(false);

    const encodedMedia = encodeMediaMessagePayload('Check this flyer', 'https://example.com/f.png');
    const parsedMedia = parseChatMessagePayload(encodedMedia);
    expect(parsedMedia.text).toBe('Check this flyer');
    expect(parsedMedia.mediaUrl).toBe('https://example.com/f.png');
    expect(parsedMedia.group).toBeUndefined();

    const plain = parseChatMessagePayload('Simple DM text');
    expect(plain.text).toBe('Simple DM text');
    expect(plain.group).toBeUndefined();
  });

  it('encodes and decodes rich DM payloads with replyTo, audioCard, and offerCard', () => {
    const encodedRich = encodeRichMessagePayload({
      v: 1,
      msgId: 'rich-1',
      text: 'Listen to the bridge on this mix',
      replyTo: {
        msgId: 'orig-10',
        senderName: 'Alice Vance',
        excerpt: 'Send over the rough stem whenever ready',
      },
      audioCard: {
        id: 'demo-44',
        kind: 'demo',
        title: 'Crypts of Eternity (Mix v2)',
        artist: 'Vespera',
        durationSec: 194,
        audioUrl: 'https://cdn.example.com/mix-v2.mp3',
      },
    });

    const parsed = parseChatMessagePayload(encodedRich);
    expect(parsed.text).toBe('Listen to the bridge on this mix');
    expect(parsed.replyTo?.senderName).toBe('Alice Vance');
    expect(parsed.replyTo?.msgId).toBe('orig-10');
    expect(parsed.audioCard?.title).toBe('Crypts of Eternity (Mix v2)');
    expect(parsed.audioCard?.durationSec).toBe(194);
  });

  it('auto-upgrades legacy tour offer and song demo quick strings into structured cards', () => {
    const legacyOffer = parseChatMessagePayload({
      id: 'leg-1',
      message: '📋 TOUR BOOKING OFFER: Requesting slot for Nov 20 in Austin.',
    });
    expect(legacyOffer.offerCard?.type).toBe('tour_offer');
    expect(legacyOffer.offerCard?.status).toBe('pending');

    const legacyDemo = parseChatMessagePayload({
      id: 'leg-2',
      message: '🎵 DEMO TRACK ATTACHMENT: Crimson Dawn Master',
    });
    expect(legacyDemo.audioCard?.kind).toBe('demo');
    expect(legacyDemo.audioCard?.title).toBe('Crimson Dawn Master');
  });

  it('resolves tour offer statuses across offer responses and extracts shared links', () => {
    const offerPayload = encodeGroupMessagePayload({
      v: 1,
      groupId: 'grp_offers',
      groupName: 'Booking Crew',
      members: members.slice(0, 3),
      msgId: 'offer-msg-1',
      senderName: 'Miguel Medina',
      text: 'Check routing flyer at https://venues.nexus.fm/bottleneck',
      offerCard: {
        id: 'offer-99',
        type: 'tour_offer',
        title: 'Midwest Metal Night',
        venue: 'The Bottleneck',
        city: 'Lawrence, KS',
        date: '2026-11-28',
        guarantee: '$900 Guarantee',
        status: 'pending',
      },
    });

    const acceptPayload = encodeGroupMessagePayload({
      v: 1,
      groupId: 'grp_offers',
      groupName: 'Booking Crew',
      members: members.slice(0, 3),
      msgId: 'offer-resp-2',
      senderName: 'Alice Vance',
      text: '',
      offerCard: {
        id: 'resp-1',
        type: 'offer_response',
        targetOfferId: 'offer-99',
        title: 'Midwest Metal Night',
        guarantee: '$1,100 Guarantee',
        status: 'accepted',
        respondedBy: 'Alice Vance',
      },
    });

    const timeline = buildThreadTimeline(
      [
        {
          id: 'r-o1',
          sender_id: meId,
          receiver_id: aliceId,
          message: offerPayload,
          is_read: true,
          created_at: '2026-11-15T10:00:00.000Z',
        },
        {
          id: 'r-o2',
          sender_id: aliceId,
          receiver_id: meId,
          message: acceptPayload,
          is_read: false,
          created_at: '2026-11-15T10:05:00.000Z',
        },
      ],
      { groupId: 'grp_offers', myIds: [meId] }
    );

    const statuses = computeOfferStatuses(timeline);
    expect(statuses['offer-99']?.status).toBe('accepted');
    expect(statuses['offer-99']?.guarantee).toBe('$1,100 Guarantee');
    expect(statuses['offer-99']?.respondedBy).toBe('Alice Vance');

    const links = extractSharedLinks(timeline);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://venues.nexus.fm/bottleneck');
  });

  it('computes deterministic thread presence channel keys for DMs and Groups', () => {
    const k1 = computeThreadPresenceKey(meId, aliceId, false);
    const k2 = computeThreadPresenceKey(aliceId, meId, false);
    expect(k1).toBeTruthy();
    expect(k1).toBe(k2);

    const gKey = computeThreadPresenceKey(meId, 'grp_123', true);
    expect(gKey).toBe('grp:grp_123');
  });

  it('formats sensible default group names excluding the current user', () => {
    expect(formatDefaultGroupName(members, [meId])).toBe('Alice, Bob, Carol');
    const fiveMembers: GroupMember[] = [
      ...members,
      { id: '5df408ae-cda7-4f0c-a94c-8492391bac77', name: 'Dave Doom' },
    ];
    expect(formatDefaultGroupName(fiveMembers, [meId])).toBe('Alice, Bob +2');
  });

  it('deduplicates fanned-out group rows and isolates DMs from groups in timeline', () => {
    const fanOutPayload = encodeGroupMessagePayload({
      v: 1,
      groupId: 'grp_1',
      groupName: 'Booking Team',
      members: members.slice(0, 3),
      msgId: 'shared-msg-1',
      senderName: 'Miguel Medina',
      text: 'Can everyone make Friday?',
    });

    const rawRows = [
      {
        id: 'row-1',
        sender_id: meId,
        receiver_id: aliceId,
        recipient_id: aliceId,
        message: fanOutPayload,
        is_read: false,
        created_at: '2026-11-15T10:00:00.000Z',
      },
      {
        id: 'row-2',
        sender_id: meId,
        receiver_id: bobId,
        recipient_id: bobId,
        message: fanOutPayload,
        is_read: false,
        created_at: '2026-11-15T10:00:00.000Z',
      },
      {
        id: 'row-3',
        sender_id: aliceId,
        receiver_id: meId,
        recipient_id: meId,
        message: 'Yes, I am in!',
        is_read: false,
        created_at: '2026-11-15T10:01:00.000Z',
      },
    ];

    const groupTimeline = buildThreadTimeline(rawRows, {
      groupId: 'grp_1',
      myIds: [meId],
    });
    expect(groupTimeline).toHaveLength(1);
    expect(groupTimeline[0].textContent).toBe('Can everyone make Friday?');

    const dmTimeline = buildThreadTimeline(rawRows, {
      contactId: aliceId,
      myIds: [meId],
    });
    expect(dmTimeline).toHaveLength(1);
    expect(dmTimeline[0].textContent).toBe('Yes, I am in!');
  });

  it('aggregates DMs across multiple user UUIDs and collapses group unread counts', () => {
    const profileMap = new Map<string, any>([
      [aliceId, { id: aliceId, full_name: 'Alice Vance', account_type: 'Artist' }],
      [bobId, { id: bobId, full_name: 'Bob Thrash', account_type: 'Band' }],
    ]);

    const aliceGroupMsg = encodeGroupMessagePayload({
      v: 1,
      groupId: 'grp_sync',
      groupName: 'Tour Bus',
      members: members.slice(0, 3),
      msgId: 'grp-m-1',
      senderName: 'Alice Vance',
      text: 'Bus leaves at 9',
    });

    const rows = [
      {
        id: 'r1',
        sender_id: aliceId,
        receiver_id: meId,
        recipient_id: meId,
        message: aliceGroupMsg,
        is_read: false,
        created_at: '2026-11-15T12:00:00.000Z',
      },
      // Duplicate fan-out row visible if another identity received copy
      {
        id: 'r2',
        sender_id: aliceId,
        receiver_id: meAltId,
        recipient_id: meAltId,
        message: aliceGroupMsg,
        is_read: false,
        created_at: '2026-11-15T12:00:00.000Z',
      },
      // Direct message sent to user's secondary profile UUID
      {
        id: 'r3',
        sender_id: bobId,
        receiver_id: meAltId,
        recipient_id: meAltId,
        message: 'Got the stage plot',
        is_read: false,
        created_at: '2026-11-15T11:30:00.000Z',
      },
    ];

    const convs = aggregateInboxConversations(rows, [meId, meAltId], profileMap);
    expect(convs).toHaveLength(2);

    const groupConv = convs.find((c) => c.isGroup);
    expect(groupConv?.groupName).toBe('Tour Bus');
    expect(groupConv?.unreadCount).toBe(1);
    expect(groupConv?.lastMessage).toBe('Alice: Bus leaves at 9');

    const dmConv = convs.find((c) => !c.isGroup);
    expect(dmConv?.contactId).toBe(bobId);
    expect(dmConv?.profileName).toBe('Bob Thrash');
    expect(dmConv?.unreadCount).toBe(1);
  });

  it('provides human-readable notification preview text for group payloads', () => {
    const payload = encodeGroupMessagePayload({
      v: 1,
      groupId: 'grp_9',
      groupName: 'Audio Crew',
      members,
      msgId: 'm-99',
      senderName: 'Bob Thrash',
      text: 'Soundcheck moved up 15m',
    });

    const preview = getDisplayPreviewForMessage({ message: payload });
    expect(preview.preview).toBe('Soundcheck moved up 15m');
    expect(preview.group?.groupName).toBe('Audio Crew');
    expect(preview.group?.senderName).toBe('Bob Thrash');
  });

  it('prioritizes profiles with custom avatar images up front and randomizes within each group', () => {
    const items = [
      { id: '1', profileName: 'Jessica', avatarUrl: '' },
      { id: '2', profileName: 'Gregory', avatarUrl: undefined },
      { id: '3', profileName: 'Garrett', avatarUrl: 'https://cdn.example.com/garrett.jpg' },
      { id: '4', profileName: 'Tyler', avatarUrl: 'https://cdn.example.com/tyler.jpg' },
      { id: '5', profileName: 'Maya', avatarUrl: 'https://cdn.example.com/maya.jpg' },
      { id: '6', profileName: 'Placeholder', avatarUrl: 'https://cdn.example.com/default-avatar.png' },
    ];

    const runA = prioritizeAndRandomizeSceneNotes(items, 0.137);
    const runB = prioritizeAndRandomizeSceneNotes(items, 0.891);

    // First 3 entries must always be the ones with real profile images
    expect(runA.slice(0, 3).map((i) => i.id).sort()).toEqual(['3', '4', '5']);
    expect(runB.slice(0, 3).map((i) => i.id).sort()).toEqual(['3', '4', '5']);

    // Profiles without images (including default-avatar placeholders) follow after
    expect(runA.slice(3).map((i) => i.id).sort()).toEqual(['1', '2', '6']);
  });
});
