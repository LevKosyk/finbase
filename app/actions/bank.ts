"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getExpenseCategories } from "@/app/actions/expenses";

export interface BankStatementRow {
  date: string;
  amount: number;
  description?: string;
  counterparty?: string;
  currency?: string;
  direction?: "income" | "expense" | "";
}

function normalizeText(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function safeDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function determineDirection(row: BankStatementRow): "income" | "expense" | null {
  if (row.direction === "income" || row.direction === "expense") return row.direction;
  if (!Number.isFinite(row.amount) || row.amount === 0) return null;
  return row.amount > 0 ? "income" : "expense";
}

function fingerprint(row: {
  date: Date;
  amount: number;
  direction: "income" | "expense";
  counterparty?: string;
  description?: string;
}) {
  const date = row.date.toISOString().slice(0, 10);
  return [
    date,
    row.direction,
    Math.abs(row.amount).toFixed(2),
    normalizeText(row.counterparty),
    normalizeText(row.description),
  ].join("|");
}

function keywordCategory(text: string) {
  const t = normalizeText(text);
  if (/(tax|подат|єсв|дпс)/.test(t)) return "Податки";
  if (/(fuel|палив|uber|bolt|таксі|transport|транспорт)/.test(t)) return "Транспорт";
  if (/(office|канц|printer|paper|офіс)/.test(t)) return "Офіс";
  if (/(meta|google|ads|реклам|маркет)/.test(t)) return "Маркетинг";
  if (/(hosting|aws|gcp|github|openai|chatgpt|subscription|підпис)/.test(t)) return "Підписки";
  if (/(electric|water|gas|комун|utility)/.test(t)) return "Комунальні";
  return "";
}

function pickSource(counterparty?: string, description?: string) {
  return counterparty?.trim() || description?.trim() || "Bank transfer";
}

export async function importBankStatement(rows: BankStatementRow[], fileName = "statement") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const rules = await prisma.categorizationRule.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  const expenseCategories = await getExpenseCategories();
  const defaultExpenseCategory = expenseCategories[0] || "Інше";

  const [existingIncome, existingExpense] = await Promise.all([
    prisma.income.findMany({
      where: { userId: user.id },
      select: { date: true, amount: true, source: true, type: true }
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      select: { date: true, amount: true, description: true, category: true }
    }),
  ]);

  const known = new Set<string>();
  for (const i of existingIncome) {
    known.add(
      fingerprint({
        date: i.date,
        amount: i.amount,
        direction: "income",
        counterparty: i.source,
        description: i.type,
      })
    );
  }
  for (const e of existingExpense) {
    known.add(
      fingerprint({
        date: e.date,
        amount: -Math.abs(e.amount),
        direction: "expense",
        counterparty: e.category,
        description: e.description || "",
      })
    );
  }

  const incomePayload: Array<{
    userId: string;
    amount: number;
    source: string;
    date: Date;
    type: string;
    status: string;
  }> = [];
  const expensePayload: Array<{
    userId: string;
    amount: number;
    category: string;
    date: Date;
    description?: string;
  }> = [];

  let duplicates = 0;
  let skipped = 0;
  const localSet = new Set<string>();

  for (const row of rows) {
    const date = safeDate(row.date);
    const direction = determineDirection(row);
    if (!date || !direction || !Number.isFinite(row.amount)) {
      skipped += 1;
      continue;
    }

    const lineFingerprint = fingerprint({
      date,
      amount: row.amount,
      direction,
      counterparty: row.counterparty,
      description: row.description,
    });
    if (known.has(lineFingerprint) || localSet.has(lineFingerprint)) {
      duplicates += 1;
      continue;
    }
    localSet.add(lineFingerprint);

    const combinedText = `${row.counterparty || ""} ${row.description || ""}`;
    const matchedRule = rules.find((rule) => {
      if (rule.direction !== "auto" && rule.direction !== direction) return false;
      const containsMatch = rule.containsText
        ? normalizeText(combinedText).includes(normalizeText(rule.containsText))
        : true;
      const counterpartyMatch = rule.counterpartyContains
        ? normalizeText(row.counterparty).includes(normalizeText(rule.counterpartyContains))
        : true;
      return containsMatch && counterpartyMatch;
    });

    if (direction === "income") {
      incomePayload.push({
        userId: user.id,
        amount: Math.abs(row.amount),
        source: pickSource(row.counterparty, row.description),
        date,
        type: matchedRule?.category || "bank_transfer",
        status: "completed",
      });
    } else {
      const fromKeyword = keywordCategory(combinedText);
      const category = matchedRule?.category || fromKeyword || defaultExpenseCategory;
      expensePayload.push({
        userId: user.id,
        amount: Math.abs(row.amount),
        category,
        date,
        description: [row.counterparty, row.description].filter(Boolean).join(" • "),
      });
    }
  }

  if (incomePayload.length > 0) {
    await prisma.income.createMany({ data: incomePayload });
  }
  if (expensePayload.length > 0) {
    await prisma.expense.createMany({ data: expensePayload });
  }

  await prisma.statementImport.create({
    data: {
      userId: user.id,
      fileName,
      totalRows: rows.length,
      importedIncome: incomePayload.length,
      importedExpense: expensePayload.length,
      duplicateRows: duplicates,
      skippedRows: skipped,
    },
  });

  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/health");
  revalidateTag("dashboard-stats");

  return {
    success: true,
    totalRows: rows.length,
    importedIncome: incomePayload.length,
    importedExpense: expensePayload.length,
    duplicates,
    skipped,
  };
}

export async function getStatementImports() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return prisma.statementImport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
