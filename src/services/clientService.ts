export {
  supabase,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  SUPABASE_URL,
  SUPABASE_KEY,
  rawClient,
  setQueryBuilderWrapper,
  getActivePortalType,
  getSupabaseUrlForPortal,
  getSupabaseAnonKeyForPortal,
  getSupabaseUrl,
  getSupabaseAnonKey,
  clearSupabaseClientsCache,
  getRawSupabase,
  ensureValidSupabaseAuthSession,
  getSupabase,
} from '../lib/supabaseClient';
export type { SupabaseClient } from '../lib/supabaseClient';
