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
        subtext: tax.nextPaymentDate ? `Сплатити до ${tax.nextPaymentDate}` : "Заповніть налаштування податків",
        icon: TrendingDown,
        color: "bg-orange-500",
        lightColor: "bg-orange-50 text-orange-700"
    },
    {
        label: "Залишок ліміту",
        value: Math.max(0, limit.max - limit.current),
        subtext: limit.max > 0 ? `${limit.percent.toFixed(1)}% використано` : "Ліміт не задано",
        icon: AlertTriangle,
        color: "bg-amber-500",
        lightColor: "bg-amber-50 text-amber-700",
        isLimit: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
            <div key={idx} className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-1">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.change && card.change >= 0 ? 'from-green-500/5' : 'from-blue-500/5'} to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:scale-150 transition-transform duration-700`}></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.lightColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            <card.icon className="w-7 h-7" />
                        </div>
                        {card.change !== undefined && (
                            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${card.change >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {card.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                {Math.abs(card.change)}%
                            </div>
                        )}
                    </div>
                    
                    <div>
                         <p className="text-gray-500 text-sm font-semibold mb-2 tracking-wide uppercase">{card.label}</p>
                         <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                            {typeof card.value === 'number' ? card.value.toLocaleString('uk-UA') + ' ₴' : card.value}
                         </h3>
                         {card.subtext && (
                             <div className="mt-4">
                                {card.isLimit && limit.max > 0 && (
                                     <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                                         <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${Math.min(100, stats.limit.percent)}%` }}></div>
                                     </div>
                                )}
                                 <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                     {card.subtext}
                                 </p>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        ))}
    </div>
  );
}
