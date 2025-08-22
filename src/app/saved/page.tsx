// app/saved/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";

type Row = { id: string; idea_id: string; title: string; description?: string | null; created_at: string };

export default function SavedIdeasPage() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await fetchJson<{ items: Row[] }>("/api/saved", { method: "GET", cache: "no-store" as any });
        setItems(items);
      } catch (e: any) {
        if (e.code === 401) router.push("/login");
        else setErr(e.message || "Failed to load saved ideas");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return <main className="max-w-2xl mx-auto p-6">Loading…</main>;
  if (err) return <main className="max-w-2xl mx-auto p-6 text-red-600">{err}</main>;

  if (!items.length) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-semibold mb-2">No Saved Ideas Yet</h2>
        <p className="text-gray-600 mb-4">Start saving ideas to see them here!</p>
        <button
          className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90"
          onClick={() => router.push("/")}
        >
          ← Back to Search
        </button>
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl px-4 py-10 mx-auto">
      <h2 className="text-2xl font-semibold text-primary mb-6">Your Saved Ideas</h2>

      <div className="divide-y divide-gray-200">
        {items.map((idea, idx) => (
          <div key={idea.id} className="py-5 group transition-all flex items-start justify-between">
            <div className="cursor-pointer" onClick={() => router.push(`/idea/${idea.idea_id}`)}>
              <h3 className="text-lg font-bold text-black group-hover:underline underline-offset-4 decoration-primary transition">
                {idx + 1}. {idea.title}
              </h3>
              {idea.description && (
                <p className="text-gray-600 mt-1 text-sm leading-relaxed group-hover:text-gray-700 transition">
                  {idea.description}
                </p>
              )}
            </div>

            <button
              title="Remove from Saved"
              onClick={async () => {
                await fetchJson(`/api/saved/${idea.id}`, { method: "DELETE" });
                setItems((s) => s.filter((x) => x.id !== idea.id));
              }}
              className="text-red-500 text-xl hover:scale-110 transition ml-4"
            >
              ❤️
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
