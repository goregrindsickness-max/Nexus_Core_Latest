import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  getSupabaseService,
  assertBandOrEntityOwner,
} from '../lib/supabaseAdmin';
import {
  getResend,
  emailLogs,
  recordEmailLog,
  getNexusEmailWrapper,
  uploadsDir,
  getVapidKeys,
  loadPushSubscriptionsAsync,
} from '../lib/clients';
import {
  requireAuth,
  requireAdmin,
} from '../middleware/auth';
import {
  resolveSafeAppOrigin,
  escapeHtml,
  emailLimiter,
  apiMutationLimiter,
  bugReportLimiter,
} from '../middleware/security';

export const authRouter = express.Router();

// ============================================================
// HEALTH & SESSION DIAGNOSTICS
// ============================================================
authRouter.get('/api/health', async (_req, res) => {
  const isResendConfigured = Boolean(process.env.RESEND_API_KEY);
  const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const isStripePublishableConfigured = Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY);
  const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const isSupabaseConfigured = Boolean(
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  );
  const isSupabaseServiceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const isPayPalConfigured = Boolean(process.env.PAYPAL_CLIENT_ID);
  const vapidKeys = getVapidKeys();
  const subs = await loadPushSubscriptionsAsync();

  res.json({
    status: 'ok',
    services: {
      resend: isResendConfigured,
      stripe: isStripeConfigured,
      stripePublishable: isStripePublishableConfigured,
      gemini: isGeminiConfigured,
      supabase: isSupabaseConfigured,
      supabaseAdmin: isSupabaseServiceConfigured,
      paypal: isPayPalConfigured,
      webPush: Boolean(vapidKeys?.publicKey),
      webPushSubscribers: subs.length,
    },
  });
});

// ============================================================
// STRIPE & PAYPAL OAUTH CONNECT FLOWS
// ============================================================
authRouter.get('/api/auth/stripe/url', requireAuth, (req, res) => {
  const clientId = process.env.STRIPE_CLIENT_ID;
  const appUrl = resolveSafeAppOrigin(req);

  if (!clientId) {
    return res.json({
      url: `${appUrl}/auth/stripe/callback?code=simulated_stripe_code_${Date.now()}`,
      simulated: true,
    });
  }

  const redirectUri = `${appUrl}/auth/stripe/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
  });

  res.json({ url: `https://connect.stripe.com/oauth/authorize?${params.toString()}` });
});

authRouter.get(['/auth/stripe/callback', '/auth/stripe/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;
  const safeError = escapeHtml(error_description || error || '');

  if (error) {
    return res.send(`
      <html>
        <body style="background: #09090b; color: #fff; font-family: monospace; padding: 2rem; text-align: center;">
          <h2 style="color: #ef4444;">Stripe Connection Failed</h2>
          <p>${safeError}</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
  }

  const simulatedAccountId = `acct_${Math.random().toString(36).substring(2, 12)}`;
  const payloadJson = JSON.stringify({
    type: 'OAUTH_AUTH_SUCCESS',
    provider: 'stripe',
    accountId: simulatedAccountId,
    code: String(code || ''),
  }).replace(/</g, '\\u003c');

  res.send(`
    <html>
      <body style="background: #09090b; color: #10b981; font-family: monospace; padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.1); padding: 2rem; border-radius: 1rem; max-width: 400px;">
          <h2 style="margin-top: 0;">STRIPE ESCROW LINKED</h2>
          <p style="color: #a1a1aa; font-size: 0.875rem;">Account ID: ${escapeHtml(simulatedAccountId)}</p>
          <p style="color: #fff; font-size: 0.75rem; margin-top: 1.5rem;">Closing window and syncing with Nexus Core...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage(${payloadJson}, window.location.origin);
            setTimeout(() => window.close(), 1500);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

authRouter.get('/api/auth/paypal/url', requireAuth, (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const appUrl = resolveSafeAppOrigin(req);

  if (!clientId) {
    return res.json({
      url: `${appUrl}/auth/paypal/callback?code=simulated_paypal_code_${Date.now()}`,
      simulated: true,
    });
  }

  const redirectUri = `${appUrl}/auth/paypal/callback`;
  const params = new URLSearchParams({
    flowEntry: 'static',
    client_id: clientId,
    scope: 'openid profile email',
    redirect_uri: redirectUri,
  });

  res.json({ url: `https://www.paypal.com/signin/authorize?${params.toString()}` });
});

authRouter.get(['/auth/paypal/callback', '/auth/paypal/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;
  const safeError = escapeHtml(error_description || error || '');

  if (error) {
    return res.send(`
      <html>
        <body style="background: #09090b; color: #fff; font-family: monospace; padding: 2rem; text-align: center;">
          <h2 style="color: #ef4444;">PayPal Connection Failed</h2>
          <p>${safeError}</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
  }

  const simulatedMerchantId = `PAYPAL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const payloadJson = JSON.stringify({
    type: 'OAUTH_AUTH_SUCCESS',
    provider: 'paypal',
    accountId: simulatedMerchantId,
    code: String(code || ''),
  }).replace(/</g, '\\u003c');

  res.send(`
    <html>
      <body style="background: #09090b; color: #3b82f6; font-family: monospace; padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="border: 1px solid #3b82f6; background: rgba(59, 130, 246, 0.1); padding: 2rem; border-radius: 1rem; max-width: 400px;">
          <h2 style="margin-top: 0;">PAYPAL ESCROW LINKED</h2>
          <p style="color: #a1a1aa; font-size: 0.875rem;">Merchant ID: ${escapeHtml(simulatedMerchantId)}</p>
          <p style="color: #fff; font-size: 0.75rem; margin-top: 1.5rem;">Closing window and syncing with Nexus Core...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage(${payloadJson}, window.location.origin);
            setTimeout(() => window.close(), 1500);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// ============================================================
// RESEND EMAIL DISPATCH & INVITE ROUTES
// ============================================================
authRouter.get('/api/emails/test-connectivity', requireAdmin, async (_req, res) => {
  try {
    const resend = getResend();
    if (!resend) {
      return res.status(400).json({
        connected: false,
        error: 'RESEND_API_KEY is not configured in environment variables.',
      });
    }

    const { data, error } = await resend.domains.list();
    if (error) {
      return res.status(400).json({
        connected: false,
        error: error.message || 'Failed to authenticate with Resend API.',
        details: error,
      });
    }

    res.json({
      connected: true,
      domains: data?.data || [],
      message: 'Resend API key is valid and connected.',
    });
  } catch (e: any) {
    res.status(500).json({ connected: false, error: e.message });
  }
});

authRouter.get('/api/emails/dispatch-logs', requireAdmin, (_req, res) => {
  res.json({ logs: emailLogs });
});

authRouter.post('/api/emails/send-test', requireAdmin, emailLimiter, async (req, res) => {
  const { toEmail, fromDomain = 'thenexuscoreapp.com' } = req.body;
  const fromLine =
    fromDomain === 'onboarding'
      ? 'Nexus Core <onboarding@resend.dev>'
      : 'Nexus Core App <system@thenexuscoreapp.com>';
  const subject = 'Nexus Core // Live Email Diagnostic Test';
  const appUrl = resolveSafeAppOrigin(req);

  try {
    if (!toEmail) {
      return res.status(400).json({ error: 'Recipient email (toEmail) is required.' });
    }

    const resend = getResend();
    if (!resend) {
      recordEmailLog('send-test', toEmail, fromLine, subject, 'SIMULATED', {
        error: 'No RESEND_API_KEY in environment',
      });
      return res.json({
        simulated: true,
        message: 'Simulated email (RESEND_API_KEY missing in server environment).',
      });
    }

    const rawBody = `
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px; font-family: 'SFMono-Regular', Consolas, monospace; text-transform: uppercase; letter-spacing: 1px;">
        <span style="color: #00ffcc;">//</span> Live Email Diagnostic
      </h2>
      <p style="margin: 0 0 20px 0; color: #d4d4d8;">
        If you are reading this transmission, your <strong>Resend API integration</strong> on <strong>Nexus Core</strong> is 100% operational and routing properly through your domain DNS records.
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171d29; border-left: 4px solid #00ffcc; border-radius: 6px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; color: #e4e4e7;">
            <div style="margin-bottom: 8px;"><strong style="color: #8f9cae;">DISPATCH ORIGIN:</strong> ${fromLine.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div style="margin-bottom: 8px;"><strong style="color: #8f9cae;">RECIPIENT TARGET:</strong> ${escapeHtml(toEmail)}</div>
            <div><strong style="color: #8f9cae;">TIMESTAMP (UTC):</strong> ${new Date().toISOString()}</div>
          </td>
        </tr>
      </table>

      <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
        All automated crew invitations, guestlist passes, and VIP loyalty transmissions will utilize this verified master layout.
      </p>
    `;

    const { data, error } = await resend.emails.send({
      from: fromLine,
      to: toEmail,
      subject,
      html: getNexusEmailWrapper(rawBody, 'Resend diagnostic test transmission successful.', appUrl),
    });

    if (error) {
      recordEmailLog('send-test', toEmail, fromLine, subject, 'FAILED', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Resend rejected the email dispatch.',
        resendError: error,
      });
    }

    recordEmailLog('send-test', toEmail, fromLine, subject, 'SUCCESS', data);
    res.json({
      success: true,
      data,
      fromUsed: fromLine,
    });
  } catch (e: any) {
    recordEmailLog('send-test', toEmail || '', fromLine, subject, 'FAILED', {
      message: e.message,
      stack: e.stack,
    });
    res.status(500).json({
      success: false,
      error: e.message || 'An exception occurred while invoking the Resend client.',
      stack: e.stack,
    });
  }
});

authRouter.post('/api/emails/invite', requireAuth, emailLimiter, async (req, res) => {
  const { email, role, bandName, bandId } = req.body;
  const inviterEmail = req.authUser!.email || req.body.inviterEmail || 'A team manager';
  const fromLine = 'Nexus Core App <invites@thenexuscoreapp.com>';
  const subject = `You have been invited to join ${String(bandName || 'a team').replace(/[\r\n]/g, '')} on Nexus Core`;
  const appUrl = resolveSafeAppOrigin(req);

  try {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (bandId) {
      const ownsBand = await assertBandOrEntityOwner(getSupabaseService(), req.authUser!, String(bandId));
      if (!ownsBand) {
        return res.status(403).json({
          error: 'Forbidden: You are not authorized to send team invites for this entity.',
        });
      }
    }

    const resend = getResend();
    if (!resend) {
      recordEmailLog('invite', email || '', fromLine, subject, 'SIMULATED', {
        error: 'No RESEND_API_KEY config',
      });
      return res.json({ simulated: true, message: 'Email simulation successful (no RESEND_API_KEY)' });
    }

    const cleanEmail = email.trim();
    const inviteUrl = `${appUrl}/dev/dashboard?accept_invite=1&email=${encodeURIComponent(cleanEmail)}&role=${encodeURIComponent(role || '')}&band=${encodeURIComponent(bandName || '')}&band_id=${encodeURIComponent(bandId || '')}`;

    const safeInviter = escapeHtml(inviterEmail);
    const safeBandName = escapeHtml(bandName || 'Touring Group');
    const safeRole = escapeHtml(role || 'Staff Operator');
    const safeRecipient = escapeHtml(cleanEmail);

    const rawHtml = `
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 20px; font-family: 'SFMono-Regular', Consolas, monospace; text-transform: uppercase; color: #00ffcc;">[ Crew Invite Active ]</h2>
      <p style="margin: 0 0 16px 0; color: #d4d4d8;">Hello,</p>
      <p style="margin: 0 0 20px 0; color: #d4d4d8; line-height: 1.6;">
        You have been authorized by <strong>${safeInviter}</strong> to activate an operator session. 
        You've been invited to join the <strong>${safeBandName}</strong> workspace as a <strong>${safeRole}</strong>.
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171d29; border: 1px solid #232c3f; border-radius: 8px; margin-bottom: 28px; border-collapse: collapse;">
        <tr>
          <td style="padding: 18px;">
            <div style="font-size: 10px; font-weight: 800; color: #8f9cae; text-transform: uppercase; font-family: 'SFMono-Regular', Consolas, monospace; margin-bottom: 6px; letter-spacing: 1px;">// INTENDED CREW RECIPIENT</div>
            <div style="font-size: 14px; font-weight: bold; color: #ffffff; margin-bottom: 14px; font-family: sans-serif;">${safeRecipient}</div>
            
            <div style="font-size: 10px; font-weight: 800; color: #8f9cae; text-transform: uppercase; font-family: 'SFMono-Regular', Consolas, monospace; margin-bottom: 4px; letter-spacing: 1px;">ROLE CONFIGURATION</div>
            <div style="font-size: 13px; font-weight: bold; color: #a855f7; font-family: sans-serif;">${safeRole}</div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 24px 0; color: #d4d4d8;">
        Click the link below to accept the invitation and set up your account on the secure network. This will open straight to the registration console with your email, role, and workspace parameters prefilled.
      </p>

      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 10px; margin-bottom: 24px;">
        <tr>
          <td align="center" bgcolor="#00ffcc" style="border-radius: 6px;">
            <a href="${escapeHtml(inviteUrl)}" target="_blank" style="display: inline-block; background-color: #00ffcc; color: #080a0f; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-size: 12px; font-weight: 900; line-height: 1.2; text-decoration: none; padding: 15px 30px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid #00ffcc;">
              [ ACTIVATE CREW CONSOLE ]
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0; font-size: 11px; color: #71717a;">
        If you believe you received this routing invitation in error or did not ask to collaborate with ${escapeHtml(bandName || 'this artist')}, please disregard this message safely.
      </p>
    `;

    const { data, error } = await resend.emails.send({
      from: fromLine,
      to: cleanEmail,
      subject,
      html: getNexusEmailWrapper(rawHtml, `Authorized invitation to join ${safeBandName} as ${safeRole}.`, appUrl),
    });

    if (error) {
      recordEmailLog('invite', cleanEmail, fromLine, subject, 'FAILED', error);
      return res.status(400).json({ error });
    }

    recordEmailLog('invite', cleanEmail, fromLine, subject, 'SUCCESS', data);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error('Invite Email Error:', e);
    recordEmailLog('invite', email || '', fromLine, subject, 'FAILED', { message: e.message });
    res.status(500).json({ error: e.message });
  }
});

authRouter.post('/api/emails/guestlist', requireAuth, emailLimiter, async (req, res) => {
  const {
    email,
    guestName,
    bandName,
    bandId,
    showDate,
    venueName,
    passType = 'General',
    additionalCount = 0,
  } = req.body;
  const fromLine = 'Nexus Core App <guestlist@thenexuscoreapp.com>';
  const subject = `Your Guestlist Pass for ${String(bandName || 'the show').replace(/[\r\n]/g, '')}`;
  const appUrl = resolveSafeAppOrigin(req);

  let displayPassType = 'General Guest Entry Pass';
  if (String(passType).toLowerCase() === 'vip') {
    displayPassType = 'VIP Access Pass';
  } else if (String(passType).toLowerCase() === 'crew') {
    displayPassType = 'Crew Member All-Access';
  } else if (String(passType).toLowerCase() === 'media' || String(passType).toLowerCase() === 'press') {
    displayPassType = 'Media & Press Credential';
  }

  const safeAddCount = Math.max(0, Math.min(20, Number(additionalCount) || 0));
  const headcountText =
    safeAddCount > 0
      ? `${displayPassType} (+${safeAddCount} Additional Guests)`
      : `${displayPassType} (1x)`;

  try {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (bandId) {
      const ownsBand = await assertBandOrEntityOwner(getSupabaseService(), req.authUser!, String(bandId));
      if (!ownsBand) {
        return res.status(403).json({
          error: 'Forbidden: You are not authorized to send guestlist passes for this entity.',
        });
      }
    }

    const cleanEmail = email.trim();
    const confirmationUrl = `${appUrl}/?guest_confirm=1&email=${encodeURIComponent(cleanEmail)}&guestName=${encodeURIComponent(guestName || '')}&band=${encodeURIComponent(bandName || '')}&date=${encodeURIComponent(showDate || '')}&venue=${encodeURIComponent(venueName || '')}&pass_type=${encodeURIComponent(passType)}`;

    const resend = getResend();
    if (!resend) {
      recordEmailLog('guestlist', cleanEmail, fromLine, subject, 'SIMULATED', {
        error: 'No RESEND_API_KEY config',
      });
      return res.json({ simulated: true, message: 'Email simulation successful (no RESEND_API_KEY)' });
    }

    const safeGuest = escapeHtml(guestName || 'VIP Guest');
    const safeBand = escapeHtml(bandName || 'the concert');
    const safeVenue = escapeHtml(venueName || '');
    const safeDate = escapeHtml(showDate || '');

    const rawHtml = `
      <h2 style="color: #00ffcc; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px; font-family: 'SFMono-Regular', Consolas, monospace; text-transform: uppercase; text-align: center;">
        [ GUESTLIST ]<br/>
        <span style="font-size: 14px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">- Pass Confirmed -</span>
      </h2>
      <p style="margin: 0 0 16px 0; color: #d4d4d8; text-align: center;">Hello <strong>${safeGuest}</strong>,</p>
      <p style="margin: 0 0 24px 0; color: #d4d4d8; line-height: 1.6; text-align: center;">
        Your credential access has been processed successfully. You are officially listed on the exclusive artist guestlist for <strong>${safeBand}</strong>. See confirmation details below:
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171d29; border: 1px solid #232c3f; border-radius: 8px; margin-bottom: 24px; border-collapse: collapse; margin-left: auto; margin-right: auto;">
        <tr>
          <td style="padding: 20px; text-align: center;" align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
              ${
                safeVenue
                  ? `
              <tr>
                <td style="padding-bottom: 12px; font-family: sans-serif; text-align: center;" align="center">
                  <div style="font-size: 10px; font-weight: 800; color: #8f9cae; text-transform: uppercase; font-family: 'SFMono-Regular', Consolas, monospace; letter-spacing: 1px; text-align: center;">VENUE LOCATION</div>
                  <div style="font-size: 14px; font-weight: bold; color: #ffffff; margin-top: 3px; text-align: center;">${safeVenue}</div>
                </td>
              </tr>
              `
                  : ''
              }
              ${
                safeDate
                  ? `
              <tr>
                <td style="padding-bottom: 12px; font-family: sans-serif; text-align: center;" align="center">
                  <div style="font-size: 10px; font-weight: 800; color: #8f9cae; text-transform: uppercase; font-family: 'SFMono-Regular', Consolas, monospace; letter-spacing: 1px; text-align: center;">EVENT DATE</div>
                  <div style="font-size: 14px; font-weight: bold; color: #ffffff; margin-top: 3px; text-align: center;">${safeDate}</div>
                </td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="font-family: sans-serif; text-align: center;" align="center">
                  <div style="font-size: 10px; font-weight: 800; color: #8f9cae; text-transform: uppercase; font-family: 'SFMono-Regular', Consolas, monospace; letter-spacing: 1px; text-align: center;">CREDENTIAL / PASS TYPE</div>
                  <div style="font-size: 14px; font-weight: bold; color: #a855f7; margin-top: 3px; text-transform: uppercase; text-align: center;">${escapeHtml(headcountText)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="margin-top: 24px; margin-bottom: 24px; text-align: center;">
        <a href="${escapeHtml(confirmationUrl)}" target="_blank" style="display: block; text-decoration: none; padding: 16px 12px; background-color: #080a0f; border: 1px dashed #00ffcc; text-align: center; border-radius: 8px;">
          <div style="font-size: 8px; font-family: 'SFMono-Regular', Consolas, monospace; color: #71717a; margin-bottom: 6px; letter-spacing: 2px; text-transform: uppercase;">SECURE PASS STATUS: CLICK TO ACTIVATE</div>
          <div style="font-size: 11px; font-weight: bold; letter-spacing: 1.5px; color: #00ffcc; font-family: 'SFMono-Regular', Consolas, monospace; text-transform: uppercase; white-space: nowrap;">[ GUESTLIST_ACCESS ]</div>
        </a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5; text-align: center;">
        <strong>Instructions:</strong> Please present a copy of this email state (on your mobile device or printout) along with a valid photo identification card at the venue door, promoter box office, or guestlist check-in station.
      </p>
    `;

    const { data, error } = await resend.emails.send({
      from: fromLine,
      to: cleanEmail,
      subject,
      html: getNexusEmailWrapper(rawHtml, `Your guestlist credentials for ${safeBand} are confirmed.`, appUrl),
    });

    if (error) {
      recordEmailLog('guestlist', cleanEmail, fromLine, subject, 'FAILED', error);
      return res.status(400).json({ error });
    }

    recordEmailLog('guestlist', cleanEmail, fromLine, subject, 'SUCCESS', data);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error('Guestlist Email Error:', e);
    recordEmailLog('guestlist', email || '', fromLine, subject, 'FAILED', { message: e.message });
    res.status(500).json({ error: e.message });
  }
});

authRouter.post('/api/emails/vip-loyalty', requireAuth, emailLimiter, async (req, res) => {
  const { email, fanName, bandName, bandId, discountCode } = req.body;
  const fromLine = 'Nexus Core App <vip@thenexuscoreapp.com>';
  const subject = `Welcome to the VIP List, ${String(fanName || 'Fan').replace(/[\r\n]/g, '')}!`;
  const appUrl = resolveSafeAppOrigin(req);

  try {
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (bandId) {
      const ownsBand = await assertBandOrEntityOwner(getSupabaseService(), req.authUser!, String(bandId));
      if (!ownsBand) {
        return res.status(403).json({
          error: 'Forbidden: You are not authorized to dispatch VIP emails for this entity.',
        });
      }
    }

    const cleanEmail = email.trim();
    const resend = getResend();
    if (!resend) {
      recordEmailLog('vip-loyalty', cleanEmail, fromLine, subject, 'SIMULATED', {
        error: 'No RESEND_API_KEY config',
      });
      return res.json({ simulated: true, message: 'Email simulation successful (no RESEND_API_KEY)' });
    }

    const safeFanName = escapeHtml(fanName || 'VIP Fan');
    const safeBandName = escapeHtml(bandName || 'our touring group');
    const safeDiscountCode = escapeHtml(discountCode || 'VIP10OFF');

    const rawHtml = `
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px; font-family: 'SFMono-Regular', Consolas, monospace; text-transform: uppercase; color: #00ffcc;">[ VIP Fan Club Welcome ]</h2>
      <p style="margin: 0 0 16px 0; color: #d4d4d8;">Hey <strong>${safeFanName}</strong>,</p>
      <p style="margin: 0 0 24px 0; color: #d4d4d8; line-height: 1.6;">
        You are officially registered and approved on the exclusive VIP roster update for <strong>${safeBandName}</strong>! We are deeply grateful for your loyalty and support.
      </p>
      <p style="margin: 0 0 24px 0; color: #d4d4d8; line-height: 1.6;">
        As an authorized VIP member, you will receive first-priority notifications regarding private regional tour updates, exclusive merchandise line previews, and restricted pre-sale passwords.
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #080a0f; border: 1px solid #1f2736; border-radius: 8px; margin-bottom: 24px; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 24px 16px;">
            <div style="font-size: 10px; font-family: 'SFMono-Regular', Consolas, monospace; color: #71717a; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase;">YOUR PERSONAL EXCLUSIVE TOURING DISCOUNT CODE</div>
            <div style="font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #00ffcc; font-family: 'SFMono-Regular', Consolas, monospace; text-shadow: 0 0 10px rgba(0, 255, 204, 0.4); margin: 6px 0 12px 0;">
              ${safeDiscountCode}
            </div>
            <div style="height: 1px; width: 120px; background-color: #1f2736; margin: 0 auto 12px auto;"></div>
            <p style="margin: 0; font-size: 11px; color: #a1a1aa; font-family: sans-serif;">
              Show this transmission at the concert venue merch booth or enter during online checkout.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin: 0; font-size: 11px; color: #71717a;">
        You subscribed willingly via the Nexus Core Fan Kiosk. You may unsubscribe or edit your alert state at any time by replying directly to this thread.
      </p>
    `;

    const { data, error } = await resend.emails.send({
      from: fromLine,
      to: cleanEmail,
      subject,
      html: getNexusEmailWrapper(rawHtml, `Welcome to the exclusive VIP List for ${safeBandName}!`, appUrl),
    });

    if (error) {
      recordEmailLog('vip-loyalty', cleanEmail, fromLine, subject, 'FAILED', error);
      return res.status(400).json({ error });
    }

    recordEmailLog('vip-loyalty', cleanEmail, fromLine, subject, 'SUCCESS', data);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error('VIP Email Error:', e);
    recordEmailLog('vip-loyalty', email || '', fromLine, subject, 'FAILED', { message: e.message });
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// BUG REPORTS & BETA FEEDBACK PERSISTENCE API
// ============================================================
const primaryBugReportsFile = path.join(process.cwd(), 'data', 'bug_reports_cache.json');
const uploadsBugReportsFile = path.join(uploadsDir, 'bug_reports_cache.json');

async function loadCachedBugReports(): Promise<any[]> {
  let primaryData: any[] | null = null;
  let uploadsData: any[] | null = null;

  if (fs.existsSync(primaryBugReportsFile)) {
    try {
      const content = await fs.promises.readFile(primaryBugReportsFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) primaryData = parsed;
      }
    } catch (err) {
      console.warn('[BUG REPORTS CACHE] Primary read warning:', err);
    }
  }

  if (fs.existsSync(uploadsBugReportsFile)) {
    try {
      const content = await fs.promises.readFile(uploadsBugReportsFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) uploadsData = parsed;
      }
    } catch (err) {
      console.warn('[BUG REPORTS CACHE] Uploads read warning:', err);
    }
  }

  const map = new Map<string, any>();
  if (uploadsData) uploadsData.forEach((r) => { if (r && r.id) map.set(r.id, r); });
  if (primaryData) primaryData.forEach((r) => { if (r && r.id) map.set(r.id, r); });

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return merged;
}

async function saveCachedBugReports(reports: any[]): Promise<void> {
  try {
    const dataDir = path.dirname(primaryBugReportsFile);
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }
    const serialized = JSON.stringify(reports, null, 2);
    await fs.promises.writeFile(primaryBugReportsFile, serialized, 'utf8');
    if (fs.existsSync(uploadsDir)) {
      await fs.promises.writeFile(uploadsBugReportsFile, serialized, 'utf8');
    }
  } catch (err) {
    console.warn('[BUG REPORTS CACHE] Write warning:', err);
  }
}

authRouter.get('/api/bug-reports', requireAdmin, async (_req, res) => {
  try {
    const cached = await loadCachedBugReports();
    const supabase = getSupabaseService();
    let dbReports: any[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bug_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (!error && Array.isArray(data)) {
          dbReports = data;
        }
      } catch (_) {}
    }

    const map = new Map<string, any>();
    cached.forEach((r) => { if (r && r.id) map.set(r.id, r); });
    dbReports.forEach((r) => { if (r && r.id) map.set(r.id, { ...(map.get(r.id) || {}), ...r }); });

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    if (combined.length !== cached.length) {
      await saveCachedBugReports(combined);
    }

    res.json({ success: true, count: combined.length, reports: combined });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load bug reports' });
  }
});

authRouter.post('/api/bug-reports', bugReportLimiter, express.json({ limit: '15mb' }), async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.description) {
      return res.status(400).json({ error: 'Bug report description is required' });
    }

    const report = {
      id: payload.id || `bug_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.authUser?.id || payload.user_id || 'anonymous',
      user_name: String(payload.user_name || req.authUser?.email || 'Anonymous User').slice(0, 120),
      user_role: String(payload.user_role || 'Fan').slice(0, 60),
      category: String(payload.category || 'Bug').slice(0, 60),
      severity: String(payload.severity || 'Medium').slice(0, 40),
      description: String(payload.description).slice(0, 5000),
      current_view: String(payload.current_view || 'unknown').slice(0, 200),
      user_agent: String(payload.user_agent || req.headers['user-agent'] || 'unknown').slice(0, 500),
      status: 'Open',
      screenshot_url: payload.screenshot_url || null,
      created_at: payload.created_at || new Date().toISOString(),
    };

    const existing = await loadCachedBugReports();
    const map = new Map<string, any>();
    existing.forEach((r) => { if (r && r.id) map.set(r.id, r); });
    map.set(report.id, report);

    const updated = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    await saveCachedBugReports(updated);

    const supabase = getSupabaseService();
    if (supabase) {
      try {
        await supabase.from('bug_reports').upsert([report], { onConflict: 'id' });
      } catch (sbErr) {
        console.warn('[BUG REPORTS] Supabase sync notice (cached locally):', sbErr);
      }
    }

    res.json({ success: true, report });
  } catch (err: any) {
    console.error('[BUG REPORTS POST ERROR]:', err);
    res.status(500).json({ error: err.message || 'Failed to save bug report' });
  }
});

authRouter.patch('/api/bug-reports/:id', requireAdmin, apiMutationLimiter, express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Missing status field' });

    const existing = await loadCachedBugReports();
    const updated = existing.map((r) => (r.id === id ? { ...r, status } : r));
    await saveCachedBugReports(updated);

    const supabase = getSupabaseService();
    if (supabase) {
      try {
        await supabase.from('bug_reports').update({ status }).eq('id', id);
      } catch (_) {}
    }

    res.json({ success: true, id, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update bug report' });
  }
});

authRouter.delete('/api/bug-reports/:id', requireAdmin, apiMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await loadCachedBugReports();
    const filtered = existing.filter((r) => r.id !== id);
    await saveCachedBugReports(filtered);

    const supabase = getSupabaseService();
    if (supabase) {
      try {
        await supabase.from('bug_reports').delete().eq('id', id);
      } catch (_) {}
    }

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete bug report' });
  }
});

authRouter.post('/api/bug-reports/clear', requireAdmin, apiMutationLimiter, async (_req, res) => {
  try {
    await saveCachedBugReports([]);
    const supabase = getSupabaseService();
    if (supabase) {
      try {
        await supabase.from('bug_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (_) {}
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear bug reports' });
  }
});
