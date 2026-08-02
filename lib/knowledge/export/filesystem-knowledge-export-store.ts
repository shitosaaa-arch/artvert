import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";
import { KnowledgeExportError } from "@/lib/knowledge/knowledge-errors";
import { stableJsonBytes } from "@/lib/knowledge/stable-json";
import type { KnowledgeCurrentPointer, KnowledgeReleaseArtifacts } from "@/lib/knowledge/knowledge-types";

export class FilesystemKnowledgeExportStore implements KnowledgeExportStore {
  constructor(private readonly root = path.join(process.cwd(), "data", "generated", "knowledge")) {}

  private releaseDirectory(version: string) {
    return path.join(this.root, "releases", version);
  }

  async writeRelease(artifacts: KnowledgeReleaseArtifacts): Promise<void> {
    const stagingDirectory = path.join(this.root, ".staging", `${artifacts.version}-${randomUUID()}`);
    const releaseDirectory = this.releaseDirectory(artifacts.version);

    try {
      await fs.mkdir(stagingDirectory, { recursive: true });
      for (const [fileName, bytes] of Object.entries(artifacts.files)) {
        await fs.writeFile(path.join(stagingDirectory, fileName), bytes);
      }
      await fs.writeFile(path.join(stagingDirectory, "manifest.json"), artifacts.manifestBytes);

      for (const [fileName, bytes] of Object.entries(artifacts.files)) {
        const stored = await fs.readFile(path.join(stagingDirectory, fileName));
        if (!stored.equals(Buffer.from(bytes))) throw new KnowledgeExportError(`Release file validation failed: ${fileName}`);
      }
      const manifest = await fs.readFile(path.join(stagingDirectory, "manifest.json"));
      if (!manifest.equals(Buffer.from(artifacts.manifestBytes))) throw new KnowledgeExportError("Manifest validation failed.");

      await fs.mkdir(path.dirname(releaseDirectory), { recursive: true });
      try {
        await fs.access(releaseDirectory);
        throw new KnowledgeExportError(`Knowledge release already exists: ${artifacts.version}`);
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
      }
      await fs.rename(stagingDirectory, releaseDirectory);
    } catch (error) {
      await fs.rm(stagingDirectory, { recursive: true, force: true });
      throw error;
    }
  }

  async readReleaseFile(version: string, fileName: string): Promise<Uint8Array> {
    try {
      return await fs.readFile(path.join(this.releaseDirectory(version), fileName));
    } catch {
      throw new KnowledgeExportError(`Knowledge release file is unavailable: ${fileName}`);
    }
  }

  async writeCurrentPointer(pointer: KnowledgeCurrentPointer): Promise<void> {
    const currentPath = path.join(this.root, "current.json");
    const temporaryPath = `${currentPath}.${randomUUID()}.tmp`;
    await fs.mkdir(this.root, { recursive: true });
    try {
      await fs.writeFile(temporaryPath, stableJsonBytes(pointer));
      await fs.rename(temporaryPath, currentPath);
    } catch (error) {
      await fs.rm(temporaryPath, { force: true });
      throw error;
    }
  }

  async readCurrentPointer(): Promise<KnowledgeCurrentPointer | null> {
    try {
      return JSON.parse(await fs.readFile(path.join(this.root, "current.json"), "utf8")) as KnowledgeCurrentPointer;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
      throw new KnowledgeExportError("Knowledge current pointer is corrupted.");
    }
  }

  async removeCurrentPointer(): Promise<void> {
    await fs.rm(path.join(this.root, "current.json"), { force: true });
  }
}
