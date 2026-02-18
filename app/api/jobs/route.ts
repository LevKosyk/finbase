import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { enqueueAsyncJob } from "@/lib/async-jobs";
import { enforceRateLimit } from "@/lib/security";
import { checkAndStoreIdempotency } from "@/lib/idempotency";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const burst = await enforceRateLimit(`jobs:create:burst:${user.id}:${ip}`, 20, 60);
  if (!burst.allowed) {
    return NextResponse.json({ error: "Too many job requests" }, { status: 429 });
  }

  const body = (await req.json()) as {
    type?: string;
    payload?: {
      rows?: Array<{
        date: string;
        amount: number;
        description?: string;
        counterparty?: string;
        currency?: string;
        direction?: "income" | "expense" | "";
      }>;
      fileName?: string;
      idempotencyKey?: string;
    };
    idempotencyKey?: string;
  };

  if (body.type !== "bank_import") {
    return NextResponse.json({ error: "Unsupported job type" }, { status: 400 });
  }

  const rows = body.payload?.rows || [];
  const fileName = body.payload?.fileName || "statement";
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Rows are required" }, { status: 400 });
  }

  const idem = await checkAndStoreIdempotency({
    scope: "api.jobs.bank_import",
    userId: user.id,
    key: body.idempotencyKey || body.payload?.idempotencyKey,
    ttlSeconds: 60 * 30,
  });
  if (!idem.ok && idem.duplicate) {
    return NextResponse.json({ error: "Duplicate request" }, { status: 409 });
  }

  const enqueued = await enqueueAsyncJob({
    type: "bank_import",
    userId: user.id,
    payload: {
      rows,
      fileName,
      idempotencyKey: body.payload?.idempotencyKey,
    },
  });

  if (!enqueued.ok) {
    return NextResponse.json({ error: enqueued.error || "Failed to enqueue job" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId: enqueued.jobId }, { status: 202 });
}
