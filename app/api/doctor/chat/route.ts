import { NextResponse } from "next/server";

import { DoctorEngine } from "@/engine/doctor/doctor-engine";
import { createKnowledgeEngine } from "@/engine/knowledge/knowledge-engine";
import { getDoctorSessionStore } from "@/lib/doctor/session-store";
import { getVisionAdapter } from "@/lib/doctor/vision/vision-adapter";
import { getTemporaryVisionImageStore } from "@/lib/doctor/vision/image-store";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { parseDoctorChatRequest } from "@/schemas/doctor";

export async function POST(request: Request) {
  try {
    const input = parseDoctorChatRequest(await request.json());
    const sessions = getDoctorSessionStore();
    const existing = input.sessionId ? await sessions.get(input.sessionId) : null;

    if (input.sessionId && !existing) {
      return NextResponse.json({ status: "session_expired", error: "This diagnostic session expired. Start a new session." }, { status: 409 });
    }

    let image: { status: string; qualityFindings?: string[]; recaptureGuidance?: string[] } | undefined;
    if (input.imageRef && existing) {
      const uploaded = getTemporaryVisionImageStore().take(existing.id, input.imageRef);
      if (!uploaded) return NextResponse.json({ status: "image_invalid", error: "Image reference is invalid or expired." }, { status: 400 });
      try {
        const observation = await getVisionAdapter().analyze(uploaded, { message: input.message });
        image = { status: "image_ready", qualityFindings: observation.qualityFindings, recaptureGuidance: observation.recaptureGuidance };
      } catch {
        image = { status: "vision_provider_unavailable", recaptureGuidance: ["يمكن متابعة التشخيص النصي؛ تحليل الصورة غير متاح حالياً."] };
      }
    }

    const reader = createKnowledgeEngine(createKnowledgeExportStore());
    const result = await new DoctorEngine(reader).diagnose(input, existing?.state);
    const session = existing
      ? await sessions.update(existing.id, result.session)
      : await sessions.create(result.session);
    if (!session) {
      return NextResponse.json({ status: "session_expired", error: "This diagnostic session expired. Start a new session." }, { status: 409 });
    }

    return NextResponse.json({
      sessionId: session.id,
      status: result.status,
      knowledgeRelease: result.knowledgeRelease,
      plant: result.plant,
      candidates: result.candidates,
      followUpQuestions: result.followUpQuestions,
      treatment: result.treatment,
      emergencyFlags: result.emergencyFlags,
      disclaimer: result.disclaimer,
      image,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doctor chat is unavailable.";
    return NextResponse.json({ status: "unavailable", error: message, retryable: true }, { status: 503 });
  }
}
