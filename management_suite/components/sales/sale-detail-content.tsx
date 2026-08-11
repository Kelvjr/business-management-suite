"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CalendarDays, CreditCard, Edit3, FileDown, FileText, Paperclip, ReceiptText, Share2, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { SaleFormDialog } from "@/components/sales/sale-form-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSales } from "@/hooks/use-sales";
import { downloadReceipt, type ReceiptDraft } from "@/lib/exporters";
import { paymentLabels, paymentStatusLabels, pricingMethodLabels, saleTypeLabels, type SaleInput } from "@/lib/sales";

export function SaleDetailContent() {
  const business = useBusinessSettings();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { sales, loading, demoMode, updateSale, removeSale } = useSales();
  const sale = sales.find((item) => item.id === params.id);
  const [mobileNav, setMobileNav] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState("");

  async function save(input: SaleInput) {
    if (!sale) return;
    await updateSale(sale.id, input);
    setNotice("Sale updated"); window.setTimeout(() => setNotice(""), 2400);
  }

  async function remove() { if (sale) { await removeSale(sale.id); router.push("/sales"); } }

  function receipt(): ReceiptDraft | null {
    if (!sale) return null;
    return { reference: sale.reference, customerName: sale.customerName, soldAt: sale.soldAt, items: sale.items?.length ? sale.items : [{ name: sale.description, lineTotal: sale.amount }], subtotal: sale.subtotal ?? sale.amount, discountAmount: sale.discountAmount ?? 0, taxAmount: sale.taxAmount ?? 0, total: sale.amount, amountPaid: sale.amountPaid ?? sale.amount, balanceDue: sale.balanceDue ?? 0, paymentMethod: paymentLabels[sale.paymentMethod] };
  }

  async function share() {
    if (!sale) return;
    const text = `${business.settings.businessName}\nReceipt ${sale.reference}\n${sale.description}\nTotal: ${business.formatMoneyPrecise(sale.amount)}\nPaid: ${business.formatMoneyPrecise(sale.amountPaid ?? sale.amount)}\nBalance: ${business.formatMoneyPrecise(sale.balanceDue ?? 0)}`;
    if (navigator.share) await navigator.share({ title: `Receipt ${sale.reference}`, text }); else { await navigator.clipboard.writeText(text); setNotice("Receipt copied"); }
  }

  const actions = sale ? <><Button variant="outline" className="hidden md:inline-flex" onClick={() => { const draft = receipt(); if (draft) void downloadReceipt(draft, business.settings.businessName, business.settings.currency); }}><FileDown />Receipt</Button><Button variant="outline" onClick={() => setEditOpen(true)}><Edit3 /><span className="hidden sm:inline">Edit sale</span><span className="sm:hidden">Edit</span></Button><Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteOpen(true)} aria-label="Delete sale"><Trash2 /></Button></> : undefined;

  return <AppShell title={sale?.reference ?? "Sale details"} subtitle="Review the complete sale record." actions={actions} mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav}>
    {loading ? <div className="grid place-items-center py-32"><div className="size-8 animate-spin rounded-full border-2 border-muted border-t-[#24b47e]" /></div> : !sale ? <Card><CardContent className="grid place-items-center py-24 text-center"><span className="mb-4 grid size-12 place-items-center rounded-full bg-muted"><ReceiptText className="size-5 text-muted-foreground" /></span><h2 className="font-display text-lg font-semibold">Sale not found</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">It may have been deleted, or the link may no longer be valid.</p><Button asChild className="mt-5"><Link href="/sales"><ArrowLeft />Back to sales</Link></Button></CardContent></Card> : <div className="space-y-5">
      <div className="flex items-center justify-between"><Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/sales"><ArrowLeft />Back to sales</Link></Button>{demoMode && <Badge className="border-amber-200 bg-amber-50 text-amber-700">Demo record</Badge>}</div>
      <section className="overflow-hidden rounded-2xl bg-[#172a45] p-6 text-white shadow-[0_16px_42px_rgba(21,39,65,.13)] sm:p-7"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-3 flex items-center gap-2"><Badge className="border-white/10 bg-white/8 text-slate-200">{sale.category}</Badge><Badge className="border-white/10 bg-white/8 text-slate-200">{paymentStatusLabels[sale.paymentStatus ?? "PAID"]}</Badge></div><p className="text-xs font-medium uppercase tracking-[.14em] text-slate-400">Sale amount</p><p className="mt-2 font-display text-4xl font-bold tracking-[-.04em] sm:text-5xl">{business.formatMoney(sale.amount)}</p></div><div className="sm:text-right"><p className="text-sm font-semibold text-white">{sale.description}</p><p className="mt-1 text-xs text-slate-400">{new Date(sale.soldAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div></div></section>

      <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Items and services</CardTitle><p className="mt-1 text-xs text-muted-foreground">{sale.items?.length ?? 1} structured {(sale.items?.length ?? 1) === 1 ? "line" : "lines"}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void share()}><Share2 />Share</Button><Button variant="outline" size="sm" onClick={() => { const draft = receipt(); if (draft) void downloadReceipt(draft, business.settings.businessName, business.settings.currency); }}><FileDown />Download</Button></div></CardHeader><CardContent className="space-y-3">{(sale.items?.length ? sale.items : [{ id: "legacy", name: sale.description, type: sale.type ?? "CUSTOM", pricingMethod: sale.pricingMethod ?? "FIXED", measurement: null, unit: null, rate: sale.amount, lineTotal: sale.amount, manualTotalOverride: false }]).map((item) => <div key={item.id} className="grid items-center gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto]"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{saleTypeLabels[item.type]} · {pricingMethodLabels[item.pricingMethod]}{item.measurement ? ` · ${item.measurement} ${item.unit ?? ""}` : ""}</p></div><div className="text-xs text-muted-foreground">{item.measurement ? `${item.measurement} × ${business.formatMoneyPrecise(item.rate)}` : "Fixed"}</div><p className="text-right font-display font-bold">{business.formatMoneyPrecise(item.lineTotal)}</p></div>)}</CardContent></Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5"><Card><CardHeader><CardTitle>Sale information</CardTitle></CardHeader><CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{[{ label: "Customer", value: sale.customerName ?? "Walk-in customer", icon: UserRound }, { label: "Payment method", value: paymentLabels[sale.paymentMethod], icon: CreditCard }, { label: "Sale date", value: new Date(sale.soldAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }), icon: CalendarDays }, { label: "Sale time", value: new Date(sale.soldAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), icon: Banknote }].map((item) => <div key={item.label} className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><item.icon className="size-4" /></span><div><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p><p className="mt-1 text-sm font-medium">{item.value}</p></div></div>)}{sale.customFields && Object.keys(sale.customFields).length > 0 && <div className="grid gap-4 rounded-xl bg-muted/60 p-4 sm:col-span-2 sm:grid-cols-2">{Object.entries(sale.customFields).map(([label, value]) => <div key={label}><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div>}<div className="sm:col-span-2"><div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><FileText className="size-4" />Notes</div><div className="rounded-xl bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">{sale.notes || "No internal notes were added to this sale."}</div></div></CardContent></Card>{sale.attachments && sale.attachments.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="size-4" />Attachments</CardTitle></CardHeader><CardContent className="space-y-2">{sale.attachments.map((file) => <a key={file.id ?? file.url} href={`${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/api$/, "")}${file.url}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"><span>{file.name}</span><span className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</span></a>)}</CardContent></Card>}</div>

        <div className="space-y-5"><Card><CardHeader><CardTitle>Payment summary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{business.formatMoneyPrecise(sale.subtotal ?? sale.amount)}</span></div><div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{business.formatMoneyPrecise(sale.discountAmount ?? 0)}</span></div><div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{business.formatMoneyPrecise(sale.taxAmount ?? 0)}</span></div><div className="flex justify-between border-t pt-3 font-display font-bold"><span>Total</span><span>{business.formatMoneyPrecise(sale.amount)}</span></div><div className="flex justify-between text-muted-foreground"><span>Amount paid</span><span>{business.formatMoneyPrecise(sale.amountPaid ?? sale.amount)}</span></div><div className="flex justify-between font-semibold text-amber-700"><span>Balance due</span><span>{business.formatMoneyPrecise(sale.balanceDue ?? 0)}</span></div></CardContent></Card><Card><CardHeader><CardTitle>Record activity</CardTitle></CardHeader><CardContent><div className="relative pl-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-border">{(sale.activity?.length ? sale.activity : [{ id: "created", action: "CREATED", summary: "Sale recorded", createdAt: sale.soldAt }]).map((entry, index) => <div key={entry.id} className={index < (sale.activity?.length ?? 1) - 1 ? "relative pb-5" : "relative"}><span className={`absolute -left-5 top-1 size-2.5 rounded-full border-2 border-white ${index === 0 ? "bg-[#24b47e]" : "bg-slate-300"}`} /><p className="text-sm font-medium">{entry.summary}</p><p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p></div>)}</div></CardContent></Card></div>
      </div>
    </div>}
    {sale && <SaleFormDialog open={editOpen} onOpenChange={setEditOpen} sale={sale} onSave={save} />}
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this sale?</AlertDialogTitle><AlertDialogDescription>This removes {sale?.reference} and {sale ? business.formatMoney(sale.amount) : "its amount"} from every revenue total. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="destructive" onClick={() => void remove()}>Delete sale</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {notice && <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-[#13233a] px-4 py-3 text-sm font-medium text-white shadow-2xl"><span className="size-2 rounded-full bg-[#42d49a]" />{notice}</div>}
  </AppShell>;
}
