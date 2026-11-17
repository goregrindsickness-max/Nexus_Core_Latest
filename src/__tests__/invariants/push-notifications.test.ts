import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  mockSupabaseClient,
  seedSupabaseTable,
  getSupabaseTableRows,
  setMockAuthSession,
} from '@/src/__tests__/mocks';

// Shared in-memory test state & hoisted mocks
const {
  fcmMocks,
  webpushMocks,
  localPushSubsRef,
  localShowRsvpsRef,
  vapidState,
} = vi.hoisted(() => ({
  fcmMocks: {
    apps: [] as any[],
    initializeApp: vi.fn(),
    applicationDefault: vi.fn(() => ({ type: 'mock-adc-credential' })),
    send: vi.fn(),
  },
  webpushMocks: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
    generateVAPIDKeys: vi.fn(() => ({
      publicKey: 'BMockVapidPublicKey1234567890',
      privateKey: 'MockVapidPrivateKey1234567890',
    })),
  },
  localPushSubsRef: { current: [] as any[] },
  localShowRsvpsRef: { current: [] as any[] },
  vapidState: {
    publicKey: 'BMockVapidPublicKey1234567890',
    privateKey: 'MockVapidPrivateKey1234567890',
  },
}));

vi.mock('firebase-admin/app', () => ({
  getApps: () => fcmMocks.apps,
  initializeApp: fcmMocks.initializeApp,
  applicationDefault: fcmMocks.applicationDefault,
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: () => ({
    send: fcmMocks.send,
  }),
}));

vi.mock('web-push', () => ({
  default: webpushMocks,
  ...webpushMocks,
}));

vi.mock('@/server/lib/supabaseAdmin', () => ({
  ADMIN_EMAILS: new Set(['admin@nexus.com', 'admin@nexuscore.fm']),
  getAuthClient: vi.fn(() => mockSupabaseClient),
  getSupabaseService: vi.fn(() => mockSupabaseClient),
  getVaultSecret: vi.fn(async () => null),
  getUserOwnedEntityIds: vi.fn(async () => new Set<string>()),
  assertBandOrEntityOwner: vi.fn(async () => true),
  hasAnyOwnershipMatch: vi.fn(() => true),
  stripEntityPrefix: vi.fn((id: string) => id),
}));

vi.mock('@/server/lib/clients', () => ({
  getVapidKeys: vi.fn(() => vapidState),
  initVapidKeys: vi.fn(async () => vapidState),
  readPushSubscriptions: vi.fn(() => localPushSubsRef.current),
  writePushSubscriptions: vi.fn((subs: any[]) => {
    localPushSubsRef.current = subs;
  }),
  loadPushSubscriptionsAsync: vi.fn(async () => localPushSubsRef.current),
  deletePushSubscriptionFromSupabase: vi.fn(async () => {}),
  readShowRsvps: vi.fn(() => localShowRsvpsRef.current),
  writeShowRsvps: vi.fn((rsvps: any[]) => {
    localShowRsvpsRef.current = rsvps;
  }),
  syncRsvpToSupabase: vi.fn(async () => {}),
  checkAndSend24hShowReminders: vi.fn(async () => ({ checked: 0, remindersSent: 0 })),
  getStripeAsync: vi.fn(async () => null),
  getGemini: vi.fn(async () => null),
  enrichVenueWithBlackBook: vi.fn(async () => {}),
  uploadsDir: '/tmp/nexus-test-uploads',
}));

import {
  initFirebaseAdmin,
  dispatchPushToUsers,
  resetPushDispatcherRuntimeState,
} from '@/server/lib/pushDispatcher';
import { pushRouter } from '@/server/routes/push';
import { socialRouter } from '@/server/routes/social';
import { showsRouter } from '@/server/routes/shows';

describe('Invariant 6: Server-Triggered Background Push Notifications (FCM ADC + VAPID)', () => {
  const app = express();
  app.use(express.json());
  app.use(pushRouter);
  app.use(socialRouter);
  app.use(showsRouter);

  const SENDER_ID = '11111111-1111-4000-8000-111111111111';
  const RECIPIENT_ID = '22222222-2222-4000-8000-222222222222';
  const ENV_KEYS = [
    'GOOGLE_APPLICATION_CREDENTIALS',
    'K_SERVICE',
    'CLOUD_RUN_JOB',
    'FUNCTION_TARGET',
    'GAE_ENV',
    'FIREBASE_CONFIG',
    'FCM_ENABLED',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
  ] as const;

  let savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv = {};
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    process.env.VAPID_PUBLIC_KEY = 'BMockEnvVapidPublicKey';
    process.env.VAPID_PRIVATE_KEY = 'MockEnvVapidPrivateKey';

    fcmMocks.apps.length = 0;
    fcmMocks.initializeApp.mockImplementation((cfg: any) => {
      const mockApp = { name: '[DEFAULT]', options: cfg };
      fcmMocks.apps.push(mockApp);
      return mockApp;
    });
    fcmMocks.applicationDefault.mockReturnValue({ type: 'mock-adc-credential' });
    fcmMocks.send.mockResolvedValue('projects/nexus/messages/msg_123');
    webpushMocks.sendNotification.mockResolvedValue({ statusCode: 201 });

    localPushSubsRef.current = [];
    localShowRsvpsRef.current = [];
    resetPushDispatcherRuntimeState();

    setMockAuthSession({
      access_token: 'mock-user-jwt',
      refresh_token: 'mock-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: SENDER_ID,
        email: 'sender@nexuscore.app',
        role: 'authenticated',
        user_metadata: { full_name: 'Sender User', role: 'Band' },
      },
    });
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it('gracefully skips live FCM when running locally without ADC while still delivering Web Push and returning 200 OK', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    seedSupabaseTable('push_subscriptions', [
      {
        id: 'sub_android_1',
        user_id: SENDER_ID,
        platform: 'android',
        fcm_token: 'fcm_local_token_001',
        web_push_subscription: null,
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'sub_web_1',
        user_id: SENDER_ID,
        platform: 'web',
        fcm_token: null,
        web_push_subscription: {
          endpoint: 'https://push.example.com/sub/local-web-1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);

    expect(initFirebaseAdmin()).toBe(false);
    expect(fcmMocks.initializeApp).not.toHaveBeenCalled();

    const res = await request(app)
      .post('/api/push/send')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        targetUserId: SENDER_ID,
        title: 'Local Test Notice',
        body: 'Should deliver via Web Push and skip FCM gracefully.',
        category: 'system',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fcmSkipped).toBe(1);
    expect(res.body.fcmDelivered).toBe(0);
    expect(res.body.webPushDelivered).toBe(1);
    expect(res.body.delivered).toBe(1);
    expect(fcmMocks.send).not.toHaveBeenCalled();
    expect(webpushMocks.sendNotification).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('initializes Firebase Admin with Application Default Credentials on Cloud Run without key files', () => {
    process.env.K_SERVICE = 'nexus-core-api';
    process.env.GOOGLE_CLOUD_PROJECT = 'project-70bc9409-7c4e-4717-939';

    const initialized = initFirebaseAdmin();
    expect(initialized).toBe(true);
    expect(fcmMocks.applicationDefault).toHaveBeenCalledTimes(1);
    expect(fcmMocks.initializeApp).toHaveBeenCalledWith({
      credential: { type: 'mock-adc-credential' },
      projectId: 'project-70bc9409-7c4e-4717-939',
    });

    // Idempotent second call reuses the existing Firebase app
    expect(initFirebaseAdmin()).toBe(true);
    expect(fcmMocks.initializeApp).toHaveBeenCalledTimes(1);
  });

  it('registers, refreshes, and deactivates android/ios/web subscriptions in push_subscriptions', async () => {
    // 1. Register Android FCM token
    const regAndroid = await request(app)
      .post('/api/push/register')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        platform: 'android',
        fcm_token: 'fcm_android_abc',
      });

    expect(regAndroid.status).toBe(200);
    expect(regAndroid.body.success).toBe(true);
    expect(regAndroid.body.platform).toBe('android');

    // 2. Register Web Push subscription
    const regWeb = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        platform: 'web',
        subscription: {
          endpoint: 'https://push.example.com/sub/web-abc',
          keys: { p256dh: 'p256', auth: 'auth' },
        },
      });

    expect(regWeb.status).toBe(200);
    expect(regWeb.body.platform).toBe('web');

    // 3. Refresh existing token on login without creating duplicate rows
    const refreshRes = await request(app)
      .post('/api/push/refresh')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        platform: 'android',
        token: 'fcm_android_abc',
      });

    expect(refreshRes.status).toBe(200);

    let rows = getSupabaseTableRows('push_subscriptions');
    const androidRows = rows.filter((r) => r.fcm_token === 'fcm_android_abc');
    expect(androidRows).toHaveLength(1);
    expect(androidRows[0].is_active).toBe(true);
    expect(androidRows[0].user_id).toBe(SENDER_ID);

    // 4. Unsubscribe marks the row is_active = false
    const unsubRes = await request(app)
      .post('/api/push/unsubscribe')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({ fcm_token: 'fcm_android_abc' });

    expect(unsubRes.status).toBe(200);
    expect(unsubRes.body.deactivated).toBe(true);

    rows = getSupabaseTableRows('push_subscriptions');
    expect(rows.find((r) => r.fcm_token === 'fcm_android_abc')?.is_active).toBe(false);
  });

  it('automatically marks stale tokens inactive (is_active = false) when FCM returns NotRegistered or Web Push returns 410 Gone', async () => {
    process.env.K_SERVICE = 'nexus-core-api';

    seedSupabaseTable('push_subscriptions', [
      {
        id: 'stale_fcm_1',
        user_id: RECIPIENT_ID,
        platform: 'android',
        fcm_token: 'fcm_stale_token_999',
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'stale_web_1',
        user_id: RECIPIENT_ID,
        platform: 'web',
        web_push_subscription: {
          endpoint: 'https://push.example.com/sub/gone-410',
          keys: { p256dh: 'p', auth: 'a' },
        },
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);

    fcmMocks.send.mockRejectedValueOnce({
      code: 'messaging/registration-token-not-registered',
      message: 'Requested entity was not found (NotRegistered)',
    });
    webpushMocks.sendNotification.mockRejectedValueOnce({
      statusCode: 410,
      message: '410 Gone',
    });

    const result = await dispatchPushToUsers({
      userIds: [RECIPIENT_ID],
      title: 'Token Cleanup Check',
      body: 'Verifying automatic deactivation',
      data: {
        type: 'notice',
        targetId: 'cleanup_1',
        route: '/',
      },
    });

    expect(result.deactivatedCount).toBe(2);
    expect(result.deactivatedTokens).toContain('fcm_stale_token_999');
    expect(result.deactivatedTokens).toContain('https://push.example.com/sub/gone-410');

    const rows = getSupabaseTableRows('push_subscriptions');
    expect(rows.find((r) => r.id === 'stale_fcm_1')?.is_active).toBe(false);
    expect(rows.find((r) => r.id === 'stale_web_1')?.is_active).toBe(false);
  });

  it('dispatches high-priority FCM (nexus_alerts channel) + Web Push fallback on DM insert without requiring an open socket', async () => {
    process.env.K_SERVICE = 'nexus-core-api';

    seedSupabaseTable('profiles', [
      { id: SENDER_ID, email: 'sender@nexuscore.app', full_name: 'Miguel Medina' },
      { id: RECIPIENT_ID, email: 'recipient@nexuscore.app', full_name: 'Alex Rivera' },
    ]);
    seedSupabaseTable('push_subscriptions', [
      {
        id: 'rec_android_1',
        user_id: RECIPIENT_ID,
        platform: 'android',
        fcm_token: 'fcm_recipient_android',
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'rec_ios_1',
        user_id: RECIPIENT_ID,
        platform: 'ios',
        fcm_token: 'fcm_recipient_ios',
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'rec_web_1',
        user_id: RECIPIENT_ID,
        platform: 'web',
        web_push_subscription: {
          endpoint: 'https://push.example.com/sub/rec-web',
          keys: { p256dh: 'pk', auth: 'ak' },
        },
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const dmRes = await request(app)
      .post('/api/social/dm')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        recipientId: RECIPIENT_ID,
        message: 'Load-in moved up to 5:30 PM at Trees Dallas!',
      });

    expect(dmRes.status).toBe(200);
    expect(dmRes.body.success).toBe(true);
    expect(dmRes.body.pushResult.fcmDelivered).toBe(2);
    expect(dmRes.body.pushResult.webPushDelivered).toBe(1);
    expect(dmRes.body.pushResult.delivered).toBe(3);

    expect(getSupabaseTableRows('nexus_chats')).toHaveLength(1);
    expect(getSupabaseTableRows('nexus_notifications')).toHaveLength(1);

    const androidCall = fcmMocks.send.mock.calls.find(
      ([msg]) => msg.token === 'fcm_recipient_android'
    )?.[0];
    expect(androidCall).toBeDefined();
    expect(androidCall.android).toMatchObject({
      priority: 'high',
      notification: {
        channelId: 'nexus_alerts',
        sound: 'default',
      },
    });
    expect(androidCall.data).toMatchObject({
      type: 'dm',
      route: '/messages',
      senderId: SENDER_ID,
    });
    expect(typeof androidCall.data.targetId).toBe('string');

    const iosCall = fcmMocks.send.mock.calls.find(
      ([msg]) => msg.token === 'fcm_recipient_ios'
    )?.[0];
    expect(iosCall?.apns?.headers?.['apns-priority']).toBe('10');

    expect(webpushMocks.sendNotification).toHaveBeenCalledTimes(1);
    const webPayload = JSON.parse(webpushMocks.sendNotification.mock.calls[0][1]);
    expect(webPayload.data.type).toBe('dm');
    expect(webPayload.data.route).toBe('/messages');
  });

  it('dispatches server-triggered push notifications for show reminders, settlements, and ticket alerts', async () => {
    process.env.K_SERVICE = 'nexus-core-api';

    seedSupabaseTable('shows', [
      {
        id: 'show_dallas_1',
        show_name: 'Deeds of Flesh @ Trees',
        headliner: 'Deeds of Flesh',
        creator_id: SENDER_ID,
        promoter_id: RECIPIENT_ID,
      },
    ]);
    seedSupabaseTable('push_subscriptions', [
      {
        id: 'sender_fcm_1',
        user_id: SENDER_ID,
        platform: 'android',
        fcm_token: 'fcm_sender_android',
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'promoter_fcm_1',
        user_id: RECIPIENT_ID,
        platform: 'android',
        fcm_token: 'fcm_promoter_android',
        is_active: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);

    // 1. Show RSVP within 24h triggers 'show_reminder'
    const tomorrowIso = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();
    const rsvpRes = await request(app)
      .post('/api/shows/rsvp')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        show_id: 'show_dallas_1',
        show_title: 'Deeds of Flesh @ Trees',
        show_date: tomorrowIso,
        venue_name: 'Trees',
        city: 'Dallas',
      });

    expect(rsvpRes.status).toBe(200);
    expect(rsvpRes.body.pushResult.fcmDelivered).toBe(1);
    const rsvpFcm = fcmMocks.send.mock.calls[0][0];
    expect(rsvpFcm.android.priority).toBe('high');
    expect(rsvpFcm.android.notification.channelId).toBe('nexus_alerts');
    expect(rsvpFcm.data.type).toBe('show_reminder');
    expect(rsvpFcm.data.targetId).toBe('show_dallas_1');
    expect(rsvpFcm.data.route).toBe('/shows');

    fcmMocks.send.mockClear();

    // 2. Finalizing settlement notifies both show creator & promoter
    const settleRes = await request(app)
      .post('/api/shows/settlements')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        show_id: 'show_dallas_1',
        band_net_payout: 2450,
        gross_merch_sales: 1200,
      });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.pushResult.fcmDelivered).toBe(2);
    expect(fcmMocks.send.mock.calls[0][0].data.type).toBe('notice');
    expect(fcmMocks.send.mock.calls[0][0].data.route).toBe('/shows');

    fcmMocks.send.mockClear();

    // 3. Ticket velocity alert notifies show stakeholders with /sales route
    const ticketRes = await request(app)
      .post('/api/shows/ticket-alert')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({
        showId: 'show_dallas_1',
        percentage: 92,
        quantity: 2,
        gateRevenue: 70,
      });

    expect(ticketRes.status).toBe(200);
    expect(ticketRes.body.pushResult.fcmDelivered).toBe(2);
    const tktFcm = fcmMocks.send.mock.calls[0][0];
    expect(tktFcm.android.priority).toBe('high');
    expect(tktFcm.android.notification.channelId).toBe('nexus_alerts');
    expect(tktFcm.data.type).toBe('notice');
    expect(tktFcm.data.route).toBe('/sales');
    expect(tktFcm.data.targetId).toBe('show_dallas_1');
  });
});
