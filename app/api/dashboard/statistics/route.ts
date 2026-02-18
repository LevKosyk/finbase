import { NextResponse } from "next/server";
import { getStatistics } from "@/app/actions/statistics";
import { measureAction } from "@/lib/performance";
import { dashboardStatisticsQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  return measureAction("api.dashboard.statistics.GET", async () => {
    const startedAt = Date.now();
    const url = new URL(req.url);
    const parsed = dashboardStatisticsQuerySchema.safeParse({
      period: url.searchParams.get("period") || "year",
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    const { period, from, to } = parsed.data;

    const stats = await getStatistics(period, from, to);
    const response = NextResponse.json({ stats });
    response.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    response.headers.set("Cache-Control", "private, max-age=45, stale-while-revalidate=180");
    return response;
  }, { budgetMs: 900 });
}
