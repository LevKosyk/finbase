"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Bell, Building2, CreditCard, Laptop } from "lucide-react";

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
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-100/80 rounded-2xl mb-8 w-fit">
      {navItems.map((item) => {
        const isActive = item.active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
              ${isActive 
                ? "bg-white text-gray-900 shadow-sm shadow-gray-200/50" 
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }
            `}
          >
            <item.icon className={`w-4 h-4 ${isActive ? "text-[var(--fin-primary)]" : ""}`} />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
