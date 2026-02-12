export type ReportingPeriod = "monthly" | "quarterly" | "yearly";

export function getReportingPeriod(raw?: string | null): ReportingPeriod {
  if (raw === "monthly" || raw === "quarterly" || raw === "yearly") return raw;
  return "quarterly";
}

export function getPeriodRange(period: ReportingPeriod, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "monthly") {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end, months: 1 };
  }

  if (period === "yearly") {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end, months: 12 };
  }

  const quarter = Math.floor(month / 3);
  const startMonth = quarter * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end, months: 3 };
}

export function addMonths(date: Date, count: number) {
  const d = new Date(date);
  const targetMonth = d.getMonth() + count;
  const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const day = d.getDate();
  const lastDay = new Date(targetYear, month + 1, 0).getDate();
  return new Date(targetYear, month, Math.min(day, lastDay), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
}

export function getNextDueDate(period: ReportingPeriod, paymentDay?: number | null, now = new Date()) {
  if (!paymentDay || paymentDay < 1 || paymentDay > 31) return null;
  const { end, months } = getPeriodRange(period, now);
  const dueBase = addMonths(new Date(end.getFullYear(), end.getMonth(), 1), 1);
  const lastDay = new Date(dueBase.getFullYear(), dueBase.getMonth() + 1, 0).getDate();
  let due = new Date(dueBase.getFullYear(), dueBase.getMonth(), Math.min(paymentDay, lastDay), 23, 59, 59, 999);
  while (due <= now) {
    const nextBase = addMonths(dueBase, months);
    const nextLastDay = new Date(nextBase.getFullYear(), nextBase.getMonth() + 1, 0).getDate();
    due = new Date(nextBase.getFullYear(), nextBase.getMonth(), Math.min(paymentDay, nextLastDay), 23, 59, 59, 999);
  }
  return due;
}

export function getStatusFromDueDate(due: Date | null) {
  if (!due) return "warning" as const;
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return "danger" as const;
  if (days <= 7) return "warning" as const;
  return "ok" as const;
}

export function formatDateUA(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
}
