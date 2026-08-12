import assert from "node:assert/strict";
import test from "node:test";
import { invoicePaymentStatus, paymentIncrease } from "./payments.js";

test("calculates only the new part of a partial payment", () => {
  assert.equal(paymentIncrease(500, 900, 1500), 400);
});

test("prevents recorded money from being silently reduced", () => {
  assert.throws(() => paymentIncrease(900, 500, 1500), /cannot be reduced/);
});

test("prevents payments above the document total", () => {
  assert.throws(() => paymentIncrease(900, 1600, 1500), /exceeds/);
});

test("derives unpaid, partial, and paid invoice states", () => {
  assert.equal(invoicePaymentStatus(0, 1500), "UNPAID");
  assert.equal(invoicePaymentStatus(500, 1500), "PARTIALLY_PAID");
  assert.equal(invoicePaymentStatus(1500, 1500), "PAID");
});
