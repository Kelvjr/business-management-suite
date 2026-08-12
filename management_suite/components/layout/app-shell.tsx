"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  CircleHelp,
  Command,
  CreditCard,
  Gauge,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SectionKey = "overview" | "sales" | "finance" | "customers" | "inventory" | "purchasing" | "reports";
type MenuItem = { label: string; href?: string; note?: string };
type Section = { key: SectionKey; label: string; icon: typeof Gauge; href: string; items: MenuItem[] };

const sections: Section[] = [
  { key: "overview", label: "Overview", icon: Gauge, href: "/", items: [
    { label: "Dashboard", href: "/" }, { label: "Activity", href: "/activity" },
  ] },
  { key: "sales", label: "Sales", icon: ShoppingBag, href: "/sales", items: [
    { label: "All Sales", href: "/sales" }, { label: "Record Sale", href: "/sales/new" }, { label: "Sales Channels", href: "/sales/channels" },
  ] },
  { key: "finance", label: "Finance", icon: WalletCards, href: "/expenses", items: [
    { label: "Expenses", href: "/expenses" }, { label: "Invoices", href: "/invoices" }, { label: "Payments", href: "/finance/payments" }, { label: "Outstanding Balances", href: "/finance/outstanding" },
  ] },
  { key: "customers", label: "Customers", icon: Users, href: "/customers", items: [
    { label: "All Customers", href: "/customers" },
  ] },
  { key: "inventory", label: "Inventory", icon: Boxes, href: "/catalog", items: [
    { label: "Products", href: "/catalog" }, { label: "Categories", href: "/inventory/categories" },
  ] },
  { key: "purchasing", label: "Purchasing", icon: PackageCheck, href: "/purchases", items: [
    { label: "Suppliers", href: "/suppliers" }, { label: "Purchases", href: "/purchases" },
  ] },
  { key: "reports", label: "Reports", icon: BarChart3, href: "/reports", items: [
    { label: "All Reports", href: "/reports" },
  ] },
];

const sectionForPath = (pathname: string): SectionKey => {
  if (pathname === "/" || pathname.startsWith("/activity") || pathname.startsWith("/alerts")) return "overview";
  if (pathname.startsWith("/sales")) return "sales";
  if (pathname.startsWith("/expenses") || pathname.startsWith("/invoices") || pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/customers")) return "customers";
  if (pathname.startsWith("/catalog") || pathname.startsWith("/inventory")) return "inventory";
  if (pathname.startsWith("/suppliers") || pathname.startsWith("/purchases") || pathname.startsWith("/purchasing")) return "purchasing";
  if (pathname.startsWith("/reports")) return "reports";
  return "overview";
};

type AppShellProps = { title: string; subtitle: string; children: ReactNode; actions?: ReactNode; mobileNavOpen: boolean; onMobileNavChange: (open: boolean) => void };

function Logo() {
  return <Link href="/" className="grid h-16 place-items-center" aria-label="Renaissance home"><span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-600/25">R</span></Link>;
}

function Rail({ selected, pathname, choose, close }: { selected: SectionKey; pathname: string; choose: (key: SectionKey) => void; close?: () => void }) {
  return <div className="flex h-full flex-col bg-[#f5f6ff] dark:bg-[#161B22]">
    <Logo />
    <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-2 py-3" aria-label="Main sections">
      {sections.map((section) => <Link key={section.key} href={section.href} title={section.label} aria-label={section.label} onClick={() => { choose(section.key); close?.(); }} className={cn("group relative grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white", selected === section.key && "bg-white text-violet-700 shadow-sm dark:bg-white/10 dark:text-violet-300")}>
        <section.icon className="size-[18px]" />
        {selected === section.key && <span className="absolute -left-2 h-5 w-0.5 rounded-r-full bg-violet-600" />}
      </Link>)}
    </nav>
    <nav className="grid place-items-center gap-1 border-t border-violet-200/70 py-3 dark:border-white/8" aria-label="Support and account">
      <Link href="/help" title="Help" aria-label="Help" onClick={close} className={cn("grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white", pathname.startsWith("/help") && "bg-white text-violet-700 shadow-sm dark:bg-white/10 dark:text-violet-300")}><CircleHelp className="size-[18px]" /></Link>
      <Link href="/settings" title="Settings" aria-label="Settings" onClick={close} className={cn("grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white", pathname.startsWith("/settings") && "bg-white text-violet-700 shadow-sm dark:bg-white/10 dark:text-violet-300")}><Settings className="size-[18px]" /></Link>
      <Link href="/" title="Logout" aria-label="Logout" onClick={close} className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"><LogOut className="size-[18px]" /></Link>
    </nav>
  </div>;
}

function ContextMenu({ section, pathname, close }: { section: Section; pathname: string; close?: () => void }) {
  return <div className="flex h-full min-w-0 flex-col bg-white dark:bg-[#161B22]">
    <div className="flex h-16 items-center justify-between border-b px-5 dark:border-white/8">
      <div><p className="font-display text-[15px] font-bold tracking-tight">{section.label}</p><p className="text-[10px] text-muted-foreground">Renaissance workspace</p></div>
      {close && <Button variant="ghost" size="icon" onClick={close}><X /></Button>}
    </div>
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label={`${section.label} menu`}>
      <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">{section.label}</p>
      <div className="space-y-1">{section.items.map((item) => {
        const active = item.href === pathname;
        if (!item.href) return <div key={item.label} className="flex h-9 items-center rounded-lg px-3 text-[12px] text-muted-foreground/65"><span className="truncate">{item.label}</span><span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide">{item.note}</span></div>;
        return <Link key={item.label} href={item.href} onClick={close} className={cn("flex h-9 items-center rounded-lg px-3 text-[12px] font-medium transition hover:bg-violet-50 hover:text-violet-800 dark:hover:bg-white/6 dark:hover:text-white", active ? "bg-violet-100 text-violet-800 dark:bg-violet-500/14 dark:text-violet-200" : "text-slate-600 dark:text-slate-400")}>{item.label}</Link>;
      })}</div>
    </nav>
  </div>;
}

export function AppShell({ title, subtitle, children, actions, mobileNavOpen, onMobileNavChange }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); } };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const selectedKey = sectionForPath(pathname);
  const selected = sections.find((section) => section.key === selectedKey) ?? sections[0];
  const searchItems = useMemo(() => sections.flatMap((section) => section.items.filter((item) => item.href).map((item) => ({ ...item, section: section.label }))).filter((item) => `${item.label} ${item.section}`.toLowerCase().includes(query.toLowerCase().trim())), [query]);
  const toggleTheme = () => { const next = !document.documentElement.classList.contains("dark"); document.documentElement.classList.toggle("dark", next); window.localStorage.setItem("renaissance-theme-v2", next ? "dark" : "light"); };
  const go = (href: string) => { setSearchOpen(false); setQuery(""); router.push(href); };

  return <div className="app-canvas min-h-screen lg:grid lg:grid-cols-[64px_208px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen border-r border-violet-200/70 lg:block dark:border-white/8"><Rail selected={selectedKey} pathname={pathname} choose={() => undefined}/></aside>
    <aside className="sticky top-0 hidden h-screen border-r lg:block dark:border-white/8"><ContextMenu section={selected} pathname={pathname}/></aside>
    {mobileNavOpen && <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden" onClick={() => onMobileNavChange(false)}><aside className="grid h-full w-[min(340px,92vw)] grid-cols-[60px_minmax(0,1fr)] shadow-2xl" onClick={(event) => event.stopPropagation()}><Rail selected={selectedKey} pathname={pathname} choose={() => undefined} close={() => onMobileNavChange(false)}/><ContextMenu section={selected} pathname={pathname} close={() => onMobileNavChange(false)}/></aside></div>}

    <main className="relative min-w-0">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-3"><Button variant="outline" size="icon" aria-label="Open navigation" className="shrink-0 lg:hidden" onClick={() => onMobileNavChange(true)}><Menu/></Button><h1 className="truncate font-display text-[17px] font-bold tracking-[-.03em] sm:text-xl">{title}</h1></div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="hidden h-9 w-48 items-center gap-2 rounded-xl border bg-card px-3 text-left text-[11px] text-muted-foreground shadow-sm transition hover:border-violet-300 xl:flex"><Search className="size-3.5"/><span className="flex-1">Search anything...</span><kbd className="rounded bg-muted px-1.5 py-0.5 text-[9px]">⌘K</kbd></button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Notifications" className="relative"><Bell/><span className="absolute right-2 top-2 size-1.5 rounded-full bg-violet-600 ring-2 ring-background"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-72"><DropdownMenuItem><div><p className="font-medium">2 invoices need attention</p><p className="text-[10px] text-muted-foreground">Review outstanding balances</p></div></DropdownMenuItem><DropdownMenuItem><div><p className="font-medium">Low stock alert</p><p className="text-[10px] text-muted-foreground">3 products are near their limit</p></div></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle color theme"><Moon className="dark:hidden"/><Sun className="hidden dark:block"/></Button>
            <DropdownMenu><DropdownMenuTrigger asChild><button className="hidden items-center gap-2 rounded-xl px-1.5 py-1 text-left transition hover:bg-muted sm:flex"><span className="grid size-8 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white">KK</span><span className="hidden lg:block"><span className="block text-[11px] font-semibold">Kelvin Kyere</span><span className="block text-[9px] text-muted-foreground">Owner</span></span><ChevronDown className="size-3 text-muted-foreground"/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem><Users/>Profile</DropdownMenuItem><DropdownMenuItem><CreditCard/>Plan & billing</DropdownMenuItem><DropdownMenuItem><Settings/>Workspace settings</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </div>
        <div className="flex min-h-12 items-center justify-between gap-4 border-t px-4 py-2 sm:px-6 lg:px-7"><p className="min-w-0 truncate text-[11px] text-muted-foreground sm:text-xs">{subtitle}</p>{actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}</div>
      </header>
      <div className="mx-auto max-w-[1560px] p-4 sm:p-5 lg:p-4 xl:p-5">{children}</div>
    </main>

    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="top-[18%] translate-y-0 p-0 sm:max-w-2xl"><DialogHeader className="sr-only"><DialogTitle>Search Renaissance</DialogTitle><DialogDescription>Find any page in your workspace.</DialogDescription></DialogHeader><div className="flex items-center gap-3 border-b px-4"><Command className="size-5 text-muted-foreground"/><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sales, invoices, customers, reports..." className="h-14 border-0 bg-transparent px-0 shadow-none focus:ring-0"/></div><div className="max-h-[360px] overflow-y-auto p-2">{searchItems.length ? searchItems.slice(0,12).map((item) => <button key={`${item.section}-${item.label}`} onClick={() => go(item.href!)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-muted"><span className="text-sm font-medium">{item.label}</span><span className="text-[10px] text-muted-foreground">{item.section}</span></button>) : <div className="grid place-items-center py-12 text-sm text-muted-foreground">No matching pages</div>}</div></DialogContent></Dialog>
  </div>;
}
