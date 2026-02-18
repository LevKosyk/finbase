import { NextResponse } from "next/server";
import { getIncomeStats, getIncomes } from "@/app/actions/income";
import { measureAction } from "@/lib/performance";
import { dashboardIncomeQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  return measureAction("api.dashboard.income.GET", async () => {
    const startedAt = Date.now();
    const url = new URL(req.url);
    const parsed = dashboardIncomeQuerySchema.safeParse({
      q: url.searchParams.get("q") || undefined,
      type: url.searchParams.get("type") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      minAmount: url.searchParams.get("minAmount") || undefined,
      maxAmount: url.searchParams.get("maxAmount") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    const { q, type, startDate, endDate, minAmount, maxAmount } = parsed.data;

    const [incomes, stats] = await Promise.all([
      getIncomes({ q, type, startDate, endDate, minAmount, maxAmount }),
      getIncomeStats(),
    ]);

    const response = NextResponse.json({ incomes, stats });
    response.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    return response;
  });
}
