"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowDownToLine, ArrowUpRight, Banknote, Bell, CalendarDays, ChevronDown, CircleHelp,
  CreditCard, FileDown, Gauge, Landmark, Menu, MoreHorizontal, Package, Plus, Receipt, Search,
  Settings, ShoppingBag, Sparkles, Trash2, TrendingUp, Users, WalletCards, X,
} from "lucide-react";
import { SaleFormDialog } from "@/components/sales/sale-form-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salesApi } from "@/lib/api";
import { exportCsv, exportPdf } from "@/lib/exporters";
import { makeDemoSales, paymentLabels, type Sale, type SaleInput } from "@/lib/sales";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";

const categoryColors = ["#17a673", "#23395d", "#f2a65a", "#7d8fa8", "#d7654c"];
const nav = [
  { label: "Overview", icon: Gauge, active: true, href: "/" }, { label: "Sales", icon: ShoppingBag, href: "/sales" },
  { label: "Expenses", icon: Receipt, href: "/expenses" },
  { label: "Customers", icon: Users, soon: true, href: "#" }, { label: "Products", icon: Package, soon: true, href: "#" },
  { label: "Payouts", icon: Landmark, soon: true, href: "#" },
];

const sameDay = (left: Date, right: Date) => left.toDateString() === right.toDateString();

function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string; format: (value: number) => string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border bg-white px-3 py-2 shadow-xl"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-display text-sm font-bold">{format(payload[0].value ?? 0)}</p></div>;
}

export function SalesDashboard() {
  const router = useRouter();
  const { formatMoney, formatCompactMoney, settings } = useBusinessSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [query, setQuery] = useState("");
  const [tableScope, setTableScope] = useState<"all" | "today">("all");
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    salesApi.list()
      .then(setSales)
      .catch(() => { setSales(makeDemoSales()); setDemoMode(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const scoped = tableScope === "today" ? sales.filter((sale) => sameDay(new Date(sale.soldAt), new Date())) : sales;
    return needle ? scoped.filter((sale) => [sale.reference, sale.customerName, sale.description, sale.category].some((value) => value?.toLowerCase().includes(needle))) : scoped;
  }, [query, sales, tableScope]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = sales.filter((sale) => sameDay(new Date(sale.soldAt), now));
    const week = sales.filter((sale) => new Date(sale.soldAt) >= daysAgo(6));
    const month = sales.filter((sale) => new Date(sale.soldAt) >= monthStart);
    const sum = (rows: Sale[]) => rows.reduce((total, sale) => total + sale.amount, 0);
    return { today: sum(today), todayCount: today.length, week: sum(week), weekCount: week.length, month: sum(month), monthCount: month.length, average: month.length ? sum(month) / month.length : 0 };
  }, [sales]);

  const chartData = useMemo(() => Array.from({ length: chartPeriod }, (_, index) => {
    const date = daysAgo(chartPeriod - 1 - index);
    return {
      label: date.toLocaleDateString("en-US", chartPeriod === 7 ? { weekday: "short" } : { month: "short", day: "numeric" }),
      revenue: sales.filter((sale) => sameDay(new Date(sale.soldAt), date)).reduce((sum, sale) => sum + sale.amount, 0),
    };
  }), [sales, chartPeriod]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    sales.filter((sale) => new Date(sale.soldAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).forEach((sale) => map.set(sale.category, (map.get(sale.category) ?? 0) + sale.amount));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [sales]);

  async function saveSale(input: SaleInput) {
    if (demoMode) {
      if (editing) setSales((current) => current.map((sale) => sale.id === editing.id ? { ...sale, ...input, id: sale.id, reference: input.reference || sale.reference, customerName: input.customer?.name ?? input.customerName ?? sale.customerName, customer: sale.customer } : sale));
      else setSales((current) => [{ ...input, id: `demo-${Date.now()}`, reference: input.reference || `SAL-${new Date().getFullYear()}-${String(1250 + current.length).padStart(4, "0")}`, customerName: input.customer?.name ?? input.customerName ?? null, customer: null }, ...current]);
    } else if (editing) {
      const updated = await salesApi.update(editing.id, input);
      setSales((current) => current.map((sale) => sale.id === editing.id ? updated : sale));
    } else {
      const created = await salesApi.create(input);
      setSales((current) => [created, ...current]);
    }
    setNotice(editing ? "Sale updated" : "Sale recorded");
    setEditing(null);
  }

  async function removeSale() {
    if (!deleting) return;
    if (!demoMode) await salesApi.remove(deleting.id);
    setSales((current) => current.filter((sale) => sale.id !== deleting.id));
    setDeleting(null);
    setNotice("Sale deleted");
  }

  const openNew = () => router.push("/sales/new");
  const openEdit = (sale: Sale) => { setEditing(sale); setFormOpen(true); };

  return <div className="min-h-screen bg-background lg:grid lg:grid-cols-[216px_minmax(0,1fr)]">
    <aside className="hidden min-h-screen border-r border-white/8 bg-[#13233a] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#24b47e] shadow-[0_8px_24px_rgba(36,180,126,.25)]"><TrendingUp className="size-5" /></div>
        <div><p className="font-display text-[15px] font-bold tracking-tight">Renaissance</p><p className="text-[10px] uppercase tracking-[.16em] text-slate-400">Management suite</p></div>
      </div>
      <nav className="flex-1 px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Workspace</p>
        <div className="space-y-1">{nav.map((item) => item.soon ? <div key={item.label} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-500"><item.icon className="size-4" /><span>{item.label}</span><span className="ml-auto rounded-full bg-white/6 px-2 py-0.5 text-[9px] uppercase tracking-wide">Soon</span></div> : <Link key={item.label} href={item.href} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition ${item.active ? "bg-white/10 font-semibold text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><item.icon className={`size-4 ${item.active ? "text-[#42d49a]" : ""}`} /><span>{item.label}</span></Link>)}</div>
      </nav>
      <div className="m-3 rounded-xl border border-white/8 bg-white/[.04] p-3">
        <div className="mb-3 flex items-center gap-2"><Sparkles className="size-4 text-[#42d49a]" /><span className="text-xs font-semibold">Your first module</span></div>
        <p className="text-[11px] leading-5 text-slate-400">Sales and expenses are live. Customers and profit come next.</p>
      </div>
      <div className="border-t border-white/8 p-3"><Link href="/settings" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5"><Settings className="size-4" />Settings</Link><Link href="/help" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5"><CircleHelp className="size-4" />Help & support</Link></div>
    </aside>

    {mobileNav && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileNav(false)}><aside className="h-full w-72 bg-[#13233a] p-4 text-white" onClick={(e) => e.stopPropagation()}><div className="mb-8 flex items-center justify-between"><span className="font-display font-bold">Renaissance</span><Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setMobileNav(false)}><X /></Button></div>{nav.map((item) => item.soon ? <div key={item.label} className="mb-1 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-500"><item.icon className="size-4" />{item.label}<span className="ml-auto text-[9px] uppercase">Soon</span></div> : <Link key={item.label} href={item.href} onClick={() => setMobileNav(false)} className={`mb-1 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm ${item.active ? "bg-white/10" : "text-slate-400"}`}><item.icon className="size-4" />{item.label}</Link>)}<div className="mt-6 border-t border-white/8 pt-4"><Link href="/settings" onClick={() => setMobileNav(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400"><Settings className="size-4" />Settings</Link><Link href="/help" onClick={() => setMobileNav(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400"><CircleHelp className="size-4" />Help & support</Link></div></aside></div>}

    <main className="min-w-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:h-18 lg:px-6">
        <div className="flex items-center gap-3"><Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)}><Menu /></Button><div><p className="font-display text-base font-bold tracking-tight sm:text-lg">Sales overview</p><p className="hidden text-xs text-muted-foreground sm:block">Know exactly what your business made.</p></div></div>
        <div className="flex items-center gap-2">
          {demoMode && <Badge className="hidden border-amber-200 bg-amber-50 text-amber-700 sm:inline-flex">Demo data</Badge>}
          <Button variant="outline" size="icon" aria-label="Notifications"><Bell /></Button>
          <Button onClick={openNew}><Plus /> <span className="hidden sm:inline">Record sale</span><span className="sm:hidden">Add</span></Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-5 xl:p-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(420px,1.35fr)_minmax(300px,.65fr)] xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
          <div className="metric-grid relative overflow-hidden rounded-2xl bg-[#172a45] p-6 text-white shadow-[0_16px_42px_rgba(21,39,65,.14)] sm:p-7">
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-[.16em] text-slate-400">Revenue this month</p><p className="mt-3 font-display text-4xl font-bold tracking-[-.04em] sm:text-5xl">{formatMoney(stats.month)}</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><Banknote className="size-5 text-[#42d49a]" /></div></div>
              <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-400">Across <span className="font-semibold text-white">{stats.monthCount} sales</span></p><p className="mt-1 text-xs text-slate-500">Updated when you record a sale</p></div><button onClick={() => document.getElementById("sales-table")?.scrollIntoView()} className="flex items-center gap-2 text-sm font-semibold text-[#62dba9] transition hover:text-white">See every sale <ArrowUpRight className="size-4" /></button></div>
            </div>
            <div className="absolute -right-16 -top-20 size-64 rounded-full border-[36px] border-[#24b47e]/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Today", value: stats.today, meta: `${stats.todayCount} transactions`, icon: CalendarDays },
              { label: "Last 7 days", value: stats.week, meta: `${stats.weekCount} transactions`, icon: TrendingUp },
              { label: "Average sale", value: stats.average, meta: "This month", icon: WalletCards },
              { label: "Total sales", value: stats.monthCount, meta: "This month", icon: CreditCard, count: true },
            ].map((item) => <Card key={item.label} className="min-w-0"><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{item.label}</p><item.icon className="size-4 text-[#1b9a6b]" /></div><p className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">{item.count ? item.value : formatMoney(item.value)}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{item.meta}</p></CardContent></Card>) }
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px] min-[1380px]:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Revenue trend</CardTitle><CardDescription>Money coming into your business over time</CardDescription></div><div className="flex rounded-lg bg-muted p-1"><button onClick={() => setChartPeriod(7)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${chartPeriod === 7 ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}>7 days</button><button onClick={() => setChartPeriod(30)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${chartPeriod === 30 ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}>30 days</button></div></CardHeader>
            <CardContent><div className="h-[285px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 4, left: -16, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#24b47e" stopOpacity={0.24} /><stop offset="100%" stopColor="#24b47e" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} className="chart-grid" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8190a5" }} interval={chartPeriod === 30 ? 4 : 0} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8190a5" }} tickFormatter={(value) => formatCompactMoney(value)} /><Tooltip content={<ChartTooltip format={formatMoney} />} cursor={{ stroke: "#24b47e", strokeDasharray: "3 3" }} /><Area type="monotone" dataKey="revenue" stroke="#1ca270" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, strokeWidth: 3, stroke: "white", fill: "#1ca270" }} /></AreaChart></ResponsiveContainer></div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Revenue mix</CardTitle><CardDescription>Where this month&apos;s money came from</CardDescription></CardHeader>
            <CardContent>
              <div className="relative mx-auto h-[160px] max-w-[230px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} innerRadius={54} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">{categories.map((entry, index) => <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span><strong className="font-display text-lg">{formatCompactMoney(stats.month)}</strong></div></div>
              <div className="mt-3 space-y-3">{categories.map((category, index) => <div key={category.name} className="flex items-center gap-2.5 text-sm"><span className="size-2 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} /><span className="min-w-0 flex-1 truncate text-muted-foreground">{category.name}</span><span className="font-display text-xs font-bold">{formatMoney(category.value)}</span></div>)}</div>
            </CardContent>
          </Card>
        </section>

        <Card id="sales-table">
          <CardHeader className="gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div><CardTitle>Recent sales</CardTitle><CardDescription>{filtered.length} records · newest first</CardDescription></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={tableScope} onValueChange={(value) => setTableScope(value as "all" | "today")}><SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sales</SelectItem><SelectItem value="today">Today</SelectItem></SelectContent></Select>
              <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="w-full pl-9 sm:w-64" placeholder="Search sales…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><ArrowDownToLine />Export<ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => exportCsv(filtered, settings.currency)}><FileDown />Export CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportPdf(filtered, settings.currency)}><FileDown />Export PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="grid place-items-center py-20"><div className="size-8 animate-spin rounded-full border-2 border-muted border-t-[#24b47e]" /></div> : filtered.length === 0 ? <div className="grid place-items-center px-6 py-20 text-center"><div className="mb-3 grid size-11 place-items-center rounded-full bg-muted"><Search className="size-5 text-muted-foreground" /></div><p className="font-display font-semibold">No sales found</p><p className="mt-1 text-sm text-muted-foreground">Try a different search, or record a new sale.</p></div> : <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Sale</TableHead><TableHead className="hidden md:table-cell">Customer</TableHead><TableHead>Category</TableHead><TableHead className="hidden xl:table-cell">Payment</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{filtered.map((sale) => <TableRow key={sale.id} tabIndex={0} role="link" aria-label={`Open ${sale.reference}`} className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => router.push(`/sales/${sale.id}`)} onKeyDown={(event) => { if (event.key === "Enter") router.push(`/sales/${sale.id}`); }}><TableCell><div className="font-medium transition-colors hover:text-[#168e64]">{sale.description}</div><div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sale.reference}</div></TableCell><TableCell className="hidden text-muted-foreground md:table-cell">{sale.customerName ?? "Walk-in customer"}</TableCell><TableCell><Badge>{sale.category}</Badge></TableCell><TableCell className="hidden text-muted-foreground xl:table-cell">{paymentLabels[sale.paymentMethod]}</TableCell><TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell"><div>{new Date(sale.soldAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div><div className="text-[11px]">{new Date(sale.soldAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div></TableCell><TableCell className="text-right font-display font-bold">{formatMoney(sale.amount)}</TableCell><TableCell onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${sale.reference}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openEdit(sale)}>Edit sale</DropdownMenuItem><DropdownMenuItem className="text-red-600 focus:bg-red-50" onSelect={() => setDeleting(sale)}><Trash2 />Delete sale</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table>}
          </CardContent>
        </Card>
        <p className="pb-2 text-center text-[11px] text-muted-foreground">Renaissance Sales · Your clearest answer to “How much did we make?”</p>
      </div>
    </main>

    <SaleFormDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }} sale={editing} onSave={saveSale} />
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this sale?</AlertDialogTitle><AlertDialogDescription>This removes {deleting?.reference} and {deleting ? formatMoney(deleting.amount) : "its value"} from your revenue totals. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="destructive" onClick={removeSale}>Delete sale</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {notice && <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-[#13233a] px-4 py-3 text-sm font-medium text-white shadow-2xl"><span className="size-2 rounded-full bg-[#42d49a]" />{notice}</div>}
  </div>;
}
