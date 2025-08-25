// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// (If fetchJson doesn't force content-type, we can inline fetch to be sure.)

type Idea = { id: string; title: string; description?: string };

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const last = sessionStorage.getItem("lastIdeasPayload");
      if (last) {
        const { query, ideas } = JSON.parse(last);
        setQuery(query || "");
        setIdeas(ideas || []);
      }
    } catch {}
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
        headers: { "Content-Type": "application/json" }, // ensure JSON
        body: JSON.stringify({ query: q }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 401) setErr("Please sign in to generate ideas. It’s quick!");
        else if (r.status === 402) router.push("/pricing?limit=free");
        else setErr(data?.error || "Something went wrong");
        return;
      }
      setIdeas(data.ideas);
      sessionStorage.setItem("lastIdeasPayload", JSON.stringify({ query: q, ideas: data.ideas }));
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">AI Video Idea Generator</h1>

      <form onSubmit={onSubmit} className="mt-6 flex gap-3">
        <input
          className="flex-1 border rounded-xl px-4 py-3"
          value={query}
          placeholder="e.g., fitness for new moms…"
          onChange={(e) => setQuery(e.target.value.slice(0, 120))}
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-primary text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Ideas"}
        </button>
      </form>

      {err && <p className="text-red-600 mt-3 text-sm">{err}</p>}

      {/* keep your IdeasBlock as is */}
    </main>
  );
}
