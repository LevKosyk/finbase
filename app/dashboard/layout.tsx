"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import GlobalAI from "@/components/dashboard/GlobalAI";
import { UIProvider } from "@/components/providers/UIProvider";
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  PieChart, 
  Settings, 
  Wallet, 
  X 
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: 'Дашборд', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Доходи', href: '/dashboard/income', icon: Wallet },
    { name: 'Статистика', href: '/dashboard/statistics', icon: PieChart },
    { name: 'Налаштування', href: '/dashboard/settings', icon: Settings },
  ];

  const isLinkActive = (item: { href: string, exact?: boolean }) => {
     if (item.exact) return pathname === item.href;
     return pathname.startsWith(item.href);
  };

  return (
    <UIProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar - Desktop */}
        <aside 
          className={`hidden md:flex flex-col bg-white border-r border-gray-200 fixed h-full z-20 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900 animate-in fade-in duration-300">Finbase</span>
              )}
            </div>
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 text-gray-500 z-50 text-xs"
            >
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-hidden">
            {navItems.map((item) => {
               const active = isLinkActive(item);
               return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    active 
                      ? 'bg-blue-50 text-[var(--fin-primary)]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={item.name}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
               );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
             <Button 
               variant="ghost"
               onClick={handleLogout}
               className={`justify-start px-4 text-red-600 hover:text-red-700 hover:bg-red-50 ${isCollapsed ? 'justify-center px-2' : ''}`}
               leftIcon={<LogOut className="w-5 h-5" />}
              >
              {!isCollapsed && "Вийти"}
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
             {navItems.map((item) => {
               const active = isLinkActive(item);
               return (
                 <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={() => setSidebarOpen(false)} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-blue-50 text-[var(--fin-primary)]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                 >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
               );
             })}
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
        <main 
          className={`flex-1 p-4 md:p-8 mt-16 md:mt-0 transition-all duration-300 ease-in-out ${
              isCollapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto">
              {children}
          </div>
        </main>
        
        <GlobalAI />

      </div>
    </UIProvider>
  );
}
