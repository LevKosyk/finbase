"use client";

import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white shadow-md">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Finbase</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-[var(--fin-primary)] flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            На головну
          </Link>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Умови використання</h1>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 text-gray-700 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Загальні положення</h2>
                <p>
                    Ці Умови використання (далі - "Умови") регулюють використання веб-сайту та сервісів Finbase. Реєструючись або використовуючи наш сервіс, ви погоджуєтесь з цими Умовами.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Опис послуг</h2>
                <p>
                    Finbase надає програмне забезпечення для автоматизації бухгалтерського обліку фізичних осіб-підприємців (ФОП). Ми не надаємо професійних податкових консультацій, а лише інструмент для розрахунків.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Реєстрація та безпека</h2>
                <p>
                    Користувач несе відповідальність за збереження конфіденційності свого пароля та за всі дії, що відбуваються під його обліковим записом.
                </p>
            </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Відмова від відповідальності</h2>
                <p>
                    Ми докладаємо всіх зусиль для забезпечення точності розрахунків, але не несемо відповідальності за можливі податкові штрафи, що виникли внаслідок неправильного введення даних користувачем або змін у законодавстві.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Зміни до умов</h2>
                <p>
                    Ми залишаємо за собою право вносити зміни до цих Умов у будь-який час. Продовження використання сервісу означає згоду зі змінами.
                </p>
            </section>
            
            <p className="text-sm text-gray-500 pt-4 border-t border-gray-100 mt-8">
                Останнє оновлення: 01.02.2026
            </p>
        </div>
      </div>
    </main>
  );
}
