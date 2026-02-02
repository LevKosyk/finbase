import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { DashboardStats } from "@/app/actions/dashboard";

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
        color: "bg-emerald-500",
        lightColor: "bg-emerald-50 text-emerald-700"
    },
    {
        label: "Витрати",
        value: expenses.total,
        change: expenses.change,
        isPositive: false, // spending went down is good usually, but visually red/green depends on context. Let's say spending change positive means increased spending (bad)
        icon: CreditCard,
        color: "bg-blue-500",
        lightColor: "bg-blue-50 text-blue-700"
    },
    {
        label: "Податки до сплати",
        value: tax.amount,
        subtext: `Сплатити до ${tax.nextPaymentDate}`,
        icon: TrendingDown,
        color: "bg-orange-500",
        lightColor: "bg-orange-50 text-orange-700"
    },
    {
        label: "Залишок ліміту",
        value: limit.max - limit.current,
        subtext: `${limit.percent.toFixed(1)}% використано`,
        icon: AlertTriangle,
        color: "bg-amber-500",
        lightColor: "bg-amber-50 text-amber-700",
        isLimit: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.lightColor} group-hover:scale-110 transition-transform duration-300`}>
                        <card.icon className="w-6 h-6" />
                    </div>
                    {card.change !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${card.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(card.change)}%
                        </div>
                    )}
                </div>
                
                <div>
                     <p className="text-gray-500 text-sm font-medium mb-1">{card.label}</p>
                     <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {typeof card.value === 'number' ? card.value.toLocaleString('uk-UA') + ' ₴' : card.value}
                     </h3>
                     {card.subtext && (
                         <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2">
                             {card.isLimit && (
                                 <span className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden block">
                                     <span className="block h-full bg-amber-500 rounded-full" style={{ width: `${stats.limit.percent}%` }}></span>
                                 </span>
                             )}
                             {card.subtext}
                         </p>
                     )}
                </div>
            </div>
        ))}
    </div>
  );
}
