"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  expenseCategories,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";
import {
  paymentLabels,
  todayInputValue,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/sales";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";

type Props = {
  open: boolean;
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ExpenseInput) => Promise<void>;
};
const initial = (expense: Expense | null) => ({
  vendor: expense?.vendor ?? "",
  description: expense?.description ?? "",
  category: expense?.category ?? expenseCategories[0],
  amount: expense ? String(expense.amount) : "",
  paymentMethod: expense?.paymentMethod ?? ("CASH" as PaymentMethod),
  paymentStatus: expense?.paymentStatus ?? ("PAID" as PaymentStatus),
  amountPaid: expense ? String(expense.amountPaid) : "",
  incurredAt: expense
    ? todayInputValue(new Date(expense.incurredAt))
    : todayInputValue(),
  notes: expense?.notes ?? "",
});

export function ExpenseFormDialog({
  open,
  expense,
  onOpenChange,
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ExpenseForm
          key={expense?.id ?? "new"}
          expense={expense}
          onSave={onSave}
          close={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

function ExpenseForm({
  expense,
  onSave,
  close,
}: {
  expense: Expense | null;
  onSave: Props["onSave"];
  close: () => void;
}) {
  const business = useBusinessSettings();
  const [form, setForm] = useState(() => initial(expense));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.description.trim() || Number(form.amount) <= 0)
      return setError("Add what you paid for and an amount greater than zero.");
    setSaving(true);
    try {
      await onSave({
        vendor: form.vendor || null,
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        amountPaid:
          form.paymentStatus === "PAID"
            ? Number(form.amount)
            : form.paymentStatus === "UNPAID"
              ? 0
              : Number(form.amountPaid),
        incurredAt: new Date(form.incurredAt).toISOString(),
        notes: form.notes || null,
        customFields: {},
      });
      close();
    } catch {
      setError("The expense could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit expense</DialogTitle>
        <DialogDescription>
          Keep spending totals and payment status accurate.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
            What did you pay for?
            <Input
              autoFocus
              value={form.description}
              onChange={(event) => field("description", event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Amount ({business.settings.currency})
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => field("amount", event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Date
            <Input
              type="datetime-local"
              value={form.incurredAt}
              onChange={(event) => field("incurredAt", event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Vendor
            <Input
              value={form.vendor}
              onChange={(event) => field("vendor", event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Category
            <Select
              value={form.category}
              onValueChange={(value) => field("category", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Payment method
            <Select
              value={form.paymentMethod}
              onValueChange={(value) => field("paymentMethod", value)}
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
              value={form.paymentStatus}
              onValueChange={(value) => field("paymentStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {form.paymentStatus === "PARTIALLY_PAID" && (
            <label className="space-y-1.5 text-sm font-medium">
              Amount paid
              <Input
                type="number"
                min="0"
                value={form.amountPaid}
                onChange={(event) => field("amountPaid", event.target.value)}
              />
            </label>
          )}
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
            Notes
            <Input
              value={form.notes}
              onChange={(event) => field("notes", event.target.value)}
            />
          </label>
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button disabled={saving}>
            {saving && <LoaderCircle className="animate-spin" />}Save changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
