import { Request, Response } from "express";
import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  getExpenseById,
  getExpenseSummary,
  updateExpense,
} from "./expenses.service";
import { createExpenseSchema, updateExpenseSchema } from "./expenses.validator";

type ExpenseParams = { id: string };

export async function fetchExpenses(req: Request, res: Response) {
  try {
    const { category, recurring, search, startDate, endDate } = req.query;
    const expenses = await getAllExpenses({
      category: typeof category === "string" ? category : undefined,
      recurring: typeof recurring === "string" ? recurring : undefined,
      search: typeof search === "string" ? search : undefined,
      startDate: typeof startDate === "string" ? startDate : undefined,
      endDate: typeof endDate === "string" ? endDate : undefined,
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
}

export async function fetchExpenseById(req: Request<ExpenseParams>, res: Response) {
  try {
    const expense = await getExpenseById(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
}

export async function fetchExpenseSummary(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const summary = await getExpenseSummary(
      typeof startDate === "string" ? startDate : undefined,
      typeof endDate === "string" ? endDate : undefined,
    );
    res.json(summary);
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({ error: "Failed to fetch expense summary" });
  }
}

export async function addExpense(req: Request, res: Response) {
  try {
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }
    const expense = await createExpense(parsed.data);
    res.status(201).json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
}

export async function editExpense(req: Request<ExpenseParams>, res: Response) {
  try {
    const parsed = updateExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }
    const expense = await updateExpense(req.params.id, parsed.data);
    res.json(expense);
  } catch (error: any) {
    console.error("Error updating expense:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(500).json({ error: "Failed to update expense" });
  }
}

export async function removeExpense(req: Request<ExpenseParams>, res: Response) {
  try {
    await deleteExpense(req.params.id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(500).json({ error: "Failed to delete expense" });
  }
}

