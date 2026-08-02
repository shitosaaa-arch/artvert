import type { DoctorChatRequest, DoctorChatResponse } from "@/lib/doctor/chat-contract";
import { parseDoctorChatResponse } from "@/lib/doctor/chat-contract";

export async function sendDoctorMessage(input: DoctorChatRequest, signal: AbortSignal): Promise<DoctorChatResponse> {
  const response = await fetch("/api/doctor/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("تعذر قراءة استجابة الطبيب. حاول مرة أخرى.");
  }
  const parsed = parseDoctorChatResponse(body);
  if (!response.ok && parsed.status === "unavailable") return parsed;
  return parsed;
}
