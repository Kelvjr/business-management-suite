import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaleTotals } from "./sales.service.js";

test("calculates itemized discounts and tax with currency rounding", () => {
  const totals = calculateSaleTotals({ amount: 0, items: [{ lineTotal: 100.05 } as never, { lineTotal: 49.95 } as never], discountType: "PERCENTAGE", discountValue: 10, taxRate: 15, manualTotalOverride: false, paymentStatus: "PARTIALLY_PAID", amountPaid: 50 });
  assert.deepEqual(totals, { subtotal: 150, discountAmount: 15, taxAmount: 20.25, amount: 155.25, amountPaid: 50, balanceDue: 105.25, status: "PARTIALLY_PAID" });
});

test("quick paid sales settle their complete calculated amount", () => {
  const totals = calculateSaleTotals({ amount: 42.42, discountType: "NONE", discountValue: 0, taxRate: 0, manualTotalOverride: true, paymentStatus: "PAID", amountPaid: 0 });
  assert.equal(totals.amountPaid, 42.42);
  assert.equal(totals.status, "PAID");
});
