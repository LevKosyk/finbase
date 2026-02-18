import Link from "next/link";
import { ArrowLeft, Linkedin, Wallet } from "lucide-react";

export default function StaticPageLayout({
  title,
  subtitle,
  backHref = "/",
  children,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <Link href="/" className="flex items-center gap-2 md:justify-self-start">
            <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white shadow-md">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Finbase</span>
          </Link>
          <nav className="hidden md:flex items-center bg-gray-50/50 dark:bg-gray-900/70 p-1.5 rounded-full border border-gray-200/60 dark:border-gray-700 backdrop-blur-sm md:justify-self-center">
            <Link href="/terms" className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[var(--fin-primary)] hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-200">
              Умови
            </Link>
            <Link href="/privacy" className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[var(--fin-primary)] hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-200">
              Політика
            </Link>
            <Link href="/contacts" className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[var(--fin-primary)] hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-200">
              Контакти
            </Link>
          </nav>
          <div className="flex items-center gap-3 md:justify-self-end">
            <Link href={backHref} className="text-sm font-medium text-gray-600 hover:text-[var(--fin-primary)] flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
        {subtitle ? <p className="text-gray-600 mb-8">{subtitle}</p> : null}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 text-gray-700 leading-relaxed">
          {children}
        </div>
      </section>

      <footer className="bg-gray-50 pt-12 pb-8 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-gray-900">Finbase</span>
              </Link>
              <p className="text-gray-500 text-sm">Сервіс для ФОП 3 групи.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#features" className="hover:text-[var(--fin-primary)]">Переваги</Link></li>
                <li><Link href="/#pricing" className="hover:text-[var(--fin-primary)]">Тарифи</Link></li>
                <li><Link href="/#faq" className="hover:text-[var(--fin-primary)]">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Документи</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/terms" className="hover:text-[var(--fin-primary)]">Умови використання</Link></li>
                <li><Link href="/privacy" className="hover:text-[var(--fin-primary)]">Політика конфіденційності</Link></li>
                <li><Link href="/contacts" className="hover:text-[var(--fin-primary)]">Контакти</Link></li>
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
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Finbase. Усі права захищено.</p>
            <div className="flex gap-4">
              <Link href="https://linkedin.com/company/finbase" target="_blank" className="w-10 h-10 rounded-full bg-gray-200 hover:bg-[#0077b5] hover:text-white transition-all flex items-center justify-center text-gray-600">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
