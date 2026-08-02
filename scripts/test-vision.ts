import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { getVisionAdapter } from "../lib/doctor/vision/vision-adapter";
import { processDoctorImage } from "../lib/doctor/vision/image-processor";
import { TemporaryVisionImageStore } from "../lib/doctor/vision/image-store";

async function main() {
  const image = sharp({ create: { width: 600, height: 600, channels: 3, background: { r: 100, g: 140, b: 80 } } });
  const jpeg = await image.jpeg().toBuffer() as Buffer;
  const png = await sharp(jpeg).png().toBuffer() as Buffer;
  const webp = await sharp(jpeg).webp().toBuffer() as Buffer;
  for (const bytes of [jpeg, png, webp]) assert.equal((await processDoctorImage(bytes)).image.mimeType, "image/jpeg");
  const processed = await processDoctorImage(jpeg);
  assert.equal(processed.image.mimeType, "image/jpeg", "Accepted images must be server-side re-encoded.");
  assert.equal(processed.image.width, 600);
  assert.ok(processed.quality.includes("ACCEPTABLE"));
  await assert.rejects(() => processDoctorImage(Buffer.from("not-an-image")), /IMAGE_INVALID/);
  const tiny = await sharp({ create: { width: 40, height: 40, channels: 3, background: "white" } }).png().toBuffer() as Buffer;
  assert.ok((await processDoctorImage(tiny)).quality.includes("TOO_SMALL"));

  const store = new TemporaryVisionImageStore(1_000);
  const reference = store.put("session-a", processed.image);
  assert.equal(store.take("session-b", reference), null, "Image references must be session-bound.");
  assert.ok(store.take("session-a", reference));
  assert.equal(store.take("session-a", reference), null, "Image references must be bounded to one use.");
  const adapter = getVisionAdapter();
  await assert.rejects(() => adapter.analyze({ id: "image", ...processed.image }, {}), /VISION_PROVIDER_UNAVAILABLE/, "Disabled/internal mode must not fabricate observations.");

  const source = await fs.readFile(path.join(process.cwd(), "lib", "doctor", "vision", "image-processor.ts"), "utf8");
  for (const forbidden of ["prisma", "repository", "admin", "ProductRepository", "data/products"]) assert.ok(!source.toLowerCase().includes(forbidden.toLowerCase()), `Vision processing must not import ${forbidden}.`);
  console.log("vision-tests:ok");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
