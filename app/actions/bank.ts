"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getExpenseCategories } from "@/app/actions/expenses";
import type { BankStatementRow } from "@/lib/types/bank";
import { Prisma } from "@prisma/client";
import { cacheKey, invalidateUserCache, withRedisCache } from "@/lib/redis-cache";
import { logAuditEvent } from "@/lib/audit-log";
import { measureAction } from "@/lib/performance";
import { checkAndStoreIdempotency } from "@/lib/idempotency";
import { enforceRateLimit } from "@/lib/security";
import { headers } from "next/headers";

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
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

function applyRuleToRow(
  row: BankStatementRow,
  direction: "income" | "expense",
  rules: Array<{
    direction: string;
    category: string;
    containsText: string | null;
    counterpartyContains: string | null;
  }>,
  defaultExpenseCategory: string
) {
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
    const before = "bank_transfer";
    const after = matchedRule?.category || before;
    return { matchedRule, beforeCategory: before, afterCategory: after };
  }

  const before = keywordCategory(combinedText) || defaultExpenseCategory;
  const after = matchedRule?.category || before;
  return { matchedRule, beforeCategory: before, afterCategory: after };
}

export async function previewBankStatement(rows: BankStatementRow[]) {
  return measureAction("action.previewBankStatement", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  let rules: Array<{
    direction: string;
    category: string;
    containsText: string | null;
    counterpartyContains: string | null;
  }> = [];
  try {
    rules = await prisma.categorizationRule.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: {
        direction: true,
        category: true,
        containsText: true,
        counterpartyContains: true,
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  const expenseCategories = await getExpenseCategories();
  const defaultExpenseCategory = expenseCategories[0] || "Інше";

  const previewRows: Array<{
    date: string;
    direction: "income" | "expense";
    amount: number;
    counterparty: string;
    description: string;
    beforeCategory: string;
    afterCategory: string;
    ruleApplied: boolean;
  }> = [];

  let skipped = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let changedByRules = 0;

  for (const row of rows.slice(0, 100)) {
    const date = safeDate(row.date);
    const direction = determineDirection(row);
    if (!date || !direction || !Number.isFinite(row.amount)) {
      skipped += 1;
      continue;
    }

    if (direction === "income") incomeCount += 1;
    else expenseCount += 1;

    const applied = applyRuleToRow(row, direction, rules, defaultExpenseCategory);
    if (applied.beforeCategory !== applied.afterCategory) changedByRules += 1;

    previewRows.push({
      date: date.toISOString().slice(0, 10),
      direction,
      amount: Math.abs(row.amount),
      counterparty: row.counterparty || "",
      description: row.description || "",
      beforeCategory: applied.beforeCategory,
      afterCategory: applied.afterCategory,
      ruleApplied: Boolean(applied.matchedRule),
    });
  }

  return {
    success: true,
    totalRows: rows.length,
    previewedRows: previewRows.length,
    skipped,
    incomeCount,
    expenseCount,
    changedByRules,
    previewRows,
  };
  });
}

export async function importBankStatement(rows: BankStatementRow[], fileName = "statement", idempotencyKey?: string) {
  return measureAction("action.importBankStatement", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };
  if (rows.length > 10000) {
    return { success: false, error: "Too many rows. Limit is 10000." };
  }
  const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const burst = await enforceRateLimit(`action:bank:import:burst:${user.id}:${ip}`, 6, 60);
  if (!burst.allowed) {
    return { success: false, error: "Too many bank imports" };
  }
  const idem = await checkAndStoreIdempotency({
    scope: "action.bank.import",
    userId: user.id,
    key: idempotencyKey,
    ttlSeconds: 60 * 30,
  });
  if (!idem.ok && idem.duplicate) {
    return { success: false, error: "Duplicate import request" };
  }

  let rules: Array<{
    direction: string;
    category: string;
    containsText: string | null;
    counterpartyContains: string | null;
  }> = [];
  try {
    rules = await prisma.categorizationRule.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: {
        direction: true,
        category: true,
        containsText: true,
        counterpartyContains: true,
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }
  const expenseCategories = await getExpenseCategories();
  const defaultExpenseCategory = expenseCategories[0] || "Інше";

  const [existingIncome, existingExpense] = await Promise.all([
    prisma.income.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { date: true, amount: true, source: true, type: true }
    }),
    prisma.expense.findMany({
      where: { userId: user.id, deletedAt: null },
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
    const applied = applyRuleToRow(row, direction, rules, defaultExpenseCategory);
    const matchedRule = applied.matchedRule;

    if (direction === "income") {
      incomePayload.push({
        userId: user.id,
        amount: Math.abs(row.amount),
        source: pickSource(row.counterparty, row.description),
        date,
        type: applied.afterCategory,
        status: "completed",
      });
    } else {
      expensePayload.push({
        userId: user.id,
        amount: Math.abs(row.amount),
        category: applied.afterCategory,
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

  try {
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
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/health");
  revalidateTag("dashboard-stats", "max");
  revalidateTag("health-dashboard", "max");
  revalidateTag("statement-imports", "max");
  await invalidateUserCache(user.id);
  await logAuditEvent({
    userId: user.id,
    action: "bank.import",
    entityType: "statement_import",
    metadata: {
      fileName,
      totalRows: rows.length,
      importedIncome: incomePayload.length,
      importedExpense: expensePayload.length,
      duplicates,
      skipped,
    },
  });

  return {
    success: true,
    totalRows: rows.length,
    importedIncome: incomePayload.length,
    importedExpense: expensePayload.length,
    duplicates,
    skipped,
  };
  }, { budgetMs: 1200, meta: { rows: rows.length } });
}

export async function getStatementImports() {
  return measureAction("action.getStatementImports", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    return await withRedisCache(cacheKey("user", user.id, "statement-imports"), 90, async () => {
      return unstable_cache(
        async () => prisma.statementImport.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        [`statement-imports-${user.id}`],
        { tags: ["statement-imports", `user-${user.id}`], revalidate: 3600 }
      )();
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  });
}
