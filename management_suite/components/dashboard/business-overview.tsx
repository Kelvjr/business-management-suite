"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Eye,
  FileDown,
  FileUp,
  FileText,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExpenses } from "@/hooks/use-expenses";
import { useSales } from "@/hooks/use-sales";
import { suiteApi } from "@/lib/api";
import { exportCsv, exportPdf } from "@/lib/exporters";
import { paymentLabels, type Sale } from "@/lib/sales";
import type { CustomerInsight, Invoice } from "@/lib/suite";

const palette = ["#8b5cf6", "#22c55e", "#06b6d4", "#ec4899", "#f97316", "#eab308"];
type RangeDays = 7 | 30 | 90 | 180 | 365;

const atStartOfDay = (value: Date) => { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; };
const daysAgo = (days: number) => { const date = atStartOfDay(new Date()); date.setDate(date.getDate() - days); return date; };
const sameDay = (left: Date, right: Date) => left.toDateString() === right.toDateString();
const percentChange = (current: number, previous: number) => previous ? ((current - previous) / Math.abs(previous)) * 100 : current ? 100 : 0;
const channelForSale = (sale: Sale) => sale.amount >= 2000 ? "Wholesale" : sale.paymentMethod === "CASH" || sale.paymentMethod === "CARD" ? "In-store" : "Online";

function MetricCard({ label, value, change, icon: Icon, positive, color, data }: { label: string; value: string; change: number; icon: typeof TrendingUp; positive: boolean; color: string; data: number[] }) {
  const chartData = data.length ? data.map((point, index) => ({ index, point })) : [{ index: 0, point: 0 }, { index: 1, point: 0 }];
  return <Card className="group @container relative min-h-[112px] overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:hover:border-violet-500/30">
    <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }}/>
    <CardContent className="relative p-3.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[10px] font-medium text-muted-foreground">{label}</p><p className="mt-1.5 truncate font-display text-lg font-bold tracking-[-.045em] @min-[190px]:text-xl">{value}</p></div><span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: `${color}14`, color }}><Icon className="size-3.5"/></span></div><div className="mt-2 flex items-center gap-1 text-[9px]"><span className={positive ? "text-emerald-600" : "text-rose-500"}>{change >= 0 ? <ArrowUpRight className="inline size-2.5"/> : <ArrowDownRight className="inline size-2.5"/>}{Math.abs(change).toFixed(1)}%</span><span className="hidden text-muted-foreground @min-[210px]:inline">vs prior period</span></div><div className="pointer-events-none absolute bottom-1 right-2 h-8 w-[58px] opacity-55 transition group-hover:opacity-100 @min-[190px]:h-9 @min-[190px]:w-[76px]"><ResponsiveContainer><AreaChart data={chartData}><defs><linearGradient id={`metric-${label.replaceAll(" ", "-")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs><Area type="monotone" dataKey="point" stroke={color} strokeWidth={1.8} fill={`url(#metric-${label.replaceAll(" ", "-")})`} dot={false}/></AreaChart></ResponsiveContainer></div></CardContent>
  </Card>;
}

function QuickAction({ href, icon: Icon, label, note, color }: { href: string; icon: typeof ShoppingBag; label: string; note: string; color: string }) {
  return <Link href={href} className="group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/70 hover:shadow-sm dark:hover:border-violet-500/25 dark:hover:bg-violet-500/5" style={{ "--action-color": color } as CSSProperties}><span className="grid size-8 place-items-center rounded-lg border bg-card transition duration-200 group-hover:scale-105 group-hover:border-transparent group-hover:bg-[var(--action-color)] group-hover:text-white" style={{ color }}><Icon className="size-3.5"/></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold">{label}</span><span className="block truncate text-[9px] text-muted-foreground">{note}</span></span><ArrowRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-violet-600"/></Link>;
}

export function BusinessOverview() {
  const business = useBusinessSettings();
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const [mobileNav, setMobileNav] = useState(false);
  const [range, setRange] = useState<RangeDays>(30);
  const [expenseRange, setExpenseRange] = useState<RangeDays>(180);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [importNotice, setImportNotice] = useState("");
  const csvInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<CustomerInsight[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    Promise.all([
      suiteApi.customerInsights().catch(() => [] as CustomerInsight[]),
      suiteApi.invoices().catch(() => [] as Invoice[]),
    ]).then(([nextCustomers, nextInvoices]) => { setCustomers(nextCustomers); setInvoices(nextInvoices); });
  }, []);

  const currentStart = daysAgo(range - 1);
  const previousStart = daysAgo(range * 2 - 1);
  const previousEnd = currentStart;
  const currentSales = sales.filter((sale) => new Date(sale.soldAt) >= currentStart);
  const previousSales = sales.filter((sale) => { const date = new Date(sale.soldAt); return date >= previousStart && date < previousEnd; });
  const currentExpenses = expenses.filter((expense) => new Date(expense.incurredAt) >= currentStart);
  const previousExpenses = expenses.filter((expense) => { const date = new Date(expense.incurredAt); return date >= previousStart && date < previousEnd; });
  const currentInvoices = invoices.filter((invoice) => new Date(invoice.issuedAt) >= currentStart);
  const previousInvoices = invoices.filter((invoice) => { const date = new Date(invoice.issuedAt); return date >= previousStart && date < previousEnd; });
  const revenue = currentSales.reduce((sum, sale) => sum + sale.amount, 0);
  const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.amount, 0);
  const spending = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousSpending = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = revenue - spending;
  const previousProfit = previousRevenue - previousSpending;
  const customerNames = new Set(currentSales.map((sale) => sale.customerName).filter(Boolean));
  const previousCustomerNames = new Set(previousSales.map((sale) => sale.customerName).filter(Boolean));
  const outstanding = currentInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.total - invoice.amountPaid), 0);
  const previousOutstanding = previousInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.total - invoice.amountPaid), 0);

  const trend = useMemo(() => {
    const bucketSize = range <= 30 ? 1 : range <= 90 ? 7 : range <= 180 ? 14 : 30;
    const points = Math.ceil(range / bucketSize);
    return Array.from({ length: points }, (_, index) => {
      const endOffset = range - 1 - index * bucketSize;
      const end = daysAgo(Math.max(0, endOffset - (bucketSize - 1)));
      const start = daysAgo(endOffset);
      const endExclusive = new Date(+end + 86400000);
      const bucketSales = sales.filter((sale) => { const date = new Date(sale.soldAt); return date >= start && date < endExclusive; });
      const bucketExpenses = expenses.filter((expense) => { const date = new Date(expense.incurredAt); return date >= start && date < endExclusive; });
      return { label: start.toLocaleDateString("en-GH", { month: "short", day: "numeric" }), revenue: bucketSales.reduce((sum, sale) => sum + sale.amount, 0), expenses: bucketExpenses.reduce((sum, expense) => sum + expense.amount, 0), sales: bucketSales.length, customers: new Set(bucketSales.map((sale) => sale.customerName).filter(Boolean)).size };
    });
  }, [range, sales, expenses]);

  const expenseRows = expenses.filter((expense) => new Date(expense.incurredAt) >= daysAgo(expenseRange - 1));
  const expenseTotal = expenseRows.reduce((sum, item) => sum + item.amount, 0);
  const expenseMap = new Map<string, number>(); expenseRows.forEach((expense) => expenseMap.set(expense.category, (expenseMap.get(expense.category) ?? 0) + expense.amount));
  const expenseMix = [...expenseMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const salesMap = new Map<string, number>(); currentSales.forEach((sale) => salesMap.set(sale.category, (salesMap.get(sale.category) ?? 0) + sale.amount));
  const salesMix = [...salesMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const customerMap = new Map<string, { value: number; orders: number }>(); currentSales.forEach((sale) => { const name = sale.customerName || "Walk-in customers"; const row = customerMap.get(name) ?? { value: 0, orders: 0 }; customerMap.set(name, { value: row.value + sale.amount, orders: row.orders + 1 }); });
  const topCustomers = [...customerMap].map(([name, data]) => ({ name, ...data })).sort((a, b) => b.value - a.value).slice(0, 5);
  const productMap = new Map<string, number>(); currentSales.forEach((sale) => productMap.set(sale.description, (productMap.get(sale.description) ?? 0) + sale.amount));
  const topProducts = [...productMap].map(([name, value]) => ({ name: name.length > 20 ? `${name.slice(0, 20)}…` : name, value })).sort((a, b) => b.value - a.value).slice(0, 5).reverse();
  const channelMap = new Map<string, number>([["In-store", 0], ["Online", 0], ["Wholesale", 0]]); currentSales.forEach((sale) => { const channel = channelForSale(sale); channelMap.set(channel, (channelMap.get(channel) ?? 0) + sale.amount); });
  const salesChannels = [...channelMap].map(([name, value]) => ({ name, value }));
  const recentTransactions = [...sales.slice(0, 4).map((sale) => ({ id: sale.id, title: sale.description, date: sale.soldAt, amount: sale.amount, kind: "sale" as const })), ...expenses.slice(0, 4).map((expense) => ({ id: expense.id, title: expense.description, date: expense.incurredAt, amount: expense.amount, kind: "expense" as const }))].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6);
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== "PAID").slice(0, 4);
  const rangeLabel = range === 7 ? "Last 7 days" : range === 30 ? "Last 30 days" : range === 90 ? "Last 3 months" : range === 180 ? "Last 6 months" : "Last year";
  const expenseRangeLabel = expenseRange === 7 ? "Last 7 days" : expenseRange === 30 ? "Last 30 days" : expenseRange === 90 ? "Last 3 months" : expenseRange === 180 ? "Last 6 months" : "Last year";
  const rangeActions = <><div className="hidden items-center gap-1 text-[9px] text-muted-foreground sm:flex"><CalendarDays className="size-3 text-violet-600"/>Period</div><Select value={String(range)} onValueChange={(value) => setRange(Number(value) as RangeDays)}><SelectTrigger className="h-7 w-[112px] rounded-md px-2.5 text-[10px]"><SelectValue>{rangeLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 3 months</SelectItem><SelectItem value="180">Last 6 months</SelectItem><SelectItem value="365">Last year</SelectItem></SelectContent></Select><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px]"><FileUp/>Import<ChevronDown className="size-3"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => csvInput.current?.click()}><FileUp/>Import CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => pdfInput.current?.click()}><FileUp/>Import PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" className="h-7 bg-violet-600 px-2.5 text-[10px] text-white shadow-sm hover:bg-violet-700"><FileDown/>Export<ChevronDown className="size-3"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => exportCsv(currentSales, business.settings.currency)}><FileDown/>Export CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportPdf(currentSales, business.settings.currency)}><FileDown/>Export PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu><input ref={csvInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setImportNotice(`${file.name} selected for CSV import`); event.currentTarget.value = ""; }}/><input ref={pdfInput} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setImportNotice(`${file.name} selected for PDF import`); event.currentTarget.value = ""; }}/></>;

  return <AppShell title="Welcome back, Kelvin!" subtitle="Here’s an overview of your business today." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav} actions={rangeActions}>
    <div className="dashboard-page grid gap-4 min-[1050px]:grid-cols-[minmax(0,1fr)_260px]">
      <section className="contents">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <MetricCard label="Revenue" value={business.formatMoney(revenue)} change={percentChange(revenue, previousRevenue)} icon={TrendingUp} positive={revenue >= previousRevenue} color="#16a46f" data={trend.map((item) => item.revenue)}/>
          <MetricCard label="Expenses" value={business.formatMoney(spending)} change={percentChange(spending, previousSpending)} icon={WalletCards} positive={spending <= previousSpending} color="#ef4444" data={trend.map((item) => item.expenses)}/>
          <MetricCard label="Number of sales" value={String(currentSales.length)} change={percentChange(currentSales.length, previousSales.length)} icon={ShoppingBag} positive={currentSales.length >= previousSales.length} color="#7c3aed" data={trend.map((item) => item.sales)}/>
          <MetricCard label="Net profit" value={business.formatMoney(profit)} change={percentChange(profit, previousProfit)} icon={CircleDollarSign} positive={profit >= previousProfit} color="#0ea5e9" data={trend.map((item) => item.revenue - item.expenses)}/>
          <MetricCard label="New customers" value={String(customerNames.size || customers.filter((item) => item.lastPurchase && new Date(item.lastPurchase) >= currentStart).length)} change={percentChange(customerNames.size, previousCustomerNames.size)} icon={Users} positive={customerNames.size >= previousCustomerNames.size} color="#f59e0b" data={trend.map((item) => item.customers)}/>
          <MetricCard label="Unpaid invoices" value={business.formatMoney(outstanding)} change={percentChange(outstanding, previousOutstanding)} icon={FileText} positive={outstanding <= previousOutstanding} color="#ec4899" data={currentInvoices.map((item) => Math.max(0, item.total - item.amountPaid))}/>
        </div>
        <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle><CardDescription className="text-[11px]">Manage your business in fewer clicks</CardDescription></CardHeader><CardContent className="space-y-2 px-2.5 pb-3 pt-0"><QuickAction href="/sales/new" icon={ShoppingBag} label="Record sale" note="Add a quick or detailed sale" color="#7c3aed"/><QuickAction href="/expenses/new" icon={Receipt} label="Add expense" note="Record business spending" color="#ef4444"/><QuickAction href="/customers" icon={UserPlus} label="Create customer" note="Add a customer profile" color="#0ea5e9"/><QuickAction href="/invoices/new" icon={FileText} label="Create invoice" note="Send a new invoice" color="#16a46f"/></CardContent></Card>
      </section>

      <section className="contents">
        <Card><CardHeader className="gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-sm">REVENUE vs EXPENSE</CardTitle><CardDescription className="text-[11px]">Income and spending across the selected period</CardDescription></div><Select value={String(range)} onValueChange={(value) => setRange(Number(value) as RangeDays)}><SelectTrigger className="h-7 w-[112px] rounded-md px-2.5 text-[10px]"><SelectValue>{rangeLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 3 months</SelectItem><SelectItem value="180">Last 6 months</SelectItem><SelectItem value="365">Last year</SelectItem></SelectContent></Select></CardHeader><CardContent className="px-2 pb-3 pt-4 sm:px-4"><div className="h-[265px]"><ResponsiveContainer><AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}><defs><linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a46f" stopOpacity=".55"/><stop offset="95%" stopColor="#16a46f" stopOpacity=".04"/></linearGradient><linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity=".48"/><stop offset="95%" stopColor="#ef4444" stopOpacity=".03"/></linearGradient></defs><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={28} tick={{ fontSize: 9, fill: "#8b949e" }}/><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#8b949e" }} tickFormatter={business.formatCompactMoney}/><Tooltip cursor={false} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }} formatter={(value) => business.formatMoney(Number(value))}/>{showRevenue && <Area type="natural" dataKey="revenue" name="Revenue" fill="url(#fillRevenue)" stroke="#16a46f" strokeWidth={2.3} dot={false} activeDot={{ r: 4 }}/>} {showExpenses && <Area type="natural" dataKey="expenses" name="Expenses" fill="url(#fillExpenses)" stroke="#ef4444" strokeWidth={2.3} dot={false} activeDot={{ r: 4 }}/>}</AreaChart></ResponsiveContainer></div><div className="mt-2 flex items-center justify-center gap-5 border-t pt-3"><button onClick={() => setShowRevenue((value) => !value)} className={`flex items-center gap-1.5 text-[10px] font-semibold ${showRevenue ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground opacity-45"}`}><span className="size-2 rounded-full bg-emerald-500"/>Revenue</button><button onClick={() => setShowExpenses((value) => !value)} className={`flex items-center gap-1.5 text-[10px] font-semibold ${showExpenses ? "text-red-700 dark:text-red-300" : "text-muted-foreground opacity-45"}`}><span className="size-2 rounded-full bg-red-500"/>Expenses</button></div></CardContent></Card>
        <Card id="transactions"><CardHeader className="flex-row items-start justify-between p-4 pb-2"><div><CardTitle className="text-sm">Transaction history</CardTitle><CardDescription className="text-[11px]">Latest money movement</CardDescription></div><Link href="/sales" className="text-[9px] font-semibold text-violet-600">View all</Link></CardHeader><CardContent className="space-y-0 px-3 pb-3 pt-0">{recentTransactions.map((item) => <div key={`${item.kind}-${item.id}`} className="group flex items-center gap-2.5 border-b py-2.5 last:border-0"><span className={`grid size-7 place-items-center rounded-lg ${item.kind === "sale" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>{item.kind === "sale" ? <ArrowUpRight className="size-3"/> : <ArrowDownRight className="size-3"/>}</span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{item.title}</p><p className="text-[8px] text-muted-foreground">{new Date(item.date).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}</p></div><strong className="text-[10px]">{item.kind === "expense" ? "−" : "+"}{business.formatMoney(item.amount)}</strong></div>)}</CardContent></Card>
      </section>

      <section className="contents">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,.7fr)]">
          <Card className="@container"><CardHeader className="flex-row items-start justify-between p-4 pb-2"><div><CardTitle className="text-sm">Expenses</CardTitle><CardDescription className="text-[11px]">Category share and highest costs</CardDescription></div><Select value={String(expenseRange)} onValueChange={(value) => setExpenseRange(Number(value) as RangeDays)}><SelectTrigger className="h-7 w-[108px] text-[10px]"><SelectValue>{expenseRangeLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 3 months</SelectItem><SelectItem value="180">Last 6 months</SelectItem><SelectItem value="365">Last year</SelectItem></SelectContent></Select></CardHeader><CardContent className="p-4 pt-1"><div className="grid gap-3 @min-[430px]:grid-cols-[190px_minmax(0,1fr)] @min-[430px]:items-center"><div className="relative mx-auto h-[190px] w-full max-w-[210px]"><ResponsiveContainer><PieChart><Pie data={expenseMix} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} cornerRadius={5} stroke="none">{expenseMix.map((item, index) => <Cell key={item.name} fill={palette[index % palette.length]}/>)}</Pie><Tooltip formatter={(value) => business.formatMoney(Number(value))}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[9px] text-muted-foreground">Total expense</p><p className="mt-1 font-display text-xl font-bold">{business.formatCompactMoney(expenseTotal)}</p></div></div></div><div className="grid grid-cols-2 gap-2 @min-[430px]:block @min-[430px]:space-y-2">{expenseMix.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-[10px]"><span className="size-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }}/><span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span><strong>{expenseTotal ? Math.round(item.value / expenseTotal * 100) : 0}%</strong></div>)}</div></div><div className="mt-2"><p className="mb-2 text-[9px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Top expense</p><div className="grid grid-cols-2 gap-2">{expenseMix.slice(0,4).map((item, index) => <div key={item.name} className="rounded-lg bg-muted/55 p-2.5"><div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><span className="size-1.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }}/>{item.name}</div><p className="mt-1 text-xs font-bold">{business.formatMoney(item.value)}</p></div>)}</div></div></CardContent></Card>
          <Card><CardHeader className="items-center p-4 pb-0 text-center"><CardTitle className="text-sm">Sales by category</CardTitle><CardDescription className="text-[11px]">Category strength in the selected period</CardDescription></CardHeader><CardContent className="pb-2"><div className="mx-auto aspect-square max-h-[260px]"><ResponsiveContainer><RadarChart data={salesMix}><PolarGrid stroke="var(--border)"/><PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: "#8b949e" }}/><Tooltip cursor={false} formatter={(value) => business.formatMoney(Number(value))}/><Radar dataKey="value" name="Revenue" fill="#7c3aed" fillOpacity={.48} stroke="#7c3aed" strokeWidth={2} dot={{ r: 3, fill: "#7c3aed", fillOpacity: 1 }}/></RadarChart></ResponsiveContainer></div></CardContent></Card>
        </div>
        <Card><CardHeader className="flex-row items-start justify-between p-4 pb-2"><div><CardTitle className="text-sm">Pending invoices</CardTitle><CardDescription className="text-[11px]">Balances to follow up</CardDescription></div><Button asChild variant="outline" size="sm"><Link href="/invoices">View</Link></Button></CardHeader><CardContent className="space-y-2 px-3 pb-3 pt-0">{pendingInvoices.length ? pendingInvoices.map((invoice) => <Link href="/invoices" key={invoice.id} className="block rounded-lg border p-2.5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-semibold">{invoice.customerName}</p><Badge className="px-1.5 py-0.5 text-[8px]">{invoice.status.replaceAll("_", " ")}</Badge></div><div className="mt-2 flex items-end justify-between"><div><p className="text-[8px] text-muted-foreground">{invoice.reference}</p><p className="text-[8px] text-muted-foreground">Due {new Date(invoice.dueAt).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}</p></div><strong className="text-[10px]">{business.formatMoney(invoice.total - invoice.amountPaid)}</strong></div></Link>) : <div className="grid place-items-center rounded-lg border border-dashed py-10 text-center"><FileText className="mb-2 size-5 text-muted-foreground"/><p className="text-xs font-semibold">No pending invoices</p><p className="mt-1 text-[9px] text-muted-foreground">Outstanding balances will appear here.</p></div>}</CardContent></Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3 min-[1050px]:col-span-2">
        <Card><CardHeader className="p-4 pb-0"><CardTitle className="text-sm">Sales distribution</CardTitle><CardDescription className="text-[11px]">In-store, online, and wholesale</CardDescription></CardHeader><CardContent className="px-4 pb-3 pt-0"><div className="relative h-[170px]"><ResponsiveContainer><PieChart><Pie data={salesChannels} dataKey="value" cx="50%" cy="84%" startAngle={180} endAngle={0} innerRadius={58} outerRadius={84} paddingAngle={3} cornerRadius={4} stroke="none">{salesChannels.map((item, index) => <Cell key={item.name} fill={["#7c3aed", "#16a46f", "#f59e0b"][index]}/>)}</Pie><Tooltip formatter={(value) => business.formatMoney(Number(value))}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-x-0 bottom-0 text-center"><p className="text-[9px] text-muted-foreground">Total sales</p><p className="font-display text-xl font-bold">{business.formatCompactMoney(revenue)}</p></div></div><div className="grid grid-cols-3 gap-2">{salesChannels.map((item, index) => <div key={item.name} className="text-center"><span className="mx-auto block size-2 rounded-full" style={{ backgroundColor: ["#7c3aed", "#16a46f", "#f59e0b"][index] }}/><p className="mt-1 text-[9px] text-muted-foreground">{item.name}</p><p className="text-[10px] font-semibold">{business.formatCompactMoney(item.value)}</p></div>)}</div></CardContent></Card>
        <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Top customers</CardTitle><CardDescription className="text-[11px]">Highest customer value in this period</CardDescription></CardHeader><CardContent className="space-y-1 px-3 pb-3 pt-0">{topCustomers.map((customer, index) => <div key={customer.name} className="group flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-muted"><span className="grid size-7 place-items-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{customer.name.split(" ").map((part) => part[0]).slice(0,2).join("")}</span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{customer.name}</p><p className="text-[8px] text-muted-foreground">{customer.orders} orders</p></div><div className="text-right"><strong className="text-[10px]">{business.formatCompactMoney(customer.value)}</strong><p className="text-[8px] text-muted-foreground">#{index + 1}</p></div></div>)}</CardContent></Card>
        <Card><CardHeader className="p-4 pb-0"><CardTitle className="text-sm">Top products & services</CardTitle><CardDescription className="text-[11px]">Best performers by revenue</CardDescription></CardHeader><CardContent className="p-3 pt-1"><div className="h-[225px]"><ResponsiveContainer><BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 58 }}><CartesianGrid horizontal={false} className="chart-grid"/><XAxis type="number" hide/><YAxis type="category" dataKey="name" hide/><Tooltip cursor={false} formatter={(value) => business.formatMoney(Number(value))}/><Bar dataKey="value" fill="#7c3aed" radius={4} barSize={26}><LabelList dataKey="name" position="insideLeft" offset={8} fill="#ffffff" fontSize={10}/><LabelList dataKey="value" position="right" offset={8} fill="var(--foreground)" fontSize={10} formatter={(value: unknown) => business.formatCompactMoney(Number(value))}/></Bar></BarChart></ResponsiveContainer></div></CardContent></Card>
      </section>

      <Card id="activity" className="overflow-hidden min-[1050px]:col-span-2"><CardHeader className="gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-sm">Recent sales</CardTitle><CardDescription className="text-[11px]">A clearer view of your latest orders and payment status</CardDescription></div><Button asChild variant="outline" size="sm"><Link href="/sales">View all sales<ArrowRight/></Link></Button></CardHeader><CardContent className="p-0"><Table><TableHeader className="bg-muted/45"><TableRow className="hover:bg-transparent"><TableHead>Order</TableHead><TableHead className="hidden sm:table-cell">Customer</TableHead><TableHead className="hidden md:table-cell">Status</TableHead><TableHead className="hidden lg:table-cell">Channel</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-12"/></TableRow></TableHeader><TableBody>{sales.slice(0,8).map((sale) => { const status = sale.paymentStatus ?? "PAID"; const statusClass = status === "PAID" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" : status === "PARTIALLY_PAID" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"; return <TableRow key={sale.id} className="group"><TableCell><div className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-500/10 dark:text-violet-300"><ShoppingBag className="size-3.5"/></span><div><Link href={`/sales/${sale.id}`} className="text-[11px] font-semibold hover:text-violet-600">{sale.description}</Link><p className="mt-0.5 text-[8px] font-medium text-muted-foreground">{sale.reference} · {sale.category}</p></div></div></TableCell><TableCell className="hidden sm:table-cell"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-muted text-[8px] font-bold">{(sale.customerName || "Walk-in").split(" ").map((part) => part[0]).slice(0,2).join("")}</span><span className="text-[10px]">{sale.customerName || "Walk-in customer"}</span></div></TableCell><TableCell className="hidden md:table-cell"><Badge className={`px-2 py-0.5 text-[8px] ${statusClass}`}>{status.replaceAll("_", " ")}</Badge></TableCell><TableCell className="hidden lg:table-cell"><p className="text-[10px] font-medium">{channelForSale(sale)}</p><p className="text-[8px] text-muted-foreground">{paymentLabels[sale.paymentMethod]}</p></TableCell><TableCell><p className="text-[10px] font-medium">{sameDay(new Date(sale.soldAt), new Date()) ? "Today" : new Date(sale.soldAt).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}</p><p className="text-[8px] text-muted-foreground">{new Date(sale.soldAt).toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" })}</p></TableCell><TableCell className="text-right"><p className="text-[11px] font-bold">{business.formatMoney(sale.amount)}</p><p className="text-[8px] text-muted-foreground">{status === "PAID" ? "Settled" : `${business.formatMoney(sale.balanceDue ?? sale.amount)} due`}</p></TableCell><TableCell><Button asChild variant="ghost" size="icon" className="size-8 opacity-60 transition group-hover:opacity-100"><Link href={`/sales/${sale.id}`} aria-label={`View ${sale.reference}`}><Eye className="size-3.5"/></Link></Button></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
      {importNotice && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl">{importNotice}</div>}
    </div>
  </AppShell>;
}
