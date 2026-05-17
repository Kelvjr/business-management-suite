import { Router } from "express";
import {
  addReceiptForSale,
  fetchPrintableReceipt,
  fetchReceiptById,
  fetchReceipts,
} from "./receipts.controller";

const router = Router();

router.get("/", fetchReceipts);
router.get("/:id", fetchReceiptById);
router.get("/:id/print", fetchPrintableReceipt);
router.post("/", addReceiptForSale);

export default router;

