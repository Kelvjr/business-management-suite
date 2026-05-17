import { Request, Response } from "express";
import {
  getProfitSummary,
  getProfitTrend,
  saveProfitSnapshot,
} from "./profit.service";

export async function fetchProfitSummary(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    res.json(
      await getProfitSummary(
        typeof startDate === "string" ? startDate : undefined,
        typeof endDate === "string" ? endDate : undefined,
      ),
    );
  } catch (error) {
    console.error("Error fetching profit summary:", error);
    res.status(500).json({ error: "Failed to fetch profit summary" });
  }
}

export async function fetchProfitTrend(req: Request, res: Response) {
  try {
    const { period, startDate, endDate } = req.query;
    res.json(
      await getProfitTrend(
        period === "weekly" || period === "monthly" ? period : "daily",
        typeof startDate === "string" ? startDate : undefined,
        typeof endDate === "string" ? endDate : undefined,
      ),
    );
  } catch (error) {
    console.error("Error fetching profit trend:", error);
    res.status(500).json({ error: "Failed to fetch profit trend" });
  }
}

export async function createProfitSnapshot(_req: Request, res: Response) {
  try {
    res.status(201).json(await saveProfitSnapshot());
  } catch (error) {
    console.error("Error creating profit snapshot:", error);
    res.status(500).json({ error: "Failed to create profit snapshot" });
  }
}

