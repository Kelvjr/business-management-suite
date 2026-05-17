import { Request, Response } from "express";
import {
  createReceiptForSale,
  getAllReceipts,
  getPrintableReceipt,
  getReceiptById,
} from "./receipts.service";

type ReceiptParams = { id: string };

export async function fetchReceipts(_req: Request, res: Response) {
  try {
    res.json(await getAllReceipts());
  } catch (error) {
    console.error("Error fetching receipts:", error);
    res.status(500).json({ error: "Failed to fetch receipts" });
  }
}

export async function fetchReceiptById(req: Request<ReceiptParams>, res: Response) {
  try {
    const receipt = await getReceiptById(req.params.id);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    res.json(receipt);
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
}

export async function fetchPrintableReceipt(req: Request<ReceiptParams>, res: Response) {
  try {
    const receipt = await getPrintableReceipt(req.params.id);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    res.json(receipt);
  } catch (error) {
    console.error("Error fetching printable receipt:", error);
    res.status(500).json({ error: "Failed to fetch printable receipt" });
  }
}

export async function addReceiptForSale(req: Request, res: Response) {
  try {
    const saleId = req.body?.saleId;
    if (!saleId || typeof saleId !== "string") {
      return res.status(400).json({ error: "saleId is required" });
    }
    res.status(201).json(await createReceiptForSale(saleId));
  } catch (error: any) {
    console.error("Error creating receipt:", error);
    if (error?.code === "SALE_NOT_FOUND") {
      return res.status(404).json({ error: "Sale not found" });
    }
    res.status(500).json({ error: "Failed to create receipt" });
  }
}

