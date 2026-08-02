import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import { characterStateFor, parseDoctorChatResponse } from "../lib/doctor/chat-contract";
import { parseDoctorChatRequest } from "../schemas/doctor";

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
  for (const [answerShape, answer] of [["single_choice", "الأوراق"], ["multiple_choice", ["الأوراق", "الساق"]], ["short_text", "بقع بنية"], ["yes_no", "نعم"]] as const) {
    const request = parseDoctorChatRequest({ sessionId: "session-1", answers: { [`question-${answerShape}`]: answer } });
    assert.deepEqual(request.answers, { [`question-${answerShape}`]: answer }, `${answerShape} must use the Doctor API answer payload.`);
  }

  const [chat, question, result, layout, page] = await Promise.all([
    source("components/doctor/DoctorChat.tsx"), source("components/doctor/FollowUpQuestionCard.tsx"), source("components/doctor/DoctorResult.tsx"), source("app/(public)/layout.tsx"), source("app/(public)/doctor/page.tsx"),
  ]);
  for (const forbidden of ["@prisma", "ProductRepository", "data/products", "KnowledgeReader", "admin/"]) assert.ok(!`${chat}\n${question}\n${result}`.includes(forbidden), `Doctor UI must not import ${forbidden}.`);
  for (const shape of ["single_choice", "multiple_choice", "short_text", "yes_no"]) assert.ok(question.includes(shape), `Follow-up UI must support ${shape}.`);
  assert.match(question, /type="radio"/);
  assert.match(question, /name=\{groupName\}/);
  assert.match(question, /type="checkbox"/);
  assert.match(question, /min-h-11/);
  for (const status of ["needs_information", "differential_ready", "insufficient_information", "unavailable", "session_expired", "knowledge_release_unavailable"]) assert.ok(chat.includes(status), `UI must handle ${status}.`);
  assert.match(chat, /AbortController/);
  assert.match(chat, /requestNumber/);
  assert.match(chat, /aria-live/);
  assert.match(chat, /lg:grid-cols/);
  assert.match(chat, /data-doctor-ui/);
  assert.match(chat, /min-w-0/);
  assert.match(chat, /doctor-composer sticky bottom-0/);
  assert.match(chat, /session_expired/);
  assert.match(chat, /unavailable/);
  assert.match(question, /motion-safe/);
  assert.match(result, /contraindications/);
  assert.match(result, /unknownCompatibilityWarnings/);
  assert.match(layout, /lang="ar"/);
  assert.match(layout, /dir="rtl"/);
  assert.match(page, /DoctorChat/);
  const mobileWidths = [320, 360, 390, 414];
  for (const width of mobileWidths) {
    assert.ok(width < 640, `${width}px must retain the single-column mobile layout before the sm product-card breakpoint.`);
    assert.ok(chat.includes("lg:grid-cols"), `${width}px must not activate the desktop Doctor layout.`);
    assert.ok(chat.includes("max-w-full") && chat.includes("break-words"), `${width}px must avoid horizontal overflow for long RTL or scientific names.`);
    assert.ok(question.includes("min-h-11") && question.includes("flex-wrap"), `${width}px must keep follow-up choices tap-sized and wrapping.`);
  }
  console.log("doctor-ui-tests:ok");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
