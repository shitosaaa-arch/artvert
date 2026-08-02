import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type StoredEntityImage = { storageKey: string; url: string; contentType: string; fileSize: number; width: number; height: number; checksum: string };
export interface EntityImageStorage { put(file: Uint8Array, contentType: string, extension: string): Promise<StoredEntityImage>; delete(storageKey: string): Promise<void>; listKeys(): Promise<string[]>; }

function safeKey(key: string) { if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(key)) throw new Error("Invalid image storage key."); return key; }

export class FilesystemEntityImageStorage implements EntityImageStorage {
  private readonly root: string;
  constructor(private readonly entityType: "plants" | "diseases") { this.root = path.join(process.cwd(), "public", "uploads", entityType); }
  async put(file: Uint8Array, contentType: string, extension: string): Promise<StoredEntityImage> { const storageKey = `${randomUUID()}.${extension}`; await fs.mkdir(this.root, { recursive: true }); await fs.writeFile(path.join(this.root, storageKey), file); return { storageKey, url: `/uploads/${this.entityType}/${storageKey}`, contentType, fileSize: file.byteLength, width: 0, height: 0, checksum: "" }; }
  async delete(storageKey: string) { await fs.rm(path.join(this.root, safeKey(storageKey)), { force: true }); }
  async listKeys() { try { return (await fs.readdir(this.root)).filter((key) => /^[a-z0-9-]+\.[a-z0-9]+$/i.test(key)); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; } }
}

export const getEntityImageStorage = (entityType: "plants" | "diseases") => new FilesystemEntityImageStorage(entityType);
