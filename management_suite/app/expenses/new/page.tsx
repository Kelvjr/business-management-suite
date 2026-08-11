import type { Metadata } from "next";
import { RecordExpensePageContent } from "@/components/expenses/record-expense-page-content";
export const metadata: Metadata = { title: "Record expense | Renaissance" };
export default function RecordExpensePage() { return <RecordExpensePageContent />; }
