"use client";

import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Політика конфіденційності</h1>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 text-gray-700 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Збір інформації</h2>
                <p>
                    Ми збираємо лише ту інформацію, яка необхідна для надання наших послуг: ваше ім'я, електронну адресу (через Google Auth) та фінансові дані, які ви вносите для розрахунків.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Використання даних</h2>
                <p>
                    Ваші дані використовуються виключно для:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Створення вашого облікового запису;</li>
                    <li>Здійснення податкових розрахунків;</li>
                    <li>Надсилання повідомлень про дедлайни;</li>
                    <li>Покращення роботи сервісу.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Захист даних</h2>
                <p>
                    Ми застосовуємо сучасні методи шифрування та протоколи безпеки для захисту ваших персональних даних від несанкціонованого доступу.
                </p>
            </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Передача третім особам</h2>
                <p>
                    Ми **ніколи** не продаємо та не передаємо ваші особисті дані третім особам, окрім випадків, передбачених законодавством.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Ваші права</h2>
                <p>
                    Ви маєте право в будь-який час вимагати видалення вашого облікового запису та всіх пов'язаних з ним даних, звернувшись до нашої служби підтримки.
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
