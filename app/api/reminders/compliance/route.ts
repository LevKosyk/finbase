import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildObligationsTimeline,
  getRequiredProfileFields,
  validateTaxRules,
} from "@/lib/compliance";

export async function POST(req: Request) {
  const secret = process.env.REMINDERS_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend API Key is missing" }, { status: 500 });
  }

  const users = await prisma.user.findMany({
    include: {
      settings: true,
      notifications: true,
    },
  });

  let sent = 0;
  for (const user of users) {
    if (!user.email || !user.settings) continue;
    if (!user.notifications?.monthlyReport && !user.notifications?.weeklyGovReport) continue;

    const obligations = buildObligationsTimeline(user.settings, new Date(), 2);
    const due = obligations.filter((o) => o.status === "due_soon" || o.status === "overdue").slice(0, 6);
    if (due.length === 0) continue;

    const taxWarnings = validateTaxRules(user.settings);
    const missingFields = getRequiredProfileFields(user.settings);

    const html = `
      <h2>Finbase: нагадування по зобов'язанням</h2>
      <p>ФОП: ${user.settings.legalName || user.name || "-"}</p>
      <h3>Найближчі дедлайни</h3>
      <ul>${due.map((item) => `<li>${item.title}: ${new Date(item.dueDate).toLocaleDateString("uk-UA")} (${item.status})</li>`).join("")}</ul>
      <h3>Податкові попередження</h3>
      <ul>${taxWarnings.map((w) => `<li>${w}</li>`).join("") || "<li>Немає</li>"}</ul>
      <h3>Незаповнені поля</h3>
      <ul>${missingFields.map((f) => `<li>${f}</li>`).join("") || "<li>Немає</li>"}</ul>
    `;

    try {
      await resend.emails.send({
        from: "Finbase <onboarding@resend.dev>",
        to: [user.email],
        subject: "Finbase: календар зобов'язань",
        html,
      });
      sent += 1;
    } catch {
      continue;
    }
  }

  return NextResponse.json({ success: true, sent });
}
