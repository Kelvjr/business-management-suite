import { Request, Response } from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getPrintableInvoice,
  updateInvoice,
} from "./invoices.service";
import { createInvoiceSchema, updateInvoiceSchema } from "./invoices.validator";

type InvoiceParams = { id: string };

export async function fetchInvoices(_req: Request, res: Response) {
  try {
    res.json(await getAllInvoices());
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
}

export async function fetchInvoiceById(req: Request<InvoiceParams>, res: Response) {
  try {
    const invoice = await getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
}

export async function fetchPrintableInvoice(req: Request<InvoiceParams>, res: Response) {
  try {
    const invoice = await getPrintableInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching printable invoice:", error);
    res.status(500).json({ error: "Failed to fetch printable invoice" });
  }
}

export async function addInvoice(req: Request, res: Response) {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }
    const invoice = await createInvoice(parsed.data);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    if (error?.code === "SALE_NOT_FOUND") {
      return res.status(404).json({ error: "Sale not found" });
    }
    if (error?.code === "LINE_ITEMS_REQUIRED") {
      return res.status(400).json({ error: "Invoice line items are required" });
    }
    res.status(500).json({ error: "Failed to create invoice" });
  }
}

export async function editInvoice(req: Request<InvoiceParams>, res: Response) {
  try {
    const parsed = updateInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }
    res.json(await updateInvoice(req.params.id, parsed.data));
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.status(500).json({ error: "Failed to update invoice" });
  }
}

