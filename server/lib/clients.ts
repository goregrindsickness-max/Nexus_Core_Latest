import path from 'path';
import fs from 'fs';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { GoogleGenAI, Type } from '@google/genai';
import webpush from 'web-push';
import { getSupabaseService, getVaultSecret } from './supabaseAdmin';

export const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function atomicWriteJsonFile(targetPath: string, data: any): Promise<void> {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  const tmpPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
  const serialized = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(tmpPath, serialized, 'utf8');
  await fs.promises.rename(tmpPath, targetPath);
}

// ============================================================
// STRIPE, RESEND, AND GEMINI CLIENT SINGLETONS
// ============================================================
let stripeClient: Stripe | null = null;
let stripeLastKeyUsed: string | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('STRIPE_SECRET_KEY is not set. Payment routes will not work.');
    return null;
  }
  if (!stripeClient || stripeLastKeyUsed !== key) {
    stripeClient = new Stripe(key);
    stripeLastKeyUsed = key;
  }
  return stripeClient;
}

export async function getStripeAsync(): Promise<Stripe | null> {
  const key = (await getVaultSecret('stripe_secret_key')) || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('STRIPE_SECRET_KEY is not set in Vault or env. Payment routes will not work.');
    return null;
  }
  if (!stripeClient || stripeLastKeyUsed !== key) {
    stripeClient = new Stripe(key);
    stripeLastKeyUsed = key;
  }
  return stripeClient;
}

let resendClient: Resend | null = null;
export function getResend(): Resend | null {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn('RESEND_API_KEY is not set. Email notifications will be simulated.');
      return null;
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

// In-memory Email Dispatch Log Store for Developer Dashboard Diagnostics
export interface EmailLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  to: string;
  from: string;
  subject: string;
  status: 'SUCCESS' | 'SIMULATED' | 'FAILED';
  response: any;
}
export const emailLogs: EmailLogEntry[] = [];

export function recordEmailLog(
  endpoint: string,
  to: string,
  from: string,
  subject: string,
  status: 'SUCCESS' | 'SIMULATED' | 'FAILED',
  response: any
) {
  emailLogs.unshift({
    id: Math.random().toString(36).substring(2, 10).toUpperCase(),
    timestamp: new Date().toISOString(),
    endpoint,
    to,
    from,
    subject,
    status,
    response,
  });
  if (emailLogs.length > 50) emailLogs.pop();
}

export function getNexusEmailWrapper(
  bodyHtml: string,
  preheaderText = 'Official transmission from Nexus Core Music Ecosystem.',
  appUrl = 'https://thenexuscoreapp.com'
): string {
  const logoUrl = `${appUrl}/logo-email.png`;
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Nexus Core App</title>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #080a0f; color: #e4e4e7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${preheaderText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #080a0f; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 12px 50px 12px;">
        
        <!-- Main Container Card (600px max) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #10141d; border: 1px solid #1f2736; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);">
          
          <!-- Top Accent Gradient Bar (Cyan to Purple) -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #00ffcc 0%, #a855f7 50%, #00ffcc 100%); background-color: #00ffcc; font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td style="padding: 28px 32px 24px 32px; background-color: #0b0e14; border-bottom: 1px solid #1a2130;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <!-- Brand Emblem + Text -->
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right: 14px;">
                          <img src="${logoUrl}" alt="Nexus Core Logo" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 8px; border: 1px solid rgba(0, 255, 204, 0.3);" />
                        </td>
                        <td valign="middle">
                          <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 18px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase;">
                            NEXUS <span style="color: #00ffcc;">CORE</span>
                          </div>
                          <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; color: #71717a; text-transform: uppercase; margin-top: 3px;">
                            GLOBAL MUSIC OPERATING SYSTEM
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 8px; background-color: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 4px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 9px; font-weight: bold; color: #c084fc; letter-spacing: 1px; text-transform: uppercase;">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td style="padding: 36px 32px; color: #e4e4e7; font-size: 15px; line-height: 1.65;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- System Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #090b10; border-top: 1px solid #1a2130;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="font-family: 'SFMono-Regular', Consolas, monospace; font-size: 10px; color: #52525b; line-height: 1.6;">
                    <strong style="color: #71717a; text-transform: uppercase; letter-spacing: 1px;">NEXUS CORE NETWORK</strong><br />
                    Automated Dispatch // Do Not Reply Directly To System Mailer<br />
                    <a href="https://thenexuscoreapp.com" style="color: #00ffcc; text-decoration: none;">thenexuscoreapp.com</a>
                  </td>
                  <td align="right" valign="bottom" style="font-family: 'SFMono-Regular', Consolas, monospace; font-size: 9px; color: #3f3f46; text-transform: uppercase; letter-spacing: 1px;">
                    SYS_V4.2 // ENCRYPTED
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Main Container Card -->

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

let geminiClient: GoogleGenAI | null = null;
let geminiLastKeyUsed: string | null = null;

export async function getGemini(): Promise<GoogleGenAI | null> {
  const key = (await getVaultSecret('gemini_api_key')) || process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn('GEMINI_API_KEY is not set in Vault or env. AI capabilities will not work.');
    return null;
  }
  if (!geminiClient || geminiLastKeyUsed !== key) {
    geminiClient = new GoogleGenAI({ apiKey: key });
    geminiLastKeyUsed = key;
  }
  return geminiClient;
}

// ============================================================
// BLACK BOOK VENUE ENRICHMENT HELPER
// ============================================================
export async function enrichVenueWithBlackBook(venueId: string, venueName: string, city: string, state: string) {
  try {
    const ai = await getGemini();
    const sb = getSupabaseService();
    if (!ai || !sb) return;

    console.log(`[BLACK BOOK AUTO-GROUNDING] Starting background enrichment for ${venueName} (${city}, ${state})...`);
    const prompt = `Search for official venue specs, capacity, address, booking contact, and technical production info for the music venue "${venueName}" in ${city}, ${state}.
Return strict JSON with:
- capacity: integer (estimate if exact not listed, default 300)
- address: street address string
- booking_email: booking email or contact URL
- website: official website URL
- sound_specs: summary of PA / console / stage specs
- load_in_notes: load-in / parking details for touring bands
- talent_buyer: name or company of talent buyer/promoter`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            capacity: { type: Type.INTEGER },
            address: { type: Type.STRING },
            booking_email: { type: Type.STRING },
            website: { type: Type.STRING },
            sound_specs: { type: Type.STRING },
            load_in_notes: { type: Type.STRING },
            talent_buyer: { type: Type.STRING },
          },
        },
      },
    });

    if (response.text) {
      const enriched = JSON.parse(response.text);
      await sb.from('venues').update({
        capacity: enriched.capacity || 300,
        address: enriched.address || null,
        booking_email: enriched.booking_email || null,
        website: enriched.website || null,
        sound_specs: enriched.sound_specs || null,
        load_in_notes: enriched.load_in_notes || null,
        talent_buyer: enriched.talent_buyer || null,
        needs_enrichment: false,
        last_grounded_at: new Date().toISOString(),
      }).eq('id', venueId);
      console.log(`[BLACK BOOK AUTO-GROUNDING] Successfully enriched ${venueName}!`);
    }
  } catch (err) {
    console.warn(`[BLACK BOOK AUTO-GROUNDING] Failed to enrich ${venueName}:`, err);
  }
}

// ============================================================
// WEB PUSH (VAPID) & SHOW RSVP REMINDER ENGINE
// ============================================================
const VAPID_KEYS_FILE = path.join(process.cwd(), 'data', 'vapid_keys.json');
const PUSH_SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'push_subscriptions.json');

export interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface StoredPushSubscription {
  id: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  subscription: webpush.PushSubscription;
  userAgent?: string;
  created_at: string;
  last_used_at: string;
}

let vapidKeysSingleton: VapidKeyPair | null = null;

export async function initVapidKeys(): Promise<VapidKeyPair> {
  if (vapidKeysSingleton) return vapidKeysSingleton;
  try {
    const vaultPrivKey = await getVaultSecret('vapid_private_key');
    if (process.env.VAPID_PUBLIC_KEY && (vaultPrivKey || process.env.VAPID_PRIVATE_KEY)) {
      vapidKeysSingleton = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: vaultPrivKey || process.env.VAPID_PRIVATE_KEY!,
      };
    } else if (fs.existsSync(VAPID_KEYS_FILE)) {
      const raw = fs.readFileSync(VAPID_KEYS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.publicKey && parsed.privateKey) {
        vapidKeysSingleton = parsed;
      }
    }
  } catch (e) {
    console.warn('[WEB PUSH] Could not read existing VAPID keys, generating new pair:', e);
  }

  if (!vapidKeysSingleton) {
    const generated = webpush.generateVAPIDKeys();
    try {
      const dir = path.dirname(VAPID_KEYS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(generated, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[WEB PUSH] Could not persist VAPID keys to file:', e);
    }
    vapidKeysSingleton = generated;
  }

  try {
    webpush.setVapidDetails(
      'mailto:dispatch@thenexuscoreapp.com',
      vapidKeysSingleton.publicKey,
      vapidKeysSingleton.privateKey
    );
    console.log('[WEB PUSH] VAPID Web Push gateway initialized successfully.');
  } catch (err) {
    console.error('[WEB PUSH] Failed to configure VAPID details:', err);
  }

  return vapidKeysSingleton;
}

export function getVapidKeys(): VapidKeyPair | null {
  return vapidKeysSingleton;
}

export function readPushSubscriptions(): StoredPushSubscription[] {
  try {
    if (fs.existsSync(PUSH_SUBSCRIPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(PUSH_SUBSCRIPTIONS_FILE, 'utf-8')) || [];
    }
  } catch (e) {
    console.warn('[WEB PUSH] Could not read subscriptions file:', e);
  }
  return [];
}

export function writePushSubscriptions(subs: StoredPushSubscription[]) {
  try {
    const dir = path.dirname(PUSH_SUBSCRIPTIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PUSH_SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[WEB PUSH] Could not write subscriptions file:', e);
  }
}

export async function syncPushSubscriptionToSupabase(entry: StoredPushSubscription) {
  const supabase = getSupabaseService();
  if (!supabase) return;
  try {
    await supabase.from('nexus_notifications').upsert({
      id: `push_sub_${entry.id}`,
      user_id: entry.userId || entry.userEmail || 'anonymous',
      type: 'push_subscription',
      title: 'Web Push Subscription Endpoint',
      message: entry.subscription.endpoint,
      data: entry,
      read: true,
      created_at: entry.created_at,
    }, { onConflict: 'id' });
  } catch (err: any) {
    console.warn('[WEB PUSH SUPABASE SYNC NOTICE]', err?.message || err);
  }
}

export async function deletePushSubscriptionFromSupabase(endpoint: string) {
  const supabase = getSupabaseService();
  if (!supabase) return;
  try {
    await supabase
      .from('nexus_notifications')
      .delete()
      .eq('type', 'push_subscription')
      .eq('message', endpoint);
  } catch (_) {}
}

export async function loadPushSubscriptionsAsync(): Promise<StoredPushSubscription[]> {
  const localSubs = readPushSubscriptions();
  const map = new Map<string, StoredPushSubscription>();
  localSubs.forEach((s) => {
    if (s?.subscription?.endpoint) {
      map.set(s.subscription.endpoint, s);
    }
  });

  const supabase = getSupabaseService();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('nexus_notifications')
        .select('data')
        .eq('type', 'push_subscription');

      if (!error && Array.isArray(data)) {
        let addedFromCloud = false;
        data.forEach((row: any) => {
          const entry = row?.data as StoredPushSubscription;
          if (entry?.subscription?.endpoint && !map.has(entry.subscription.endpoint)) {
            map.set(entry.subscription.endpoint, entry);
            addedFromCloud = true;
          }
        });
        if (addedFromCloud) {
          writePushSubscriptions(Array.from(map.values()));
        }
      }
    } catch (_) {}
  }

  return Array.from(map.values());
}

const SHOW_RSVPS_FILE = path.join(process.cwd(), 'data', 'show_rsvps.json');

export interface ShowRsvp {
  id: string;
  show_id: string;
  user_id?: string;
  user_email?: string;
  show_title: string;
  show_date: string;
  venue_name?: string;
  city?: string;
  reminder_sent_24h?: boolean;
  created_at: string;
}

export function readShowRsvps(): ShowRsvp[] {
  try {
    if (fs.existsSync(SHOW_RSVPS_FILE)) {
      return JSON.parse(fs.readFileSync(SHOW_RSVPS_FILE, 'utf-8')) || [];
    }
  } catch (e) {
    console.warn('[SHOW RSVPS] Could not read file:', e);
  }
  return [];
}

export function writeShowRsvps(rsvps: ShowRsvp[]) {
  try {
    const dir = path.dirname(SHOW_RSVPS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SHOW_RSVPS_FILE, JSON.stringify(rsvps, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[SHOW RSVPS] Could not write file:', e);
  }
}

export async function syncRsvpToSupabase(rsvp: ShowRsvp) {
  const supabase = getSupabaseService();
  if (supabase) {
    try {
      await supabase.from('show_rsvps').upsert({
        id: rsvp.id,
        show_id: rsvp.show_id,
        user_id: rsvp.user_id || null,
        user_email: rsvp.user_email || null,
        show_title: rsvp.show_title,
        show_date: rsvp.show_date,
        venue_name: rsvp.venue_name || null,
        city: rsvp.city || null,
        reminder_sent_24h: rsvp.reminder_sent_24h || false,
        created_at: rsvp.created_at,
      }, { onConflict: 'id' });
    } catch (err: any) {
      console.warn('[SHOW RSVPS SUPABASE SYNC NOTICE]', err?.message || err);
    }
  }
}

export async function checkAndSend24hShowReminders() {
  console.log('[SHOW REMINDERS SERVICE] Executing 24h VAPID push reminder check for show RSVPs...');
  let rsvps = readShowRsvps();

  const supabase = getSupabaseService();
  if (supabase) {
    try {
      const { data: dbRsvps, error: dbErr } = await supabase.from('show_rsvps').select('*');
      if (!dbErr && Array.isArray(dbRsvps)) {
        const map = new Map(rsvps.map((r) => [r.id, r]));
        dbRsvps.forEach((item: any) => {
          const itemKey = item.id || `rsvp_${item.show_id}_${item.user_id || item.user_email || 'anon'}`;
          map.set(itemKey, {
            id: itemKey,
            show_id: String(item.show_id),
            user_id: item.user_id,
            user_email: item.user_email,
            show_title: item.show_title || item.title || 'Live Concert',
            show_date: item.show_date || item.date || new Date().toISOString().split('T')[0],
            venue_name: item.venue_name || item.venue,
            city: item.city,
            reminder_sent_24h: Boolean(item.reminder_sent_24h),
            created_at: item.created_at || new Date().toISOString(),
          });
        });
        rsvps = Array.from(map.values());
        writeShowRsvps(rsvps);
      }
    } catch (err: any) {
      console.warn('[SHOW REMINDERS SERVICE] Supabase query notice:', err?.message || err);
    }
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  let sentCount = 0;
  const allSubs = await loadPushSubscriptionsAsync();

  for (const rsvp of rsvps) {
    if (rsvp.reminder_sent_24h) continue;

    const rawDateStr = rsvp.show_date || '';
    const cleanDateStr = rawDateStr.split('T')[0];

    let is24hWindow = false;
    if (cleanDateStr === tomorrowStr || cleanDateStr === todayStr) {
      is24hWindow = true;
    } else {
      const showTimeMs = new Date(rawDateStr).getTime();
      if (!isNaN(showTimeMs)) {
        const hoursDiff = (showTimeMs - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff >= -2 && hoursDiff <= 32) {
          is24hWindow = true;
        }
      }
    }

    if (!is24hWindow) continue;

    let targetSubs = allSubs.filter((s) => {
      if (rsvp.user_id && (s.userId === rsvp.user_id || s.userEmail === rsvp.user_id)) return true;
      if (rsvp.user_email && s.userEmail?.toLowerCase() === rsvp.user_email.toLowerCase()) return true;
      return false;
    });

    if (targetSubs.length === 0 && allSubs.length > 0) {
      targetSubs = allSubs;
    }

    if (targetSubs.length === 0) {
      console.log(`[SHOW REMINDERS SERVICE] No active push subscriptions found for RSVP ${rsvp.id} ("${rsvp.show_title}")`);
      continue;
    }

    const payload = JSON.stringify({
      title: `🔥 Concert Tomorrow: ${rsvp.show_title}`,
      body: `Reminder: You have an RSVP for ${rsvp.show_title}${rsvp.venue_name ? ` at ${rsvp.venue_name}` : ''}${rsvp.city ? ` (${rsvp.city})` : ''} tomorrow! Your digital pass is ready in your pit list.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `nexus-rsvp-24h-${rsvp.show_id}`,
      targetTab: 'social',
      category: 'vip_guestlist_access',
      workspace: 'fan_only',
      data: {
        showId: rsvp.show_id,
        showTitle: rsvp.show_title,
        venueName: rsvp.venue_name,
        city: rsvp.city,
        type: '24h_show_reminder',
      },
      timestamp: Date.now(),
    });

    let pushDelivered = false;
    for (const subEntry of targetSubs) {
      try {
        if (subEntry.subscription?.endpoint?.startsWith('native://')) {
          pushDelivered = true;
          continue;
        }
        await webpush.sendNotification(subEntry.subscription, payload);
        pushDelivered = true;
      } catch (pushErr: any) {
        console.warn(`[SHOW REMINDERS SERVICE] Push delivery exception for ${subEntry.id}:`, pushErr?.message || pushErr);
      }
    }

    if (pushDelivered || targetSubs.length > 0) {
      rsvp.reminder_sent_24h = true;
      sentCount++;
      console.log(`[SHOW REMINDERS SERVICE SUCCESS] Sent 24h VAPID push notification to ${targetSubs.length} device(s) for "${rsvp.show_title}" (ID: ${rsvp.show_id})`);

      recordEmailLog(
        '/api/push/show-reminders-24h',
        rsvp.user_email || 'fan@nexuscore.app',
        'push-gateway@nexuscore.app',
        `24h Show Push Reminder: ${rsvp.show_title}`,
        'SUCCESS',
        { showId: rsvp.show_id, venue: rsvp.venue_name, devicesNotified: targetSubs.length }
      );

      if (supabase) {
        try {
          await supabase.from('show_rsvps').update({ reminder_sent_24h: true }).eq('show_id', rsvp.show_id);
        } catch (_) {}
      }
    }
  }

  writeShowRsvps(rsvps);
  return { checked: rsvps.length, remindersSent: sentCount, timestamp: new Date().toISOString() };
}
