import { CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";
import { DashboardStats } from "@/app/actions/dashboard";

interface TaxStatusBlockProps {
    stats: DashboardStats;
}

export default function TaxStatusBlock({ stats }: TaxStatusBlockProps) {
  const { fop, tax } = stats;

  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm h-full flex flex-col justify-between group hover:shadow-xl transition-all duration-300 relative overflow-hidden">
         <div className="flex items-start justify-between relative z-10">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Мій статус</h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-1">3 група • 5%</p>
            </div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${tax.status === 'ok' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {tax.status === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
         </div>

         <div className="flex gap-3 mt-4 relative z-10">
             <div className="flex-1 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Єдиний податок</div>
                 <p className="text-gray-900 font-bold text-sm">Сплачено</p>
             </div>
             <div className="flex-1 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">ЄСВ</div>
                 <p className="text-gray-900 font-bold text-sm">Скоро</p>
             </div>
         </div>
    </div>
  );
}
