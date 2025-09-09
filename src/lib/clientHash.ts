// src/lib/clientHash.ts
// Tiny non-crypto, deterministic hash for client-only keys (e.g., sessionStorage).
export function clientHash(obj: unknown): string {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj);
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}
