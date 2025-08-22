// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";
import IdeasBlock from "@/components/blocks/IdeasBlock";

type Idea = { id: string; title: string; description?: string };

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Just restore last session results
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

  const onSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    const q = query.trim();
    if (!q) return;

    try {
      setLoading(true);
      setErr(null);

      const data = await fetchJson<{ ideas: Idea[] }>("/api/ideas", {
        method: "POST",
        body: JSON.stringify({ query: q }),
      });

      setIdeas(data.ideas);
      sessionStorage.setItem("lastIdeasPayload", JSON.stringify({ query: q, ideas: data.ideas }));
    } catch (e: any) {
      // if (e.code === 401) router.push("/login");
      if (e.code === 401) setErr("Please sign in to generate ideas. It’s quick!");
      else if (e.code === 402) router.push("/pricing?limit=free");
      else setErr(e.message || "Something went wrong");
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
          onClick={onSubmit}
          className="px-5 py-3 rounded-xl bg-primary text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Ideas"}
        </button>
      </form>

      {err && <p className="text-red-600 mt-3 text-sm">{err}</p>}

      <IdeasBlock ideas={ideas} query={query} />
    </main>
  );
}
