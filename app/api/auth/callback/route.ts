import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { getSupabaseEnv } from "@/lib/supabaseEnv";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  const { url, anonKey, isConfigured, isValidUrl } = getSupabaseEnv();
  if (!isConfigured || !isValidUrl) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.user_metadata.full_name || user.user_metadata.name || user.email,
      avatarUrl: user.user_metadata.avatar_url || null,
    },
    create: {
      id: user.id,
      email: user.email,
      name: user.user_metadata.full_name || user.user_metadata.name || user.email,
      firstName: user.user_metadata.first_name || null,
      lastName: user.user_metadata.last_name || null,
      avatarUrl: user.user_metadata.avatar_url || null,
    },
  });

  return NextResponse.redirect(new URL("/dashboard", origin));
}

