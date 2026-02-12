import { getComplianceOverview } from "@/app/actions/compliance";
import SendReminderButton from "@/components/dashboard/calendar/SendReminderButton";

const typeColor: Record<string, string> = {
  tax: "bg-blue-50 text-blue-700",
  report: "bg-purple-50 text-purple-700",
  esv: "bg-emerald-50 text-emerald-700",
};

const statusColor: Record<string, string> = {
  upcoming: "text-gray-600",
  due_soon: "text-amber-600",
  overdue: "text-red-600",
};

export default async function CalendarPage() {
  const overview = await getComplianceOverview();

  if (!overview) {
    return <div className="p-6 bg-white rounded-2xl border border-gray-200">Заповніть налаштування ФОП, щоб бачити календар зобов&apos;язань.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Календар зобов&apos;язань</h1>
        <p className="text-gray-500 text-lg">Єдиний таймлайн сплати та звітності, плюс email-нагадування.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Найближчі дедлайни</h2>
            <p className="text-sm text-gray-500 mt-1">Період згенеровано на 6 місяців вперед.</p>
          </div>
          <SendReminderButton />
        </div>

        <div className="space-y-3">
          {overview.obligations.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg ${typeColor[item.type] || "bg-gray-100 text-gray-700"}`}>
                    {item.type.toUpperCase()}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{new Date(item.dueDate).toLocaleDateString("uk-UA")}</p>
                  <p className={`text-sm font-semibold ${statusColor[item.status] || "text-gray-600"}`}>{item.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
