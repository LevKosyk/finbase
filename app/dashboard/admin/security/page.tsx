import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function AdminSecurityPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/dashboard");

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const events = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { action: { startsWith: "security.alert." } },
        { action: "auth.login_failed" },
        { action: "auth.token_replay_detected" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      createdAt: true,
      userId: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Security Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Security events for last 24 hours.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Time</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Action</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">User</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Entity</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{event.createdAt.toLocaleString("uk-UA")}</td>
                <td className="px-4 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100">{event.action}</td>
                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{event.userId}</td>
                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{event.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
