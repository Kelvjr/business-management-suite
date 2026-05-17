import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import salesRoutes from "./modules/sales/sales.routes";
import customersRoutes from "./modules/customers/customers.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import expensesRoutes from "./modules/expenses/expenses.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import receiptsRoutes from "./modules/receipts/receipts.routes";
import profitRoutes from "./modules/profit/profit.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import internalRoutes from "./modules/internal/internal.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "Sales Tracker API is running" });
});

app.get("/api/v1/health", (_req, res) => {
  res.json({
    message: "Sales Tracker API is running",
    version: "v1",
  });
});

app.use("/api/sales", salesRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/receipts", receiptsRoutes);
app.use("/api/profit", profitRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/dashboard", reportsRoutes);
app.use("/api/internal", internalRoutes);

app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/customers", customersRoutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/invoices", invoicesRoutes);
app.use("/api/v1/receipts", receiptsRoutes);
app.use("/api/v1/profit", profitRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/dashboard", reportsRoutes);
app.use("/api/v1/internal", internalRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
