"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  UserCircle,
  PieChart,
  Sparkles,
  Bot
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import AIHelper from "@/components/AIHelper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">Finbase</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-[var(--fin-primary)] font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Дашборд
          </Link>
          <Link href="/dashboard/income" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
            <Wallet className="w-5 h-5" />
            Доходи
          </Link>
          <Link href="/dashboard/statistics" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
            <PieChart className="w-5 h-5" />
            Статистика
          </Link>
          <Link href="/dashboard/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold transition-colors">
            <Sparkles className="w-5 h-5" />
            AI Помічник
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
            <Settings className="w-5 h-5" />
            Налаштування
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <Button 
             variant="ghost"
             onClick={handleLogout}
             className="w-full justify-start px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
             leftIcon={<LogOut className="w-5 h-5" />}
            >
            Вийти
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-gray-900">Finbase</span>
         </div>
         <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 text-gray-600 h-auto"
         >
            {sidebarOpen ? <X /> : <Menu />}
         </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 left-0 w-64 h-full bg-white z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100">
             <span className="text-xl font-bold text-gray-900">Меню</span>
        </div>
        <nav className="p-4 space-y-2">
           <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-[var(--fin-primary)] font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Дашборд
          </Link>
           <Link href="/dashboard/income" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
            <Wallet className="w-5 h-5" />
            Доходи
          </Link>
           <Link href="/dashboard/settings" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
            <Settings className="w-5 h-5" />
            Налаштування
          </Link>
            <Button 
             variant="ghost"
             onClick={handleLogout}
             className="w-full justify-start px-4 text-red-600 hover:text-red-700 hover:bg-red-50 mt-4 h-auto py-3"
             leftIcon={<LogOut className="w-5 h-5" />}
            >
            Вийти
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
      </main>

      <AIHelper isOpen={isAIHelperOpen} onClose={() => setIsAIHelperOpen(false)} />

      {/* AI Helper Floating Button */}
      <Button
        onClick={() => setIsAIHelperOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 h-auto bg-[var(--fin-primary)] text-white rounded-full shadow-xl shadow-blue-500/30 hover:bg-[var(--fin-secondary)] hover:scale-105 transition-all duration-300 group"
      >
        <div className="relative">
           <div className="absolute inset-0 bg-white blur-md opacity-20 rounded-full animate-pulse"></div>
           <Bot className="w-6 h-6 relative z-10" />
        </div>
        <span className="font-semibold pr-1">AI-помічник</span>
      </Button>
    </div>
  );
}
