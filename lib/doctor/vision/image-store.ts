import { randomUUID } from "node:crypto";

import type { VisionImage } from "@/lib/doctor/vision/vision-types";

type StoredImage = VisionImage & { sessionId: string; expiresAt: number; uses: number };
const maxUploadsPerSession = 4;

export class TemporaryVisionImageStore {
  private readonly images = new Map<string, StoredImage>();
  private readonly uploads = new Map<string, number>();
  constructor(private readonly ttlMs = 10 * 60 * 1000) {}
  put(sessionId: string, image: Omit<VisionImage, "id">): string {
    this.purge();
    const count = this.uploads.get(sessionId) ?? 0;
    if (count >= maxUploadsPerSession) throw new Error("IMAGE_UPLOAD_LIMIT");
    const id = randomUUID();
    this.images.set(id, { ...image, id, sessionId, uses: 0, expiresAt: Date.now() + this.ttlMs });
    this.uploads.set(sessionId, count + 1);
    return id;
  }
  take(sessionId: string, id: string): VisionImage | null {
    this.purge();
    const image = this.images.get(id);
    if (!image || image.sessionId !== sessionId || image.uses >= 1) return null;
    image.uses += 1;
    this.images.delete(id);
    return image;
  }
  purge(): void { for (const [id, image] of this.images) if (image.expiresAt <= Date.now()) this.images.delete(id); }
}
let store: TemporaryVisionImageStore | undefined;
export function getTemporaryVisionImageStore(): TemporaryVisionImageStore { return store ??= new TemporaryVisionImageStore(); }
export function setTemporaryVisionImageStoreForTests(next: TemporaryVisionImageStore | undefined): void { store = next; }
