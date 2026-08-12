import { Router } from "express";
import { catalogRouter } from "./catalog.js";
import { inventoryRouter } from "./inventory.js";
import { customerInsightsRouter } from "./customer-insights.js";
import { suppliersRouter } from "./suppliers.js";
import { purchasesRouter } from "./purchases.js";
import { invoicesRouter } from "./invoices.js";

export const suiteRouter = Router();

suiteRouter.use("/catalog", catalogRouter);
suiteRouter.use("/inventory", inventoryRouter);
suiteRouter.use("/customers", customerInsightsRouter);
suiteRouter.use("/suppliers", suppliersRouter);
suiteRouter.use("/purchases", purchasesRouter);
suiteRouter.use("/invoices", invoicesRouter);
