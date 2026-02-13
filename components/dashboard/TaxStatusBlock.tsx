import { CheckCircle2, AlertOctagon, Clock } from "lucide-react";
import type { DashboardStats } from "@/lib/types/dashboard";

interface TaxStatusBlockProps {
    stats: DashboardStats;
}

export default function TaxStatusBlock({ stats }: TaxStatusBlockProps) {
  const { fop, tax } = stats;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 border border-gray-100 dark:border-gray-700 shadow-sm h-full flex flex-col justify-between group hover:shadow-xl transition-all duration-300 relative overflow-hidden">
         <div className="flex items-start justify-between relative z-10">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Статус ФОП</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">{fop.group} група • {fop.taxSystem}</p>
            </div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${tax.status === 'ok' ? 'bg-green-100 text-green-600' : tax.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                {tax.status === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
         </div>

         <div className="flex gap-3 mt-4 relative z-10">
             <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Єдиний податок</div>
                 <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{tax.singleTax.toLocaleString('uk-UA')} ₴</p>
             </div>
             <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">ЄСВ</div>
                 <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{tax.esv.toLocaleString('uk-UA')} ₴</p>
             </div>
         </div>

         <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
             <Clock className="w-4 h-4" />
             {tax.nextPaymentDate ? `Наступна сплата: ${tax.nextPaymentDate}` : "Вкажіть дату сплати у налаштуваннях"}
         </div>
    </div>
  );
}
