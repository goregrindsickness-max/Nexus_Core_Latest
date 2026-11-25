import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

declare const __APP_BUILD_VERSION__: string | undefined;

const THROTTLE_INTERVAL_MS = 30_000;
const RELOAD_GUARD_SESSION_KEY = 'nexus_reloaded_for_build_version';

function isNativeCapacitorRuntime(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
    if (typeof window === 'undefined') return false;
    const proto = window.location?.protocol || '';
    const origin = window.location?.origin || '';
    const port = window.location?.port || '';
    return (
      proto === 'capacitor:' ||
      proto === 'ionic:' ||
      proto === 'file:' ||
      (origin === 'https://localhost' && !port)
    );
  } catch {
    return false;
  }
}

export function useAppVersionCheck(): void {
  const lastCheckTimeRef = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isNativeCapacitorRuntime()) {
      return;
    }

    const currentVersion =
      typeof __APP_BUILD_VERSION__ !== 'undefined' ? String(__APP_BUILD_VERSION__).trim() : '';

    const checkVersionAndUpdate = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastCheckTimeRef.current < THROTTLE_INTERVAL_MS) {
        return;
      }
      if (isCheckingRef.current) return;

      isCheckingRef.current = true;
      lastCheckTimeRef.current = now;

      try {
        // 1. Prompt Service Worker registration to check for an updated sw.js
        if ('serviceWorker' in navigator && typeof navigator.serviceWorker.getRegistrations === 'function') {
          navigator.serviceWorker
            .getRegistrations()
            .then((regs) => {
              regs.forEach((reg) => {
                if (reg.waiting) {
                  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                if (typeof reg.update === 'function') {
                  reg.update().catch(() => {});
                }
              });
            })
            .catch(() => {});
        }

        // 2. Fetch latest build version manifest bypassing all browser/iOS caches
        const res = await fetch(`/version.json?t=${now}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const remoteVersion = data?.version ? String(data.version).trim() : '';

        if (!remoteVersion || !currentVersion || remoteVersion === currentVersion) {
          return;
        }

        // Prevent reload loops if a proxy/CDN momentarily serves a mismatched HTML shell
        try {
          const alreadyReloadedFor = sessionStorage.getItem(RELOAD_GUARD_SESSION_KEY);
          if (alreadyReloadedFor === remoteVersion) {
            return;
          }
          sessionStorage.setItem(RELOAD_GUARD_SESSION_KEY, remoteVersion);
        } catch (_) {}

        // 3. Purge all Cache Storage entries before reloading onto the new build
        if ('caches' in window) {
          try {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((key) => caches.delete(key)));
          } catch (_) {}
        }

        // 4. Reload to boot the latest deployed HTML & bundle
        window.location.reload();
      } catch (_) {
        // Network offline or transient error — ignore silently
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check on mount
    void checkVersionAndUpdate(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkVersionAndUpdate(false);
      }
    };

    const handleWindowFocus = () => {
      void checkVersionAndUpdate(false);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // iOS Safari BFCache restoration
      if (event.persisted || document.visibilityState === 'visible') {
        void checkVersionAndUpdate(Boolean(event.persisted));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
}
