// src/lib/guards.ts
import "server-only";
import crypto from "node:crypto";
import { LLM } from "@/config/llm";

// ===== Query validation =====
export function validateQuery(q: string): string {
  const s = (q ?? "").trim();
  if (!s) throw new Error("Invalid query");
  if (s.length > LLM.MAX_QUERY_CHARS) {
    return s.slice(0, LLM.MAX_QUERY_CHARS);
  }
  return s;
}

// ===== Simple denylist (expand as needed) =====
const DENY = [
  /suicide|self[-\s]?harm/i,
  /explicit|porn|nsfw|sexual|onlyfans/i,
  /hate\s*speech|racial slur|nazi|kkk/i,
  /bomb|explosive|weapon|gun\b/i,
  /drugs?\b|cocaine|heroin|meth\b/i,
];

export function denylist(q: string): string | null {
  for (const re of DENY) {
    if (re.test(q)) return "This topic isn’t allowed on the platform.";
  }
  return null;
}

// ===== IP Rate Limit (in-memory sliding window) =====
type Stamp = number; // ms
const rlStore = new Map<string, Stamp[]>();

export function ipHash(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Returns true if allowed, false if rate-limited.
 * windowMs: e.g., 600_000 (10 minutes)
 * max: e.g., 20
 */
export function rateLimitAnon(ip: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const key = ip;
  const arr = rlStore.get(key) ?? [];
  const cutoff = now - windowMs;
  const recent = arr.filter((t) => t >= cutoff);
  if (recent.length >= max) {
    rlStore.set(key, recent);
    return false;
  }
  recent.push(now);
  rlStore.set(key, recent);
  return true;
}

// ===== Timeout helper =====
export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error("Upstream timeout")), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t!);
  }
}
