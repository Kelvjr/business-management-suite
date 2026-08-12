import assert from "node:assert/strict";
import test from "node:test";
import { expensePaymentState } from "./expenses.service.js";

test("normalizes paid, unpaid, and partial expenses", () => {
  assert.equal(expensePaymentState(125, "PAID", 0).amountPaid, 125);
  assert.equal(expensePaymentState(125, "UNPAID", 80).amountPaid, 0);
  assert.deepEqual(expensePaymentState(125, "PARTIALLY_PAID", 25), { amountPaid: 25, balanceDue: 100, status: "PARTIALLY_PAID" });
});

test("rejects expense overpayment instead of silently reducing it", () => {
  assert.throws(() => expensePaymentState(125, "PARTIALLY_PAID", 126), /exceeds/);
});
