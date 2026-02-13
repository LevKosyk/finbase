import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabaseEnv'

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured, isValidUrl } = getSupabaseEnv()

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!isConfigured || !isValidUrl) {
    return response
  }

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  try {
    await supabase.auth.getUser()
  } catch {
    // Supabase can be temporarily unavailable or misconfigured in local env.
    // Do not break all routes from middleware in this case.
    return response
  }

  return response
}
