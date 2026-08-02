import dotenv from "dotenv";
import { PlantCleanupProcessor } from "../lib/plants/plant-cleanup";

dotenv.config({ path: ".env.local" });

async function main() {
  const processor = new PlantCleanupProcessor();
  const orphanCount = await processor.queueOrphans();
  const processedCount = await processor.processPending(100);
  console.log(`plant-cleanup: queued ${orphanCount} orphan(s), processed ${processedCount} job(s)`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
