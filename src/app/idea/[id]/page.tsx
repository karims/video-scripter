"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findIdeaByIdClient } from "@/lib/clientIdeas";

type SavedRow = { id: string; idea_id: string; title: string; description?: string | null };
type Idea = { id: string; title: string; description?: string };

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const ideaId = params.id;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [checked, setChecked] = useState(false); // we’ve attempted to resolve from storage
  const [loading, setLoading] = useState(false);
  const [savedRow, setSavedRow] = useState<SavedRow | null>(null);
  const [loginModal, setLoginModal] = useState(false);

  // Resolve from client caches after mount
  useEffect(() => {
    const { idea } = findIdeaByIdClient(ideaId);
    setIdea(idea as any || null);
    setChecked(true);
  }, [ideaId]);

  // Query saved status (only matters if user is logged in; harmless otherwise)
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson<{ items: SavedRow[] }>("/api/saved", { method: "GET", cache: "no-store" as any });
        const found = data.items.find((r) => r.idea_id === ideaId);
        setSavedRow(found || null);
      } catch (e: any) {
        if (e.code === 401) setSavedRow(null);
      }
    })();
  }, [ideaId]);

  const toggleSave = async () => {
    if (!idea) return;
    try {
      setLoading(true);
      if (savedRow) {
        await fetchJson(`/api/saved/${savedRow.id}`, { method: "DELETE" }); // if you add this route; otherwise no-op
        setSavedRow(null);
      } else {
        const res = await fetchJson<{ item: SavedRow }>("/api/saved", {
          method: "POST",
          body: JSON.stringify({ idea_id: ideaId, title: idea.title, description: idea.description }),
        });
        setSavedRow(res.item);
      }
    } catch (e: any) {
      if (e.code === 401) setLoginModal(true);
      else if (e.code === 402) router.push("/pricing?limit=free");
      else console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Until we’ve checked storage, don’t show “not found”
  if (!checked) {
    return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  }

  if (!idea) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Idea not found</h1>
        <p className="text-sm text-gray-600 mb-6">
          This idea isn’t in your current results or recent searches on this device.
        </p>
        <Button variant="secondary" onClick={() => router.push("/")}>← Back to Search</Button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="mb-6 grid grid-cols-[1fr_auto] items-start gap-3">
        <h1 className="text-3xl font-bold text-primary">📹 {idea.title}</h1>
        <button
          onClick={toggleSave}
          disabled={loading}
          title={savedRow ? "Unsave" : "Save"}
          className={cn(
            "rounded-md px-2 py-1 text-2xl leading-none transition-colors",
            savedRow ? "text-red-500" : "text-black/70 hover:text-black"
          )}
          aria-label={savedRow ? "Unsave Idea" : "Save Idea"}
        >
          {savedRow ? "❤️" : "🖤"}
        </button>
      </div>

      <p className="text-lg leading-relaxed text-gray-800 mb-10">{idea.description}</p>

      <div className="flex gap-4 flex-wrap">
        <Button onClick={() => navigator.clipboard.writeText(idea.title)} className="bg-primary text-white">
          📋 Copy Title
        </Button>
        <Button variant="secondary" onClick={() => router.push("/")}>
          ← Back to Search
        </Button>
      </div>

      <Dialog open={loginModal} onOpenChange={setLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Please log in to save ideas to your account.</p>
          <DialogFooter>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
