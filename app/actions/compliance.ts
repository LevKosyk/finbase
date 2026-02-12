"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildDpsChecklist,
  buildObligationsTimeline,
  getRequiredProfileFields,
  validateTaxRules,
} from "@/lib/compliance";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { settings: true }
  });
  if (!dbUser?.settings) return null;

  const settings = dbUser.settings;
  const period = getPeriodDates(settings.reportingPeriod);
  const incomes = await prisma.income.findMany({
    where: { userId: user.id, date: { gte: period.start, lte: period.end } },
  });
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id, date: { gte: period.start, lte: period.end } },
  });

  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = expenses.reduce((acc, i) => acc + i.amount, 0);
  const singleTax = totalIncome * (settings.taxRate || 0) + (settings.fixedMonthlyTax || 0) * period.months;
  const esv = (settings.esvMonthly || 0) * period.months;
  const totalTax = singleTax + esv;

  const taxWarnings = validateTaxRules(settings);
  const missingFields = getRequiredProfileFields(settings);
  const checklist = buildDpsChecklist(taxWarnings, missingFields, incomes.length > 0, expenses.length > 0);
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
}

export async function sendComplianceReminderEmail() {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Resend API Key is missing" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Not authenticated" };

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
}
