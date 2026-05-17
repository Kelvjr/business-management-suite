"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Calculator,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  Receipt,
  Settings,
  WalletCards,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales", href: "/sales", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: WalletCards },
  { name: "Profit", href: "/profit", icon: Calculator },
  { name: "Invoices", href: "/invoices", icon: Landmark },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const settingsItems = [
  { name: "Preferences", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const iconOnly = collapsed && !onNavigate;

  function renderItem(item: {
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
  }) {
    const Icon = item.icon;
    const active = isActivePath(pathname, item.href);

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onNavigate}
        className={[
          "flex items-center rounded-xl px-3 py-2 text-sm transition-all duration-300 ease-in-out",
          iconOnly ? "justify-center" : "gap-3",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        ].join(" ")}
        title={iconOnly ? item.name : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
            iconOnly
              ? "max-w-0 -translate-x-1 opacity-0"
              : "max-w-[140px] translate-x-0 opacity-100",
          )}
        >
          {item.name}
        </span>
      </Link>
    );
  }

  return (
    <nav className="space-y-5 p-3">
      <div className="space-y-1">
        <p
          className={cn(
            "overflow-hidden px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 transition-all duration-300 ease-in-out",
            iconOnly ? "max-h-0 pb-0 opacity-0" : "max-h-5 pb-1 opacity-100",
          )}
        >
          Menu
        </p>
        {menuItems.map(renderItem)}
      </div>

      <div className="space-y-1">
        <p
          className={cn(
            "overflow-hidden px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 transition-all duration-300 ease-in-out",
            iconOnly ? "max-h-0 pb-0 opacity-0" : "max-h-5 pb-1 opacity-100",
          )}
        >
          Settings
        </p>
        {settingsItems.map(renderItem)}
      </div>
    </nav>
  );
}
