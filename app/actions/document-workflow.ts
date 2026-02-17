"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type DocType = "declaration" | "payment" | "act" | "invoice" | "rakhunok";

const DEFAULT_TEMPLATES: Array<{ type: DocType; name: string; version: number }> = [
  { type: "declaration", name: "Базова декларація", version: 1 },
  { type: "payment", name: "Базова платіжка", version: 1 },
  { type: "act", name: "Базовий акт", version: 1 },
  { type: "invoice", name: "Базовий інвойс", version: 1 },
  { type: "rakhunok", name: "Базовий рахунок", version: 1 },
];

function stableStringify(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function basePreviewRow(type: DocType) {
  const common = {
    number: "DOC-001",
    legalName: "ФОП Іваненко Іван Іванович",
    ipn: "1234567890",
    periodFrom: "2026-01-01",
    periodTo: "2026-03-31",
    amount: "10000.00 UAH",
    counterparty: "ТОВ Приклад",
    description: "Послуги згідно договору",
  };

  if (type === "declaration") {
    return {
      documentTitle: "Декларація ФОП",
      ...common,
      tax: "500.00 UAH",
    };
  }
  if (type === "payment") {
    return {
      documentTitle: "Платіжка",
      ...common,
      iban: "UA123456789012345678901234567",
    };
  }
  if (type === "act") {
    return {
      documentTitle: "Акт виконаних робіт",
      ...common,
    };
  }
  if (type === "invoice") {
    return {
      documentTitle: "Інвойс",
      ...common,
    };
  }
  return {
    documentTitle: "Рахунок",
    ...common,
  };
}

function applyTemplateConfig(
  row: Record<string, string | number>,
  config: unknown
) {
  const cfg = (config || {}) as {
    labels?: Record<string, string>;
    staticFields?: Record<string, string | number>;
    fieldOrder?: string[];
  };
  const labels = cfg.labels || {};
  const staticFields = cfg.staticFields || {};

  const withStatic = { ...row, ...staticFields };
  const orderedKeys =
    cfg.fieldOrder && cfg.fieldOrder.length > 0
      ? [...cfg.fieldOrder, ...Object.keys(withStatic).filter((k) => !cfg.fieldOrder!.includes(k))]
      : Object.keys(withStatic);

  const result: Record<string, string | number> = {};
  for (const key of orderedKeys) {
    if (!(key in withStatic)) continue;
    const label = labels[key] || key;
    result[label] = withStatic[key];
  }
  return result;
}

export async function getDocumentTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const existing = await prisma.documentTemplate.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: [{ type: "asc" }, { version: "desc" }],
  });

  if (existing.length === 0) {
    await prisma.documentTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((item) => ({
        userId: user.id,
        type: item.type,
        name: item.name,
        version: item.version,
        isActive: true,
      })),
    });
    return prisma.documentTemplate.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    });
  }

  return existing;
}

export async function createTemplateVersion(input: { templateId: string; name?: string; configJson?: Record<string, unknown> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const base = await prisma.documentTemplate.findFirst({
    where: { id: input.templateId, userId: user.id },
  });
  if (!base) return { success: false, error: "Template not found" };

  const latest = await prisma.documentTemplate.findFirst({
    where: { userId: user.id, type: base.type },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version || 0) + 1;

  const configJson: Prisma.InputJsonValue | undefined =
    (input.configJson as Prisma.InputJsonValue | undefined) ||
    (base.configJson as Prisma.InputJsonValue | null) ||
    undefined;

  const created = await prisma.documentTemplate.create({
    data: {
      userId: user.id,
      type: base.type,
      name: input.name || `${base.name} v${version}`,
      version,
      configJson,
      isActive: true,
    },
  });

  return { success: true, template: created };
}

export async function getDocumentHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return prisma.documentGeneration.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function compareTemplateVersions(input: { leftTemplateId: string; rightTemplateId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [left, right] = await Promise.all([
    prisma.documentTemplate.findFirst({
      where: { id: input.leftTemplateId, userId: user.id },
    }),
    prisma.documentTemplate.findFirst({
      where: { id: input.rightTemplateId, userId: user.id },
    }),
  ]);

  if (!left || !right) return { success: false, error: "Template not found" };
  if (left.type !== right.type) return { success: false, error: "Templates must have the same type" };

  const type = left.type as DocType;
  const base = basePreviewRow(type);
  const leftPreview = applyTemplateConfig(base, left.configJson as unknown);
  const rightPreview = applyTemplateConfig(base, right.configJson as unknown);
  const allKeys = Array.from(new Set([...Object.keys(leftPreview), ...Object.keys(rightPreview)])).sort();
  const diffRows = allKeys
    .map((key) => {
      const leftValue = stableStringify(leftPreview[key]);
      const rightValue = stableStringify(rightPreview[key]);
      if (leftValue === rightValue) return null;
      return { key, leftValue, rightValue };
    })
    .filter((row): row is { key: string; leftValue: string; rightValue: string } => Boolean(row));

  return {
    success: true,
    left: {
      id: left.id,
      name: left.name,
      version: left.version,
      preview: leftPreview,
    },
    right: {
      id: right.id,
      name: right.name,
      version: right.version,
      preview: rightPreview,
    },
    diffRows,
  };
}
