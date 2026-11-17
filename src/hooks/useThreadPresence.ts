import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ThreadMemberPresence {
  userId: string;
  name: string;
  avatarUrl?: string;
  isTyping: boolean;
  lastReadMsgId?: string;
  updatedAt?: number;
}

interface UseThreadPresenceOptions {
  threadKey: string | null;
  myUserId: string | null;
  myName: string;
  myAvatar?: string;
}

export function computeThreadPresenceKey(
  myUserId: string | null,
  contactId?: string | null,
  isGroup?: boolean
): string | null {
  if (!contactId) return null;
  if (isGroup) return `grp:${contactId.toLowerCase()}`;
  if (!myUserId) return null;
  const pair = [myUserId.toLowerCase(), contactId.toLowerCase()].sort();
  return `dm:${pair[0]}_${pair[1]}`;
}

export function useThreadPresence({
  threadKey,
  myUserId,
  myName,
  myAvatar,
}: UseThreadPresenceOptions) {
  const [typingUsers, setTypingUsers] = useState<ThreadMemberPresence[]>([]);
  const [memberReadMap, setMemberReadMap] = useState<Record<string, ThreadMemberPresence>>({});

  const channelRef = useRef<any>(null);
  const myStateRef = useRef<{ isTyping: boolean; lastReadMsgId?: string }>({
    isTyping: false,
    lastReadMsgId: undefined,
  });
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myUserIdRef = useRef(myUserId);
  myUserIdRef.current = myUserId;
  const myNameRef = useRef(myName);
  myNameRef.current = myName;
  const myAvatarRef = useRef(myAvatar);
  myAvatarRef.current = myAvatar;

  const trackCurrentState = useCallback(async () => {
    const ch = channelRef.current;
    const uid = myUserIdRef.current;
    if (!ch || !uid) return;
    try {
      await ch.track({
        userId: uid,
        name: myNameRef.current || 'Member',
        avatarUrl: myAvatarRef.current || undefined,
        isTyping: myStateRef.current.isTyping,
        lastReadMsgId: myStateRef.current.lastReadMsgId,
        updatedAt: Date.now(),
      });
    } catch {
      // non-fatal presence failure
    }
  }, []);

  useEffect(() => {
    if (!threadKey || !myUserId) {
      setTypingUsers([]);
      setMemberReadMap({});
      return;
    }

    const sanitizedKey = threadKey.replace(/[^a-z0-9_:-]/gi, '_');
    const channel = supabase.channel(`nexus_thread_presence_${sanitizedKey}`, {
      config: {
        presence: {
          key: myUserId.toLowerCase(),
        },
      },
    });

    const syncFromPresence = () => {
      const state = channel.presenceState() as Record<string, any[]>;
      const now = Date.now();
      const myLower = myUserId.toLowerCase();
      const nextTyping: ThreadMemberPresence[] = [];
      const nextReadMap: Record<string, ThreadMemberPresence> = {};

      Object.entries(state).forEach(([key, entries]) => {
        if (!Array.isArray(entries) || entries.length === 0) return;
        const latest = entries[entries.length - 1];
        if (!latest) return;
        const uid = String(latest.userId || key || '').trim();
        if (!uid || uid.toLowerCase() === myLower) return;

        const isFreshTyping =
          Boolean(latest.isTyping) && (!latest.updatedAt || now - latest.updatedAt < 6500);

        const memberPresence: ThreadMemberPresence = {
          userId: uid,
          name: latest.name || 'Member',
          avatarUrl: latest.avatarUrl || undefined,
          isTyping: isFreshTyping,
          lastReadMsgId: latest.lastReadMsgId || undefined,
          updatedAt: latest.updatedAt,
        };

        if (isFreshTyping) {
          nextTyping.push(memberPresence);
        }
        if (memberPresence.lastReadMsgId) {
          nextReadMap[uid.toLowerCase()] = memberPresence;
        }
      });

      setTypingUsers((prev) => {
        const prevSig = prev.map((u) => `${u.userId}:${u.isTyping}`).join('|');
        const nextSig = nextTyping.map((u) => `${u.userId}:${u.isTyping}`).join('|');
        return prevSig === nextSig ? prev : nextTyping;
      });

      setMemberReadMap((prev) => {
        const prevSig = Object.entries(prev)
          .map(([k, v]) => `${k}:${v.lastReadMsgId}`)
          .sort()
          .join('|');
        const nextSig = Object.entries(nextReadMap)
          .map(([k, v]) => `${k}:${v.lastReadMsgId}`)
          .sort()
          .join('|');
        return prevSig === nextSig ? prev : nextReadMap;
      });
    };

    channel
      .on('presence', { event: 'sync' }, syncFromPresence)
      .on('presence', { event: 'join' }, syncFromPresence)
      .on('presence', { event: 'leave' }, syncFromPresence)
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
          await trackCurrentState();
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      myStateRef.current.isTyping = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [threadKey, myUserId, trackCurrentState]);

  const notifyTyping = useCallback(
    (active: boolean) => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (myStateRef.current.isTyping !== active) {
        myStateRef.current.isTyping = active;
        trackCurrentState();
      }
      if (active) {
        typingTimerRef.current = setTimeout(() => {
          myStateRef.current.isTyping = false;
          trackCurrentState();
        }, 2800);
      }
    },
    [trackCurrentState]
  );

  const notifyReadMessage = useCallback(
    (msgId: string | undefined) => {
      if (!msgId || myStateRef.current.lastReadMsgId === msgId) return;
      myStateRef.current.lastReadMsgId = msgId;
      trackCurrentState();
    },
    [trackCurrentState]
  );

  return {
    typingUsers,
    memberReadMap,
    notifyTyping,
    notifyReadMessage,
  };
}

export default useThreadPresence;
