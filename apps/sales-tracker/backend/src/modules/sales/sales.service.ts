import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import {
  CreateSaleSchemaType,
  SaleLineItemSchemaType,
  UpdateSaleSchemaType,
} from "./sales.validator";

type GetSalesFilters = {
  itemType?: string;
  category?: string;
  paymentStatus?: string;
  customerName?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export async function getAllSales(filters?: GetSalesFilters) {
  const where: any = {
    businessId: DEFAULT_BUSINESS_ID,
  };

  if (filters?.itemType) {
    where.itemType = filters.itemType;
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters?.customerName) {
    where.customerName = {
      contains: filters.customerName,
      mode: "insensitive",
    };
  }

  if (filters?.search) {
    where.OR = [
      {
        itemName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        category: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        subcategory: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        customerName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        notes: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters?.startDate || filters?.endDate) {
    where.soldAt = {};

    if (filters.startDate) {
      where.soldAt.gte = new Date(`${filters.startDate}T00:00:00.000Z`);
    }

    if (filters.endDate) {
      where.soldAt.lte = new Date(`${filters.endDate}T23:59:59.999Z`);
    }
  }

  return prisma.sale.findMany({
    where,
    include: {
      customer: true,
      lineItems: true,
    },
    orderBy: {
      soldAt: "desc",
    },
  });
}

export async function getSaleById(id: string) {
  return prisma.sale.findFirst({
    where: { id, businessId: DEFAULT_BUSINESS_ID },
    include: {
      customer: true,
      lineItems: true,
      invoices: true,
      receipts: true,
    },
  });
}

function buildFallbackLineItem(data: CreateSaleSchemaType): SaleLineItemSchemaType {
  return {
    itemType: data.itemType,
    itemName: data.itemName,
    category: data.category,
    subcategory: data.subcategory,
    quantity: data.quantity ?? 1,
    unitPrice: data.unitPrice,
    totalAmount: data.totalAmount,
  };
}

export async function createSale(data: CreateSaleSchemaType) {
  const lineItems = data.lineItems?.length ? data.lineItems : [buildFallbackLineItem(data)];
  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const primaryItem = lineItems[0];

  return prisma.sale.create({
    data: {
      businessId: DEFAULT_BUSINESS_ID,
      customerId: data.customerId || null,
      itemType: primaryItem.itemType,
      itemName: primaryItem.itemName,
      category: primaryItem.category,
      subcategory: primaryItem.subcategory,
      quantity: primaryItem.quantity ?? 1,
      unitPrice: primaryItem.unitPrice,
      totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus ?? "paid",
      salesChannel: data.salesChannel,
      customerName: data.customerName,
      notes: data.notes,
      soldAt: data.soldAt ? new Date(data.soldAt) : new Date(),
      lineItems: {
        create: lineItems.map((item) => ({
          itemType: item.itemType,
          itemName: item.itemName,
          category: item.category,
          subcategory: item.subcategory,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
        })),
      },
    },
    include: {
      customer: true,
      lineItems: true,
    },
  });
}

export async function updateSale(id: string, data: UpdateSaleSchemaType) {
  const lineItems = data.lineItems;
  const totalAmount = lineItems?.length
    ? lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0)
    : data.totalAmount;
  const primaryItem = lineItems?.[0];

  return prisma.$transaction(async (tx) => {
    if (lineItems?.length) {
      await tx.saleLineItem.deleteMany({ where: { saleId: id } });
    }

    return tx.sale.update({
      where: { id },
      data: {
        ...(primaryItem?.itemType !== undefined && { itemType: primaryItem.itemType }),
        ...(primaryItem?.itemName !== undefined && { itemName: primaryItem.itemName }),
        ...(primaryItem?.category !== undefined && { category: primaryItem.category }),
        ...(primaryItem?.subcategory !== undefined && {
          subcategory: primaryItem.subcategory,
        }),
        ...(primaryItem?.quantity !== undefined && { quantity: primaryItem.quantity }),
        ...(primaryItem?.unitPrice !== undefined && { unitPrice: primaryItem.unitPrice }),
        ...(data.itemType !== undefined && !primaryItem && { itemType: data.itemType }),
        ...(data.itemName !== undefined && !primaryItem && { itemName: data.itemName }),
        ...(data.category !== undefined && !primaryItem && { category: data.category }),
        ...(data.subcategory !== undefined && !primaryItem && {
          subcategory: data.subcategory,
        }),
        ...(data.quantity !== undefined && !primaryItem && { quantity: data.quantity }),
        ...(data.unitPrice !== undefined && !primaryItem && { unitPrice: data.unitPrice }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(data.customerId !== undefined && { customerId: data.customerId || null }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.paymentStatus !== undefined && {
          paymentStatus: data.paymentStatus,
        }),
        ...(data.salesChannel !== undefined && {
          salesChannel: data.salesChannel,
        }),
        ...(data.customerName !== undefined && {
          customerName: data.customerName,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.soldAt !== undefined && {
          soldAt: data.soldAt ? new Date(data.soldAt) : undefined,
        }),
        ...(lineItems?.length && {
          lineItems: {
            create: lineItems.map((item) => ({
              itemType: item.itemType,
              itemName: item.itemName,
              category: item.category,
              subcategory: item.subcategory,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice,
              totalAmount: item.totalAmount,
            })),
          },
        }),
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  });
}

export async function deleteSale(id: string) {
  return prisma.sale.delete({
    where: { id },
  });
}

export function getDateRange(startDate?: string, endDate?: string) {
  const where: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    where.gte = new Date(`${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    where.lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  return Object.keys(where).length ? where : undefined;
}

export async function getSalesTotals(startDate?: string, endDate?: string) {
  const result = await prisma.sale.aggregate({
    where: {
      businessId: DEFAULT_BUSINESS_ID,
      ...(startDate || endDate
        ? { soldAt: getDateRange(startDate, endDate) }
        : {}),
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  return {
    revenue: Number(result._sum.totalAmount ?? 0),
    salesCount: result._count,
  };
}

export async function getSalesSummary() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allSales, todaySales, weekSales, monthSales] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: DEFAULT_BUSINESS_ID },
      select: { totalAmount: true },
    }),
    prisma.sale.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        soldAt: {
          gte: startOfToday,
        },
      },
      select: { totalAmount: true },
    }),
    prisma.sale.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        soldAt: {
          gte: startOfWeek,
        },
      },
      select: { totalAmount: true },
    }),
    prisma.sale.findMany({
      where: {
        businessId: DEFAULT_BUSINESS_ID,
        soldAt: {
          gte: startOfMonth,
        },
      },
      select: { totalAmount: true },
    }),
  ]);

  const sumAmounts = (sales: { totalAmount: any }[]) =>
    sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return {
    totalRevenue: sumAmounts(allSales),
    salesToday: sumAmounts(todaySales),
    salesThisWeek: sumAmounts(weekSales),
    salesThisMonth: sumAmounts(monthSales),
    totalSalesCount: allSales.length,
    todaySalesCount: todaySales.length,
    weekSalesCount: weekSales.length,
    monthSalesCount: monthSales.length,
  };
}
