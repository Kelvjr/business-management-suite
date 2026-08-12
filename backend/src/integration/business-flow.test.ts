import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { StorageService } from "../storage/storage.service.js";
import { setStorageServiceForTests } from "../storage/index.js";
import type { StorageProvider } from "../storage/types.js";

const enabled = process.env.RUN_DATABASE_TESTS === "1";

class IntegrationStorageProvider implements StorageProvider {
  uploaded: string[] = [];
  removed: string[] = [];
  async upload(bucket: string, key: string) { this.uploaded.push(`${bucket}/${key}`); }
  async remove(bucket: string, key: string) { this.removed.push(`${bucket}/${key}`); }
  getPublicUrl(bucket: string, key: string) { return `https://public.example/${bucket}/${key}`; }
  async createSignedUrl(bucket: string, key: string) { return `https://private.example/${bucket}/${key}?signed=true`; }
}

test("complete sales, purchasing, invoicing, expense, payment, customer, and inventory flow", { skip: !enabled, timeout: 30_000 }, async () => {
  const token = `FLOW-${Date.now()}`;
  const saleReference = `SAL-${token}`;
  const storageProvider = new IntegrationStorageProvider();
  setStorageServiceForTests(new StorageService(storageProvider, { SUPABASE_PUBLIC_BUCKET: "test-public", SUPABASE_PRIVATE_BUCKET: "test-private", STORAGE_SIGNED_URL_TTL_SECONDS: 300 }));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const ids: Record<string, string> = {};

  async function request<T>(path: string, init?: RequestInit, expected = 200) {
    const response = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
    assert.equal(response.status, expected, `${init?.method ?? "GET"} ${path}`);
    if (response.status === 204) return undefined as T;
    const body = await response.json() as { data: T };
    return body.data;
  }

  async function uploadFile<T>(path: string, name: string, bytes: Uint8Array, mimeType: string, fields?: Record<string, string>) {
    const form = new FormData();
    form.append("file", new Blob([Uint8Array.from(bytes).buffer], { type: mimeType }), name);
    Object.entries(fields ?? {}).forEach(([key, value]) => form.append(key, value));
    const response = await fetch(`${base}${path}`, { method: "POST", body: form });
    assert.equal(response.status, 201, `POST ${path}`);
    return (await response.json() as { data: T }).data;
  }

  try {
    const customer = await request<{ id: string }>("/api/customers", { method: "POST", body: JSON.stringify({ name: token, email: `${token.toLowerCase()}@example.com` }) }, 201);
    ids.customer = customer.id;
    const supplier = await request<{ id: string }>("/api/suite/suppliers", { method: "POST", body: JSON.stringify({ name: token }) }, 201);
    ids.supplier = supplier.id;
    const product = await request<{ id: string }>("/api/suite/catalog", { method: "POST", body: JSON.stringify({ kind: "PRODUCT", name: token, sku: token, category: "Tests", costPrice: 5, sellingPrice: 50, quantity: 10, reorderLevel: 2 }) }, 201);
    ids.product = product.id;
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
    const firstImage = await uploadFile<{ id: string; isPrimary: boolean }>(`/api/storage/products/${product.id}/images`, "cover.png", png, "image/png");
    assert.equal(firstImage.isPrimary, true);
    const replacement = await uploadFile<{ id: string; isPrimary: boolean }>(`/api/storage/products/${product.id}/images`, "new-cover.png", png, "image/png", { replacePrimary: "true" });
    assert.equal(replacement.isPrimary, true);
    assert.notEqual(replacement.id, firstImage.id);
    assert.equal(await prisma.productImage.count({ where: { catalogItemId: product.id, isPrimary: true } }), 1);
    assert.equal(storageProvider.removed.length, 1);

    const sale = await request<{ id: string }>("/api/sales", { method: "POST", body: JSON.stringify({ reference: saleReference, customer: { id: customer.id, name: token }, description: token, category: "Tests", amount: 100, paymentMethod: "CASH", type: "PRODUCT", pricingMethod: "PER_ITEM", items: [{ catalogItemId: product.id, name: token, type: "PRODUCT", pricingMethod: "PER_ITEM", measurement: 2, unit: "item", rate: 50, lineTotal: 100, manualTotalOverride: false }], discountType: "NONE", discountValue: 0, taxRate: 0, manualTotalOverride: false, paymentStatus: "UNPAID", amountPaid: 0, soldAt: new Date().toISOString(), customFields: { source: "integration" } }) }, 201);
    ids.sale = sale.id;
    const pdf = new TextEncoder().encode("%PDF-1.7\nsmoke");
    const saleAttachment = await uploadFile<{ id: string; name: string; url: string }>(`/api/storage/sales/${sale.id}/attachments`, "proof.pdf", pdf, "application/pdf");
    assert.equal(saleAttachment.name, "proof.pdf");
    const persistedSaleFile = await prisma.saleAttachment.findUniqueOrThrow({ where: { id: saleAttachment.id } });
    assert.equal(persistedSaleFile.saleId, sale.id);
    assert.equal(persistedSaleFile.visibility, "PRIVATE");
    const openResponse = await fetch(`${base}${saleAttachment.url}`, { redirect: "manual" });
    assert.equal(openResponse.status, 302);
    assert.match(openResponse.headers.get("location") ?? "", /^https:\/\/private\.example/);
    const missingResponse = await fetch(`${base}/api/storage/sales/${sale.id}/attachments/missing/open`, { redirect: "manual" });
    assert.equal(missingResponse.status, 404);
    let inventory = await request<{ items: Array<{ id: string; quantity: number }> }>("/api/suite/inventory");
    assert.equal(inventory.items.find((item) => item.id === product.id)?.quantity, 8);

    await request(`/api/sales/${sale.id}`, { method: "PATCH", body: JSON.stringify({ items: [{ catalogItemId: product.id, name: token, type: "PRODUCT", pricingMethod: "PER_ITEM", measurement: 3, unit: "item", rate: 50, lineTotal: 150, manualTotalOverride: false }] }) });
    const editedSale = await request<{ amount: number; amountPaid: number }>(`/api/sales/${sale.id}`);
    assert.deepEqual({ amount: editedSale.amount, amountPaid: editedSale.amountPaid }, { amount: 150, amountPaid: 0 });
    inventory = await request("/api/suite/inventory");
    assert.equal(inventory.items.find((item) => item.id === product.id)?.quantity, 7);
    await request("/api/payments", { method: "POST", body: JSON.stringify({ amount: 40, method: "CASH", direction: "IN", saleId: sale.id }) }, 201);
    await request("/api/payments", { method: "POST", body: JSON.stringify({ amount: 110, method: "CARD", direction: "IN", saleId: sale.id }) }, 201);
    await request("/api/payments", { method: "POST", body: JSON.stringify({ amount: 1, method: "CASH", direction: "IN", saleId: sale.id }) }, 409);
    const paidSale = await request<{ amountPaid: number; balanceDue: number; paymentStatus: string }>(`/api/sales/${sale.id}`);
    assert.deepEqual({ amountPaid: paidSale.amountPaid, balanceDue: paidSale.balanceDue, status: paidSale.paymentStatus }, { amountPaid: 150, balanceDue: 0, status: "PAID" });

    const expense = await request<{ id: string; balanceDue: number }>("/api/expenses", { method: "POST", body: JSON.stringify({ reference: `EXP-${token}`, vendor: token, description: token, category: "Tests", amount: 80, paymentMethod: "BANK_TRANSFER", paymentStatus: "PARTIALLY_PAID", amountPaid: 30, incurredAt: new Date().toISOString(), customFields: {}, isRecurring: true, recurrence: "MONTHLY", nextDueAt: new Date(Date.now() + 86400000).toISOString() }) }, 201);
    ids.expense = expense.id;
    const expenseAttachment = await uploadFile<{ id: string }>(`/api/storage/expenses/${expense.id}/attachments`, "receipt.pdf", pdf, "application/pdf");
    assert.equal((await prisma.expenseAttachment.findUniqueOrThrow({ where: { id: expenseAttachment.id } })).expenseId, expense.id);
    await request(`/api/storage/expenses/${expense.id}/attachments/${expenseAttachment.id}`, { method: "DELETE" }, 204);
    assert.equal(await prisma.expenseAttachment.count({ where: { id: expenseAttachment.id } }), 0);
    assert.equal(expense.balanceDue, 50);
    const updatedExpense = await request<{ balanceDue: number }>(`/api/expenses/${expense.id}`, { method: "PATCH", body: JSON.stringify({ paymentStatus: "PAID" }) });
    assert.equal(updatedExpense.balanceDue, 0);

    const purchase = await request<{ id: string }>("/api/suite/purchases", { method: "POST", body: JSON.stringify({ supplierId: supplier.id, catalogItemId: product.id, quantity: 5, unitCost: 10, status: "ORDERED", amountPaid: 10 }) }, 201);
    ids.purchase = purchase.id;
    await request(`/api/suite/purchases/${purchase.id}`, { method: "PATCH", body: JSON.stringify({ status: "RECEIVED", amountPaid: 25 }) });
    await request(`/api/suite/purchases/${purchase.id}`, { method: "PATCH", body: JSON.stringify({ amountPaid: 50 }) });
    const purchases = await request<Array<{ id: string; amountPaid: number; payments: unknown[] }>>("/api/suite/purchases");
    const completedPurchase = purchases.find((item) => item.id === purchase.id)!;
    assert.equal(completedPurchase.amountPaid, 50);
    assert.equal(completedPurchase.payments.length, 3);
    inventory = await request("/api/suite/inventory");
    assert.equal(inventory.items.find((item) => item.id === product.id)?.quantity, 12);

    const invoice = await request<{ id: string }>("/api/suite/invoices", { method: "POST", body: JSON.stringify({ customerId: customer.id, customerName: token, description: token, quantity: 2, rate: 50, taxRate: 0, dueAt: new Date(Date.now() + 86400000).toISOString() }) }, 201);
    ids.invoice = invoice.id;
    for (const amount of [30, 20, 50]) await request("/api/payments", { method: "POST", body: JSON.stringify({ amount, method: "MOBILE_MONEY", direction: "IN", invoiceId: invoice.id }) }, 201);
    await request("/api/payments", { method: "POST", body: JSON.stringify({ amount: 1, method: "CASH", direction: "IN", invoiceId: invoice.id }) }, 409);
    const invoices = await request<Array<{ id: string; status: string; amountPaid: number; payments: unknown[] }>>("/api/suite/invoices");
    const paidInvoice = invoices.find((item) => item.id === invoice.id)!;
    assert.deepEqual({ status: paidInvoice.status, amountPaid: paidInvoice.amountPaid, payments: paidInvoice.payments.length }, { status: "PAID", amountPaid: 100, payments: 3 });
    await request(`/api/suite/invoices/${invoice.id}`, { method: "DELETE" }, 409);

    const insights = await request<Array<{ id: string; invoiceTotal: number; outstandingBalance: number; paymentTotal: number }>>("/api/suite/customers");
    const insight = insights.find((item) => item.id === customer.id)!;
    assert.equal(insight.invoiceTotal, 100);
    assert.equal(insight.outstandingBalance, 0);
    assert.equal(insight.paymentTotal, 250);

    await request(`/api/sales/${sale.id}`, { method: "DELETE" }, 204);
    delete ids.sale;
    inventory = await request("/api/suite/inventory");
    assert.equal(inventory.items.find((item) => item.id === product.id)?.quantity, 15);
  } finally {
    await prisma.payment.deleteMany({ where: { OR: [{ reference: { contains: token } }, { invoiceId: ids.invoice }, { purchaseId: ids.purchase }, { saleId: ids.sale }] } });
    if (ids.invoice) await prisma.invoice.deleteMany({ where: { id: ids.invoice } });
    if (ids.purchase) await prisma.purchase.deleteMany({ where: { id: ids.purchase } });
    if (ids.sale) await prisma.sale.deleteMany({ where: { id: ids.sale } });
    if (ids.expense) await prisma.expense.deleteMany({ where: { id: ids.expense } });
    await prisma.inventoryMovement.deleteMany({ where: { reference: { contains: token } } });
    if (ids.product) await prisma.catalogItem.deleteMany({ where: { id: ids.product } });
    if (ids.supplier) await prisma.supplier.deleteMany({ where: { id: ids.supplier } });
    if (ids.customer) await prisma.customer.deleteMany({ where: { id: ids.customer } });
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    setStorageServiceForTests(undefined);
  }
});
