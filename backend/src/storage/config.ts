import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_PUBLIC_BUCKET: z.string().trim().min(1).default("renaissance-public"),
  SUPABASE_PRIVATE_BUCKET: z.string().trim().min(1).default("renaissance-private"),
  STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(300),
});

export type StorageConfig = z.infer<typeof schema>;
export class StorageConfigurationError extends Error {}

export function readStorageConfig(environment: NodeJS.ProcessEnv = process.env): StorageConfig {
  const result = schema.safeParse(environment);
  if (!result.success) throw new StorageConfigurationError(`File storage is not ready. Add these values to backend/.env: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return result.data;
}
