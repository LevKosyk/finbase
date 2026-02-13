function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const url = stripQuotes(rawUrl);
  const anonKey = stripQuotes(rawAnonKey);
  const isValidUrl = /^https?:\/\//i.test(url);

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
    isValidUrl,
  };
}
