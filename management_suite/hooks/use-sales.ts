"use client";

import { useEffect, useState } from "react";
import { salesApi } from "@/lib/api";
import { makeDemoSales, type Sale, type SaleInput } from "@/lib/sales";

const demoFallbackEnabled = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK !== "false";

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    salesApi.list().then(setSales).catch(() => {
      if (demoFallbackEnabled) { setSales(makeDemoSales()); setDemoMode(true); }
    }).finally(() => setLoading(false));
  }, []);

  const createSale = async (input: SaleInput) => {
    if (demoMode) {
      const created: Sale = { ...input, id: `demo-${Date.now()}`, reference: input.reference || `SAL-${new Date().getFullYear()}-${String(1250 + sales.length).padStart(4, "0")}`, customerName: input.customer?.name ?? input.customerName ?? null, customer: input.customer ? { ...input.customer, id: input.customer.id ?? `demo-customer-${Date.now()}` } : null };
      setSales((current) => [created, ...current]);
      return created;
    }
    const created = await salesApi.create(input);
    setSales((current) => [created, ...current]);
    return created;
  };

  const updateSale = async (id: string, input: SaleInput) => {
    if (demoMode) {
      const existing = sales.find((sale) => sale.id === id);
      if (!existing) throw new Error("Sale not found");
      const updated: Sale = { ...existing, ...input, id: existing.id, reference: input.reference || existing.reference, customerName: input.customer?.name ?? input.customerName ?? existing.customerName, customer: input.customer ? { ...input.customer, id: input.customer.id ?? existing.customer?.id ?? `demo-customer-${Date.now()}` } : existing.customer };
      setSales((current) => current.map((sale) => sale.id === id ? updated : sale));
      return updated;
    }
    const updated = await salesApi.update(id, input);
    setSales((current) => current.map((sale) => sale.id === id ? updated : sale));
    return updated;
  };

  const removeSale = async (id: string) => {
    if (!demoMode) await salesApi.remove(id);
    setSales((current) => current.filter((sale) => sale.id !== id));
  };

  return { sales, loading, demoMode, createSale, updateSale, removeSale };
}
