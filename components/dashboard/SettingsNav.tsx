"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Bell, Building2, CreditCard, Laptop, SlidersHorizontal } from "lucide-react";

export default function SettingsNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Загальні",
      href: "/dashboard/settings",
      icon: User,
      active: pathname === "/dashboard/settings"
    },
    {
      name: "Мій ФОП",
      href: "/dashboard/settings/business",
      icon: Building2,
      active: pathname === "/dashboard/settings/business"
    },
    {
      name: "Безпека",
      href: "/dashboard/settings/security",
      icon: Shield,
      active: pathname === "/dashboard/settings/security"
    },
    {
      name: "Сповіщення",
      href: "/dashboard/settings/notifications",
      icon: Bell,
      active: pathname === "/dashboard/settings/notifications"
    },
    {
      name: "Підписка",
      href: "/dashboard/settings/billing",
      icon: CreditCard,
      active: pathname === "/dashboard/settings/billing"
    },
    {
      name: "Система",
      href: "/dashboard/settings/system",
      icon: Laptop,
      active: pathname === "/dashboard/settings/system"
    },
    {
      name: "Правила",
      href: "/dashboard/settings/rules",
      icon: SlidersHorizontal,
      active: pathname === "/dashboard/settings/rules"
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl mb-6 w-fit">
      {navItems.map((item) => {
        const isActive = item.active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
              ${isActive 
                ? "bg-[var(--fin-primary)] text-white shadow-sm shadow-blue-500/20" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            `}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
