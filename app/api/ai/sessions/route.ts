import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const qRaw = sanitizeText(searchParams.get("q") || "", 80);
  const q = qRaw.trim();
  const includeArchived = searchParams.get("includeArchived") === "1";

  const sessions = await prisma.aIChatSession.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { archivedAt: null }),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { messages: { some: { content: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: { lastUsedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      isPinned: true,
      archivedAt: true,
      lastUsedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      })
      .map((session) => ({
        id: session.id,
        title: session.title || "Новий чат",
        isPinned: session.isPinned,
        archivedAt: session.archivedAt,
        lastUsedAt: session.lastUsedAt,
        messageCount: session._count.messages,
      })),
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const title = sanitizeText(body.title || "", 80);

  const session = await prisma.aIChatSession.create({
    data: {
      userId: user.id,
      title: title || "Новий чат",
    },
    select: { id: true, title: true, isPinned: true, archivedAt: true, lastUsedAt: true },
  });

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title || "Новий чат",
      isPinned: session.isPinned,
      archivedAt: session.archivedAt,
      lastUsedAt: session.lastUsedAt,
    },
  });
}
