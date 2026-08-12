import assert from "node:assert/strict";
import test from "node:test";
import { StorageService, StorageValidationError, detectMimeType } from "./storage.service.js";
import type { StorageProvider } from "./types.js";

class FakeProvider implements StorageProvider {
  uploads: Array<{ bucket: string; key: string; body: Buffer; contentType: string }> = [];
  removals: Array<{ bucket: string; key: string }> = [];
  failUpload = false;
  failRemove = false;
  async upload(bucket: string, key: string, body: Buffer, options: { contentType: string }) {
    if (this.failUpload) throw new Error("provider unavailable");
    this.uploads.push({ bucket, key, body, contentType: options.contentType });
  }
  async remove(bucket: string, key: string) {
    if (this.failRemove) throw new Error("object missing");
    this.removals.push({ bucket, key });
  }
  getPublicUrl(bucket: string, key: string) { return `https://public.example/${bucket}/${key}`; }
  async createSignedUrl(bucket: string, key: string, seconds: number) { return `https://signed.example/${bucket}/${key}?expires=${seconds}`; }
}

const config = { SUPABASE_PUBLIC_BUCKET: "public-files", SUPABASE_PRIVATE_BUCKET: "private-files", STORAGE_SIGNED_URL_TTL_SECONDS: 300 };
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]);
const webp = Buffer.concat([Buffer.from("RIFF0000WEBP", "ascii"), Buffer.from([1])]);
const pdf = Buffer.from("%PDF-1.7\n", "ascii");
const file = (buffer: Buffer, name = "upload.bin", claimedMimeType = "text/plain") => ({ buffer, size: buffer.length, originalName: name, claimedMimeType });

test("detects supported formats from file bytes, not the browser label", () => {
  assert.equal(detectMimeType(jpeg), "image/jpeg");
  assert.equal(detectMimeType(png), "image/png");
  assert.equal(detectMimeType(webp), "image/webp");
  assert.equal(detectMimeType(pdf), "application/pdf");
  assert.equal(detectMimeType(Buffer.from("not an image")), null);
});

test("uploads a product image to the public bucket under a generated product path", async () => {
  const provider = new FakeProvider();
  const storage = new StorageService(provider, config);
  const stored = await storage.upload({ resource: "products", resourceId: "product_1", file: file(png, "My Product.PNG"), policy: "PRODUCT_IMAGE", visibility: "PUBLIC" });
  assert.equal(stored.bucket, "public-files");
  assert.match(stored.storageKey, /^products\/product_1\/[0-9a-f-]+\.png$/);
  assert.equal(stored.mimeType, "image/png");
  assert.match(stored.publicUrl ?? "", /^https:\/\/public\.example/);
  assert.equal(provider.uploads[0].contentType, "image/png");
});

test("keeps financial attachments private and creates a short-lived read link", async () => {
  const provider = new FakeProvider();
  const storage = new StorageService(provider, config);
  const stored = await storage.upload({ resource: "expenses", resourceId: "expense-1", file: file(pdf, "receipt.pdf"), policy: "ATTACHMENT", visibility: "PRIVATE" });
  assert.equal(stored.bucket, "private-files");
  assert.equal(stored.publicUrl, null);
  assert.equal(await storage.readUrl(stored), `https://signed.example/private-files/${stored.storageKey}?expires=300`);
});

test("rejects disguised, unsupported, empty, and oversized files", () => {
  const storage = new StorageService(new FakeProvider(), config);
  assert.throws(() => storage.validate(file(Buffer.from("plain text"), "fake.png", "image/png"), "PRODUCT_IMAGE"), StorageValidationError);
  assert.throws(() => storage.validate(file(Buffer.alloc(0)), "ATTACHMENT"), /empty or incomplete/);
  const tooLarge = Buffer.alloc(5 * 1024 * 1024 + 1); tooLarge.set(png);
  assert.throws(() => storage.validate(file(tooLarge), "PRODUCT_IMAGE"), /5 MB or smaller/);
  assert.throws(() => storage.validate(file(pdf), "PRODUCT_IMAGE"), /Unsupported file type/);
});

test("propagates failed uploads and missing-object deletion errors", async () => {
  const provider = new FakeProvider(); const storage = new StorageService(provider, config);
  provider.failUpload = true;
  await assert.rejects(storage.upload({ resource: "sales", resourceId: "sale-1", file: file(jpeg), policy: "ATTACHMENT", visibility: "PRIVATE" }), /provider unavailable/);
  provider.failUpload = false; provider.failRemove = true;
  await assert.rejects(storage.delete({ bucket: "private-files", storageKey: "sales/sale-1/missing.jpg" }), /object missing/);
});

test("deletes the exact stored object after a successful replacement", async () => {
  const provider = new FakeProvider(); const storage = new StorageService(provider, config);
  const old = { bucket: "public-files", storageKey: "products/product-1/old.jpg" };
  const replacement = await storage.upload({ resource: "products", resourceId: "product-1", file: file(jpeg, "new.jpg"), policy: "PRODUCT_IMAGE", visibility: "PUBLIC" });
  await storage.delete(old);
  assert.notEqual(replacement.storageKey, old.storageKey);
  assert.deepEqual(provider.removals, [{ bucket: old.bucket, key: old.storageKey }]);
});
