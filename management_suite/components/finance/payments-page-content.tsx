"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paymentsApi, type Payment } from "@/lib/api";

export function PaymentsPageContent() {
  const business = useBusinessSettings();
  const [mobileNav, setMobileNav] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [direction, setDirection] = useState<"ALL" | Payment["direction"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentsApi.list(direction === "ALL" ? undefined : direction).then(setPayments).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load payments")).finally(() => setLoading(false));
  }, [direction]);

  function changeDirection(value: string) {
    setLoading(true);
    setError("");
    setDirection(value as typeof direction);
  }

  const totals = useMemo(() => ({ incoming: payments.filter((item) => item.direction === "IN").reduce((sum, item) => sum + item.amount, 0), outgoing: payments.filter((item) => item.direction === "OUT").reduce((sum, item) => sum + item.amount, 0) }), [payments]);

  return <AppShell title="Payments" subtitle="A permanent history of money received and paid out." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav} actions={<Select value={direction} onValueChange={changeDirection}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">All payments</SelectItem><SelectItem value="IN">Money received</SelectItem><SelectItem value="OUT">Money paid out</SelectItem></SelectContent></Select>}>
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ArrowDownLeft/></span><div><p className="text-xs text-muted-foreground">Money received</p><p className="font-display text-2xl font-bold">{business.formatMoney(totals.incoming)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><ArrowUpRight/></span><div><p className="text-xs text-muted-foreground">Money paid out</p><p className="font-display text-2xl font-bold">{business.formatMoney(totals.outgoing)}</p></div></CardContent></Card></section>
      <Card><CardHeader><CardTitle>Payment ledger</CardTitle><CardDescription>Each row is an individual payment event; later payments do not replace earlier ones.</CardDescription></CardHeader>{loading ? <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading payments…</CardContent> : error ? <CardContent className="py-16 text-center text-sm text-red-600">{error}</CardContent> : payments.length === 0 ? <CardContent className="grid place-items-center py-16 text-center"><WalletCards className="mb-3 text-muted-foreground"/><p className="font-semibold">No payments recorded</p><p className="text-sm text-muted-foreground">Payments from sales, invoices, and purchases will appear here.</p></CardContent> : <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Direction</TableHead><TableHead>Related record</TableHead><TableHead className="hidden md:table-cell">Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => { const related = payment.invoice?.reference ?? payment.sale?.reference ?? payment.purchase?.reference ?? payment.reference ?? "General payment"; return <TableRow key={payment.id}><TableCell>{new Date(payment.paidAt).toLocaleDateString()}</TableCell><TableCell><Badge className={payment.direction === "IN" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{payment.direction === "IN" ? "Received" : "Paid out"}</Badge></TableCell><TableCell><p className="font-medium">{related}</p><p className="text-xs text-muted-foreground">{payment.customer?.name ?? payment.supplier?.name ?? payment.notes ?? "—"}</p></TableCell><TableCell className="hidden md:table-cell">{payment.method.replaceAll("_", " ")}</TableCell><TableCell className="text-right font-bold">{business.formatMoney(payment.amount)}</TableCell></TableRow>; })}</TableBody></Table>}</Card>
    </div>
  </AppShell>;
}
