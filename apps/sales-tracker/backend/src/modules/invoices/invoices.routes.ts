import { Router } from "express";
import {
  addInvoice,
  editInvoice,
  fetchInvoiceById,
  fetchInvoices,
  fetchPrintableInvoice,
} from "./invoices.controller";

const router = Router();

router.get("/", fetchInvoices);
router.get("/:id", fetchInvoiceById);
router.get("/:id/print", fetchPrintableInvoice);
router.post("/", addInvoice);
router.patch("/:id", editInvoice);

export default router;

