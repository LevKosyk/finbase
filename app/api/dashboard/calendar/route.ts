import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { buildObligationsTimeline } from "@/lib/compliance";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await enforceUserFopGroup3(user.id, "api.calendar.get");

  const url = new URL(req.url);
  const months = Math.min(Math.max(Number(url.searchParams.get("months") || "6"), 1), 24);
  const offsetMonths = Math.min(Math.max(Number(url.searchParams.get("offsetMonths") || "0"), 0), 60);

  const settings = await prisma.fOPSettings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    return NextResponse.json({ obligations: [] });
  }

  const anchorDate = new Date();
  anchorDate.setMonth(anchorDate.getMonth() + offsetMonths);

  const obligations = buildObligationsTimeline(settings, anchorDate, months).map((item) => ({
    id: `${item.type}-${item.dueDate.toISOString()}`,
    title: item.title,
    type: item.type,
    dueDate: item.dueDate.toISOString(),
    status: item.status,
    description: item.description,
  }));

  return NextResponse.json({
    obligations,
    meta: {
      months,
      offsetMonths,
      count: obligations.length,
    },
  });
}
