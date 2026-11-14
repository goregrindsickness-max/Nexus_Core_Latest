import express from 'express';
import webpush from 'web-push';
import {
  getSupabaseService,
  getUserOwnedEntityIds,
  hasAnyOwnershipMatch,
} from '../lib/supabaseAdmin';
import {
  getVapidKeys,
  initVapidKeys,
  loadPushSubscriptionsAsync,
  writePushSubscriptions,
  syncPushSubscriptionToSupabase,
  deletePushSubscriptionFromSupabase,
  checkAndSend24hShowReminders,
  StoredPushSubscription,
} from '../lib/clients';
import {
  requireAuth,
  requireAdmin,
} from '../middleware/auth';
import {
  pushLimiter,
} from '../middleware/security';

export const pushRouter = express.Router();

// API ROUTE: Get VAPID Public Key for browser PushManager subscription
pushRouter.get('/api/push/vapid-public-key', async (_req, res) => {
  const keys = getVapidKeys() || (await initVapidKeys());
  res.json({ publicKey: keys.publicKey });
});

// API ROUTE: Get Web Push gateway status & active subscription count
pushRouter.get('/api/push/status', requireAuth, async (req, res) => {
  const subs = await loadPushSubscriptionsAsync();
  const keys = getVapidKeys() || (await initVapidKeys());
  const userSubs = req.authUser?.isAdmin
    ? subs
    : subs.filter(
        (s) =>
          s.userId === req.authUser?.id ||
          (req.authUser?.email && s.userEmail?.toLowerCase() === req.authUser.email)
      );
  res.json({
    configured: Boolean(keys.publicKey && keys.privateKey),
    publicKey: keys.publicKey,
    activeSubscriptions: userSubs.length,
  });
});

// API ROUTE: Register or update a browser Web Push subscription
pushRouter.post('/api/push/subscribe', requireAuth, pushLimiter, express.json(), async (req, res) => {
  try {
    const { subscription, role, userAgent } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid PushSubscription object (missing endpoint)' });
    }

    const verifiedUserId = req.authUser!.id;
    const verifiedEmail = req.authUser!.email;

    const subs = await loadPushSubscriptionsAsync();
    const now = new Date().toISOString();
    const existingIndex = subs.findIndex((s) => s.subscription?.endpoint === subscription.endpoint);

    let savedEntry: StoredPushSubscription;

    if (existingIndex >= 0) {
      subs[existingIndex] = {
        ...subs[existingIndex],
        userId: verifiedUserId || subs[existingIndex].userId,
        userEmail: verifiedEmail || subs[existingIndex].userEmail,
        role: role || subs[existingIndex].role,
        subscription,
        userAgent: userAgent || subs[existingIndex].userAgent,
        last_used_at: now,
      };
      savedEntry = subs[existingIndex];
    } else {
      savedEntry = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: verifiedUserId,
        userEmail: verifiedEmail,
        role,
        subscription,
        userAgent,
        created_at: now,
        last_used_at: now,
      };
      subs.push(savedEntry);
    }

    writePushSubscriptions(subs);
    syncPushSubscriptionToSupabase(savedEntry).catch(() => {});

    res.json({ success: true, totalSubscriptions: subs.length });
  } catch (err: any) {
    console.error('[WEB PUSH SUBSCRIBE ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to save push subscription' });
  }
});

// API ROUTE: Unsubscribe a browser endpoint
pushRouter.post('/api/push/unsubscribe', requireAuth, pushLimiter, express.json(), async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }
    const subs = await loadPushSubscriptionsAsync();
    const target = subs.find((s) => s.subscription?.endpoint === endpoint);
    if (
      target &&
      !req.authUser!.isAdmin &&
      target.userId &&
      target.userId !== req.authUser!.id
    ) {
      return res.status(403).json({
        error: 'Forbidden: Cannot unsubscribe another user endpoint.',
      });
    }
    const filtered = subs.filter((s) => s.subscription?.endpoint !== endpoint);
    writePushSubscriptions(filtered);
    deletePushSubscriptionFromSupabase(endpoint).catch(() => {});
    res.json({ success: true, totalSubscriptions: filtered.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unsubscribe' });
  }
});

// API ROUTE: Dispatch real Web Push Notification via VAPID + Persist to Supabase
pushRouter.post('/api/push/send', requireAuth, pushLimiter, express.json(), async (req, res) => {
  try {
    const {
      title = 'NEXUS CORE // DISPATCH',
      body = 'You have a new high-priority alert in your command console.',
      icon = '/icon-192.png',
      badge = '/icon-192.png',
      tag,
      targetTab = 'social',
      category = 'system',
      priority = 'P1',
      workspace = 'both',
      targetUserId,
      targetEmail,
      targetSubscription,
      data = {},
    } = req.body || {};

    const authUser = req.authUser!;
    const sb = getSupabaseService();
    const ownedIds = await getUserOwnedEntityIds(sb, authUser);

    if (!authUser.isAdmin) {
      const requestedTarget = targetUserId || targetEmail;
      if (requestedTarget) {
        const isSelfTarget =
          hasAnyOwnershipMatch(authUser, ownedIds, [String(requestedTarget)]) ||
          (authUser.email && String(requestedTarget).toLowerCase() === authUser.email);
        if (!isSelfTarget) {
          return res.status(403).json({
            error: 'Forbidden: Only administrators can dispatch push notifications to other users.',
          });
        }
      } else if (!targetSubscription) {
        return res.status(403).json({
          error: 'Forbidden: Global broadcast push notifications require administrator privileges.',
        });
      }
    }

    const allSubs = await loadPushSubscriptionsAsync();

    if (
      targetSubscription &&
      targetSubscription.endpoint &&
      !allSubs.some((s) => s.subscription?.endpoint === targetSubscription.endpoint)
    ) {
      const now = new Date().toISOString();
      const adhocEntry: StoredPushSubscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: authUser.id,
        userEmail: authUser.email,
        subscription: targetSubscription,
        created_at: now,
        last_used_at: now,
      };
      allSubs.push(adhocEntry);
      writePushSubscriptions(allSubs);
      syncPushSubscriptionToSupabase(adhocEntry).catch(() => {});
    }

    let targetSubs = allSubs;
    if (targetSubscription?.endpoint) {
      const directMatches = allSubs.filter(
        (s) => s.subscription?.endpoint === targetSubscription.endpoint
      );
      if (directMatches.length > 0) targetSubs = directMatches;
    } else if (targetUserId || targetEmail) {
      const matches = allSubs.filter(
        (s) =>
          (targetUserId && (s.userId === targetUserId || s.userEmail === targetUserId)) ||
          (targetEmail && s.userEmail?.toLowerCase() === String(targetEmail).toLowerCase())
      );
      if (matches.length > 0) {
        targetSubs = matches;
      } else if (!authUser.isAdmin) {
        targetSubs = [];
      }
    }

    const payload = JSON.stringify({
      title: String(title).slice(0, 140),
      body: String(body).slice(0, 500),
      icon,
      badge,
      tag: tag || `nexus-push-${Date.now()}`,
      targetTab,
      category,
      priority,
      workspace,
      data: {
        ...data,
        targetTab,
        category,
        priority,
        workspace,
        url: '/',
      },
      timestamp: Date.now(),
    });

    const expiredEndpoints = new Set<string>();
    const results = await Promise.allSettled(
      targetSubs.map(async (entry) => {
        try {
          if (entry.subscription?.endpoint?.startsWith('native://')) {
            return { id: entry.id, status: 'delivered_native_bridge' };
          }
          await webpush.sendNotification(entry.subscription, payload);
          return { id: entry.id, status: 'delivered' };
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredEndpoints.add(entry.subscription.endpoint);
            deletePushSubscriptionFromSupabase(entry.subscription.endpoint).catch(() => {});
          }
          throw err;
        }
      })
    );

    if (expiredEndpoints.size > 0) {
      const cleaned = allSubs.filter((s) => !expiredEndpoints.has(s.subscription.endpoint));
      writePushSubscriptions(cleaned);
    }

    const deliveredCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    const supabase = getSupabaseService();
    if (supabase && (targetUserId || targetEmail)) {
      try {
        await supabase.from('nexus_notifications').insert({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: targetUserId || targetEmail,
          type: category,
          title: String(title).slice(0, 140),
          message: String(body).slice(0, 500),
          data: { targetTab, category, priority, workspace, ...data },
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr: any) {
        console.warn('[WEB PUSH SUPABASE SYNC NOTICE]', dbErr?.message || dbErr);
      }
    }

    res.json({
      success: true,
      delivered: deliveredCount,
      failed: failedCount,
      expiredCleaned: expiredEndpoints.size,
      totalActiveSubscriptions: allSubs.length - expiredEndpoints.size,
    });
  } catch (err: any) {
    console.error('[WEB PUSH SEND ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch Web Push notification' });
  }
});

// API ROUTE: Manually trigger 24h VAPID push reminder dispatch for show RSVPs
pushRouter.post('/api/push/trigger-show-reminders', requireAdmin, async (_req, res) => {
  try {
    const result = await checkAndSend24hShowReminders();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[TRIGGER SHOW REMINDERS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to trigger show reminders' });
  }
});
