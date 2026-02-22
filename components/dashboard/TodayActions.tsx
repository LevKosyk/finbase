import {
  CheckCircle2,
  AlertOctagon,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type ReminderType = "tax" | "report" | "alert";

interface Reminder {
  id: number;
  title: string;
  date: string;
  type: string;
  completed: boolean;
}

interface TodayActionsProps {
  reminders: Reminder[];
}

const typeConfig: Record<
  ReminderType,
  { Icon: React.ElementType; bg: string; text: string }
> = {
  tax: {
    Icon: AlertOctagon,
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  report: {
    Icon: FileText,
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  alert: {
    Icon: Clock,
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
  },
};

function getTypeConfig(type: string) {
  return typeConfig[(type as ReminderType) in typeConfig ? (type as ReminderType) : "alert"];
}

export default function TodayActions({ reminders }: TodayActionsProps) {
  const active = reminders.filter((r) => !r.completed);
  const done = reminders.filter((r) => r.completed);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col min-h-70">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Що зробити сьогодні
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {active.length > 0
              ? `${active.length} активн${active.length === 1 ? "а" : "их"} задач${active.length === 1 ? "а" : ""}`
              : "Все виконано"}
          </p>
        </div>
        {active.length > 0 && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-(--fin-primary) text-white text-[10px] font-extrabold">
            {active.length}
          </span>
        )}
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Все готово!
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Немає активних задач на сьогодні
            </p>
          </div>
        ) : (
          <>
            {active.map((task) => {
              const { Icon, bg, text } = getTypeConfig(task.type);
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bg}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                      {task.date}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>
              );
            })}

            {done.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                {done.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-sm text-gray-400 dark:text-gray-500 line-through leading-tight truncate">
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/dashboard/calendar"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-(--fin-primary) hover:opacity-75 transition-opacity"
        >
          Всі задачі <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
