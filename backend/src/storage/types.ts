export type StorageVisibility = "PUBLIC" | "PRIVATE";
export type StorageResource = "products" | "sales" | "expenses" | "purchases" | "invoices";
export type UploadPolicy = "PRODUCT_IMAGE" | "ATTACHMENT";

export type UploadFile = {
  buffer: Buffer;
  originalName: string;
  claimedMimeType?: string;
  size: number;
};

export type StoredObject = {
  bucket: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  visibility: StorageVisibility;
  publicUrl: string | null;
};

export interface StorageProvider {
  upload(bucket: string, key: string, body: Buffer, options: { contentType: string; metadata: Record<string, string> }): Promise<void>;
  remove(bucket: string, key: string): Promise<void>;
  getPublicUrl(bucket: string, key: string): string;
  createSignedUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>;
}
