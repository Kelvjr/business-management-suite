export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function paymentState(total: number, paid: number) {
  const normalizedTotal = roundMoney(total);
  const normalizedPaid = roundMoney(paid);
  if (normalizedTotal <= 0) throw new Error("Document total must be positive");
  if (normalizedPaid < 0) throw new Error("Recorded payments cannot be negative");
  if (normalizedPaid > normalizedTotal) throw new Error("Payment exceeds the balance");
  return {
    amountPaid: normalizedPaid,
    balanceDue: roundMoney(normalizedTotal - normalizedPaid),
    status: normalizedPaid === 0 ? "UNPAID" as const : normalizedPaid === normalizedTotal ? "PAID" as const : "PARTIALLY_PAID" as const,
  };
}
