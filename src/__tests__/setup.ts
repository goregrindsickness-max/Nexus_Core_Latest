import { beforeEach, vi } from 'vitest';
import {
  localStorageMock,
  sessionStorageMock,
  resetStorageMocks,
} from './mocks/localStorageMock';
import * as supabaseMockModule from './mocks/supabaseMock';
import {
  mockStripeClient,
  resetStripeMock,
  TEST_STRIPE_SECRET_KEY,
  TEST_STRIPE_WEBHOOK_SECRET,
} from './mocks/stripeMock';

// 1. Deterministic offline environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = supabaseMockModule.DEFAULT_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = supabaseMockModule.DEFAULT_SUPABASE_ANON_KEY;
process.env.SUPABASE_URL = supabaseMockModule.DEFAULT_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = supabaseMockModule.DEFAULT_SUPABASE_ANON_KEY;
process.env.STRIPE_SECRET_KEY = TEST_STRIPE_SECRET_KEY;
process.env.STRIPE_WEBHOOK_SECRET = TEST_STRIPE_WEBHOOK_SECRET;

// 2. Attach deterministic localStorage and sessionStorage to globalThis & window
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

if (typeof (globalThis as any).window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
      location: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/',
        reload: vi.fn(),
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      CustomEvent: class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, params?: { detail?: any }) {
          this.type = type;
          this.detail = params?.detail;
        }
      },
    },
    writable: true,
    configurable: true,
  });
}

if (typeof (globalThis as any).navigator !== 'undefined') {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true,
  });
} else {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });
}

// 3. Mock canonical Supabase client module so all imports resolve offline
vi.mock('@/src/lib/supabaseClient', () => supabaseMockModule);
vi.mock('../lib/supabaseClient', () => supabaseMockModule);

// 4. Mock Stripe SDK constructor to return our deterministic mockStripeClient
vi.mock('stripe', () => {
  const StripeMockConstructor = vi.fn().mockImplementation(function () {
    return mockStripeClient;
  });
  return {
    default: StripeMockConstructor,
    Stripe: StripeMockConstructor,
  };
});

// 5. Reset all deterministic stores and spies before every test
beforeEach(() => {
  resetStorageMocks();
  supabaseMockModule.resetSupabaseMockStore();
  resetStripeMock();
});
