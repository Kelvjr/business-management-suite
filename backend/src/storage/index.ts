import { readStorageConfig } from "./config.js";
import { StorageService } from "./storage.service.js";
import { SupabaseStorageProvider } from "./supabase-provider.js";

let instance: StorageService | undefined;

export function getStorageService() {
  if (!instance) {
    const config = readStorageConfig();
    instance = new StorageService(new SupabaseStorageProvider(config), config);
  }
  return instance;
}

export { getStorageService as getStorage };

export function setStorageServiceForTests(service: StorageService | undefined) {
  instance = service;
}

export * from "./storage.service.js";
export type * from "./types.js";
