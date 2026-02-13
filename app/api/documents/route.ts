import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  DocumentFormat,
  DocumentType,
  normalizeDateInput,
  validateDocumentProfile,
} from "@/lib/compliance";

interface DocumentRequest {
  type: DocumentType;
  format: DocumentFormat;
  dateFrom?: string;
  dateTo?: string;
  number?: string;
  counterparty?: string;
  counterpartyTaxId?: string;
  description?: string;
  amount?: number;
  currency?: string;
}

type TemplateRow = Record<string, string | number>;

function toPdfBuffer(title: string, rows: TemplateRow[]) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(20).text(title);
    doc.moveDown();
    doc.fontSize(11);
    rows.forEach((row) => {
      Object.entries(row).forEach(([k, v]) => doc.text(`${k}: ${v}`));
      doc.moveDown(0.8);
    });
    doc.end();
  });
}

function buildDocumentRows(
  type: DocumentType,
  base: Record<string, string | number>,
  extra: Record<string, string | number>
) {
  if (type === "declaration") {
    return [
      {
        "Тип документу": "Декларація ФОП",
        ...base,
        ...extra,
      },
    ];
  }
  if (type === "payment") {
    return [
      {
        "Тип документу": "Платіжка",
        ...base,
        ...extra,
      },
    ];
  }
  if (type === "act") {
    return [
      {
        "Тип документу": "Акт виконаних робіт",
        ...base,
        ...extra,
      },
    ];
  }
  if (type === "invoice") {
    return [
      {
        "Тип документу": "Інвойс",
        ...base,
        ...extra,
      },
    ];
  }
  return [
    {
      "Тип документу": "Рахунок",
      ...base,
      ...extra,
    },
  ];
}

function fileName(type: DocumentType, format: DocumentFormat) {
  const date = new Date().toISOString().slice(0, 10);
  return `finbase-${type}-${date}.${format}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as DocumentRequest;
  const type = body.type;
  const format = body.format || "pdf";

  if (!type || !["declaration", "payment", "act", "invoice", "rakhunok"].includes(type)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }
  if (!["pdf", "json"].includes(format)) {
    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { settings: true }
  });
  if (!dbUser?.settings) {
    return NextResponse.json({ error: "FOP settings not found" }, { status: 400 });
  }

  const settings = dbUser.settings;
  const missing = validateDocumentProfile(type, settings);

  const from = normalizeDateInput(body.dateFrom) || new Date(new Date().getFullYear(), 0, 1);
  const to = normalizeDateInput(body.dateTo) || new Date();
  to.setHours(23, 59, 59, 999);
  const incomes = await prisma.income.findMany({
    where: { userId: user.id, date: { gte: from, lte: to } }
  });
  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);

  const rate = settings.taxRate || 0;
  const singleTax = totalIncome * rate;
  const esv = settings.esvMonthly || 0;
  const taxTotal = singleTax + esv;

  const number = body.number || `DOC-${Date.now()}`;
  const amount = body.amount || totalIncome;
  const currency = body.currency || "UAH";
  const counterparty = body.counterparty || "";

  if ((type === "invoice" || type === "act" || type === "rakhunok") && !counterparty) {
    missing.push("Контрагент");
  }
  if ((type === "invoice" || type === "act" || type === "rakhunok") && !body.description) {
    missing.push("Опис послуг/товарів");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        missing,
      },
      { status: 400 }
    );
  }

  const base = {
    "Номер": number,
    "Дата формування": new Date().toLocaleDateString("uk-UA"),
    "ФОП": settings.legalName || "",
    "ІПН": settings.ipn || "",
    "Група": settings.group || "",
    "Email": settings.email || dbUser.email,
    "IBAN": settings.iban || "",
    "Податкова": settings.taxOffice || "",
  };

  const extra: Record<string, string | number> = {
    "Період від": from.toLocaleDateString("uk-UA"),
    "Період до": to.toLocaleDateString("uk-UA"),
    "Дохід за період": `${totalIncome.toLocaleString("uk-UA")} грн`,
    "Податок": `${taxTotal.toLocaleString("uk-UA")} грн`,
    "Ставка": `${(rate * 100).toFixed(2)}%`,
    "Сума документу": `${amount.toLocaleString("uk-UA")} ${currency}`,
  };

  if (counterparty) extra["Контрагент"] = counterparty;
  if (body.counterpartyTaxId) extra["ІПН контрагента"] = body.counterpartyTaxId;
  if (body.description) extra["Опис"] = body.description;

  const rows = buildDocumentRows(type, base, extra);
  const name = fileName(type, format);

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${name}"`
      }
    });
  }

  const titleMap: Record<DocumentType, string> = {
    declaration: "Декларація",
    payment: "Платіжка",
    act: "Акт",
    invoice: "Інвойс",
    rakhunok: "Рахунок",
  };
  const pdf = await toPdfBuffer(titleMap[type], rows);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`
    }
  });
}
