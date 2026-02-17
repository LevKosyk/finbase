import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { expenseDataSchema } from "@/lib/validation";
import { invalidateUserCache } from "@/lib/redis-cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { logAuditEvent } from "@/lib/audit-log";
import { enforceRateLimit } from "@/lib/security";
import { checkAndStoreIdempotency } from "@/lib/idempotency";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const burst = await enforceRateLimit(`api:expenses:create:burst:${user.id}:${ip}`, 20, 60);
  if (!burst.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const raw = await req.json();
  const parsed = expenseDataSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const idem = await checkAndStoreIdempotency({
    scope: "api.expenses.create",
    userId: user.id,
    key: req.headers.get("x-idempotency-key"),
  });
  if (!idem.ok && idem.duplicate) {
    return NextResponse.json({ error: "Duplicate request" }, { status: 409 });
  }

  const created = await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      date: parsed.data.date,
      description: parsed.data.description,
    },
  });

  await invalidateUserCache(user.id);
  revalidatePath("/dashboard/expenses");
  revalidateTag("dashboard-stats", "max");
  await logAuditEvent({
    userId: user.id,
    action: "expense.create",
    entityType: "expense",
    entityId: created.id,
  });

  return NextResponse.json({ success: true, expense: created });
}
