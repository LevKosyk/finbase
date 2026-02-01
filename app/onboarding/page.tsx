"use client";
import AuthLayout from "@/components/AuthLayout";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  return (
    <AuthLayout
      title="Налаштування профілю"
      subtitle="Вкажіть дані вашого ФОП, щоб ми могли автоматизувати розрахунки."
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Як вас звати?</label>
           <input 
             type="text" 
             placeholder="Ім'я та Прізвище" 
             className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--fin-primary)] focus:border-transparent transition-all"
           />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Група ФОП</label>
           <div className="grid grid-cols-1 gap-3">
              <label className="relative flex items-center p-4 rounded-xl border border-blue-500 bg-blue-50 cursor-pointer">
                 <input type="radio" name="group" className="sr-only" defaultChecked />
                 <div className="flex-1">
                    <div className="flex items-center gap-2">
                         <span className="font-bold text-gray-900">3 група</span>
                         <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold">Рекомендовано</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Єдиний податок 5% + ЄСВ</p>
                 </div>
                 <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                 </div>
              </label>

              <label className="relative flex items-center p-4 rounded-xl border border-gray-200 opacity-50 cursor-not-allowed">
                 <input type="radio" name="group" className="sr-only" disabled />
                 <div className="flex-1">
                    <div className="flex items-center gap-2">
                         <span className="font-bold text-gray-900">2 група</span>
                         <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">Скоро</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Фіксований податок</p>
                 </div>
              </label>
           </div>
        </div>
        
        <button
          onClick={() => alert("Дані збережено! Перехід до дашборду...")}
          className="w-full flex items-center justify-center gap-2 bg-[var(--fin-primary)] text-white font-bold py-4 rounded-xl hover:bg-[var(--fin-secondary)] shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          Завершити налаштування
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </AuthLayout>
  );
}
