import { CheckCircle2, AlertOctagon, Clock } from "lucide-react";
import type { DashboardStats } from "@/lib/types/dashboard";

interface TaxStatusBlockProps {
    stats: DashboardStats;
}

export default function TaxStatusBlock({ stats }: TaxStatusBlockProps) {
  const { fop, tax } = stats;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
         <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Статус ФОП</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5">{fop.group} група · {fop.taxSystem}</p>
            </div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${tax.status === 'ok' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : tax.status === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                {tax.status === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3">
             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Єдиний податок</div>
                 <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{tax.singleTax.toLocaleString('uk-UA')}&nbsp;&#8372;</p>
             </div>
             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">ЄСВ</div>
                 <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{tax.esv.toLocaleString('uk-UA')}&nbsp;&#8372;</p>
             </div>
         </div>

         <div className="mt-auto pt-4 flex items-start gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
             <Clock className="w-4 h-4 shrink-0" />
             <span className="leading-5">
               {tax.nextPaymentDate ? `Наступна сплата: ${tax.nextPaymentDate}` : "Вкажіть дату сплати у налаштуваннях"}
             </span>
         </div>
    </div>
  );
}
