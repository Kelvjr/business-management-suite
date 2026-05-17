"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createSale, fetchSales, type Sale } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  type FrequentItem,
  upsertFrequentItem,
} from "@/lib/sales-automation";

type NewSaleSheetProps = {
  trigger?: ReactNode;
  /** When true, no trigger is rendered (for global URL-driven open from AppShell). */
  hideTrigger?: boolean;
};

type SaleChannel = "walk-in" | "whatsapp" | "instagram" | "phone" | "website";
type PaymentStatus = "paid" | "partial" | "unpaid";

type Suggestion = {
  source: "memory" | "history";
  itemType: "product" | "service";
  itemName: string;
  category?: string;
  subcategory?: string;
  unitPrice: number;
  paymentStatus: PaymentStatus;
  salesChannel: SaleChannel;
  customerName?: string;
  notes?: string;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function NewSaleSheetInner({ trigger, hideTrigger }: NewSaleSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [salesChannel, setSalesChannel] = useState<SaleChannel>("walk-in");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [soldAt, setSoldAt] = useState(getNowDatetimeLocalValue());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [frequentItems, setFrequentItems] = useState<FrequentItem[]>([]);
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);

  useEffect(() => {
    if (searchParams.get("sale") === "new") {
      setOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!open) return;

    setFrequentItems(readFrequentItems());

    let active = true;

    fetchSales()
      .then((sales) => {
        if (active) {
          setSalesHistory(sales);
        }
      })
      .catch(() => {
        if (active) {
          setSalesHistory([]);
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  const totalAmount = useMemo(() => {
    const qty = Number(quantity || 0);
    const price = Number(unitPrice || 0);
    return qty * price;
  }, [quantity, unitPrice]);

  const estimatedProfit = useMemo(() => {
    const qty = Number(quantity || 0);
    const cost = Number(costPrice || 0);
    return totalAmount - qty * cost;
  }, [costPrice, quantity, totalAmount]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const query = normalizeText(itemName);
    if (!query) return [];

    const fromMemory = frequentItems
      .filter((item) => normalizeText(item.itemName).includes(query))
      .map((item) => ({
        source: "memory" as const,
        itemType: item.itemType,
        itemName: item.itemName,
        category: item.category,
        subcategory: item.subcategory,
        unitPrice: item.unitPrice,
        paymentStatus: item.paymentStatus,
        salesChannel: item.salesChannel,
        customerName: item.customerName,
        notes: item.notes,
      }));

    const latestByName = new Map<string, Sale>();
    for (const sale of [...salesHistory].sort(
      (a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime(),
    )) {
      const key = normalizeText(sale.itemName);
      if (!key || latestByName.has(key)) continue;
      latestByName.set(key, sale);
    }

    const fromHistory = Array.from(latestByName.values())
      .filter((sale) => normalizeText(sale.itemName).includes(query))
      .map((sale) => ({
        source: "history" as const,
        itemType: sale.itemType,
        itemName: sale.itemName,
        category: sale.category ?? undefined,
        subcategory: sale.subcategory ?? undefined,
        unitPrice: Number(sale.unitPrice ?? sale.totalAmount),
        paymentStatus: sale.paymentStatus as PaymentStatus,
        salesChannel: (sale.salesChannel ?? "walk-in") as SaleChannel,
        customerName: sale.customerName ?? undefined,
        notes: sale.notes ?? undefined,
      }));

    const unique = new Map<string, Suggestion>();
    for (const suggestion of [...fromMemory, ...fromHistory]) {
      const key = normalizeText(suggestion.itemName);
      if (!unique.has(key)) {
        unique.set(key, suggestion);
      }
    }

    return Array.from(unique.values()).slice(0, 6);
  }, [frequentItems, itemName, salesHistory]);

  const topFrequentItems = useMemo(
    () => frequentItems.slice(0, 6),
    [frequentItems],
  );

  useEffect(() => {
    if (!itemName.trim() || priceManuallyEdited) return;

    const lastPrice = findLastPrice(itemName, frequentItems, salesHistory);
    if (lastPrice === null) return;
    setUnitPrice(String(lastPrice));
  }, [frequentItems, itemName, priceManuallyEdited, salesHistory]);

  function clearSaleQuery() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sale");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && searchParams.get("sale") === "new") {
      clearSaleQuery();
    }
  }

  function resetForm() {
    setItemType("product");
    setItemName("");
    setCategory("");
    setSubcategory("");
    setQuantity("1");
    setUnitPrice("");
    setCostPrice("");
    setPaymentStatus("paid");
    setSalesChannel("walk-in");
    setCustomerName("");
    setNotes("");
    setSoldAt(getNowDatetimeLocalValue());
    setPriceManuallyEdited(false);
    setError("");
  }

  function applySuggestion(suggestion: Suggestion | FrequentItem) {
    setItemType(suggestion.itemType);
    setItemName(suggestion.itemName);
    setCategory(suggestion.category || "");
    setSubcategory(suggestion.subcategory || "");
    setUnitPrice(String(suggestion.unitPrice));
    setPaymentStatus(suggestion.paymentStatus);
    setSalesChannel(suggestion.salesChannel);
    setCustomerName(suggestion.customerName || "");
    setNotes(suggestion.notes || "");
    setPriceManuallyEdited(false);
  }

  function handleSaveCurrentItemPreset() {
    if (!itemName.trim()) {
      toast.error("Enter an item name first.");
      return;
    }

    if (!unitPrice || Number(unitPrice) <= 0) {
      toast.error("Enter a unit price greater than 0.");
      return;
    }

    const next = upsertFrequentItem({
      itemType,
      itemName: itemName.trim(),
      category: category.trim() || undefined,
      subcategory: subcategory.trim() || undefined,
      unitPrice: Number(unitPrice),
      paymentStatus,
      salesChannel,
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setFrequentItems(next);
    toast.success("Saved to frequent items.");
  }

  function handleRepeatLastSale() {
    if (!salesHistory.length) {
      toast.error("No previous sale found to repeat.");
      return;
    }

    const lastSale = [...salesHistory].sort(
      (a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime(),
    )[0];

    applySuggestion({
      source: "history",
      itemType: lastSale.itemType,
      itemName: lastSale.itemName,
      category: lastSale.category ?? undefined,
      subcategory: lastSale.subcategory ?? undefined,
      unitPrice: Number(lastSale.unitPrice ?? lastSale.totalAmount),
      paymentStatus: lastSale.paymentStatus as PaymentStatus,
      salesChannel: (lastSale.salesChannel ?? "walk-in") as SaleChannel,
      customerName: lastSale.customerName ?? undefined,
      notes: lastSale.notes ?? undefined,
    });

    setQuantity(String(lastSale.quantity ?? 1));
    setSoldAt(getNowDatetimeLocalValue());
    toast.success("Repeated last sale details.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!unitPrice || Number(unitPrice) <= 0) {
      setError("Unit price must be greater than 0.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);

      await createSale({
        itemType,
        itemName: itemName.trim(),
        category: category.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        totalAmount,
        paymentStatus,
        salesChannel,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        soldAt: soldAt ? new Date(soldAt).toISOString() : undefined,
      });

      const nextFrequent = upsertFrequentItem({
        itemType,
        itemName: itemName.trim(),
        category: category.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        unitPrice: Number(unitPrice),
        paymentStatus,
        salesChannel,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setFrequentItems(nextFrequent);

      toast.success("Sale created successfully.");
      handleOpenChange(false);
      resetForm();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger ? (
        <SheetTrigger asChild>
          {trigger ?? <Button>New Sale</Button>}
        </SheetTrigger>
      ) : null}

      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New Sale</SheetTitle>
          <SheetDescription>
            Add a new product or service sale.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRepeatLastSale}
            >
              Repeat Last Sale
            </Button>
            <p className="text-xs text-muted-foreground">
              Defaults: status is paid, channel is walk-in, sold at is now.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Type</label>
              <Select
                value={itemType}
                onValueChange={(value) =>
                  setItemType(value as "product" | "service")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <Select
                value={paymentStatus}
                onValueChange={(value) =>
                  setPaymentStatus(value as "paid" | "partial" | "unpaid")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Item Name</label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Chocolate Cake"
            />
            {suggestions.length ? (
              <div className="rounded-md border bg-muted/30 p-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Quick Add suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={`${suggestion.source}-${suggestion.itemName}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion.itemName} ({formatCurrency(suggestion.unitPrice)})
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {topFrequentItems.length ? (
              <div className="rounded-md border bg-muted/30 p-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Frequent items
                </p>
                <div className="flex flex-wrap gap-2">
                  {topFrequentItems.map((item) => (
                    <Button
                      key={`frequent-${item.itemName}`}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => applySuggestion(item)}
                    >
                      {item.itemName} ({item.useCount})
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveCurrentItemPreset}
            >
              Save current item to frequent list
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Bakery"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Cakes"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => {
                  setPriceManuallyEdited(true);
                  setUnitPrice(e.target.value);
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Cost Price <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Amount</label>
            <Input value={String(totalAmount || 0)} readOnly />
          </div>
          {costPrice ? (
            <div className="rounded-xl border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Estimated Profit</p>
              <p className="text-muted-foreground">{formatCurrency(estimatedProfit)}</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sales Channel</label>
              <Select
                value={salesChannel}
                onValueChange={(value) =>
                  setSalesChannel(
                    value as
                      | "walk-in"
                      | "whatsapp"
                      | "instagram"
                      | "phone"
                      | "website",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sold At</label>
            <Input
              type="datetime-local"
              value={soldAt}
              onChange={(e) => setSoldAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : "Save Sale"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function NewSaleSheet(props: NewSaleSheetProps) {
  return (
    <Suspense fallback={null}>
      <NewSaleSheetInner {...props} />
    </Suspense>
  );
}
