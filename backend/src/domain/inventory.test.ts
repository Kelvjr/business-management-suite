import assert from "node:assert/strict";
import test from "node:test";
import { stockAfterMovement, stockDeltas } from "./inventory.js";

test("applies stock in, stock out, transfer-in, and exact adjustments", () => {
  assert.equal(stockAfterMovement(10, "STOCK_IN", 2), 12);
  assert.equal(stockAfterMovement(10, "STOCK_OUT", 2), 8);
  assert.equal(stockAfterMovement(10, "TRANSFER", 2), 12);
  assert.equal(stockAfterMovement(10, "ADJUSTMENT", 2), 2);
});

test("prevents insufficient stock", () => assert.throws(() => stockAfterMovement(1, "STOCK_OUT", 2), /Insufficient/));

test("calculates inventory reconciliation when a sale is edited", () => {
  assert.deepEqual(stockDeltas([{ catalogItemId: "a", quantity: 2 }], [{ catalogItemId: "a", quantity: 5 }, { catalogItemId: "b", quantity: 1 }]), [
    { catalogItemId: "a", delta: -3 },
    { catalogItemId: "b", delta: -1 },
  ]);
});
