import type { Customer, Sale, SaleAttachment, SaleInput } from "@/lib/sales";
import type { Expense, ExpenseInput } from "@/lib/expenses";
import type { CatalogItem, CustomerInsight, InventoryMovement, Invoice, Purchase, Supplier } from "@/lib/suite";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
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
  createCatalog: (input: Omit<CatalogItem,"id"|"active"|"_count">) => request<CatalogItem>("/suite/catalog", { method:"POST", body:JSON.stringify(input) }),
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
  createInvoice: (input:{customerName:string;description:string;quantity:number;rate:number;dueAt:string;taxRate:number;notes?:string|null}) => request<Invoice>("/suite/invoices",{method:"POST",body:JSON.stringify(input)}),
  updateInvoice: (id:string,input:{customerName?:string;status?:Invoice["status"];amountPaid?:number;dueAt?:string;notes?:string|null}) => request<Invoice>(`/suite/invoices/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  removeInvoice: (id:string) => request<void>(`/suite/invoices/${id}`,{method:"DELETE"}),
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

export async function uploadSaleFile(file: File): Promise<SaleAttachment> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/uploads`, { method: "POST", body: form });
  if (!response.ok) throw new Error("Upload failed");
  const result = await response.json();
  return result.data as SaleAttachment;
}
