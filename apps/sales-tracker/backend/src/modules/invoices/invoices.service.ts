import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import {
  CreateInvoiceSchemaType,
  InvoiceLineItemSchemaType,
  UpdateInvoiceSchemaType,
} from "./invoices.validator";

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      businessId: DEFAULT_BUSINESS_ID,
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

function normalizeInvoiceTotals(
  lineItems: InvoiceLineItemSchemaType[],
  tax = 0,
  discount = 0,
) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, total };
}

async function getLineItemsFromSale(saleId: string): Promise<{
  sale: any;
  lineItems: InvoiceLineItemSchemaType[];
}> {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, businessId: DEFAULT_BUSINESS_ID },
    include: { customer: true, lineItems: true },
  });

  if (!sale) {
    throw Object.assign(new Error("Sale not found"), { code: "SALE_NOT_FOUND" });
  }

  const lineItems = sale.lineItems.length
    ? sale.lineItems.map((item) => ({
        description: item.itemName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
      }))
    : [
        {
          description: sale.itemName,
          quantity: sale.quantity,
          unitPrice: Number(sale.unitPrice),
          totalAmount: Number(sale.totalAmount),
        },
      ];

  return { sale, lineItems };
}

export async function getAllInvoices() {
  return prisma.invoice.findMany({
    where: { businessId: DEFAULT_BUSINESS_ID },
    include: { customer: true, sale: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findFirst({
    where: { id, businessId: DEFAULT_BUSINESS_ID },
    include: { customer: true, sale: true },
  });
}

export async function createInvoice(data: CreateInvoiceSchemaType) {
  const saleData = data.saleId ? await getLineItemsFromSale(data.saleId) : null;
  const lineItems = data.lineItems?.length
    ? data.lineItems
    : saleData?.lineItems ?? [];

  if (!lineItems.length) {
    throw Object.assign(new Error("Invoice line items are required"), {
      code: "LINE_ITEMS_REQUIRED",
    });
  }

  const { subtotal, total } = normalizeInvoiceTotals(lineItems, data.tax, data.discount);
  const sale = saleData?.sale;

  return prisma.invoice.create({
    data: {
      businessId: DEFAULT_BUSINESS_ID,
      invoiceNumber: await generateInvoiceNumber(),
      saleId: data.saleId || null,
      customerId: data.customerId || sale?.customerId || null,
      customerName: data.customerName || sale?.customer?.name || sale?.customerName || null,
      customerEmail: data.customerEmail || sale?.customer?.email || null,
      customerPhone: data.customerPhone || sale?.customer?.phone || null,
      lineItems: lineItems as any,
      subtotal,
      tax: data.tax ?? 0,
      discount: data.discount ?? 0,
      total,
      paymentStatus: data.paymentStatus ?? sale?.paymentStatus ?? "pending",
      notes: data.notes || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
}

export async function updateInvoice(id: string, data: UpdateInvoiceSchemaType) {
  const lineItems = data.lineItems;
  const totals = lineItems?.length
    ? normalizeInvoiceTotals(lineItems, data.tax, data.discount)
    : null;

  return prisma.invoice.update({
    where: { id },
    data: {
      ...(data.customerId !== undefined && { customerId: data.customerId || null }),
      ...(data.customerName !== undefined && { customerName: data.customerName || null }),
      ...(data.customerEmail !== undefined && {
        customerEmail: data.customerEmail || null,
      }),
      ...(data.customerPhone !== undefined && {
        customerPhone: data.customerPhone || null,
      }),
      ...(lineItems?.length && { lineItems: lineItems as any }),
      ...(totals && { subtotal: totals.subtotal, total: totals.total }),
      ...(data.tax !== undefined && { tax: data.tax }),
      ...(data.discount !== undefined && { discount: data.discount }),
      ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    },
  });
}

export async function getPrintableInvoice(id: string) {
  const invoice = await getInvoiceById(id);
  if (!invoice) return null;

  return {
    type: "invoice",
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.createdAt,
    dueDate: invoice.dueDate,
    customer: {
      id: invoice.customerId,
      name: invoice.customerName ?? invoice.customer?.name ?? "Customer",
      email: invoice.customerEmail ?? invoice.customer?.email,
      phone: invoice.customerPhone ?? invoice.customer?.phone,
    },
    lineItems: invoice.lineItems,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    discount: Number(invoice.discount),
    total: Number(invoice.total),
    paymentStatus: invoice.paymentStatus,
    notes: invoice.notes,
  };
}

