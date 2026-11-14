import express from 'express';
import { createCorsMiddleware } from './middleware/security';
import { optionalAuth } from './middleware/auth';
import { errorHandler, registerProcessErrorGuards } from './middleware/errorHandler';
import {
  uploadsDir,
  initVapidKeys,
  checkAndSend24hShowReminders,
} from './lib/clients';
import { authRouter } from './routes/auth';
import { bandsRouter } from './routes/bands';
import { showsRouter } from './routes/shows';
import { socialRouter } from './routes/social';
import { paymentsRouter } from './routes/payments';
import { pushRouter } from './routes/push';

export {
  registerProcessErrorGuards,
  authRouter,
  bandsRouter,
  showsRouter,
  socialRouter,
  paymentsRouter,
  pushRouter,
};

export async function configureServerApp(app: express.Express): Promise<void> {
  // Initialize VAPID Web Push keys & gateway
  await initVapidKeys();

  // Global CORS & optional JWT attachment
  app.use(createCorsMiddleware());
  app.use(optionalAuth);

  // Serve persistent uploaded media files before JSON body parsing
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '30d',
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
      },
    })
  );

  // Parse JSON and URL-encoded bodies globally EXCEPT for the Stripe webhook route
  // which requires the raw Buffer for signature verification
  const jsonParser = express.json({ limit: '500mb' });
  const urlencodedParser = express.urlencoded({ limit: '500mb', extended: true });

  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/webhooks/stripe')) {
      return next();
    }
    return jsonParser(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/webhooks/stripe')) {
      return next();
    }
    return urlencodedParser(req, res, next);
  });

  // Mount domain-specific routers
  app.use(authRouter);
  app.use(bandsRouter);
  app.use(showsRouter);
  app.use(socialRouter);
  app.use(paymentsRouter);
  app.use(pushRouter);

  // Centralized API error handler
  app.use(errorHandler);

  // Start background service timer: checks show RSVPs for 24h push reminders every 15 minutes
  setTimeout(() => {
    checkAndSend24hShowReminders().catch((err) =>
      console.warn('[BACKGROUND SHOW REMINDERS STARTUP NOTICE]', err)
    );
  }, 5000);

  setInterval(() => {
    checkAndSend24hShowReminders().catch((err) =>
      console.warn('[BACKGROUND SHOW REMINDERS CRON NOTICE]', err)
    );
  }, 15 * 60 * 1000);
}
