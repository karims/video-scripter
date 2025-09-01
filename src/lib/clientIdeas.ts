export type Idea = { id: string; title: string; description?: string; hook?: string };
type RecentEntry = { query: string; ideas: Idea[]; ts: number };

const RECENTS_KEY = "vs_recent_searches";

function hasWindow() { return typeof window !== "undefined"; }

export function getCurrentBatch(): { query: string; ideas: Idea[] } | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.sessionStorage.getItem("lastIdeasPayload");
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!Array.isArray(j?.ideas)) return null;
    return { query: String(j.query ?? ""), ideas: j.ideas as Idea[] };
  } catch { return null; }
}

export function getRecents(): RecentEntry[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentEntry[]) : [];
  } catch { return []; }
}

export function findIdeaByIdClient(id: string): { idea: Idea | null; source: "current" | "recents" | null } {
  const current = getCurrentBatch();
  if (current?.ideas?.length) {
    const hit = current.ideas.find(i => i.id === id) ?? null;
    if (hit) return { idea: hit, source: "current" };
  }
  const recents = getRecents();
  for (const r of recents) {
    const hit = r.ideas.find(i => i.id === id);
    if (hit) return { idea: hit, source: "recents" };
  }
  return { idea: null, source: null };
}
