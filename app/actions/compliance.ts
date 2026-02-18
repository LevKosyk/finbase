"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";
import {
  buildDpsChecklist,
  buildObligationsTimeline,
  getRequiredProfileFields,
  validateTaxRules,
} from "@/lib/compliance";
import { measureAction } from "@/lib/performance";
import { unstable_cache } from "next/cache";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

function getPeriodDates(period?: string | null, now = new Date()) {
  if (period === "monthly") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      months: 1,
    };
  }
  if (period === "yearly") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      months: 12,
    };
  }
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3;
  return {
    start: new Date(now.getFullYear(), startMonth, 1),
    end: new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999),
    months: 3,
  };
}

export async function getComplianceOverview() {
  return measureAction("action.getComplianceOverview", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await enforceUserFopGroup3(user.id, "action.compliance.overview");

  const redisKey = cacheKey("user", user.id, "compliance-overview");
  return withRedisCache(redisKey, 120, async () => await unstable_cache(
    async () => {
      const settings = await prisma.fOPSettings.findUnique({
        where: { userId: user.id },
      });
      if (!settings) return null;

      const period = getPeriodDates(settings.reportingPeriod);
      const [incomeAgg, expenseAgg, incomeCount, expenseCount] = await Promise.all([
        prisma.income.aggregate({
          where: { userId: user.id, deletedAt: null, date: { gte: period.start, lte: period.end } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { userId: user.id, deletedAt: null, date: { gte: period.start, lte: period.end } },
          _sum: { amount: true },
        }),
        prisma.income.count({
          where: { userId: user.id, deletedAt: null, date: { gte: period.start, lte: period.end } },
        }),
        prisma.expense.count({
          where: { userId: user.id, deletedAt: null, date: { gte: period.start, lte: period.end } },
        }),
      ]);

      const totalIncome = incomeAgg._sum.amount || 0;
      const totalExpenses = expenseAgg._sum.amount || 0;
      const singleTax = totalIncome * (settings.taxRate || 0) + (settings.fixedMonthlyTax || 0) * period.months;
      const esv = (settings.esvMonthly || 0) * period.months;
      const totalTax = singleTax + esv;

      const taxWarnings = validateTaxRules(settings);
      const missingFields = getRequiredProfileFields(settings);
      const checklist = buildDpsChecklist(taxWarnings, missingFields, incomeCount > 0, expenseCount > 0);
      const obligations = buildObligationsTimeline(settings);

      return {
        profile: {
          legalName: settings.legalName,
          group: settings.group,
          reportingPeriod: settings.reportingPeriod || "quarterly",
          taxOffice: settings.taxOffice,
        },
        period,
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          tax: totalTax,
          singleTax,
          esv,
        },
        taxWarnings,
        missingFields,
        checklist,
        obligations,
      };
    },
    [`compliance-overview-${user.id}`],
    { tags: ["compliance-overview", `user-${user.id}`], revalidate: 3600 }
  )());
  }, { budgetMs: 900 });
}

export async function sendComplianceReminderEmail() {
  return measureAction("action.sendComplianceReminderEmail", async () => {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Resend API Key is missing" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Not authenticated" };
  await enforceUserFopGroup3(user.id, "action.compliance.reminder_email");

  const overview = await getComplianceOverview();
  if (!overview) return { success: false, error: "No compliance data" };

  const upcoming = overview.obligations
    .filter((o) => o.status === "due_soon" || o.status === "overdue")
    .slice(0, 10);

  const html = `
    <h2>Finbase: Нагадування по зобов'язанням</h2>
    <p>ФОП: ${overview.profile.legalName || "—"} (група ${overview.profile.group || "—"})</p>
    <p>Дохід: ${overview.totals.income.toLocaleString("uk-UA")} грн</p>
    <p>Податки до сплати: ${overview.totals.tax.toLocaleString("uk-UA")} грн</p>
    <h3>Найближчі дедлайни</h3>
    <ul>
      ${upcoming.map((o) => `<li>${o.title}: ${new Date(o.dueDate).toLocaleDateString("uk-UA")} (${o.status})</li>`).join("")}
    </ul>
    <h3>Попередження</h3>
    <ul>
      ${overview.taxWarnings.map((w) => `<li>${w}</li>`).join("") || "<li>Немає</li>"}
    </ul>
  `;

  try {
    await resend.emails.send({
      from: "Finbase <onboarding@resend.dev>",
      to: [user.email],
      subject: "Finbase: нагадування про зобов'язання",
      html,
    });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send reminder email" };
  }
  }, { budgetMs: 1200 });
}
