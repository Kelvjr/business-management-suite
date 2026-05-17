import { Router } from "express";
import { exportReport, fetchBusinessOverview } from "./reports.controller";

const router = Router();

router.get("/overview", fetchBusinessOverview);
router.get("/exports/:type", exportReport);

export default router;

