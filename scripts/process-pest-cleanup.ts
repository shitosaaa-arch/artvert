import dotenv from "dotenv"; import { PestCleanupProcessor } from "../lib/pests/pest-cleanup";
dotenv.config({ path: ".env.local" });
async function main() { const processor = new PestCleanupProcessor(); console.log(`pest-cleanup: queued ${await processor.queueOrphans()} orphan(s), processed ${await processor.processPending(100)} job(s)`); }
main().catch((error) => { console.error(error); process.exitCode = 1; });
