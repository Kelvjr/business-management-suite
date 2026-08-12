"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  LoaderCircle,
  Paperclip,
  Receipt,
  Save,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { expensesApi, storageApi } from "@/lib/api";
import { expenseCategories } from "@/lib/expenses";
import {
  paymentLabels,
  paymentStatusLabels,
  todayInputValue,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/sales";

export function RecordExpensePageContent() {
  const router = useRouter();
  const business = useBusinessSettings();
  const [mobileNav, setMobileNav] = useState(false);
  const [saving, setSaving] = useState<"save" | "another" | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [amountPaid, setAmountPaid] = useState(0);
  const [incurredAt, setIncurredAt] = useState(todayInputValue());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<
    "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
  >("MONTHLY");
  const [nextDueAt, setNextDueAt] = useState("");
  const paid =
    paymentStatus === "PAID"
      ? amount
      : paymentStatus === "UNPAID"
        ? 0
        : Math.min(amountPaid, amount);
  const balance = Math.max(0, amount - paid);
  const reset = () => {
    setDescription("");
    setVendor("");
    setAmount(0);
    setPaymentStatus("PAID");
    setAmountPaid(0);
    setReference("");
    setNotes("");
    setAttachments([]);
    setIncurredAt(todayInputValue());
    setIsRecurring(false);
    setNextDueAt("");
  };
  function attach(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 10 * 1024 * 1024)
      return setError("The attachment must be 10 MB or smaller.");
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type))
      return setError("Use a JPG, PNG, WebP, or PDF file.");
    setAttachments((rows) => [...rows, file]);
  }
  async function save(mode: "save" | "another") {
    if (!description.trim() || amount <= 0)
      return setError(
        "Add what the business paid for and an amount greater than zero.",
      );
    if (isRecurring && !nextDueAt)
      return setError("Choose the next due date for this recurring expense.");
    setSaving(mode);
    setError("");
    try {
      const created = await expensesApi.create({
        reference: reference || null,
        vendor: vendor || null,
        description,
        category,
        amount,
        paymentMethod,
        paymentStatus,
        amountPaid: paid,
        incurredAt: new Date(incurredAt).toISOString(),
        notes: notes || null,
        customFields: {},
        isRecurring,
        recurrence: isRecurring ? recurrence : null,
        nextDueAt: isRecurring ? new Date(nextDueAt).toISOString() : null,
      });
      setUploading(true);
      for (const file of attachments)
        await storageApi.uploadExpenseAttachment(created.id, file);
      if (mode === "another") reset();
      else router.push("/expenses");
      return created;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `The expense may have been saved, but a file could not be attached: ${caught.message}`
          : "The expense could not be saved. Check the connection and try again.",
      );
    } finally {
      setSaving(null);
      setUploading(false);
    }
  }
  const attachmentSize = useMemo(
    () => attachments.reduce((sum, file) => sum + file.size, 0),
    [attachments],
  );
  return (
    <AppShell
      title="Record expense"
      subtitle="Capture money leaving the business."
      mobileNavOpen={mobileNav}
      onMobileNavChange={setMobileNav}
      actions={
        <Button variant="outline" onClick={() => router.push("/expenses")}>
          <ArrowLeft />
          <span className="hidden sm:inline">Back to expenses</span>
        </Button>
      }
    >
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void save("save");
        }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-5 rounded-2xl border bg-white p-4 sm:flex sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#d7654c]">
              Expenses module
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">
              What did the business spend money on?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with the essentials. Add the receipt and payment detail when
              available.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground sm:mt-0">
            <Check className="size-4 text-[#168e64]" />
            Updates spending totals immediately
          </div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Expense details</CardTitle>
                <CardDescription>
                  The standardized fields that make spending reports reliable.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  What did you pay for?
                  <Input
                    autoFocus
                    placeholder="e.g. Four baskets of peppers"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Amount ({business.settings.currency})
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount || ""}
                    onChange={(event) => setAmount(Number(event.target.value))}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Category
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Vendor / paid to
                  <Input
                    placeholder="Optional"
                    value={vendor}
                    onChange={(event) => setVendor(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Date and time
                  <Input
                    type="datetime-local"
                    value={incurredAt}
                    onChange={(event) => setIncurredAt(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  Reference / invoice number
                  <Input
                    placeholder="Generated automatically if empty"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                  />
                </label>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment and schedule</CardTitle>
                <CardDescription>
                  Track payment status and expenses that repeat.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
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
                      {Object.entries(paymentLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
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
                      {Object.entries(paymentStatusLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </label>
                {paymentStatus === "PARTIALLY_PAID" && (
                  <label className="space-y-1.5 text-sm font-medium">
                    Amount paid ({business.settings.currency})
                    <Input
                      type="number"
                      min="0"
                      max={amount}
                      step="0.01"
                      value={amountPaid || ""}
                      onChange={(event) =>
                        setAmountPaid(Number(event.target.value))
                      }
                    />
                  </label>
                )}
                <label className="flex items-center justify-between rounded-xl bg-muted/60 p-3 sm:col-span-2">
                  <span>
                    <span className="block text-sm font-semibold">
                      Recurring expense
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Rent, subscriptions, utilities, retainers, and other
                      repeating costs.
                    </span>
                  </span>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </label>
                {isRecurring && (
                  <>
                    <label className="space-y-1.5 text-sm font-medium">
                      Repeats
                      <Select
                        value={recurrence}
                        onValueChange={(value) =>
                          setRecurrence(value as typeof recurrence)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1.5 text-sm font-medium">
                      Next due date
                      <Input
                        type="date"
                        value={nextDueAt}
                        onChange={(event) => setNextDueAt(event.target.value)}
                      />
                    </label>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Supporting information</CardTitle>
                <CardDescription>
                  Keep the receipt and context with the expense.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="space-y-1.5 text-sm font-medium">
                  Notes
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Purpose, approval, project, or other useful context"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed p-4 hover:border-[#d7654c]">
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-muted">
                      <Paperclip className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        Attach receipt or invoice
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPG, PNG, WebP, or PDF up to 10 MB
                      </span>
                    </span>
                  </span>
                  {uploading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => void attach(event.target.files?.[0])}
                  />
                </label>
                {attachments.map((file) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs"
                  >
                    <span>{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setAttachments((rows) =>
                          rows.filter((row) => row !== file),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <div className="bg-[#172a45] p-5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
                  Expense total
                </p>
                <p className="mt-2 font-display text-3xl font-bold">
                  {business.formatMoney(amount)}
                </p>
              </div>
              <CardContent className="space-y-3 p-5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Amount paid</span>
                  <span>{business.formatMoneyPrecise(paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-amber-700">
                  <span>Balance due</span>
                  <span>{business.formatMoneyPrecise(balance)}</span>
                </div>
                <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{paymentLabels[paymentMethod]}</span>
                    <span>{paymentStatusLabels[paymentStatus]}</span>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-2 flex justify-between">
                      <span>{attachments.length} attachment(s)</span>
                      <span>{Math.ceil(attachmentSize / 1024)} KB</span>
                    </div>
                  )}
                </div>
                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
                    {error}
                  </p>
                )}
                <Button className="w-full" disabled={Boolean(saving)}>
                  <Save />
                  {saving === "save" ? "Saving…" : "Save expense"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={Boolean(saving)}
                  onClick={() => void save("another")}
                >
                  <Receipt />
                  {saving === "another" ? "Saving…" : "Save & add another"}
                </Button>
              </CardContent>
            </Card>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              <div className="flex gap-2">
                <WalletCards className="mt-0.5 size-4 shrink-0" />
                <p>
                  <strong>Coming next:</strong> Expenses will feed the profit
                  view so revenue minus spending gives you the real answer.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </AppShell>
  );
}
