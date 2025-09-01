// src/lib/hash.ts
import "server-only";
import crypto from "node:crypto";

/** Stable SHA-256 hex of the provided value (object/string). */
export function stableId(value: unknown): string {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 32);
}

/** Convenience: ID for idea fields */
export function ideaId(title: string, description?: string, hook?: string) {
  return stableId(`${title}||${description ?? ""}||${hook ?? ""}`);
}
