import { CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";
import { DashboardStats } from "@/app/actions/dashboard";

interface TaxStatusBlockProps {
    stats: DashboardStats;
}

export default function TaxStatusBlock({ stats }: TaxStatusBlockProps) {
  const { fop, tax } = stats;

  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm h-full flex flex-col justify-between">
         <div className="flex items-start justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Мій статус</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{fop.group} група • {fop.taxSystem}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${tax.status === 'ok' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {tax.status === 'ok' ? 'Все ок' : 'Увага'}
            </div>
         </div>

         <div className="flex gap-4 mt-6">
             <div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                     <span className="text-xs font-bold text-gray-500 uppercase">Єдиний податок</span>
                 </div>
                 <p className="text-gray-900 font-bold">Сплачено</p>
             </div>
             <div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                     <span className="text-xs font-bold text-gray-500 uppercase">ЄСВ</span>
                 </div>
                 <p className="text-gray-900 font-bold text-sm">Скоро сплата</p>
             </div>
         </div>
    </div>
  );
}
