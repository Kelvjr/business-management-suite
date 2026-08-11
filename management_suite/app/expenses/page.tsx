import type { Metadata } from "next";
import { ExpensesPageContent } from "@/components/expenses/expenses-page-content";
export const metadata: Metadata = { title: "Expenses | Renaissance" };
export default function ExpensesPage() { return <ExpensesPageContent />; }
