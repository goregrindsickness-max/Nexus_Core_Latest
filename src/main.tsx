import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import { ThemeProvider } from './components/ThemeEngine.tsx';
import "./utils/resetApp";
import { purgeDeletedAndZombieBands } from './lib/communityBands.ts';
import './index.css';
import './focus-overrides.css';

// Purge any stale mock/deleted bands from previous sessions
try {
  purgeDeletedAndZombieBands();
} catch (e) {}


try {
  if (typeof window !== 'undefined' && window.performance && typeof window.performance.measure === 'function') {
    const originalMeasure = window.performance.measure.bind(window.performance);
    window.performance.measure = function(measureName: string, startMarkOrOptions?: string | PerformanceMeasureOptions, endMark?: string) {
      try {
        if (startMarkOrOptions && typeof startMarkOrOptions === 'object') {
          if ((startMarkOrOptions as any).detail !== undefined) {
            try {
              structuredClone((startMarkOrOptions as any).detail);
            } catch (err) {
              startMarkOrOptions = { ...startMarkOrOptions, detail: null };
            }
          }
        }
        return originalMeasure(measureName as any, startMarkOrOptions as any, endMark as any);
      } catch (err) {
        try {
          return originalMeasure(measureName);
        } catch (e2) {
          return {} as PerformanceMeasure;
        }
      }
    };
  }
} catch (e) {}

try {
  const _ls = window.localStorage;
  const safeLocalStorage = {
    getItem: function(key) { try { return _ls.getItem(key); } catch(e) { return null; } },
    setItem: function(key, val) { try { _ls.setItem(key, val); } catch(e) {} },
    removeItem: function(key) { try { _ls.removeItem(key); } catch(e) {} },
    clear: function() { try { _ls.clear(); } catch(e) {} },
    get length() { try { return _ls.length; } catch(e) { return 0; } },
    key: function(i) { try { return _ls.key(i); } catch(e) { return null; } }
  };
  Object.defineProperty(window, 'localStorage', { 
    value: safeLocalStorage,
    configurable: true,
    enumerable: true,
    writable: true 
  });
} catch (e) {
  console.warn("Could not patch localStorage", e);
}


try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key) { const val = localStorage.getItem(key); if (val === "undefined" || val === "null") { localStorage.removeItem(key); } } } } catch(e) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
