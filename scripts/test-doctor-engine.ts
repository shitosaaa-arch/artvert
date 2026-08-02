import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import { DoctorEngine } from "../engine/doctor/doctor-engine";
import type { DoctorSessionState } from "../engine/doctor/doctor-types";
import { InMemoryDoctorSessionStore } from "../lib/doctor/session-store";
import type { KnowledgeExportStore } from "../lib/knowledge/knowledge-export-store";
import { KnowledgeReader } from "../lib/knowledge/knowledge-reader";
import { checksum, stableJsonBytes } from "../lib/knowledge/stable-json";
import type { KnowledgeCurrentPointer, KnowledgeManifest } from "../lib/knowledge/knowledge-types";
import { parseDoctorChatRequest } from "../schemas/doctor";
import type { KnowledgeEntityEnvelope } from "../schemas/knowledge-entity-envelope";

class MemoryStore implements KnowledgeExportStore {
  constructor(private readonly releases: Map<string, Map<string, Uint8Array>>, private pointer: KnowledgeCurrentPointer | null) {}
  writeRelease(): Promise<void> { return Promise.resolve(); }
  async readReleaseFile(version: string, fileName: string): Promise<Uint8Array> {
    const bytes = this.releases.get(version)?.get(fileName);
    if (!bytes) throw new Error("Release file is missing.");
    return bytes;
  }
  async writeCurrentPointer(pointer: KnowledgeCurrentPointer): Promise<void> { this.pointer = pointer; }
  async readCurrentPointer(): Promise<KnowledgeCurrentPointer | null> { return this.pointer; }
  async removeCurrentPointer(): Promise<void> { this.pointer = null; }
}

function entity(type: KnowledgeEntityEnvelope["type"], id: string, name: string, payload: KnowledgeEntityEnvelope["payload"] = {}, publicationState: KnowledgeEntityEnvelope["publicationState"] = "PUBLISHED"): KnowledgeEntityEnvelope {
  return { id, type, slug: id, name, payload, schemaVersion: 1, publicationState, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

function release(version: string, snapshot: Record<KnowledgeEntityEnvelope["type"], KnowledgeEntityEnvelope[]>) {
  const files = new Map<string, Uint8Array>();
  const names = { PLANT: "plants.json", DISEASE: "diseases.json", PEST: "pests.json", DEFICIENCY: "deficiencies.json", PRODUCT: "products.json" } as const;
  const manifestFiles = Object.fromEntries(Object.entries(names).map(([type, name]) => {
    const bytes = stableJsonBytes(snapshot[type as KnowledgeEntityEnvelope["type"]]);
    files.set(name, bytes);
    return [name, { checksum: checksum(bytes), entityCount: snapshot[type as KnowledgeEntityEnvelope["type"]].length }];
  })) as KnowledgeManifest["files"];
  const manifest: KnowledgeManifest = { formatVersion: 1, releaseVersion: version, contentChecksum: "fixture-content", files: manifestFiles };
  const manifestBytes = stableJsonBytes(manifest);
  files.set("manifest.json", manifestBytes);
  return { files, manifestChecksum: checksum(manifestBytes) };
}

async function main() {
  const snapshot = {
    PLANT: [entity("PLANT", "tomato", "Tomato", { aliases: ["tomato plant", "طماطم"] })],
    DISEASE: [entity("DISEASE", "early-blight", "Early blight", { plants: ["tomato"], symptoms: ["leaf spot", "brown rings"], timing: ["summer"], immediateActions: ["Remove heavily affected leaves."], monitoring: ["Inspect new growth daily."], treatments: ["Use only label-approved treatment guidance." ] })],
    PEST: [entity("PEST", "aphid", "Aphid", { plants: ["tomato"], symptoms: ["sticky honeydew", "curling leaves"] })],
    DEFICIENCY: [entity("DEFICIENCY", "nitrogen", "Nitrogen deficiency", { plants: ["tomato"], symptoms: ["yellow lower leaves"] })],
    PRODUCT: [
      entity("PRODUCT", "blight-product", "Blight support", { recommendations: [{ diseaseId: "early-blight", state: "ACTIVE", priority: "HIGH" }] }),
      entity("PRODUCT", "contra-product", "Contraindicated support", { recommendations: [{ diseaseId: "early-blight", state: "CONTRAINDICATED", priority: "CRITICAL", contraindications: "Do not use for this case." }] }),
      entity("PRODUCT", "draft-product", "Draft support", { recommendations: [{ diseaseId: "early-blight", state: "ACTIVE", priority: "CRITICAL" }] }, "DRAFT"),
    ],
  };
  const first = release("doctor-v1", snapshot);
  const store = new MemoryStore(new Map([["doctor-v1", first.files]]), { formatVersion: 1, releaseVersion: "doctor-v1", manifestChecksum: first.manifestChecksum });
  const engine = new DoctorEngine(new KnowledgeReader(store));

  const input = { context: { plant: "tomato plant", symptoms: ["leaf spot"], timing: "summer" } };
  const result = await engine.diagnose(input);
  assert.equal(result.knowledgeRelease.version, "doctor-v1");
  assert.equal(result.candidates[0]?.id, "early-blight");
  assert.ok(["HIGH", "MODERATE"].includes(result.candidates[0]?.confidence ?? ""));
  assert.equal(result.treatment.products[0]?.productId, "blight-product");
  assert.ok(result.treatment.products.every((product) => product.productId !== "contra-product" && product.productId !== "draft-product"));
  assert.ok(result.candidates[0]?.matchedEvidence.every((item) => item.provenance === "KNOWLEDGE_MATCH"));

  const repeated = await engine.diagnose(input);
  assert.deepEqual(result.candidates.map((candidate) => candidate.id), repeated.candidates.map((candidate) => candidate.id), "Ranking must be deterministic.");
  const answered = await engine.diagnose({ answers: { symptom_location: "leaves" } }, result.session);
  assert.ok(!answered.followUpQuestions.some((question) => question.id === "symptom_location"), "Answered questions must not repeat.");
  assert.equal((await engine.diagnose({ context: { plant: "tomato" } })).status, "insufficient_information");

  await assert.rejects(async () => parseDoctorChatRequest({ state: { candidates: [{ score: 100 }] } }), /unsupported/i, "Client state tampering must be rejected.");
  await assert.rejects(async () => parseDoctorChatRequest({ context: { symptoms: Array.from({ length: 21 }, () => "spot") } }), /symptoms/i, "Input limits must be enforced.");

  const sessions = new InMemoryDoctorSessionStore(60_000);
  const session = await sessions.create(result.session);
  assert.equal((await sessions.get(session.id))?.state.releaseVersion, "doctor-v1", "Sessions must retain the pinned release.");
  const expiredStore = new InMemoryDoctorSessionStore(0);
  const expired = await expiredStore.create(result.session);
  assert.equal(await expiredStore.get(expired.id), null, "Expired sessions must not be returned.");

  const missingRelease: DoctorSessionState = { ...result.session, releaseVersion: "missing", manifestChecksum: "missing" };
  assert.equal((await engine.diagnose({}, missingRelease)).status, "knowledge_release_unavailable");

  const engineSource = await fs.readFile(path.join(process.cwd(), "engine", "doctor", "doctor-engine.ts"), "utf8");
  assert.ok(!/prisma|repository|admin|filesystem|createKnowledgeExportStore/i.test(engineSource), "Doctor engine must only use KnowledgeReader and generated knowledge JSON.");
  console.log("doctor-engine-tests:ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
