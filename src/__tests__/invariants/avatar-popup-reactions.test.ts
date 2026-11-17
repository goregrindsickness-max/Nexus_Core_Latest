import { describe, it, expect } from 'vitest';
import {
  normalizeReactionState,
  getTotalReactionCount,
  normalizeComments,
} from '@/src/components/messaging/AvatarPopupOverlay';

describe('Invariant 8: AvatarPopupOverlay Photo Pit Lightbox Reaction & Comment Normalization', () => {
  it('normalizes backend object reaction maps without throwing TypeError: reactions.reduce is not a function', () => {
    const serverPayload = {
      reactions: { horns: 3, fire: 2, skull: 0, heart: 1 },
      userReactions: {
        'user-123': { horns: true, fire: false, heart: true },
        'other-user': { skull: true },
      },
    };

    const result = normalizeReactionState(
      serverPayload.reactions,
      serverPayload.userReactions,
      'user-123'
    );

    expect(result.counts).toEqual({
      '🤘': 3,
      '🔥': 2,
      '❤️': 1,
    });
    expect(result.userActive).toEqual({
      '🤘': true,
      '❤️': true,
    });
    expect(getTotalReactionCount(result.counts)).toBe(6);
  });

  it('normalizes legacy array-shaped reactions and flat emoji caches accurately', () => {
    const legacyArray = [
      { userId: 'u1', username: 'A', avatarUrl: null, emoji: '🔥' },
      { userId: 'u2', username: 'B', avatarUrl: null, emoji: '🔥' },
      { userId: 'u1', username: 'A', avatarUrl: null, emoji: '⚡' },
    ];

    const fromArray = normalizeReactionState(legacyArray, undefined, 'u1');
    expect(fromArray.counts).toEqual({ '🔥': 2, '⚡': 1 });
    expect(fromArray.userActive).toEqual({ '🔥': true, '⚡': true });
    expect(getTotalReactionCount(fromArray.counts)).toBe(3);

    const flatCached = normalizeReactionState(
      { '👏': 4, '🌟': 1 },
      { '👏': true, '🌟': false },
      'u1'
    );
    expect(flatCached.counts).toEqual({ '👏': 4, '🌟': 1 });
    expect(flatCached.userActive).toEqual({ '👏': true });
    expect(getTotalReactionCount(flatCached.counts)).toBe(5);
  });

  it('handles null, undefined, primitive, and malformed reaction payloads safely', () => {
    for (const badInput of [null, undefined, 'bad', 42, NaN, { horns: -3, fire: 'abc' }]) {
      const res = normalizeReactionState(badInput, badInput, 'u1');
      expect(res.counts).toEqual({});
      expect(res.userActive).toEqual({});
      expect(getTotalReactionCount(res.counts)).toBe(0);
    }
    expect(getTotalReactionCount(null)).toBe(0);
    expect(getTotalReactionCount([] as any)).toBe(0);
  });

  it('normalizes both server comments (authorName/authorAvatar) and client comments (username/avatarUrl)', () => {
    const normalized = normalizeComments([
      {
        id: 'avc_1',
        userId: 'u1',
        authorName: 'Miguel',
        authorAvatar: 'https://cdn.example.com/m.jpg',
        text: 'Killer shot from the pit!',
        createdAt: '2026-11-14T10:00:00.000Z',
      },
      {
        id: 'comment_2',
        userId: 'u2',
        username: 'Alex',
        avatarUrl: null,
        text: 'Great lighting',
        createdAt: '2026-11-14T10:01:00.000Z',
      },
      null,
      { id: 'empty', text: '' },
    ]);

    expect(normalized).toEqual([
      {
        id: 'avc_1',
        userId: 'u1',
        username: 'Miguel',
        avatarUrl: 'https://cdn.example.com/m.jpg',
        text: 'Killer shot from the pit!',
        createdAt: '2026-11-14T10:00:00.000Z',
      },
      {
        id: 'comment_2',
        userId: 'u2',
        username: 'Alex',
        avatarUrl: null,
        text: 'Great lighting',
        createdAt: '2026-11-14T10:01:00.000Z',
      },
    ]);
    expect(normalizeComments(null)).toEqual([]);
  });
});
