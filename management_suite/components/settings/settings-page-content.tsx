"use client";

import { useEffect, useState } from "react";
import { BellRing, Building2, Check, CircleDollarSign, LoaderCircle, Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { settingsApi, type BusinessSettings } from "@/lib/api";
import { useBusinessSettings } from "@/components/providers/business-settings-provider";

const defaults: BusinessSettings = { businessName: "Renaissance Studio", currency: "USD", timezone: "UTC", weekStartsOn: 1, emailReports: true, saleNotifications: true, salesCustomFields: [] };

export function SettingsPageContent() {
  const business = useBusinessSettings();
  const [mobileNav, setMobileNav] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { settingsApi.get().then(setSettings).catch(() => setDemoMode(true)).finally(() => setLoading(false)); }, []);

  async function save() {
    setSaving(true);
    try {
      const cleaned = { ...settings, salesCustomFields: settings.salesCustomFields.filter((field) => field.label.trim()).map((field) => ({ ...field, label: field.label.trim() })) };
      if (!demoMode) {
        setSettings(await settingsApi.update(cleaned));
        await business.refresh();
      } else setSettings(cleaned);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  const update = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  return <AppShell title="Settings" subtitle="Set the defaults your sales workspace uses." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav} actions={<Button onClick={() => void save()} disabled={saving || loading}>{saving ? <LoaderCircle className="animate-spin" /> : saved ? <Check /> : <Save />}<span className="hidden sm:inline">{saved ? "Saved" : "Save changes"}</span><span className="sm:hidden">Save</span></Button>}>
    {loading ? <div className="grid place-items-center py-32"><LoaderCircle className="size-8 animate-spin text-[#1ca270]" /></div> : <div className="mx-auto max-w-4xl">
      {demoMode && <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" /><div><p className="font-semibold">Preview settings</p><p className="mt-0.5 text-xs text-amber-700">Connect the backend to persist these settings for your business.</p></div></div>}
      <Tabs defaultValue="business">
        <TabsList className="w-full justify-start overflow-x-auto"><TabsTrigger value="business"><Building2 className="mr-2 inline size-4" />Business</TabsTrigger><TabsTrigger value="revenue"><CircleDollarSign className="mr-2 inline size-4" />Revenue</TabsTrigger><TabsTrigger value="fields"><SlidersHorizontal className="mr-2 inline size-4" />Sale fields</TabsTrigger><TabsTrigger value="notifications"><BellRing className="mr-2 inline size-4" />Notifications</TabsTrigger></TabsList>
        <TabsContent value="business"><Card><CardHeader><CardTitle>Business profile</CardTitle><CardDescription>This name appears across your management suite and exported reports.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Business name<Input value={settings.businessName} onChange={(event) => update("businessName", event.target.value)} /></label><div className="rounded-xl bg-muted/60 p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspace identity</p><div className="mt-3 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#172a45] font-display text-sm font-bold text-white">{settings.businessName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</span><div><p className="font-display font-semibold">{settings.businessName || "Your business"}</p><Badge className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-700">Sales module active</Badge></div></div></div></CardContent></Card></TabsContent>
        <TabsContent value="revenue"><Card><CardHeader><CardTitle>Revenue preferences</CardTitle><CardDescription>Choose how dates and money appear throughout the suite.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Currency<Select value={settings.currency} onValueChange={(value) => update("currency", value as BusinessSettings["currency"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD — US Dollar</SelectItem><SelectItem value="GBP">GBP — British Pound</SelectItem><SelectItem value="EUR">EUR — Euro</SelectItem><SelectItem value="NGN">NGN — Nigerian Naira</SelectItem><SelectItem value="GHS">GHS — Ghanaian Cedi</SelectItem><SelectItem value="KES">KES — Kenyan Shilling</SelectItem><SelectItem value="ZAR">ZAR — South African Rand</SelectItem></SelectContent></Select></label><label className="space-y-1.5 text-sm font-medium">Week starts on<Select value={String(settings.weekStartsOn)} onValueChange={(value) => update("weekStartsOn", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Monday</SelectItem><SelectItem value="0">Sunday</SelectItem><SelectItem value="6">Saturday</SelectItem></SelectContent></Select></label><label className="space-y-1.5 text-sm font-medium sm:col-span-2">Reporting timezone<Select value={settings.timezone} onValueChange={(value) => update("timezone", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UTC">UTC</SelectItem><SelectItem value="Europe/London">London</SelectItem><SelectItem value="America/New_York">New York</SelectItem><SelectItem value="Africa/Lagos">Lagos</SelectItem><SelectItem value="Africa/Accra">Accra</SelectItem><SelectItem value="Africa/Nairobi">Nairobi</SelectItem><SelectItem value="Africa/Johannesburg">Johannesburg</SelectItem></SelectContent></Select></label><p className="text-xs leading-5 text-muted-foreground sm:col-span-2">The selected currency updates dashboard totals, sale forms, receipts, and exports immediately. Existing numbers are reformatted, not converted using an exchange rate.</p></CardContent></Card></TabsContent>
        <TabsContent value="fields"><Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Custom sale fields</CardTitle><CardDescription>Add optional business-specific metadata without changing the core sale structure.</CardDescription></div><Button size="sm" variant="outline" onClick={() => update("salesCustomFields", [...settings.salesCustomFields, { id: crypto.randomUUID(), label: "", required: false }])}><Plus />Add field</Button></CardHeader><CardContent>{settings.salesCustomFields.length ? <div className="space-y-3">{settings.salesCustomFields.map((field, index) => <div key={field.id} className="grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto_auto]"><Input placeholder="e.g. Farm, Venue, Vehicle number" value={field.label} onChange={(event) => update("salesCustomFields", settings.salesCustomFields.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><label className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Switch checked={field.required} onCheckedChange={(checked) => update("salesCustomFields", settings.salesCustomFields.map((item, itemIndex) => itemIndex === index ? { ...item, required: checked } : item))} />Required</label><Button variant="ghost" size="icon" className="text-red-600" onClick={() => update("salesCustomFields", settings.salesCustomFields.filter((item) => item.id !== field.id))} aria-label={`Remove ${field.label || "custom field"}`}><Trash2 /></Button></div>)}</div> : <div className="grid place-items-center rounded-xl border border-dashed py-12 text-center"><SlidersHorizontal className="mb-3 size-5 text-muted-foreground" /><p className="text-sm font-semibold">No custom fields yet</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Examples: Farm, Harvest date, Venue, Guest count, Vehicle number, Mileage, or Stylist.</p></div>}</CardContent></Card></TabsContent>
        <TabsContent value="notifications"><Card><CardHeader><CardTitle>Notifications and summaries</CardTitle><CardDescription>Choose the signals you want from this module.</CardDescription></CardHeader><CardContent className="divide-y"><div className="flex items-center justify-between gap-5 py-4 first:pt-0"><div><p className="text-sm font-semibold">Weekly revenue summary</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Receive a compact report of sales, revenue, and average order value.</p></div><Switch checked={settings.emailReports} onCheckedChange={(value) => update("emailReports", value)} aria-label="Weekly revenue summary" /></div><div className="flex items-center justify-between gap-5 py-4 last:pb-0"><div><p className="text-sm font-semibold">New sale confirmations</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Show a confirmation whenever a new sale is recorded.</p></div><Switch checked={settings.saleNotifications} onCheckedChange={(value) => update("saleNotifications", value)} aria-label="New sale confirmations" /></div></CardContent></Card></TabsContent>
      </Tabs>
    </div>}
  </AppShell>;
}
