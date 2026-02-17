import { NextResponse } from "next/server";
import { getStatementImports } from "@/app/actions/bank";
import { measureAction } from "@/lib/performance";

export async function GET() {
  return measureAction("api.dashboard.bank-imports.GET", async () => {
    const startedAt = Date.now();
    const imports = await getStatementImports();
    const response = NextResponse.json({ imports });
    response.headers.set("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    return response;
  });
}
