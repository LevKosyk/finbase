import { z } from "zod";

export const incomeDataSchema = z.object({
  amount: z.number().finite().positive(),
  source: z.string().trim().min(1).max(160),
  date: z.coerce.date(),
  type: z.string().trim().min(1).max(60),
  status: z.string().trim().min(1).max(40).optional(),
});

export const incomeImportRowSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  source: z.string().trim().min(1).max(160),
  date: z.union([z.string().trim().min(1), z.date()]),
  type: z.string().trim().min(1).max(60),
  status: z.string().trim().min(1).max(40).optional(),
});

export const expenseDataSchema = z.object({
  amount: z.number().finite().positive(),
  category: z.string().trim().min(1).max(120),
  date: z.coerce.date(),
  description: z.string().max(500).optional(),
});

export const expenseImportRowSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  date: z.union([z.string().trim().min(1), z.date()]),
  category: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
});

export const exportQuerySchema = z.object({
  type: z.enum(["incomes", "expenses", "profile"]).default("incomes"),
  format: z.enum(["csv", "xlsx", "json", "pdf"]).default("csv"),
});

export const documentRequestSchema = z.object({
  type: z.enum(["declaration", "payment", "act", "invoice", "rakhunok"]),
  format: z.enum(["pdf", "json"]).default("pdf"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  number: z.string().trim().max(120).optional(),
  counterparty: z.string().trim().max(200).optional(),
  counterpartyTaxId: z.string().trim().max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().finite().positive().optional(),
  currency: z.string().trim().max(12).optional(),
  templateId: z.string().trim().min(1).optional(),
  preview: z.boolean().optional(),
  sourceGenerationId: z.string().trim().min(1).optional(),
});

export const aiRouteRequestSchema = z.object({
  currentPath: z.string().trim().max(120).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().trim().max(1800),
    })
  ),
});

export const dashboardIncomeQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.string().trim().max(80).optional(),
  startDate: z.string().trim().max(32).optional(),
  endDate: z.string().trim().max(32).optional(),
  minAmount: z.string().trim().max(32).optional(),
  maxAmount: z.string().trim().max(32).optional(),
});

export const dashboardExpensesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  startDate: z.string().trim().max(32).optional(),
  endDate: z.string().trim().max(32).optional(),
  minAmount: z.string().trim().max(32).optional(),
  maxAmount: z.string().trim().max(32).optional(),
});

export const dashboardStatisticsQuerySchema = z.object({
  period: z.enum(["month", "quarter", "year", "custom"]).default("year"),
  from: z.string().trim().max(32).optional(),
  to: z.string().trim().max(32).optional(),
});

export const performanceQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

export const auditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const appleNotificationSchema = z.object({
  payload: z.string().trim().min(1).optional(),
  signedPayload: z.string().trim().min(1).optional(),
});
