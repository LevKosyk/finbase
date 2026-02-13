import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabaseEnv";

const { url: supabaseUrl, anonKey: supabaseAnonKey, isConfigured, isValidUrl } = getSupabaseEnv();
if (!isConfigured || !isValidUrl) {
  throw new Error("Supabase client env is invalid. Check NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
