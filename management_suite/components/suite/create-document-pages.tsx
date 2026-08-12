"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, FileText, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { suiteApi } from "@/lib/api";
import type { CatalogItem, CustomerInsight, Supplier } from "@/lib/suite";

function Shell({ title, subtitle, back, children }: { title: string; subtitle: string; back: string; children: ReactNode }) {
  const router = useRouter();
  const [nav, setNav] = useState(false);
  return <AppShell title={title} subtitle={subtitle} mobileNavOpen={nav} onMobileNavChange={setNav} actions={<Button variant="outline" onClick={() => router.push(back)}><ArrowLeft/>Back</Button>}>{children}</AppShell>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}{children}</label>;
}

export function CreatePurchasePage() {
  const router = useRouter();
  const business = useBusinessSettings();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [supplierId, setSupplier] = useState("");
  const [itemId, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setCost] = useState(0);
  const [status, setStatus] = useState("ORDERED");
  const [paid, setPaid] = useState(0);
  const [dueAt, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { Promise.all([suiteApi.suppliers(), suiteApi.catalog()]).then(([nextSuppliers, catalog]) => { setSuppliers(nextSuppliers); setItems(catalog.filter((item) => item.kind === "PRODUCT")); }); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await suiteApi.createPurchase({ supplierId, catalogItemId: itemId, quantity, unitCost, status, amountPaid: paid, dueAt: dueAt ? new Date(dueAt).toISOString() : null, notes });
      router.push("/purchases");
    } finally { setSaving(false); }
  }

  return <Shell title="New purchase order" subtitle="Buying inventory updates stock when it is received." back="/purchases"><form onSubmit={submit} className="mx-auto max-w-4xl"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="size-5 text-[#168e64]"/>Purchase details</CardTitle><CardDescription>Start with one item; multi-line purchase orders come next.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Field label="Supplier"><Select value={supplierId} onValueChange={setSupplier}><SelectTrigger><SelectValue placeholder="Choose supplier"/></SelectTrigger><SelectContent>{suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Product"><Select value={itemId} onValueChange={(id) => { setItem(id); setCost(items.find((item) => item.id === id)?.costPrice ?? 0); }}><SelectTrigger><SelectValue placeholder="Choose product"/></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Quantity"><Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/></Field><Field label={`Unit cost (${business.settings.currency})`}><Input type="number" min="0.01" step="0.01" value={unitCost || ""} onChange={(event) => setCost(Number(event.target.value))}/></Field><Field label="Status"><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="ORDERED">Ordered</SelectItem><SelectItem value="RECEIVED">Received — add to stock</SelectItem></SelectContent></Select></Field><Field label="Amount paid"><Input type="number" min="0" max={quantity * unitCost} step="0.01" value={paid || ""} onChange={(event) => setPaid(Number(event.target.value))}/></Field><Field label="Due date"><Input type="date" value={dueAt} onChange={(event) => setDue(event.target.value)}/></Field><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Notes<Textarea value={notes} onChange={(event) => setNotes(event.target.value)}/></label><div className="rounded-xl bg-muted/60 p-4 sm:col-span-2"><div className="flex justify-between"><span className="text-sm text-muted-foreground">Order total</span><strong className="font-display text-xl">{business.formatMoney(quantity * unitCost)}</strong></div></div><Button className="sm:col-span-2" disabled={saving || !supplierId || !itemId || !unitCost || paid > quantity * unitCost}><Save/>{saving ? "Saving…" : "Create purchase order"}</Button></CardContent></Card></form></Shell>;
}

export function CreateInvoicePage() {
  const router = useRouter();
  const business = useBusinessSettings();
  const [customers, setCustomers] = useState<CustomerInsight[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState(0);
  const [tax, setTax] = useState(0);
  const [dueAt, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { suiteApi.customerInsights().then(setCustomers); }, []);
  const customer = customers.find((item) => item.id === customerId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!customer) return;
    setSaving(true);
    try {
      await suiteApi.createInvoice({ customerId: customer.id, customerName: customer.name, description, quantity, rate, taxRate: tax, dueAt: new Date(dueAt).toISOString(), notes });
      router.push("/invoices");
    } finally { setSaving(false); }
  }

  const subtotal = quantity * rate;
  const total = subtotal + subtotal * tax / 100;
  return <Shell title="Generate invoice" subtitle="Bill now and track payment until the balance reaches zero." back="/invoices"><form onSubmit={submit} className="mx-auto max-w-4xl"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-[#168e64]"/>Invoice details</CardTitle><CardDescription>Create a clear invoice with a due date and tax.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Field label="Customer"><Select value={customerId} onValueChange={setCustomerId}><SelectTrigger><SelectValue placeholder="Choose customer"/></SelectTrigger><SelectContent>{customers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Due date"><Input type="date" value={dueAt} onChange={(event) => setDue(event.target.value)}/></Field><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Description<Input value={description} onChange={(event) => setDescription(event.target.value)}/></label><Field label="Quantity"><Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/></Field><Field label={`Rate (${business.settings.currency})`}><Input type="number" min="0.01" step="0.01" value={rate || ""} onChange={(event) => setRate(Number(event.target.value))}/></Field><Field label="Tax rate (%)"><Input type="number" min="0" max="100" value={tax || ""} onChange={(event) => setTax(Number(event.target.value))}/></Field><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Notes<Textarea value={notes} onChange={(event) => setNotes(event.target.value)}/></label><div className="rounded-xl bg-muted/60 p-4 sm:col-span-2"><div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{business.formatMoney(subtotal)}</span></div><div className="mt-2 flex justify-between font-display text-xl font-bold"><span>Total</span><span>{business.formatMoney(total)}</span></div></div><Button className="sm:col-span-2" disabled={saving || !customer || !description || !dueAt || !rate}><Save/>{saving ? "Saving…" : "Generate invoice"}</Button></CardContent></Card></form></Shell>;
}
