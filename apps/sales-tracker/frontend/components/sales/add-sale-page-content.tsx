"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, Search } from "lucide-react";
import {
  createCategory,
  createSale,
  fetchCategories,
  type Category,
  type Sale,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  findLastPrice,
  getNowDatetimeLocalValue,
  readFrequentItems,
  upsertFrequentItem,
} from "@/lib/sales-automation";

type PaymentStatus = "paid" | "partial" | "unpaid";
type SalesChannel = "instagram" | "whatsapp" | "website" | "walk-in";
type SaleType = "product" | "service";

type AddSalePageContentProps = {
  sales: Sale[];
};

type Suggestion = {
  itemName: string;
  category?: string;
  quantity?: number;
  unitPrice: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function AddSalePageContent({ sales }: AddSalePageContentProps) {
  const router = useRouter();
  const [saleType, setSaleType] = useState<SaleType>("product");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("2");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [customerName, setCustomerName] = useState("Sarah Jenkins");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("instagram");
  const [soldAt, setSoldAt] = useState(getNowDatetimeLocalValue());
  const [notes, setNotes] = useState(
    "VIP customer. Requested express shipping if possible.",
  );
  const [submitting, setSubmitting] = useState(false);
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);

  const frequentItems = useMemo(() => readFrequentItems(), []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const query = normalize(itemName);
    if (!query) return [];

    const memoryMatches = frequentItems
      .filter((item) => normalize(item.itemName).includes(query))
      .slice(0, 3)
      .map((item) => ({
        itemName: item.itemName,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: 1,
      }));

    const latestByName = new Map<string, Sale>();
    for (const sale of [...sales].sort((a, b) => {
      return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
    })) {
      const key = normalize(sale.itemName);
      if (!key || latestByName.has(key)) continue;
      latestByName.set(key, sale);
    }

    const historyMatches = Array.from(latestByName.values())
      .filter((sale) => normalize(sale.itemName).includes(query))
      .slice(0, 4)
      .map((sale) => ({
        itemName: sale.itemName,
        category: sale.category ?? undefined,
        quantity: sale.quantity ?? 1,
        unitPrice: Number(sale.unitPrice ?? sale.totalAmount),
      }));

    const unique = new Map<string, Suggestion>();
    for (const suggestion of [...memoryMatches, ...historyMatches]) {
      const key = normalize(suggestion.itemName);
      if (!unique.has(key)) unique.set(key, suggestion);
    }
    return Array.from(unique.values()).slice(0, 5);
  }, [frequentItems, itemName, sales]);

  const qtyValue = Math.max(1, Number(quantity || 1));
  const unitPriceValue = Number(unitPrice || 0);
  const effectiveQuantity = saleType === "service" ? 1 : qtyValue;
  const total = effectiveQuantity * unitPriceValue;
  const estimatedProfit = total - qtyValue * Number(costPrice || 0);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch(() => {
        toast.error("Failed to load categories.");
      });
  }, []);

  useEffect(() => {
    if (!itemName || priceManuallyEdited || unitPrice) return;
    const latestPrice = findLastPrice(itemName, frequentItems, sales);
    if (latestPrice !== null) {
      setUnitPrice(String(latestPrice));
    }
  }, [frequentItems, itemName, priceManuallyEdited, sales, unitPrice]);

  function applySuggestion(suggestion: Suggestion) {
    setItemName(suggestion.itemName);
    setUnitPrice(String(suggestion.unitPrice));
    setQuantity(String(suggestion.quantity ?? 1));
    setPriceManuallyEdited(false);
  }

  function incrementQty(step: number) {
    const next = Math.max(1, qtyValue + step);
    setQuantity(String(next));
  }

  async function submitSale(resetAfterSave: boolean) {
    if (!itemName.trim()) {
      toast.error(`${saleType === "product" ? "Product" : "Service"} name is required.`);
      return;
    }
    if (!unitPrice || unitPriceValue <= 0) {
      toast.error("Unit price must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      await createSale({
        itemType: saleType,
        itemName: itemName.trim(),
        category: category || undefined,
        quantity: effectiveQuantity,
        unitPrice: unitPriceValue,
        totalAmount: total,
        paymentStatus,
        salesChannel,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        soldAt: soldAt ? new Date(soldAt).toISOString() : undefined,
      });

      upsertFrequentItem({
        itemType: saleType,
        itemName: itemName.trim(),
        category: category || undefined,
        unitPrice: unitPriceValue,
        paymentStatus,
        salesChannel,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success("Sale saved successfully.");

      if (resetAfterSave) {
        // Keep visit context so users can log multi-amount sales quickly
        // (e.g. Consultation, Pharmacy, Lab for the same customer/date).
        setItemName("");
        setUnitPrice("");
        setQuantity(saleType === "service" ? "1" : "2");
        setCostPrice("");
        setCategory("");
        setPriceManuallyEdited(false);
        toast.message("Ready for next line item with same customer/date.");
      } else {
        router.push("/sales");
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save sale.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategory() {
    if (!newCategory.trim()) {
      toast.error("Enter a category name first.");
      return;
    }

    try {
      const created = await createCategory({ name: newCategory.trim() });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCategory(created.name);
      setNewCategory("");
      toast.success("Category created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create category.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-[1184px] space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link href="/sales" className="hover:underline">
              Sales
            </Link>{" "}
            &gt; <span className="font-medium text-zinc-700">Add Sale</span>
          </p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-zinc-900">
            Add New Sale
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quickly log a new sale. Smart suggestions auto-fill matching items.
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-xl border-zinc-200">
          <Link href="/sales">
            <ChevronLeft className="size-4" />
            Back to Sales
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <CardContent className="space-y-6 p-6">
            <section className="space-y-4">
              <h2 className="border-b pb-3 text-lg font-semibold text-zinc-900">
                Item Details
              </h2>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">Sale Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <ChoicePill
                    active={saleType === "product"}
                    label="Product"
                    activeClass="bg-fuchsia-600 text-white"
                    onClick={() => setSaleType("product")}
                  />
                  <ChoicePill
                    active={saleType === "service"}
                    label="Service"
                    activeClass="bg-fuchsia-600 text-white"
                    onClick={() => setSaleType("service")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">
                  {saleType === "product" ? "Product" : "Service"} name{" "}
                  <span className="text-fuchsia-600">*</span>
                </label>
                <div className="rounded-xl border border-fuchsia-600 bg-white">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={itemName}
                      onChange={(event) => setItemName(event.target.value)}
                      placeholder="Premium Widget Set"
                      className="h-10 border-0 pl-10 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  {suggestions.length ? (
                    <div className="border-t border-fuchsia-200">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.itemName}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-fuchsia-50/40"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          <span>
                            <span className="block text-sm font-medium text-zinc-900">
                              {suggestion.itemName}
                            </span>
                            <span className="block text-xs text-gray-500">
                              Category: {suggestion.category ?? "General"} • In stock:{" "}
                              {suggestion.quantity ?? 1}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-zinc-800">
                            {formatCurrency(suggestion.unitPrice)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-800">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 rounded-xl border-zinc-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categories.map((option) => (
                        <SelectItem key={option.id} value={option.name}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-800">
                    New Category
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      placeholder="Create..."
                      className="h-10 rounded-xl border-zinc-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl border-zinc-200 px-3"
                      onClick={() => void handleCreateCategory()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {saleType === "product" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-800">Quantity</label>
                    <div className="flex h-10 items-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
                      <button
                        type="button"
                        className="h-full w-10 text-lg text-gray-500 hover:bg-zinc-50"
                        onClick={() => incrementQty(-1)}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center text-sm font-semibold">
                        {qtyValue}
                      </div>
                      <button
                        type="button"
                        className="h-full w-10 text-lg text-gray-500 hover:bg-zinc-50"
                        onClick={() => incrementQty(1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-800">Unit price</label>
                    <Input
                      value={unitPrice}
                      onChange={(event) => {
                        setPriceManuallyEdited(true);
                        setUnitPrice(event.target.value);
                      }}
                      placeholder="$ 120.00"
                      className="h-10 rounded-xl border-zinc-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-800">Service price</label>
                  <Input
                    value={unitPrice}
                    onChange={(event) => {
                      setPriceManuallyEdited(true);
                      setUnitPrice(event.target.value);
                    }}
                    placeholder="$ 120.00"
                    className="h-10 rounded-xl border-zinc-200"
                  />
                </div>
              )}

              {saleType === "product" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-800">
                    Cost price <span className="text-xs text-gray-400">(Optional)</span>
                  </label>
                  <Input
                    value={costPrice}
                    onChange={(event) => setCostPrice(event.target.value)}
                    placeholder="$ 45.00"
                    className="h-10 max-w-sm rounded-xl border-zinc-200"
                  />
                  <p className="text-xs text-gray-400">Used to calculate profit margins</p>
                </div>
              ) : null}
            </section>

            <section className="space-y-4">
              <h2 className="border-b pb-3 text-lg font-semibold text-zinc-900">
                Sale Context
              </h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">
                  Customer <span className="text-xs text-gray-400">(Optional)</span>
                </label>
                <Input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer name"
                  className="h-10 rounded-xl border-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">Payment status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["paid", "partial", "unpaid"] as const).map((status) => (
                    <ChoicePill
                      key={status}
                      active={paymentStatus === status}
                      label={status[0].toUpperCase() + status.slice(1)}
                      activeClass={
                        status === "paid"
                          ? "bg-emerald-500 text-white"
                          : "bg-fuchsia-600 text-white"
                      }
                      onClick={() => setPaymentStatus(status)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">Sales channel</label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ["instagram", "Instagram"],
                      ["whatsapp", "WhatsApp"],
                      ["website", "Website"],
                      ["walk-in", "In-Store"],
                    ] as const
                  ).map(([channel, label]) => (
                    <ChoicePill
                      key={channel}
                      active={salesChannel === channel}
                      label={label}
                      activeClass="bg-fuchsia-600 text-white"
                      onClick={() => setSalesChannel(channel)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-20 rounded-xl border-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800">Sale date & time</label>
                <Input
                  type="datetime-local"
                  value={soldAt}
                  onChange={(event) => setSoldAt(event.target.value)}
                  className="h-10 rounded-xl border-zinc-200"
                />
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50/40 shadow-sm">
          <CardContent className="space-y-5 p-5">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">Order Summary</h2>
              <p className="text-sm text-gray-500">Review details before saving</p>
            </div>

            <div className="rounded-xl bg-fuchsia-50/60 p-3">
              <p className="text-sm font-semibold text-zinc-900">
                {itemName || "Premium Widget Set"}
              </p>
              <p className="text-xs text-gray-500">
                {saleType === "product" ? "Product" : "Service"} |{" "}
                {formatCurrency(unitPriceValue || 120)}
              </p>
              <p className="mt-1 text-right text-sm font-semibold text-zinc-900">
                {formatCurrency(total || 240)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(total || 240)} />
              <SummaryRow label="Discount" value="$0.00" />
              <SummaryRow label="Tax (0%)" value="$0.00" />
              <div className="border-t pt-2">
                <SummaryRow
                  labelClass="text-3xl font-semibold text-zinc-900"
                  valueClass="text-3xl font-semibold text-fuchsia-600"
                  label="Total"
                  value={formatCurrency(total || 240)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="h-10 w-full rounded-xl bg-fuchsia-600 text-sm hover:bg-fuchsia-700"
                onClick={() => void submitSale(false)}
                disabled={submitting}
              >
                <Check className="size-4" />
                {submitting ? "Saving..." : "Save Sale"}
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full rounded-xl border-zinc-200 text-sm"
                onClick={() => void submitSale(true)}
                disabled={submitting}
              >
                Save & Add Line Item
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400">
              Press <kbd className="rounded border px-1">Ctrl</kbd> +{" "}
              <kbd className="rounded border px-1">Enter</kbd> to save
            </p>

            {costPrice ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-2 text-xs text-gray-500">
                Estimated profit:{" "}
                <span className="font-semibold text-zinc-800">
                  {formatCurrency(estimatedProfit)}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChoicePill({
  active,
  label,
  activeClass,
  onClick,
}: {
  active: boolean;
  label: string;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl border text-sm font-medium transition-colors ${
        active
          ? `${activeClass} border-transparent`
          : "border-zinc-200 bg-zinc-100/60 text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  labelClass,
  valueClass,
}: {
  label: string;
  value: string;
  labelClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={labelClass ?? "text-gray-500"}>{label}</span>
      <span className={valueClass ?? "font-semibold text-zinc-900"}>{value}</span>
    </div>
  );
}
