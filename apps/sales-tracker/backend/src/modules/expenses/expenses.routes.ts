import { Router } from "express";
import {
  addExpense,
  editExpense,
  fetchExpenseById,
  fetchExpenseSummary,
  fetchExpenses,
  removeExpense,
} from "./expenses.controller";

const router = Router();

router.get("/summary", fetchExpenseSummary);
router.get("/", fetchExpenses);
router.get("/:id", fetchExpenseById);
router.post("/", addExpense);
router.patch("/:id", editExpense);
router.delete("/:id", removeExpense);

export default router;

