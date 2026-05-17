import { prisma } from "../../lib/prisma";
import { DEFAULT_BUSINESS_ID } from "../../core/context";
import {
  CreateCustomerSchemaType,
  UpdateCustomerSchemaType,
} from "./customers.validator";

export async function getAllCustomers() {
  return prisma.customer.findMany({
    where: { businessId: DEFAULT_BUSINESS_ID },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findFirst({
    where: { id, businessId: DEFAULT_BUSINESS_ID },
    include: {
      sales: {
        orderBy: { soldAt: "desc" },
        include: { lineItems: true },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getCustomerPurchaseSummary(id: string) {
  const [customer, totals] = await Promise.all([
    getCustomerById(id),
    prisma.sale.aggregate({
      where: { customerId: id, businessId: DEFAULT_BUSINESS_ID },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return {
    customer,
    totalSpend: Number(totals._sum.totalAmount ?? 0),
    purchaseCount: totals._count,
  };
}

export async function createCustomer(data: CreateCustomerSchemaType) {
  return prisma.customer.create({
    data: {
      businessId: DEFAULT_BUSINESS_ID,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      businessName: data.businessName || null,
      notes: data.notes || null,
    },
  });
}

export async function updateCustomer(id: string, data: UpdateCustomerSchemaType) {
  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.businessName !== undefined && {
        businessName: data.businessName || null,
      }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  });
}
