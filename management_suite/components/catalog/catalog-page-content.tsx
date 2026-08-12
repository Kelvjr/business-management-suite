"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ImagePlus,
  LoaderCircle,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFileUrl, storageApi, suiteApi } from "@/lib/api";
import type { CatalogItem } from "@/lib/suite";

type FormState = Omit<CatalogItem, "id" | "active" | "images" | "_count">;
const blank = (kind: CatalogItem["kind"]): FormState => ({
  kind,
  name: "",
  sku: "",
  category: "",
  costPrice: 0,
  sellingPrice: 0,
  quantity: 0,
  reorderLevel: 0,
  barcode: "",
  durationMinutes: null,
  assignedStaff: "",
});

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1.5 text-sm font-medium ${className}`}>
      {label}
      {children}
    </label>
  );
}

export function CatalogPageContent() {
  const business = useBusinessSettings();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [rows, setRows] = useState<CatalogItem[]>([]);
  const [kind, setKind] = useState<CatalogItem["kind"]>("PRODUCT");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<FormState>(blank("PRODUCT"));
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setRows(await suiteApi.catalog());
    } catch {
      setError("The catalog could not be loaded.");
    }
  }
  useEffect(() => {
    void suiteApi.catalog().then(setRows).catch(() => setError("The catalog could not be loaded."));
  }, []);

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.kind === kind &&
          `${row.name} ${row.category} ${row.sku ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, kind, query],
  );
  const stockValue = rows
    .filter((row) => row.kind === "PRODUCT")
    .reduce((sum, row) => sum + row.costPrice * row.quantity, 0);

  function launch(item?: CatalogItem) {
    const selectedKind = item?.kind ?? kind;
    setEditing(item ?? null);
    setForm(
      item
        ? {
            kind: item.kind,
            name: item.name,
            sku: item.sku ?? "",
            category: item.category,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            quantity: item.quantity,
            reorderLevel: item.reorderLevel,
            barcode: item.barcode ?? "",
            imageUrl: null,
            durationMinutes: item.durationMinutes ?? null,
            assignedStaff: item.assignedStaff ?? "",
          }
        : blank(selectedKind),
    );
    setPendingImages([]);
    setError("");
    setOpen(true);
  }

  function chooseImages(files: FileList | null) {
    if (!files) return;
    const selected = [...files];
    const invalid = selected.find(
      (file) =>
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );
    if (invalid)
      return setError(
        "Product images must be JPG, PNG, or WebP files no larger than 5 MB.",
      );
    if (
      (editing?.images.length ?? 0) + pendingImages.length + selected.length >
      8
    )
      return setError("A product can have up to 8 images.");
    setPendingImages((current) => [...current, ...selected]);
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        sku: form.sku || null,
        barcode: form.barcode || null,
        assignedStaff: form.assignedStaff || null,
        imageUrl: undefined,
      };
      const item = editing
        ? await suiteApi.updateCatalog(editing.id, payload)
        : await suiteApi.createCatalog(payload);
      for (let index = 0; index < pendingImages.length; index += 1)
        await storageApi.uploadProductImage(item.id, pendingImages[index], {
          isPrimary: !editing?.images.length && index === 0,
        });
      await load();
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The item could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function replacePrimary(file?: File) {
    if (!file || !editing) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return setError("Use a JPG, PNG, or WebP image no larger than 5 MB.");
    setSaving(true);
    setError("");
    try {
      await storageApi.uploadProductImage(editing.id, file, {
        replacePrimary: true,
      });
      await load();
      const refreshed = (await suiteApi.catalog()).find(
        (row) => row.id === editing.id,
      );
      if (refreshed) setEditing(refreshed);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The image could not be replaced.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(imageId: string) {
    if (
      !editing ||
      !window.confirm("Remove this product image? This cannot be undone.")
    )
      return;
    setSaving(true);
    setError("");
    try {
      await storageApi.removeProductImage(editing.id, imageId);
      const latest = await suiteApi.catalog();
      setRows(latest);
      setEditing(latest.find((row) => row.id === editing.id) ?? null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The image could not be removed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    if (!deleting) return;
    try {
      await suiteApi.removeCatalog(deleting.id);
      await load();
      setDeleting(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The item could not be deleted.",
      );
      setDeleting(null);
    }
  }

  return (
    <AppShell
      title="Products & services"
      subtitle="Reusable items that power sales, inventory, purchasing, and reporting."
      mobileNavOpen={mobileNavOpen}
      onMobileNavChange={setMobileNavOpen}
      actions={
        <Button onClick={() => launch()}>
          <Plus />
          Add {kind === "PRODUCT" ? "product" : "service"}
        </Button>
      }
    >
      <div className="space-y-5">
        {error && !open && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Products",
              value: rows.filter((row) => row.kind === "PRODUCT").length,
            },
            {
              label: "Services",
              value: rows.filter((row) => row.kind === "SERVICE").length,
            },
            { label: "Stock value", value: business.formatMoney(stockValue) },
          ].map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {metric.value}
              </CardContent>
            </Card>
          ))}
        </section>
        <Card>
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={kind}
              onValueChange={(value) => setKind(value as CatalogItem["kind"])}
            >
              <TabsList>
                <TabsTrigger value="PRODUCT">Products</TabsTrigger>
                <TabsTrigger value="SERVICE">Services</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              className="sm:max-w-xs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or services…"
            />
          </div>
          <div className="divide-y">
            {visible.map((item) => {
              const primary =
                item.images?.find((image) => image.isPrimary) ??
                item.images?.[0];
              return (
                <div
                  key={item.id}
                  className="flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/40"
                  onClick={() => launch(item)}
                >
                  {primary ? (
                    <Image
                      unoptimized
                      width={56}
                      height={56}
                      src={apiFileUrl(primary.url)}
                      alt=""
                      className="size-14 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted">
                      <Package className="size-5 text-muted-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} ·{" "}
                      {item.sku ||
                        item.barcode ||
                        (item.kind === "SERVICE"
                          ? `${item.durationMinutes ?? "—"} min`
                          : "No SKU")}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="font-semibold">
                      {business.formatMoney(item.sellingPrice)}
                    </p>
                    {item.kind === "PRODUCT" && (
                      <Badge
                        className={
                          item.quantity <= item.reorderLevel
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }
                      >
                        {item.quantity} in stock
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => launch(item)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onSelect={() => setDeleting(item)}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {!visible.length && (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No matching items.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : `Add ${kind.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Changes appear everywhere this item is used.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Category">
                <Input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Selling price">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.sellingPrice || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sellingPrice: Number(event.target.value),
                    }))
                  }
                />
              </Field>
              {form.kind === "PRODUCT" ? (
                <>
                  <Field label="Cost price">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costPrice || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          costPrice: Number(event.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="SKU">
                    <Input
                      value={form.sku ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sku: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Barcode">
                    <Input
                      value={form.barcode ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          barcode: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Quantity">
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={form.quantity || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: Number(event.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Reorder level">
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={form.reorderLevel || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          reorderLevel: Number(event.target.value),
                        }))
                      }
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Duration (minutes)">
                    <Input
                      type="number"
                      min="1"
                      value={form.durationMinutes ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          durationMinutes: Number(event.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Assigned staff">
                    <Input
                      value={form.assignedStaff ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          assignedStaff: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </>
              )}
            </div>
            {form.kind === "PRODUCT" && (
              <section className="space-y-3 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-semibold">Product images</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or WebP. Up to 5 MB each and 8 images total.
                  </p>
                </div>
                {editing?.images?.length ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {editing.images.map((image) => (
                      <div key={image.id} className="group relative">
                        <Image
                          unoptimized
                          width={160}
                          height={160}
                          src={apiFileUrl(image.url)}
                          alt={image.name}
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                        {image.isPrimary && (
                          <Badge className="absolute left-1 top-1 bg-white text-slate-800">
                            Primary
                          </Badge>
                        )}
                        <button
                          type="button"
                          aria-label={`Remove ${image.name}`}
                          className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 opacity-0 shadow group-hover:opacity-100"
                          onClick={() => void removeImage(image.id)}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
                    <ImagePlus className="size-4" />
                    Add images
                    <input
                      className="sr-only"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => chooseImages(event.target.files)}
                    />
                  </label>
                  {editing?.images?.some((image) => image.isPrimary) && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
                      <Pencil className="size-4" />
                      Replace primary
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                          void replacePrimary(event.target.files?.[0])
                        }
                      />
                    </label>
                  )}
                </div>
                {pendingImages.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs"
                  >
                    <span>
                      {file.name} · {Math.ceil(file.size / 1024)} KB
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setPendingImages((current) =>
                          current.filter((item) => item !== file),
                        )
                      }
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </section>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  saving || !form.name || !form.category || !form.sellingPrice
                }
              >
                {saving ? <LoaderCircle className="animate-spin" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove its images first. Items with sales, purchases, or stock
              history are kept for accurate records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void removeItem()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
