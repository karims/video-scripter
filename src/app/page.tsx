// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import IdeasBlock from "@/components/blocks/IdeasBlock";
import FreeLimitModal from "@/components/ui/FreeLimitModal";
import { useUser } from "@/context/UserContext";

type Idea = { id: string; title: string; description?: string };

type RecentEntry = {
  query: string;
  ideas: Idea[];
  ts: number; // unix ms
};

const RECENTS_KEY = "vs_recent_searches";
const SKIP_AUTO_RESTORE_KEY = "vs_skip_autorestore";
const MAX_RECENTS = 3;
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days


function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function loadRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const now = Date.now();
    const list: RecentEntry[] = JSON.parse(raw);
    const filtered = list.filter((e) => now - e.ts <= MAX_AGE_MS);
    if (filtered.length !== list.length) {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

function saveRecents(list: RecentEntry[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {}
}

function upsertRecent(query: string, ideas: Idea[]) {
  const now = Date.now();
  const norm = normalizeQuery(query);
  const list = loadRecents()
    .filter((e) => normalizeQuery(e.query) !== norm)
    .slice(0, MAX_RECENTS - 1);
  const next = [{ query, ideas, ts: now }, ...list];
  saveRecents(next);
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useUser();

  const [query, setQuery] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  // recents state & restored banner
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const [restored, setRestored] = useState(false); // true only when auto-restored on mount

  const MAX_CHARS = 300;
  const remaining = Math.max(0, MAX_CHARS - query.length);


  // Initial load: optionally auto-restore the most recent non-expired search
  useEffect(() => {
    const list = loadRecents();
    setRecents(list);

    const skip = sessionStorage.getItem(SKIP_AUTO_RESTORE_KEY) === "1";
    if (!skip && list.length > 0) {
      const last = list[0];
      setQuery(last.query);
      setIdeas(last.ideas);
      setRestored(true); // show banner only for auto-restore on mount
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        if (r.status === 401) {
          setErr("Please sign in to generate ideas. It’s quick!");
        } else if (r.status === 402) {
          setLimitOpen(true);
        } else {
          setErr((data as any)?.error || "Something went wrong");
        }
        return;
      }

      const nextIdeas = (data as any).ideas as Idea[];
      setIdeas(nextIdeas);
      upsertRecent(q, nextIdeas);
      setRecents(loadRecents());
      setRestored(false); // this is a fresh search
      sessionStorage.removeItem(SKIP_AUTO_RESTORE_KEY); // user acted → allow future auto-restore
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  const clearCurrent = () => {
    setIdeas([]);
    setQuery("");            // also clear the input
    setErr(null);
    setRestored(false);
    // persist intent: do not auto-restore again in this tab until the user searches/clicks recent
    sessionStorage.setItem(SKIP_AUTO_RESTORE_KEY, "1");
  };

  const onClickRecent = (entry: RecentEntry) => {
    setQuery(entry.query);
    setIdeas(entry.ideas);
    setRestored(false); // not an auto-restore; user intentionally selected a recent
    sessionStorage.removeItem(SKIP_AUTO_RESTORE_KEY); // user acted → allow auto-restore later
  };

  const removeRecent = (entry: RecentEntry) => {
    const norm = normalizeQuery(entry.query);
    const next = loadRecents().filter((e) => normalizeQuery(e.query) !== norm);
    saveRecents(next);
    setRecents(next);
  };

  const showRecents = useMemo(() => recents.slice(0, MAX_RECENTS), [recents]);

  return (
    // <main ...> widen at larger breakpoints
  <main className="w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 text-center">
      <h1 className="text-3xl font-bold text-primary">AI Video Idea Generator</h1>

      {/* Search row (fixed) */}
      <form onSubmit={onSubmit} className="mt-6 flex items-stretch gap-3 w-full">
        {/* input column: allow it to actually grow */}
        <div className="flex-1 min-w-0">
          <input
            className="block w-full h-12 border rounded-xl px-4"
            value={query}
            maxLength={MAX_CHARS}
            placeholder="e.g., fitness for new moms…"
            onChange={(e) => setQuery(e.target.value.slice(0, MAX_CHARS))}
          />
          <div className="mt-1 text-right text-xs text-[#0F172A66]">
            {remaining} / {MAX_CHARS}
          </div>
        </div>

        {/* fixed-width button that doesn’t steal space */}
        <button
          type="submit"
          className="h-12 w-[176px] shrink-0 rounded-xl bg-primary text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Ideas"}
        </button>
      </form>

      {/* Restored banner (only when auto-restored on mount) */}
      {restored && ideas.length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#0F172A1A] bg-[#0F172A0A] px-3 py-2 text-sm text-[#0F172A]">
          <span>Restored last search</span>
          <button
            onClick={clearCurrent}
            className="underline underline-offset-2 hover:opacity-80"
          >
            Clear
          </button>
        </div>
      )}

      {/* Recent searches chips */}
      {showRecents.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-[#0F172A66]">
            Recent
          </div>
          <div className="flex flex-wrap gap-2">
            {showRecents.map((r) => (
              <div
                key={`${r.query}-${r.ts}`}
                className="group inline-flex items-center gap-2 rounded-full border border-[#0F172A1A] bg-white px-3 py-1.5 text-sm text-[#0F172A] hover:bg-[#0F172A0A] cursor-pointer"
                onClick={() => onClickRecent(r)}
                title={new Date(r.ts).toLocaleString()}
                role="button"
              >
                <span className="max-w-[200px] truncate">{r.query}</span>
                <button
                  aria-label="Remove recent"
                  className="ml-1 text-[#0F172A66] hover:text-[#0F172A] transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(r);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {err && <p className="text-red-600 mt-3 text-sm">{err}</p>}

      <IdeasBlock ideas={ideas} query={query} />

      <FreeLimitModal
        open={limitOpen}
        onOpenChange={setLimitOpen}
        isLoggedIn={!!user}
      />
    </main>
  );
}
