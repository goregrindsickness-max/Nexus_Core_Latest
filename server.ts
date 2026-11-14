import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import {
  configureServerApp,
  registerProcessErrorGuards,
} from './server/index';

// Prevent unhandled exceptions from crashing the Node process
registerProcessErrorGuards();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Register shared middleware, domain routers, and background services
  await configureServerApp(app);

  // Vite middleware for development or static bundle serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('sw.js')) {
            res.setHeader(
              'Cache-Control',
              'no-cache, no-store, must-revalidate, max-age=0'
            );
            res.setHeader('Service-Worker-Allowed', '/');
          } else if (filePath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );

    app.all(/.*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error(
    '[CRITICAL SERVER STARTUP ERROR STACK]:',
    err && err.stack ? err.stack : err
  );
  process.exit(1);
});
