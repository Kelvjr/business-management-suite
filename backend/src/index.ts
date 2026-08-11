import "dotenv/config";
import cors from "cors";
import express from "express";
import { Prisma } from "@prisma/client";
import { dashboardRouter, salesRouter } from "./routes/sales.js";
import { settingsRouter } from "./routes/settings.js";
import { customersRouter } from "./routes/customers.js";
import { uploadsRouter } from "./routes/uploads.js";
import { expensesRouter } from "./routes/expenses.js";
import { suiteRouter } from "./routes/suite.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "renaissance-sales-api" }));
app.use("/api/dashboard", dashboardRouter);
app.use("/api/sales", salesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/suite", suiteRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ error: "Sale not found" });
  }
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(port, () => console.log(`Sales API running on http://localhost:${port}`));
