import { Router } from "express";
import { ZodError } from "zod";
import { createExpense, deleteExpense, getExpense, listExpenses, updateExpense } from "../services/expenses.service.js";
import { expenseInputSchema, expenseUpdateSchema } from "../validators/expense.js";

export const expensesRouter = Router();
expensesRouter.get("/", async (req, res, next) => { try { res.json({ data: await listExpenses({ search: typeof req.query.search === "string" ? req.query.search : undefined, from: typeof req.query.from === "string" ? new Date(req.query.from) : undefined, to: typeof req.query.to === "string" ? new Date(req.query.to) : undefined }) }); } catch (error) { next(error); } });
expensesRouter.get("/:id", async (req, res, next) => { try { res.json({ data: await getExpense(req.params.id) }); } catch (error) { next(error); } });
expensesRouter.post("/", async (req, res, next) => { try { res.status(201).json({ data: await createExpense(expenseInputSchema.parse(req.body)) }); } catch (error) { next(error); } });
expensesRouter.patch("/:id", async (req, res, next) => { try { res.json({ data: await updateExpense(req.params.id, expenseUpdateSchema.parse(req.body)) }); } catch (error) { next(error); } });
expensesRouter.delete("/:id", async (req, res, next) => { try { await deleteExpense(req.params.id); res.status(204).send(); } catch (error) { next(error); } });
expensesRouter.use((error: unknown, _req: unknown, res: import("express").Response, _next: unknown) => { if (error instanceof ZodError) return res.status(400).json({ error: "Invalid expense data", details: error.issues }); throw error; });
