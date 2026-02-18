"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CalendarDays, Download, List, Grid3X3, Plus, X, ChevronLeft, ChevronRight, Globe } from "lucide-react";

type Obligation = {
  id: string;
  title: string;
  type: "tax" | "report" | "esv";
  dueDate: string;
  status: "upcoming" | "due_soon" | "overdue";
  description: string;
};

const typeLabel: Record<Obligation["type"], string> = {
  tax: "Податок",
  report: "Звіт",
  esv: "ЄСВ",
};

const typeColor: Record<Obligation["type"], string> = {
  tax: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  report: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  esv: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const statusLabel: Record<Obligation["status"], string> = {
  upcoming: "Заплановано",
  due_soon: "Незабаром",
  overdue: "Прострочено",
};

const statusColor: Record<Obligation["status"], string> = {
  upcoming: "text-gray-600 dark:text-gray-300",
  due_soon: "text-amber-600 dark:text-amber-400",
  overdue: "text-red-600 dark:text-red-400",
};

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function buildIcs(obligations: Obligation[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Finbase//Calendar//UK",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  obligations.forEach((item) => {
    const due = new Date(item.dueDate);
    const start = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@finbase.app`,
      `DTSTAMP:${fmt(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${fmt(start)}`,
      `DTEND;VALUE=DATE:${fmt(end)}`,
      `SUMMARY:${escapeIcs(item.title)}`,
      `DESCRIPTION:${escapeIcs(item.description)}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadIcs(obligations: Obligation[], fileName: string) {
  const ics = buildIcs(obligations);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildMonthCells(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekDay = (firstDay.getDay() + 6) % 7;

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarWorkspace({ initialObligations }: { initialObligations: Obligation[] }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [loadingMore, setLoadingMore] = useState(false);
  const [offsetMonths, setOffsetMonths] = useState(6);
  const [obligations, setObligations] = useState<Obligation[]>(initialObligations);
  const [monthCursor, setMonthCursor] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const obligationsByDay = useMemo(() => {
    const map = new Map<string, Obligation[]>();
    obligations.forEach((item) => {
      const key = dayKey(new Date(item.dueDate));
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    return map;
  }, [obligations]);

  const months = useMemo(() => {
    const uniq = new Map<string, { year: number; month: number; label: string }>();
    obligations.forEach((item) => {
      const date = new Date(item.dueDate);
      const key = monthKey(date);
      if (!uniq.has(key)) {
        uniq.set(key, {
          year: date.getFullYear(),
          month: date.getMonth(),
          label: date.toLocaleDateString("uk-UA", { month: "long", year: "numeric" }),
        });
      }
    });

    return [...uniq.values()].sort((a, b) => a.year - b.year || a.month - b.month);
  }, [obligations]);

  useEffect(() => {
    if (months.length === 0) return;
    setMonthCursor((prev) => Math.max(0, Math.min(prev, months.length - 1)));
  }, [months.length]);

  const activeMonth = months[monthCursor];
  const activeCells = activeMonth ? buildMonthCells(activeMonth.year, activeMonth.month) : [];

  async function loadMore() {
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/dashboard/calendar?months=6&offsetMonths=${offsetMonths}`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = await response.json();
      const next = (data.obligations || []) as Obligation[];

      setObligations((prev) => {
        const map = new Map<string, Obligation>();
        [...prev, ...next].forEach((item) => map.set(item.id, item));
        return [...map.values()].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
      });
      setOffsetMonths((prev) => prev + 6);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Календар зобов'язань</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Перегляд у форматі календаря або списку, експорт у Google/Apple/Outlook.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setView("calendar")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                view === "calendar"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Календар
            </button>
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                view === "list"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
              Список
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-[var(--fin-primary)] to-blue-600 text-white border-0 shadow-md shadow-blue-500/30 hover:opacity-95"
          >
            Додати до календаря
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {obligations.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg ${typeColor[item.type]}`}>{typeLabel[item.type]}</span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{new Date(item.dueDate).toLocaleDateString("uk-UA")}</p>
                  <p className={`text-sm font-semibold ${statusColor[item.status]}`}>{statusLabel[item.status]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMonthCursor((prev) => Math.max(prev - 1, 0))}
              disabled={monthCursor <= 0}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Назад
            </Button>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[var(--fin-primary)]" />
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 capitalize">
                {activeMonth?.label || "Календар"}
              </h3>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMonthCursor((prev) => Math.min(prev + 1, Math.max(months.length - 1, 0)))}
              disabled={monthCursor >= months.length - 1}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Вперед
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0 mb-0 border border-gray-200 dark:border-gray-700 rounded-t-xl overflow-hidden">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center py-2 bg-gray-50 dark:bg-gray-800 border-r last:border-r-0 border-gray-200 dark:border-gray-700">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl overflow-hidden">
            {activeCells.map((day, idx) => {
              if (!day || !activeMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-28 md:h-32 border-r border-b last:border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40"
                  />
                );
              }

              const date = new Date(activeMonth.year, activeMonth.month, day);
              const key = dayKey(date);
              const events = obligationsByDay.get(key) || [];

              return (
                <div key={key} className="h-28 md:h-32 border-r border-b last:border-r-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 md:p-2.5 flex flex-col">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 text-right">{day}</div>
                  <div className="space-y-1 overflow-y-auto pr-1">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] font-semibold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                        title={`${event.title} • ${statusLabel[event.status]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${event.type === "tax" ? "bg-blue-500" : event.type === "report" ? "bg-violet-500" : "bg-emerald-500"}`} />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {events.length > 2 && <p className="text-[10px] text-gray-500">+{events.length - 2} ще</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-2 flex justify-center">
        <Button variant="secondary" onClick={() => void loadMore()} isLoading={loadingMore}>
          Ще 6 місяців
        </Button>
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Додати до календаря</h3>
              <button onClick={() => setAddModalOpen(false)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <Button
              className="w-full justify-start"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => downloadIcs(obligations, "finbase-obligations.ics")}
            >
              Завантажити .ics (Apple / Outlook / Google / інші)
            </Button>

            <a
              href="https://calendar.google.com/calendar/u/0/r/settings/export"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Globe className="w-4 h-4" />
              Відкрити Google Calendar (імпорт .ics)
            </a>

            <a
              href="https://outlook.live.com/calendar/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Globe className="w-4 h-4" />
              Відкрити Outlook Calendar (імпорт .ics)
            </a>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Найкращий універсальний варіант: завантажити `.ics` та імпортувати у ваш календар.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
