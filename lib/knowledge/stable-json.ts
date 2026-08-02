import { createHash } from "node:crypto";

import type { JsonValue } from "@/schemas/knowledge-entity-envelope";

function sortValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
  }
  return value;
}

export function stableJsonBytes(value: JsonValue): Uint8Array {
  return Buffer.from(`${JSON.stringify(sortValue(value))}\n`, "utf8");
}

export function checksum(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
