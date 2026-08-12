"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileDown,
  FileText,
  LoaderCircle,
  PackagePlus,
  Paperclip,
  Plus,
  ReceiptText,
  Save,
  Search,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { customersApi, salesApi, storageApi, suiteApi } from "@/lib/api";
import type { CatalogItem } from "@/lib/suite";
import { downloadReceipt, type ReceiptDraft } from "@/lib/exporters";
import {
  paymentLabels,
  paymentStatusLabels,
  pricingMethodLabels,
  saleTypeLabels,
  todayInputValue,
  type Customer,
  type DiscountType,
  type PaymentMethod,
  type PaymentStatus,
  type PricingMethod,
  type SaleInput,
  type SaleItem,
  type SaleType,
} from "@/lib/sales";

type DraftItem = Omit<SaleItem, "measurement" | "rate" | "lineTotal"> & {
  id: string;
  measurement: number;
  rate: number;
  lineTotal: number;
};
const unitSuggestions = [
  "item",
  "bag",
  "tray",
  "basket",
  "bunch",
  "crate",
  "kg",
  "litre",
  "plate",
  "hour",
  "day",
  "person",
  "event",
  "session",
];

const newItem = (name = ""): DraftItem => ({
  id: crypto.randomUUID(),
  catalogItemId: null,
  name,
  type: "PRODUCT",
  pricingMethod: "FIXED",
  measurement: 1,
  unit: "item",
  rate: 0,
  lineTotal: 0,
  manualTotalOverride: false,
});

export function RecordSalePageContent() {
  const router = useRouter();
  const business = useBusinessSettings();
  const [mobileNav, setMobileNav] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [items, setItems] = useState<DraftItem[]>(() => [newItem()]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerChoice, setCustomerChoice] = useState("walk-in");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("MOBILE_MONEY");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [amountPaid, setAmountPaid] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [overrideTotal, setOverrideTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState(0);
  const [soldAt, setSoldAt] = useState(todayInputValue());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState<"save" | "another" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([
      customersApi.list(),
      salesApi.list(),
      suiteApi.catalog(),
    ]).then(([customerResult, salesResult, catalogResult]) => {
      if (customerResult.status === "fulfilled")
        setCustomers(customerResult.value);
      if (salesResult.status === "fulfilled")
        setSuggestions(
          [...new Set(salesResult.value.map((sale) => sale.description))].slice(
            0,
            8,
          ),
        );
      if (catalogResult.status === "fulfilled") setCatalog(catalogResult.value);
    });
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount =
    discountType === "PERCENTAGE"
      ? (subtotal * Math.min(100, discountValue)) / 100
      : discountType === "FIXED"
        ? Math.min(subtotal, discountValue)
        : 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxEnabled ? (taxable * taxRate) / 100 : 0;
  const calculatedTotal = taxable + taxAmount;
  const total = overrideTotal ? manualTotal : calculatedTotal;
  const paid =
    paymentStatus === "PAID"
      ? total
      : paymentStatus === "UNPAID"
        ? 0
        : Math.min(total, amountPaid);
  const balance = Math.max(0, total - paid);

  const customer = useMemo(() => {
    if (customerChoice === "walk-in") return null;
    if (customerChoice === "new")
      return newCustomer.name.trim()
        ? {
            name: newCustomer.name.trim(),
            phone: newCustomer.phone.trim() || null,
            email: newCustomer.email.trim() || null,
          }
        : null;
    const match = customers.find((item) => item.id === customerChoice);
    return match
      ? {
          id: match.id,
          name: match.name,
          phone: match.phone,
          email: match.email,
        }
      : null;
  }, [customerChoice, customers, newCustomer]);

  function updateItem<K extends keyof DraftItem>(
    id: string,
    key: K,
    value: DraftItem[K],
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [key]: value };
        if (!next.manualTotalOverride)
          next.lineTotal =
            next.pricingMethod === "FIXED"
              ? next.rate
              : next.measurement * next.rate;
        return next;
      }),
    );
  }

  function selectCatalog(id: string, catalogId: string) {
    const selected = catalog.find((item) => item.id === catalogId);
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              catalogItemId: selected.id,
              name: selected.name,
              type: selected.kind,
              pricingMethod: selected.kind === "PRODUCT" ? "PER_ITEM" : "FIXED",
              measurement: 1,
              unit: selected.kind === "PRODUCT" ? "item" : null,
              rate: selected.sellingPrice,
              lineTotal: selected.sellingPrice,
              manualTotalOverride: false,
            }
          : item,
      ),
    );
  }

  function validate() {
    if (!items.length || items.some((item) => !item.name.trim()))
      return "Add a name for every item or service.";
    if (items.some((item) => item.lineTotal <= 0))
      return "Every line total must be greater than zero.";
    if (total <= 0) return "The final total must be greater than zero.";
    if (customerChoice === "new" && !newCustomer.name.trim())
      return "Enter the new customer's name.";
    const missing = business.settings.salesCustomFields.find(
      (field) => field.required && !customValues[field.id]?.trim(),
    );
    if (missing) return `${missing.label} is required.`;
    return "";
  }

  function payload(): SaleInput {
    const first = items[0];
    return {
      reference: reference.trim() || null,
      customerName: customer?.name ?? null,
      customer,
      description:
        items.length === 1
          ? first.name.trim()
          : `${first.name.trim()} + ${items.length - 1} more`,
      category: items.every((item) => item.type === first.type)
        ? saleTypeLabels[first.type]
        : "Mixed sale",
      amount: total,
      paymentMethod,
      type: first.type,
      pricingMethod: first.pricingMethod,
      measurement: first.pricingMethod === "FIXED" ? null : first.measurement,
      unit: first.pricingMethod === "FIXED" ? null : first.unit,
      rate: first.rate,
      items: items.map(({ id: _id, ...item }) => ({
        ...item,
        measurement: item.pricingMethod === "FIXED" ? null : item.measurement,
        unit: item.pricingMethod === "FIXED" ? null : item.unit,
      })),
      discountType,
      discountValue,
      taxRate: taxEnabled ? taxRate : 0,
      manualTotalOverride: overrideTotal,
      paymentStatus,
      amountPaid: paid,
      soldAt: new Date(soldAt).toISOString(),
      notes: notes.trim() || null,
      customFields: Object.fromEntries(
        business.settings.salesCustomFields
          .map((field) => [field.label, customValues[field.id] ?? ""])
          .filter(([, value]) => value),
      ),
    };
  }

  function receiptDraft(): ReceiptDraft {
    return {
      reference: reference.trim() || "DRAFT",
      customerName: customer?.name,
      soldAt: new Date(soldAt).toISOString(),
      items,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      amountPaid: paid,
      balanceDue: balance,
      paymentMethod: paymentLabels[paymentMethod],
    };
  }

  async function save(mode: "save" | "another") {
    const problem = validate();
    if (problem) {
      setError(problem);
      if (business.settings.salesCustomFields.some((field) => field.required))
        setDetailed(true);
      return;
    }
    setSaving(mode);
    setError("");
    try {
      const created = await salesApi.create(payload());
      setUploading(true);
      for (const file of attachments)
        await storageApi.uploadSaleAttachment(created.id, file);
      setUploading(false);
      if (mode === "another") {
        setItems([newItem()]);
        setReference("");
        setNotes("");
        setAttachments([]);
        setDiscountType("NONE");
        setDiscountValue(0);
        setTaxEnabled(false);
        setTaxRate(0);
        setPaymentStatus("PAID");
        setAmountPaid(0);
        setCustomValues({});
        setPreviewOpen(false);
      } else router.push(`/sales/${created.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `The sale may have been saved, but a file could not be attached: ${caught.message}`
          : "The sale could not be saved. Check the API connection and try again.",
      );
    } finally {
      setSaving(null);
      setUploading(false);
    }
  }

  async function attach(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 10 * 1024 * 1024)
      return setError("The attachment must be 10 MB or smaller.");
    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        file.type,
      )
    )
      return setError("Use a JPG, PNG, WebP, or PDF file.");
    setAttachments((current) => [...current, file]);
  }

  function openPreview() {
    const problem = validate();
    if (problem) {
      setError(problem);
      if (business.settings.salesCustomFields.some((field) => field.required))
        setDetailed(true);
      return;
    }
    setError("");
    setPreviewOpen(true);
  }

  async function shareReceipt() {
    const text = `${business.settings.businessName}\n${items.map((item) => `${item.name}: ${business.formatMoneyPrecise(item.lineTotal)}`).join("\n")}\nTotal: ${business.formatMoneyPrecise(total)}\nPaid: ${business.formatMoneyPrecise(paid)}\nBalance: ${business.formatMoneyPrecise(balance)}`;
    if (navigator.share) await navigator.share({ title: "Sale receipt", text });
    else await navigator.clipboard.writeText(text);
  }

  const quick = items[0];

  return (
    <AppShell
      title="Record sale"
      subtitle="Quick when you need it, detailed when the sale needs structure."
      mobileNavOpen={mobileNav}
      onMobileNavChange={setMobileNav}
      actions={
        <>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/sales">Cancel</Link>
          </Button>
          <Button disabled={Boolean(saving)} onClick={() => void save("save")}>
            {saving === "save" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Save />
            )}
            Save sale
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void save("save");
        }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/sales">
              <ArrowLeft />
              Back to sales
            </Link>
          </Button>
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setDetailed(false)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${!detailed ? "bg-white shadow-sm" : "text-muted-foreground"}`}
            >
              Quick sale
            </button>
            <button
              type="button"
              onClick={() => setDetailed(true)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${detailed ? "bg-white shadow-sm" : "text-muted-foreground"}`}
            >
              Detailed sale
            </button>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {!detailed ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-[#168e64]">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <CardTitle>Quick sale</CardTitle>
                      <CardDescription>
                        Only the essentials. You can add detail whenever you
                        need it.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                    Select saved product or service
                    <Select
                      value={quick.catalogItemId ?? "custom"}
                      onValueChange={(value) => {
                        if (value === "custom")
                          updateItem(quick.id, "catalogItemId", null);
                        else selectCatalog(quick.id, value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom sale</SelectItem>
                        {catalog.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ·{" "}
                            {business.formatMoney(item.sellingPrice)}
                            {item.kind === "PRODUCT"
                              ? ` · ${item.quantity} in stock`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                    Item or service
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        className="pl-9"
                        placeholder="e.g. Peppers, wedding buffet, oil change"
                        value={quick.name}
                        onChange={(event) =>
                          updateItem(quick.id, "name", event.target.value)
                        }
                      />
                    </div>
                    {quick.name &&
                      suggestions
                        .filter(
                          (item) =>
                            item
                              .toLowerCase()
                              .includes(quick.name.toLowerCase()) &&
                            item !== quick.name,
                        )
                        .slice(0, 4).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions
                            .filter(
                              (item) =>
                                item
                                  .toLowerCase()
                                  .includes(quick.name.toLowerCase()) &&
                                item !== quick.name,
                            )
                            .slice(0, 4)
                            .map((item) => (
                              <Button
                                key={item}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateItem(quick.id, "name", item)
                                }
                              >
                                {item}
                              </Button>
                            ))}
                        </div>
                      )}
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Type
                    <Select
                      value={quick.type}
                      onValueChange={(value) =>
                        updateItem(quick.id, "type", value as SaleType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(saleTypeLabels) as SaleType[]).map(
                          (type) => (
                            <SelectItem key={type} value={type}>
                              {saleTypeLabels[type]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </label>
                  {quick.catalogItemId && quick.type === "PRODUCT" && (
                    <label className="space-y-1.5 text-sm font-medium">
                      Quantity
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={quick.measurement || ""}
                        onChange={(event) =>
                          updateItem(
                            quick.id,
                            "measurement",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  )}
                  <label className="space-y-1.5 text-sm font-medium">
                    Amount ({business.settings.currency})
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        {business.currencySymbol}
                      </span>
                      <Input
                        className="pl-12 text-lg font-semibold"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={quick.rate || ""}
                        onChange={(event) =>
                          updateItem(
                            quick.id,
                            "rate",
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Customer
                    <Select
                      value={customerChoice}
                      onValueChange={setCustomerChoice}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in">
                          Walk-in customer
                        </SelectItem>
                        <SelectItem value="new">+ Add new customer</SelectItem>
                        {customers.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Payment method
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) =>
                        setPaymentMethod(value as PaymentMethod)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(paymentLabels) as PaymentMethod[]).map(
                          (method) => (
                            <SelectItem key={method} value={method}>
                              {paymentLabels[method]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDetailed(true)}
                    className="flex items-center justify-between rounded-xl border border-dashed p-4 text-left transition hover:border-[#24b47e] hover:bg-emerald-50/50 sm:col-span-2"
                  >
                    <span>
                      <span className="block text-sm font-semibold">
                        Need quantity, units, tax, or more items?
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Open the detailed sale without losing what you entered.
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-[#168e64]" />
                  </button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <CardTitle>Items and services</CardTitle>
                    <CardDescription>
                      Each line keeps the standardized fields reporting needs.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems((current) => [...current, newItem()])
                    }
                  >
                    <Plus />
                    Add item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-muted/20 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-lg bg-[#172a45] text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold">
                            {item.name || "New item"}
                          </span>
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() =>
                              setItems((current) =>
                                current.filter((row) => row.id !== item.id),
                              )
                            }
                            aria-label="Remove item"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 min-[1380px]:grid-cols-4">
                        <label className="space-y-1.5 text-xs font-medium sm:col-span-2">
                          Item / service
                          <Input
                            placeholder="Search or enter a custom sale"
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                          />
                        </label>
                        <label className="space-y-1.5 text-xs font-medium">
                          Type
                          <Select
                            value={item.type}
                            onValueChange={(value) =>
                              updateItem(item.id, "type", value as SaleType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(saleTypeLabels) as SaleType[]).map(
                                (type) => (
                                  <SelectItem key={type} value={type}>
                                    {saleTypeLabels[type]}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </label>
                        <label className="space-y-1.5 text-xs font-medium">
                          Pricing
                          <Select
                            value={item.pricingMethod}
                            onValueChange={(value) =>
                              updateItem(
                                item.id,
                                "pricingMethod",
                                value as PricingMethod,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.keys(
                                  pricingMethodLabels,
                                ) as PricingMethod[]
                              ).map((method) => (
                                <SelectItem key={method} value={method}>
                                  {pricingMethodLabels[method]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                        {item.pricingMethod !== "FIXED" && (
                          <>
                            <label className="space-y-1.5 text-xs font-medium">
                              Measurement / quantity
                              <Input
                                type="number"
                                min="0"
                                step="0.001"
                                value={item.measurement || ""}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "measurement",
                                    Number(event.target.value),
                                  )
                                }
                              />
                            </label>
                            <label className="space-y-1.5 text-xs font-medium">
                              Unit
                              <Input
                                placeholder="bag, kg, session…"
                                value={item.unit ?? ""}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "unit",
                                    event.target.value,
                                  )
                                }
                              />
                              <div className="scrollbar-none flex gap-1 overflow-x-auto">
                                {unitSuggestions.slice(0, 6).map((unit) => (
                                  <button
                                    type="button"
                                    key={unit}
                                    className="text-[10px] text-[#168e64] hover:underline"
                                    onClick={() =>
                                      updateItem(item.id, "unit", unit)
                                    }
                                  >
                                    {unit}
                                  </button>
                                ))}
                              </div>
                            </label>
                          </>
                        )}
                        <label className="space-y-1.5 text-xs font-medium">
                          Rate / unit price ({business.settings.currency})
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate || ""}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "rate",
                                Number(event.target.value),
                              )
                            }
                          />
                        </label>
                        <label className="space-y-1.5 text-xs font-medium">
                          Line total ({business.settings.currency})
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!item.manualTotalOverride}
                            value={item.lineTotal || ""}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "lineTotal",
                                Number(event.target.value),
                              )
                            }
                          />
                          <span className="flex items-center gap-2">
                            <Switch
                              checked={item.manualTotalOverride}
                              onCheckedChange={(checked) =>
                                updateItem(
                                  item.id,
                                  "manualTotalOverride",
                                  checked,
                                )
                              }
                            />
                            Manual override
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {customerChoice === "new" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="size-4 text-[#168e64]" />
                    New customer
                  </CardTitle>
                  <CardDescription>
                    This sale will automatically appear in their customer
                    history.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-1.5 text-sm font-medium">
                    Name
                    <Input
                      value={newCustomer.name}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Phone
                    <Input
                      value={newCustomer.phone}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Email
                    <Input
                      type="email"
                      value={newCustomer.email}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </label>
                </CardContent>
              </Card>
            )}

            {detailed && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Adjustments and payment</CardTitle>
                    <CardDescription>
                      Discount, tax, payment status, and the balance due.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-1.5 text-sm font-medium">
                      Discount
                      <Select
                        value={discountType}
                        onValueChange={(value) =>
                          setDiscountType(value as DiscountType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">No discount</SelectItem>
                          <SelectItem value="FIXED">Fixed amount</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    {discountType !== "NONE" && (
                      <label className="space-y-1.5 text-sm font-medium">
                        Discount{" "}
                        {discountType === "PERCENTAGE"
                          ? "(%)"
                          : `(${business.settings.currency})`}
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountValue || ""}
                          onChange={(event) =>
                            setDiscountValue(Number(event.target.value))
                          }
                        />
                      </label>
                    )}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tax</p>
                      <label className="flex h-10 items-center gap-2">
                        <Switch
                          checked={taxEnabled}
                          onCheckedChange={setTaxEnabled}
                        />
                        Enable tax
                      </label>
                    </div>
                    {taxEnabled && (
                      <label className="space-y-1.5 text-sm font-medium">
                        Tax rate (%)
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxRate || ""}
                          onChange={(event) =>
                            setTaxRate(Number(event.target.value))
                          }
                        />
                      </label>
                    )}
                    <label className="space-y-1.5 text-sm font-medium">
                      Payment method
                      <Select
                        value={paymentMethod}
                        onValueChange={(value) =>
                          setPaymentMethod(value as PaymentMethod)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(paymentLabels) as PaymentMethod[]).map(
                            (method) => (
                              <SelectItem key={method} value={method}>
                                {paymentLabels[method]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1.5 text-sm font-medium">
                      Payment status
                      <Select
                        value={paymentStatus}
                        onValueChange={(value) =>
                          setPaymentStatus(value as PaymentStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(paymentStatusLabels) as PaymentStatus[]
                          ).map((status) => (
                            <SelectItem key={status} value={status}>
                              {paymentStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                    {paymentStatus === "PARTIALLY_PAID" && (
                      <label className="space-y-1.5 text-sm font-medium">
                        Amount paid ({business.settings.currency})
                        <Input
                          type="number"
                          min="0"
                          max={total}
                          step="0.01"
                          value={amountPaid || ""}
                          onChange={(event) =>
                            setAmountPaid(Number(event.target.value))
                          }
                        />
                      </label>
                    )}
                    <div className="rounded-xl bg-muted/60 p-3 sm:col-span-2 lg:col-span-3">
                      <label className="flex items-center justify-between gap-4">
                        <span>
                          <span className="block text-sm font-semibold">
                            Override final total
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Use only when the agreed total differs from the
                            calculated amount.
                          </span>
                        </span>
                        <Switch
                          checked={overrideTotal}
                          onCheckedChange={(checked) => {
                            setOverrideTotal(checked);
                            if (checked) setManualTotal(calculatedTotal);
                          }}
                        />
                      </label>
                      {overrideTotal && (
                        <Input
                          className="mt-3"
                          type="number"
                          min="0"
                          step="0.01"
                          value={manualTotal || ""}
                          onChange={(event) =>
                            setManualTotal(Number(event.target.value))
                          }
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sale information</CardTitle>
                    <CardDescription>
                      Customer, date, reference, notes, and your
                      business-specific fields.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">
                      Customer
                      <Select
                        value={customerChoice}
                        onValueChange={setCustomerChoice}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk-in">
                            Walk-in customer
                          </SelectItem>
                          <SelectItem value="new">
                            + Add new customer
                          </SelectItem>
                          {customers.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1.5 text-sm font-medium">
                      Date and time
                      <Input
                        type="datetime-local"
                        value={soldAt}
                        onChange={(event) => setSoldAt(event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                      Reference / order number
                      <Input
                        placeholder="Generated automatically if empty"
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                      />
                    </label>
                    {business.settings.salesCustomFields.map((field) => (
                      <label
                        key={field.id}
                        className="space-y-1.5 text-sm font-medium"
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-600">*</span>
                        )}
                        <Input
                          value={customValues[field.id] ?? ""}
                          onChange={(event) =>
                            setCustomValues((current) => ({
                              ...current,
                              [field.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    ))}
                    <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                      Notes
                      <Textarea
                        placeholder="Internal note, delivery detail, or anything useful later"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </label>
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-sm font-medium">Attachments</p>
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed p-4 transition hover:border-[#24b47e] hover:bg-emerald-50/40">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-lg bg-muted">
                            <Paperclip className="size-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              Attach receipt, photo, or document
                            </span>
                            <span className="text-xs text-muted-foreground">
                              JPG, PNG, WebP, or PDF up to 10 MB
                            </span>
                          </span>
                        </span>
                        {uploading ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(event) =>
                            void attach(event.target.files?.[0])
                          }
                        />
                      </label>
                      {attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {attachments.map((file) => (
                            <div
                              key={`${file.name}-${file.size}-${file.lastModified}`}
                              className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs"
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="size-4" />
                                {file.name}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setAttachments((current) =>
                                    current.filter((item) => item !== file),
                                  )
                                }
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <div className="bg-[#172a45] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
                      Sale total
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                      {business.formatMoney(total)}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5">
                    <ReceiptText className="size-5 text-[#42d49a]" />
                  </span>
                </div>
              </div>
              <CardContent className="space-y-3 p-5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{business.formatMoneyPrecise(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Discount</span>
                    <span>-{business.formatMoneyPrecise(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax</span>
                    <span>{business.formatMoneyPrecise(taxAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-display font-bold">
                    <span>Final total</span>
                    <span>{business.formatMoneyPrecise(total)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>Amount paid</span>
                    <span>{business.formatMoneyPrecise(paid)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm font-semibold text-amber-700">
                    <span>Balance due</span>
                    <span>{business.formatMoneyPrecise(balance)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>
                      {items.length} {items.length === 1 ? "line" : "lines"}
                    </span>
                    <span>{paymentStatusLabels[paymentStatus]}</span>
                  </div>
                </div>
                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
                    {error}
                  </p>
                )}
                <Button type="button" className="w-full" onClick={openPreview}>
                  <ReceiptText />
                  Preview sale
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={Boolean(saving)}
                  onClick={() => void save("another")}
                >
                  {saving === "another" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <PackagePlus />
                  )}
                  Save & add another
                </Button>
              </CardContent>
            </Card>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">
              <p className="font-semibold">What happens when you save</p>
              <p className="mt-1">
                Dashboard totals, customer history, and product analytics update
                immediately. Linked products are deducted from inventory
                automatically.
              </p>
            </div>
          </aside>
        </div>
      </form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview sale</DialogTitle>
            <DialogDescription>
              Review the complete sale before it changes your revenue totals.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
            <div className="rounded-xl bg-[#172a45] p-5 text-white">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    {business.settings.businessName}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    Sale receipt
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{reference || "Reference generated on save"}</p>
                  <p>{new Date(soldAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b pb-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {saleTypeLabels[item.type]} ·{" "}
                      {pricingMethodLabels[item.pricingMethod]}
                      {item.pricingMethod !== "FIXED"
                        ? ` · ${item.measurement} ${item.unit} × ${business.formatMoneyPrecise(item.rate)}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-display font-bold">
                    {business.formatMoneyPrecise(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{business.formatMoneyPrecise(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{business.formatMoneyPrecise(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{business.formatMoneyPrecise(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-display text-lg font-bold">
                <span>Total</span>
                <span>{business.formatMoneyPrecise(total)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Balance due</span>
                <span>{business.formatMoneyPrecise(balance)}</span>
              </div>
            </div>
            {customer && (
              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <span className="text-muted-foreground">Customer:</span>{" "}
                <span className="font-semibold">{customer.name}</span>
              </div>
            )}
          </div>
          <DialogFooter className="flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void downloadReceipt(
                  receiptDraft(),
                  business.settings.businessName,
                  business.settings.currency,
                )
              }
            >
              <FileDown />
              Download receipt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void shareReceipt()}
            >
              <Share2 />
              Share
            </Button>
            <Button
              type="button"
              disabled={Boolean(saving)}
              onClick={() => void save("save")}
            >
              {saving === "save" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Check />
              )}
              Save sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
