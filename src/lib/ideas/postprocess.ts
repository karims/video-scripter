// src/lib/ideas/postprocess.ts
import "server-only";

export type RawIdea = { title: string; description?: string; hook?: string };
export type IdeaOut = { id: string; title: string; description?: string; hook?: string };

function normalizeTitle(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function jaccard(a: string, b: string) {
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  const inter = new Set([...A].filter((x) => B.has(x))).size;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
}

function classifyStyle(t: string): "story"|"list"|"challenge"|"myth"|"pov"|"tutorial"|"other" {
  const s = normalizeTitle(t);
  if (/\bday in the life|story|journey|diary\b/.test(s)) return "story";
  if (/\b(\d+|five|ten)\b|\blist|tips|ideas|mistakes\b/.test(s)) return "list";
  if (/\bchallenge|30 day|24 hour|vs\b/.test(s)) return "challenge";
  if (/\bmyth|misconception|truth\b/.test(s)) return "myth";
  if (/\bpov\b/.test(s)) return "pov";
  if (/\btutorial|how to|guide|step by step\b/.test(s)) return "tutorial";
  return "other";
}

/** Remove near-duplicates and ensure style variety with a round-robin pick. */
export function dedupeAndDiversify(
  candidates: RawIdea[],
  outCount: number
): RawIdea[] {
  const seen = new Set<string>();
  const unique: RawIdea[] = [];

  for (const c of candidates) {
    if (!c?.title) continue;
    const norm = normalizeTitle(c.title);
    if (seen.has(norm)) continue;

    // fuzzy near-dup check against the last ~40 accepted
    let isDup = false;
    for (let i = Math.max(0, unique.length - 40); i < unique.length; i++) {
      const prev = normalizeTitle(unique[i].title);
      if (prev.startsWith(norm) || norm.startsWith(prev) || jaccard(prev, norm) >= 0.7) {
        isDup = true; break;
      }
    }
    if (!isDup) {
      seen.add(norm);
      unique.push(c);
    }
  }

  // Bucket by style
  const buckets: Record<string, RawIdea[]> = {
    story: [], list: [], challenge: [], myth: [], pov: [], tutorial: [], other: [],
  };
  for (const u of unique) buckets[classifyStyle(u.title)].push(u);

  // Round-robin selection across buckets for variety
  const order = ["story","list","challenge","myth","pov","tutorial","other"];
  const out: RawIdea[] = [];
  let cursor = 0;
  while (out.length < outCount) {
    let added = false;
    for (let k = 0; k < order.length && out.length < outCount; k++) {
      const b = order[(cursor + k) % order.length];
      const item = buckets[b].shift();
      if (item) { out.push(item); added = true; }
    }
    if (!added) break; // all buckets empty
    cursor++;
  }

  // Fallback: if not enough, fill from remaining uniques
  if (out.length < outCount) {
    for (const u of unique) {
      if (out.length >= outCount) break;
      if (!out.includes(u)) out.push(u);
    }
  }
  return out.slice(0, outCount);
}
