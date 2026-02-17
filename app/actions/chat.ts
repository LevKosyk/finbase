"use server";

import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INTERFACE_HELP: Record<string, string> = {
  "/dashboard": "Користувач на головному дашборді. Допомагай читати KPI, ризик-скор, ліміти та підказуй next step.",
  "/dashboard/income": "Користувач у розділі доходів. Пропонуй як додати/імпортувати доходи, пояснюй фільтри та якість даних.",
  "/dashboard/expenses": "Користувач у розділі витрат. Допомагай з категоріями, оптимізацією та імпортом.",
  "/dashboard/bank": "Користувач у розділі банківської виписки. Пояснюй імпорт CSV/XLSX, дублікати, правила категоризації.",
  "/dashboard/rules": "Користувач у правилах категоризації. Допомагай формувати умови правил і пріоритети.",
  "/dashboard/documents": "Користувач у генераторі документів. Пояснюй які поля обов'язкові та що краще вибрати перед експортом.",
  "/dashboard/statistics": "Користувач у статистиці. Пояснюй метрики, тренди і практичні дії на основі даних.",
  "/dashboard/settings": "Користувач у налаштуваннях. Пояснюй, які поля критично заповнити для коректних розрахунків і звітності.",
};

function resolveUiHint(pathname: string) {
  const exact = INTERFACE_HELP[pathname];
  if (exact) return exact;

  const matched = Object.entries(INTERFACE_HELP).find(([key]) => pathname.startsWith(key));
  return matched?.[1] || "Користувач у загальному інтерфейсі Finbase. Допомагай кроками в межах UI.";
}

function toSafeMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system"))
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").trim().slice(0, 1800),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-14);
}

function formatUAH(value: number) {
  return value.toLocaleString("uk-UA");
}

export async function getAIResponse(messages: ChatMessage[], currentPath?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeMessages = toSafeMessages(messages);
  if (safeMessages.length === 0) {
    return { error: "Empty message history" };
  }

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          subscription: { select: { plan: true } },
          settings: {
            select: {
              group: true,
              taxRate: true,
              fixedMonthlyTax: true,
              esvMonthly: true,
              incomeLimit: true,
            },
          },
        },
      })
    : null;

  const [monthIncomeAgg, monthExpenseAgg, yearIncomeAgg, monthTopIncome] = user
    ? await Promise.all([
        prisma.income.aggregate({
          where: { userId: user.id, deletedAt: null, date: { gte: monthStart } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { userId: user.id, deletedAt: null, date: { gte: monthStart } },
          _sum: { amount: true },
        }),
        prisma.income.aggregate({
          where: { userId: user.id, deletedAt: null, date: { gte: yearStart } },
          _sum: { amount: true },
        }),
        prisma.income.findFirst({
          where: { userId: user.id, deletedAt: null, date: { gte: monthStart } },
          orderBy: { amount: "desc" },
          select: { source: true, amount: true },
        }),
      ])
    : [
        { _sum: { amount: 0 } },
        { _sum: { amount: 0 } },
        { _sum: { amount: 0 } },
        null,
      ];

  const totalYearIncome = Number(yearIncomeAgg._sum.amount || 0);
  const totalMonthIncome = Number(monthIncomeAgg._sum.amount || 0);
  const totalMonthExpenses = Number(monthExpenseAgg._sum.amount || 0);
  const monthNet = totalMonthIncome - totalMonthExpenses;

  const taxRate = dbUser?.settings?.taxRate || 0;
  const fixedMonthlyTax = dbUser?.settings?.fixedMonthlyTax || 0;
  const esvMonthly = dbUser?.settings?.esvMonthly || 0;
  const estimatedMonthlyTax = totalMonthIncome * taxRate + fixedMonthlyTax + esvMonthly;

  const limit = dbUser?.settings?.incomeLimit || 0;
  const limitPercent = limit > 0 ? (totalYearIncome / limit) * 100 : 0;
  const topIncomeSource = monthTopIncome
    ? { name: monthTopIncome.source, value: monthTopIncome.amount }
    : null;

  const path = currentPath || "/dashboard";
  const uiHint = resolveUiHint(path);

  const systemContext = `
Ти Finbase AI — практичний фінансовий асистент для ФОП в Україні.
Відповідай українською, стисло і предметно.

ПРАВИЛА ВІДПОВІДІ:
- Завжди давай конкретну дію в інтерфейсі (куди перейти і що натиснути).
- Якщо даних недостатньо, чітко скажи що саме треба додати.
- Не вигадуй закони і не давай категоричних юридичних гарантій.
- Якщо питання про податки, рахуй лише за поточними налаштуваннями користувача.

КОНТЕКСТ КОРИСТУВАЧА:
- User: ${dbUser?.name || "Guest"}
- План: ${dbUser?.subscription?.plan || "Guest"}
- Група ФОП: ${dbUser?.settings?.group || "не задано"}
- Налаштована ставка податку: ${taxRate > 0 ? `${(taxRate * 100).toFixed(2)}%` : "не задано"}
- Фіксований податок/міс: ${formatUAH(fixedMonthlyTax)} грн
- ЄСВ/міс: ${formatUAH(esvMonthly)} грн
- Дохід за цей місяць: ${formatUAH(totalMonthIncome)} грн
- Витрати за цей місяць: ${formatUAH(totalMonthExpenses)} грн
- Чистий результат за місяць: ${formatUAH(monthNet)} грн
- Оціночний податок за місяць: ${formatUAH(estimatedMonthlyTax)} грн
- Дохід за рік: ${formatUAH(totalYearIncome)} грн
- Річний ліміт: ${limit > 0 ? `${formatUAH(limit)} грн (${limitPercent.toFixed(1)}% використано)` : "не задано"}
- Топ-джерело доходу за місяць: ${topIncomeSource ? `${topIncomeSource.name} (${formatUAH(topIncomeSource.value)} грн)` : "немає"}

КОНТЕКСТ ІНТЕРФЕЙСУ:
- Поточна сторінка: ${path}
- Підказка для UI: ${uiHint}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [{ role: "system", content: systemContext }, ...safeMessages],
    });

    return {
      role: "assistant" as const,
      content: response.choices[0].message.content || "Не вдалося сформувати відповідь.",
    };
  } catch (error) {
    console.error("OpenAI Error:", error);
    return { error: "Failed to get AI response. Check API Key." };
  }
}
