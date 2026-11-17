import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getMessaging, TokenMessage } from 'firebase-admin/messaging';
import webpush from 'web-push';
import { getSupabaseService } from './supabaseAdmin';
import {
  getVapidKeys,
  initVapidKeys,
  readPushSubscriptions,
  writePushSubscriptions,
  deletePushSubscriptionFromSupabase,
  StoredPushSubscription,
} from './clients';

export type PushPlatform = 'android' | 'ios' | 'web';
export type PushAlertType = 'dm' | 'show_reminder' | 'notice';

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  platform: PushPlatform;
  fcm_token?: string | null;
  web_push_subscription?: webpush.PushSubscription | null;
  is_active: boolean;
  updated_at: string;
  created_at?: string;
}

export interface PushStructuredData {
  type: PushAlertType;
  targetId: string;
  route: string;
  targetTab?: string;
  category?: string;
  priority?: string;
  workspace?: string;
  senderId?: string;
  senderName?: string;
  [key: string]: any;
}

export interface DispatchPushOptions {
  userIds?: string[];
  userEmails?: string[];
  excludeUserId?: string;
  excludeUserEmail?: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: PushStructuredData;
  directSubscriptions?: webpush.PushSubscription[];
  broadcastAll?: boolean;
}

export interface DispatchPushResult {
  success: boolean;
  delivered: number;
  failed: number;
  fcmDelivered: number;
  fcmSkipped: number;
  webPushDelivered: number;
  deactivatedCount: number;
  deactivatedTokens: string[];
  warning?: string;
}

const ANDROID_ALERT_CHANNEL_ID = 'nexus_alerts';

let fcmCredentialWarningLogged = false;
let fcmUnavailableForRuntime = false;

export function resetPushDispatcherRuntimeState(): void {
  fcmCredentialWarningLogged = false;
  fcmUnavailableForRuntime = false;
}

/**
 * Checks whether Google Cloud Application Default Credentials (ADC) or a Cloud Run
 * runtime service account environment is available for live FCM calls.
 */
export function hasGoogleAdcEnvironment(): boolean {
  if (fcmUnavailableForRuntime) return false;
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE ||
      process.env.CLOUD_RUN_JOB ||
      process.env.FUNCTION_TARGET ||
      process.env.GAE_ENV ||
      process.env.FIREBASE_CONFIG ||
      process.env.FCM_ENABLED === 'true'
  );
}

/**
 * Initializes Firebase Admin SDK using Application Default Credentials (`applicationDefault()`)
 * so Cloud Run authenticates seamlessly via the attached compute service account.
 * Safely skips initialization when running locally without Google Cloud credentials.
 */
export function initFirebaseAdmin(): boolean {
  try {
    if (getApps().length > 0) {
      return !fcmUnavailableForRuntime;
    }

    if (!hasGoogleAdcEnvironment()) {
      if (!fcmCredentialWarningLogged) {
        console.warn(
          '[FCM] Application Default Credentials not detected (local/non-GCP runtime). Skipping live FCM initialization; Web Push (VAPID) remains active.'
        );
        fcmCredentialWarningLogged = true;
      }
      return false;
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      undefined;

    initializeApp({
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });

    console.log('[FCM] Firebase Admin SDK initialized with Application Default Credentials.');
    return true;
  } catch (err: any) {
    fcmUnavailableForRuntime = true;
    if (!fcmCredentialWarningLogged) {
      console.warn(
        '[FCM] Firebase Admin ADC initialization failed gracefully; skipping live FCM calls:',
        err?.message || err
      );
      fcmCredentialWarningLogged = true;
    }
    return false;
  }
}

export function isFcmReady(): boolean {
  return initFirebaseAdmin();
}

async function ensureVapidConfigured(): Promise<boolean> {
  try {
    const envPublic = process.env.VAPID_PUBLIC_KEY;
    const envPrivate = process.env.VAPID_PRIVATE_KEY;
    if (envPublic && envPrivate) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:dispatch@thenexuscoreapp.com',
        envPublic,
        envPrivate
      );
      return true;
    }
    const keys =
      (typeof getVapidKeys === 'function' ? getVapidKeys() : null) ||
      (typeof initVapidKeys === 'function' ? await initVapidKeys() : null);
    return Boolean(keys?.publicKey && keys?.privateKey);
  } catch (err: any) {
    console.warn('[WEB PUSH] VAPID configuration warning:', err?.message || err);
    return false;
  }
}

export function normalizePlatform(rawPlatform: any, hasWebSub: boolean): PushPlatform {
  const p = String(rawPlatform || '').trim().toLowerCase();
  if (p === 'android' || p === 'ios' || p === 'web') return p;
  return hasWebSub ? 'web' : 'android';
}

function isUnregisteredFcmError(err: any): boolean {
  const code = String(err?.code || err?.errorInfo?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    code.includes('notregistered') ||
    msg.includes('notregistered') ||
    msg.includes('requested entity was not found') ||
    msg.includes('registration-token-not-registered') ||
    msg.includes('invalid-registration-token') ||
    err?.statusCode === 404 ||
    err?.statusCode === 410
  );
}

function isMissingAdcError(err: any): boolean {
  const code = String(err?.code || err?.errorInfo?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  return (
    code === 'app/invalid-credential' ||
    msg.includes('could not load the default credentials') ||
    msg.includes('default credentials') ||
    msg.includes('metadata.google.internal') ||
    msg.includes('enotfound') ||
    msg.includes('ehostunreach') ||
    msg.includes('econnrefused') ||
    msg.includes('credential')
  );
}

function isStaleWebPushError(err: any): boolean {
  const status = Number(err?.statusCode);
  const msg = String(err?.message || err?.body || '').toLowerCase();
  return (
    status === 410 ||
    status === 404 ||
    msg.includes('410 gone') ||
    msg.includes('unsubscribed') ||
    msg.includes('expired')
  );
}

function stringifyFcmData(data: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

function routeToTargetTab(route?: string): string {
  const clean = String(route || '').toLowerCase();
  if (clean.includes('message') || clean.includes('dm') || clean.includes('chat')) return 'messages';
  if (clean.includes('show') || clean.includes('event')) return 'shows';
  if (clean.includes('sale') || clean.includes('ticket')) return 'sales';
  return 'social';
}

export async function markPushSubscriptionInactive(params: {
  id?: string;
  fcmToken?: string | null;
  endpoint?: string | null;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const supabase = getSupabaseService();

  if (supabase) {
    try {
      if (params.id) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false, updated_at: nowIso })
          .eq('id', params.id);
      } else if (params.fcmToken) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false, updated_at: nowIso })
          .eq('fcm_token', params.fcmToken);
      } else if (params.endpoint) {
        const { data: webRows } = await supabase
          .from('push_subscriptions')
          .select('id, web_push_subscription')
          .eq('platform', 'web')
          .eq('is_active', true);

        if (Array.isArray(webRows)) {
          const matchingIds = webRows
            .filter((r: any) => r?.web_push_subscription?.endpoint === params.endpoint)
            .map((r: any) => r.id)
            .filter(Boolean);
          if (matchingIds.length > 0) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false, updated_at: nowIso })
              .in('id', matchingIds);
          }
        }
      }
    } catch (err: any) {
      console.warn('[PUSH REGISTRY] Failed to deactivate stale subscription in Supabase:', err?.message || err);
    }
  }

  if (params.endpoint) {
    try {
      const localSubs = readPushSubscriptions();
      const filtered = localSubs.filter((s) => s.subscription?.endpoint !== params.endpoint);
      if (filtered.length !== localSubs.length) {
        writePushSubscriptions(filtered);
      }
      await deletePushSubscriptionFromSupabase(params.endpoint);
    } catch (_) {}
  }
}

export async function registerPushSubscription(params: {
  userId: string;
  userEmail?: string;
  platform?: PushPlatform | string;
  fcmToken?: string | null;
  webPushSubscription?: webpush.PushSubscription | null;
  role?: string;
  userAgent?: string;
}): Promise<{ savedRow: PushSubscriptionRow | null; totalLocalSubscriptions: number }> {
  const nowIso = new Date().toISOString();
  const hasWebSub = Boolean(params.webPushSubscription?.endpoint);
  const platform = normalizePlatform(params.platform, hasWebSub);
  const cleanFcmToken = params.fcmToken ? String(params.fcmToken).trim() : null;
  const supabase = getSupabaseService();

  let savedRow: PushSubscriptionRow | null = null;

  if (supabase) {
    try {
      if ((platform === 'android' || platform === 'ios') && cleanFcmToken) {
        const { data: existingRows } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('fcm_token', cleanFcmToken)
          .limit(1);

        const existing = Array.isArray(existingRows) ? existingRows[0] : null;
        if (existing?.id) {
          const { data: updated } = await supabase
            .from('push_subscriptions')
            .update({
              user_id: params.userId,
              platform,
              fcm_token: cleanFcmToken,
              web_push_subscription: null,
              is_active: true,
              updated_at: nowIso,
            })
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          savedRow = (updated as PushSubscriptionRow) || {
            ...existing,
            user_id: params.userId,
            platform,
            fcm_token: cleanFcmToken,
            web_push_subscription: null,
            is_active: true,
            updated_at: nowIso,
          };
        } else {
          const { data: inserted } = await supabase
            .from('push_subscriptions')
            .insert({
              user_id: params.userId,
              platform,
              fcm_token: cleanFcmToken,
              web_push_subscription: null,
              is_active: true,
              updated_at: nowIso,
            })
            .select()
            .maybeSingle();
          savedRow = (inserted as PushSubscriptionRow) || {
            id: `fcm_${Date.now()}`,
            user_id: params.userId,
            platform,
            fcm_token: cleanFcmToken,
            web_push_subscription: null,
            is_active: true,
            updated_at: nowIso,
          };
        }
      } else if (platform === 'web' && params.webPushSubscription?.endpoint) {
        const endpoint = params.webPushSubscription.endpoint;
        const { data: existingWebRows } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('platform', 'web');

        const existing = Array.isArray(existingWebRows)
          ? existingWebRows.find((r: any) => r?.web_push_subscription?.endpoint === endpoint)
          : null;

        if (existing?.id) {
          const { data: updated } = await supabase
            .from('push_subscriptions')
            .update({
              user_id: params.userId,
              platform: 'web',
              fcm_token: null,
              web_push_subscription: params.webPushSubscription,
              is_active: true,
              updated_at: nowIso,
            })
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          savedRow = (updated as PushSubscriptionRow) || {
            ...existing,
            user_id: params.userId,
            platform: 'web',
            fcm_token: null,
            web_push_subscription: params.webPushSubscription,
            is_active: true,
            updated_at: nowIso,
          };
        } else {
          const { data: inserted } = await supabase
            .from('push_subscriptions')
            .insert({
              user_id: params.userId,
              platform: 'web',
              fcm_token: null,
              web_push_subscription: params.webPushSubscription,
              is_active: true,
              updated_at: nowIso,
            })
            .select()
            .maybeSingle();
          savedRow = (inserted as PushSubscriptionRow) || {
            id: `web_${Date.now()}`,
            user_id: params.userId,
            platform: 'web',
            fcm_token: null,
            web_push_subscription: params.webPushSubscription,
            is_active: true,
            updated_at: nowIso,
          };
        }
      }
    } catch (err: any) {
      console.warn('[PUSH REGISTRY] Supabase push_subscriptions upsert notice:', err?.message || err);
    }
  }

  let localSubs = readPushSubscriptions();
  if (platform === 'web' && params.webPushSubscription?.endpoint) {
    const endpoint = params.webPushSubscription.endpoint;
    const idx = localSubs.findIndex((s) => s.subscription?.endpoint === endpoint);
    const entry: StoredPushSubscription = {
      id: idx >= 0 ? localSubs[idx].id : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: params.userId,
      userEmail: params.userEmail,
      role: params.role,
      subscription: params.webPushSubscription,
      userAgent: params.userAgent,
      created_at: idx >= 0 ? localSubs[idx].created_at : nowIso,
      last_used_at: nowIso,
    };
    if (idx >= 0) localSubs[idx] = entry;
    else localSubs.push(entry);
    writePushSubscriptions(localSubs);
  }

  return { savedRow, totalLocalSubscriptions: localSubs.length };
}

export async function getActivePushSubscriptionsForUser(
  userId: string,
  isAdmin = false
): Promise<PushSubscriptionRow[]> {
  const supabase = getSupabaseService();
  if (!supabase) return [];

  try {
    let q = supabase.from('push_subscriptions').select('*').eq('is_active', true);
    if (!isAdmin) {
      q = q.eq('user_id', userId);
    }
    const { data, error } = await q;
    if (!error && Array.isArray(data)) {
      return data as PushSubscriptionRow[];
    }
  } catch (err: any) {
    console.warn('[PUSH REGISTRY] Failed to query active subscriptions:', err?.message || err);
  }
  return [];
}

async function resolveTargetUserIds(
  options: DispatchPushOptions
): Promise<string[]> {
  const candidateIds = new Set<string>();
  const emailsToResolve = new Set<string>();

  for (const id of options.userIds || []) {
    if (!id) continue;
    const trimmed = String(id).trim();
    if (!trimmed) continue;
    if (trimmed.includes('@')) {
      emailsToResolve.add(trimmed.toLowerCase());
    } else {
      candidateIds.add(trimmed);
    }
  }

  for (const email of options.userEmails || []) {
    if (!email) continue;
    const trimmed = String(email).trim().toLowerCase();
    if (trimmed) emailsToResolve.add(trimmed);
  }

  const supabase = getSupabaseService();
  if (supabase && emailsToResolve.size > 0) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', Array.from(emailsToResolve));

      if (Array.isArray(profiles)) {
        for (const prof of profiles) {
          if (prof?.id) candidateIds.add(String(prof.id));
        }
      }
    } catch (_) {}
  }

  if (options.excludeUserId) {
    candidateIds.delete(String(options.excludeUserId).trim());
  }

  return Array.from(candidateIds);
}

/**
 * Unified server-side push dispatcher.
 * Queries active tokens from Supabase `push_subscriptions` and delivers:
 *  - High-priority FCM notifications (Android channel `nexus_alerts`, iOS APNs)
 *  - Web Push (VAPID) fallback for `platform === 'web'`
 * Automatically marks stale/unregistered tokens inactive (`is_active = false`).
 */
export async function dispatchPushToUsers(
  options: DispatchPushOptions
): Promise<DispatchPushResult> {
  await ensureVapidConfigured();

  const targetUserIds = await resolveTargetUserIds(options);
  const supabase = getSupabaseService();

  const activeRows: PushSubscriptionRow[] = [];
  if (supabase && (options.broadcastAll || targetUserIds.length > 0)) {
    try {
      let query = supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (!options.broadcastAll && targetUserIds.length > 0) {
        query = query.in('user_id', targetUserIds);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        for (const row of data as PushSubscriptionRow[]) {
          if (options.excludeUserId && row.user_id === options.excludeUserId) continue;
          activeRows.push(row);
        }
      }
    } catch (err: any) {
      console.warn('[PUSH DISPATCHER] Supabase push_subscriptions query notice:', err?.message || err);
    }
  }

  const seenEndpoints = new Set<string>();
  const seenFcmTokens = new Set<string>();
  const dedupedRows: PushSubscriptionRow[] = [];

  for (const row of activeRows) {
    if ((row.platform === 'android' || row.platform === 'ios') && row.fcm_token) {
      if (seenFcmTokens.has(row.fcm_token)) continue;
      seenFcmTokens.add(row.fcm_token);
      dedupedRows.push(row);
    } else if (row.platform === 'web' && row.web_push_subscription?.endpoint) {
      if (seenEndpoints.has(row.web_push_subscription.endpoint)) continue;
      seenEndpoints.add(row.web_push_subscription.endpoint);
      dedupedRows.push(row);
    }
  }

  if (Array.isArray(options.directSubscriptions)) {
    for (const sub of options.directSubscriptions) {
      if (sub?.endpoint && !seenEndpoints.has(sub.endpoint)) {
        seenEndpoints.add(sub.endpoint);
        dedupedRows.push({
          id: `direct_${Date.now()}`,
          user_id: targetUserIds[0] || '',
          platform: 'web',
          web_push_subscription: sub,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  const normalizedTargetEmails = new Set(
    (options.userEmails || []).map((e) => String(e).trim().toLowerCase())
  );
  const localWebSubs = readPushSubscriptions();
  for (const entry of localWebSubs) {
    const endpoint = entry?.subscription?.endpoint;
    if (!endpoint || endpoint.startsWith('native://') || seenEndpoints.has(endpoint)) continue;
    if (options.excludeUserId && entry.userId === options.excludeUserId) continue;
    if (
      options.excludeUserEmail &&
      entry.userEmail?.toLowerCase() === options.excludeUserEmail.toLowerCase()
    ) {
      continue;
    }

    const matchesTarget =
      options.broadcastAll ||
      (entry.userId && targetUserIds.includes(entry.userId)) ||
      (entry.userEmail && normalizedTargetEmails.has(entry.userEmail.toLowerCase()));

    if (matchesTarget) {
      seenEndpoints.add(endpoint);
      dedupedRows.push({
        id: entry.id,
        user_id: entry.userId || '',
        platform: 'web',
        web_push_subscription: entry.subscription,
        is_active: true,
        updated_at: entry.last_used_at || new Date().toISOString(),
      });
    }
  }

  let delivered = 0;
  let failed = 0;
  let fcmDelivered = 0;
  let fcmSkipped = 0;
  let webPushDelivered = 0;
  const deactivatedTokens: string[] = [];
  let warning: string | undefined;

  const cleanTitle = String(options.title || 'NEXUS CORE // DISPATCH').slice(0, 140);
  const cleanBody = String(options.body || '').slice(0, 500);
  const structuredData: PushStructuredData = {
    ...options.data,
    type: options.data.type || 'notice',
    targetId: String(options.data.targetId || ''),
    route: String(options.data.route || '/'),
    targetTab: options.data.targetTab || routeToTargetTab(options.data.route),
  };

  const webPushPayloadJson = JSON.stringify({
    title: cleanTitle,
    body: cleanBody,
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/icon-192.png',
    tag: options.tag || `nexus-push-${Date.now()}`,
    targetTab: structuredData.targetTab,
    category: structuredData.category || structuredData.type,
    priority: structuredData.priority || 'P1',
    workspace: structuredData.workspace || 'both',
    senderId: structuredData.senderId,
    senderName: structuredData.senderName,
    data: {
      ...structuredData,
      url: structuredData.route,
    },
    timestamp: Date.now(),
  });

  const fcmAvailable = initFirebaseAdmin();
  if (!fcmAvailable && dedupedRows.some((r) => r.platform === 'android' || r.platform === 'ios')) {
    warning = 'FCM credentials unavailable locally; native FCM dispatch skipped gracefully.';
  }

  await Promise.allSettled(
    dedupedRows.map(async (row) => {
      if ((row.platform === 'android' || row.platform === 'ios') && row.fcm_token) {
        if (!isFcmReady()) {
          fcmSkipped++;
          return;
        }

        const fcmMessage: TokenMessage = {
          token: row.fcm_token,
          notification: {
            title: cleanTitle,
            body: cleanBody,
          },
          data: stringifyFcmData(structuredData),
          android: {
            priority: 'high',
            notification: {
              channelId: ANDROID_ALERT_CHANNEL_ID,
              sound: 'default',
              ...(options.tag ? { tag: options.tag } : {}),
            },
          },
          ...(row.platform === 'ios'
            ? {
                apns: {
                  headers: { 'apns-priority': '10' },
                  payload: {
                    aps: {
                      sound: 'default',
                      badge: 1,
                    },
                  },
                },
              }
            : {}),
        };

        try {
          await getMessaging().send(fcmMessage);
          fcmDelivered++;
          delivered++;
        } catch (err: any) {
          if (isUnregisteredFcmError(err)) {
            await markPushSubscriptionInactive({
              id: row.id && !row.id.startsWith('fcm_') ? row.id : undefined,
              fcmToken: row.fcm_token,
            });
            deactivatedTokens.push(row.fcm_token);
            failed++;
          } else if (isMissingAdcError(err)) {
            fcmUnavailableForRuntime = true;
            if (!fcmCredentialWarningLogged) {
              console.warn(
                '[FCM] Live FCM send skipped due to missing ADC credentials:',
                err?.message || err
              );
              fcmCredentialWarningLogged = true;
            }
            warning = 'FCM credentials unavailable locally; native FCM dispatch skipped gracefully.';
            fcmSkipped++;
          } else {
            console.warn('[FCM] Send error for token:', err?.message || err);
            failed++;
          }
        }
        return;
      }

      if (row.platform === 'web' && row.web_push_subscription?.endpoint) {
        if (row.web_push_subscription.endpoint.startsWith('native://')) {
          return;
        }
        try {
          await webpush.sendNotification(row.web_push_subscription, webPushPayloadJson);
          webPushDelivered++;
          delivered++;
        } catch (err: any) {
          if (isStaleWebPushError(err)) {
            await markPushSubscriptionInactive({
              id: row.id && !row.id.startsWith('direct_') && !row.id.startsWith('sub_') ? row.id : undefined,
              endpoint: row.web_push_subscription.endpoint,
            });
            deactivatedTokens.push(row.web_push_subscription.endpoint);
          } else {
            console.warn('[WEB PUSH] Send error:', err?.message || err);
          }
          failed++;
        }
      }
    })
  );

  return {
    success: true,
    delivered,
    failed,
    fcmDelivered,
    fcmSkipped,
    webPushDelivered,
    deactivatedCount: deactivatedTokens.length,
    deactivatedTokens,
    ...(warning ? { warning } : {}),
  };
}
