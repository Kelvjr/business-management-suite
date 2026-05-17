"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSale, type Sale } from "@/lib/api";
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

type EditSaleSheetProps = {
  sale: Sale;
  trigger?: ReactNode;
};

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function EditSaleSheet({ sale, trigger }: EditSaleSheetProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState<"product" | "service">(
    sale.itemType,
  );
  const [itemName, setItemName] = useState(sale.itemName);
  const [category, setCategory] = useState(sale.category || "");
  const [subcategory, setSubcategory] = useState(sale.subcategory || "");
  const [quantity, setQuantity] = useState(String(sale.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState(
    String(
      sale.unitPrice ?? Number(sale.totalAmount) / Number(sale.quantity ?? 1),
    ),
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "partial" | "unpaid"
  >(sale.paymentStatus);
  const [salesChannel, setSalesChannel] = useState<
    "walk-in" | "whatsapp" | "instagram" | "phone" | "website"
  >(
    (sale.salesChannel as
      | "walk-in"
      | "whatsapp"
      | "instagram"
      | "phone"
      | "website") || "walk-in",
  );
  const [customerName, setCustomerName] = useState(sale.customerName || "");
  const [notes, setNotes] = useState(sale.notes || "");
  const [soldAt, setSoldAt] = useState(toDatetimeLocal(sale.soldAt));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = useMemo(() => {
    const qty = Number(quantity || 0);
    const price = Number(unitPrice || 0);
    return qty * price;
  }, [quantity, unitPrice]);

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

      const normalizedSoldAt = soldAt
        ? new Date(soldAt).toISOString()
        : undefined;

      await updateSale(sale.id, {
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
        soldAt: normalizedSoldAt,
      });

      toast.success("Sale updated successfully.");
      setOpen(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? <button className="w-full text-left text-sm">Edit</button>}
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Sale</SheetTitle>
          <SheetDescription>Update this sales record.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
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
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Amount</label>
            <Input value={String(totalAmount || 0)} readOnly />
          </div>

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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
