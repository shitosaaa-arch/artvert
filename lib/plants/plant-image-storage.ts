import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type StoredPlantImage = { storageKey: string; url: string; contentType: string; fileSize: number; width: number; height: number; checksum: string };

export interface PlantImageStorage {
  put(file: Uint8Array, contentType: string, extension: string): Promise<StoredPlantImage>;
  delete(storageKey: string): Promise<void>;
  listKeys(): Promise<string[]>;
}

const uploadRoot = path.join(process.cwd(), "public", "uploads", "plants");

function safeKey(key: string) {
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(key)) throw new Error("Invalid plant image storage key.");
  return key;
}

export class FilesystemPlantImageStorage implements PlantImageStorage {
  async put(file: Uint8Array, contentType: string, extension: string): Promise<StoredPlantImage> {
    const storageKey = `${randomUUID()}.${extension}`;
    await fs.mkdir(uploadRoot, { recursive: true });
    await fs.writeFile(path.join(uploadRoot, storageKey), file);
    return { storageKey, url: `/uploads/plants/${storageKey}`, contentType, fileSize: file.byteLength, width: 0, height: 0, checksum: "" };
  }

  async delete(storageKey: string): Promise<void> { await fs.rm(path.join(uploadRoot, safeKey(storageKey)), { force: true }); }

  async listKeys(): Promise<string[]> {
    try { return (await fs.readdir(uploadRoot)).filter((key) => /^[a-z0-9-]+\.[a-z0-9]+$/i.test(key)); }
    catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  }
}

export const getPlantImageStorage = () => new FilesystemPlantImageStorage();
