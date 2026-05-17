"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/sales/add")) {
    return {
      title: "Record a Sale",
      description: "Capture item details and save transactions quickly",
    };
  }

  if (pathname === "/") {
    return {
      title: "Dashboard",
      description: "Overview of your sales activity",
    };
  }

  if (pathname.startsWith("/sales")) {
    return {
      title: "Sales",
      description: "Manage and track your sales records",
    };
  }

  if (pathname.startsWith("/expenses")) {
    return {
      title: "Expenses",
      description: "Track costs and recurring spend",
    };
  }

  if (pathname.startsWith("/profit")) {
    return {
      title: "Profit",
      description: "Monitor revenue, expenses, and margin",
    };
  }

  if (pathname.startsWith("/invoices")) {
    return {
      title: "Invoices & Receipts",
      description: "Manage billing documents and confirmations",
    };
  }

  if (pathname.startsWith("/customers")) {
    return {
      title: "Customers",
      description: "Manage customer records and relationships",
    };
  }

  if (pathname.startsWith("/reports")) {
    return {
      title: "Reports",
      description: "View business insights and performance",
    };
  }

  if (pathname.startsWith("/notifications")) {
    return {
      title: "Notifications",
      description: "Track business alerts and growth opportunities",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Settings",
      description: "Manage business and account preferences",
    };
  }

  if (pathname.startsWith("/help")) {
    return {
      title: "Help & Support",
      description: "Get assistance, guides, and troubleshooting resources",
    };
  }

  return {
    title: "Sales Tracker",
    description: "Manage your business operations",
  };
}

function TopbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { title, description } = getPageMeta(pathname);
  const currentSearch = searchParams.get("search") || "";

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-stone-300 bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileSidebar />
          <div className="min-w-0">
            <h1 className="truncate text-base font-medium text-black">{title}</h1>
            <p className="truncate text-xs font-medium text-neutral-400">
              {description}
            </p>
          </div>
          <form
            className="ml-4 hidden md:block"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const term = String(formData.get("search") || "").trim();
              const query = new URLSearchParams();
              if (term) query.set("search", term);
              router.push(`/sales${query.toString() ? `?${query.toString()}` : ""}`);
            }}
          >
            <div className="relative w-52">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3 -translate-y-1/2 text-neutral-400" />
              <Input
                name="search"
                defaultValue={currentSearch}
                placeholder="Search transactions..."
                className="h-7 rounded-[20px] border-0 bg-zinc-100 pl-8 text-[10px] font-medium text-neutral-500 shadow-none placeholder:text-[10px] placeholder:font-medium placeholder:text-neutral-400 focus-visible:ring-1"
              />
            </div>
          </form>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/notifications"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100"
            aria-label="Notifications"
          >
            <Bell className="size-4 text-indigo-500" />
          </Link>

          <button
            type="button"
            className="flex items-center gap-2 px-1 py-0.5"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-300 text-xs font-semibold text-zinc-700">
              K
            </span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-semibold text-black">
                Kelvin Kyere
              </span>
              <span className="block text-[10px] font-semibold text-neutral-400">
                Owner
              </span>
            </span>
            <ChevronDown className="ml-1 size-3.5 text-neutral-500" />
          </button>
        </div>
      </div>
    </header>
  );
}

function TopbarFallback() {
  return (
    <header className="h-14 border-b border-stone-300 bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-4">
        <MobileSidebar />
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
      </div>
    </header>
  );
}

export function Topbar() {
  return (
    <Suspense fallback={<TopbarFallback />}>
      <TopbarContent />
    </Suspense>
  );
}
