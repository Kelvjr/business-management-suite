import type { Customer, Sale, SaleAttachment, SaleInput } from "@/lib/sales";
import type { Expense, ExpenseInput } from "@/lib/expenses";
import type { CatalogImage, CatalogItem, CustomerInsight, InventoryMovement, Invoice, Purchase, Supplier } from "@/lib/suite";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const apiFileUrl = (path: string) => path.startsWith("http") ? path : `${API_URL.replace(/\/api$/, "")}${path}`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json();
  return result.data as T;
}

export const salesApi = {
  list: () => request<Sale[]>("/sales"),
  get: (id: string) => request<Sale>(`/sales/${id}`),
  create: (input: SaleInput) => request<Sale>("/sales", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<SaleInput>) => request<Sale>(`/sales/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/sales/${id}`, { method: "DELETE" }),
};

export const expensesApi = {
  list: () => request<Expense[]>("/expenses"),
  get: (id: string) => request<Expense>(`/expenses/${id}`),
  create: (input: ExpenseInput) => request<Expense>("/expenses", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<ExpenseInput>) => request<Expense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/expenses/${id}`, { method: "DELETE" }),
};

export const suiteApi = {
  catalog: () => request<CatalogItem[]>("/suite/catalog"),
  createCatalog: (input: Omit<CatalogItem,"id"|"active"|"_count"|"images">) => request<CatalogItem>("/suite/catalog", { method:"POST", body:JSON.stringify(input) }),
  updateCatalog: (id:string,input:Partial<CatalogItem>) => request<CatalogItem>(`/suite/catalog/${id}`, { method:"PATCH", body:JSON.stringify(input) }),
  removeCatalog: (id:string) => request<void>(`/suite/catalog/${id}`, { method:"DELETE" }),
  inventory: () => request<{items:CatalogItem[];movements:InventoryMovement[]}>("/suite/inventory"),
  moveStock: (input:{catalogItemId:string;type:InventoryMovement["type"];quantity:number;reference?:string;notes?:string}) => request<InventoryMovement>("/suite/inventory/movements", { method:"POST", body:JSON.stringify(input) }),
  customerInsights: () => request<CustomerInsight[]>("/suite/customers"),
  suppliers: () => request<Supplier[]>("/suite/suppliers"),
  createSupplier: (input:Partial<Supplier>) => request<Supplier>("/suite/suppliers",{method:"POST",body:JSON.stringify(input)}),
  updateSupplier: (id:string,input:Partial<Supplier>) => request<Supplier>(`/suite/suppliers/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  removeSupplier: (id:string) => request<void>(`/suite/suppliers/${id}`,{method:"DELETE"}),
  purchases: () => request<Purchase[]>("/suite/purchases"),
  createPurchase: (input:{supplierId:string;catalogItemId:string;quantity:number;unitCost:number;status:string;amountPaid:number;dueAt?:string|null;notes?:string|null}) => request<Purchase>("/suite/purchases",{method:"POST",body:JSON.stringify(input)}),
  updatePurchase: (id:string,input:{status?:string;amountPaid?:number;dueAt?:string|null;notes?:string|null}) => request<Purchase>(`/suite/purchases/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  removePurchase: (id:string) => request<void>(`/suite/purchases/${id}`,{method:"DELETE"}),
  invoices: () => request<Invoice[]>("/suite/invoices"),
  createInvoice: (input:{customerId?:string|null;customerName:string;description:string;quantity:number;rate:number;dueAt:string;taxRate:number;notes?:string|null}) => request<Invoice>("/suite/invoices",{method:"POST",body:JSON.stringify(input)}),
  updateInvoice: (id:string,input:{customerName?:string;status?:Invoice["status"];amountPaid?:number;dueAt?:string;notes?:string|null}) => request<Invoice>(`/suite/invoices/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  removeInvoice: (id:string) => request<void>(`/suite/invoices/${id}`,{method:"DELETE"}),
};

export type Payment = {
  id: string; amount: number; method: "CASH"|"CARD"|"BANK_TRANSFER"|"MOBILE_MONEY"|"OTHER";
  direction: "IN"|"OUT"; paidAt: string; reference?: string|null; notes?: string|null;
  invoiceId?: string|null; saleId?: string|null; purchaseId?: string|null;
  customer?: {id:string;name:string}|null; supplier?: {id:string;name:string}|null;
  invoice?: {id:string;reference:string}|null; sale?: {id:string;reference:string}|null; purchase?: {id:string;reference:string}|null;
};

export const paymentsApi = {
  list: (direction?: Payment["direction"]) => request<Payment[]>(`/payments${direction ? `?direction=${direction}` : ""}`),
  create: (input: Omit<Payment,"id"|"paidAt"> & { paidAt?: string }) => request<Payment>("/payments", { method: "POST", body: JSON.stringify(input) }),
};

export type BusinessSettings = {
  id?: string;
  businessName: string;
  currency: "USD" | "GBP" | "EUR" | "NGN" | "GHS" | "KES" | "ZAR";
  timezone: string;
  weekStartsOn: number;
  emailReports: boolean;
  saleNotifications: boolean;
  salesCustomFields: Array<{ id: string; label: string; required: boolean }>;
};

export const settingsApi = {
  get: () => request<BusinessSettings>("/settings"),
  update: (input: BusinessSettings) => request<BusinessSettings>("/settings", { method: "PUT", body: JSON.stringify(input) }),
};

export const customersApi = {
  list: () => request<Customer[]>("/customers"),
  create: (input: { name: string; phone?: string; email?: string; address?:string; birthday?:string|null; notes?:string }) => request<Customer>("/customers", { method: "POST", body: JSON.stringify(input) }),
  update: (id:string,input:Partial<Customer>) => request<Customer>(`/customers/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  remove: (id:string) => request<void>(`/customers/${id}`,{method:"DELETE"}),
};

async function uploadFile<T>(path: string, file: File, fields?: Record<string, string>): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  Object.entries(fields ?? {}).forEach(([key, value]) => form.append(key, value));
  const response = await fetch(`${API_URL}${path}`, { method: "POST", body: form });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "Upload failed");
  }
  const result = await response.json();
  return result.data as T;
}

export const storageApi = {
  uploadSaleAttachment: (saleId: string, file: File) => uploadFile<SaleAttachment>(`/storage/sales/${saleId}/attachments`, file),
  uploadExpenseAttachment: (expenseId: string, file: File) => uploadFile<SaleAttachment>(`/storage/expenses/${expenseId}/attachments`, file),
  removeSaleAttachment: (saleId: string, attachmentId: string) => request<void>(`/storage/sales/${saleId}/attachments/${attachmentId}`, { method: "DELETE" }),
  removeExpenseAttachment: (expenseId: string, attachmentId: string) => request<void>(`/storage/expenses/${expenseId}/attachments/${attachmentId}`, { method: "DELETE" }),
  uploadProductImage: (productId: string, file: File, options?: { replacePrimary?: boolean; isPrimary?: boolean }) => uploadFile<CatalogImage>(`/storage/products/${productId}/images`, file, { replacePrimary: String(Boolean(options?.replacePrimary)), isPrimary: String(Boolean(options?.isPrimary)) }),
  removeProductImage: (productId: string, imageId: string) => request<void>(`/storage/products/${productId}/images/${imageId}`, { method: "DELETE" }),
};
