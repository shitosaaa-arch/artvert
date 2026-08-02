import { NextResponse } from "next/server";

import { getDoctorSessionStore } from "@/lib/doctor/session-store";
import { processDoctorImage } from "@/lib/doctor/vision/image-processor";
import { getTemporaryVisionImageStore } from "@/lib/doctor/vision/image-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const sessionId = form.get("sessionId");
    const image = form.get("image");
    if (typeof sessionId !== "string" || !(image instanceof File)) return NextResponse.json({ status: "image_invalid", error: "A diagnostic session and one image are required." }, { status: 400 });
    if (!await getDoctorSessionStore().get(sessionId)) return NextResponse.json({ status: "session_expired", error: "Diagnostic session expired." }, { status: 409 });
    const processed = await processDoctorImage(Buffer.from(await image.arrayBuffer()));
    const imageRef = getTemporaryVisionImageStore().put(sessionId, processed.image);
    const status = processed.quality.includes("ACCEPTABLE") ? "image_ready" : "image_quality_insufficient";
    return NextResponse.json({ status, imageRef, qualityFindings: processed.quality, recaptureGuidance: processed.guidance });
  } catch (error) {
    const code = error instanceof Error ? error.message : "IMAGE_PROCESSING_FAILED";
    const status = code === "IMAGE_INVALID" || code === "IMAGE_UPLOAD_LIMIT" ? "image_invalid" : "vision_processing_failed";
    return NextResponse.json({ status, error: "Image could not be processed safely." }, { status: 400 });
  }
}
