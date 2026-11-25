import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const BUILD_VERSION = String(Date.now());

function nexusBuildVersionPlugin(version: string): Plugin {
  const versionPayload = JSON.stringify(
    {
      version,
      builtAt: new Date(Number(version)).toISOString(),
    },
    null,
    2
  );

  const writePublicVersionFile = () => {
    try {
      const publicDir = path.resolve(__dirname, 'public');
      if (fs.existsSync(publicDir)) {
        fs.writeFileSync(path.join(publicDir, 'version.json'), versionPayload, 'utf-8');
      }
    } catch (_) {}
  };

  return {
    name: 'nexus-build-version-plugin',
    buildStart() {
      writePublicVersionFile();
    },
    configureServer(server) {
      writePublicVersionFile();
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/version.json') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.end(versionPayload);
          return;
        }
        next();
      });
    },
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        if (!fs.existsSync(distDir)) return;
        fs.writeFileSync(path.join(distDir, 'version.json'), versionPayload, 'utf-8');

        // Stamp dist/sw.js with the current build version so every deploy produces a byte-distinct sw.js
        // and immediately triggers the Service Worker install -> skipWaiting -> clientsClaim update flow on iOS.
        const distSwPath = path.join(distDir, 'sw.js');
        if (fs.existsSync(distSwPath)) {
          const swContent = fs.readFileSync(distSwPath, 'utf-8');
          const stampedSw = `// __APP_BUILD_VERSION__: ${version}\n${swContent.replace(/^\/\/ __APP_BUILD_VERSION__:.*\n?/m, '')}`;
          fs.writeFileSync(distSwPath, stampedSw, 'utf-8');
        }
      } catch (_) {}
    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      __APP_BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
    },
    plugins: [react(), tailwindcss(), nexusBuildVersionPlugin(BUILD_VERSION)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      minify: 'esbuild',
      sourcemap: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 5000,
      target: ['es2020', 'chrome87', 'safari14', 'firefox78', 'edge88'],
      rollupOptions: {
        maxParallelFileOps: 1,
        output: {
          manualChunks: undefined,
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
