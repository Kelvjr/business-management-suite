"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, FileBarChart, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenses } from "@/hooks/use-expenses";
import { useSales } from "@/hooks/use-sales";
import { suiteApi } from "@/lib/api";

function Summary({ label, value, icon: Icon }: { label: string; value: string; icon: typeof TrendingUp }) {
  return <Card><CardContent className="flex items-center gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-muted"><Icon className="size-4 text-[#168e64]"/></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-2xl font-bold">{value}</p></div></CardContent></Card>;
}

export function ReportsPageContent() {
  const business = useBusinessSettings();
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const [mobileNav, setMobileNav] = useState(false);
  const [catalogCount, setCatalogCount] = useState(0);
  useEffect(() => { suiteApi.catalog().then((items) => setCatalogCount(items.length)).catch(() => setCatalogCount(0)); }, []);
  const revenue = sales.reduce((sum, row) => sum + row.amount, 0);
  const spending = expenses.reduce((sum, row) => sum + row.amount, 0);
  const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setMonth(date.getMonth() - (5 - index)); const key = `${date.getFullYear()}-${date.getMonth()}`; return { month: date.toLocaleDateString("en-GH", { month: "short" }), sales: sales.filter((row) => { const value = new Date(row.soldAt); return `${value.getFullYear()}-${value.getMonth()}` === key; }).reduce((sum, row) => sum + row.amount, 0), expenses: expenses.filter((row) => { const value = new Date(row.incurredAt); return `${value.getFullYear()}-${value.getMonth()}` === key; }).reduce((sum, row) => sum + row.amount, 0) }; });

  return <AppShell title="Reports" subtitle="One place for the numbers behind every business decision." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav} actions={<Button variant="outline" disabled><ArrowDownToLine/>Export coming soon</Button>}><div className="space-y-5"><section className="grid gap-3 sm:grid-cols-3"><Summary label="Revenue" value={business.formatMoney(revenue)} icon={TrendingUp}/><Summary label="Expenses" value={business.formatMoney(spending)} icon={ArrowDownToLine}/><Summary label="Gross profit" value={business.formatMoney(revenue - spending)} icon={FileBarChart}/></section><Card><CardHeader><CardTitle>Business performance</CardTitle><CardDescription>Revenue and expenses over six months, calculated from the same records as the dashboard.</CardDescription></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer><BarChart data={months}><CartesianGrid vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={business.formatCompactMoney}/><Tooltip formatter={(value) => business.formatMoney(Number(value))}/><Legend/><Bar dataKey="sales" fill="#24b47e" radius={[5,5,0,0]}/><Bar dataKey="expenses" fill="#d7654c" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div><p className="mt-4 text-xs text-muted-foreground">Catalog coverage: {catalogCount} products and services.</p></CardContent></Card></div></AppShell>;
}
