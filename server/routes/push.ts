import express from 'express';
import {
  getSupabaseService,
  getUserOwnedEntityIds,
  hasAnyOwnershipMatch,
} from '../lib/supabaseAdmin';
import {
  getVapidKeys,
  initVapidKeys,
  loadPushSubscriptionsAsync,
  checkAndSend24hShowReminders,
} from '../lib/clients';
import {
  initFirebaseAdmin,
  isFcmReady,
  normalizePlatform,
  registerPushSubscription,
  markPushSubscriptionInactive,
  getActivePushSubscriptionsForUser,
  dispatchPushToUsers,
} from '../lib/pushDispatcher';
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

// API ROUTE: Get Push gateway status & active subscription count across FCM + Web Push
pushRouter.get('/api/push/status', requireAuth, async (req, res) => {
  initFirebaseAdmin();
  const keys = getVapidKeys() || (await initVapidKeys());
  const isAdmin = Boolean(req.authUser?.isAdmin);
  const authId = req.authUser!.id;
  const authEmail = req.authUser?.email?.toLowerCase();

  const dbRows = await getActivePushSubscriptionsForUser(authId, isAdmin);
  const legacySubs = await loadPushSubscriptionsAsync();
  const userLegacySubs = isAdmin
    ? legacySubs
    : legacySubs.filter(
        (s) =>
          s.userId === authId ||
          (authEmail && s.userEmail?.toLowerCase() === authEmail)
      );

  const webEndpoints = new Set<string>();
  const fcmTokens = new Set<string>();
  let androidCount = 0;
  let iosCount = 0;
  let webCount = 0;

  for (const row of dbRows) {
    if (row.platform === 'android' && row.fcm_token) {
      if (!fcmTokens.has(row.fcm_token)) {
        fcmTokens.add(row.fcm_token);
        androidCount++;
      }
    } else if (row.platform === 'ios' && row.fcm_token) {
      if (!fcmTokens.has(row.fcm_token)) {
        fcmTokens.add(row.fcm_token);
        iosCount++;
      }
    } else if (row.platform === 'web' && row.web_push_subscription?.endpoint) {
      if (!webEndpoints.has(row.web_push_subscription.endpoint)) {
        webEndpoints.add(row.web_push_subscription.endpoint);
        webCount++;
      }
    }
  }

  for (const leg of userLegacySubs) {
    const ep = leg?.subscription?.endpoint;
    if (ep && !ep.startsWith('native://') && !webEndpoints.has(ep)) {
      webEndpoints.add(ep);
      webCount++;
    }
  }

  res.json({
    configured: Boolean(keys.publicKey && keys.privateKey),
    fcmConfigured: isFcmReady(),
    publicKey: keys.publicKey,
    activeSubscriptions: androidCount + iosCount + webCount,
    platforms: {
      android: androidCount,
      ios: iosCount,
      web: webCount,
    },
  });
});

// Shared handler for device token & Web Push subscription registration / login refresh
async function handleRegisterOrRefreshPush(req: express.Request, res: express.Response) {
  try {
    const {
      subscription,
      web_push_subscription,
      token,
      fcm_token,
      fcmToken,
      platform: rawPlatform,
      role,
      userAgent,
    } = req.body || {};

    const resolvedWebSub = web_push_subscription || subscription || null;
    const resolvedFcmToken = fcm_token || fcmToken || token || null;
    const hasWebSub = Boolean(resolvedWebSub && resolvedWebSub.endpoint);
    const hasFcmToken = Boolean(
      resolvedFcmToken && typeof resolvedFcmToken === 'string' && resolvedFcmToken.trim().length > 0
    );

    if (!hasWebSub && !hasFcmToken) {
      return res.status(400).json({
        error: 'Invalid push registration payload: provide either a valid Web Push subscription (with endpoint) or a native FCM token.',
      });
    }

    const platform = normalizePlatform(rawPlatform, hasWebSub && !hasFcmToken);
    if ((platform === 'android' || platform === 'ios') && !hasFcmToken) {
      return res.status(400).json({
        error: `Missing fcm_token for platform '${platform}'.`,
      });
    }
    if (platform === 'web' && !hasWebSub) {
      return res.status(400).json({
        error: 'Invalid PushSubscription object (missing endpoint) for platform web.',
      });
    }

    const verifiedUserId = req.authUser!.id;
    const verifiedEmail = req.authUser!.email;

    const { savedRow, totalLocalSubscriptions } = await registerPushSubscription({
      userId: verifiedUserId,
      userEmail: verifiedEmail,
      platform,
      fcmToken: hasFcmToken ? String(resolvedFcmToken).trim() : null,
      webPushSubscription: hasWebSub ? resolvedWebSub : null,
      role,
      userAgent,
    });

    res.json({
      success: true,
      platform,
      isActive: true,
      subscription: savedRow,
      totalSubscriptions: totalLocalSubscriptions,
    });
  } catch (err: any) {
    console.error('[PUSH SUBSCRIBE ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to save push subscription' });
  }
}

// API ROUTE: Register or refresh a device token (Android/iOS FCM) or Web Push subscription
pushRouter.post('/api/push/subscribe', requireAuth, pushLimiter, express.json(), handleRegisterOrRefreshPush);
pushRouter.post('/api/push/register', requireAuth, pushLimiter, express.json(), handleRegisterOrRefreshPush);
pushRouter.post('/api/push/refresh', requireAuth, pushLimiter, express.json(), handleRegisterOrRefreshPush);

// API ROUTE: Deactivate a device token or browser Web Push endpoint
pushRouter.post('/api/push/unsubscribe', requireAuth, pushLimiter, express.json(), async (req, res) => {
  try {
    const { endpoint, token, fcm_token, fcmToken } = req.body || {};
    const cleanToken = fcm_token || fcmToken || token || null;

    if (!endpoint && !cleanToken) {
      return res.status(400).json({ error: 'Missing endpoint or fcm_token' });
    }

    const authUser = req.authUser!;
    const supabase = getSupabaseService();

    if (!authUser.isAdmin) {
      if (supabase && cleanToken) {
        const { data: rows } = await supabase
          .from('push_subscriptions')
          .select('id, user_id')
          .eq('fcm_token', String(cleanToken).trim());
        if (Array.isArray(rows) && rows.some((r: any) => r.user_id && r.user_id !== authUser.id)) {
          return res.status(403).json({
            error: 'Forbidden: Cannot unsubscribe another user device token.',
          });
        }
      }
      if (endpoint) {
        const subs = await loadPushSubscriptionsAsync();
        const target = subs.find((s) => s.subscription?.endpoint === endpoint);
        if (target && target.userId && target.userId !== authUser.id) {
          return res.status(403).json({
            error: 'Forbidden: Cannot unsubscribe another user endpoint.',
          });
        }
        if (supabase) {
          const { data: webRows } = await supabase
            .from('push_subscriptions')
            .select('id, user_id, web_push_subscription')
            .eq('platform', 'web');
          const ownerMatch = Array.isArray(webRows)
            ? webRows.find((r: any) => r?.web_push_subscription?.endpoint === endpoint)
            : null;
          if (ownerMatch && ownerMatch.user_id && ownerMatch.user_id !== authUser.id) {
            return res.status(403).json({
              error: 'Forbidden: Cannot unsubscribe another user endpoint.',
            });
          }
        }
      }
    }

    await markPushSubscriptionInactive({
      fcmToken: cleanToken ? String(cleanToken).trim() : null,
      endpoint: endpoint ? String(endpoint).trim() : null,
    });

    const remaining = await loadPushSubscriptionsAsync();
    res.json({
      success: true,
      deactivated: true,
      totalSubscriptions: remaining.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unsubscribe' });
  }
});

// API ROUTE: Dispatch Notification via FCM (Android/iOS) + VAPID Web Push + Persist to Supabase
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
      excludeUserId,
      excludeUserEmail,
      route,
      targetId,
      type,
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

    if (targetSubscription?.endpoint) {
      await registerPushSubscription({
        userId: authUser.id,
        userEmail: authUser.email,
        platform: 'web',
        webPushSubscription: targetSubscription,
      });
    }

    const alertType =
      type === 'dm' || type === 'show_reminder' || type === 'notice'
        ? type
        : category === 'direct_messages' || targetTab === 'messages'
          ? 'dm'
          : category === 'vip_guestlist_access'
            ? 'show_reminder'
            : 'notice';

    const resolvedRoute =
      route ||
      (alertType === 'dm' ? '/messages' : alertType === 'show_reminder' ? '/shows' : '/');

    const dispatchResult = await dispatchPushToUsers({
      userIds: targetUserId ? [String(targetUserId)] : [],
      userEmails: targetEmail ? [String(targetEmail)] : [],
      excludeUserId: excludeUserId ? String(excludeUserId) : undefined,
      excludeUserEmail: excludeUserEmail ? String(excludeUserEmail) : undefined,
      directSubscriptions: targetSubscription?.endpoint ? [targetSubscription] : undefined,
      broadcastAll: Boolean(authUser.isAdmin && !targetUserId && !targetEmail && !targetSubscription),
      title: String(title),
      body: String(body),
      icon,
      badge,
      tag,
      data: {
        ...data,
        type: alertType,
        targetId: String(targetId || data?.targetId || data?.postId || data?.showId || data?.senderId || ''),
        route: String(resolvedRoute),
        targetTab,
        category,
        priority,
        workspace,
      },
    });

    if (sb && (targetUserId || targetEmail)) {
      try {
        await sb.from('nexus_notifications').insert({
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
        console.warn('[PUSH SUPABASE SYNC NOTICE]', dbErr?.message || dbErr);
      }
    }

    const activeSubs = await getActivePushSubscriptionsForUser(authUser.id, authUser.isAdmin);
    const legacySubs = await loadPushSubscriptionsAsync();

    res.json({
      success: true,
      delivered: dispatchResult.delivered,
      failed: dispatchResult.failed,
      fcmDelivered: dispatchResult.fcmDelivered,
      fcmSkipped: dispatchResult.fcmSkipped,
      webPushDelivered: dispatchResult.webPushDelivered,
      expiredCleaned: dispatchResult.deactivatedCount,
      deactivatedCount: dispatchResult.deactivatedCount,
      totalActiveSubscriptions: Math.max(activeSubs.length, legacySubs.length),
      ...(dispatchResult.warning ? { warning: dispatchResult.warning } : {}),
    });
  } catch (err: any) {
    console.error('[PUSH SEND ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch Push notification' });
  }
});

// API ROUTE: Manually trigger 24h FCM + VAPID push reminder dispatch for show RSVPs
pushRouter.post('/api/push/trigger-show-reminders', requireAdmin, async (_req, res) => {
  try {
    const result = await checkAndSend24hShowReminders();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[TRIGGER SHOW REMINDERS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to trigger show reminders' });
  }
});
