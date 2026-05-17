import { Router } from "express";
import {
  addSale,
  editSale,
  fetchSaleById,
  fetchSales,
  fetchSalesSummary,
  removeSale,
} from "./sales.controller";

const router = Router();

router.get("/summary", fetchSalesSummary);
router.get("/", fetchSales);
router.get("/:id", fetchSaleById);
router.post("/", addSale);
router.patch("/:id", editSale);
router.delete("/:id", removeSale);

export default router;
