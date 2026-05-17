import { Request, Response } from "express";
import {
  buildExportRows,
  getBusinessOverview,
  rowsToDelimited,
} from "./reports.service";

function getFilters(req: Request) {
  const { startDate, endDate } = req.query;
  return {
    startDate: typeof startDate === "string" ? startDate : undefined,
    endDate: typeof endDate === "string" ? endDate : undefined,
  };
}

export async function fetchBusinessOverview(req: Request, res: Response) {
  try {
    res.json(await getBusinessOverview(getFilters(req)));
  } catch (error) {
    console.error("Error fetching business overview:", error);
    res.status(500).json({ error: "Failed to fetch business overview" });
  }
}

export async function exportReport(req: Request, res: Response) {
  try {
    const type = req.params.type as "sales" | "expenses" | "profit" | "tax-summary";
    if (!["sales", "expenses", "profit", "tax-summary"].includes(type)) {
      return res.status(400).json({ error: "Unsupported export type" });
    }

    const format = req.query.format === "excel" ? "excel" : "csv";
    const rows = await buildExportRows(type, getFilters(req));
    const delimiter = format === "excel" ? "\t" : ",";
    const body = rowsToDelimited(rows, delimiter);
    const extension = format === "excel" ? "xls" : "csv";
    const contentType =
      format === "excel" ? "application/vnd.ms-excel" : "text/csv";

    res.setHeader("Content-Type", `${contentType}; charset=utf-8`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}-export.${extension}"`,
    );
    res.send(body);
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ error: "Failed to export report" });
  }
}

