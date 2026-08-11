"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayInputValue, type PaymentMethod, type Sale, type SaleInput } from "@/lib/sales";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale | null;
  onSave: (input: SaleInput) => Promise<void>;
};

const emptyForm = () => ({
  customerName: "", description: "", category: "Services", amount: "", paymentMethod: "CARD" as PaymentMethod,
  soldAt: todayInputValue(), notes: "",
});

const formForSale = (sale?: Sale | null) => sale ? {
  customerName: sale.customerName ?? "", description: sale.description, category: sale.category,
  amount: String(sale.amount), paymentMethod: sale.paymentMethod,
  soldAt: todayInputValue(new Date(sale.soldAt)), notes: sale.notes ?? "",
} : emptyForm();

export function SaleFormDialog({ open, onOpenChange, sale, onSave }: Props) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {open && <SaleFormContent key={sale?.id ?? "new-sale"} sale={sale} onSave={onSave} onClose={() => onOpenChange(false)} />}
  </Dialog>;
}

function SaleFormContent({ sale, onSave, onClose }: Pick<Props, "sale" | "onSave"> & { onClose: () => void }) {
  const { settings } = useBusinessSettings();
  const [form, setForm] = useState(() => formForSale(sale));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.description.trim() || !form.category.trim() || Number(form.amount) <= 0) {
      setError("Add a description, category, and an amount greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        customerName: form.customerName.trim() || null,
        description: form.description.trim(), category: form.category.trim(), amount: Number(form.amount),
        paymentMethod: form.paymentMethod, soldAt: new Date(form.soldAt).toISOString(), notes: form.notes.trim() || null,
      });
      onClose();
    } catch {
      setError("The sale could not be saved. Check the API connection and try again.");
    } finally { setSaving(false); }
  }

  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <DialogContent>
      <DialogHeader>
        <DialogTitle>{sale ? "Edit sale" : "Record a sale"}</DialogTitle>
        <DialogDescription>{sale ? "Update the details and keep your revenue accurate." : "Capture the money that just came into your business."}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">What did you sell?<Input autoFocus placeholder="e.g. Brand strategy session" value={form.description} onChange={(e) => field("description", e.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-medium">Amount ({settings.currency})<Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => field("amount", e.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-medium">Date and time<Input type="datetime-local" value={form.soldAt} onChange={(e) => field("soldAt", e.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-medium">Customer<Input placeholder="Optional" value={form.customerName} onChange={(e) => field("customerName", e.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-medium">Category<Input placeholder="Services" value={form.category} onChange={(e) => field("category", e.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Payment method<Select value={form.paymentMethod} onValueChange={(value) => field("paymentMethod", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CARD">Card</SelectItem><SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem><SelectItem value="CASH">Cash</SelectItem><SelectItem value="MOBILE_MONEY">Mobile money</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select></label>
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Notes<Input placeholder="Optional internal note" value={form.notes} onChange={(e) => field("notes", e.target.value)} /></label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving && <LoaderCircle className="animate-spin" />}{sale ? "Save changes" : "Record sale"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>;
}
