import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabaseEnv";

const { url: supabaseUrl, anonKey: supabaseAnonKey, isConfigured, isValidUrl } = getSupabaseEnv();

function buildClient(): SupabaseClient {
  if (isConfigured && isValidUrl) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // Return a minimal stub so the app can render without Supabase credentials.
  const empty = () => Promise.resolve({ data: null, error: null });
  const emptySession = () => Promise.resolve({ data: { session: null }, error: null });
  return {
    auth: {
      getSession: emptySession,
      getUser: empty,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: empty,
      signInWithPassword: empty,
      signUp: empty,
    },
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: empty,
      update: empty,
      delete: empty,
    }),
  } as unknown as SupabaseClient;
}

export const supabase = buildClient();
