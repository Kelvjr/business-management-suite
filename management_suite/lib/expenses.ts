import type { PaymentMethod, PaymentStatus, SaleAttachment } from "@/lib/sales";

export type Expense = {
  id: string; reference: string; vendor?: string | null; description: string; category: string;
  amount: number; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; amountPaid: number; balanceDue: number;
  incurredAt: string; notes?: string | null; customFields: Record<string, string>; attachments: SaleAttachment[];
  isRecurring?: boolean; recurrence?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | null; nextDueAt?: string | null;
  activity?: Array<{ id: string; action: string; summary: string; createdAt: string }>;
};

export type ExpenseInput = Omit<Expense, "id" | "reference" | "balanceDue" | "activity"> & { reference?: string | null };

export const expenseCategories = ["Inventory & supplies", "Rent & utilities", "Transport", "Marketing", "Payroll", "Equipment", "Professional services", "Taxes & fees", "Meals", "Other"];

export function makeDemoExpenses(): Expense[] {
  const today = new Date();
  return [
    ["Market produce stock", "Inventory & supplies", 820, "Makola supplier", 0],
    ["Shop electricity", "Rent & utilities", 430, "ECG", 2],
    ["Delivery fuel", "Transport", 280, "Shell", 4],
    ["Instagram campaign", "Marketing", 650, "Meta", 8],
  ].map(([description, category, amount, vendor, days], index) => { const date = new Date(today); date.setDate(date.getDate() - Number(days)); return { id: `expense-demo-${index}`, reference: `EXP-DEMO-${index + 1}`, vendor: String(vendor), description: String(description), category: String(category), amount: Number(amount), paymentMethod: index % 2 ? "MOBILE_MONEY" : "CASH", paymentStatus: "PAID", amountPaid: Number(amount), balanceDue: 0, incurredAt: date.toISOString(), notes: null, customFields: {}, attachments: [] }; });
}
