"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, FileDown, LifeBuoy, Mail, MessageCircle, Plus, Search, Settings, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const faqs = [
  { question: "How is revenue calculated?", answer: "Revenue is the sum of every recorded sale in the selected period. Editing or deleting a sale updates dashboard totals automatically." },
  { question: "Can I change a sale after recording it?", answer: "Yes. Open Sales, click anywhere on the sale row, then choose Edit sale. You can change the amount, customer, category, payment method, date, and notes." },
  { question: "How do I see only today's sales?", answer: "On the Overview table choose Today, or open Sales and select Today from the date filter. Both the list and export will use that selection." },
  { question: "What is included in an export?", answer: "CSV and PDF exports include the currently filtered sales: reference, date, customer, description, category, payment method, and amount." },
  { question: "Why do I see a Demo data badge?", answer: "The dashboard uses realistic demo records when the PostgreSQL API is not connected. Start the backend and reload the page to switch to live data." },
  { question: "Does changing currency convert old sales?", answer: "The dashboard, forms, receipts, and exports switch to the selected currency immediately. Existing numeric values are reformatted, not converted using an exchange rate." },
];

export function HelpPageContent() {
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? faqs.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(needle)) : faqs;
  }, [query]);

  return <AppShell title="Help & support" subtitle="Answers and guidance for the sales module." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav}>
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#172a45] px-5 py-8 text-white sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-2xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#62dba9]"><LifeBuoy className="size-4" />Sales help center</div><h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">What can we help you find?</h2><p className="mt-2 text-sm leading-6 text-slate-400">Get an answer quickly or follow one of the common workflows below.</p><div className="relative mt-6 max-w-xl"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="h-11 border-white/10 bg-white text-slate-900 pl-10 placeholder:text-slate-400" placeholder="Search questions and answers…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="absolute -right-12 -top-16 size-56 rounded-full border-[34px] border-[#24b47e]/10" />
      </section>

      <section><div className="mb-3"><h2 className="font-display text-base font-semibold">Common tasks</h2><p className="text-xs text-muted-foreground">Go directly to the workflow you need.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[{ title: "Record a sale", text: "Add new revenue", icon: Plus, href: "/sales" }, { title: "Find a sale", text: "Search and filter", icon: ShoppingBag, href: "/sales" }, { title: "Export records", text: "Download CSV or PDF", icon: FileDown, href: "/sales" }, { title: "Set preferences", text: "Currency and reports", icon: Settings, href: "/settings" }].map((item) => <Link key={item.title} href={item.href} className="group"><Card className="h-full transition hover:-translate-y-0.5 hover:border-[#24b47e]/40 hover:shadow-md"><CardContent className="p-4"><span className="mb-4 grid size-9 place-items-center rounded-xl bg-emerald-50 text-[#168e64]"><item.icon className="size-4" /></span><p className="font-display text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.text}</p><ArrowRight className="mt-4 size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-[#168e64]" /></CardContent></Card></Link>)}
      </div></section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CircleHelp className="size-4 text-[#168e64]" />Frequently asked questions</CardTitle><CardDescription>{filtered.length} {filtered.length === 1 ? "answer" : "answers"} found</CardDescription></CardHeader><CardContent>{filtered.length ? <Accordion type="single" collapsible className="w-full">{filtered.map((item, index) => <AccordionItem key={item.question} value={`faq-${index}`}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent>{item.answer}</AccordionContent></AccordionItem>)}</Accordion> : <div className="grid place-items-center py-12 text-center"><Search className="mb-3 size-5 text-muted-foreground" /><p className="text-sm font-semibold">No matching answers</p><button className="mt-2 text-xs font-semibold text-[#168e64] hover:underline" onClick={() => setQuery("")}>Clear search</button></div>}</CardContent></Card>
        <div className="space-y-5"><Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="size-4 text-[#168e64]" />Still need help?</CardTitle><CardDescription>Tell us what you are trying to do and where you got stuck.</CardDescription></CardHeader><CardContent><Button asChild className="w-full"><a href="mailto:support@renaissance.app?subject=Sales%20module%20support"><Mail />Email support</a></Button><p className="mt-3 text-center text-[11px] text-muted-foreground">Typical reply time: one business day</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-4 text-[#168e64]" />Quick reminder</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Start with the sale amount and description. Customer and notes are optional, so recording revenue should take less than a minute.</p></CardContent></Card></div>
      </div>
    </div>
  </AppShell>;
}
