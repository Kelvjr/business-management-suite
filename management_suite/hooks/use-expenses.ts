"use client";

import { useCallback, useEffect, useState } from "react";
import { expensesApi } from "@/lib/api";
import { makeDemoExpenses, type Expense, type ExpenseInput } from "@/lib/expenses";

const demoFallbackEnabled = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK !== "false";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]); const [loading, setLoading] = useState(true); const [demoMode, setDemoMode] = useState(false);
  useEffect(() => { expensesApi.list().then(setExpenses).catch(() => { if (demoFallbackEnabled) { setExpenses(makeDemoExpenses()); setDemoMode(true); } }).finally(() => setLoading(false)); }, []);
  const createExpense = useCallback(async (input: ExpenseInput) => { const created = demoMode ? { ...input, id: `demo-${Date.now()}`, reference: input.reference || `EXP-DEMO-${Date.now()}`, balanceDue: Math.max(0, input.amount - input.amountPaid) } as Expense : await expensesApi.create(input); setExpenses((rows) => [created, ...rows]); return created; }, [demoMode]);
  const updateExpense = useCallback(async (id: string, input: Partial<ExpenseInput>) => { if (demoMode) { setExpenses((rows) => rows.map((row) => row.id === id ? { ...row, ...input, reference: input.reference || row.reference } : row)); return; } const updated = await expensesApi.update(id, input); setExpenses((rows) => rows.map((row) => row.id === id ? updated : row)); }, [demoMode]);
  const removeExpense = useCallback(async (id: string) => { if (!demoMode) await expensesApi.remove(id); setExpenses((rows) => rows.filter((row) => row.id !== id)); }, [demoMode]);
  return { expenses, loading, demoMode, createExpense, updateExpense, removeExpense };
}
