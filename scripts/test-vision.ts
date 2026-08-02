import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { getVisionAdapter } from "../lib/doctor/vision/vision-adapter";
import { processDoctorImage } from "../lib/doctor/vision/image-processor";
import { TemporaryVisionImageStore } from "../lib/doctor/vision/image-store";

async function main() {
  const acceptableSvg = `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#316b35"/><stop offset=".5" stop-color="#b9d66a"/><stop offset="1" stop-color="#573b27"/></linearGradient><pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#24522b"/><rect x="12" y="12" width="12" height="12" fill="#d4e789"/></pattern></defs><rect width="600" height="600" fill="url(#g)"/><rect width="600" height="600" fill="url(#p)" opacity=".45"/></svg>`;
  const jpeg = await sharp(Buffer.from(acceptableSvg)).jpeg().toBuffer() as Buffer;
  const png = await sharp(jpeg).png().toBuffer() as Buffer;
  const webp = await sharp(jpeg).webp().toBuffer() as Buffer;
  for (const bytes of [jpeg, png, webp]) assert.equal((await processDoctorImage(bytes)).image.mimeType, "image/jpeg");
  const processed = await processDoctorImage(jpeg);
  console.log(`vision-quality-fixture:${processed.quality.join(",")}`);
  assert.equal(processed.image.mimeType, "image/jpeg", "Accepted images must be server-side re-encoded.");
  assert.equal(processed.image.width, 600);
  assert.deepEqual(processed.quality, ["ACCEPTABLE"], "Acceptable images must not carry blocking quality findings.");
  await assert.rejects(() => processDoctorImage(Buffer.from("not-an-image")), /IMAGE_INVALID/);
  const tiny = await sharp({ create: { width: 40, height: 40, channels: 3, background: "white" } }).png().toBuffer() as Buffer;
  assert.ok((await processDoctorImage(tiny)).quality.includes("TOO_SMALL"));
  const blurry = await sharp({ create: { width: 600, height: 600, channels: 3, background: { r: 120, g: 120, b: 120 } } }).jpeg().toBuffer() as Buffer;
  assert.ok((await processDoctorImage(blurry)).quality.includes("BLURRY"));
  const tooDark = await sharp({ create: { width: 600, height: 600, channels: 3, background: { r: 10, g: 10, b: 10 } } }).jpeg().toBuffer() as Buffer;
  assert.ok((await processDoctorImage(tooDark)).quality.includes("TOO_DARK"));
  const overexposed = await sharp({ create: { width: 600, height: 600, channels: 3, background: { r: 250, g: 250, b: 250 } } }).jpeg().toBuffer() as Buffer;
  assert.ok((await processDoctorImage(overexposed)).quality.includes("OVEREXPOSED"));

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
