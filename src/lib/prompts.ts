// src/lib/prompts.ts
import "server-only";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

/**
 * In-memory cache of prompt file contents.
 * Key: "ideas" | "script" (or any future name you add)
 */
const cache = new Map<string, string>();

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a prompt file path robustly for both local dev and prod bundles.
 * Priority:
 *  1) <repo>/src/prompts/{name}.prompt.txt
 *  2) relative to this module: ../prompts/{name}.prompt.txt
 *  3) (fallback) <cwd>/prompts/{name}.prompt.txt  ← only if you ever move them
 */
async function resolvePromptPath(name: string): Promise<string> {
  const fname = `${name}.prompt.txt`;

  // 1) absolute from project root (works in local dev)
  const fromSrc = path.resolve(process.cwd(), "src", "prompts", fname);
  if (await fileExists(fromSrc)) return fromSrc;

  // 2) relative to this compiled file
  //    this works when the folder structure is preserved in the server bundle
  const fromHere = new URL(`../prompts/${fname}`, import.meta.url).pathname;
  if (await fileExists(fromHere)) return fromHere;

  // 3) fallback: root/prompts (only if you ever put them there)
  const fromRoot = path.resolve(process.cwd(), "prompts", fname);
  if (await fileExists(fromRoot)) return fromRoot;

  throw new Error(`Prompt file not found for "${name}" (looked in src/prompts and nearby)`);
}

/**
 * Get a prompt by name with in-memory caching.
 * In development, pass { fresh: true } to re-read from disk after edits.
 */
export async function getPrompt(
  name: string,
  opts?: { fresh?: boolean }
): Promise<string> {
  const useFresh = !!opts?.fresh && process.env.NODE_ENV === "development";

  if (!useFresh && cache.has(name)) {
    return cache.get(name)!;
  }

  const fullpath = await resolvePromptPath(name);
  const text = await readFile(fullpath, "utf8");
  cache.set(name, text);
  return text;
}

/** Basic {{var}} substitution */
export function renderTemplate(
  src: string,
  vars: Record<string, string | number>
): string {
  return src.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) =>
    String(vars[k] ?? "")
  );
}

/** Convenience: load + render */
export async function renderPrompt(
  name: string,
  vars: Record<string, string | number>,
  opts?: { fresh?: boolean }
): Promise<string> {
  const src = await getPrompt(name, opts);
  return renderTemplate(src, vars);
}
