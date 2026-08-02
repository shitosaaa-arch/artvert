import type { DoctorTurn } from "@/engine/doctor/doctor-types";

const maxMessageLength = 2000;
const maxSymptoms = 20;
const maxAnswers = 12;
const maxContextEntries = 12;

export type DoctorChatRequest = DoctorTurn & { sessionId?: string; imageRef?: string };

function stringRecord(value: unknown, limit: number): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > limit) throw new Error("Context is invalid.");
  const entries = Object.entries(value);
  if (entries.some(([key, item]) => !key.trim() || typeof item !== "string" || item.length > 300)) throw new Error("Context is invalid.");
  return Object.fromEntries(entries);
}

export function parseDoctorChatRequest(value: unknown): DoctorChatRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Request body must be an object.");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["sessionId", "message", "answers", "context", "imageRef"].includes(key))) throw new Error("Request contains unsupported fields.");
  if (body.sessionId !== undefined && (typeof body.sessionId !== "string" || body.sessionId.length > 100)) throw new Error("Session id is invalid.");
  if (body.imageRef !== undefined && (typeof body.imageRef !== "string" || body.imageRef.length > 100 || !body.sessionId)) throw new Error("Image reference is invalid.");
  if (body.message !== undefined && (typeof body.message !== "string" || body.message.length > maxMessageLength)) throw new Error("Message is invalid or too long.");
  if (body.answers !== undefined && (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers) || Object.keys(body.answers).length > maxAnswers)) throw new Error("Answers are invalid.");
  const answers = body.answers as Record<string, unknown> | undefined;
  if (answers && Object.entries(answers).some(([key, answer]) => !key.trim() || (typeof answer !== "string" && (!Array.isArray(answer) || answer.some((item) => typeof item !== "string"))) )) throw new Error("Answers are invalid.");
  const contextValue = body.context;
  if (contextValue !== undefined && (!contextValue || typeof contextValue !== "object" || Array.isArray(contextValue))) throw new Error("Context is invalid.");
  const context = contextValue as Record<string, unknown> | undefined;
  if (context?.symptoms !== undefined && (!Array.isArray(context.symptoms) || context.symptoms.length > maxSymptoms || context.symptoms.some((item) => typeof item !== "string" || item.length > 300))) throw new Error("Symptoms are invalid.");
  for (const key of ["plant", "location", "timing", "severity"]) if (context?.[key] !== undefined && (typeof context[key] !== "string" || context[key].length > 300)) throw new Error("Context is invalid.");
  return {
    sessionId: body.sessionId as string | undefined,
    imageRef: body.imageRef as string | undefined,
    message: body.message as string | undefined,
    answers: answers as Record<string, string | string[]> | undefined,
    context: context ? {
      plant: context.plant as string | undefined,
      symptoms: context.symptoms as string[] | undefined,
      location: context.location as string | undefined,
      timing: context.timing as string | undefined,
      severity: context.severity as string | undefined,
      soilContext: stringRecord(context.soilContext, maxContextEntries),
      phContext: stringRecord(context.phContext, maxContextEntries),
    } : undefined,
  };
}
