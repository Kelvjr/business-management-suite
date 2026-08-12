"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  FileCheck2,
  FileDown,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { useExpenses } from "@/hooks/use-expenses";
import { useSales } from "@/hooks/use-sales";
import { exportExpensesCsv, exportExpensesPdf } from "@/lib/exporters";
import {
  expenseCategories,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";
import { paymentStatusLabels } from "@/lib/sales";
import { apiFileUrl } from "@/lib/api";

const colors = ["#df6f52", "#f2a65a", "#23395d", "#7d8fa8", "#24b47e"];
const dayStart = (offset = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date;
};
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

export function ExpensesPageContent() {
  const router = useRouter();
  const business = useBusinessSettings();
  const { expenses, loading, demoMode, updateExpense, removeExpense } =
    useExpenses();
  const { sales } = useSales();
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState("month");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthRows = expenses.filter(
    (row) => new Date(row.incurredAt) >= currentMonthStart,
  );
  const previousRows = expenses.filter((row) => {
    const date = new Date(row.incurredAt);
    return date >= previousMonthStart && date < currentMonthStart;
  });
  const monthTotal = monthRows.reduce((sum, row) => sum + row.amount, 0);
  const previousTotal = previousRows.reduce((sum, row) => sum + row.amount, 0);
  const monthRevenue = sales
    .filter((sale) => new Date(sale.soldAt) >= currentMonthStart)
    .reduce((sum, sale) => sum + sale.amount, 0);
  const profit = monthRevenue - monthTotal;
  const expenseChange = previousTotal
    ? ((monthTotal - previousTotal) / previousTotal) * 100
    : 100;
  const largest = monthRows.reduce<Expense | null>(
    (winner, row) => (!winner || row.amount > winner.amount ? row : winner),
    null,
  );
  const receipts = expenses.flatMap((expense) =>
    expense.attachments.map((file) => ({ ...file, expense })),
  );
  const receiptCoverage = expenses.length
    ? Math.round(
        (expenses.filter((row) => row.attachments.length > 0).length /
          expenses.length) *
          100,
      )
    : 0;
  const recurring = expenses
    .filter((row) => row.isRecurring)
    .sort(
      (left, right) =>
        new Date(left.nextDueAt ?? 0).getTime() -
        new Date(right.nextDueAt ?? 0).getTime(),
    );

  const needle = query.toLowerCase();
  const cutoff =
    range === "today"
      ? dayStart()
      : range === "week"
        ? dayStart(6)
        : range === "month"
          ? currentMonthStart
          : null;
  const filtered = expenses.filter((row) => {
    const date = new Date(row.incurredAt);
    return (
      (!needle ||
        [row.reference, row.vendor, row.description, row.category].some(
          (value) => value?.toLowerCase().includes(needle),
        )) &&
      (category === "all" || row.category === category) &&
      (!cutoff || date >= cutoff)
    );
  });
  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = dayStart(29 - index);
    return {
      label: date.toLocaleDateString("en-GH", {
        month: "short",
        day: "numeric",
      }),
      amount: expenses
        .filter(
          (row) =>
            new Date(row.incurredAt).toDateString() === date.toDateString(),
        )
        .reduce((sum, row) => sum + row.amount, 0),
    };
  });
  const categoryMap = new Map<string, number>();
  monthRows.forEach((row) =>
    categoryMap.set(
      row.category,
      (categoryMap.get(row.category) ?? 0) + row.amount,
    ),
  );
  const mix = [...categoryMap]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const vendorMap = new Map<string, { total: number; count: number }>();
  monthRows.forEach((row) => {
    const name = row.vendor || "Unspecified vendor";
    const current = vendorMap.get(name) ?? { total: 0, count: 0 };
    vendorMap.set(name, {
      total: current.total + row.amount,
      count: current.count + 1,
    });
  });
  const vendors = [...vendorMap]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(date);
    return {
      month: date.toLocaleDateString("en-GH", { month: "short" }),
      revenue: sales
        .filter((row) => monthKey(new Date(row.soldAt)) === key)
        .reduce((sum, row) => sum + row.amount, 0),
      expenses: expenses
        .filter((row) => monthKey(new Date(row.incurredAt)) === key)
        .reduce((sum, row) => sum + row.amount, 0),
    };
  });

  async function save(input: ExpenseInput) {
    if (editing) await updateExpense(editing.id, input);
    setEditing(null);
  }

  return (
    <AppShell
      title="Expenses"
      subtitle="Know where your business money goes."
      mobileNavOpen={mobileNav}
      onMobileNavChange={setMobileNav}
      actions={
        <>
          <Badge
            className={`hidden sm:inline-flex ${demoMode ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
          >
            {demoMode ? "Demo data" : "Live data"}
          </Badge>
          <Button onClick={() => router.push("/expenses/new")}>
            <Plus />
            <span className="hidden sm:inline">Record expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Total expenses"
            value={business.formatMoney(monthTotal)}
            meta={`${monthRows.length} this month`}
            icon={TrendingDown}
            tone="expense"
          />
          <Metric
            label="Profit"
            value={business.formatMoney(profit)}
            meta={`${business.formatMoney(monthRevenue)} revenue`}
            icon={profit >= 0 ? TrendingUp : TrendingDown}
            tone={profit >= 0 ? "profit" : "expense"}
          />
          <Metric
            label="Largest expense"
            value={business.formatMoney(largest?.amount ?? 0)}
            meta={largest?.description ?? "No expenses yet"}
            icon={WalletCards}
            tone="navy"
          />
          <Metric
            label="Receipts"
            value={`${receiptCoverage}%`}
            meta={`${receipts.length} attached files`}
            icon={FileCheck2}
            tone="profit"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>Monthly comparison</CardTitle>
                <CardDescription>
                  Revenue versus expenses over six months
                </CardDescription>
              </div>
              <Badge
                className={
                  expenseChange <= 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }
              >
                {expenseChange >= 0 ? "+" : ""}
                {expenseChange.toFixed(0)}% expenses
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ left: -12, right: 4 }}>
                    <CartesianGrid vertical={false} className="chart-grid" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#8190a5" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#8190a5" }}
                      tickFormatter={business.formatCompactMoney}
                    />
                    <Tooltip
                      formatter={(value) => business.formatMoney(Number(value))}
                    />
                    <Legend iconType="circle" iconSize={7} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#24b47e"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#d7654c"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expense breakdown</CardTitle>
              <CardDescription>This month by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mix}
                      dataKey="value"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {mix.map((row, index) => (
                        <Cell
                          key={row.name}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="font-display text-lg font-bold">
                    {business.formatCompactMoney(monthTotal)}
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {mix.map((row, index) => (
                  <div
                    key={row.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="flex-1 truncate text-muted-foreground">
                      {row.name}
                    </span>
                    <strong>{business.formatMoney(row.value)}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Spending trend</CardTitle>
              <CardDescription>
                Daily expenses over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -16, right: 4 }}>
                    <defs>
                      <linearGradient
                        id="expenseFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0"
                          stopColor="#d7654c"
                          stopOpacity=".25"
                        />
                        <stop
                          offset="1"
                          stopColor="#d7654c"
                          stopOpacity=".02"
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} className="chart-grid" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                      tick={{ fontSize: 10, fill: "#8190a5" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#8190a5" }}
                      tickFormatter={business.formatCompactMoney}
                    />
                    <Tooltip
                      formatter={(value) => business.formatMoney(Number(value))}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#d7654c"
                      strokeWidth={2.5}
                      fill="url(#expenseFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="size-4 text-[#d7654c]" />
                  Vendors
                </CardTitle>
                <CardDescription>Top vendors this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendors.map((vendor, index) => (
                  <div key={vendor.name} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {vendor.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {vendor.count} expense{vendor.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <strong className="text-xs">
                      {business.formatMoney(vendor.total)}
                    </strong>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-[#d7654c]" />
                  Recurring expenses
                </CardTitle>
                <CardDescription>
                  {recurring.length} active commitments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recurring.slice(0, 5).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {row.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {row.recurrence?.toLowerCase()} ·{" "}
                        {row.nextDueAt
                          ? `due ${new Date(row.nextDueAt).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}`
                          : "date not set"}
                      </p>
                    </div>
                    <strong className="text-xs">
                      {business.formatMoney(row.amount)}
                    </strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-4 text-[#d7654c]" />
                Receipts
              </CardTitle>
              <CardDescription>
                Supporting documents attached to recent expenses
              </CardDescription>
            </div>
            <Badge>{receipts.length} files</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {receipts.slice(0, 8).map((file) => (
                <div
                  key={file.id ?? `${file.expense.id}-${file.name}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl border p-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-[#168e64]">
                    <FileCheck2 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {file.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {file.expense.vendor || file.expense.description}
                    </p>
                  </div>
                  {file.url !== "#mock-receipt" && (
                    <a
                              href={apiFileUrl(file.url)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${file.name}`}
                    >
                      <ArrowUpRight className="size-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display font-semibold">All expenses</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} matching records
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 sm:w-56"
                  placeholder="Search expenses…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any date</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {expenseCategories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileDown />
                    Export
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      exportExpensesCsv(filtered, business.settings.currency)
                    }
                  >
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      void exportExpensesPdf(
                        filtered,
                        business.settings.currency,
                      )
                    }
                  >
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {loading ? (
            <div className="grid place-items-center py-24">
              <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-[#d7654c]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center py-20 text-center">
              <Receipt className="mb-3 size-6 text-muted-foreground" />
              <p className="font-semibold">No expenses found</p>
              <p className="text-sm text-muted-foreground">
                Record an expense or adjust the filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead className="hidden md:table-cell">Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.description}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {row.reference}
                        {row.isRecurring ? " · recurring" : ""}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {row.vendor || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge>{row.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {paymentStatusLabels[row.paymentStatus]}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {new Date(row.incurredAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-display font-bold">
                      {business.formatMoney(row.amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${row.reference}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(row)}>
                            Edit expense
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={() => setDeleting(row)}
                          >
                            <Trash2 />
                            Delete expense
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
      <ExpenseFormDialog
        open={Boolean(editing)}
        expense={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={save}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleting?.reference} from every spending total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleting)
                    void removeExpense(deleting.id).then(() =>
                      setDeleting(null),
                    );
                }}
              >
                Delete expense
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  meta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof TrendingDown;
  tone: "expense" | "profit" | "navy";
}) {
  const toneClass =
    tone === "expense"
      ? "bg-orange-50 text-[#d7654c]"
      : tone === "profit"
        ? "bg-emerald-50 text-[#168e64]"
        : "bg-slate-100 text-[#23395d]";
  const seed = label.length * 13;
  const bars = Array.from(
    { length: 10 },
    (_, i) => 20 + ((seed + i * 19) % 72),
  );
  return (
    <Card className="group overflow-hidden transition duration-300 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 truncate font-display text-2xl font-bold tracking-[-.045em]">
              {value}
            </p>
          </div>
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${toneClass}`}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <p className="flex-1 truncate text-[10px] text-muted-foreground">
            {meta}
          </p>
          <div className="visual-bars">
            {bars.map((height, i) => (
              <i
                key={i}
                className={
                  tone === "expense"
                    ? "!bg-[linear-gradient(180deg,#e18a70,#c96049)]"
                    : ""
                }
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
