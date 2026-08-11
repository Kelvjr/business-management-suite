"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronRight, CircleDollarSign, FileCheck2, Plus, Trash2, Truck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { suiteApi } from "@/lib/api";
import type { Invoice, Purchase } from "@/lib/suite";

const colors=["#36bd87","#d3a659","#2b4468"];

function Shell({title,subtitle,action,children}:{title:string;subtitle:string;action:ReactNode;children:ReactNode}){
  const[nav,setNav]=useState(false);
  return <AppShell title={title} subtitle={subtitle} actions={action} mobileNavOpen={nav} onMobileNavChange={setNav}>{children}</AppShell>;
}

function Kpi({label,value,meta,tone="green"}:{label:string;value:string;meta:string;tone?:"green"|"gold"|"navy"}){
  const gradient=tone==="gold"?"from-[#e0bd79] to-[#b48538]":tone==="navy"?"from-[#526f94] to-[#243d5f]":"from-[#54daa5] to-[#168c64]";
  return <Card className="overflow-hidden"><CardContent className="relative p-5"><div className={`absolute -right-4 -top-5 size-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl`}/><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold tracking-[-.045em]">{value}</p><div className="mt-3 flex items-center gap-2"><span className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${gradient}`}/><span className="text-[9px] text-muted-foreground">{meta}</span></div></CardContent></Card>;
}

function Confirm({row,onClose,onConfirm,label}:{row:{reference:string}|null;onClose:()=>void;onConfirm:()=>void;label:string}){
  return <AlertDialog open={!!row} onOpenChange={v=>!v&&onClose()}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {row?.reference}?</AlertDialogTitle><AlertDialogDescription>This permanently removes the {label} and its line items.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

export function PurchasesPageContent(){
  const business=useBusinessSettings();
  const[rows,setRows]=useState<Purchase[]>([]);
  const[selected,setSelected]=useState<Purchase|null>(null);
  const[deleting,setDeleting]=useState<Purchase|null>(null);
  const[status,setStatus]=useState("DRAFT");
  const[paid,setPaid]=useState(0);
  const load=()=>suiteApi.purchases().then(setRows);
  useEffect(()=>{void load()},[]);
  const total=rows.reduce((s,r)=>s+r.total,0);
  const outstanding=rows.reduce((s,r)=>s+Math.max(0,r.total-r.amountPaid),0);
  const statusData=useMemo(()=>["RECEIVED","ORDERED","DRAFT"].map(name=>({name,value:rows.filter(r=>r.status===name).length})),[rows]);
  const orders=rows.slice(0,8).reverse().map((r,i)=>({name:`#${i+1}`,total:r.total,paid:r.amountPaid}));
  function launch(r:Purchase){setSelected(r);setStatus(r.status);setPaid(r.amountPaid)}
  async function save(){if(!selected)return;await suiteApi.updatePurchase(selected.id,{status,amountPaid:paid});await load();setSelected(null)}
  async function remove(){if(!deleting)return;await suiteApi.removePurchase(deleting.id);await load();setDeleting(null)}
  return <Shell title="Purchases" subtitle="A visual command center for buying, receiving, and supplier obligations." action={<Button asChild><Link href="/purchases/new"><Plus/>New purchase order</Link></Button>}>
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3"><Kpi label="Purchase volume" value={business.formatMoney(total)} meta={`${rows.length} purchase orders`}/><Kpi label="Supplier exposure" value={business.formatMoney(outstanding)} meta="Balance still payable" tone="gold"/><Kpi label="Received" value={`${rows.filter(r=>r.status==="RECEIVED").length}/${rows.length}`} meta="Orders completed" tone="navy"/></section>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <Card><CardHeader><CardTitle>Procurement flow</CardTitle><CardDescription>Order value and payments across recent purchases</CardDescription></CardHeader><CardContent><div className="h-[240px]"><ResponsiveContainer><BarChart data={orders}><CartesianGrid vertical={false} stroke="#ecece8" strokeDasharray="3 5"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10}} tickFormatter={business.formatCompactMoney}/><Tooltip formatter={v=>business.formatMoney(Number(v))}/><Bar dataKey="total" fill="#334f74" radius={[7,7,0,0]} barSize={18}/><Bar dataKey="paid" fill="#46c997" radius={[7,7,0,0]} barSize={10}/></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Order state</CardTitle><CardDescription>Portfolio completion mix</CardDescription></CardHeader><CardContent><div className="relative h-[155px]"><ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" innerRadius={46} outerRadius={68} paddingAngle={5} cornerRadius={5} stroke="none">{statusData.map((x,i)=><Cell key={x.name} fill={colors[i]}/>)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-items-center"><strong className="font-display text-xl">{rows.length}</strong></div></div>{statusData.map((x,i)=><div key={x.name} className="mt-2 flex items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{background:colors[i]}}/><span className="flex-1 text-muted-foreground">{x.name.toLowerCase()}</span><strong>{x.value}</strong></div>)}</CardContent></Card>
      </section>
      <Card><div className="flex items-center justify-between border-b p-5"><div><CardTitle>Purchase ledger</CardTitle><CardDescription>Click any order to manage status and payment</CardDescription></div><Truck className="size-5 text-[#c89e51]"/></div><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Received</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="w-10"/></TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.id} className="cursor-pointer" onClick={()=>launch(r)}><TableCell className="font-mono text-xs font-semibold">{r.reference}</TableCell><TableCell>{r.supplier.name}</TableCell><TableCell><Badge>{r.status}</Badge></TableCell><TableCell className="hidden md:table-cell">{r.items.reduce((s,i)=>s+i.receivedQty,0)} / {r.items.reduce((s,i)=>s+i.quantity,0)}</TableCell><TableCell className="text-right font-semibold">{business.formatMoney(r.total)}</TableCell><TableCell className="text-right text-amber-700">{business.formatMoney(r.total-r.amountPaid)}</TableCell><TableCell><ChevronRight className="size-4 text-muted-foreground"/></TableCell></TableRow>)}</TableBody></Table></Card>
    </div>
    <Dialog open={!!selected} onOpenChange={v=>!v&&setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{selected?.reference}</DialogTitle><DialogDescription>{selected?.supplier.name} · {selected?.items.map(i=>`${i.catalogItem.name} × ${i.quantity}`).join(", ")}</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Status<Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="ORDERED">Ordered</SelectItem><SelectItem value="RECEIVED">Received — add stock</SelectItem></SelectContent></Select></label><label className="space-y-1.5 text-sm font-medium">Amount paid<Input type="number" min="0" max={selected?.total} step=".01" value={paid||""} onChange={e=>setPaid(+e.target.value)}/></label></div><DialogFooter className="justify-between"><Button variant="destructive" onClick={()=>{setDeleting(selected);setSelected(null)}}><Trash2/>Delete</Button><Button onClick={()=>void save()}>Save changes</Button></DialogFooter></DialogContent></Dialog>
    <Confirm row={deleting} onClose={()=>setDeleting(null)} onConfirm={()=>void remove()} label="purchase order"/>
  </Shell>;
}

export function InvoicesPageContent(){
  const business=useBusinessSettings();
  const[rows,setRows]=useState<Invoice[]>([]);
  const[selected,setSelected]=useState<Invoice|null>(null);
  const[deleting,setDeleting]=useState<Invoice|null>(null);
  const[status,setStatus]=useState<Invoice["status"]>("UNPAID");
  const[paid,setPaid]=useState(0);
  const load=()=>suiteApi.invoices().then(setRows);
  useEffect(()=>{void load()},[]);
  const invoiced=rows.reduce((s,r)=>s+r.total,0);
  const collected=rows.reduce((s,r)=>s+r.amountPaid,0);
  const outstanding=invoiced-collected;
  const collectionRate=invoiced?collected/invoiced*100:0;
  const aging=useMemo(()=>[{name:"Paid",value:collected},{name:"Current",value:rows.filter(r=>new Date(r.dueAt)>=new Date()).reduce((s,r)=>s+r.total-r.amountPaid,0)},{name:"Overdue",value:rows.filter(r=>new Date(r.dueAt)<new Date()).reduce((s,r)=>s+r.total-r.amountPaid,0)}],[rows,collected]);
  function launch(r:Invoice){setSelected(r);setStatus(r.status);setPaid(r.amountPaid)}
  async function save(){if(!selected)return;await suiteApi.updateInvoice(selected.id,{status,amountPaid:paid});await load();setSelected(null)}
  async function remove(){if(!deleting)return;await suiteApi.removeInvoice(deleting.id);await load();setDeleting(null)}
  return <Shell title="Invoices" subtitle="Beautiful visibility into billing, collections, and cash still on the way." action={<Button asChild><Link href="/invoices/new"><Plus/>New invoice</Link></Button>}>
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3"><Kpi label="Total invoiced" value={business.formatMoney(invoiced)} meta={`${rows.length} issued documents`}/><Kpi label="Collected" value={business.formatMoney(collected)} meta={`${collectionRate.toFixed(0)}% collection progress`} tone="navy"/><Kpi label="Outstanding" value={business.formatMoney(outstanding)} meta="Cash still receivable" tone="gold"/></section>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
        <Card><CardHeader><CardTitle>Collection landscape</CardTitle><CardDescription>Paid, current, and overdue invoice value</CardDescription></CardHeader><CardContent><div className="h-[220px]"><ResponsiveContainer><BarChart data={aging} layout="vertical"><CartesianGrid horizontal={false} stroke="#ecece8"/><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={business.formatCompactMoney}/><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={58} tick={{fontSize:10}}/><Tooltip formatter={v=>business.formatMoney(Number(v))}/><Bar dataKey="value" radius={[0,9,9,0]} barSize={22}>{aging.map((x,i)=><Cell key={x.name} fill={colors[i]}/>)}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="overflow-hidden bg-[linear-gradient(145deg,#10233a,#1d3959)] text-white ring-white/5"><CardContent className="relative p-6"><div className="premium-grid absolute inset-0 opacity-40"/><div className="relative"><span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[.06]"><CircleDollarSign className="size-5 text-[#5ee1ad]"/></span><p className="mt-8 text-[10px] uppercase tracking-[.18em] text-slate-400">Collection rate</p><p className="mt-2 font-display text-4xl font-bold">{collectionRate.toFixed(1)}%</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#32b982] to-[#68e3b3]" style={{width:`${Math.min(100,collectionRate)}%`}}/></div><p className="mt-3 text-xs text-slate-400">{business.formatMoney(collected)} of {business.formatMoney(invoiced)} secured</p></div></CardContent></Card>
      </section>
      <Card><div className="flex items-center justify-between border-b p-5"><div><CardTitle>Invoice ledger</CardTitle><CardDescription>Click an invoice to record or revise payment</CardDescription></div><FileCheck2 className="size-5 text-[#2ab17d]"/></div><Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Due</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="w-10"/></TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.id} className="cursor-pointer" onClick={()=>launch(r)}><TableCell className="font-mono text-xs font-semibold">{r.reference}</TableCell><TableCell>{r.customerName}</TableCell><TableCell><Badge>{r.status.replaceAll("_"," ")}</Badge></TableCell><TableCell className="hidden md:table-cell">{new Date(r.dueAt).toLocaleDateString()}</TableCell><TableCell className="text-right font-semibold">{business.formatMoney(r.total)}</TableCell><TableCell className="text-right">{business.formatMoney(r.total-r.amountPaid)}</TableCell><TableCell><ChevronRight className="size-4 text-muted-foreground"/></TableCell></TableRow>)}</TableBody></Table></Card>
    </div>
    <Dialog open={!!selected} onOpenChange={v=>!v&&setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{selected?.reference}</DialogTitle><DialogDescription>{selected?.customerName} · Due {selected&&new Date(selected.dueAt).toLocaleDateString()}</DialogDescription></DialogHeader><div className="rounded-2xl bg-muted p-4">{selected?.items.map(i=><div key={i.description} className="flex justify-between text-sm"><span>{i.description} × {i.quantity}</span><strong>{business.formatMoney(i.total)}</strong></div>)}</div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Status<Select value={status} onValueChange={v=>setStatus(v as Invoice["status"])}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="UNPAID">Unpaid</SelectItem><SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem><SelectItem value="PAID">Paid</SelectItem></SelectContent></Select></label>{status==="PARTIALLY_PAID"&&<label className="space-y-1.5 text-sm font-medium">Amount paid<Input type="number" min="0" max={selected?.total} step=".01" value={paid||""} onChange={e=>setPaid(+e.target.value)}/></label>}</div><DialogFooter className="justify-between"><Button variant="destructive" onClick={()=>{setDeleting(selected);setSelected(null)}}><Trash2/>Delete</Button><Button onClick={()=>void save()}>Save payment</Button></DialogFooter></DialogContent></Dialog>
    <Confirm row={deleting} onClose={()=>setDeleting(null)} onConfirm={()=>void remove()} label="invoice"/>
  </Shell>;
}
