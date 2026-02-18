import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  return token === secret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
  const queueRes = await fetch(`${baseUrl}/api/internal/queue/process?limit=10`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
    },
    cache: "no-store",
  });

  const queueJson = await queueRes.json().catch(() => ({}));

  return NextResponse.json({
    ok: queueRes.ok,
    queue: queueJson,
    ranAt: new Date().toISOString(),
  });
}
