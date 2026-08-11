"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, ChevronLeft, ChevronRight, FileDown, MoreHorizontal, Plus, Search, Trash2, TrendingUp, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SaleFormDialog } from "@/components/sales/sale-form-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSales } from "@/hooks/use-sales";
import { exportCsv, exportPdf } from "@/lib/exporters";
import { paymentLabels, type PaymentMethod, type Sale, type SaleInput } from "@/lib/sales";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";

const PAGE_SIZE = 8;
type DateRange = "all" | "today" | "week" | "month";

const startOfToday = () => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; };
const startOfMonth = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); };
const revenueColors = ["#17a673", "#23395d", "#f2a65a", "#7d8fa8", "#d7654c"];

export function SalesPageContent() {
  const router = useRouter();
  const { formatMoney, settings } = useBusinessSettings();
  const { sales, loading, demoMode, createSale, updateSale, removeSale } = useSales();
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [payment, setPayment] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => [...new Set(sales.map((sale) => sale.category))].sort(), [sales]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const today = startOfToday();
    const week = new Date(today); week.setDate(today.getDate() - 6);
    const month = startOfMonth();
    return sales.filter((sale) => {
      const soldAt = new Date(sale.soldAt);
      const matchesDate = dateRange === "all" || (dateRange === "today" && soldAt >= today) || (dateRange === "week" && soldAt >= week) || (dateRange === "month" && soldAt >= month);
      const matchesSearch = !needle || [sale.reference, sale.description, sale.customerName, sale.category].some((value) => value?.toLowerCase().includes(needle));
      return matchesDate && matchesSearch && (category === "all" || sale.category === category) && (payment === "all" || sale.paymentMethod === payment);
    });
  }, [sales, query, category, payment, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const monthSales = sales.filter((sale) => new Date(sale.soldAt) >= startOfMonth());
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.amount, 0);
  const allRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const average = sales.length ? allRevenue / sales.length : 0;
  const revenueTrend = useMemo(() => Array.from({ length: 30 }, (_, index) => { const date = startOfToday(); date.setDate(date.getDate() - (29 - index)); return { label: date.toLocaleDateString("en-GH", { month: "short", day: "numeric" }), revenue: sales.filter((sale) => new Date(sale.soldAt).toDateString() === date.toDateString()).reduce((sum, sale) => sum + sale.amount, 0) }; }), [sales]);
  const revenueMix = useMemo(() => { const map = new Map<string, number>(); sales.filter((sale) => new Date(sale.soldAt) >= startOfMonth()).forEach((sale) => map.set(sale.category, (map.get(sale.category) ?? 0) + sale.amount)); return [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5); }, [sales]);

  const resetPage = () => setPage(1);
  const openNew = () => router.push("/sales/new");
  const openEdit = (sale: Sale) => { setEditing(sale); setFormOpen(true); };

  async function save(input: SaleInput) {
    if (editing) await updateSale(editing.id, input); else await createSale(input);
    setEditing(null);
    setNotice(editing ? "Sale updated" : "Sale recorded");
    window.setTimeout(() => setNotice(""), 2400);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await removeSale(deleting.id);
    setDeleting(null);
    setNotice("Sale deleted");
    window.setTimeout(() => setNotice(""), 2400);
  }

  return <AppShell title="Sales" subtitle="Search, review, and manage every sale." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav} actions={<><Badge className={`hidden sm:inline-flex ${demoMode ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{demoMode ? "Demo data" : "Live data"}</Badge><Button onClick={openNew}><Plus /><span className="hidden sm:inline">Record sale</span><span className="sm:hidden">Add</span></Button></>}>
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        {[{ label: "Revenue this month", value: formatMoney(monthRevenue), meta: `${monthSales.length} sales`, icon: TrendingUp, data: revenueTrend.map(row => row.revenue) }, { label: "All recorded revenue", value: formatMoney(allRevenue), meta: `${sales.length} total sales`, icon: WalletCards, data: sales.slice(0, 12).map(row => row.amount) }, { label: "Average sale", value: formatMoney(average), meta: "Across all records", icon: ArrowDownToLine, data: sales.slice(0, 12).map((row, index) => row.amount / (index + 1)) }].map((stat) => <SalesMetric key={stat.label} {...stat} />)}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card><CardHeader><CardTitle>Revenue trend</CardTitle><CardDescription>Daily revenue over the last 30 days</CardDescription></CardHeader><CardContent><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueTrend} margin={{ left: -16, right: 4 }}><defs><linearGradient id="salesRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24b47e" stopOpacity=".26"/><stop offset="1" stopColor="#24b47e" stopOpacity=".02"/></linearGradient></defs><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" axisLine={false} tickLine={false} interval={4} tick={{ fontSize: 10, fill: "#8190a5" }}/><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8190a5" }} tickFormatter={(value) => formatMoney(Number(value))}/><Tooltip formatter={(value) => formatMoney(Number(value))}/><Area type="monotone" dataKey="revenue" stroke="#1ca270" strokeWidth={2.5} fill="url(#salesRevenueFill)"/></AreaChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Revenue mix</CardTitle><CardDescription>This month by category</CardDescription></CardHeader><CardContent><div className="relative mx-auto h-[150px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={revenueMix} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={3} stroke="none">{revenueMix.map((row, index) => <Cell key={row.name} fill={revenueColors[index % revenueColors.length]}/>)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="font-display text-lg font-bold">{formatMoney(monthRevenue)}</span></div></div><div className="mt-3 space-y-2">{revenueMix.map((row, index) => <div key={row.name} className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{ backgroundColor: revenueColors[index % revenueColors.length] }}/><span className="flex-1 truncate text-muted-foreground">{row.name}</span><strong>{formatMoney(row.value)}</strong></div>)}</div></CardContent></Card>
      </section>

      <Card>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <div><h2 className="font-display text-base font-semibold">All sales</h2><p className="text-xs text-muted-foreground">{filtered.length} matching records</p></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            <div className="relative sm:min-w-56"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search reference, customer…" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} /></div>
            <Select value={dateRange} onValueChange={(value) => { setDateRange(value as DateRange); resetPage(); }}><SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any date</SelectItem><SelectItem value="today">Today</SelectItem><SelectItem value="week">Last 7 days</SelectItem><SelectItem value="month">This month</SelectItem></SelectContent></Select>
            <Select value={category} onValueChange={(value) => { setCategory(value); resetPage(); }}><SelectTrigger className="sm:w-36"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={payment} onValueChange={(value) => { setPayment(value); resetPage(); }}><SelectTrigger className="sm:w-36"><SelectValue placeholder="Payment" /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem>{(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => <SelectItem key={method} value={method}>{paymentLabels[method]}</SelectItem>)}</SelectContent></Select>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><FileDown />Export</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => exportCsv(filtered, settings.currency)}><FileDown />Export CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportPdf(filtered, settings.currency)}><FileDown />Export PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </div>

        {loading ? <div className="grid place-items-center py-24"><div className="size-8 animate-spin rounded-full border-2 border-muted border-t-[#24b47e]" /></div> : visible.length === 0 ? <div className="grid place-items-center px-6 py-24 text-center"><span className="mb-3 grid size-11 place-items-center rounded-full bg-muted"><Search className="size-5 text-muted-foreground" /></span><p className="font-display font-semibold">No sales match these filters</p><button onClick={() => { setQuery(""); setCategory("all"); setPayment("all"); setDateRange("all"); }} className="mt-2 text-sm font-semibold text-[#168e64] hover:underline">Clear all filters</button></div> : <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Sale</TableHead><TableHead className="hidden md:table-cell">Customer</TableHead><TableHead>Category</TableHead><TableHead className="hidden xl:table-cell">Payment</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{visible.map((sale) => <TableRow key={sale.id} tabIndex={0} role="link" aria-label={`Open ${sale.reference}`} className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => router.push(`/sales/${sale.id}`)} onKeyDown={(event) => { if (event.key === "Enter") router.push(`/sales/${sale.id}`); }}><TableCell><div className="font-medium text-foreground transition-colors hover:text-[#168e64]">{sale.description}</div><div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sale.reference}</div></TableCell><TableCell className="hidden text-muted-foreground md:table-cell">{sale.customerName ?? "Walk-in customer"}</TableCell><TableCell><Badge>{sale.category}</Badge></TableCell><TableCell className="hidden text-muted-foreground xl:table-cell">{paymentLabels[sale.paymentMethod]}</TableCell><TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{new Date(sale.soldAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell><TableCell className="text-right font-display font-bold">{formatMoney(sale.amount)}</TableCell><TableCell onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${sale.reference}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openEdit(sale)}>Edit sale</DropdownMenuItem><DropdownMenuItem className="text-red-600 focus:bg-red-50" onSelect={() => setDeleting(sale)}><Trash2 />Delete sale</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table>}

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-5"><span>Showing {visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft />Previous</Button><span className="min-w-16 text-center">{currentPage} of {totalPages}</span><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next<ChevronRight /></Button></div></div>
      </Card>
    </div>

    <SaleFormDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }} sale={editing} onSave={save} />
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this sale?</AlertDialogTitle><AlertDialogDescription>This removes {deleting?.reference} and {deleting ? formatMoney(deleting.amount) : "its value"} from every revenue total. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="destructive" onClick={() => void confirmDelete()}>Delete sale</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {notice && <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-[#13233a] px-4 py-3 text-sm font-medium text-white shadow-2xl"><span className="size-2 rounded-full bg-[#42d49a]" />{notice}</div>}
  </AppShell>;
}

function SalesMetric({ label, value, meta, icon: Icon, data }: { label:string;value:string;meta:string;icon:typeof TrendingUp;data:number[] }) {
  const chart=data.length?data:[0,0,0];
  return <Card className="group overflow-hidden transition duration-300 hover:-translate-y-0.5"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold tracking-[-.045em]">{value}</p></div><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-[#159466]"><Icon className="size-4"/></span></div><div className="mt-3 flex items-end gap-3"><p className="flex-1 text-[10px] text-muted-foreground">{meta}</p><div className="h-10 w-28"><ResponsiveContainer><AreaChart data={chart.map((v,i)=>({i,v}))}><Area type="monotone" dataKey="v" stroke="#24b47e" strokeWidth={2.2} fill="#24b47e" fillOpacity={.1} dot={false}/></AreaChart></ResponsiveContainer></div></div></CardContent></Card>
}
