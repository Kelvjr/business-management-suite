import assert from "node:assert/strict";
import test from "node:test";
import { paymentState, roundMoney } from "./money.js";

test("rounds calculated money at the business boundary", () => {
  assert.equal(roundMoney(10.005), 10.01);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});

test("derives unpaid, partial, and paid balances consistently", () => {
  assert.deepEqual(paymentState(100, 0), { amountPaid: 0, balanceDue: 100, status: "UNPAID" });
  assert.deepEqual(paymentState(100, 40), { amountPaid: 40, balanceDue: 60, status: "PARTIALLY_PAID" });
  assert.deepEqual(paymentState(100, 100), { amountPaid: 100, balanceDue: 0, status: "PAID" });
});

test("rejects overpayment", () => assert.throws(() => paymentState(100, 100.01), /exceeds/));
