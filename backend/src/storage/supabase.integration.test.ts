import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { SupabaseStorageProvider } from "./supabase-provider.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_PUBLIC_BUCKET ?? "renaissance-public";

test("live Supabase upload, public URL, and cleanup", { skip: !url || !key }, async () => {
  const provider = new SupabaseStorageProvider({ SUPABASE_URL: url!, SUPABASE_SERVICE_ROLE_KEY: key! });
  const objectKey = `products/storage-smoke/${randomUUID()}.png`;
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
  await provider.upload(bucket, objectKey, png, { contentType: "image/png", metadata: { purpose: "automated-storage-test" } });
  try { assert.match(provider.getPublicUrl(bucket, objectKey), /^https:\/\//); }
  finally { await provider.remove(bucket, objectKey); }
});
