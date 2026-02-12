import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";

type ExportFormat = "csv" | "xlsx" | "json" | "pdf";
type ExportType = "incomes" | "profile";

function toCsv(rows: Record<string, any>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: any) => {
    const str = String(val ?? "");
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

function toXlsxBuffer(rows: Record<string, any>[], sheetName: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function toPdfBuffer(title: string, rows: Record<string, any>[]) {
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
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "incomes") as ExportType;
  const format = (url.searchParams.get("format") || "csv") as ExportFormat;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (type !== "incomes" && type !== "profile") {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }
  if (!["csv", "xlsx", "json", "pdf"].includes(format)) {
    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
  }

  let rows: Record<string, any>[] = [];
  if (type === "incomes") {
    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    });
    rows = incomes.map((i) => ({
      date: new Date(i.date).toISOString().slice(0, 10),
      source: i.source,
      type: i.type,
      amount: i.amount,
      status: i.status
    }));
  } else {
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
        taxOffice: settings?.taxOffice || ""
      }
    ];
  }

  const name = fileName(type, format);

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
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`
      }
    });
  }

  const pdf = await toPdfBuffer(type === "incomes" ? "Доходи" : "Профіль ФОП", rows);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`
    }
  });
}
