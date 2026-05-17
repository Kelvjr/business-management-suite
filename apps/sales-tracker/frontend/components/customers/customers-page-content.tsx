"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  Crown,
  Download,
  Edit3,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react";
import {
  createCustomer,
  updateCustomer,
  type Customer,
  type Sale,
} from "@/lib/api";
import {
  slugifyCustomerName,
  type CustomerRow,
} from "@/lib/domain/customers";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportRowsToCsv,
  exportRowsToExcel,
  exportRowsToPdf,
} from "@/lib/exporters";

type CustomersPageContentProps = {
  sales: Sale[];
  customers: Customer[];
};

type CustomerTier = "VIP" | "Regular" | "New";

type CustomerRecord = CustomerRow & {
  managedId?: string;
  phone?: string;
  businessName?: string;
  notes?: string;
  email: string;
  tier: CustomerTier;
  firstPurchase: string;
};

function deriveCustomers(sales: Sale[], managedCustomers: Customer[]): CustomerRecord[] {
  const grouped = new Map<string, CustomerRecord>();

  for (const sale of sales) {
    const name = sale.customerName?.trim() || "Walk-in";
    const key = name.toLowerCase();
    const amount = Number(sale.totalAmount);
    const soldAt = sale.soldAt;

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        name,
        slug: slugifyCustomerName(name),
        totalOrders: 1,
        totalSpent: amount,
        lastPurchase: soldAt,
        firstPurchase: soldAt,
        email: buildCustomerEmail(name),
        tier: "New",
      });
      continue;
    }

    existing.totalOrders += 1;
    existing.totalSpent += amount;
    if (new Date(soldAt) > new Date(existing.lastPurchase)) {
      existing.lastPurchase = soldAt;
    }
    if (new Date(soldAt) < new Date(existing.firstPurchase)) {
      existing.firstPurchase = soldAt;
    }
  }

  for (const managedCustomer of managedCustomers) {
    const managedName = managedCustomer.name.trim();
    if (!managedName) continue;
    const key = managedName.toLowerCase();
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        name: managedName,
        slug: slugifyCustomerName(managedName),
        totalOrders: 0,
        totalSpent: 0,
        lastPurchase: managedCustomer.updatedAt,
        firstPurchase: managedCustomer.createdAt,
        email: managedCustomer.email ?? buildCustomerEmail(managedName),
        tier: "New",
        managedId: managedCustomer.id,
        phone: managedCustomer.phone ?? undefined,
        businessName: managedCustomer.businessName ?? undefined,
        notes: managedCustomer.notes ?? undefined,
      });
      continue;
    }

    existing.managedId = managedCustomer.id;
    existing.email = managedCustomer.email ?? existing.email;
    existing.phone = managedCustomer.phone ?? undefined;
    existing.businessName = managedCustomer.businessName ?? undefined;
    existing.notes = managedCustomer.notes ?? undefined;
  }

  return Array.from(grouped.values())
    .map((customer) => ({
      ...customer,
      tier: getCustomerTier(customer),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

function buildCustomerEmail(name: string) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".");
  return `${base || "walk.in"}@example.com`;
}

function getCustomerTier(customer: Pick<CustomerRecord, "totalOrders" | "totalSpent">): CustomerTier {
  if (customer.totalSpent >= 5000 || customer.totalOrders >= 20) return "VIP";
  if (customer.totalOrders >= 5 || customer.totalSpent >= 1000) return "Regular";
  return "New";
}

function getTierClass(tier: CustomerTier) {
  if (tier === "VIP") {
    return "bg-fuchsia-600/10 text-fuchsia-600 outline outline-1 outline-offset-[-1px] outline-fuchsia-600/20";
  }
  if (tier === "Regular") {
    return "bg-gray-100 text-gray-600 outline outline-1 outline-offset-[-1px] outline-zinc-200";
  }
  return "bg-orange-500/10 text-orange-500 outline outline-1 outline-offset-[-1px] outline-orange-500/20";
}

function getAvatarTone(index: number) {
  const tones = [
    "bg-lime-50 text-lime-700",
    "bg-pink-100 text-pink-700",
    "bg-rose-100 text-rose-700",
  ];
  return tones[index % tones.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomersPageContent({
  sales,
  customers: managedCustomers,
}: CustomersPageContentProps) {
  const [profiles, setProfiles] = useState<Customer[]>(managedCustomers);
  const customers = useMemo(() => deriveCustomers(sales, profiles), [sales, profiles]);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<"all" | CustomerTier>("all");
  const [page, setPage] = useState(1);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    notes: "",
  });
  const pageSize = 5;

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((customer) => {
      if (tier !== "all" && customer.tier !== tier) return false;
      if (!q) return true;
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.slug.toLowerCase().includes(q)
      );
    });
  }, [customers, query, tier]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCustomers.length);
  const pagedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const topSpender = customers[0];
  const mostLoyal = [...customers].sort((a, b) => b.totalOrders - a.totalOrders)[0];
  const recentEntry = [...customers].sort(
    (a, b) => new Date(b.firstPurchase).getTime() - new Date(a.firstPurchase).getTime(),
  )[0];

  const vipCount = customers.filter((customer) => customer.tier === "VIP").length;
  const regularCount = customers.filter((customer) => customer.tier === "Regular").length;
  const newCount = customers.filter((customer) => customer.tier === "New").length;
  const totalCustomers = Math.max(customers.length, 1);

  const exportRows = filteredCustomers.map((customer) => ({
    customer: customer.name,
    email: customer.email,
    tier: customer.tier,
    lifetime_orders: customer.totalOrders,
    total_spent: customer.totalSpent,
    last_activity: customer.lastPurchase,
  }));

  function exportData(format: "csv" | "pdf" | "excel") {
    if (!exportRows.length) return;
    if (format === "csv") exportRowsToCsv(exportRows, "customers-crm");
    if (format === "pdf") exportRowsToPdf(exportRows, "customers-crm", "Customers CRM");
    if (format === "excel") exportRowsToExcel(exportRows, "customers-crm");
  }

  function openCreateCustomer() {
    setEditingCustomerId(null);
    setCustomerForm({
      name: "",
      email: "",
      phone: "",
      businessName: "",
      notes: "",
    });
    setProfileSheetOpen(true);
  }

  function openEditCustomer(customer: CustomerRecord) {
    setEditingCustomerId(customer.managedId ?? null);
    setCustomerForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      businessName: customer.businessName ?? "",
      notes: customer.notes ?? "",
    });
    setProfileSheetOpen(true);
  }

  async function saveCustomerProfile() {
    if (!customerForm.name.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      if (editingCustomerId) {
        const updated = await updateCustomer(editingCustomerId, {
          name: customerForm.name.trim(),
          email: customerForm.email.trim() || undefined,
          phone: customerForm.phone.trim() || undefined,
          businessName: customerForm.businessName.trim() || undefined,
          notes: customerForm.notes.trim() || undefined,
        });
        setProfiles((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        toast.success("Customer updated.");
      } else {
        const created = await createCustomer({
          name: customerForm.name.trim(),
          email: customerForm.email.trim() || undefined,
          phone: customerForm.phone.trim() || undefined,
          businessName: customerForm.businessName.trim() || undefined,
          notes: customerForm.notes.trim() || undefined,
        });
        setProfiles((prev) => [created, ...prev]);
        toast.success("Customer added.");
      }
      setProfileSheetOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save customer.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-8 text-zinc-900">Customers</h1>
          <p className="mt-2 text-base font-normal leading-6 text-gray-600">
            Track relationships and lifetime value of your clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-900"
              >
                <Download className="size-4" />
                Export CRM
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem onSelect={() => exportData("csv")}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportData("pdf")}>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportData("excel")}>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="h-10 rounded-2xl bg-fuchsia-600 px-4 text-xs font-medium text-white hover:bg-fuchsia-700"
            onClick={openCreateCustomer}
          >
            <Plus className="size-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          accent="fuchsia"
          badge="Top Spender"
          title={topSpender?.name ?? "—"}
          value={topSpender ? formatCurrency(topSpender.totalSpent) : "—"}
          suffix="Total Value"
          initials={topSpender ? getInitials(topSpender.name) : "--"}
          tone={0}
          icon="spender"
        />
        <SummaryCard
          accent="orange"
          badge="Most Loyal"
          title={mostLoyal?.name ?? "—"}
          value={String(mostLoyal?.totalOrders ?? 0)}
          suffix="Orders"
          initials={mostLoyal ? getInitials(mostLoyal.name) : "--"}
          tone={1}
          icon="loyal"
        />
        <SummaryCard
          accent="neutral"
          badge="Recent Entry"
          title={recentEntry?.name ?? "—"}
          value={recentEntry ? formatLongDate(recentEntry.firstPurchase) : "—"}
          suffix="Joined Date"
          initials={recentEntry ? getInitials(recentEntry.name) : "--"}
          tone={2}
          icon="recent"
        />
      </div>

      <Card className="overflow-hidden rounded-[20px] border-0 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-gray-100/20 px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-600" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email or ID..."
                className="h-11 rounded-2xl border-zinc-200 pl-10 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={tier}
                onValueChange={(value) => {
                  setTier(value as "all" | CustomerTier);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 rounded-2xl border-zinc-200 bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead className="bg-gray-100/30">
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Status Tier
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Lifetime Orders
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Total Spent
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedCustomers.map((customer, index) => (
                <tr
                  key={customer.slug}
                  className="border-b border-zinc-200 last:border-0 odd:bg-white even:bg-gray-100/5"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${getAvatarTone(index)}`}
                      >
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-5 text-zinc-900">
                          {customer.name}
                        </p>
                        <p className="text-xs font-normal leading-4 text-gray-600">
                          {customer.email}
                        </p>
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-fuchsia-600 hover:underline"
                          onClick={() => openEditCustomer(customer)}
                        >
                          <Edit3 className="size-3" />
                          Edit
                        </button>
                      </div>
                      {customer.totalOrders > 0 ? (
                        <Link
                          href={`/customers/${customer.slug}`}
                          className="text-[11px] font-medium text-gray-500 hover:underline"
                        >
                          View history
                        </Link>
                      ) : (
                        <span className="text-[11px] text-gray-400">No sales yet</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-xl px-3 py-1 text-[10px] font-bold leading-4 ${getTierClass(
                        customer.tier,
                      )}`}
                    >
                      {customer.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm leading-5">
                    <span className="font-medium text-zinc-900">{customer.totalOrders} </span>
                    <span className="text-xs font-normal text-gray-600">Orders</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold leading-5 text-zinc-900">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-4 text-sm font-normal leading-5 text-gray-600">
                    {formatLongDate(customer.lastPurchase)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-zinc-200 bg-gray-100/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-normal leading-5 text-gray-600">
            Showing <span className="font-medium text-zinc-900">{pagedCustomers.length}</span> of{" "}
            <span className="font-medium text-zinc-900">{filteredCustomers.length}</span> customers
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 rounded-[10px] border-zinc-200 text-sm"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, idx) => idx + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`flex size-8 items-center justify-center rounded-[10px] text-sm font-medium ${
                    currentPage === pageNumber
                      ? "bg-fuchsia-600 text-white"
                      : "text-zinc-900"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
            {totalPages > 3 ? <span className="px-1 text-base text-gray-600">...</span> : null}
            {totalPages > 3 ? (
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                className="flex size-8 items-center justify-center rounded-[10px] text-sm font-medium text-zinc-900"
              >
                {totalPages}
              </button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 rounded-2xl border-zinc-200 text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightPanel
          title="Smart Insights"
          description="Automated customer retention advice"
          accent="fuchsia"
          bodyTitle={
            topSpender ? `Reward ${topSpender.name}` : "Reward your best customer"
          }
          bodyText="They have not purchased recently. A targeted VIP discount could help increase retention and lifetime value."
        />
        <TierDistributionPanel
          vipPct={Math.round((vipCount / totalCustomers) * 100)}
          regularPct={Math.round((regularCount / totalCustomers) * 100)}
          newPct={Math.round((newCount / totalCustomers) * 100)}
        />
      </div>

      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {editingCustomerId ? "Edit Customer" : "Add Customer"}
            </SheetTitle>
            <SheetDescription>
              Manage customer contact details and profile notes.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4 pb-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900">
                Name <span className="text-fuchsia-600">*</span>
              </label>
              <Input
                value={customerForm.name}
                onChange={(event) =>
                  setCustomerForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Customer name"
                className="h-10 rounded-xl border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900">Email</label>
              <Input
                value={customerForm.email}
                onChange={(event) =>
                  setCustomerForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="email@example.com"
                className="h-10 rounded-xl border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900">Phone</label>
              <Input
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="+1..."
                className="h-10 rounded-xl border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900">Business Name</label>
              <Input
                value={customerForm.businessName}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    businessName: event.target.value,
                  }))
                }
                placeholder="Optional business"
                className="h-10 rounded-xl border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900">Notes</label>
              <Textarea
                value={customerForm.notes}
                onChange={(event) =>
                  setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                className="min-h-24 rounded-xl border-zinc-200"
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              className="rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700"
              onClick={() => void saveCustomerProfile()}
            >
              {editingCustomerId ? "Save Customer" : "Add Customer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-zinc-200"
              onClick={() => setProfileSheetOpen(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SummaryCard({
  accent,
  badge,
  title,
  value,
  suffix,
  initials,
  tone,
  icon,
}: {
  accent: "fuchsia" | "orange" | "neutral";
  badge: string;
  title: string;
  value: string;
  suffix: string;
  initials: string;
  tone: number;
  icon: "spender" | "loyal" | "recent";
}) {
  const shellClass =
    accent === "fuchsia"
      ? "bg-green-50"
      : accent === "orange"
        ? "bg-yellow-50"
        : "bg-white";

  const iconClass =
    accent === "fuchsia"
      ? "text-fuchsia-600"
      : accent === "orange"
        ? "text-orange-500"
        : "text-gray-600";

  const Icon =
    icon === "spender"
      ? Crown
      : icon === "loyal"
        ? ShoppingBag
        : CalendarDays;

  return (
    <Card className={`rounded-[20px] border-0 p-0 shadow-sm ${shellClass}`}>
      <CardContent className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className={`rounded-[10px] bg-white/50 p-2.5 ${iconClass}`}>
            <Icon className="size-5" />
          </div>
          <span className="rounded-xl bg-white/80 px-3 py-0.5 text-xs font-medium text-zinc-900">
            {badge}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex size-12 items-center justify-center rounded-full text-sm font-semibold ${getAvatarTone(
              tone,
            )}`}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold leading-5 text-zinc-900">{title}</p>
            <p className="mt-1">
              <span className="text-lg font-semibold leading-7 text-zinc-900">{value}</span>{" "}
              <span className="text-xs font-medium uppercase leading-5 text-zinc-900">
                {suffix}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightPanel({
  title,
  description,
  accent,
  bodyTitle,
  bodyText,
}: {
  title: string;
  description: string;
  accent: "fuchsia";
  bodyTitle: string;
  bodyText: string;
}) {
  const toneClass = accent === "fuchsia" ? "border-green-200 bg-green-50" : "border-zinc-200 bg-white";
  return (
    <Card className="rounded-[20px] border-0 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-sm font-medium leading-5 text-zinc-900">{title}</p>
          <p className="text-[11px] font-normal leading-4 text-gray-600">{description}</p>
        </div>

        <div className={`rounded-xl border p-3 ${toneClass}`}>
          <p className="text-[11px] font-medium leading-4 text-zinc-900">{bodyTitle}</p>
          <p className="mt-1 text-[11px] font-normal leading-4 text-gray-600">{bodyText}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TierDistributionPanel({
  vipPct,
  regularPct,
  newPct,
}: {
  vipPct: number;
  regularPct: number;
  newPct: number;
}) {
  const rows = [
    { label: "High Value (VIP)", value: vipPct, color: "bg-fuchsia-600", text: "text-fuchsia-600" },
    { label: "Frequent (Regular)", value: regularPct, color: "bg-orange-500", text: "text-orange-500" },
    { label: "New Customers", value: newPct, color: "bg-zinc-400", text: "text-zinc-600" },
  ];

  return (
    <Card className="rounded-[20px] border-0 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-sm font-medium leading-5 text-zinc-900">Spend Tier Distribution</p>
          <p className="text-[11px] font-normal leading-4 text-gray-600">
            Overview of customer categories
          </p>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`rounded-xl border p-3 ${getTierToneClass(row.label, row.value)}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium leading-4 text-zinc-900">{row.label}</p>
                <p className={`text-[11px] font-bold leading-4 ${row.text}`}>{row.value}%</p>
              </div>
              <div className="h-2 rounded bg-white/80">
                <div className={`h-2 rounded ${row.color}`} style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getTierToneClass(label: string, value: number) {
  const lower = label.toLowerCase();
  if (lower.includes("vip")) return "border-green-200 bg-green-50";
  if (lower.includes("new")) return "border-yellow-200 bg-yellow-50";
  if (value < 20) return "border-red-200 bg-red-50";
  return "border-yellow-200 bg-yellow-50";
}
