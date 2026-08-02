import dotenv from "dotenv"; import { DiseaseCleanupProcessor } from "../lib/diseases/disease-cleanup";
dotenv.config({ path: ".env.local" });
async function main() { const processor = new DiseaseCleanupProcessor(); console.log(`disease-cleanup: queued ${await processor.queueOrphans()} orphan(s), processed ${await processor.processPending(100)} job(s)`); }
main().catch((error) => { console.error(error); process.exitCode = 1; });
