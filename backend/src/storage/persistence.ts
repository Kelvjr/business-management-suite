import type { StoredObject } from "./types.js";

export async function persistUploadedObject<T>(stored: StoredObject, remove: (object: StoredObject) => Promise<void>, persist: (object: StoredObject) => Promise<T>) {
  try {
    return await persist(stored);
  } catch (error) {
    await remove(stored).catch(() => undefined);
    throw error;
  }
}
