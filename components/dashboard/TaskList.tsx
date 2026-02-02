import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { getReminders } from "@/app/actions/dashboard";

export default async function TaskList() {
  const reminders = await getReminders();

  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm h-full">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Задачі</h3>
            <span className="text-xs font-bold text-[var(--fin-primary)] bg-blue-50 px-2 py-1 rounded-lg">
                {reminders.filter(r => !r.completed).length} активних
            </span>
         </div>

         <div className="space-y-4">
             {reminders.map((task) => (
                 <div key={task.id} className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                     <div className={`mt-0.5 ${task.completed ? 'text-green-500' : 'text-gray-300 group-hover:text-[var(--fin-primary)]'}`}>
                         {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                     </div>
                     <div className="flex-1">
                         <h4 className={`text-sm font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                             {task.title}
                         </h4>
                         <p className="text-xs text-gray-500 mt-1 font-medium">{task.date}</p>
                     </div>
                     {!task.completed && (
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowRight className="w-4 h-4 text-gray-400" />
                         </div>
                     )}
                 </div>
             ))}
         </div>
    </div>
  );
}
