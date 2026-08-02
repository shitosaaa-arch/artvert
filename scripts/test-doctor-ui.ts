import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import { characterStateFor, parseDoctorChatResponse } from "../lib/doctor/chat-contract";

const response = {
  sessionId: "session-1",
  status: "needs_information",
  knowledgeRelease: { version: "v1", manifestChecksum: "manifest", contentChecksum: "content" },
  plant: { alternatives: [] },
  candidates: [{ id: "candidate", type: "DISEASE", name: "مرض تجريبي", slug: "candidate", confidence: "MODERATE", explanation: "تفسير آمن", matchedEvidence: [{ key: "symptom", value: "spot", detail: "تطابق عرض ظاهر" }], missingEvidence: ["موقع العرض"], contradictions: ["تحقق من النبات"], excludedEvidence: ["لا يدعم العرض" ] }],
  followUpQuestions: [{ id: "location", prompt: "أين يظهر العرض؟", answerShape: "single_choice", options: ["الأوراق"], why: "يفصل بين الاحتمالات" }],
  treatment: { immediateActions: ["اعزل النبات"], monitoringSteps: ["راقب النمو"], treatmentGuidance: ["اتبع الملصق"], products: [{ productId: "product", name: "منتج ArtVert", reason: "توصية منشورة", priority: "HIGH", compatibilityWarning: "تحقق من التوافق" }], contraindications: ["لا تخلط المنتجات"], unknownCompatibilityWarnings: [] },
  emergencyFlags: [],
  disclaimer: "إخلاء مسؤولية آمن",
};

async function source(fileName: string) {
  return fs.readFile(path.join(process.cwd(), fileName), "utf8");
}

async function main() {
  for (const status of ["needs_information", "differential_ready", "insufficient_information"] as const) assert.equal(parseDoctorChatResponse({ ...response, status }).status, status);
  for (const status of ["unavailable", "session_expired", "knowledge_release_unavailable"] as const) assert.equal(parseDoctorChatResponse({ status, error: "حالة آمنة" }).status, status);
  assert.throws(() => parseDoctorChatResponse({ ...response, candidates: [{ ...response.candidates[0], confidence: "97%" }] }), /غير صالحة/);
  assert.equal(characterStateFor("needs_information"), "ASKING");
  assert.equal(characterStateFor("differential_ready", true), "WARNING");
  assert.equal(characterStateFor("session_expired"), "SESSION_EXPIRED");

  const [chat, question, result, layout, page] = await Promise.all([
    source("components/doctor/DoctorChat.tsx"), source("components/doctor/FollowUpQuestionCard.tsx"), source("components/doctor/DoctorResult.tsx"), source("app/(public)/layout.tsx"), source("app/(public)/doctor/page.tsx"),
  ]);
  for (const forbidden of ["@prisma", "ProductRepository", "data/products", "KnowledgeReader", "admin/"]) assert.ok(!`${chat}\n${question}\n${result}`.includes(forbidden), `Doctor UI must not import ${forbidden}.`);
  for (const shape of ["single_choice", "multiple_choice", "text", "boolean"]) assert.ok(question.includes(shape), `Follow-up UI must support ${shape}.`);
  for (const status of ["needs_information", "differential_ready", "insufficient_information", "unavailable", "session_expired", "knowledge_release_unavailable"]) assert.ok(chat.includes(status), `UI must handle ${status}.`);
  assert.match(chat, /AbortController/);
  assert.match(chat, /requestNumber/);
  assert.match(chat, /aria-live/);
  assert.match(chat, /lg:grid-cols/);
  assert.match(question, /motion-safe/);
  assert.match(result, /contraindications/);
  assert.match(result, /unknownCompatibilityWarnings/);
  assert.match(layout, /lang="ar"/);
  assert.match(layout, /dir="rtl"/);
  assert.match(page, /DoctorChat/);
  console.log("doctor-ui-tests:ok");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
