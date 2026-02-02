import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { prisma } from "@/lib/prisma"; // твой Prisma client

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const access_token = searchParams.get("access_token");

  if (!access_token) return NextResponse.redirect("/app/login");

  const { data: { user }, error } = await supabase.auth.getUser(access_token);

  if (error || !user || !user.email) return NextResponse.redirect(new URL("/login", req.url));

  // Создаем или обновляем запись в User
  await prisma.user.upsert({
    where: { email: user.email! },
    update: {
      name: user.user_metadata.full_name || user.email,
    },
    create: {
      email: user.email!,
      name: user.user_metadata.full_name || user.email,
    },
  });

  return NextResponse.redirect("/app/dashboard");
}
