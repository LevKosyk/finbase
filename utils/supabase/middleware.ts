import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabaseEnv'
import { AUTH_TIME_COOKIE, DEVICE_BIND_COOKIE, SENSITIVE_REAUTH_COOKIE, TWO_FACTOR_CHALLENGE_COOKIE, TWO_FACTOR_SESSION_COOKIE } from '@/lib/auth-cookies'
import { buildDeviceFingerprint } from '@/lib/device-fingerprint'

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured, isValidUrl } = getSupabaseEnv()
  const nonce = btoa(crypto.randomUUID())

  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })
  response.headers.set("x-nonce", nonce)
  response.headers.set(
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "img-src 'self' https: data: blob:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'nonce-${nonce}'`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  )

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
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: options?.sameSite || "lax",
            })
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

  const pathname = request.nextUrl.pathname;
  const hasChallenge = request.cookies.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  const isVerified = request.cookies.get(TWO_FACTOR_SESSION_COOKIE)?.value === "1";
  if (pathname.startsWith("/dashboard") && hasChallenge && !isVerified) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login/2fa";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    const authAt = Number(request.cookies.get(AUTH_TIME_COOKIE)?.value || "0");
    if (!Number.isFinite(authAt) || authAt <= 0 || Date.now() - authAt * 1000 > 1000 * 60 * 60 * 12) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.cookies.delete(TWO_FACTOR_SESSION_COOKIE);
      redirectResponse.cookies.delete(SENSITIVE_REAUTH_COOKIE);
      redirectResponse.cookies.delete(AUTH_TIME_COOKIE);
      redirectResponse.cookies.delete(DEVICE_BIND_COOKIE);
      return redirectResponse;
    }

    const expectedFingerprint = request.cookies.get(DEVICE_BIND_COOKIE)?.value;
    if (expectedFingerprint) {
      const userAgent = request.headers.get("user-agent") || "";
      const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;
      const lang = request.headers.get("accept-language");
      const currentFingerprint = buildDeviceFingerprint({ userAgent, ip, lang });
      if (currentFingerprint !== expectedFingerprint) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.cookies.delete(TWO_FACTOR_SESSION_COOKIE);
        redirectResponse.cookies.delete(SENSITIVE_REAUTH_COOKIE);
        redirectResponse.cookies.delete(DEVICE_BIND_COOKIE);
        redirectResponse.cookies.delete(AUTH_TIME_COOKIE);
        return redirectResponse;
      }
    }
  }

  return response
}
