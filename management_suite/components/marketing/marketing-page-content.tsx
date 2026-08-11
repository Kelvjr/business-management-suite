"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BellRing,
  Bot,
  CalendarClock,
  CheckCircle2,
  Gift,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Campaign = { name: string; audience: string; channel: string; sent: number; status: "Draft" | "Scheduled" | "Sent" };
const initialCampaigns: Campaign[] = [
  { name: "August comeback offer", audience: "Inactive for 60 days", channel: "WhatsApp", sent: 128, status: "Sent" },
  { name: "New catering package", audience: "Catering customers", channel: "WhatsApp", sent: 0, status: "Scheduled" },
  { name: "Weekend thank-you", audience: "Recent customers", channel: "Email", sent: 0, status: "Draft" },
];

const automations = [
  { title: "Invoice becomes overdue", action: "Send a payment reminder", enabled: true },
  { title: "No purchase in 90 days", action: "Send a comeback offer", enabled: false },
  { title: "Customer makes first purchase", action: "Send a thank-you message", enabled: true },
  { title: "Customer spends over GH₵5,000", action: "Tag customer as VIP", enabled: true },
  { title: "Product is low on stock", action: "Notify the business owner", enabled: true },
];

export function MarketingPageContent() {
  const [mobileNav, setMobileNav] = useState(false);
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [audience, setAudience] = useState("Inactive for 60 days");
  const [channel, setChannel] = useState("WhatsApp");
  const [messageSent, setMessageSent] = useState(false);
  const [enabled, setEnabled] = useState<Record<number, boolean>>(() => Object.fromEntries(automations.map((item, index) => [index, item.enabled])));

  useEffect(() => {
    const syncHash = () => { const next = window.location.hash.slice(1); if (["campaigns", "messages", "reminders", "promotions", "automations"].includes(next)) setTab(next); };
    syncHash(); window.addEventListener("hashchange", syncHash); return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const changeTab = (value: string) => { setTab(value); window.history.replaceState(null, "", `#${value}`); };
  const createCampaign = (event: FormEvent) => { event.preventDefault(); if (!campaignName.trim()) return; setCampaigns((rows) => [{ name: campaignName, audience, channel, sent: 0, status: "Draft" }, ...rows]); setCampaignName(""); setCampaignOpen(false); };

  return <AppShell title="Marketing" subtitle="Stay close to customers without adding complexity." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav} actions={<Button onClick={() => setCampaignOpen(true)}><Plus/>New campaign</Button>}>
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary icon={Users} label="Reachable customers" value="248" note="With a phone or email"/>
        <Summary icon={Send} label="Messages this month" value="382" note="91% successfully delivered"/>
        <Summary icon={BellRing} label="Reminders due" value="12" note="5 invoices are overdue"/>
        <Summary icon={Bot} label="Active automations" value={String(Object.values(enabled).filter(Boolean).length)} note="Simple rules working for you"/>
      </section>

      <Card className="overflow-hidden border-violet-200 bg-[linear-gradient(110deg,#ede9fe,#f5f3ff_55%,#ffffff)] dark:border-violet-500/20 dark:bg-[linear-gradient(110deg,#211936,#161B22_65%)]"><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><Sparkles className="size-5"/></span><div><h2 className="font-display text-lg font-bold">Marketing that starts with what you already know</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Use customer history, unpaid balances, and important dates to send useful messages at the right time.</p></div></div><Button onClick={() => setCampaignOpen(true)} className="shrink-0">Create a campaign<ArrowRight/></Button></CardContent></Card>

      <Tabs value={tab} onValueChange={changeTab}><TabsList className="w-full justify-start overflow-x-auto"><TabsTrigger value="campaigns">Campaigns</TabsTrigger><TabsTrigger value="messages">WhatsApp Messages</TabsTrigger><TabsTrigger value="reminders">Reminders</TabsTrigger><TabsTrigger value="promotions">Promotions</TabsTrigger><TabsTrigger value="automations">Automations</TabsTrigger></TabsList>
        <TabsContent value="campaigns" id="campaigns"><Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Campaigns</CardTitle><CardDescription>Simple broadcasts to a selected customer group</CardDescription></div><Button size="sm" onClick={() => setCampaignOpen(true)}><Plus/>Create</Button></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Audience</TableHead><TableHead className="hidden md:table-cell">Channel</TableHead><TableHead>Sent</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{campaigns.map((campaign) => <TableRow key={campaign.name}><TableCell className="font-semibold">{campaign.name}</TableCell><TableCell className="text-muted-foreground">{campaign.audience}</TableCell><TableCell className="hidden md:table-cell">{campaign.channel}</TableCell><TableCell>{campaign.sent}</TableCell><TableCell><Badge className={campaign.status === "Sent" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" : campaign.status === "Scheduled" ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300" : ""}>{campaign.status}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>

        <TabsContent value="messages" id="messages"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><Card><CardHeader><CardTitle>Quick WhatsApp message</CardTitle><CardDescription>Choose a customer group, personalize the message, and send</CardDescription></CardHeader><CardContent className="space-y-4"><label className="space-y-1.5 text-xs font-semibold">Send to<Select defaultValue="overdue"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="overdue">Customers with overdue invoices</SelectItem><SelectItem value="inactive">No purchase in 60 days</SelectItem><SelectItem value="recent">Recent customers</SelectItem><SelectItem value="vip">VIP customers</SelectItem></SelectContent></Select></label><label className="space-y-1.5 text-xs font-semibold">Message<Textarea defaultValue="Hi {{first_name}}, your outstanding balance of {{balance}} is due. Please let us know if you need any help." className="min-h-32"/></label>{messageSent && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="size-4"/>Message queued for delivery.</p>}<Button onClick={() => setMessageSent(true)}><Send/>Review & send</Button></CardContent></Card><TemplateCard/></div></TabsContent>

        <TabsContent value="reminders" id="reminders"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Reminder title="Payment reminders" count="5 overdue" note="Ask customers to settle an outstanding balance" tone="rose"/><Reminder title="Invoice due soon" count="4 this week" note="Send a gentle reminder before the due date" tone="amber"/><Reminder title="Follow-up customers" count="3 waiting" note="Reconnect with customers who have gone quiet" tone="violet"/><Reminder title="Birthdays & occasions" count="Coming next" note="Build stronger relationships around important dates" tone="emerald"/></div></TabsContent>

        <TabsContent value="promotions" id="promotions"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Promotion title="Percentage discount" example="10% off all products"/><Promotion title="Order discount" example="GH₵20 off orders above GH₵200"/><Promotion title="Product offer" example="20% off Product X"/><Promotion title="Loyalty offer" example="Returning customer discount"/></div><Card className="mt-5"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">A simple promotion flow</p><p className="mt-1 text-sm text-muted-foreground">Create promotion → choose customers → send by WhatsApp or email</p></div><Button><Gift/>Create promotion</Button></CardContent></Card></TabsContent>

        <TabsContent value="automations" id="automations"><Card><CardHeader><CardTitle>When this happens → do this</CardTitle><CardDescription>Turn useful follow-ups into simple rules. No complicated builder needed.</CardDescription></CardHeader><CardContent className="space-y-2">{automations.map((automation, index) => <div key={automation.title} className="flex items-center gap-4 rounded-xl border p-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Bot className="size-4"/></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{automation.title}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><ArrowRight className="size-3"/>{automation.action}</p></div><Switch checked={enabled[index]} onCheckedChange={(checked) => setEnabled((current) => ({ ...current, [index]: checked }))} aria-label={`Toggle ${automation.title}`}/></div>)}</CardContent></Card></TabsContent>
      </Tabs>
    </div>

    <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}><DialogContent><DialogHeader><DialogTitle>Create campaign</DialogTitle><DialogDescription>Start with one message and one clear customer group.</DialogDescription></DialogHeader><form onSubmit={createCampaign} className="space-y-4"><label className="space-y-1.5 text-xs font-semibold">Campaign name<Input autoFocus value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="e.g. September comeback offer"/></label><label className="space-y-1.5 text-xs font-semibold">Audience<Select value={audience} onValueChange={setAudience}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Inactive for 60 days">Inactive for 60 days</SelectItem><SelectItem value="Customers with overdue invoices">Customers with overdue invoices</SelectItem><SelectItem value="Recent customers">Recent customers</SelectItem><SelectItem value="VIP customers">VIP customers</SelectItem></SelectContent></Select></label><label className="space-y-1.5 text-xs font-semibold">Channel<Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Email">Email</SelectItem></SelectContent></Select></label><DialogFooter><Button type="button" variant="outline" onClick={() => setCampaignOpen(false)}>Cancel</Button><Button disabled={!campaignName.trim()}>Create draft</Button></DialogFooter></form></DialogContent></Dialog>
  </AppShell>;
}

function Summary({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) { return <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Icon className="size-4"/></span><span className="font-display text-2xl font-bold">{value}</span></div><p className="mt-3 text-xs font-semibold">{label}</p><p className="mt-1 text-[10px] text-muted-foreground">{note}</p></CardContent></Card>; }
function TemplateCard() { return <Card><CardHeader><CardTitle>Saved templates</CardTitle><CardDescription>Personalized with customer details</CardDescription></CardHeader><CardContent className="space-y-3">{["Payment reminder", "Invoice due soon", "New product announcement", "Thank-you message"].map((item) => <button key={item} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:border-violet-200"><MessageCircle className="size-4 text-violet-600"/><span className="flex-1 text-xs font-semibold">{item}</span><ArrowRight className="size-3 text-muted-foreground"/></button>)}</CardContent></Card>; }
function Reminder({ title, count, note, tone }: { title: string; count: string; note: string; tone: string }) { const colors: Record<string, string> = { rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300", amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300", emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" }; return <Card><CardContent className="p-5"><span className={`grid size-10 place-items-center rounded-lg ${colors[tone]}`}><CalendarClock className="size-4"/></span><p className="mt-4 text-sm font-semibold">{title}</p><p className="mt-1 font-display text-2xl font-bold">{count}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p><Button variant="outline" size="sm" className="mt-4">Review<ArrowRight/></Button></CardContent></Card>; }
function Promotion({ title, example }: { title: string; example: string }) { return <Card className="transition hover:border-violet-200"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Gift className="size-4"/></span><p className="mt-4 text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{example}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-violet-600">Use offer<ArrowRight/></Button></CardContent></Card>; }
