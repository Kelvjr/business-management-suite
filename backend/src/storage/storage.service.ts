import { randomUUID } from "node:crypto";
import type { StorageConfig } from "./config.js";
import type { StoredObject, StorageProvider, StorageResource, StorageVisibility, UploadFile, UploadPolicy } from "./types.js";

const formats = {
  "image/jpeg": { extension: "jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },
  "application/pdf": { extension: "pdf", signatures: [[0x25, 0x50, 0x44, 0x46, 0x2d]] },
} as const;

export class StorageValidationError extends Error {}

function startsWith(buffer: Buffer, signature: readonly number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}

export function detectMimeType(buffer: Buffer) {
  for (const [mimeType, format] of Object.entries(formats)) {
    if (!format.signatures.some((signature) => startsWith(buffer, signature))) continue;
    if (mimeType === "image/webp" && buffer.subarray(8, 12).toString("ascii") !== "WEBP") continue;
    return mimeType as keyof typeof formats;
  }
  return null;
}

export class StorageService {
  constructor(private readonly provider: StorageProvider, private readonly config: Pick<StorageConfig, "SUPABASE_PUBLIC_BUCKET" | "SUPABASE_PRIVATE_BUCKET" | "STORAGE_SIGNED_URL_TTL_SECONDS">) {}

  validate(file: UploadFile, policy: UploadPolicy) {
    const maxBytes = policy === "PRODUCT_IMAGE" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!file.size || file.size !== file.buffer.length) throw new StorageValidationError("The uploaded file is empty or incomplete");
    if (file.size > maxBytes) throw new StorageValidationError(`${policy === "PRODUCT_IMAGE" ? "Product images" : "Attachments"} must be ${maxBytes / 1024 / 1024} MB or smaller`);
    const mimeType = detectMimeType(file.buffer);
    const permitted = policy === "PRODUCT_IMAGE" ? ["image/jpeg", "image/png", "image/webp"] : ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!mimeType || !permitted.includes(mimeType)) throw new StorageValidationError("Unsupported file type. Use JPEG, PNG, WebP, or PDF where documents are allowed");
    return { mimeType, extension: formats[mimeType].extension };
  }

  async upload(input: { resource: StorageResource; resourceId: string; file: UploadFile; policy: UploadPolicy; visibility: StorageVisibility }): Promise<StoredObject> {
    if (!/^[A-Za-z0-9_-]+$/.test(input.resourceId)) throw new StorageValidationError("Invalid resource identifier");
    const detected = this.validate(input.file, input.policy);
    const bucket = input.visibility === "PUBLIC" ? this.config.SUPABASE_PUBLIC_BUCKET : this.config.SUPABASE_PRIVATE_BUCKET;
    const storageKey = `${input.resource}/${input.resourceId}/${randomUUID()}.${detected.extension}`;
    await this.provider.upload(bucket, storageKey, input.file.buffer, { contentType: detected.mimeType, metadata: { originalName: input.file.originalName } });
    return { bucket, storageKey, originalName: input.file.originalName.slice(0, 255), mimeType: detected.mimeType, size: input.file.size, visibility: input.visibility, publicUrl: input.visibility === "PUBLIC" ? this.provider.getPublicUrl(bucket, storageKey) : null };
  }

  async delete(object: Pick<StoredObject, "bucket" | "storageKey">) {
    await this.provider.remove(object.bucket, object.storageKey);
  }

  async readUrl(object: Pick<StoredObject, "bucket" | "storageKey" | "visibility">) {
    return object.visibility === "PUBLIC" ? this.provider.getPublicUrl(object.bucket, object.storageKey) : this.provider.createSignedUrl(object.bucket, object.storageKey, this.config.STORAGE_SIGNED_URL_TTL_SECONDS);
  }
}
