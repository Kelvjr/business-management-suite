import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";

async function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.receipt.count({
    where: {
      businessId: DEFAULT_BUSINESS_ID,
      generatedAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
      },
    },
  });
  return `RCT-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function getAllReceipts() {
  return prisma.receipt.findMany({
    where: { businessId: DEFAULT_BUSINESS_ID },
    include: { sale: { include: { lineItems: true, customer: true } } },
    orderBy: { generatedAt: "desc" },
  });
}

export async function getReceiptById(id: string) {
  return prisma.receipt.findFirst({
    where: { id, businessId: DEFAULT_BUSINESS_ID },
    include: { sale: { include: { lineItems: true, customer: true } } },
  });
}

export async function createReceiptForSale(saleId: string) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, businessId: DEFAULT_BUSINESS_ID },
  });

  if (!sale) {
    throw Object.assign(new Error("Sale not found"), { code: "SALE_NOT_FOUND" });
  }

  return prisma.receipt.create({
    data: {
      businessId: DEFAULT_BUSINESS_ID,
      saleId,
      receiptNumber: await generateReceiptNumber(),
      amount: sale.totalAmount,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
    },
  });
}

export async function getPrintableReceipt(id: string) {
  const receipt = await getReceiptById(id);
  if (!receipt) return null;

  return {
    type: "receipt",
    receiptNumber: receipt.receiptNumber,
    generatedAt: receipt.generatedAt,
    paymentStatus: receipt.paymentStatus,
    paymentMethod: receipt.paymentMethod,
    amount: Number(receipt.amount),
    sale: {
      id: receipt.sale.id,
      soldAt: receipt.sale.soldAt,
      customerName:
        receipt.sale.customer?.name ?? receipt.sale.customerName ?? "Walk-in",
      lineItems: receipt.sale.lineItems.length
        ? receipt.sale.lineItems
        : [
            {
              itemName: receipt.sale.itemName,
              quantity: receipt.sale.quantity,
              unitPrice: receipt.sale.unitPrice,
              totalAmount: receipt.sale.totalAmount,
            },
          ],
    },
  };
}

