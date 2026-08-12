export function stockAfterMovement(before: number, type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "TRANSFER", quantity: number) {
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error("Stock quantity must be non-negative");
  const after = type === "ADJUSTMENT" ? quantity : type === "STOCK_OUT" ? before - quantity : before + quantity;
  if (after < 0) throw new Error("Insufficient stock");
  return after;
}

export type StockLine = { catalogItemId?: string | null; quantity: number };

export function stockDeltas(previous: StockLine[], next: StockLine[]) {
  const result = new Map<string, number>();
  for (const line of previous) if (line.catalogItemId) result.set(line.catalogItemId, (result.get(line.catalogItemId) ?? 0) + line.quantity);
  for (const line of next) if (line.catalogItemId) result.set(line.catalogItemId, (result.get(line.catalogItemId) ?? 0) - line.quantity);
  return [...result].filter(([, delta]) => delta !== 0).map(([catalogItemId, delta]) => ({ catalogItemId, delta }));
}
