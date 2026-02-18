import { NextResponse } from "next/server";
import { getExpenseStats, getExpenses } from "@/app/actions/expenses";
import { measureAction } from "@/lib/performance";
import { dashboardExpensesQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  return measureAction("api.dashboard.expenses.GET", async () => {
    const startedAt = Date.now();
    const url = new URL(req.url);
    const parsed = dashboardExpensesQuerySchema.safeParse({
      q: url.searchParams.get("q") || undefined,
      category: url.searchParams.get("category") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      minAmount: url.searchParams.get("minAmount") || undefined,
      maxAmount: url.searchParams.get("maxAmount") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    const { q, category, startDate, endDate, minAmount, maxAmount } = parsed.data;

    const [expenses, stats] = await Promise.all([
      getExpenses({ q, category, startDate, endDate, minAmount, maxAmount }),
      getExpenseStats(),
    ]);

    const response = NextResponse.json({ expenses, stats });
    response.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    return response;
  });
}
