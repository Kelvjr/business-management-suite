import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How do I record a new sale?",
    answer:
      "On the dashboard, use the Add Sale button (next to Export and View Report), the Quick Actions card, or go to Sales and open the add-sale flow. Fill in item details, payment status, and channel, then save.",
  },
  {
    question: "Can I edit or delete an existing sale?",
    answer:
      "Yes. Open the Sales table, choose a row, and use the action controls to edit details or remove the transaction.",
  },
  {
    question: "How do exports work?",
    answer:
      "Most pages provide export menus where you can download CSV, PDF, or Excel snapshots based on current filters.",
  },
  {
    question: "Why does customer data update from sales?",
    answer:
      "Customers are derived from recorded transactions. New sales, order counts, and spend totals automatically update customer insights.",
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1164px] space-y-6">
        <div className="rounded-[20px] border-0 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">Help &amp; Support</h1>
          <p className="mt-2 text-sm text-gray-600">
            Find quick answers, product guidance, and support channels for your
            Sales Tracker workspace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[20px] border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>Read setup guides, workflows, and best practices.</p>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/reports">Open Guides</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>Need help with bugs or data issues? Reach support directly.</p>
              <Button asChild className="w-full rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700">
                <a href="mailto:support@salestrack.app">Email Support</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Video Tutorials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>Watch quick walkthroughs for sales, reports, and customers.</p>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/">View Tutorials</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[20px] border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-900">{faq.question}</p>
                <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

