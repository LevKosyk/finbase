import { getComplianceOverview } from "@/app/actions/compliance";
import CalendarWorkspace from "@/components/dashboard/calendar/CalendarWorkspace";
import PageShell from "@/components/dashboard/shared/PageShell";

export default async function CalendarPage() {
  const overview = await getComplianceOverview();

  if (!overview) {
    return <div className="p-6 bg-white rounded-2xl border border-gray-200">Заповніть налаштування ФОП, щоб бачити календар зобов&apos;язань.</div>;
  }

  return (
    <PageShell
      title="Календар зобов&apos;язань"
      description="Єдиний таймлайн сплати та звітності з експортом у зовнішні календарі."
    >
      <CalendarWorkspace
        initialObligations={overview.obligations.map((item) => ({
          id: `${item.type}-${new Date(item.dueDate).toISOString()}`,
          title: item.title,
          type: item.type,
          dueDate: new Date(item.dueDate).toISOString(),
          status: item.status,
          description: item.description,
        }))}
      />
    </PageShell>
  );
}
