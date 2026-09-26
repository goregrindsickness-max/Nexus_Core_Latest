import { createClient } from '@supabase/supabase-js';

// Production Supabase project defaults (ensures APK / mobile builds without .env never break)
const DEFAULT_SUPABASE_URL = 'https://cyjnpuneruonskfzpmqo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5am5wdW5lcnVvbnNrZnpwbXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTA1NjIsImV4cCI6MjA5NTQyNjU2Mn0.94h4Ao-cpLXwU8xxJsKln0iud2wOw746yZlAdFP2gDM';

const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process?.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) || '';
const envKey = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process?.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) || '';

const supabaseUrl = (envUrl || '').trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (envKey || '').trim() || DEFAULT_SUPABASE_ANON_KEY;

if (!envUrl || !envKey) {
  console.info('[Supabase Singleton] Active with built-in default project connection for Nexus Core.');
}

// Single exported instance across the entire app bundle
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'nexus_core_auth_token', // Unique explicit storage key
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

export default supabase;

