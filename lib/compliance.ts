export type DocumentType = "declaration" | "payment" | "act" | "invoice" | "rakhunok";
export type DocumentFormat = "pdf" | "json";

export interface FopProfile {
  legalName?: string | null;
  ipn?: string | null;
  group?: number | null;
  address?: string | null;
  city?: string | null;
  taxRate?: number | null;
  fixedMonthlyTax?: number | null;
  esvMonthly?: number | null;
  incomeLimit?: number | null;
  reportingPeriod?: string | null;
  taxPaymentDay?: number | null;
  reportDay?: number | null;
  iban?: string | null;
  phone?: string | null;
  email?: string | null;
  taxOffice?: string | null;
}

export interface ObligationItem {
  id: string;
  title: string;
  type: "tax" | "report" | "esv";
  dueDate: Date;
  status: "upcoming" | "due_soon" | "overdue";
  description: string;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function setDayOfMonth(base: Date, day: number) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthLastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(day, 1), monthLastDay), 23, 59, 59, 999);
}

function addMonths(base: Date, months: number) {
  return new Date(base.getFullYear(), base.getMonth() + months, base.getDate(), 23, 59, 59, 999);
}

function monthsStep(reportingPeriod?: string | null) {
  if (reportingPeriod === "monthly") return 1;
  if (reportingPeriod === "yearly") return 12;
  return 3;
}

function obligationStatus(dueDate: Date): "upcoming" | "due_soon" | "overdue" {
  const now = new Date();
  const diffDays = (startOfDay(dueDate).getTime() - startOfDay(now).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "due_soon";
  return "upcoming";
}

function labelPeriod(reportingPeriod?: string | null) {
  if (reportingPeriod === "monthly") return "щомісяця";
  if (reportingPeriod === "yearly") return "щороку";
  return "щокварталу";
}

export function validateTaxRules(profile: FopProfile) {
  const warnings: string[] = [];
  const group = profile.group || 3;
  const reportingPeriod = profile.reportingPeriod || "quarterly";

  if (!profile.incomeLimit || profile.incomeLimit <= 0) {
    warnings.push("Не задано річний ліміт доходу.");
  }
  if (!profile.taxPaymentDay || profile.taxPaymentDay < 1 || profile.taxPaymentDay > 31) {
    warnings.push("День сплати податку має бути в межах 1..31.");
  }
  if (!profile.reportDay || profile.reportDay < 1 || profile.reportDay > 31) {
    warnings.push("День подачі звіту має бути в межах 1..31.");
  }
  if (!profile.esvMonthly || profile.esvMonthly < 0) {
    warnings.push("ЄСВ/міс не задано або некоректний.");
  }

  if (group === 1 || group === 2) {
    if (!profile.fixedMonthlyTax || profile.fixedMonthlyTax <= 0) {
      warnings.push(`Для ${group} групи бажано задати фіксований податок/міс.`);
    }
    if (profile.taxRate && profile.taxRate > 0) {
      warnings.push(`Для ${group} групи ставка (%) зазвичай не використовується як основна.`);
    }
    if (reportingPeriod !== "monthly" && reportingPeriod !== "yearly") {
      warnings.push(`Для ${group} групи рекомендовано період звітності: monthly або yearly.`);
    }
  }

  if (group === 3) {
    if (!profile.taxRate || profile.taxRate <= 0) {
      warnings.push("Для 3 групи задайте ставку податку (%).");
    }
    if (reportingPeriod !== "quarterly" && reportingPeriod !== "monthly") {
      warnings.push("Для 3 групи рекомендовано період звітності quarterly (або monthly, якщо так ведете облік).");
    }
  }

  if (group === 4) {
    if ((!profile.taxRate || profile.taxRate <= 0) && (!profile.fixedMonthlyTax || profile.fixedMonthlyTax <= 0)) {
      warnings.push("Для 4 групи задайте хоча б один параметр податку: ставка (%) або фіксований податок/міс.");
    }
  }

  return warnings;
}

export function getRequiredProfileFields(profile: FopProfile) {
  const required: Array<{ key: keyof FopProfile; label: string }> = [
    { key: "legalName", label: "Повна назва ФОП" },
    { key: "ipn", label: "ІПН (РНОКПП)" },
    { key: "group", label: "Група ФОП" },
    { key: "email", label: "Email" },
    { key: "taxOffice", label: "Податкова/ДПС" },
  ];

  const missing = required
    .filter((f) => {
      const value = profile[f.key];
      return value === null || value === undefined || value === "";
    })
    .map((f) => f.label);

  return missing;
}

export function getDocumentRequiredFields(type: DocumentType) {
  const base = ["legalName", "ipn", "group", "email"] as const;
  if (type === "declaration") return [...base, "taxOffice"] as const;
  if (type === "payment") return [...base, "iban", "taxOffice"] as const;
  if (type === "act") return [...base, "address"] as const;
  if (type === "invoice") return [...base, "iban", "phone"] as const;
  return [...base, "iban"] as const;
}

export function validateDocumentProfile(type: DocumentType, profile: FopProfile) {
  const required = getDocumentRequiredFields(type);
  const labels: Record<(typeof required)[number] | "taxOffice", string> = {
    legalName: "Повна назва ФОП",
    ipn: "ІПН (РНОКПП)",
    group: "Група ФОП",
    email: "Email",
    taxOffice: "Податкова/ДПС",
    iban: "IBAN",
    address: "Адреса",
    phone: "Телефон",
  };

  return required
    .filter((key) => {
      const value = profile[key];
      return value === null || value === undefined || value === "";
    })
    .map((key) => labels[key]);
}

export function buildObligationsTimeline(profile: FopProfile, now = new Date(), monthsAhead = 6): ObligationItem[] {
  const step = monthsStep(profile.reportingPeriod);
  const taxDay = profile.taxPaymentDay || 20;
  const reportDay = profile.reportDay || 20;
  const obligations: ObligationItem[] = [];

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < monthsAhead; i += step) {
    const base = addMonths(startMonth, i + 1);
    const taxDue = setDayOfMonth(base, taxDay);
    const reportDue = setDayOfMonth(base, reportDay);
    const esvDue = setDayOfMonth(base, 20);

    obligations.push({
      id: `tax-${i}`,
      title: "Сплата податку",
      type: "tax",
      dueDate: taxDue,
      status: obligationStatus(taxDue),
      description: `Період: ${labelPeriod(profile.reportingPeriod)}`
    });

    obligations.push({
      id: `report-${i}`,
      title: "Подача звітності",
      type: "report",
      dueDate: reportDue,
      status: obligationStatus(reportDue),
      description: "Підготуйте пакет документів для ДПС."
    });

    obligations.push({
      id: `esv-${i}`,
      title: "Сплата ЄСВ",
      type: "esv",
      dueDate: esvDue,
      status: obligationStatus(esvDue),
      description: "Контроль обов'язкового внеску."
    });
  }

  return obligations.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function buildDpsChecklist(
  taxWarnings: string[],
  missingFields: string[],
  hasIncomeData: boolean,
  hasExpenseData: boolean
) {
  const checklist = [
    { id: "profile", title: "Заповнені реквізити ФОП", done: missingFields.length === 0 },
    { id: "rules", title: "Податкові параметри валідні для групи", done: taxWarnings.length === 0 },
    { id: "income", title: "Доходи за звітний період внесені", done: hasIncomeData },
    { id: "expenses", title: "Витрати за звітний період внесені", done: hasExpenseData },
    { id: "docs", title: "Документи сформовано та перевірено", done: true },
  ];
  return checklist;
}

export function normalizeDateInput(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}
