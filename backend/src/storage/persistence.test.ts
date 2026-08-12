import assert from "node:assert/strict";
import test from "node:test";
import { persistUploadedObject } from "./persistence.js";

const object = { bucket: "private", storageKey: "sales/one/file.pdf", originalName: "file.pdf", mimeType: "application/pdf", size: 10, visibility: "PRIVATE" as const, publicUrl: null };

test("persists uploaded metadata when the database operation succeeds", async () => {
  const removed: string[] = [];
  const row = await persistUploadedObject(object, async (stored) => { removed.push(stored.storageKey); }, async (stored) => ({ saleId: "sale-one", ...stored }));
  assert.equal(row.saleId, "sale-one");
  assert.equal(row.originalName, "file.pdf");
  assert.deepEqual(removed, []);
});

test("cleans up a new object when database metadata persistence fails", async () => {
  const removed: string[] = [];
  await assert.rejects(persistUploadedObject(object, async (stored) => { removed.push(stored.storageKey); }, async () => { throw new Error("database unavailable"); }), /database unavailable/);
  assert.deepEqual(removed, [object.storageKey]);
});
