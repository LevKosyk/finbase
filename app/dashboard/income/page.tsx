import { Plus, Download, ArrowUpRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getIncomes } from "@/app/actions/income";
import IncomeList from "@/components/dashboard/IncomeList";

export default async function IncomePage() {
  const incomes = await getIncomes();

  return (
    <div className="pb-12 max-w-6xl mx-auto">
      {/* Header with improved layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Облік доходів</h1>
           <p className="text-gray-500 text-lg">Всі ваші фінансові надходження під контролем</p>
        </div>
        <div className="flex gap-3">
            <Button 
                variant="secondary"
                className="font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm text-gray-700 bg-white"
                leftIcon={<Download className="w-5 h-5" />}
            >
                <span className="hidden sm:inline">Експорт</span>
            </Button>
            <Button 
                className="font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                leftIcon={<Plus className="w-5 h-5" />}
            >
                Додати дохід
            </Button>
        </div>
      </div>

      {/* Summary Stats Row - could be dynamic later */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-green-100 transition-colors"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Цей місяць</p>
            <h3 className="text-3xl font-extrabold text-gray-900">14 200 ₴</h3>
            <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                <ArrowUpRight className="w-4 h-4" />
                +12% <span className="text-gray-400 font-medium ml-1">від минулого</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-100 transition-colors"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Середній чек</p>
            <h3 className="text-3xl font-extrabold text-gray-900">2 850 ₴</h3>
            <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm font-bold">
                 <ArrowUpRight className="w-4 h-4" />
                 +5% <span className="text-gray-400 font-medium ml-1">динаміка</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-100 transition-colors"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Очікується</p>
            <h3 className="text-3xl font-extrabold text-gray-900">1 500 ₴</h3>
            <div className="flex items-center gap-1 mt-2 text-orange-500 text-sm font-bold">
                 <Calendar className="w-4 h-4" />
                 1 платіж <span className="text-gray-400 font-medium ml-1">в обробці</span>
            </div>
         </div>
      </div>

      {/* Main Content Card */}
      <IncomeList initialIncomes={incomes} />
    </div>
  );
}
