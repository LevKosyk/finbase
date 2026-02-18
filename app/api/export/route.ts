import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { logAuditEvent } from "@/lib/audit-log";
import { exportQuerySchema } from "@/lib/validation";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";
import { enforceRateLimit } from "@/lib/security";
import { getStatistics } from "@/app/actions/statistics";
import { checkAndStoreIdempotency } from "@/lib/idempotency";
import { getRequestContext } from "@/lib/request-security";

type ExportFormat = "csv" | "xlsx" | "json" | "pdf";
type ExportType = "incomes" | "expenses" | "profile" | "statistics";
type ExportRow = Record<string, string | number | null | undefined>;

function sanitizeSpreadsheetCell(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trimStart();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${value}`;
  }
  return value;
}

function toCsv(rows: ExportRow[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const safeVal = sanitizeSpreadsheetCell(val);
    const str = String(safeVal ?? "");
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

function toXlsxBuffer(rows: ExportRow[], sheetName: string) {
  const safeRows = rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeSpreadsheetCell(value)]))
  );
  const worksheet = XLSX.utils.json_to_sheet(safeRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function toPdfBuffer(title: string, rows: ExportRow[]) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(18).text(title);
    doc.moveDown();
    doc.fontSize(10);

    rows.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        doc.text(`${key}: ${value ?? ""}`);
      });
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

function fileName(type: ExportType, format: ExportFormat) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `finbase-${type}-${stamp}.${format}`;
}

export async function GET(req: Request) {
  const access = await ensureSensitiveActionAccess({
    action: "api.export.GET",
    requireRecentReauth: true,
    requireTwoFactor: true,
  });
  if (!access.ok) {
    return NextResponse.json({ error: access.error, code: access.code }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsedQuery = exportQuerySchema.safeParse({
    type: url.searchParams.get("type") || "incomes",
    format: url.searchParams.get("format") || "csv",
    period: url.searchParams.get("period") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid export query" }, { status: 400 });
  }
  const type = parsedQuery.data.type as ExportType;
  const format = parsedQuery.data.format as ExportFormat;
  const period = parsedQuery.data.period || "year";
  const from = parsedQuery.data.from;
  const to = parsedQuery.data.to;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ip, deviceFingerprint } = getRequestContext(req);
  const burstUser = await enforceRateLimit(`export:burst:user:${user.id}`, 12, 60);
  const burstIp = await enforceRateLimit(`export:burst:ip:${ip}`, 50, 60);
  const burstDevice = await enforceRateLimit(`export:burst:device:${deviceFingerprint}`, 35, 60);
  if (!burstUser.allowed || !burstIp.allowed || !burstDevice.allowed) {
    await logAuditEvent({
      userId: user.id,
      action: "security.alert.export_rate_limited",
      entityType: "security",
      metadata: { ip, deviceFingerprint },
    });
    return NextResponse.json({ error: "Too many export requests" }, { status: 429 });
  }
  const dailyUser = await enforceRateLimit(`export:daily:user:${user.id}`, 200, 60 * 60 * 24);
  const dailyDevice = await enforceRateLimit(`export:daily:device:${deviceFingerprint}`, 450, 60 * 60 * 24);
  if (!dailyUser.allowed || !dailyDevice.allowed) {
    await logAuditEvent({
      userId: user.id,
      action: "security.alert.export_daily_limit",
      entityType: "security",
    });
    return NextResponse.json({ error: "Daily export limit exceeded" }, { status: 429 });
  }

  const idem = await checkAndStoreIdempotency({
    scope: "api.export",
    userId: user.id,
    key: req.headers.get("x-idempotency-key") || `${type}:${format}:${period}:${from || ""}:${to || ""}`,
    ttlSeconds: 60 * 15,
  });
  if (!idem.ok && idem.duplicate) {
    return NextResponse.json({ error: "Duplicate export request" }, { status: 409 });
  }

  let rows: ExportRow[] = [];
  if (type === "incomes") {
    const incomes = await prisma.income.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { date: "desc" }
    });
    rows = incomes.map((i) => ({
      date: new Date(i.date).toISOString().slice(0, 10),
      source: i.source,
      type: i.type,
      amount: i.amount,
      status: i.status
    }));
  } else if (type === "expenses") {
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { date: "desc" }
    });
    rows = expenses.map((e) => ({
      date: new Date(e.date).toISOString().slice(0, 10),
      category: e.category,
      description: e.description || "",
      amount: e.amount
    }));
  } else if (type === "profile") {
    const settings = await prisma.fOPSettings.findUnique({ where: { userId: user.id } });
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    rows = [
      {
        legalName: settings?.legalName || dbUser?.name || "",
        ipn: settings?.ipn || "",
        group: settings?.group || "",
        address: settings?.address || "",
        city: settings?.city || "",
        street: settings?.street || "",
        houseNumber: settings?.houseNumber || "",
        zipCode: settings?.zipCode || "",
        kveds: settings?.kveds || "",
        taxRate: settings?.taxRate ?? "",
        fixedMonthlyTax: settings?.fixedMonthlyTax ?? "",
        esvMonthly: settings?.esvMonthly ?? "",
        incomeLimit: settings?.incomeLimit ?? "",
        reportingPeriod: settings?.reportingPeriod || "",
        taxPaymentDay: settings?.taxPaymentDay || "",
        reportDay: settings?.reportDay || "",
        iban: settings?.iban || "",
        phone: settings?.phone || "",
        email: settings?.email || "",
        registrationDate: settings?.registrationDate ? new Date(settings.registrationDate).toISOString().slice(0, 10) : "",
        taxOffice: settings?.taxOffice || "",
        expenseCategories: settings?.expenseCategories || ""
      }
    ];
  } else {
    const stats = await getStatistics(period, from, to);
    if (!stats) {
      return NextResponse.json({ error: "No statistics available for export" }, { status: 404 });
    }
    rows = [
      { section: "KPI", metric: "income_total", value: stats.kpi.income.total, change_percent: stats.kpi.income.change },
      { section: "KPI", metric: "expenses_total", value: stats.kpi.expenses.total, change_percent: stats.kpi.expenses.change },
      { section: "KPI", metric: "net_profit_total", value: stats.kpi.netProfit.total, change_percent: stats.kpi.netProfit.change },
      { section: "KPI", metric: "tax_total", value: stats.kpi.tax.total, change_percent: stats.kpi.tax.change },
      { section: "FOP_LIMIT", metric: "year_income", value: stats.fop.limit.current },
      { section: "FOP_LIMIT", metric: "limit_max", value: stats.fop.limit.max },
      { section: "FOP_LIMIT", metric: "limit_percent", value: stats.fop.limit.percent },
      ...stats.charts.incomeDynamics.map((item) => ({
        section: "INCOME_DYNAMICS",
        metric: item.date,
        value: item.amount,
        type: item.type,
      })),
      ...stats.charts.incomeStructure.map((item) => ({
        section: "INCOME_STRUCTURE",
        metric: item.name,
        value: item.value,
      })),
      ...stats.charts.expenseStructure.map((item) => ({
        section: "EXPENSE_STRUCTURE",
        metric: item.name,
        value: item.value,
      })),
      ...stats.insights.map((item) => ({
        section: "INSIGHT",
        metric: item.title,
        value: item.description,
        type: item.type,
      })),
    ];
  }

  const name = fileName(type, format);
  if (rows.length >= 1000) {
    await logAuditEvent({
      userId: user.id,
      action: "security.alert.mass_export",
      entityType: "security",
      metadata: { type, format, rows: rows.length },
    });
  }
  await logAuditEvent({
    userId: user.id,
    action: "data.export",
    entityType: type,
    metadata: { format, rows: rows.length, fileName: name },
  });

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${name}"`
      }
    });
  }

  if (format === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`
      }
    });
  }

  if (format === "xlsx") {
    const buffer = toXlsxBuffer(rows, type);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`
      }
    });
  }

  const pdfTitle = type === "incomes" ? "Доходи" : type === "expenses" ? "Витрати" : type === "profile" ? "Профіль ФОП" : "Статистика";
  const pdf = await toPdfBuffer(pdfTitle, rows);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`
    }
  });
}
