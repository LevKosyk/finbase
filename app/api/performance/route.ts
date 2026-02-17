import { NextResponse } from "next/server";
import { getPerfRecent, summarizePerf } from "@/lib/performance";
import { performanceQuerySchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/rbac";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const parsed = performanceQuerySchema.safeParse({ limit: url.searchParams.get("limit") || 200 });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const records = await getPerfRecent(parsed.data.limit);
  const summary = summarizePerf(records);

  return NextResponse.json({
    goals: {
      LCP: 2500,
      CLS: 0.1,
      TTFB_dashboard: 600,
    },
    capturedEvents: records.length,
    bottlenecks: summary.slice(0, 20),
    latest: records.slice(0, 40),
  });
}
