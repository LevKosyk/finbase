"use client";

import { CheckCircle2, Star, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = (planName: string) => {
    // This will be replaced with real payment logic later
    alert(`Перехід до оплати плану ${planName}... (Integrate Payment Provider Here)`);
  };

  return (
    <div className="pb-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Оберіть свій план</h1>
        <p className="text-gray-500 text-lg mb-8">
            Отримайте повний контроль над своїми фінансами та звітністю з Finbase Pro.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex bg-gray-100 p-1 rounded-full relative">
            <Button 
                onClick={() => setBillingCycle('monthly')}
                variant="ghost"
                className={`px-6 py-2 rounded-full text-sm font-bold h-auto ${billingCycle === 'monthly' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:bg-transparent'}`}
            >
                Щомісяця
            </Button>
            <Button 
                onClick={() => setBillingCycle('yearly')}
                variant="ghost"
                className={`px-6 py-2 rounded-full text-sm font-bold h-auto flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:bg-transparent'}`}
            >
                Щорічно
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">-20%</span>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
         {/* Free Plan */}
         <div className="bg-white rounded-3xl p-8 border border-gray-200">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Start</h3>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">₴0</span>
                    <span className="text-gray-500">/назавжди</span>
                </div>
                <p className="text-gray-500 mt-4 text-sm">
                    Ідеально для початківців, щоб спробувати сервіс.
                </p>
            </div>
            <Button 
                variant="secondary"
                className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-700 font-bold mb-8 cursor-default bg-gray-50 h-auto hover:bg-gray-50 hover:border-gray-100 shadow-none pointer-events-none"
            >
                Ваш поточний план
            </Button>
            <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                    <span>До 12 доходів на рік</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                    <span>Базовий калькулятор податків</span>
                </li>
                 <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                    <span>Без експорту в PDF</span>
                </li>
            </ul>
         </div>

         {/* Pro Plan */}
         <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                RECOMMENDED
            </div>
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-colors"></div>

            <div className="relative z-10">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Pro
                        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </h3>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                            {billingCycle === 'monthly' ? '₴249' : '₴199'}
                        </span>
                        <span className="text-gray-400">/міс</span>
                    </div>
                    {billingCycle === 'yearly' && (
                        <p className="text-blue-200 text-xs mt-1 font-medium">
                            Оплата раз на рік 2388 ₴
                        </p>
                    )}
                    <p className="text-gray-400 mt-4 text-sm">
                        Для тих, хто серйозно ставиться до свого бізнесу.
                    </p>
                </div>

                <Button 
                    onClick={() => handleSubscribe('Pro')}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold mb-8 hover:bg-blue-500 shadow-lg shadow-blue-600/30 h-auto"
                >
                    Отримати Pro
                </Button>

                <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>Безлімітна кількість операцій</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>Автоматична генерація звітів</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>Експорт декларації в PDF</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                        <Shield className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>Пріоритетна підтримка 24/7</span>
                    </li>
                </ul>
            </div>
         </div>
      </div>
      
      {/* FAQ Mini */}
      <div className="mt-16 max-w-3xl mx-auto">
         <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Часті питання</h3>
         <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Чи можу я скасувати підписку?</h4>
                <p className="text-gray-500 text-sm mt-1">Так, ви можете скасувати підписку в будь-який момент у налаштуваннях.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Чи безпечна оплата?</h4>
                <p className="text-gray-500 text-sm mt-1">Ми використовуємо захищені платіжні шлюзи. Ваші дані картки не зберігаються на наших серверах.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
