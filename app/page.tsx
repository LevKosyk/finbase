"use client";

import Link from "next/link";
import { 
  CheckCircle2, 
  ChevronRight, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  FileText, 
  ArrowRight,
  Menu,
  X,
  HelpCircle,
  TrendingUp,
  PieChart,
  Wallet,
  Bot
} from "lucide-react";
import { useState } from "react";
import AIHelper from "@/components/AIHelper";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--fin-background)] text-[var(--fin-text-main)] font-sans">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_2px_20px_-2px_rgba(0,0,0,0.02)] supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-6 h-[88px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
              <div className="relative w-11 h-11 bg-gradient-to-br from-[var(--fin-primary)] to-[#2563EB] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 group-hover:shadow-blue-500/30 ring-1 ring-white/20">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900 group-hover:text-[var(--fin-primary)] transition-colors">Finbase</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center bg-gray-50/50 p-1.5 rounded-full border border-gray-200/60 backdrop-blur-sm">
            <Link href="#features" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-[var(--fin-primary)] hover:bg-white rounded-full transition-all duration-200">
              Переваги
            </Link>
            <Link href="#how-it-works" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-[var(--fin-primary)] hover:bg-white rounded-full transition-all duration-200">
              Як це працює
            </Link>
            <Link href="#pricing" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-[var(--fin-primary)] hover:bg-white rounded-full transition-all duration-200">
              Тарифи
            </Link>
            <Link href="#faq" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-[var(--fin-primary)] hover:bg-white rounded-full transition-all duration-200">
              FAQ
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-[var(--fin-primary)] transition-colors px-4"
            >
              Увійти
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-[var(--fin-primary)] text-white text-sm font-semibold shadow-xl shadow-blue-500/20 hover:bg-[var(--fin-secondary)] hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 ring-4 ring-blue-500/10"
            >
              Реєстрація
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-2">
            <Link href="#features" className="text-lg font-medium text-gray-800 p-2 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Переваги</Link>
            <Link href="#how-it-works" className="text-lg font-medium text-gray-800 p-2 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Як це працює</Link>
            <Link href="#pricing" className="text-lg font-medium text-gray-800 p-2 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Тарифи</Link>
            <hr className="border-gray-100" />
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/login" className="text-center py-3 font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">Увійти</Link>
              <Link href="/register" className="text-center py-3 rounded-xl bg-[var(--fin-primary)] text-white font-semibold shadow-lg shadow-blue-500/20">Створити акаунт</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-50 to-transparent -z-10" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[var(--fin-primary)] text-xs font-bold uppercase tracking-wide mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--fin-primary)] animate-pulse"></span>
            Для ФОП 3 групи
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
            Ваша бухгалтерія <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-primary)] to-[var(--fin-info)]">
              проста як ніколи
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Повний контроль над податками та звітністю. Забудьте про Excel та складні сервіси. Ми зробили все за вас.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/register"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 rounded-full bg-[var(--fin-primary)] text-white text-lg font-semibold shadow-xl shadow-blue-600/20 hover:bg-[var(--fin-secondary)] hover:shadow-2xl hover:shadow-blue-600/30 transition-all transform hover:-translate-y-1"
            >
              Спробувати безкоштовно
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 rounded-full bg-white text-gray-700 border border-gray-200 text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Як це працює
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--fin-success)]" />
              <span>Швидка реєстрація</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--fin-success)]" />
              <span>Безкоштовний старт</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--fin-success)]" />
              <span>Безпека даних</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-10 border-y border-gray-100 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">5хв</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">На перший звіт</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">Точність</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">Доступ</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">PDF</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">Експорт</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Все необхідне в одному місці
            </h2>
            <p className="text-lg text-gray-600">
              Ми прибрали все зайве, залишивши тільки те, що дійсно потрібно для спокійного ведення ФОП.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[var(--fin-primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Розумний калькулятор</h3>
              <p className="text-gray-600 leading-relaxed">
                Автоматичний розрахунок єдиного податку та ЄСВ на основі введених доходів. Жодних формул вручну.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Календар подій</h3>
              <p className="text-gray-600 leading-relaxed">
                Ми нагадаємо, коли платити податки та подавати звіти. Ваш персональний фінансовий асистент.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Звітність та історія</h3>
              <p className="text-gray-600 leading-relaxed">
                Зберігайте всі декларації та квитанції в одному місці. Експортуйте PDF для банку чи податкової.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-[var(--fin-primary)] text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Як це працює?</h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Три прості кроки до повного порядку у фінансах
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="text-center relative">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold mb-6 border border-white/20 backdrop-blur-sm">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Реєстрація</h3>
              <p className="text-blue-100">Створіть акаунт та вкажіть базові дані про ваш ФОП.</p>
            </div>
            <div className="hidden md:block absolute top-10 left-[20%] w-[20%] h-0.5 bg-gradient-to-r from-white/10 to-white/40"></div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold mb-6 border border-white/20 backdrop-blur-sm">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Внесення доходів</h3>
              <p className="text-blue-100">Додавайте суми надходжень у міру їх отримання.</p>
            </div>
            <div className="hidden md:block absolute top-10 right-[20%] w-[20%] h-0.5 bg-gradient-to-r from-white/40 to-white/10"></div>

            <div className="text-center relative">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold mb-6 border border-white/20 backdrop-blur-sm">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Звіти готові</h3>
              <p className="text-blue-100">Система сама розрахує податки та сформує звіти.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Прозорі тарифи</h2>
            <p className="text-lg text-gray-600">Обирайте те, що підходить саме вам</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  Start
                </span>
                <h3 className="text-4xl font-bold text-gray-900 mt-4">₴0</h3>
                <p className="text-gray-500 mt-2">назавжди</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                  <span>Базовий калькулятор податків</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                  <span>Нагадування про дедлайни</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                  <span>Історія за останні 3 місяці</span>
                </li>
              </ul>
              <Link 
                href="/app/register"
                className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-[var(--fin-primary)] hover:text-[var(--fin-primary)] transition-colors text-center"
              >
                Почати безкоштовно
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[var(--fin-primary)] shadow-xl relative flex flex-col overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--fin-primary)] text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                POPULAR
              </div>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[var(--fin-primary)] text-xs font-bold uppercase tracking-wide">
                  Pro
                </span>
                <h3 className="text-4xl font-bold text-gray-900 mt-4">₴249</h3>
                <p className="text-gray-500 mt-2">на місяць</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[var(--fin-primary)] shrink-0" />
                  <span>Безлімітна історія операцій</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[var(--fin-primary)] shrink-0" />
                  <span>Експорт звітів у PDF</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[var(--fin-primary)] shrink-0" />
                  <span>Пріоритетна підтримка</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[var(--fin-primary)] shrink-0" />
                  <span>Аналітика доходів</span>
                </li>
              </ul>
              <Link 
                href="/app/register"
                className="w-full py-4 rounded-xl bg-[var(--fin-primary)] text-white font-bold hover:bg-[var(--fin-secondary)] shadow-lg shadow-blue-500/20 transition-all text-center"
              >
                Спробувати Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Часті запитання</h2>
          </div>
          
          <div className="space-y-6">
             <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
               <h3 className="font-bold text-lg text-gray-900 mb-2">Чи підходить це для 2 групи ФОП?</h3>
               <p className="text-gray-600">
                 Наразі сервіс оптимізовано виключно для ФОП 3 групи (5% ставка). Ми плануємо додати підтримку інших груп у майбутньому.
               </p>
             </div>
             <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
               <h3 className="font-bold text-lg text-gray-900 mb-2">Чи безпечні мої дані?</h3>
               <p className="text-gray-600">
                 Так. Ми використовуємо сучасні протоколи шифрування. Ваші дані зберігаються на захищених серверах і ми не передаємо їх третім особам.
               </p>
             </div>
             <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
               <h3 className="font-bold text-lg text-gray-900 mb-2">Як скасувати підписку?</h3>
               <p className="text-gray-600">
                 Ви можете скасувати підписку в будь-який момент у налаштуваннях профілю. Доступ до Pro функцій збережеться до кінця оплаченого періоду.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900 -z-10"></div>
        <div className="absolute inset-0 bg-[var(--fin-primary)]/20 -z-10 bg-blend-overlay"></div>
        
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Готові навести лад у справах?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Приєднуйтесь до підприємців, які вже заощаджують свій час з Finbase.
          </p>
          <Link
            href="/app/register"
            className="inline-flex items-center justify-center gap-2 h-16 px-10 rounded-full bg-white text-gray-900 text-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Почати зараз <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-gray-900">Finbase</span>
              </Link>
              <p className="text-gray-500 text-sm">
                Сучасний інструмент для ведення бухгалтерії ФОП 3 групи. Просто, швидко, надійно.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features" className="hover:text-[var(--fin-primary)]">Переваги</Link></li>
                <li><Link href="#pricing" className="hover:text-[var(--fin-primary)]">Тарифи</Link></li>
                <li><Link href="#faq" className="hover:text-[var(--fin-primary)]">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Компанія</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/terms" className="hover:text-[var(--fin-primary)]">Умови використання</Link></li>
                <li><Link href="/privacy" className="hover:text-[var(--fin-primary)]">Політика конфіденційності</Link></li>
                <li><Link href="/contact" className="hover:text-[var(--fin-primary)]">Контакти</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Контакти</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>support@finbase.ua</li>
                <li>Київ, Україна</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Finbase. Усі права захищено.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"></div>
            </div>
          </div>
        </div>
      </footer>

      <AIHelper isOpen={isAIHelperOpen} onClose={() => setIsAIHelperOpen(false)} />

      {/* AI Helper Floating Button */}
      <button
        onClick={() => setIsAIHelperOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-[var(--fin-primary)] text-white rounded-full shadow-xl shadow-blue-500/30 hover:bg-[var(--fin-secondary)] hover:scale-105 transition-all duration-300 group"
      >
        <div className="relative">
           <div className="absolute inset-0 bg-white blur-md opacity-20 rounded-full animate-pulse"></div>
           <Bot className="w-6 h-6 relative z-10" />
        </div>
        <span className="font-semibold pr-1">AI-помічник</span>
      </button>
    </main>
  );
}