import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StorageConfig } from "./config.js";
import type { StorageProvider } from "./types.js";

export class SupabaseStorageProvider implements StorageProvider {
  private readonly client: SupabaseClient;

  constructor(config: Pick<StorageConfig, "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">) {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  }

  async upload(bucket: string, key: string, body: Buffer, options: { contentType: string; metadata: Record<string, string> }) {
    const { error } = await this.client.storage.from(bucket).upload(key, body, { contentType: options.contentType, metadata: options.metadata, upsert: false, cacheControl: bucket.includes("public") ? "31536000" : "3600" });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  }

  async remove(bucket: string, key: string) {
    const { error } = await this.client.storage.from(bucket).remove([key]);
    if (error) throw new Error(`Storage deletion failed: ${error.message}`);
  }

  getPublicUrl(bucket: string, key: string) {
    return this.client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
  }

  async createSignedUrl(bucket: string, key: string, expiresInSeconds: number) {
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(key, expiresInSeconds);
    if (error || !data?.signedUrl) throw new Error(`Storage file is unavailable: ${error?.message ?? "missing signed URL"}`);
    return data.signedUrl;
  }
}
