"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  FileDown,
  Filter,
  Layers3,
  ListChecks,
  MessageCircle,
  Package,
  PlugZap,
  Plus,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Metric = { label: string; value: string; change: string; positive?: boolean };
type WorkspaceConfig = {
  title: string;
  subtitle: string;
  action: string;
  actionHref?: string;
  chartTitle: string;
  chartDescription: string;
  primaryLabel: string;
  secondaryLabel: string;
  metrics: Metric[];
  tableTitle: string;
  tableDescription: string;
  columns: string[];
  rows: string[][];
  insights: Array<{ label: string; value: number }>;
  notes: string[];
};

const configs: Record<string, WorkspaceConfig> = {
  "overview/activity": page("Activity", "See the important work happening across sales, finance, customers, and stock.", "Add note", "Completed", "Pending", [
    m("Activities", "186", "24 this week", true), m("Team actions", "74", "12.8% higher", true), m("Automatic updates", "92", "49% of activity", true), m("Needs review", "6", "2 urgent"),
  ], "Workspace activity", ["Time", "Activity", "Area", "Owner", "Status"], [
    ["10:24", "Payment matched to invoice", "Finance", "System", "Complete"], ["09:42", "New customer created", "Customers", "Ama", "Complete"], ["09:18", "Low-stock item flagged", "Inventory", "System", "Review"], ["Yesterday", "Wholesale sale recorded", "Sales", "Kelvin", "Complete"],
  ], ["Sales", "Finance", "Operations"], ["Most activity is completed automatically.", "Two items need owner review today.", "Sales is the most active workspace area."]),
  "overview/alerts": page("Alerts", "Focus on the few business signals that need attention now.", "Review all", "Resolved", "Open", [
    m("Open alerts", "9", "3 fewer", true), m("Critical", "2", "Action needed"), m("Resolved today", "7", "4 more", true), m("Average response", "1h 18m", "22m faster", true),
  ], "Alert register", ["Alert", "Area", "Priority", "Created", "Status"], [
    ["Invoice overdue", "Finance", "High", "2 hours ago", "Open"], ["Premium package low stock", "Inventory", "High", "4 hours ago", "Open"], ["Supplier payment due", "Purchasing", "Medium", "Yesterday", "In progress"], ["Campaign ready to send", "Marketing", "Low", "Yesterday", "Review"],
  ], ["Critical", "Action soon", "Information"], ["Two alerts should be handled today.", "Finance holds the largest open value.", "Seven alerts were resolved this morning."]),
  "sales/returns": page("Returns & refunds", "Resolve reversals clearly while protecting customer trust and revenue accuracy.", "Record return", "Return value", "Refunded", [
    m("Returns", "12", "8.3% lower", true), m("Refunded", "GH₵3,840", "12.4% lower", true), m("Return rate", "2.8%", "0.6% lower", true), m("Pending review", "3", "1 needs attention"),
  ], "Return activity", ["Return", "Customer", "Reason", "Status", "Amount"], [
    ["RET-2026-0012", "Adwoa Mensah", "Wrong size", "Refunded", "GH₵420"], ["RET-2026-0011", "Atlas Coffee", "Damaged item", "Review", "GH₵780"], ["RET-2026-0010", "Kojo Asante", "Duplicate order", "Refunded", "GH₵1,250"], ["RET-2026-0009", "Esi Addo", "Changed mind", "Credit issued", "GH₵340"],
  ], ["Refunded", "Store credit", "Pending"], ["Most returns are resolved within one business day.", "Wrong size is the most common return reason.", "Return rate remains below the 3% target."]),
  "sales/channels": page("Sales channels", "Compare in-store, online, wholesale, and direct sales from one place.", "Add channel", "Channel revenue", "Orders", [
    m("Channel revenue", "GH₵27,436", "18.6% higher", true), m("In-store", "GH₵12,840", "46.8% share", true), m("Online", "GH₵8,910", "32.5% share", true), m("Wholesale", "GH₵5,686", "20.7% share", true),
  ], "Channel performance", ["Channel", "Orders", "Average order", "Conversion", "Revenue"], [
    ["In-store", "128", "GH₵100", "74%", "GH₵12,840"], ["Online", "64", "GH₵139", "8.4%", "GH₵8,910"], ["Wholesale", "12", "GH₵474", "61%", "GH₵5,686"], ["WhatsApp", "19", "GH₵181", "35%", "GH₵3,439"],
  ], ["In-store", "Online", "Wholesale"], ["In-store remains the strongest revenue source.", "Online average order value grew this month.", "Wholesale has the highest repeat purchase rate."]),
  "finance/payments": page("Payments", "Track every incoming and outgoing payment with a clean audit trail.", "Record payment", "Money in", "Money out", [
    m("Money received", "GH₵31,820", "14.2% higher", true), m("Money paid", "GH₵13,460", "6.8% lower", true), m("Net movement", "GH₵18,360", "23.1% higher", true), m("Unmatched", "2", "Review required"),
  ], "Payment register", ["Reference", "Contact", "Method", "Status", "Amount"], [
    ["PAY-2026-0218", "Atlas Coffee", "Bank transfer", "Matched", "+GH₵4,300"], ["PAY-2026-0217", "Prime Supplies", "Mobile money", "Paid", "−GH₵2,450"], ["PAY-2026-0216", "Adwoa Mensah", "Card", "Matched", "+GH₵1,320"], ["PAY-2026-0215", "Kumasi Packaging", "Bank transfer", "Review", "−GH₵1,850"],
  ], ["Bank transfer", "Mobile money", "Card"], ["Bank transfers account for most received value.", "Two payments still need matching.", "Average collection time improved by two days."]),
  "finance/outstanding": page("Outstanding balances", "See who owes money, what is due, and what needs a reminder today.", "Send reminders", "Amount due", "Collected", [
    m("Outstanding", "GH₵8,450", "9.2% lower", true), m("Overdue", "GH₵3,280", "38.8% of due"), m("Due this week", "GH₵2,770", "5 invoices"), m("Collection rate", "91.4%", "3.1% higher", true),
  ], "Balance follow-up", ["Customer", "Invoice", "Due", "Age", "Balance"], [
    ["Kojo Asante", "INV-2026-0602", "12 Aug", "2 days", "GH₵450"], ["Atlas Coffee", "INV-2026-0598", "8 Aug", "6 days", "GH₵1,800"], ["Yaw Boateng", "INV-2026-0590", "31 Jul", "14 days", "GH₵1,030"], ["Adwoa Mensah", "INV-2026-0601", "15 Aug", "Current", "GH₵600"],
  ], ["Current", "1–7 days", "8+ days"], ["Three reminders are ready to send.", "Most overdue value sits with two customers.", "Collection rate is above last month."]),
  "finance/transactions": page("Transactions", "A complete chronological record of every movement across the business.", "Add transaction", "Credits", "Debits", [
    m("Transactions", "248", "11.6% higher", true), m("Credits", "GH₵36,940", "15.3% higher", true), m("Debits", "GH₵18,580", "4.2% lower", true), m("Net cash flow", "GH₵18,360", "23.1% higher", true),
  ], "Transaction history", ["Date", "Description", "Account", "Type", "Amount"], [
    ["11 Aug", "Website care plan", "Sales", "Credit", "+GH₵585"], ["10 Aug", "Inventory restock", "Purchasing", "Debit", "−GH₵2,450"], ["9 Aug", "Brand strategy session", "Sales", "Credit", "+GH₵1,320"], ["8 Aug", "Workspace rent", "Expenses", "Debit", "−GH₵3,800"],
  ], ["Sales", "Purchasing", "Expenses"], ["Sales generated the strongest positive movement.", "No duplicate transactions were detected.", "Cash outflow is lower than the previous period."]),
  "finance/taxes": page("Taxes", "Prepare tax figures from connected sales, invoices, purchases, and expenses.", "Create tax report", "Tax collected", "Tax paid", [
    m("Tax collected", "GH₵4,116", "12.2% higher", true), m("Input tax", "GH₵1,842", "7.1% higher"), m("Net payable", "GH₵2,274", "Due 30 Sep"), m("Taxable sales", "GH₵24,980", "91% of revenue", true),
  ], "Tax summary", ["Period", "Taxable sales", "Output tax", "Input tax", "Net"], [
    ["August 2026", "GH₵24,980", "GH₵4,116", "GH₵1,842", "GH₵2,274"], ["July 2026", "GH₵22,610", "GH₵3,724", "GH₵1,680", "GH₵2,044"], ["June 2026", "GH₵20,840", "GH₵3,431", "GH₵1,510", "GH₵1,921"],
  ], ["Output tax", "Input tax", "Net payable"], ["All August sales are categorized.", "Three expenses are missing tax details.", "The next filing date is 30 September."]),
  "customers/groups": page("Customer groups", "Organize customers into useful audiences for service, follow-up, and campaigns.", "Create group", "Group value", "Customers", [
    m("Groups", "6", "2 created recently", true), m("Grouped customers", "184", "78% coverage", true), m("VIP value", "GH₵18,420", "22% higher", true), m("Unassigned", "52", "Needs review"),
  ], "Customer groups", ["Group", "Customers", "Rule", "Last used", "Value"], [
    ["VIP customers", "18", "Spent over GH₵5,000", "Yesterday", "GH₵18,420"], ["Inactive 60 days", "34", "No recent purchase", "3 days ago", "GH₵6,810"], ["Wholesale buyers", "12", "Wholesale channel", "1 week ago", "GH₵9,450"], ["New customers", "27", "First purchase in 30 days", "Today", "GH₵4,280"],
  ], ["VIP", "Active", "Inactive"], ["VIP customers have the highest repeat rate.", "Thirty-four customers are ready for re-engagement.", "Most new customers came from online sales."]),
  "customers/insights": page("Customer insights", "Understand customer value, buying patterns, loyalty, and opportunities.", "Export insights", "Customer value", "Orders", [
    m("Customers", "236", "9.8% higher", true), m("Lifetime value", "GH₵42,680", "17.5% higher", true), m("Repeat rate", "46%", "4.2% higher", true), m("At-risk", "21", "8 fewer", true),
  ], "Customer value ranking", ["Customer", "Orders", "Last purchase", "Favourite", "Value"], [
    ["Kojo Asante", "12", "7 Aug", "Team workshop", "GH₵8,250"], ["Atlas Coffee", "9", "6 Aug", "Consulting retainer", "GH₵7,480"], ["Akosua Owusu", "8", "5 Aug", "Website care", "GH₵6,810"], ["Adwoa Mensah", "7", "7 Aug", "Brand strategy", "GH₵5,960"],
  ], ["Champions", "Loyal", "At-risk"], ["Repeat customers contribute 62% of revenue.", "Twenty-one customers may need a follow-up.", "Customer value is trending upward."]),
  "customers/activity": page("Notes & activity", "Keep calls, messages, meetings, and useful customer context together.", "Add note", "Conversations", "Follow-ups", [
    m("Activities", "84", "18 this week", true), m("Follow-ups", "13", "5 due today"), m("Notes added", "29", "10.4% higher", true), m("Response rate", "72%", "6.8% higher", true),
  ], "Customer timeline", ["Customer", "Activity", "Owner", "Next step", "When"], [
    ["Atlas Coffee", "Payment call", "Kelvin", "Send statement", "Today, 9:20"], ["Adwoa Mensah", "WhatsApp reply", "Ama", "Share proposal", "Today, 8:45"], ["Kojo Asante", "Meeting note", "Kelvin", "Follow up Friday", "Yesterday"], ["Yaw Boateng", "Invoice reminder", "System", "Await payment", "2 days ago"],
  ], ["Messages", "Calls", "Meetings"], ["Five follow-ups are due today.", "WhatsApp is the most-used contact method.", "Average response time improved this week."]),
  "customers/leads": page("Leads", "Move potential customers from first contact to won business without unnecessary complexity.", "Add lead", "Pipeline value", "Won", [
    m("Open leads", "28", "6 added this week", true), m("Pipeline value", "GH₵34,600", "14.8% higher", true), m("Won this month", "9", "3 more", true), m("Conversion", "32.1%", "4.6% higher", true),
  ], "Lead pipeline", ["Lead", "Stage", "Source", "Next action", "Value"], [
    ["Nana Events", "Interested", "Referral", "Send package", "GH₵4,500"], ["Coastal Foods", "Contacted", "Website", "Call Thursday", "GH₵6,800"], ["Mensa & Co.", "New", "WhatsApp", "Qualify", "GH₵2,200"], ["Bright School", "Won", "Campaign", "Convert customer", "GH₵8,400"],
  ], ["New", "Interested", "Won"], ["Referral leads convert most often.", "Four interested leads need proposals.", "Pipeline value is strongest in services."]),
  "inventory/movements": page("Stock movements", "Review every stock-in, stock-out, transfer, and manual adjustment.", "Record movement", "Stock in", "Stock out", [
    m("Movements", "146", "18 this week", true), m("Stock in", "482 units", "21% higher", true), m("Stock out", "319 units", "12% higher"), m("Adjustments", "7", "3 fewer", true),
  ], "Movement history", ["Reference", "Product", "Movement", "Quantity", "Balance"], [
    ["MOV-2026-0318", "Premium package", "Stock in", "+40", "112"], ["SAL-2026-0219", "Retail order", "Stock out", "−8", "72"], ["ADJ-2026-0041", "Print material", "Adjustment", "+3", "28"], ["PO-2026-0064", "Office supply kit", "Stock in", "+120", "184"],
  ], ["Stock in", "Stock out", "Adjustment"], ["Incoming stock exceeded outgoing stock this week.", "Seven movements were manual adjustments.", "All movements have a reference."]),
  "inventory/low-stock": page("Low stock", "Prioritize products at or below their reorder level before sales are affected.", "Create purchase order", "At risk", "Reordered", [
    m("Low-stock items", "7", "2 critical"), m("Units required", "164", "To reach target"), m("Reorder value", "GH₵6,420", "Estimated cost"), m("Covered", "3", "Purchase orders open", true),
  ], "Reorder list", ["Product", "On hand", "Reorder level", "Supplier", "Suggested order"], [
    ["Premium package", "4", "12", "Prime Supplies", "32 units"], ["Print material", "8", "20", "Kumasi Packaging", "48 units"], ["Office supply kit", "6", "15", "Prime Supplies", "36 units"], ["Event welcome pack", "3", "10", "Accra Wholesale", "28 units"],
  ], ["Critical", "Low", "Covered"], ["Two items may run out within seven days.", "Three items already have open purchase orders.", "Prime Supplies covers most reorder value."]),
  "inventory/categories": page("Categories", "Structure products and services so reporting, sales, and stock stay consistent.", "Create category", "Category revenue", "Items", [
    m("Categories", "12", "2 added recently", true), m("Products", "48", "Across 8 categories", true), m("Services", "16", "Across 4 categories", true), m("Uncategorized", "3", "Needs attention"),
  ], "Category performance", ["Category", "Items", "Sales", "Margin", "Revenue"], [
    ["Professional services", "8", "42", "68%", "GH₵12,480"], ["Subscriptions", "6", "36", "74%", "GH₵8,650"], ["Products", "24", "91", "42%", "GH₵7,820"], ["Packages", "9", "28", "56%", "GH₵6,340"],
  ], ["Services", "Products", "Packages"], ["Professional services leads revenue.", "Three catalog items need categories.", "Subscriptions have the strongest margin."]),
  "purchasing/history": page("Purchase history", "See every order, receipt, supplier payment, and delivery outcome over time.", "New purchase", "Purchased", "Paid", [
    m("Purchase orders", "64", "9 this month", true), m("Purchased", "GH₵28,740", "11.2% higher"), m("Paid", "GH₵22,180", "77.2% settled", true), m("Open orders", "8", "3 due this week"),
  ], "Purchase history", ["Purchase", "Supplier", "Status", "Received", "Total"], [
    ["PO-2026-0064", "Prime Supplies", "Part received", "80 / 120", "GH₵4,800"], ["PO-2026-0063", "Kumasi Packaging", "Received", "200 / 200", "GH₵3,450"], ["PO-2026-0062", "Accra Wholesale", "Ordered", "0 / 60", "GH₵2,780"], ["PO-2026-0061", "Office Hub", "Received", "35 / 35", "GH₵1,960"],
  ], ["Received", "In progress", "Ordered"], ["Most orders arrive within five days.", "Eight purchase orders remain open.", "Prime Supplies has the highest purchase value."]),
  "purchasing/balances": page("Supplier balances", "Know what is owed, what is due next, and which supplier payments need attention.", "Record supplier payment", "Amount owed", "Paid", [
    m("Supplier balance", "GH₵6,560", "7.8% lower", true), m("Due this week", "GH₵2,980", "3 suppliers"), m("Overdue", "GH₵1,240", "1 supplier"), m("On-time rate", "94%", "2.4% higher", true),
  ], "Supplier balances", ["Supplier", "Open orders", "Next due", "Terms", "Balance"], [
    ["Prime Supplies", "3", "14 Aug", "Net 14", "GH₵2,450"], ["Kumasi Packaging", "2", "18 Aug", "Net 30", "GH₵1,850"], ["Accra Wholesale", "1", "10 Aug", "Net 7", "GH₵1,240"], ["Office Hub", "1", "22 Aug", "On receipt", "GH₵1,020"],
  ], ["Current", "Due soon", "Overdue"], ["One supplier balance is overdue.", "On-time payment performance remains strong.", "Three payments fall due this week."]),
};

const reportConfigs: Record<string, [string, string, string, string[], string[][]]> = {
  sales: ["Sales reports", "Track revenue, order volume, payment status, and channel performance.", "Sales performance", ["Period", "Orders", "Average order", "Revenue"], [["August", "204", "GH₵134", "GH₵27,436"], ["July", "188", "GH₵126", "GH₵23,688"], ["June", "176", "GH₵121", "GH₵21,296"]]],
  "profit-loss": ["Profit & loss", "Understand revenue, direct costs, operating expenses, and net profit.", "Profit trend", ["Period", "Revenue", "Expenses", "Net profit"], [["August", "GH₵27,436", "GH₵14,520", "GH₵12,916"], ["July", "GH₵23,688", "GH₵13,240", "GH₵10,448"], ["June", "GH₵21,296", "GH₵12,810", "GH₵8,486"]]],
  expenses: ["Expense reports", "Compare spending by category, vendor, recurrence, and period.", "Expense trend", ["Category", "Transactions", "Share", "Amount"], [["Rent & utilities", "4", "30%", "GH₵4,356"], ["Inventory & supplies", "12", "24%", "GH₵3,485"], ["Payroll", "8", "20%", "GH₵2,904"]]],
  customers: ["Customer reports", "Measure customer value, repeat behaviour, retention, and growth.", "Customer growth", ["Segment", "Customers", "Repeat rate", "Value"], [["Champions", "28", "82%", "GH₵18,420"], ["Loyal", "64", "61%", "GH₵14,680"], ["New", "42", "18%", "GH₵5,260"]]],
  products: ["Product reports", "Compare product and service revenue, volume, and margin.", "Product performance", ["Product / service", "Units", "Margin", "Revenue"], [["Consulting retainer", "12", "74%", "GH₵7,500"], ["Brand strategy", "18", "68%", "GH₵5,100"], ["Retail order", "42", "41%", "GH₵3,200"]]],
  inventory: ["Inventory reports", "Review stock value, movement, sell-through, and reorder risk.", "Inventory movement", ["Category", "On hand", "Turnover", "Stock value"], [["Products", "842", "4.2×", "GH₵16,840"], ["Packages", "184", "3.1×", "GH₵6,420"], ["Materials", "316", "2.8×", "GH₵4,980"]]],
  taxes: ["Tax reports", "Summarize taxable sales, input tax, output tax, and filing balances.", "Tax position", ["Period", "Taxable sales", "Input tax", "Net payable"], [["August", "GH₵24,980", "GH₵1,842", "GH₵2,274"], ["July", "GH₵22,610", "GH₵1,680", "GH₵2,044"], ["June", "GH₵20,840", "GH₵1,510", "GH₵1,921"]]],
};

const reportMetrics: Record<string, Metric[]> = {
  sales: [m("Sales revenue", "GH₵27,436", "15.8% higher", true), m("Orders", "204", "16 more", true), m("Average order", "GH₵134", "GH₵8 higher", true), m("Paid sales", "91%", "3.2% higher", true)],
  "profit-loss": [m("Gross revenue", "GH₵27,436", "15.8% higher", true), m("Cost of sales", "GH₵8,280", "30.2% of revenue"), m("Operating costs", "GH₵6,240", "4.1% lower", true), m("Net profit", "GH₵12,916", "47.1% margin", true)],
  expenses: [m("Total expenses", "GH₵14,520", "9.7% higher"), m("Largest category", "GH₵4,356", "Rent & utilities"), m("Recurring", "GH₵6,840", "47.1% of spend"), m("Receipts attached", "86%", "7% higher", true)],
  customers: [m("Active customers", "236", "21 added", true), m("Repeat customers", "109", "46% repeat rate", true), m("Customer value", "GH₵42,680", "17.5% higher", true), m("At-risk customers", "21", "8 fewer", true)],
  products: [m("Product revenue", "GH₵19,270", "12.6% higher", true), m("Units sold", "426", "38 more", true), m("Best margin", "74%", "Subscriptions"), m("Top performer", "GH₵7,500", "Consulting retainer", true)],
  inventory: [m("Stock value", "GH₵28,240", "5.4% higher", true), m("Units on hand", "1,342", "Across 48 products"), m("Sell-through", "61%", "6% higher", true), m("Low-stock items", "7", "2 critical")],
  taxes: [m("Taxable sales", "GH₵24,980", "91% of revenue", true), m("Output tax", "GH₵4,116", "Collected"), m("Input tax", "GH₵1,842", "Claimable"), m("Net payable", "GH₵2,274", "Due 30 Sep")],
};

for (const [slug, [title, subtitle, chartTitle, columns, rows]] of Object.entries(reportConfigs)) {
  configs[`reports/${slug}`] = page(title, subtitle, "Export report", "Current period", "Previous period", [
    m("Revenue", "GH₵27,436", "15.8% higher", true), m("Expenses", "GH₵14,520", "9.7% higher"), m("Net result", "GH₵12,916", "23.6% higher", true), m("Records", "248", "Complete", true),
  ], chartTitle, columns, rows, ["Current", "Previous", "Target"], ["The current period is tracking above plan.", "All connected records are included.", "Export is ready for CSV or PDF."]);
}

const settingsConfigs: Record<string, [string, string, string[], string[][]]> = {
  business: ["Business profile", "Manage the identity and core details used across the workspace.", ["Detail", "Current value", "Status"], [["Business name", "Renaissance Studio", "Complete"], ["Location", "Accra, Ghana", "Complete"], ["Tax identity", "Not added", "Needs attention"]]],
  branding: ["Branding", "Keep exported documents, messages, and customer touchpoints on brand.", ["Brand element", "Selection", "Usage"], [["Primary colour", "Renaissance purple", "All documents"], ["Logo", "R mark", "Invoices & reports"], ["Receipt footer", "Thank you for your business", "Sales receipts"]]],
  sales: ["Sales settings", "Choose defaults for recording sales, payments, discounts, and receipts.", ["Setting", "Default", "Applies to"], [["Payment status", "Paid", "New sales"], ["Receipt delivery", "Ask each time", "Completed sales"], ["Tax on sales", "Off", "New line items"]]],
  finance: ["Finance settings", "Set currency, tax, invoice, and expense preferences.", ["Setting", "Current value", "Applies to"], [["Currency", "Ghanaian Cedi", "Entire workspace"], ["Invoice terms", "14 days", "New invoices"], ["Expense approval", "Owner review", "Team expenses"]]],
  notifications: ["Notifications", "Choose which updates reach you and where they are delivered.", ["Notification", "Channel", "Status"], [["Low stock", "In-app + email", "Enabled"], ["Invoice overdue", "In-app", "Enabled"], ["Weekly summary", "Email", "Enabled"]]],
  team: ["Team & access", "Invite people and give each person the right level of access.", ["Team member", "Role", "Status"], [["Kelvin Kyere", "Owner", "Active"], ["Ama Mensah", "Sales manager", "Active"], ["Kwame Owusu", "Accountant", "Invite pending"]]],
  integrations: ["Integrations", "Connect the services that help payments, messages, accounting, and commerce flow.", ["Integration", "Purpose", "Status"], [["WhatsApp Business", "Customer messages", "Ready to connect"], ["Paystack", "Online payments", "Connected"], ["Google Sheets", "Data export", "Ready to connect"]]],
};

for (const [slug, [title, subtitle, columns, rows]] of Object.entries(settingsConfigs)) {
  configs[`settings/${slug}`] = page(title, subtitle, "Save changes", "Workspace score", "Usage", [
    m("Completion", "84%", "6% higher", true), m("Active rules", "12", "2 added", true), m("Team members", "3", "1 invite pending"), m("Connected tools", "1", "2 available"),
  ], `${title} activity`, columns, rows, ["Configured", "In use", "Needs attention"], ["Changes apply across the workspace.", "Your current setup is healthy.", "One recommended item needs attention."]);
}

function m(label: string, value: string, change: string, positive = false): Metric { return { label, value, change, positive }; }

function page(title: string, subtitle: string, action: string, primaryLabel: string, secondaryLabel: string, metrics: Metric[], tableTitle: string, columns: string[], rows: string[][], insightLabels: string[], notes: string[]): WorkspaceConfig {
  return {
    title, subtitle, action, metrics, primaryLabel, secondaryLabel,
    chartTitle: `${primaryLabel} vs ${secondaryLabel}`,
    chartDescription: "Performance across the selected period",
    tableTitle,
    tableDescription: `A clear working view of ${title.toLowerCase()}`,
    columns, rows, notes,
    insights: insightLabels.map((label, index) => ({ label, value: [52, 30, 18][index] ?? 10 })),
  };
}

const chartPoints = [
  { label: "1 Aug", primary: 28, secondary: 18 }, { label: "3 Aug", primary: 36, secondary: 22 },
  { label: "5 Aug", primary: 31, secondary: 25 }, { label: "7 Aug", primary: 48, secondary: 21 },
  { label: "9 Aug", primary: 43, secondary: 29 }, { label: "11 Aug", primary: 58, secondary: 26 },
  { label: "13 Aug", primary: 51, secondary: 32 }, { label: "15 Aug", primary: 68, secondary: 35 },
];

const salesChannelReport = [{name:"In-store",value:128,revenue:12840,color:"#7c3aed"},{name:"Online",value:64,revenue:8910,color:"#16a46f"},{name:"Wholesale",value:12,revenue:5686,color:"#f59e0b"}];
const profitStatement = [{label:"Gross revenue",current:"GH₵27,436",previous:"GH₵23,688",variance:"+15.8%"},{label:"Cost of sales",current:"−GH₵8,280",previous:"−GH₵7,610",variance:"+8.8%"},{label:"Gross profit",current:"GH₵19,156",previous:"GH₵16,078",variance:"+19.1%"},{label:"Operating expenses",current:"−GH₵6,240",previous:"−GH₵5,630",variance:"+10.8%"},{label:"Net profit",current:"GH₵12,916",previous:"GH₵10,448",variance:"+23.6%"}];
const expenseReportMix = [{name:"Rent & utilities",value:4356},{name:"Inventory & supplies",value:3485},{name:"Payroll",value:2904},{name:"Professional services",value:2033},{name:"Other",value:1742}];
const customerSegments = [{name:"Champions",value:82},{name:"Loyal",value:68},{name:"Promising",value:54},{name:"New",value:38},{name:"At-risk",value:24}];
const productPerformance = [{name:"Consulting retainer",value:7500},{name:"Brand strategy",value:5100},{name:"Retail order",value:3200},{name:"Website care",value:2140},{name:"Team workshop",value:1330}];
const inventoryReportRows = [{name:"Products",onHand:842,value:16840,turnover:4.2},{name:"Packages",onHand:184,value:6420,turnover:3.1},{name:"Materials",onHand:316,value:4980,turnover:2.8}];

const metricIcons = [TrendingUp, CircleDollarSign, Users, Clock3];
const metricColors = ["#16a46f", "#7c3aed", "#0ea5e9", "#f59e0b"];
const pieColors = ["#7c3aed", "#16a46f", "#f59e0b", "#0ea5e9"];

type PageLayout = "analytics" | "ledger" | "cards" | "timeline" | "pipeline" | "risk" | "report" | "settings";

const layoutByPage: Record<string, PageLayout> = {
  "overview/activity": "timeline", "overview/alerts": "risk",
  "sales/returns": "ledger", "sales/channels": "analytics",
  "finance/payments": "ledger", "finance/outstanding": "risk", "finance/transactions": "ledger", "finance/taxes": "report",
  "customers/groups": "cards", "customers/insights": "analytics", "customers/activity": "timeline", "customers/leads": "pipeline",
  "inventory/movements": "timeline", "inventory/low-stock": "risk", "inventory/categories": "cards",
  "purchasing/history": "timeline", "purchasing/balances": "risk",
};

type BodyProps = { config: WorkspaceConfig; rows: string[][]; data: typeof chartPoints; query: string; setQuery: (value: string) => void; view: string };

export function WorkspaceInsightPage({ section, view }: { section: string; view: string }) {
  const pageKey = `${section}/${view}`;
  const config = configs[pageKey];
  const [mobileNav, setMobileNav] = useState(false);
  const [range, setRange] = useState("30");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [actionOpen, setActionOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [localRows, setLocalRows] = useState<string[][]>(() => config?.rows ?? []);
  const filteredRows = useMemo(() => localRows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase())), [localRows, query]);
  const scale = range === "7" ? .58 : range === "90" ? 1.22 : range === "365" ? 1.8 : 1;
  const data = chartPoints.map((point) => ({ ...point, primary: Math.round(point.primary * scale), secondary: Math.round(point.secondary * scale) }));

  if (!config) return <WorkspaceNotFound section={section}/>;
  const layout: PageLayout = section === "reports" || pageKey === "finance/taxes" ? "report" : section === "settings" ? "settings" : layoutByPage[pageKey] ?? "analytics";
  const exportCsv = () => {
    const content = [config.columns, ...localRows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${view}.csv`; anchor.click(); URL.revokeObjectURL(url);
    showNotice("CSV export downloaded");
  };
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2200); };
  const runAction = () => {
    const action = config.action.toLowerCase();
    if (action.includes("export")) exportCsv();
    else if (layout === "settings" || action.includes("send") || action.includes("review")) showNotice(`${config.action} completed`);
    else setActionOpen(true);
  };
  const saveDraft = () => {
    if (!draftName.trim()) return;
    const row = config.columns.map((_, index) => index === 0 ? draftName.trim() : index === 1 ? (draftDetails.trim() || "New entry") : index === config.columns.length - 2 ? "New" : "—");
    setLocalRows((current) => [row, ...current]); setDraftName(""); setDraftDetails(""); setActionOpen(false); showNotice(`${config.action} added`);
  };
  const rangeLabel = range === "7" ? "Last 7 days" : range === "90" ? "Last 3 months" : range === "365" ? "Last year" : "Last 30 days";
  const ActionIcon = config.action.toLowerCase().includes("export") ? FileDown : Plus;
  const rangeControl = <><div className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex"><CalendarDays className="size-3 text-violet-600"/>Period</div><Select value={range} onValueChange={setRange}><SelectTrigger className="h-7 w-[108px] px-2.5 text-[10px]"><SelectValue>{rangeLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 3 months</SelectItem><SelectItem value="365">Last year</SelectItem></SelectContent></Select></>;
  const exportControl = <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[10px]"><Download/>Export<ChevronDown className="size-3"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={exportCsv}><FileDown/>Export CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => window.print()}><FileDown/>Export PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
  const primaryAction = <Button size="sm" className="h-7 bg-violet-600 px-3 text-[10px] text-white hover:bg-violet-700" onClick={runAction}><ActionIcon/>{config.action}</Button>;
  const actions = layout === "settings" ? <Button size="sm" className="h-7 bg-violet-600 px-3 text-[10px] text-white hover:bg-violet-700" onClick={runAction}><CheckCircle2/>Save changes</Button> : layout === "report" ? <>{rangeControl}{exportControl}</> : <>{rangeControl}{exportControl}{primaryAction}</>;

  return <AppShell title={config.title} subtitle={config.subtitle} actions={actions} mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav}>
    <div className="dashboard-page space-y-4">
      <MetricGrid metrics={section === "reports" ? (reportMetrics[view] ?? config.metrics) : config.metrics}/>
      <PageBody layout={layout} config={config} rows={filteredRows} data={data} query={query} setQuery={setQuery} view={view}/>
      {notice && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-slate-950 px-4 py-3 text-[11px] font-semibold text-white shadow-xl">{notice}</div>}
    </div>
    <Dialog open={actionOpen} onOpenChange={setActionOpen}><DialogContent><DialogHeader><DialogTitle>{config.action}</DialogTitle><DialogDescription>Add the essential details now. You can expand the record later.</DialogDescription></DialogHeader><div className="space-y-4"><label className="space-y-1.5 text-xs font-semibold">{config.columns[0]}<Input autoFocus value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={`Enter ${config.columns[0].toLowerCase()}`}/></label><label className="space-y-1.5 text-xs font-semibold">Details<Textarea value={draftDetails} onChange={(event) => setDraftDetails(event.target.value)} placeholder="Add useful context"/></label></div><DialogFooter><Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button><Button onClick={saveDraft} disabled={!draftName.trim()}>Save</Button></DialogFooter></DialogContent></Dialog>
  </AppShell>;
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric, index) => {
    const Icon = metricIcons[index]; const color = metricColors[index];
    return <Card key={metric.label} className="group relative min-h-[118px] overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"><span className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: color }}/><CardContent className="relative p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-medium text-muted-foreground">{metric.label}</p><p className="mt-2 truncate font-display text-xl font-bold tracking-tight">{metric.value}</p></div><span className="grid size-8 place-items-center rounded-lg" style={{ backgroundColor: `${color}14`, color }}><Icon className="size-4"/></span></div><p className={`mt-2 text-[10px] ${metric.positive ? "text-emerald-600" : "text-muted-foreground"}`}><ArrowUpRight className="mr-0.5 inline size-3"/>{metric.change}</p></CardContent></Card>;
  })}</section>;
}

function PageBody(props: BodyProps & { layout: PageLayout }) {
  if (props.layout === "ledger") return <LedgerBody {...props}/>;
  if (props.layout === "cards") return <CardsBody {...props}/>;
  if (props.layout === "timeline") return <TimelineBody {...props}/>;
  if (props.layout === "pipeline") return <PipelineBody {...props}/>;
  if (props.layout === "risk") return <RiskBody {...props}/>;
  if (props.layout === "report") return <ReportBody {...props}/>;
  if (props.layout === "settings") return <SettingsBody {...props}/>;
  return <AnalyticsBody {...props}/>;
}

function AreaVisual({ config, data }: Pick<BodyProps, "config" | "data">) {
  return <div className="h-[280px]"><ResponsiveContainer><AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}><defs><linearGradient id="workspacePrimary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a46f" stopOpacity=".42"/><stop offset="95%" stopColor="#16a46f" stopOpacity=".03"/></linearGradient><linearGradient id="workspaceSecondary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity=".34"/><stop offset="95%" stopColor="#7c3aed" stopOpacity=".03"/></linearGradient></defs><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8b949e" }}/><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8b949e" }}/><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)" }}/><Area type="natural" dataKey="primary" name={config.primaryLabel} stroke="#16a46f" strokeWidth={2.3} fill="url(#workspacePrimary)"/><Area type="natural" dataKey="secondary" name={config.secondaryLabel} stroke="#7c3aed" strokeWidth={2.3} fill="url(#workspaceSecondary)"/></AreaChart></ResponsiveContainer></div>;
}

function DataTableCard({ config, rows, query, setQuery }: Omit<BodyProps, "data" | "view">) {
  return <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>{config.tableTitle}</CardTitle><CardDescription>{config.tableDescription}</CardDescription></div><div className="relative"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"/><Input className="h-8 w-full pl-8 text-[11px] sm:w-56" placeholder="Search records…" value={query} onChange={(event) => setQuery(event.target.value)}/></div></div><Table aria-label={config.tableTitle}><TableHeader><TableRow>{config.columns.map((column, index) => <TableHead key={column} className={index === config.columns.length - 1 ? "text-right" : ""}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, rowIndex) => <TableRow key={`${row[0]}-${rowIndex}`}>{row.map((cell, index) => <TableCell key={`${cell}-${index}`} className={`${index === 0 ? "font-semibold" : ""} ${index === row.length - 1 ? "text-right font-bold" : ""}`}>{index === row.length - 2 ? <Badge className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">{cell}</Badge> : cell}</TableCell>)}</TableRow>)}</TableBody></Table></Card>;
}

function NotesCard({ config, title = "What needs attention" }: { config: WorkspaceConfig; title?: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>Useful signals from this page</CardDescription></CardHeader><CardContent className="space-y-2">{config.notes.map((note, index) => <div key={note} className="flex gap-3 rounded-lg border p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-50 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">{index + 1}</span><p className="text-[11px] leading-5 text-muted-foreground">{note}</p></div>)}</CardContent></Card>;
}

function AnalyticsBody(props: BodyProps) {
  const { config, data } = props;
  return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><Card><CardHeader className="border-b"><CardTitle>{config.chartTitle.toUpperCase()}</CardTitle><CardDescription>{config.chartDescription}</CardDescription></CardHeader><CardContent className="p-4"><AreaVisual config={config} data={data}/><div className="flex justify-center gap-6 border-t pt-3 text-[10px] font-semibold"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-500"/>{config.primaryLabel}</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-violet-600"/>{config.secondaryLabel}</span></div></CardContent></Card><DistributionCard config={config}/></section><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><DataTableCard {...props}/><NotesCard config={config}/></section></>;
}

function DistributionCard({ config }: { config: WorkspaceConfig }) {
  return <Card><CardHeader><CardTitle>Distribution</CardTitle><CardDescription>Share across the selected period</CardDescription></CardHeader><CardContent><div className="relative mx-auto h-[190px]"><ResponsiveContainer><PieChart><Pie data={config.insights} dataKey="value" innerRadius={58} outerRadius={78} paddingAngle={3} cornerRadius={5} stroke="none">{config.insights.map((item, index) => <Cell key={item.label} fill={pieColors[index % pieColors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><strong className="font-display text-xl">100%</strong></div></div><div className="space-y-2">{config.insights.map((item, index) => <div key={item.label} className="flex items-center gap-2 text-[11px]"><span className="size-2 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }}/><span className="flex-1 text-muted-foreground">{item.label}</span><strong>{item.value}%</strong></div>)}</div></CardContent></Card>;
}

function LedgerBody(props: BodyProps) {
  const { config, data } = props;
  return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><Card><CardHeader className="border-b"><CardTitle>{config.chartTitle}</CardTitle><CardDescription>Credits and debits by day</CardDescription></CardHeader><CardContent className="p-4"><div className="h-[245px]"><ResponsiveContainer><BarChart data={data}><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10}}/><Tooltip/><Bar dataKey="primary" name={config.primaryLabel} fill="#16a46f" radius={[5,5,0,0]}/><Bar dataKey="secondary" name={config.secondaryLabel} fill="#ef4444" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle>Reconciliation</CardTitle><CardDescription>Current register health</CardDescription></CardHeader><CardContent className="space-y-4">{config.insights.map((item,index)=><div key={item.label}><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-muted-foreground">{item.label}</span><strong>{item.value}%</strong></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${item.value}%`,backgroundColor:pieColors[index]}}/></div></div>)}</CardContent></Card></section><DataTableCard {...props}/></>;
}

function CardsBody(props: BodyProps) {
  const { config, rows } = props;
  return <><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{rows.map((row,index)=><Card key={`${row[0]}-${index}`} className="group hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-4"><div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-lg" style={{backgroundColor:`${pieColors[index%pieColors.length]}14`,color:pieColors[index%pieColors.length]}}><Layers3 className="size-4"/></span><Badge>{row[row.length-2]}</Badge></div><p className="mt-4 font-semibold">{row[0]}</p><p className="mt-1 text-[10px] text-muted-foreground">{config.columns[1]}: {row[1]}</p><div className="mt-4 flex items-end justify-between border-t pt-3"><span className="text-[10px] text-muted-foreground">{config.columns[row.length-1]}</span><strong>{row[row.length-1]}</strong></div></CardContent></Card>)}</section><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><DataTableCard {...props}/><DistributionCard config={config}/></section></>;
}

function TimelineBody(props: BodyProps) {
  const { config, rows, data } = props;
  return <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader className="border-b"><CardTitle>{config.tableTitle}</CardTitle><CardDescription>A chronological view of the latest events</CardDescription></CardHeader><CardContent className="p-4"><div className="relative ml-3 border-l pl-6">{rows.map((row,index)=><div key={`${row[0]}-${index}`} className="relative pb-6 last:pb-0"><span className="absolute -left-[31px] top-1 grid size-3 rounded-full border-2 border-card bg-violet-600 ring-2 ring-violet-100"/><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold">{row[1] ?? row[0]}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.slice(2,-1).join(" · ")}</p></div><div className="flex items-center gap-2"><Badge>{row[row.length-1]}</Badge><span className="text-[10px] text-muted-foreground">{row[0]}</span></div></div></div>)}</div></CardContent></Card><div className="space-y-4"><Card><CardHeader><CardTitle>Activity pace</CardTitle><CardDescription>Events across the period</CardDescription></CardHeader><CardContent><div className="h-[170px]"><ResponsiveContainer><AreaChart data={data}><Area type="monotone" dataKey="primary" stroke="#7c3aed" fill="#7c3aed22" strokeWidth={2}/><Tooltip/></AreaChart></ResponsiveContainer></div></CardContent></Card><NotesCard config={config} title="Latest signals"/></div></section>;
}

function PipelineBody(props: BodyProps) {
  const stages = ["New", "Contacted", "Interested", "Won"];
  return <><section className="grid gap-3 xl:grid-cols-4">{stages.map((stage,index)=>{const stageRows=props.rows.filter(row=>row[1]===stage || (index===0 && !stages.includes(row[1])));return <Card key={stage}><CardHeader className="flex-row items-center justify-between"><div><CardTitle>{stage}</CardTitle><CardDescription>{stageRows.length} lead{stageRows.length===1?"":"s"}</CardDescription></div><span className="size-2.5 rounded-full" style={{backgroundColor:pieColors[index]}}/></CardHeader><CardContent className="space-y-2">{stageRows.length?stageRows.map((row,rowIndex)=><div key={`${row[0]}-${rowIndex}`} className="rounded-lg border p-3 transition hover:border-violet-200 hover:shadow-sm"><p className="text-[11px] font-semibold">{row[0]}</p><p className="mt-1 text-[9px] text-muted-foreground">{row[2]} · {row[3]}</p><p className="mt-3 text-xs font-bold">{row[4]}</p></div>):<div className="rounded-lg border border-dashed py-8 text-center text-[10px] text-muted-foreground">No leads here</div>}</CardContent></Card>})}</section><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><Card><CardHeader><CardTitle>Pipeline conversion</CardTitle><CardDescription>Progress from new lead to won customer</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-4">{stages.map((stage,index)=><div key={stage} className="text-center"><div className="mx-auto grid rounded-lg bg-violet-50 py-6 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"><strong className="font-display text-2xl">{[28,18,11,9][index]}</strong><span className="text-[9px]">{stage}</span></div>{index<stages.length-1&&<ArrowRight className="mx-auto mt-2 size-4 text-muted-foreground"/>}</div>)}</CardContent></Card><NotesCard config={props.config}/></section></>;
}

function RiskBody(props: BodyProps) {
  const { config } = props;
  return <><section className="grid gap-4 md:grid-cols-3">{config.insights.map((item,index)=><Card key={item.label} className={index===0?"border-rose-200":""}><CardContent className="p-4"><div className="flex items-center justify-between"><span className={`grid size-9 place-items-center rounded-lg ${index===0?"bg-rose-50 text-rose-600":"bg-amber-50 text-amber-600"}`}><BellRing className="size-4"/></span><strong className="font-display text-2xl">{item.value}%</strong></div><p className="mt-4 text-xs font-semibold">{item.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{config.notes[index] ?? "Review this group"}</p></CardContent></Card>)}</section><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><DataTableCard {...props}/><Card><CardHeader><CardTitle>Priority queue</CardTitle><CardDescription>Work from the top down</CardDescription></CardHeader><CardContent className="space-y-3">{config.notes.map((note,index)=><div key={note} className="flex items-start gap-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index===0?"bg-rose-100 text-rose-700":"bg-amber-100 text-amber-700"}`}>{index+1}</span><div><p className="text-[11px] font-semibold">{index===0?"High priority":index===1?"Action soon":"Monitor"}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{note}</p></div></div>)}</CardContent></Card></section></>;
}

function ReportBody(props: BodyProps) {
  const { config, data, view } = props;
  if (view === "profit-loss") return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]"><Card><CardHeader className="border-b"><CardTitle>Profit movement</CardTitle><CardDescription>Revenue, cost, and profit across the reporting period</CardDescription></CardHeader><CardContent className="p-4"><AreaVisual config={config} data={data}/></CardContent></Card><Card><CardHeader className="border-b"><CardTitle>Profit & loss statement</CardTitle><CardDescription>Current period compared with the previous period</CardDescription></CardHeader><CardContent className="p-0"><div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b px-4 py-2 text-[9px] font-semibold uppercase text-muted-foreground"><span>Line</span><span>Current</span><span>Previous</span></div>{profitStatement.map((row,index)=><div key={row.label} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-4 py-3 last:border-0 ${index===2||index===4?"bg-emerald-50/60 font-semibold dark:bg-emerald-500/5":""}`}><div><p className="text-[11px]">{row.label}</p><p className={`text-[9px] ${row.variance.startsWith("+")?"text-emerald-600":"text-muted-foreground"}`}>{row.variance}</p></div><strong className="text-[11px]">{row.current}</strong><span className="text-[10px] text-muted-foreground">{row.previous}</span></div>)}</CardContent></Card></section><DataTableCard {...props}/></>;

  if (view === "expenses") return <><section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]"><Card><CardHeader><CardTitle>Spending by category</CardTitle><CardDescription>Where business money went this period</CardDescription></CardHeader><CardContent><div className="relative h-[250px]"><ResponsiveContainer><PieChart><Pie data={expenseReportMix} dataKey="value" innerRadius={68} outerRadius={100} paddingAngle={3} cornerRadius={5} stroke="none">{expenseReportMix.map((item,index)=><Cell key={item.name} fill={pieColors[index%pieColors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-[9px] text-muted-foreground">Total spent</p><strong className="font-display text-xl">GH₵14.5K</strong></div></div></div><div className="grid grid-cols-2 gap-2">{expenseReportMix.slice(0,4).map((item,index)=><div key={item.name} className="rounded-lg bg-muted/55 p-3"><div className="flex items-center gap-2 text-[9px] text-muted-foreground"><span className="size-2 rounded-full" style={{backgroundColor:pieColors[index]}}/>{item.name}</div><p className="mt-1 text-xs font-bold">GH₵{item.value.toLocaleString()}</p></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Vendor and category movement</CardTitle><CardDescription>Daily spending with recurring costs highlighted</CardDescription></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer><BarChart data={data}><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" tick={{fontSize:9}}/><Tooltip/><Bar dataKey="secondary" name="Expenses" fill="#ef4444" radius={[5,5,0,0]}/><Bar dataKey="primary" name="Budget" fill="#f59e0b" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card></section><DataTableCard {...props}/></>;

  if (view === "customers") return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]"><Card><CardHeader><CardTitle>Customer health profile</CardTitle><CardDescription>Value, retention, frequency, loyalty, and reach</CardDescription></CardHeader><CardContent><div className="h-[330px]"><ResponsiveContainer><RadarChart data={data.map((row,index)=>({name:["Value","Retention","Orders","Growth","Frequency","Margin","Loyalty","Reach"][index],value:row.primary}))}><PolarGrid/><PolarAngleAxis dataKey="name" tick={{fontSize:9}}/><Radar dataKey="value" fill="#7c3aed" fillOpacity={.45} stroke="#7c3aed" strokeWidth={2}/><Tooltip/></RadarChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle>Customer segments</CardTitle><CardDescription>Audience health and repeat behaviour</CardDescription></CardHeader><CardContent className="space-y-3">{customerSegments.map((segment,index)=><div key={segment.name} className="rounded-lg border p-3"><div className="flex items-center justify-between text-[11px]"><span className="font-semibold">{segment.name}</span><strong>{segment.value}%</strong></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${segment.value}%`,backgroundColor:pieColors[index%pieColors.length]}}/></div><p className="mt-2 text-[9px] text-muted-foreground">{["Highest lifetime value","Strong repeat behaviour","Growing relationship","Recently acquired","Follow-up recommended"][index]}</p></div>)}</CardContent></Card></section><DataTableCard {...props}/></>;

  if (view === "products") return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader><CardTitle>Product and service ranking</CardTitle><CardDescription>Best performers by revenue</CardDescription></CardHeader><CardContent><div className="h-[330px]"><ResponsiveContainer><BarChart data={productPerformance} layout="vertical" margin={{left:10,right:55}}><CartesianGrid horizontal={false} className="chart-grid"/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={120} tick={{fontSize:9}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" fill="#7c3aed" radius={[0,6,6,0]} barSize={28}/></BarChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle>Performance signals</CardTitle><CardDescription>What is driving product revenue</CardDescription></CardHeader><CardContent className="space-y-3">{productPerformance.slice(0,4).map((item,index)=><div key={item.name} className="flex items-center gap-3 border-b pb-3 last:border-0"><span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10">#{index+1}</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{item.name}</p><p className="text-[9px] text-muted-foreground">{index===0?"Highest margin":"Consistent performer"}</p></div><strong className="text-[11px]">GH₵{item.value.toLocaleString()}</strong></div>)}</CardContent></Card></section><DataTableCard {...props}/></>;

  if (view === "inventory") return <><section className="grid gap-4 md:grid-cols-3">{inventoryReportRows.map((row,index)=><Card key={row.name}><CardContent className="p-4"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg" style={{backgroundColor:`${pieColors[index]}14`,color:pieColors[index]}}><Package className="size-4"/></span><Badge>{row.turnover}× turnover</Badge></div><p className="mt-4 text-xs font-semibold">{row.name}</p><div className="mt-2 flex items-end justify-between"><div><p className="font-display text-xl font-bold">{row.onHand}</p><p className="text-[9px] text-muted-foreground">units on hand</p></div><strong className="text-[11px]">GH₵{row.value.toLocaleString()}</strong></div></CardContent></Card>)}</section><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><Card><CardHeader><CardTitle>Stock value and turnover</CardTitle><CardDescription>Inventory value across categories</CardDescription></CardHeader><CardContent><div className="h-[280px]"><ResponsiveContainer><BarChart data={inventoryReportRows}><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="name" tick={{fontSize:9}}/><Tooltip/><Bar dataKey="value" name="Stock value" fill="#7c3aed" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card><NotesCard config={config} title="Inventory health"/></section><DataTableCard {...props}/></>;

  if (view === "taxes") return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><Card className="overflow-hidden"><div className="bg-violet-600 p-5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-violet-100">Current filing period</p><div className="mt-3 flex items-end justify-between"><div><p className="font-display text-3xl font-bold">GH₵2,274</p><p className="mt-1 text-[10px] text-violet-100">Net tax payable</p></div><Badge className="border-white/20 bg-white/15 text-white">Due 30 Sep</Badge></div></div><CardContent className="grid grid-cols-2 gap-3 p-4"><div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10"><p className="text-[9px] text-muted-foreground">Output tax</p><p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">GH₵4,116</p></div><div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10"><p className="text-[9px] text-muted-foreground">Input tax</p><p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">GH₵1,842</p></div><div className="col-span-2 rounded-lg border p-3"><div className="flex items-center gap-2 text-[10px]"><CheckCircle2 className="size-4 text-emerald-600"/>Sales and expense records reconciled</div></div></CardContent></Card><Card><CardHeader><CardTitle>Tax position over time</CardTitle><CardDescription>Tax collected, claimable, and payable</CardDescription></CardHeader><CardContent><div className="h-[280px]"><ResponsiveContainer><AreaChart data={data}><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" tick={{fontSize:9}}/><Tooltip/><Area dataKey="primary" name="Output tax" stroke="#7c3aed" fill="#7c3aed22"/><Area dataKey="secondary" name="Input tax" stroke="#f59e0b" fill="#f59e0b22"/></AreaChart></ResponsiveContainer></div></CardContent></Card></section><DataTableCard {...props}/></>;

  return <><section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><Card><CardHeader><CardTitle>Sales performance</CardTitle><CardDescription>Revenue and order volume across the period</CardDescription></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer><AreaChart data={data}><CartesianGrid vertical={false} className="chart-grid"/><XAxis dataKey="label" tick={{fontSize:9}}/><Tooltip/><Area dataKey="primary" name="Revenue" stroke="#16a46f" fill="#16a46f26" strokeWidth={2.4}/><Area dataKey="secondary" name="Orders" stroke="#7c3aed" fill="#7c3aed1c" strokeWidth={2.2}/></AreaChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle>Sales channels</CardTitle><CardDescription>Orders and revenue by channel</CardDescription></CardHeader><CardContent className="space-y-3">{salesChannelReport.map((channel)=><div key={channel.name} className="rounded-lg border p-3"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] font-semibold"><i className="size-2 rounded-full" style={{backgroundColor:channel.color}}/>{channel.name}</span><strong className="text-[11px]">GH₵{channel.revenue.toLocaleString()}</strong></div><div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>{channel.value} orders</span><span>GH₵{Math.round(channel.revenue/channel.value)} average</span></div></div>)}</CardContent></Card></section><DataTableCard {...props}/></>;
}

function SettingsBody(props: BodyProps) {
  const icons=[Building2,ListChecks,BellRing,PlugZap];
  return <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><Card><CardHeader className="border-b"><CardTitle>{props.config.title}</CardTitle><CardDescription>Changes here affect the appropriate parts of your workspace.</CardDescription></CardHeader><CardContent className="grid gap-4 p-4 sm:grid-cols-2">{props.rows.map((row,index)=>{const Icon=icons[index%icons.length];return <div key={row[0]} className="rounded-lg border p-4"><div className="mb-4 flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"><Icon className="size-4"/></span><div><p className="text-xs font-semibold">{row[0]}</p><p className="text-[9px] text-muted-foreground">{row[2]}</p></div></div><Input defaultValue={row[1]}/><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Enabled</span><Switch defaultChecked aria-label={`Enable ${row[0]}`}/></div></div>})}</CardContent></Card><div className="space-y-4"><Card><CardHeader><CardTitle>Workspace preview</CardTitle><CardDescription>How this setup is currently applied</CardDescription></CardHeader><CardContent><div className="rounded-xl bg-violet-600 p-5 text-white"><p className="text-[10px] text-violet-100">Renaissance workspace</p><p className="mt-2 font-display text-xl font-bold">{props.config.title}</p><p className="mt-2 text-[10px] leading-5 text-violet-100">Consistent across sales, documents, reports, and team access.</p></div></CardContent></Card><NotesCard config={props.config} title="Recommendations"/></div></section>;
}

function WorkspaceNotFound({ section }: { section: string }) {
  const [mobileNav, setMobileNav] = useState(false);
  return <AppShell title="Page not found" subtitle="This workspace page is not available." mobileNavOpen={mobileNav} onMobileNavChange={setMobileNav}><Card><CardContent className="grid place-items-center py-24 text-center"><BarChart3 className="mb-3 size-8 text-violet-600"/><p className="font-semibold">Choose another {section} page</p><Button asChild className="mt-4"><Link href="/">Back to overview</Link></Button></CardContent></Card></AppShell>;
}
