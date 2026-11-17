import express from 'express';
import path from 'path';
import fs from 'fs';
import { Type } from '@google/genai';
import {
  getSupabaseService,
  getUserOwnedEntityIds,
  assertBandOrEntityOwner,
  hasAnyOwnershipMatch,
} from '../lib/supabaseAdmin';
import {
  getGemini,
  uploadsDir,
  enrichVenueWithBlackBook,
  readShowRsvps,
  writeShowRsvps,
  syncRsvpToSupabase,
  ShowRsvp,
  loadPushSubscriptionsAsync,
  writePushSubscriptions,
} from '../lib/clients';
import {
  registerPushSubscription,
  dispatchPushToUsers,
} from '../lib/pushDispatcher';
import {
  requireAuth,
} from '../middleware/auth';
import {
  aiLimiter,
  scrapeLimiter,
  apiMutationLimiter,
} from '../middleware/security';

export const showsRouter = express.Router();

// ============================================================
// BLACK BOOK VENUE CHECK-OR-STUB & FLYER PARSING
// ============================================================
showsRouter.post('/api/venues/check-or-stub', requireAuth, apiMutationLimiter, async (req, res) => {
  try {
    const { name, city, state } = req.body || {};
    if (!name || !city) {
      return res.status(400).json({ error: 'Venue name and city are required' });
    }

    const sb = getSupabaseService();
    if (!sb) {
      return res.status(503).json({ error: 'Supabase service unavailable' });
    }

    const { data: existing } = await sb
      .from('venues')
      .select('*')
      .ilike('name', name.trim())
      .ilike('city', city.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return res.json({ status: 'exists', venue: existing[0] });
    }

    const stubId = `v-stub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStub = {
      id: stubId,
      name: name.trim(),
      city: city.trim(),
      state: (state || '').trim(),
      capacity: 300,
      needs_enrichment: true,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await sb
      .from('venues')
      .insert(newStub)
      .select()
      .single();

    const targetVenue = inserted || newStub;
    if (insertErr) {
      console.warn('[BLACK BOOK STUB] Insert warning:', insertErr.message);
    }

    enrichVenueWithBlackBook(
      targetVenue.id,
      targetVenue.name,
      targetVenue.city,
      targetVenue.state || ''
    ).catch(() => {});

    return res.json({ status: 'stub_created_and_enriching', venue: targetVenue });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Check or stub failed' });
  }
});

showsRouter.post('/api/parse-flyer', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    const ai = await getGemini();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI is not configured on the server.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `Analyze this concert/tour flyer image carefully.
1. Determine if this is a "single_show" (one concert date at one venue) or a "tour_poster" (multiple dates/cities listed on a tour routing poster).
2. Extract all bands on the bill (headliner + support/opening bands).
3. Extract every date, city, state/country, venue name, doors/show time, cover price, and age restriction visible on the flyer.
   - Convert all dates to YYYY-MM-DD format if possible (use the year shown on the flyer, or assume ${new Date().getFullYear()} if no year is printed).
4. Enrich each extracted band with their likely genre and hometown/country based on your music knowledge, and enrich each venue with its estimated capacity and street address if known.

Return ONLY valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flyerType: {
              type: Type.STRING,
              description: "Either 'single_show' or 'tour_poster'",
            },
            tourOrEventTitle: {
              type: Type.STRING,
              description: 'Name of the tour, festival, or concert event',
            },
            headliner: {
              type: Type.STRING,
              description: 'Primary headlining band name',
            },
            supportBands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of all support/opening bands on the flyer',
            },
            bandsMetadata: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING, description: 'Headliner, Direct Support, Opener' },
                  genre: { type: Type.STRING },
                  originCity: { type: Type.STRING },
                },
                required: ['name'],
              },
            },
            dates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: 'YYYY-MM-DD format' },
                  rawDateText: {
                    type: Type.STRING,
                    description: "Original date text on flyer e.g. 'FRI OCT 14'",
                  },
                  city: { type: Type.STRING },
                  stateOrCountry: { type: Type.STRING },
                  venueName: { type: Type.STRING },
                  venueAddress: { type: Type.STRING },
                  estimatedVenueCapacity: { type: Type.INTEGER },
                  doorsTime: { type: Type.STRING, description: "e.g. '7:00 PM'" },
                  ticketPrice: { type: Type.STRING, description: "e.g. '$20 ADV / $25 DOS'" },
                  ageRestriction: { type: Type.STRING, description: "e.g. 'All Ages', '21+'" },
                  lineupOverride: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Specific bands playing this stop if different from main bill',
                  },
                },
                required: ['city', 'venueName'],
              },
            },
            promoterOrPresenter: { type: Type.STRING },
            ticketLinkOrInfo: { type: Type.STRING },
          },
          required: ['flyerType', 'headliner', 'supportBands', 'dates'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const sb = getSupabaseService();
    if (sb && Array.isArray(parsed.dates)) {
      for (const stop of parsed.dates) {
        if (stop.venueName && stop.city) {
          (async () => {
            try {
              const { data: existing } = await sb
                .from('venues')
                .select('id')
                .ilike('name', stop.venueName.trim())
                .ilike('city', stop.city.trim())
                .limit(1);

              if (!existing || existing.length === 0) {
                const stubId = `v-stub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                await sb.from('venues').insert({
                  id: stubId,
                  name: stop.venueName.trim(),
                  city: stop.city.trim(),
                  state: (stop.stateOrCountry || '').trim(),
                  capacity: stop.estimatedVenueCapacity || 300,
                  address: stop.venueAddress || null,
                  needs_enrichment: true,
                  created_at: new Date().toISOString(),
                });
                await enrichVenueWithBlackBook(
                  stubId,
                  stop.venueName.trim(),
                  stop.city.trim(),
                  (stop.stateOrCountry || '').trim()
                );
              }
            } catch (_) {}
          })();
        }
      }
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('[FLYER OCR PARSE ERROR]', err);
    return res
      .status(500)
      .json({ error: err.message || 'Failed to parse flyer with Gemini Vision' });
  }
});

// ============================================================
// SHOW RSVPS
// ============================================================
showsRouter.get('/api/shows/rsvps', requireAuth, (req, res) => {
  try {
    const authUser = req.authUser!;
    const { userId, userEmail, showId } = req.query;
    let rsvps = readShowRsvps();
    if (!authUser.isAdmin) {
      rsvps = rsvps.filter(
        (r) =>
          r.user_id === authUser.id ||
          (authUser.email && r.user_email?.toLowerCase() === authUser.email.toLowerCase())
      );
    } else {
      if (userId) {
        rsvps = rsvps.filter((r) => r.user_id === userId || r.user_email === userId);
      }
      if (userEmail) {
        rsvps = rsvps.filter(
          (r) => r.user_email?.toLowerCase() === String(userEmail).toLowerCase()
        );
      }
    }
    if (showId) {
      rsvps = rsvps.filter((r) => r.show_id === showId);
    }
    res.json({ success: true, count: rsvps.length, rsvps });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load RSVPs' });
  }
});

showsRouter.post(
  '/api/shows/rsvp',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req, res) => {
    try {
      const authUser = req.authUser!;
      const {
        show_id,
        show_title,
        show_date,
        venue_name,
        city,
        user_email,
        pushSubscription,
      } = req.body;
      if (!show_id || !show_title) {
        return res.status(400).json({ error: 'show_id and show_title are required' });
      }

      const verifiedUserId = authUser.id;
      const verifiedEmail =
        authUser.email ||
        (typeof user_email === 'string' ? user_email.trim().toLowerCase() : undefined);

      const rsvps = readShowRsvps();
      const rsvpKey = `rsvp_${show_id}_${verifiedUserId}`;
      const existingIdx = rsvps.findIndex(
        (r) =>
          r.id === rsvpKey ||
          (r.show_id === String(show_id) &&
            (r.user_id === verifiedUserId ||
              (verifiedEmail && r.user_email?.toLowerCase() === verifiedEmail)))
      );

      const rsvpRecord: ShowRsvp = {
        id: existingIdx >= 0 ? rsvps[existingIdx].id : rsvpKey,
        show_id: String(show_id),
        user_id: verifiedUserId,
        user_email:
          verifiedEmail || (existingIdx >= 0 ? rsvps[existingIdx].user_email : undefined),
        show_title: String(show_title),
        show_date: String(show_date || new Date().toISOString().split('T')[0]),
        venue_name: venue_name || (existingIdx >= 0 ? rsvps[existingIdx].venue_name : undefined),
        city: city || (existingIdx >= 0 ? rsvps[existingIdx].city : undefined),
        reminder_sent_24h: false,
        created_at:
          existingIdx >= 0 ? rsvps[existingIdx].created_at : new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        rsvps[existingIdx] = rsvpRecord;
      } else {
        rsvps.push(rsvpRecord);
      }

      writeShowRsvps(rsvps);

      const { fcmToken, token, platform: devicePlatform, sendReminderNow } = req.body || {};
      const resolvedToken = fcmToken || token;

      if (pushSubscription && pushSubscription.endpoint) {
        await registerPushSubscription({
          userId: verifiedUserId,
          userEmail: verifiedEmail,
          platform: 'web',
          webPushSubscription: pushSubscription,
        });
        const subs = await loadPushSubscriptionsAsync();
        const subEndpoint = pushSubscription.endpoint;
        const subIdx = subs.findIndex((s) => s.subscription?.endpoint === subEndpoint);
        const subEntry = {
          id:
            subIdx >= 0
              ? subs[subIdx].id
              : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          subscription: pushSubscription,
          userId: verifiedUserId,
          userEmail: verifiedEmail,
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        };
        if (subIdx >= 0) subs[subIdx] = subEntry;
        else subs.push(subEntry);
        writePushSubscriptions(subs);
      } else if (resolvedToken && typeof resolvedToken === 'string') {
        await registerPushSubscription({
          userId: verifiedUserId,
          userEmail: verifiedEmail,
          platform: devicePlatform || 'android',
          fcmToken: resolvedToken,
        });
      }

      // Check if show falls within immediate 24-32h window or explicit reminder request
      let pushResult = null;
      const now = new Date();
      const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];
      const cleanDateStr = String(rsvpRecord.show_date || '').split('T')[0];
      const showTimeMs = new Date(rsvpRecord.show_date || '').getTime();
      const hoursDiff = !isNaN(showTimeMs) ? (showTimeMs - now.getTime()) / (1000 * 60 * 60) : 999;
      const isImmediateWindow =
        Boolean(sendReminderNow) ||
        cleanDateStr === tomorrowStr ||
        cleanDateStr === todayStr ||
        (hoursDiff >= -2 && hoursDiff <= 32);

      if (isImmediateWindow) {
        pushResult = await dispatchPushToUsers({
          userIds: [verifiedUserId],
          userEmails: verifiedEmail ? [verifiedEmail] : undefined,
          title: `🔥 Concert Alert: ${rsvpRecord.show_title}`,
          body: `Reminder: ${rsvpRecord.show_title}${rsvpRecord.venue_name ? ` at ${rsvpRecord.venue_name}` : ''}${rsvpRecord.city ? ` (${rsvpRecord.city})` : ''} is coming up! Your digital pass is ready in your pit list.`,
          tag: `nexus-rsvp-24h-${rsvpRecord.show_id}`,
          data: {
            type: 'show_reminder',
            targetId: String(rsvpRecord.show_id),
            route: '/shows',
            targetTab: 'social',
            category: 'vip_guestlist_access',
            priority: 'P1',
            workspace: 'fan_only',
            showId: String(rsvpRecord.show_id),
            showTitle: rsvpRecord.show_title,
          },
        });
        if (pushResult.delivered + pushResult.fcmSkipped > 0) {
          rsvpRecord.reminder_sent_24h = true;
          const idx = rsvps.findIndex((r) => r.id === rsvpRecord.id);
          if (idx >= 0) rsvps[idx] = rsvpRecord;
          writeShowRsvps(rsvps);
        }
      }

      await syncRsvpToSupabase(rsvpRecord);

      console.log(
        `[SHOW RSVP SUCCESS] Registered RSVP for "${show_title}" (ID: ${show_id}, User: ${verifiedEmail || verifiedUserId})`
      );
      res.json({ success: true, rsvp: rsvpRecord, ...(pushResult ? { pushResult } : {}) });
    } catch (err: any) {
      console.error('[SHOW RSVP ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to register RSVP' });
    }
  }
);

// ============================================================
// SHOW SETTLEMENT FINALIZATION + SERVER-TRIGGERED PUSH ALERT
// ============================================================
showsRouter.post(
  '/api/shows/settlements',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const {
        show_id,
        showId,
        show_title,
        showTitle,
        band_id,
        bandId,
        gross_merch_sales = 0,
        venue_cut_apparel_pct = 0,
        venue_cut_media_pct = 0,
        show_guarantee = 0,
        variance_penalty_total = 0,
        net_venue_cut = 0,
        band_net_payout = 0,
        artist_signature = '',
        venue_signature = '',
        status = 'settled',
        finalize = true,
        recipientUserIds = [],
      } = req.body || {};

      const resolvedShowId = String(show_id || showId || '').trim();
      if (!resolvedShowId) {
        return res.status(400).json({ error: 'show_id is required' });
      }

      const resolvedBandId = band_id || bandId || null;
      if (resolvedBandId && !authUser.isAdmin) {
        const ownsBand = await assertBandOrEntityOwner(sb, authUser, String(resolvedBandId));
        if (!ownsBand) {
          return res.status(403).json({ error: 'Forbidden: Not authorized to settle this show.' });
        }
      }

      const nowIso = new Date().toISOString();
      const settlementPayload = {
        show_id: resolvedShowId,
        created_at: nowIso,
        gross_merch_sales: Number(gross_merch_sales) || 0,
        venue_cut_apparel_pct: Number(venue_cut_apparel_pct) || 0,
        venue_cut_media_pct: Number(venue_cut_media_pct) || 0,
        show_guarantee: Number(show_guarantee) || 0,
        variance_penalty_total: Number(variance_penalty_total) || 0,
        net_venue_cut: Number(net_venue_cut) || 0,
        band_net_payout: Number(band_net_payout) || 0,
        artist_signature: String(artist_signature || ''),
        venue_signature: String(venue_signature || ''),
        status: String(status || 'settled'),
      };

      const targetRecipientIds = new Set<string>(
        Array.isArray(recipientUserIds) ? recipientUserIds.map((id: any) => String(id).trim()).filter(Boolean) : []
      );
      let resolvedTitle = String(show_title || showTitle || '').trim();

      if (sb) {
        const { data: showRow } = await sb
          .from('shows')
          .select('id, show_name, headliner, creator_id, promoter_id, owner_id, band_id')
          .eq('id', resolvedShowId)
          .maybeSingle();

        if (showRow) {
          if (!resolvedTitle) {
            resolvedTitle = showRow.show_name || showRow.headliner || 'Live Show';
          }
          if (!authUser.isAdmin && !resolvedBandId) {
            const ownedIds = await getUserOwnedEntityIds(sb, authUser);
            const isShowParty = hasAnyOwnershipMatch(authUser, ownedIds, [
              showRow.creator_id,
              showRow.promoter_id,
              showRow.owner_id,
              showRow.band_id,
            ]);
            if (!isShowParty) {
              return res.status(403).json({ error: 'Forbidden: Not authorized to settle this show.' });
            }
          }
          if (showRow.creator_id) targetRecipientIds.add(String(showRow.creator_id));
          if (showRow.promoter_id) targetRecipientIds.add(String(showRow.promoter_id));
          if (showRow.owner_id) targetRecipientIds.add(String(showRow.owner_id));
        }

        await sb.from('show_settlements_v1').insert([settlementPayload]);

        if (finalize !== false) {
          await sb
            .from('shows')
            .update({ status: 'Closed', revenue: settlementPayload.band_net_payout })
            .eq('id', resolvedShowId);
        }
      }

      if (targetRecipientIds.size === 0) {
        targetRecipientIds.add(authUser.id);
      }

      const notifTitle = `💰 Settlement Locked${resolvedTitle ? `: ${resolvedTitle}` : ''}`;
      const notifBody = `Show settlement finalized. Net band payout: $${settlementPayload.band_net_payout.toFixed(2)}.`;

      if (sb) {
        for (const uid of targetRecipientIds) {
          try {
            await sb.from('nexus_notifications').insert([
              {
                id: `notif_settle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                user_id: uid,
                actor_id: authUser.id,
                type: 'settlement',
                title: notifTitle,
                message: notifBody,
                is_read: false,
                read: false,
                created_at: nowIso,
              },
            ]);
          } catch (_) {}
        }
      }

      const pushResult = await dispatchPushToUsers({
        userIds: Array.from(targetRecipientIds),
        title: notifTitle,
        body: notifBody,
        tag: `nexus-settlement-${resolvedShowId}`,
        data: {
          type: 'notice',
          targetId: resolvedShowId,
          route: '/shows',
          targetTab: 'shows',
          category: 'settlement',
          priority: 'P0',
          showId: resolvedShowId,
          payout: String(settlementPayload.band_net_payout),
        },
      });

      return res.json({
        success: true,
        settlement: settlementPayload,
        pushResult,
      });
    } catch (err: any) {
      console.error('[SHOW SETTLEMENT ERROR]', err);
      return res.status(500).json({ error: err.message || 'Failed to finalize show settlement' });
    }
  }
);

// ============================================================
// SHOW TICKET VELOCITY / SALE ALERT + SERVER-TRIGGERED PUSH
// ============================================================
showsRouter.post(
  '/api/shows/ticket-alert',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const authUser = req.authUser!;
      const sb = getSupabaseService();
      const {
        show_id,
        showId,
        show_title,
        showTitle,
        venue_name,
        venueName,
        city,
        percentage,
        quantity = 1,
        gateRevenue = 0,
        recipientUserId,
        recipientUserIds = [],
        buyerUserId,
        alertType = 'ticket_velocity',
      } = req.body || {};

      const resolvedShowId = String(show_id || showId || '').trim();
      let resolvedTitle = String(show_title || showTitle || '').trim();
      const resolvedVenue = String(venue_name || venueName || '').trim();

      if (!resolvedShowId && !resolvedTitle) {
        return res.status(400).json({ error: 'showId or showTitle is required' });
      }

      const targetIds = new Set<string>();
      if (recipientUserId) targetIds.add(String(recipientUserId).trim());
      if (Array.isArray(recipientUserIds)) {
        recipientUserIds.forEach((id: any) => {
          if (id) targetIds.add(String(id).trim());
        });
      }

      if (sb && resolvedShowId) {
        const { data: showRow } = await sb
          .from('shows')
          .select('id, show_name, headliner, creator_id, promoter_id, owner_id, band_id')
          .eq('id', resolvedShowId)
          .maybeSingle();

        if (showRow) {
          if (!resolvedTitle) resolvedTitle = showRow.show_name || showRow.headliner || 'Live Show';
          if (showRow.creator_id) targetIds.add(String(showRow.creator_id));
          if (showRow.promoter_id) targetIds.add(String(showRow.promoter_id));
          if (showRow.owner_id) targetIds.add(String(showRow.owner_id));
        }
      }

      if (buyerUserId && String(buyerUserId) === authUser.id) {
        targetIds.add(authUser.id);
      }

      if (targetIds.size === 0) {
        targetIds.add(authUser.id);
      }

      const cleanTitle = resolvedTitle || 'Live Show';
      const pctText = percentage !== undefined ? `${percentage}% sold` : `${quantity} pass(es) issued`;
      const notifTitle =
        alertType === 'ticket_confirmation'
          ? `🎟️ Pass Issued: ${cleanTitle}`
          : `💰 Ticket Alert: ${cleanTitle}`;
      const notifBody = `${pctText}${resolvedVenue ? ` at ${resolvedVenue}` : ''}${city ? ` (${city})` : ''}${Number(gateRevenue) > 0 ? ` — Gate revenue: $${Number(gateRevenue).toFixed(2)}` : ''}.`;

      if (sb) {
        const nowIso = new Date().toISOString();
        for (const uid of targetIds) {
          try {
            await sb.from('nexus_notifications').insert([
              {
                id: `notif_tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                user_id: uid,
                actor_id: authUser.id,
                type: String(alertType),
                title: notifTitle,
                message: notifBody,
                is_read: false,
                read: false,
                created_at: nowIso,
              },
            ]);
          } catch (_) {}
        }
      }

      const pushResult = await dispatchPushToUsers({
        userIds: Array.from(targetIds),
        title: notifTitle,
        body: notifBody,
        tag: `nexus-ticket-${resolvedShowId || 'sale'}`,
        data: {
          type: 'notice',
          targetId: resolvedShowId || cleanTitle,
          route: '/sales',
          targetTab: 'sales',
          category: 'ticket_velocity',
          priority: 'P0',
          showId: resolvedShowId,
          percentage: percentage !== undefined ? String(percentage) : '',
          quantity: String(quantity),
        },
      });

      return res.json({
        success: true,
        pushResult,
      });
    } catch (err: any) {
      console.error('[SHOW TICKET ALERT ERROR]', err);
      return res.status(500).json({ error: err.message || 'Failed to dispatch ticket alert' });
    }
  }
);

showsRouter.delete(
  '/api/shows/rsvp/:showId',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req, res) => {
    try {
      const authUser = req.authUser!;
      const { showId } = req.params;
      const { userId, userEmail } = req.body || {};
      const targetUserId = authUser.isAdmin && userId ? String(userId) : authUser.id;
      const targetEmail =
        authUser.isAdmin && userEmail ? String(userEmail).toLowerCase() : authUser.email;

      let rsvps = readShowRsvps();
      rsvps = rsvps.filter((r) => {
        if (r.show_id !== showId) return true;
        if (targetUserId && r.user_id === targetUserId) return false;
        if (targetEmail && r.user_email?.toLowerCase() === targetEmail) return false;
        if (authUser.isAdmin && !userId && !userEmail) return false;
        return true;
      });

      writeShowRsvps(rsvps);

      const supabase = getSupabaseService();
      if (supabase) {
        try {
          let q = supabase.from('show_rsvps').delete().eq('show_id', showId);
          if (targetUserId) q = q.eq('user_id', targetUserId);
          else if (targetEmail) q = q.eq('user_email', targetEmail);
          await q;
        } catch (_) {}
      }

      res.json({ success: true, showId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to cancel RSVP' });
    }
  }
);

// ============================================================
// VENUES PERSISTENCE & CROSS-DEVICE SYNC APIS
// ============================================================
const venuesCacheFile = path.join(uploadsDir, 'venues_cache.json');

const initialSeededVenues = [
  {
    id: 'v-seed-1',
    name: 'Saint Vitus Bar',
    city: 'Brooklyn',
    state: 'NY',
    address: '1120 Manhattan Ave',
    capacity: 250,
    contact: 'booking@saintvitusbar.com',
    soundSystem: 'D&B Audiotechnik V-Series, Midas M32 Console',
    stageDimensions: '18ft x 12ft x 2ft',
    greenRoom: 'Basement lounge behind stage, private restroom, mini-fridge',
    loadIn: 'Street level through front double doors on Manhattan Ave',
    genres: 'Metal, Doom, Hardcore, Experimental',
    notes: 'Iconic underground metal venue. Strict 11pm live music curfew on weeknights.',
    status: 'Verified',
  },
  {
    id: 'v-seed-2',
    name: 'The Regent Theater',
    city: 'Los Angeles',
    state: 'CA',
    address: '448 S Main St',
    capacity: 1100,
    contact: 'talent@regentdtla.com',
    soundSystem: 'L-Acoustics Kara II Line Array, Avid S6L FOH & Monitors',
    stageDimensions: '36ft x 24ft x 4ft',
    greenRoom: '2 upstairs dressing rooms with showers, catering area',
    loadIn: 'Rear alley dock off 5th & Main, ramp access directly to stage left',
    genres: 'Death Metal, Industrial, Punk, Post-Punk, Alternative',
    notes: 'Historic sloping floor theater in DTLA. In-house pizza shop attached.',
    status: 'Verified',
  },
  {
    id: 'v-seed-3',
    name: 'Reggies Rock Club',
    city: 'Chicago',
    state: 'IL',
    address: '2105 S State St',
    capacity: 400,
    contact: 'booking@reggieslive.com',
    soundSystem: 'JBL VTX Line Array, Allen & Heath dLive S5000',
    stageDimensions: '24ft x 16ft x 3.5ft',
    greenRoom: 'Large second-floor green room with laundry, shower, and kitchenette',
    loadIn: 'Dedicated tour bus parking out front, ramp load-in through side alley door',
    genres: 'Metal, Thrash, Punk, Stoner Rock, Hardcore',
    notes: 'Very tour-friendly venue with record store and rooftop bar attached.',
    status: 'Verified',
  },
  {
    id: 'v-seed-4',
    name: 'Mohawk',
    city: 'Austin',
    state: 'TX',
    address: '912 Red River St',
    capacity: 650,
    contact: 'booking@mohawkaustin.com',
    soundSystem: 'Martin Audio Wavefront Precision, Midas Pro2',
    stageDimensions: '26ft x 18ft (Outdoor Stage), 16ft x 10ft (Indoor)',
    greenRoom: 'Backstage artist patio and climate-controlled green room',
    loadIn: 'Red River St loading zone, direct ramp to outdoor stage',
    genres: 'Metal, Indie, Punk, Noise Rock, Doom',
    notes: 'Multi-level indoor/outdoor Red River Cultural District staple.',
    status: 'Verified',
  },
  {
    id: 'v-seed-5',
    name: 'The Masquerade (Hell Stage)',
    city: 'Atlanta',
    state: 'GA',
    address: '50 Lower Alabama St',
    capacity: 550,
    contact: 'booking@masqueradeatlanta.com',
    soundSystem: 'Electro-Voice X-Line Advance, Yamaha CL5',
    stageDimensions: '28ft x 18ft x 3.5ft',
    greenRoom: 'Private suite behind stage with shower and Wi-Fi',
    loadIn: 'Underground loading dock with freight elevator to stage level',
    genres: 'Metalcore, Deathcore, Heavy Metal, Goth, Emo',
    notes: 'Located in Kenny’s Alley at Underground Atlanta. Three stages (Heaven, Hell, Purgatory).',
    status: 'Verified',
  },
  {
    id: 'v-seed-6',
    name: '1720',
    city: 'Los Angeles',
    state: 'CA',
    address: '1720 E 16th St',
    capacity: 750,
    contact: 'info@1720.la',
    soundSystem: 'Funktion-One Evo 6 / L-Acoustics, DiGiCo SD12',
    stageDimensions: '30ft x 20ft x 3ft',
    greenRoom: 'Two private green rooms behind stage',
    loadIn: 'Ground-level roll-up warehouse door on 16th St',
    genres: 'Extreme Metal, Hardcore, Doom, Electronic, Underground',
    notes: 'Industrial warehouse venue in DTLA Arts District border.',
    status: 'Verified',
  },
];

import { BUILT_IN_BLACK_BOOK_VENUES } from '../seeds/seedVenuesData';

async function loadCachedVenues(): Promise<any[]> {
  try {
    if (fs.existsSync(venuesCacheFile)) {
      const content = await fs.promises.readFile(venuesCacheFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > initialSeededVenues.length) return parsed;
      }
    }
  } catch (e) {
    console.warn('[SERVER VENUES] Local cache read warning:', e);
  }
  const combinedSeed = [
    ...initialSeededVenues,
    ...BUILT_IN_BLACK_BOOK_VENUES.map((v) => ({
      id: v.id,
      name: v.name,
      city: v.city,
      state: v.state,
      country: v.country || 'USA',
      address: v.fullAddress || v.streetAddress,
      street_address: v.streetAddress,
      capacity: v.capacity,
      payout_rating: v.payoutRating,
      load_in_rating: v.loadInRating,
      genre_fit: v.genreFit,
      contact: v.contactEmail || v.contactPhone || v.contactName,
      email: v.contactEmail,
      phone: v.contactPhone,
      buyers: v.contactName,
      website: v.website,
      notes: v.parkingNotes || v.notes,
      tags: v.tags,
      status: 'Verified',
    })),
  ];
  try {
    await fs.promises.writeFile(
      venuesCacheFile,
      JSON.stringify(combinedSeed, null, 2),
      'utf8'
    );
  } catch (_) {}
  return combinedSeed;
}

async function saveCachedVenues(venuesList: any[]): Promise<void> {
  try {
    const existing = await loadCachedVenues();
    const map = new Map<string, any>();
    existing.forEach((v: any) => {
      if (v && v.name) {
        const key = v.id || `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
        map.set(key, v);
      }
    });
    venuesList.forEach((v: any) => {
      if (v && v.name) {
        const key = v.id || `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
        map.set(key, {
          ...(map.get(key) || {}),
          ...v,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    await fs.promises.writeFile(
      venuesCacheFile,
      JSON.stringify(Array.from(map.values()), null, 2),
      'utf8'
    );
  } catch (e) {
    console.warn('[SERVER VENUES] Local cache write warning:', e);
  }
}

showsRouter.get('/api/venues', async (req: express.Request, res: express.Response) => {
  try {
    const allVenues = await loadCachedVenues();
    const q = String(req.query.q || '').trim().toLowerCase();
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(0, Number(req.query.page) || 0);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    let filtered = allVenues;
    if (q) {
      filtered = allVenues.filter((v: any) => {
        const hay = `${v?.name || ''} ${v?.city || ''} ${v?.state || ''} ${v?.address || ''} ${(v?.tags || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const venues = hasPagination
      ? filtered.slice(page * limit, page * limit + limit)
      : filtered;

    res.json({ success: true, total: filtered.length, page, limit, venues });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load venues' });
  }
});

showsRouter.post(
  '/api/venues',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const venue = req.body?.venue || req.body;
      if (!venue || !venue.name) {
        return res.status(400).json({ error: 'Venue name is required' });
      }
      const venueWithOwner = {
        ...venue,
        created_by: venue.created_by || req.authUser!.id,
      };
      await saveCachedVenues([venueWithOwner]);
      const updated = await loadCachedVenues();
      res.json({ success: true, venue: venueWithOwner, count: updated.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save venue' });
    }
  }
);

showsRouter.post(
  '/api/venues/batch',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const venues = req.body?.venues || (Array.isArray(req.body) ? req.body : []);
      if (!Array.isArray(venues) || venues.length === 0) {
        return res.status(400).json({ error: 'Venues array is required' });
      }
      await saveCachedVenues(venues);
      const updated = await loadCachedVenues();
      res.json({ success: true, count: updated.length, venues: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to batch save venues' });
    }
  }
);

showsRouter.post(
  '/api/venues/batch-delete',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const { ids = [], keys = [] } = req.body || {};
      const idSet = new Set((ids as string[]).map((id: string) => String(id).trim().toLowerCase()));
      const keySet = new Set((keys as string[]).map((k: string) => String(k).trim().toLowerCase()));

      const existing = await loadCachedVenues();
      const filtered = existing.filter((v: any) => {
        if (!v) return false;
        const matchedById = v.id && idSet.has(String(v.id).trim().toLowerCase());
        const key = `${(v.name || '').trim().toLowerCase()}_${(v.city || '').trim().toLowerCase()}`;
        const matchedByKey = keySet.has(key);
        if (matchedById || matchedByKey) {
          if (v.created_by && v.created_by !== req.authUser!.id && !req.authUser!.isAdmin) {
            return true;
          }
          return false;
        }
        return true;
      });

      await fs.promises.writeFile(venuesCacheFile, JSON.stringify(filtered, null, 2), 'utf8');
      res.json({
        success: true,
        count: filtered.length,
        purgedCount: existing.length - filtered.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to batch delete venues' });
    }
  }
);

showsRouter.delete(
  '/api/venues/:id',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const venueId = req.params.id;
      const venueName = ((req.query.name as string) || '').trim().toLowerCase();
      const venueCity = ((req.query.city as string) || '').trim().toLowerCase();

      const existing = await loadCachedVenues();
      const target = existing.find((v: any) => {
        if (!v) return false;
        if (venueId && venueId !== 'undefined' && venueId !== 'null' && v.id === venueId)
          return true;
        if (venueName && venueCity && v.name && v.city) {
          return (
            v.name.trim().toLowerCase() === venueName &&
            v.city.trim().toLowerCase() === venueCity
          );
        }
        return false;
      });

      if (
        target &&
        target.created_by &&
        target.created_by !== req.authUser!.id &&
        !req.authUser!.isAdmin
      ) {
        return res.status(403).json({
          error: 'Forbidden: Only the venue creator or admin may remove this venue.',
        });
      }

      const filtered = existing.filter((v: any) => {
        if (!v) return false;
        if (venueId && venueId !== 'undefined' && venueId !== 'null' && v.id === venueId) {
          return false;
        }
        if (venueName && venueCity && v.name && v.city) {
          if (
            v.name.trim().toLowerCase() === venueName &&
            v.city.trim().toLowerCase() === venueCity
          ) {
            return false;
          }
        }
        return true;
      });

      await fs.promises.writeFile(venuesCacheFile, JSON.stringify(filtered, null, 2), 'utf8');
      res.json({ success: true, count: filtered.length, deletedId: venueId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete venue' });
    }
  }
);

// ============================================================
// TOUR PACKAGES PERSISTENCE & CROSS-DEVICE SYNC APIS
// ============================================================
const tourPackagesCacheFile = path.join(uploadsDir, 'tour_packages_cache.json');

function isServerCommunityTour(t: any): boolean {
  if (!t) return false;
  const title = (t.title || '').toLowerCase();
  const headliner = (t.headlinerClientName || t.headliner_client_name || '').toLowerCase();
  const id = (t.id || '').toLowerCase();
  if (
    title.includes('us and canada') ||
    title.includes('canada tour') ||
    headliner.includes('dying fetus') ||
    headliner.includes('dying') ||
    title.includes('dying') ||
    id.includes('us-and-canada') ||
    id.includes('us_and_canada') ||
    id.includes('dying-fetus') ||
    headliner.includes('vader') ||
    title.includes('reign forever') ||
    title.includes('kingdom of blood') ||
    headliner.includes('nile') ||
    headliner.includes('nekrogoblikon') ||
    headliner.includes('havok')
  ) {
    return true;
  }
  if (
    Array.isArray(t.stops) &&
    t.stops.some(
      (s: any) =>
        s.is_community_submitted === true ||
        (typeof s.id === 'string' && (s.id.includes('df000') || s.id.includes('sh_comm_'))) ||
        (typeof s.venueName === 'string' && s.venueName.toLowerCase().includes('dying fetus')) ||
        (typeof s.name === 'string' && s.name.toLowerCase().includes('dying fetus'))
    )
  ) {
    return true;
  }
  return false;
}

async function loadCachedTourPackages(): Promise<any[]> {
  try {
    if (fs.existsSync(tourPackagesCacheFile)) {
      const content = await fs.promises.readFile(tourPackagesCacheFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((t: any) => !isServerCommunityTour(t));
        }
      }
    }
  } catch (e) {
    console.warn('[SERVER TOURS] Local cache read warning:', e);
  }
  return [];
}

async function saveCachedTourPackages(toursList: any[]): Promise<void> {
  try {
    const existing = await loadCachedTourPackages();
    const map = new Map<string, any>();
    existing.forEach((t: any) => {
      if (t && t.id && !isServerCommunityTour(t)) map.set(t.id, t);
    });
    toursList.forEach((t: any) => {
      if (t && t.id && !isServerCommunityTour(t)) {
        map.set(t.id, {
          ...(map.get(t.id) || {}),
          ...t,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    await fs.promises.writeFile(
      tourPackagesCacheFile,
      JSON.stringify(Array.from(map.values()), null, 2),
      'utf8'
    );
  } catch (e) {
    console.warn('[SERVER TOURS] Local cache write warning:', e);
  }
}

showsRouter.get(
  '/api/tour-packages',
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      const allTours = await loadCachedTourPackages();
      const user = req.authUser!;
      if (user.isAdmin) {
        return res.json({ success: true, tours: allTours });
      }

      const supabase = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(supabase, user);

      const visibleTours = allTours
        .filter((tour: any) => {
          const isParticipant = hasAnyOwnershipMatch(user, ownedIds, [
            tour.creator_id,
            tour.owner_id,
            tour.promoterId,
            tour.headlinerClientId,
            ...(Array.isArray(tour.bands)
              ? tour.bands.flatMap((b: any) => [b?.id, b?.bandId])
              : []),
          ]);
          return isParticipant || tour.publicationStatus === 'public_announced';
        })
        .map((tour: any) => {
          const isParticipant = hasAnyOwnershipMatch(user, ownedIds, [
            tour.creator_id,
            tour.owner_id,
            tour.promoterId,
            tour.headlinerClientId,
            ...(Array.isArray(tour.bands)
              ? tour.bands.flatMap((b: any) => [b?.id, b?.bandId])
              : []),
          ]);
          if (isParticipant) return tour;

          return {
            ...tour,
            stops: Array.isArray(tour.stops)
              ? tour.stops.map((s: any) => ({
                  ...s,
                  venueContactEmail: undefined,
                  venueContactPhone: undefined,
                  grossDeal: undefined,
                }))
              : [],
          };
        });

      res.json({ success: true, tours: visibleTours });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load tour packages' });
    }
  }
);

showsRouter.post(
  '/api/tour-packages',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body?.tour || req.body?.tours || req.body;
      const toursToSave = Array.isArray(payload) ? payload : [payload];
      if (toursToSave.length === 0 || !toursToSave[0]?.id) {
        return res.status(400).json({ error: 'Valid tour package is required' });
      }

      const user = req.authUser!;
      const supabase = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(supabase, user);
      const existingTours = await loadCachedTourPackages();
      const existingMap = new Map(existingTours.map((t: any) => [t.id, t]));

      const authorizedToursToSave: any[] = [];
      for (const tour of toursToSave) {
        if (!tour || !tour.id) continue;
        const existing = existingMap.get(tour.id);
        if (existing) {
          const isOwner = hasAnyOwnershipMatch(user, ownedIds, [
            existing.creator_id,
            existing.owner_id,
            existing.promoterId,
            existing.headlinerClientId,
          ]);
          if (!isOwner) {
            return res
              .status(403)
              .json({ error: `Forbidden: Not authorized to modify tour package ${tour.id}` });
          }
        }
        authorizedToursToSave.push({
          ...tour,
          creator_id: existing?.creator_id || user.id,
          owner_id: existing?.owner_id || user.id,
        });
      }

      await saveCachedTourPackages(authorizedToursToSave);

      if (supabase) {
        for (const tour of authorizedToursToSave) {
          if (Array.isArray(tour.stops)) {
            for (const stop of tour.stops) {
              try {
                const hexId = (stop.id || '')
                  .replace(/[^a-f0-9]/gi, '')
                  .padEnd(32, '0')
                  .slice(0, 32);
                const stopUuid =
                  hexId.slice(0, 8) +
                  '-' +
                  hexId.slice(8, 12) +
                  '-4' +
                  hexId.slice(13, 16) +
                  '-a' +
                  hexId.slice(17, 20) +
                  '-' +
                  hexId.slice(20, 32);
                const isPublished = tour.publicationStatus === 'public_announced';
                const isEmbargoed = tour.publicationStatus === 'embargoed_private';
                const showRecord = {
                  id: stopUuid,
                  creator_id: tour.creator_id || user.id,
                  show_name: (tour.title || 'Tour') + ' - ' + (stop.city || 'Tour Stop'),
                  headliner: tour.headlinerClientName || 'Headliner Band',
                  date: stop.date,
                  show_date: stop.date,
                  venue_name: stop.venueName || 'Venue',
                  venue: stop.venueName || 'Venue',
                  city: stop.city || 'Tour City',
                  state_province: stop.state || 'USA',
                  country: 'USA',
                  guarantee_amount: stop.grossDeal || 2000,
                  doors_time: stop.doorsTime || '19:00',
                  set_time: stop.showStartTime || '20:00',
                  promoter_contact: stop.venueContactName || '',
                  parking_arrangements: stop.parkingNotes || '',
                  status: 'Active',
                  is_managed_client_booking: true,
                  additional_notes: JSON.stringify({
                    tour_id: tour.id,
                    tour_title: tour.title,
                    stop_id: stop.id,
                    load_in_time: stop.loadInTime,
                    soundcheck_time: stop.soundcheckTime,
                    curfew_time: stop.curfewTime,
                    hospitality: stop.hospitalityNotes,
                    venue_email: stop.venueContactEmail,
                    venue_phone: stop.venueContactPhone,
                    stop_status: stop.status,
                    publication_status: tour.publicationStatus || 'embargoed_private',
                    is_published: isPublished,
                    embargo_until_date: tour.embargoUntilDate || '',
                  }),
                  support_lineup: Array.isArray(tour.bands)
                    ? tour.bands.map((b: any) => b.name).join(', ')
                    : '',
                };
                await supabase.from('shows').upsert(showRecord, { onConflict: 'id' });
              } catch (_) {}
            }
          }
        }
      }

      const updated = await loadCachedTourPackages();
      res.json({ success: true, count: updated.length, tours: authorizedToursToSave });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save tour package' });
    }
  }
);

showsRouter.delete(
  '/api/tour-packages/:id',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const tourId = req.params.id;
      const existing = await loadCachedTourPackages();
      const target = existing.find((t: any) => t.id === tourId);
      if (target) {
        const ownedIds = await getUserOwnedEntityIds(getSupabaseService(), req.authUser!);
        const isOwner = hasAnyOwnershipMatch(req.authUser!, ownedIds, [
          target.creator_id,
          target.owner_id,
          target.promoterId,
          target.headlinerClientId,
        ]);
        if (!isOwner) {
          return res.status(403).json({
            error:
              'Forbidden: Only the tour creator or authorized manager can delete this tour package.',
          });
        }
      }

      const filtered = existing.filter((t: any) => t.id !== tourId);
      await fs.promises.writeFile(
        tourPackagesCacheFile,
        JSON.stringify(filtered, null, 2),
        'utf8'
      );
      res.json({ success: true, count: filtered.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete tour package' });
    }
  }
);

// ============================================================
// MUSICBRAINZ VENUE SEEDING, FLYER PARSING & VENUE GROUNDING
// ============================================================
showsRouter.post(
  '/api/venues/seed-musicbrainz',
  requireAuth,
  scrapeLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const { query = '', city = '', country = 'US', limit = 40 } = req.body || {};

      let searchParts: string[] = [];
      if (query && query.trim()) {
        searchParts.push(`place:"${query.trim()}" OR "${query.trim()}"`);
      } else {
        searchParts.push(
          `(type:Venue OR type:Club OR type:Hall OR type:Stadium OR type:" indoor arena")`
        );
      }

      if (city && city.trim()) {
        searchParts.push(`(area:"${city.trim()}" OR address:"${city.trim()}")`);
      }

      if (country && country.trim() && !city.trim() && !query.trim()) {
        searchParts.push(`area:"${country.trim()}"`);
      }

      const luceneQuery = searchParts.join(' AND ');
      const safeLimit = Math.min(Math.max(Number(limit) || 35, 10), 100);
      const mbUrl = `https://musicbrainz.org/ws/2/place/?query=${encodeURIComponent(luceneQuery)}&fmt=json&limit=${safeLimit}`;

      console.log(`[MUSICBRAINZ VENUES] Fetching real venues for query: ${luceneQuery}`);

      const mbResponse = await fetch(mbUrl, {
        headers: {
          'User-Agent': 'NexusCoreTouringOS/1.0 (contact@thenexuscoreapp.com)',
          Accept: 'application/json',
        },
      });

      if (!mbResponse.ok) {
        throw new Error(`MusicBrainz API returned status ${mbResponse.status}`);
      }

      const data: any = await mbResponse.json();
      const rawPlaces: any[] = Array.isArray(data?.places) ? data.places : [];

      const usStateMap: Record<string, string> = {
        alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
        colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
        hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
        kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
        massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
        montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
        'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
        oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
        virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
        'district of columbia': 'DC',
      };

      const extractStateAndCity = (place: any, fallbackCity: string) => {
        const addr = (place.address || '').trim();
        const areaName = (place.area?.name || '').trim();

        let resolvedCity = fallbackCity || areaName || 'Unknown City';
        let resolvedState = country || 'US';

        const stateZipMatch = addr.match(/,\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?(?:,\s*USA?)?$/i);
        if (stateZipMatch) {
          resolvedState = stateZipMatch[1].toUpperCase();
        } else {
          const parts = addr
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
          for (const part of parts) {
            const cleanPart = part.replace(/\d+/g, '').trim().toLowerCase();
            if (usStateMap[cleanPart]) {
              resolvedState = usStateMap[cleanPart];
              break;
            }
            if (/^[A-Z]{2}$/.test(part)) {
              resolvedState = part;
              break;
            }
          }
          if (parts.length >= 2 && (!resolvedCity || resolvedCity === 'Unknown City')) {
            resolvedCity = parts[parts.length - 2] || areaName;
          }
        }

        if (
          usStateMap[areaName.toLowerCase()] &&
          fallbackCity &&
          fallbackCity.toLowerCase() !== areaName.toLowerCase()
        ) {
          resolvedState = usStateMap[areaName.toLowerCase()];
          resolvedCity = fallbackCity;
        }

        return { city: resolvedCity, state: resolvedState };
      };

      const mappedVenues = rawPlaces
        .filter((p) => {
          if (!p || !p.name) return false;
          if (p['life-span']?.ended === true) return false;
          const pType = (p.type || '').toLowerCase();
          if (
            pType.includes('studio') ||
            pType.includes('pressing') ||
            pType.includes('religious')
          )
            return false;
          return true;
        })
        .map((p) => {
          const { city: parsedCity, state: parsedState } = extractStateAndCity(p, city.trim());
          const pType = p.type || 'Live Music Venue';
          const coords = p.coordinates
            ? `${p.coordinates.latitude}, ${p.coordinates.longitude}`
            : '';

          let estimatedCap = 350;
          const lowerType = pType.toLowerCase();
          const lowerName = p.name.toLowerCase();
          if (lowerType.includes('stadium')) estimatedCap = 35000;
          else if (lowerType.includes('arena')) estimatedCap = 12000;
          else if (lowerType.includes('amphitheatre')) estimatedCap = 6500;
          else if (
            lowerType.includes('hall') ||
            lowerName.includes('theater') ||
            lowerName.includes('theatre') ||
            lowerName.includes('ballroom')
          )
            estimatedCap = 1200;
          else if (
            lowerType.includes('club') ||
            lowerName.includes('bar') ||
            lowerName.includes('lounge') ||
            lowerName.includes('pub') ||
            lowerName.includes('tavern')
          )
            estimatedCap = 300;

          const tagsList = Array.isArray(p.tags)
            ? p.tags
                .map((t: any) => t.name)
                .slice(0, 5)
                .join(', ')
            : '';

          return {
            id: `mb-${p.id}`,
            mbid: p.id,
            name: p.name.trim(),
            city: parsedCity,
            state: parsedState,
            address: p.address || `${parsedCity}, ${parsedState}`,
            capacity: estimatedCap,
            contact: 'Booking Desk (MusicBrainz Verified)',
            soundSystem: `In-House ${pType} PA System`,
            stageDimensions:
              estimatedCap >= 1000
                ? '40ft x 28ft x 4ft'
                : estimatedCap >= 500
                  ? '28ft x 18ft x 3.5ft'
                  : '18ft x 12ft x 2ft',
            greenRoom:
              estimatedCap >= 500
                ? 'Private backstage dressing suite & production office'
                : 'Artist green room / backstage hospitality area',
            loadIn: p.address
              ? `Direct load-in at ${p.address}${coords ? ` (${coords})` : ''}`
              : 'Street / alley load-in access',
            genres: tagsList || 'Live Music, Rock, Metal, Touring Acts',
            notes: `MusicBrainz Verified ${pType}${p.disambiguation ? ` — ${p.disambiguation}` : ''}.${p['life-span']?.begin ? ` Est. ${p['life-span'].begin.slice(0, 4)}.` : ''}`,
            status: 'Verified',
          };
        });

      const seen = new Set<string>();
      const uniqueNewVenues = mappedVenues.filter((v) => {
        const key = `${v.name.toLowerCase()}_${v.city.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const ai = await getGemini();
      if (ai && uniqueNewVenues.length > 0) {
        const batchToEnrich = uniqueNewVenues.slice(0, 15);
        try {
          const venueListText = batchToEnrich
            .map(
              (v, idx) =>
                `${idx + 1}. "${v.name}" in ${v.city}, ${v.state} (Address: ${v.address})`
            )
            .join('\n');

          const enrichResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert live music touring production manager and talent buyer. 
For each of the following real music venues, provide accurate real-world booking and production details:
${venueListText}

Return a JSON array where each object corresponds to the venue by exact "name" and includes:
- "name": Exact name from the list
- "capacity": Real standing/total capacity (integer)
- "contact": Official booking email, talent buyer contact, or website URL (e.g., "booking@...", "talent@...", or official website domain)
- "website": Official website URL (e.g., "https://...")
- "phone": Box office or venue phone number if known
- "soundSystem": Real or typical PA / FOH console specs for this specific room
- "stageDimensions": Stage size or room configuration
- "greenRoom": Backstage / dressing room details
- "loadIn": Load-in access and parking notes
- "genres": Primary genres booked at this venue`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    capacity: { type: Type.NUMBER },
                    contact: { type: Type.STRING },
                    website: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    soundSystem: { type: Type.STRING },
                    stageDimensions: { type: Type.STRING },
                    greenRoom: { type: Type.STRING },
                    loadIn: { type: Type.STRING },
                    genres: { type: Type.STRING },
                  },
                  required: ['name'],
                },
              },
            },
          });

          const enrichedArray = JSON.parse(enrichResponse.text || '[]');
          if (Array.isArray(enrichedArray)) {
            const enrichMap = new Map<string, any>();
            enrichedArray.forEach((item: any) => {
              if (item && item.name) {
                enrichMap.set(item.name.trim().toLowerCase(), item);
              }
            });

            uniqueNewVenues.forEach((v) => {
              const match = enrichMap.get(v.name.toLowerCase());
              if (match) {
                if (match.capacity && Number(match.capacity) > 0)
                  v.capacity = Number(match.capacity);
                if (match.contact && match.contact.trim()) {
                  const contactParts = [match.contact.trim()];
                  if (match.phone && !match.contact.includes(match.phone))
                    contactParts.push(match.phone.trim());
                  if (match.website && !match.contact.includes(match.website))
                    contactParts.push(match.website.trim());
                  v.contact = contactParts.join(' | ');
                }
                if (match.soundSystem && match.soundSystem.trim())
                  v.soundSystem = match.soundSystem.trim();
                if (match.stageDimensions && match.stageDimensions.trim())
                  v.stageDimensions = match.stageDimensions.trim();
                if (match.greenRoom && match.greenRoom.trim())
                  v.greenRoom = match.greenRoom.trim();
                if (match.loadIn && match.loadIn.trim()) v.loadIn = match.loadIn.trim();
                if (match.genres && match.genres.trim()) v.genres = match.genres.trim();
              }
            });
          }
        } catch (aiErr: any) {
          console.warn(
            '[MUSICBRAINZ VENUES] AI enrichment pass skipped or partial:',
            aiErr?.message || aiErr
          );
        }
      }

      if (uniqueNewVenues.length > 0) {
        await saveCachedVenues(uniqueNewVenues);
      }

      const allCached = await loadCachedVenues();

      res.json({
        success: true,
        importedCount: uniqueNewVenues.length,
        importedVenues: uniqueNewVenues,
        totalVenues: allCached.length,
        venues: allCached,
      });
    } catch (error: any) {
      console.error('[MUSICBRAINZ VENUES ERROR]:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to seed venues from MusicBrainz' });
    }
  }
);

showsRouter.post(
  '/api/parse-show-flyer',
  requireAuth,
  aiLimiter,
  express.json({ limit: '50mb' }),
  async (req: express.Request, res: express.Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Flyer image data is required.' });
      }

      const ai = await getGemini();
      if (!ai) {
        return res.status(500).json({ error: 'Gemini API is not configured on the server.' });
      }

      const cleanBase64 = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;

      const currentYear = new Date().getFullYear();

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: `You are an expert live music and concert flyer parser. Analyze this concert or tour flyer image carefully.
Determine if this is a SINGLE SHOW flyer or a MULTI-STOP TOUR flyer (which lists multiple dates, cities, and venues).
Extract all details accurately:
- isTourFlyer: true if the flyer lists 2 or more dates/cities, false if it is a single concert.
- showTitle: The name of the tour, festival, or event (or Headliner + Tour Name).
- headliner: The main headlining band/artist (usually largest logo at the top).
- supportBands: Array of all opening/support bands listed on the flyer.
- genre: Primary musical genre (e.g., Death Metal, Hardcore, Thrash Metal, Metalcore, Punk, etc.).
- ageLimit: Age restriction if mentioned (e.g., "All Ages", "18+", "21+"), otherwise "All Ages".
- ticketPrice: Ticket price if mentioned (number only, e.g. 25), otherwise 20.
- doorsTime: Doors or start time if mentioned (e.g., "7:00 PM"), otherwise "7:00 PM".
- description: A brief 1-2 sentence hype summary of the lineup/tour.
- stops: An array of every date/show listed on the flyer. Even if it is a single show, include that 1 show in the "stops" array!
  For each stop in "stops", provide:
  - date: Formatted strictly as YYYY-MM-DD (if the year is not printed on the flyer, assume ${currentYear}).
  - venueName: Name of the venue for that stop (or "TBA" if only city is shown).
  - city: City name.
  - state: 2-letter state or country code (e.g., "CA", "NY", "TX", "UK").
  - address: Street address if printed on the flyer, otherwise "".
  - time: Time for that specific stop if printed, otherwise "7:00 PM".
  - price: Price for that stop if printed, otherwise 20.`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isTourFlyer: { type: Type.BOOLEAN },
              showTitle: { type: Type.STRING },
              headliner: { type: Type.STRING },
              supportBands: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              genre: { type: Type.STRING },
              ageLimit: { type: Type.STRING },
              ticketPrice: { type: Type.NUMBER },
              doorsTime: { type: Type.STRING },
              description: { type: Type.STRING },
              stops: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    venueName: { type: Type.STRING },
                    city: { type: Type.STRING },
                    state: { type: Type.STRING },
                    address: { type: Type.STRING },
                    time: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                  },
                  required: ['date', 'venueName', 'city', 'state'],
                },
              },
            },
            required: ['isTourFlyer', 'headliner', 'supportBands', 'stops'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini Vision parser.');
      }

      const parsed = JSON.parse(text);
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('[PARSE SHOW FLYER ERROR]:', error);
      res.status(500).json({ error: error.message || 'Failed to parse show flyer.' });
    }
  }
);

showsRouter.post('/api/venue-grounding', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { venueName, city, state, query, lat, lng } = req.body;
    const searchQuery = query || `${venueName || ''} ${city || ''} ${state || ''}`.trim();

    if (!searchQuery) {
      return res.status(400).json({ error: 'Venue name or search query is required' });
    }

    const ai = await getGemini();
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured on the server.' });
    }

    const toolConfig: any = {};
    if (typeof lat === 'number' && typeof lng === 'number') {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: lat,
          longitude: lng,
        },
      };
    }

    const prompt = `Find accurate real-world venue and booking intelligence for the live music venue: "${searchQuery}".
Please return structured details in valid JSON format (inside a \`\`\`json codeblock or plain JSON) with the following keys:
{
  "name": "Official Venue Name",
  "address": "Full street address",
  "city": "City",
  "state": "State/Province abbreviation",
  "capacity": 500,
  "contact": "Booking email or contact info if public, otherwise website or phone",
  "website": "Official website URL",
  "phone": "Phone number",
  "rating": "Google Maps rating if available",
  "soundSystem": "Known PA / sound system specs or room acoustics description",
  "stageDimensions": "Stage size or room layout notes",
  "greenRoom": "Backstage / green room notes if known",
  "loadIn": "Load-in / parking / street access details based on location",
  "genres": "Common music genres hosted here",
  "notes": "Summary of the venue vibe, neighborhood, and touring tips for bands"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        ...(Object.keys(toolConfig).length > 0 ? { toolConfig } : {}),
      },
    });

    const rawText = response.text || '';
    let parsedVenue: any = {};

    try {
      const jsonMatch =
        rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
        rawText.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        parsedVenue = JSON.parse(jsonMatch[1].trim());
      } else {
        parsedVenue = JSON.parse(rawText.trim());
      }
    } catch (_) {
      parsedVenue = {
        name: venueName || searchQuery,
        city: city || '',
        state: state || '',
        notes: rawText,
      };
    }

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsSources: Array<{ title: string; uri: string; placeId?: string }> = [];
    const webSources: Array<{ title: string; uri: string }> = [];

    for (const chunk of groundingChunks as any[]) {
      if (chunk.maps && chunk.maps.uri) {
        mapsSources.push({
          title: chunk.maps.title || parsedVenue.name || 'Google Maps Place',
          uri: chunk.maps.uri,
          placeId: chunk.maps.placeId,
        });
      } else if (chunk.web && chunk.web.uri) {
        webSources.push({
          title: chunk.web.title || 'Web Source',
          uri: chunk.web.uri,
        });
      }
    }

    const enrichedResult = {
      ...parsedVenue,
      mapsUri: mapsSources[0]?.uri || null,
      mapsTitle: mapsSources[0]?.title || null,
      mapsSources,
      webSources,
    };

    if (enrichedResult.name && enrichedResult.city) {
      await saveCachedVenues([
        {
          id: `v-grounded-${Date.now()}`,
          name: enrichedResult.name,
          city: enrichedResult.city,
          state: enrichedResult.state || state || '',
          address: enrichedResult.address || '',
          capacity: Number(enrichedResult.capacity) || 350,
          contact: enrichedResult.contact || enrichedResult.website || 'Verified via Maps',
          soundSystem: enrichedResult.soundSystem || 'Standard In-House PA',
          stageDimensions: enrichedResult.stageDimensions || 'Standard Stage',
          greenRoom: enrichedResult.greenRoom || 'Backstage Area',
          loadIn: enrichedResult.loadIn || 'Street / Alley Load-in',
          genres: enrichedResult.genres || 'Live Music',
          notes: enrichedResult.notes || '',
          mapsUri: enrichedResult.mapsUri,
          status: 'Verified',
        },
      ]);
    }

    res.json({
      success: true,
      data: enrichedResult,
    });
  } catch (error: any) {
    console.error('[VENUE GROUNDING ERROR]:', error);
    res
      .status(500)
      .json({ error: error.message || 'Failed to ground venue with Google Maps' });
  }
});

// ============================================================
// LIVE VENUE PIT WALL (PERSISTENT MULTI-USER SHOW CHAT)
// ============================================================
export interface PitWallReplyRef {
  id: string;
  username: string;
  text: string;
}

export interface PitWallMessage {
  id: string;
  eventId: string;
  user_id: string;
  username: string;
  handle?: string;
  avatar_url?: string;
  role?: string;
  category?: 'chat' | 'set_times' | 'merch' | 'meetup' | 'pit';
  text: string;
  replyTo?: PitWallReplyRef | null;
  reactions?: Record<string, string[]>;
  timestamp: string;
  created_at: string;
}

export interface PitWallPinnedNotice {
  text: string;
  updatedBy: string;
  updatedAt: string;
}

interface PitWallStoreData {
  messagesByEvent: Record<string, PitWallMessage[]>;
  pinnedByEvent: Record<string, PitWallPinnedNotice | null>;
}

const PIT_WALL_STORE_PATH = path.join(uploadsDir, 'venue_pit_walls.json');

const LEGACY_MOCK_AUTHORS = new Set([
  'pit host',
  'jax_riff',
  'valkyrie_v',
  'metalhead99',
  'sarahv',
  'tour crew',
]);

function isLegacyMockPitMessage(msg: any): boolean {
  if (!msg) return true;
  const id = String(msg.id || '');
  if (id.startsWith('seed-') || id === 'msg_1' || id === 'msg_2') return true;
  const uid = String(msg.user_id || '');
  if (uid.startsWith('seed-')) return true;
  const uname = String(msg.username || msg.author || msg.user || '').toLowerCase().trim();
  if (LEGACY_MOCK_AUTHORS.has(uname)) return true;
  return false;
}

function readPitWallStore(): PitWallStoreData {
  try {
    if (fs.existsSync(PIT_WALL_STORE_PATH)) {
      const raw = fs.readFileSync(PIT_WALL_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        messagesByEvent: parsed?.messagesByEvent && typeof parsed.messagesByEvent === 'object' ? parsed.messagesByEvent : {},
        pinnedByEvent: parsed?.pinnedByEvent && typeof parsed.pinnedByEvent === 'object' ? parsed.pinnedByEvent : {},
      };
    }
  } catch (err) {
    console.warn('[PitWall] Failed to read pit wall store:', err);
  }
  return { messagesByEvent: {}, pinnedByEvent: {} };
}

function writePitWallStore(store: PitWallStoreData): void {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(PIT_WALL_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PitWall] Failed to write pit wall store:', err);
  }
}

function normalizeEventKey(rawEventId: string): string {
  return decodeURIComponent(String(rawEventId || 'default_event')).trim() || 'default_event';
}

showsRouter.get('/api/shows/:eventId/pitwall', async (req, res) => {
  try {
    const eventKey = normalizeEventKey(req.params.eventId);
    const store = readPitWallStore();
    const localMessages = (store.messagesByEvent[eventKey] || []).filter(m => !isLegacyMockPitMessage(m));
    const pinnedNotice = store.pinnedByEvent[eventKey] || null;

    // Also merge any persisted rows from Supabase nexus_venue_chat if available
    const sb = getSupabaseService();
    const mergedMap = new Map<string, PitWallMessage>();
    for (const msg of localMessages) {
      mergedMap.set(msg.id, msg);
    }

    if (sb) {
      try {
        const { data, error } = await sb
          .from('nexus_venue_chat')
          .select('*, profiles(username, full_name, avatar_url, role)')
          .eq('event_id', eventKey)
          .order('created_at', { ascending: true })
          .limit(200);

        if (!error && Array.isArray(data)) {
          for (const row of data) {
            const rowId = String(row.id || `sb_${row.created_at}`);
            const text = String(row.message || '').trim();
            if (!text) continue;
            const username =
              row.sender_name ||
              row.profiles?.username ||
              row.profiles?.full_name ||
              'Attendee';
            if (LEGACY_MOCK_AUTHORS.has(String(username).toLowerCase().trim())) continue;

            // Avoid duplicating a message that was already saved locally around the same timestamp & text
            const alreadyExists = Array.from(mergedMap.values()).some(
              existing =>
                existing.id === rowId ||
                (existing.text === text &&
                  existing.username.toLowerCase() === String(username).toLowerCase() &&
                  Math.abs(new Date(existing.created_at).getTime() - new Date(row.created_at).getTime()) < 10000)
            );
            if (!alreadyExists) {
              mergedMap.set(rowId, {
                id: rowId,
                eventId: eventKey,
                user_id: String(row.profile_id || 'attendee'),
                username: String(username),
                avatar_url: row.profiles?.avatar_url || '',
                role: row.profiles?.role || 'Fan',
                category: 'chat',
                text,
                replyTo: null,
                reactions: {},
                created_at: row.created_at || new Date().toISOString(),
                timestamp: row.created_at
                  ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now',
              });
            }
          }
        }
      } catch (_) {}
    }

    const messages = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Save cleaned list back if needed
    if (messages.length !== (store.messagesByEvent[eventKey] || []).length) {
      store.messagesByEvent[eventKey] = messages;
      writePitWallStore(store);
    }

    res.json({
      success: true,
      eventId: eventKey,
      messages,
      pinnedNotice,
    });
  } catch (error: any) {
    console.error('[PitWall GET Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to load Venue Pit Wall' });
  }
});

showsRouter.post('/api/shows/:eventId/pitwall', apiMutationLimiter, async (req, res) => {
  try {
    const eventKey = normalizeEventKey(req.params.eventId);
    const {
      id,
      user_id,
      username,
      handle,
      avatar_url,
      role,
      category,
      text,
      replyTo,
    } = req.body || {};

    const cleanText = String(text || '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const nowIso = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = String(id || `pit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    const validCategories = new Set(['chat', 'set_times', 'merch', 'meetup', 'pit']);
    const normalizedCat = validCategories.has(category) ? category : 'chat';

    const newMessage: PitWallMessage = {
      id: msgId,
      eventId: eventKey,
      user_id: String(user_id || 'guest_fan'),
      username: String(username || 'Scene Attendee').trim(),
      handle: handle ? String(handle).trim() : undefined,
      avatar_url: avatar_url ? String(avatar_url).trim() : '',
      role: role ? String(role).trim() : 'Fan',
      category: normalizedCat,
      text: cleanText.slice(0, 1000),
      replyTo:
        replyTo && replyTo.id && replyTo.text
          ? {
              id: String(replyTo.id),
              username: String(replyTo.username || 'Attendee'),
              text: String(replyTo.text).slice(0, 200),
            }
          : null,
      reactions: {},
      timestamp: timeFormatted,
      created_at: nowIso,
    };

    const store = readPitWallStore();
    const existing = (store.messagesByEvent[eventKey] || []).filter(m => !isLegacyMockPitMessage(m));
    const deduped = existing.filter(m => m.id !== newMessage.id);
    deduped.push(newMessage);
    store.messagesByEvent[eventKey] = deduped.slice(-250);
    writePitWallStore(store);

    // Best-effort sync to Supabase nexus_venue_chat
    const sb = getSupabaseService();
    if (sb) {
      try {
        await sb.from('nexus_venue_chat').insert({
          event_id: eventKey,
          profile_id: user_id && /^[0-9a-f-]{36}$/i.test(String(user_id)) ? user_id : null,
          sender_name: newMessage.username,
          message: newMessage.text,
          created_at: nowIso,
        });
      } catch (_) {}
    }

    res.json({
      success: true,
      message: newMessage,
      messages: store.messagesByEvent[eventKey],
    });
  } catch (error: any) {
    console.error('[PitWall POST Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to post Pit Wall message' });
  }
});

showsRouter.post('/api/shows/:eventId/pitwall/:messageId/react', apiMutationLimiter, async (req, res) => {
  try {
    const eventKey = normalizeEventKey(req.params.eventId);
    const messageId = String(req.params.messageId || '').trim();
    const { emoji, userId } = req.body || {};
    const cleanEmoji = String(emoji || '🤘').trim();
    const actorId = String(userId || 'guest_fan').trim();

    const store = readPitWallStore();
    const list = store.messagesByEvent[eventKey] || [];
    const target = list.find(m => m.id === messageId);
    if (!target) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!target.reactions || typeof target.reactions !== 'object') {
      target.reactions = {};
    }
    const currentUsers = Array.isArray(target.reactions[cleanEmoji]) ? target.reactions[cleanEmoji] : [];
    if (currentUsers.includes(actorId)) {
      target.reactions[cleanEmoji] = currentUsers.filter(u => u !== actorId);
      if (target.reactions[cleanEmoji].length === 0) {
        delete target.reactions[cleanEmoji];
      }
    } else {
      target.reactions[cleanEmoji] = [...currentUsers, actorId];
    }

    writePitWallStore(store);
    res.json({
      success: true,
      message: target,
    });
  } catch (error: any) {
    console.error('[PitWall React Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to react to Pit Wall message' });
  }
});

showsRouter.post('/api/shows/:eventId/pitwall/pin', apiMutationLimiter, async (req, res) => {
  try {
    const eventKey = normalizeEventKey(req.params.eventId);
    const { text, updatedBy } = req.body || {};
    const cleanText = String(text || '').trim();

    const store = readPitWallStore();
    if (!cleanText) {
      store.pinnedByEvent[eventKey] = null;
    } else {
      store.pinnedByEvent[eventKey] = {
        text: cleanText.slice(0, 300),
        updatedBy: String(updatedBy || 'Show Host').trim(),
        updatedAt: new Date().toISOString(),
      };
    }
    writePitWallStore(store);

    res.json({
      success: true,
      pinnedNotice: store.pinnedByEvent[eventKey],
    });
  } catch (error: any) {
    console.error('[PitWall Pin Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to update pinned Pit Wall notice' });
  }
});

showsRouter.delete('/api/shows/:eventId/pitwall/:messageId', apiMutationLimiter, async (req, res) => {
  try {
    const eventKey = normalizeEventKey(req.params.eventId);
    const messageId = String(req.params.messageId || '').trim();

    const store = readPitWallStore();
    const existing = store.messagesByEvent[eventKey] || [];
    store.messagesByEvent[eventKey] = existing.filter(m => m.id !== messageId);
    writePitWallStore(store);

    res.json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error('[PitWall DELETE Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to delete Pit Wall message' });
  }
});

