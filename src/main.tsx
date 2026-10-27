import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import { ThemeProvider } from './components/ThemeEngine.tsx';
import "./utils/resetApp";
import { purgeDeletedAndZombieBands } from './lib/communityBands.ts';
import './index.css';
import './focus-overrides.css';
import { bugMonitor } from './services/bugMonitorService';

// Initialize Shake & Instabug autonomous bug observation engine
try {
  bugMonitor.init();
} catch (e) {}

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
  // Test if window.localStorage is accessible
  window.localStorage.getItem('__nexus_storage_test__');
} catch (e) {
  console.warn("Storage access restricted, installing in-memory fallback");
  try {
    const memStorage: Record<string, string> = {};
    const safeMemStorage = {
      getItem: (key: string) => memStorage[key] ?? null,
      setItem: (key: string, val: string) => { memStorage[key] = String(val); },
      removeItem: (key: string) => { delete memStorage[key]; },
      clear: () => { Object.keys(memStorage).forEach(k => delete memStorage[k]); },
      get length() { return Object.keys(memStorage).length; },
      key: (i: number) => Object.keys(memStorage)[i] ?? null
    };
    Object.defineProperty(window, 'localStorage', { 
      value: safeMemStorage,
      configurable: true,
      writable: true 
    });
  } catch (err) {}
}

try { 
  const invalidKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) { 
    const key = localStorage.key(i); 
    if (key) { 
      const val = localStorage.getItem(key); 
      if (val === "undefined" || val === "null") { 
        invalidKeys.push(key); 
      } 
    } 
  }
  invalidKeys.forEach(k => localStorage.removeItem(k));
} catch(e) {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
