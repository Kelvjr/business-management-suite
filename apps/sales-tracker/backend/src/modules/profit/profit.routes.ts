import { Router } from "express";
import {
  createProfitSnapshot,
  fetchProfitSummary,
  fetchProfitTrend,
} from "./profit.controller";

const router = Router();

router.get("/summary", fetchProfitSummary);
router.get("/trend", fetchProfitTrend);
router.post("/snapshots", createProfitSnapshot);

export default router;

