import { getDashboardStats, getReminders, getRecentTransactions } from "@/app/actions/dashboard";
import { getUser } from "@/app/actions/auth";
import { getHealthDashboard } from "@/app/actions/health";
import DashboardPersonalized from "@/components/dashboard/DashboardPersonalized";
import type { DashboardStats } from "@/lib/types/dashboard";

const demoStats: DashboardStats = {
  income: {
    total: 187_450,
    change: 12.4,
    history: [
      { name: "Січ", value: 142_000 },
      { name: "Лют", value: 158_300 },
      { name: "Бер", value: 135_700 },
      { name: "Кві", value: 173_200 },
      { name: "Тра", value: 164_800 },
      { name: "Чер", value: 189_500 },
      { name: "Лип", value: 195_100 },
      { name: "Сер", value: 178_400 },
      { name: "Вер", value: 201_600 },
      { name: "Жов", value: 192_300 },
      { name: "Лис", value: 210_750 },
      { name: "Гру", value: 187_450 },
    ],
  },
  expenses: { total: 42_380, change: -5.2 },
  tax: {
    amount: 14_196,
    singleTax: 1_760,
    esv: 1_760,
    status: "ok",
    nextPaymentDate: "19.04.2026",
  },
  limit: { current: 2_249_400, max: 8_285_700, percent: 27.2 },
  fop: { group: 3, taxSystem: "Єдиний податок 5%", reportingPeriod: "Q1 2026" },
};

const demoReminders = [
  { id: 1, title: "Сплатити ЄП за 1 квартал", date: "до 19.04", type: "tax", completed: false },
  { id: 2, title: "Подати декларацію", date: "до 09.04", type: "report", completed: false },
  { id: 3, title: "Перевірити ліміт доходу", date: "сьогодні", type: "alert", completed: true },
];

const demoTransactions = [
  { id: "1", amount: 32_500, source: "IT Consulting", date: "2026-02-21", type: "job" },
  { id: "2", amount: 18_000, source: "Design Project", date: "2026-02-19", type: "job" },
  { id: "3", amount: 5_200, source: "Hosting Refund", date: "2026-02-17", type: "other" },
  { id: "4", amount: 42_000, source: "Mobile App Dev", date: "2026-02-15", type: "job" },
  { id: "5", amount: 8_750, source: "Consulting Call", date: "2026-02-12", type: "job" },
];

export default async function DashboardPage() {
  let stats, user, health, reminders, recentTransactions;

  try {
    [stats, user, health, reminders, recentTransactions] = await Promise.all([
      getDashboardStats(),
      getUser(),
      getHealthDashboard(),
      getReminders(),
      getRecentTransactions(),
    ]);
  } catch {
    // Supabase / DB not available — fall through to demo data
  }

  const effectiveStats = stats || demoStats;
  const effectiveReminders = reminders || demoReminders;
  const effectiveTransactions = recentTransactions || demoTransactions;
  const firstName = user?.firstName || user?.name || "User";

  return (
    <DashboardPersonalized
      stats={effectiveStats}
      health={health ?? { riskScore: 24, factors: { limitUsage: 27.2, dueSoonCount: 2, overdueCount: 0 } }}
      firstName={firstName}
      reminders={effectiveReminders}
      recentTransactions={effectiveTransactions}
    />
  );
}
