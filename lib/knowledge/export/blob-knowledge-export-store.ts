import {
  del,
  get,
  put,
} from "@vercel/blob";

import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";
import { KnowledgeExportError } from "@/lib/knowledge/knowledge-errors";
import { stableJsonBytes } from "@/lib/knowledge/stable-json";
import type {
  KnowledgeCurrentPointer,
  KnowledgeReleaseArtifacts,
} from "@/lib/knowledge/knowledge-types";

const PUBLIC_ACCESS = "public" as const;
const JSON_CONTENT_TYPE = "application/json";
const MINIMUM_CACHE_SECONDS = 60;

export class BlobKnowledgeExportStore
  implements KnowledgeExportStore
{
  constructor(
    private readonly root =
      process.env.KNOWLEDGE_BLOB_ROOT?.trim() ||
      "knowledge",
  ) {}

  private releasePath(
    version: string,
    fileName: string,
  ) {
    return `${this.root}/releases/${version}/${fileName}`;
  }

  private currentPath() {
    return `${this.root}/current.json`;
  }

  private async readBytes(
    pathname: string,
  ): Promise<Uint8Array | null> {
    const result = await get(pathname, {
      access: PUBLIC_ACCESS,
    });

    if (!result) {
      return null;
    }

    if (
      result.statusCode !== 200 ||
      !result.stream
    ) {
      throw new KnowledgeExportError(
        `Blob content is unavailable: ${pathname}`,
      );
    }

    const buffer = await new Response(
      result.stream,
    ).arrayBuffer();

    return new Uint8Array(buffer);
  }

  async writeRelease(
    artifacts: KnowledgeReleaseArtifacts,
  ): Promise<void> {
    const manifestPath = this.releasePath(
      artifacts.version,
      "manifest.json",
    );

    const existingManifest =
      await this.readBytes(manifestPath);

    if (existingManifest) {
      throw new KnowledgeExportError(
        `Knowledge release already exists: ${artifacts.version}`,
      );
    }

    const uploadedPaths: string[] = [];

    try {
      for (const [fileName, bytes] of Object.entries(
        artifacts.files,
      )) {
        const pathname = this.releasePath(
          artifacts.version,
          fileName,
        );

        await put(pathname, Buffer.from(bytes), {
          access: PUBLIC_ACCESS,
          addRandomSuffix: false,
          allowOverwrite: false,
          contentType: JSON_CONTENT_TYPE,
          cacheControlMaxAge:
            MINIMUM_CACHE_SECONDS,
        });

        uploadedPaths.push(pathname);

        const stored =
          await this.readBytes(pathname);

        if (
          !stored ||
          !Buffer.from(stored).equals(
            Buffer.from(bytes),
          )
        ) {
          throw new KnowledgeExportError(
            `Release file validation failed: ${fileName}`,
          );
        }
      }

      await put(
        manifestPath,
        Buffer.from(artifacts.manifestBytes),
        {
          access: PUBLIC_ACCESS,
          addRandomSuffix: false,
          allowOverwrite: false,
          contentType: JSON_CONTENT_TYPE,
          cacheControlMaxAge:
            MINIMUM_CACHE_SECONDS,
        },
      );

      uploadedPaths.push(manifestPath);

      const storedManifest =
        await this.readBytes(manifestPath);

      if (
        !storedManifest ||
        !Buffer.from(storedManifest).equals(
          Buffer.from(
            artifacts.manifestBytes,
          ),
        )
      ) {
        throw new KnowledgeExportError(
          "Manifest validation failed.",
        );
      }
    } catch (error) {
      if (uploadedPaths.length > 0) {
        try {
          await del(uploadedPaths);
        } catch {
          // The original export error is more useful.
        }
      }

      throw error;
    }
  }

  async readReleaseFile(
    version: string,
    fileName: string,
  ): Promise<Uint8Array> {
    try {
      const bytes = await this.readBytes(
        this.releasePath(
          version,
          fileName,
        ),
      );

      if (!bytes) {
        throw new KnowledgeExportError(
          `Knowledge release file is unavailable: ${fileName}`,
        );
      }

      return bytes;
    } catch (error) {
      if (
        error instanceof
        KnowledgeExportError
      ) {
        throw error;
      }

      throw new KnowledgeExportError(
        `Knowledge release file is unavailable: ${fileName}`,
      );
    }
  }

  async writeCurrentPointer(
    pointer: KnowledgeCurrentPointer,
  ): Promise<void> {
    try {
      await put(
        this.currentPath(),
        Buffer.from(stableJsonBytes(pointer)),
        {
          access: PUBLIC_ACCESS,
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: JSON_CONTENT_TYPE,
          cacheControlMaxAge:
            MINIMUM_CACHE_SECONDS,
        },
      );
    } catch {
      throw new KnowledgeExportError(
        "Knowledge current pointer could not be written.",
      );
    }
  }

  async readCurrentPointer(): Promise<KnowledgeCurrentPointer | null> {
    const bytes = await this.readBytes(
      this.currentPath(),
    );

    if (!bytes) {
      return null;
    }

    try {
      return JSON.parse(
        Buffer.from(bytes).toString(
          "utf8",
        ),
      ) as KnowledgeCurrentPointer;
    } catch {
      throw new KnowledgeExportError(
        "Knowledge current pointer is corrupted.",
      );
    }
  }

  async removeCurrentPointer(): Promise<void> {
    try {
      await del(this.currentPath());
    } catch {
      // Removing a missing pointer is idempotent.
    }
  }
}
