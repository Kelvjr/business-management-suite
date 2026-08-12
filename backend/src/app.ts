import cors from "cors";
import express from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { dashboardRouter, salesRouter } from "./routes/sales.js";
import { settingsRouter } from "./routes/settings.js";
import { customersRouter } from "./routes/customers.js";
import { storageRouter } from "./routes/storage.js";
import multer from "multer";
import { StorageValidationError } from "./storage/storage.service.js";
import { StorageConfigurationError } from "./storage/config.js";
import { expensesRouter } from "./routes/expenses.js";
import { suiteRouter } from "./routes/suite.js";
import { paymentsRouter } from "./routes/payments.js";

export const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok", service: "renaissance-sales-api" }));
app.use("/api/dashboard", dashboardRouter);
app.use("/api/sales", salesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/storage", storageRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/suite", suiteRouter);
app.use("/api/payments", paymentsRouter);
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return res.status(404).json({ error: "Record not found" });
  if (error instanceof ZodError) return res.status(400).json({ error: "Invalid request", details: error.issues });
  if (error instanceof StorageValidationError || error instanceof multer.MulterError || (error instanceof Error && error.message === "Choose a file to upload")) return res.status(400).json({ error: error.message });
  if (error instanceof StorageConfigurationError) return res.status(503).json({ error: error.message });
  if (error instanceof Error && (error.message.startsWith("Payment exceeds") || error.message.startsWith("Insufficient stock") || error.message === "Recorded payments cannot be reduced" || error.message === "Recorded payments cannot be negative" || error.message === "Received purchase orders cannot be reopened")) return res.status(409).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: "Something went wrong" });
});
