import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_: Request, { params }: Params) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: {
      id: true,
      title: true,
      isPinned: true,
      archivedAt: true,
      lastUsedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title || "Новий чат",
      isPinned: session.isPinned,
      archivedAt: session.archivedAt,
      lastUsedAt: session.lastUsedAt,
      messages: session.messages.map((item) => ({
        id: item.id,
        role: item.role,
        content: item.content,
        createdAt: item.createdAt,
      })),
    },
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.aIChatSession.delete({ where: { id: session.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: Params) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.aIChatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    isPinned?: boolean;
    archived?: boolean;
  };

  const nextTitle = typeof body.title === "string" ? sanitizeText(body.title, 80) : undefined;
  const nextPinned = typeof body.isPinned === "boolean" ? body.isPinned : undefined;
  const nextArchived =
    typeof body.archived === "boolean"
      ? body.archived
        ? new Date()
        : null
      : undefined;

  const updated = await prisma.aIChatSession.update({
    where: { id: session.id },
    data: {
      ...(nextTitle !== undefined ? { title: nextTitle || "Новий чат" } : {}),
      ...(nextPinned !== undefined ? { isPinned: nextPinned } : {}),
      ...(nextArchived !== undefined ? { archivedAt: nextArchived } : {}),
    },
    select: {
      id: true,
      title: true,
      isPinned: true,
      archivedAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({
    session: {
      id: updated.id,
      title: updated.title || "Новий чат",
      isPinned: updated.isPinned,
      archivedAt: updated.archivedAt,
      lastUsedAt: updated.lastUsedAt,
    },
  });
}
