"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  Receipt,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();

  const mainItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Sales", href: "/sales", icon: Receipt },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  function isActivePath(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-stone-300 bg-white transition-[width] duration-300 ease-in-out lg:block",
        collapsed ? "w-[72px]" : "w-[18%]",
      )}
    >
      <div className="relative h-full">
        <div className="flex h-14 items-center border-b border-stone-300 px-3">
          {collapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-[5px] bg-fuchsia-700"
            >
              <Sparkles className="size-4 text-white" />
            </button>
          ) : (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-fuchsia-700">
                <Sparkles className="size-4 text-white" />
              </div>
              <p className="ml-2 text-base font-bold text-fuchsia-700">586Flow</p>
              <Button
                type="button"
                variant="ghost"
                className="ml-auto h-8 w-8 text-stone-600"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex h-[calc(100%-56px)] flex-col justify-between">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-5">
            <nav className="space-y-1">
              {mainItems.map((item) => {
                const active = isActivePath(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={[
                      "relative flex h-8 items-center rounded-[10px] px-2.5",
                      active ? "bg-fuchsia-700/20" : "hover:bg-zinc-100",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={[
                        "size-[18px] shrink-0",
                        active ? "text-fuchsia-700" : "text-black",
                      ].join(" ")}
                    />
                    {!collapsed ? (
                      <span
                        className={[
                          "ml-2.5 text-[13px] font-medium",
                          active ? "text-fuchsia-700" : "text-black",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    ) : null}
                    {!collapsed && active ? (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full bg-fuchsia-700",
                          collapsed ? "ml-auto" : "ml-auto",
                        )}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

          </div>

          <div>
            <div className="space-y-1 px-3 py-3">
              <Link
                href="/settings"
                className={cn(
                  "relative flex h-8 items-center rounded-[10px] px-2.5 text-[13px] font-medium",
                  isActivePath("/settings")
                    ? "bg-fuchsia-700/20 text-fuchsia-700"
                    : "text-black hover:bg-zinc-100 hover:text-fuchsia-700",
                )}
                title={collapsed ? "Settings" : undefined}
              >
                <Settings className="size-[18px] shrink-0" />
                {!collapsed ? <span className="ml-2.5">Settings</span> : null}
              </Link>
              <Link
                href="/help"
                className={cn(
                  "relative flex h-8 w-full items-center rounded-[10px] px-2.5 text-[13px] font-medium",
                  isActivePath("/help")
                    ? "bg-fuchsia-700/20 text-fuchsia-700"
                    : "text-black hover:bg-zinc-100 hover:text-fuchsia-700",
                )}
                title={collapsed ? "Help & Support" : undefined}
              >
                <HelpCircle className="size-[18px] shrink-0" />
                {!collapsed ? <span className="ml-2.5">Help &amp; Support</span> : null}
              </Link>
              <button
                type="button"
                className="relative flex h-8 w-full items-center rounded-[10px] px-2.5 text-[13px] font-medium text-black hover:bg-zinc-100 hover:text-fuchsia-700"
                title={collapsed ? "Logout" : undefined}
              >
                <LogOut className="size-[18px] shrink-0" />
                {!collapsed ? <span className="ml-2.5">Logout</span> : null}
              </button>
            </div>

            {!collapsed ? (
              <div className="border-t border-stone-300 px-3 py-2">
                <p className="text-xs font-normal text-neutral-400">Workspace</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-950">Company Name</p>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300"
                    aria-label="Workspace options"
                  >
                    <MoreHorizontal className="size-4 text-stone-950" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
