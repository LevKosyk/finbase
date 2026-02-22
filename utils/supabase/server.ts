import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabaseEnv'

export async function createClient() {
  const { url, anonKey, isConfigured, isValidUrl } = getSupabaseEnv()

  const effectiveUrl = isConfigured && isValidUrl ? url : 'https://placeholder.supabase.co'
  const effectiveKey = isConfigured && isValidUrl ? anonKey : 'placeholder'

  const cookieStore = await cookies()

  return createServerClient(
    effectiveUrl,
    effectiveKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
