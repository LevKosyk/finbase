import { CheckCircle2, AlertOctagon, Clock } from "lucide-react";
import type { DashboardStats } from "@/lib/types/dashboard";

interface TaxStatusBlockProps {
    stats: DashboardStats;
}

export default function TaxStatusBlock({ stats }: TaxStatusBlockProps) {
  const { fop, tax } = stats;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
         <div className="flex items-start justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Статус ФОП</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">{fop.group} група • {fop.taxSystem}</p>
            </div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${tax.status === 'ok' ? 'bg-green-100 text-green-600' : tax.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                {tax.status === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3 mt-4">
             <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Єдиний податок</div>
                 <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{tax.singleTax.toLocaleString('uk-UA')} ₴</p>
             </div>
             <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">ЄСВ</div>
                 <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{tax.esv.toLocaleString('uk-UA')} ₴</p>
             </div>
         </div>

         <div className="mt-4 flex items-start gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
             <Clock className="w-4 h-4" />
             <span className="leading-5">
               {tax.nextPaymentDate ? `Наступна сплата: ${tax.nextPaymentDate}` : "Вкажіть дату сплати у налаштуваннях"}
             </span>
         </div>
    </div>
  );
}
