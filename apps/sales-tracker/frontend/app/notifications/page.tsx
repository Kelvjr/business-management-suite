"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Bell, Calendar, Lightbulb, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type NotificationCategory = "critical" | "growth";
type NotificationBucket = "today" | "week";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  bucket: NotificationBucket;
  timeAgo: string;
  tag?: "CRITICAL";
  actionLabel: string;
  actionHref: string;
  icon: "warning" | "alert" | "growth" | "report" | "milestone";
};

const notifications: NotificationItem[] = [
  {
    id: "sales-drop",
    title: "Sales dropped 30% this week",
    message:
      "Your weekly revenue is currently at $12,400 compared to $17,800 last week. The drop seems concentrated in your Electronic Accessories category.",
    category: "critical",
    bucket: "today",
    timeAgo: "2h ago",
    tag: "CRITICAL",
    actionLabel: "Review Analytics",
    actionHref: "/reports",
    icon: "warning",
  },
  {
    id: "no-sales-today",
    title: "No sales recorded today",
    message:
      "You haven't logged any transactions since 8:00 AM. If you've made manual sales, remember to record them to keep your reports accurate.",
    category: "critical",
    bucket: "today",
    timeAgo: "5h ago",
    actionLabel: "Add Transaction",
    actionHref: "/sales/add",
    icon: "alert",
  },
  {
    id: "retention-up",
    title: "You're doing better than last week",
    message:
      "Your customer retention rate has climbed to 84%, a 5% increase from the previous 7 days. Your VIP segment is highly active.",
    category: "growth",
    bucket: "week",
    timeAgo: "1d ago",
    actionLabel: "View Customers",
    actionHref: "/customers",
    icon: "growth",
  },
  {
    id: "weekly-report-ready",
    title: "Weekly report is ready",
    message:
      "Your automated sales performance summary for Oct 14 - Oct 21 is now available for download or review.",
    category: "growth",
    bucket: "week",
    timeAgo: "2d ago",
    actionLabel: "Open Report",
    actionHref: "/reports",
    icon: "report",
  },
  {
    id: "top-customer-milestone",
    title: "Top customer milestone",
    message:
      "Sarah Jenkins just made her 10th purchase. Consider sending a loyalty discount code to keep the momentum going.",
    category: "growth",
    bucket: "week",
    timeAgo: "3d ago",
    actionLabel: "Send Reward",
    actionHref: "/customers",
    icon: "milestone",
  },
];

const pulseCards = [
  { title: "Revenue Trend", value: "$42.5k", delta: "+12%", tone: "up" as const },
  { title: "Avg Order Value", value: "$128", delta: "-3.4%", tone: "down" as const },
  { title: "Customer Churn", value: "1.2%", delta: "-0.5%", tone: "neutral" as const },
  { title: "Sales Velocity", value: "24/day", delta: "Flat", tone: "flat" as const },
];

type FilterTab = "all" | "critical" | "growth";
type DateFilter = "any" | "today" | "week";

export default function NotificationsPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (dismissedIds.includes(item.id)) return false;
      if (tab !== "all" && item.category !== tab) return false;
      if (dateFilter === "today" && item.bucket !== "today") return false;
      if (dateFilter === "week" && item.bucket !== "week") return false;
      return true;
    });
  }, [dateFilter, dismissedIds, tab]);

  const newToday = visibleNotifications.filter((item) => item.bucket === "today");
  const earlierWeek = visibleNotifications.filter((item) => item.bucket === "week");

  return (
    <AppShell>
      <div className="mx-auto max-w-[1184px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-fuchsia-600" />
            <h1 className="text-sm font-bold uppercase tracking-wider text-gray-600">
              Business Pulse
            </h1>
          </div>
          <div className="inline-flex h-6 items-center rounded-xl border border-zinc-200/60 bg-white px-3 text-xs font-medium text-zinc-900">
            Live Updates
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pulseCards.map((card) => (
            <Card key={card.title} className="rounded-[10px] border-0 bg-white/70 shadow-sm">
              <CardContent className="space-y-1 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold leading-8 text-zinc-900">{card.value}</p>
                <p
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    card.tone === "down" ? "text-red-600" : "text-zinc-900",
                    card.tone === "flat" ? "text-gray-600" : "",
                  )}
                >
                  {card.tone === "up" ? <TrendingUp className="size-3" /> : null}
                  {card.tone === "down" ? <TrendingDown className="size-3" /> : null}
                  {card.delta}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-2xl border border-zinc-200/50 bg-gray-100/60 p-1">
            <FilterButton active={tab === "all"} onClick={() => setTab("all")}>
              All Alerts
            </FilterButton>
            <FilterButton active={tab === "critical"} onClick={() => setTab("critical")}>
              Critical
            </FilterButton>
            <FilterButton active={tab === "growth"} onClick={() => setTab("growth")}>
              Growth Tips
            </FilterButton>
          </div>

          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as DateFilter)}
          >
            <SelectTrigger className="h-9 w-[150px] rounded-2xl border-zinc-200/70 bg-white text-sm text-gray-600">
              <Calendar className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="any">Filter by Date</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Earlier this week</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <NotificationSection
          title="New Today"
          items={newToday}
          onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
        />
        <NotificationSection
          title="Earlier this Week"
          items={earlierWeek}
          onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
        />

        <Card className="rounded-2xl border border-fuchsia-600/10 bg-gradient-to-br from-fuchsia-600/5 to-orange-500/5 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Sparkles className="size-7 text-fuchsia-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-zinc-900">AI Business Assistant</p>
              <p className="mt-1 text-sm text-gray-600">
                Our system noticed you have a high volume of sales on Tuesday afternoons.
                Would you like us to generate a staffing recommendation for next week?
              </p>
              <div className="mt-3 flex items-center gap-5">
                <button
                  type="button"
                  className="text-sm font-bold text-fuchsia-600 hover:underline"
                >
                  Yes, generate advice
                </button>
                <button type="button" className="text-sm font-bold text-gray-600 hover:underline">
                  Not now
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function NotificationSection({
  title,
  items,
  onDismiss,
}: {
  title: string;
  items: NotificationItem[];
  onDismiss: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <p className="text-xs font-bold uppercase text-gray-600/70">{title}</p>
        <div className="h-px flex-1 bg-zinc-200/60" />
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <AlertCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
        ))}
      </div>
    </section>
  );
}

function AlertCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: () => void;
}) {
  return (
    <Card className="rounded-[10px] border-0 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn("mt-0.5 flex size-12 items-center justify-center rounded-2xl", iconBgClass(item.icon))}>
            {iconFor(item.icon)}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold leading-7 text-zinc-900">{item.title}</p>
              {item.tag ? (
                <span className="rounded-[10px] bg-orange-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  {item.tag}
                </span>
              ) : null}
              <span className="ml-auto text-xs font-medium text-gray-600">{item.timeAgo}</span>
            </div>
            <p className="mt-2 text-base text-gray-600">{item.message}</p>

            <div className="mt-4 flex items-center gap-2">
              <Button
                asChild
                className={cn(
                  "h-9 rounded-2xl px-5 text-sm font-medium text-white",
                  item.category === "critical" ? "bg-orange-500 hover:bg-orange-600" : "bg-fuchsia-600 hover:bg-fuchsia-700",
                )}
              >
                <Link href={item.actionHref}>{item.actionLabel}</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-2xl px-4 text-sm text-gray-600 hover:text-zinc-900"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-[10px] px-6 text-xs font-medium transition-colors",
        active ? "bg-white text-neutral-800 shadow-sm" : "text-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

function iconFor(type: NotificationItem["icon"]) {
  if (type === "warning") return <TrendingDown className="size-6 text-orange-500" />;
  if (type === "alert") return <AlertTriangle className="size-6 text-red-600" />;
  if (type === "growth") return <TrendingUp className="size-6 text-fuchsia-600" />;
  if (type === "report") return <Bell className="size-6 text-blue-600" />;
  return <Lightbulb className="size-6 text-fuchsia-600" />;
}

function iconBgClass(type: NotificationItem["icon"]) {
  if (type === "warning") return "bg-orange-50";
  if (type === "alert") return "bg-red-50";
  if (type === "growth") return "bg-purple-50";
  if (type === "report") return "bg-blue-50";
  return "bg-purple-50";
}

