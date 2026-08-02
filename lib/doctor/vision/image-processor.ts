import sharp from "sharp";

import type { ImageQualityState, VisionImage } from "@/lib/doctor/vision/vision-types";

const maxBytes = 8 * 1024 * 1024;
const maxPixels = 20_000_000;
const maxDimension = 8_000;
const allowed = new Map<string, "image/jpeg" | "image/png" | "image/webp">([["ffd8ff", "image/jpeg"], ["89504e470d0a1a0a", "image/png"], ["52494646", "image/webp"]]);

function magic(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  const prefix = bytes.subarray(0, 12).toString("hex");
  if (prefix.startsWith("ffd8ff")) return "image/jpeg";
  if (prefix.startsWith("89504e470d0a1a0a")) return "image/png";
  if (prefix.startsWith("52494646") && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export async function processDoctorImage(bytes: Buffer): Promise<{ image: Omit<VisionImage, "id">; quality: ImageQualityState[]; guidance: string[] }> {
  const mimeType = magic(bytes);
  if (!mimeType || bytes.length === 0 || bytes.length > maxBytes) throw new Error("IMAGE_INVALID");
  try {
    const source = sharp(bytes, { limitInputPixels: maxPixels, failOn: "error" });
    const metadata = await source.metadata();
    if (!metadata.width || !metadata.height || metadata.width > maxDimension || metadata.height > maxDimension || metadata.width * metadata.height > maxPixels) throw new Error("IMAGE_INVALID");
    const normalized = await source.rotate().jpeg({ quality: 85, mozjpeg: true }).toBuffer({ resolveWithObject: true }) as { data: Buffer; info: { width: number; height: number } };
    const stats = await sharp(normalized.data, { limitInputPixels: maxPixels }).stats();
    const mean = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / Math.min(stats.channels.length, 3);
    const detail = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0) / Math.min(stats.channels.length, 3);
    const quality: ImageQualityState[] = [];
    const guidance: string[] = [];
    if (normalized.info.width < 480 || normalized.info.height < 480) { quality.push("TOO_SMALL"); guidance.push("التقط صورة أقرب وواضحة للنبات أو للجزء المتأثر."); }
    if (mean < 35) { quality.push("TOO_DARK"); guidance.push("التقط الصورة في إضاءة طبيعية أو حسّن الإضاءة."); }
    if (mean > 235) { quality.push("OVEREXPOSED"); guidance.push("تجنب الإضاءة الساطعة المباشرة على النبات."); }
    if (detail < 8) { quality.push("BLURRY"); guidance.push("ثبّت الكاميرا واضغط للتركيز قبل الالتقاط."); }
    return { image: { bytes: normalized.data, mimeType: "image/jpeg", width: normalized.info.width, height: normalized.info.height }, quality: quality.length ? quality : ["ACCEPTABLE"], guidance };
  } catch (error) { if (error instanceof Error && error.message === "IMAGE_INVALID") throw error; throw new Error("IMAGE_PROCESSING_FAILED"); }
}
