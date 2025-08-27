// app/idea/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SavedRow = { id: string; idea_id: string; title: string; description?: string | null };
type Idea = { title: string; description?: string };

const mockIdeas: Idea[] = [
  { title: "10-Minute Fitness Routine for Busy Creators", description: "Quick & effective workout without equipment." },
  { title: "Day in the Life: Fitness Influencer Edition", description: "From smoothies to squats, a full vlog idea." },
  { title: "Beginner Home Workout That Actually Works", description: "Easy, safe and results-driven exercises." },
  { title: "My 30-Day Body Transformation Story", description: "Personal and relatable content for engagement." },
  { title: "5 Fitness Myths That Are Wasting Your Time", description: "Bust myths and build trust with your audience." },
];

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();           // ✅ useParams for app router
  const ideaIndex = Number(params.id);                  // still using index-based URL
  const idea = useMemo(() => mockIdeas[ideaIndex], [ideaIndex]);

  const [loading, setLoading] = useState(false);
  const [savedRow, setSavedRow] = useState<SavedRow | null>(null);
  const [loginModal, setLoginModal] = useState(false);

  useEffect(() => {
    // Check if this idea is already saved for the logged-in user
    (async () => {
      try {
        const data = await fetchJson<{ items: SavedRow[] }>("/api/saved", { method: "GET", cache: "no-store" as any });
        const found = data.items.find((r) => r.idea_id === params.id);
        setSavedRow(found || null);
      } catch (e: any) {
        if (e.code === 401) {
          // not logged in — ignore; we’ll show login modal on click
          setSavedRow(null);
        }
      }
    })();
  }, [params.id]);

  const toggleSave = async () => {
    if (!idea) return;
    try {
      setLoading(true);
      if (savedRow) {
        // NOTE: Your API currently doesn't expose DELETE /api/saved/[id]
        // If/when you add it, this call will work. For now it will 404.
        await fetchJson(`/api/saved/${savedRow.id}`, { method: "DELETE" });
        setSavedRow(null);
      } else {
        const res = await fetchJson<{ item: SavedRow }>("/api/saved", {
          method: "POST",
          body: JSON.stringify({ idea_id: params.id, title: idea.title, description: idea.description }),
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

  if (!idea) return <main className="max-w-3xl mx-auto p-6">Idea not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6 relative">
      {/* Title row with a fixed spot for the heart */}
      <div className="mb-6 grid grid-cols-[1fr_auto] items-start gap-3">
        <h1 className="text-3xl font-bold text-primary">
          📹 {idea.title}
        </h1>

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

      {/* <h1 className="text-3xl font-bold mb-6 text-primary">📹 {idea.title}</h1> */}
      <p className="text-lg leading-relaxed text-gray-800 mb-10">{idea.description}</p>

      <div className="flex gap-4 flex-wrap">
        <Button onClick={() => navigator.clipboard.writeText(idea.title)} className="bg-primary text-white">
          📋 Copy Title
        </Button>
        <Button variant="secondary" onClick={() => router.push("/")}>
          ← Back to Search
        </Button>
      </div>
    </main>
  );
}
