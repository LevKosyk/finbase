import { getDashboardStats } from "@/app/actions/dashboard";
import { getUser } from "@/app/actions/auth";
import { getHealthDashboard } from "@/app/actions/health";
import { getDashboardPreference } from "@/app/actions/dashboard-preferences";
import DashboardPersonalized from "@/components/dashboard/DashboardPersonalized";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getUser();
  const health = await getHealthDashboard();
  const preference = await getDashboardPreference();

  if (!stats) return <div className="text-gray-500 dark:text-gray-400">Loading...</div>;

  const firstName = user?.firstName || user?.name || "User";

  return (
    <DashboardPersonalized
      stats={stats}
      health={health}
      firstName={firstName}
      initialLayout={preference.layout}
      initialDensity={preference.density}
    />
  );
}
