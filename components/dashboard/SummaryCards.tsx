import { 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import type { DashboardStats } from "@/lib/types/dashboard";

interface SummaryCardsProps {
    stats: DashboardStats;
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
  const { income, expenses, tax, limit } = stats;

  const cards = [
    {
        label: "Дохід за рік",
        value: income.total,
        change: income.change,
        isPositive: true,
        icon: Wallet,
        lightColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    },
    {
        label: "Витрати",
        value: expenses.total,
        change: expenses.change,
        isPositive: false, // spending went down is good usually, but visually red/green depends on context. Let's say spending change positive means increased spending (bad)
        icon: CreditCard,
        lightColor: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    },
    {
        label: "Податки до сплати",
        value: tax.amount,
        subtext: tax.nextPaymentDate ? `Сплатити до ${tax.nextPaymentDate}` : "Заповніть налаштування податків",
        icon: TrendingDown,
        lightColor: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
    },
    {
        label: "Залишок ліміту",
        value: Math.max(0, limit.max - limit.current),
        subtext: limit.max > 0 ? `${limit.percent.toFixed(1)}% використано` : "Ліміт не задано",
        icon: AlertTriangle,
        lightColor: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        isLimit: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-900 rounded-[32px] p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.lightColor}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                {card.change !== undefined && (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      card.change >= 0
                        ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300"
                        : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
                    }`}
                  >
                    {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(card.change)}%
                  </div>
                )}
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1">{card.label}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {typeof card.value === "number" ? `${card.value.toLocaleString("uk-UA")} ₴` : card.value}
              </h3>

              {card.subtext && (
                <div className="mt-3">
                  {card.isLimit && limit.max > 0 && (
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, stats.limit.percent)}%` }} />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.subtext}</p>
                </div>
              )}
            </div>
        ))}
    </div>
  );
}
