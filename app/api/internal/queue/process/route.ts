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
  return NextResponse.json({
    ok: true,
    mode: "user-poll-processing",
    note: "Queued jobs are processed when the owner polls /api/jobs/:id.",
  });
}
