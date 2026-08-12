import assert from "node:assert/strict";
import test from "node:test";
import { expenseUpdateSchema } from "./expense.js";
import { saleUpdateSchema } from "./sale.js";

test("sale edits do not inject create defaults", () => {
  assert.deepEqual(saleUpdateSchema.parse({ notes: "changed" }), { notes: "changed" });
});

test("expense edits do not inject create defaults", () => {
  assert.deepEqual(expenseUpdateSchema.parse({ notes: "changed" }), { notes: "changed" });
});
