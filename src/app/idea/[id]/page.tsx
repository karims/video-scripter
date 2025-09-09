// app/idea/[id]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { findIdeaByIdClient } from "@/lib/clientIdeas";
import { clientHash } from "@/lib/clientHash"; // if you expose it client-side; else compute a simple paramsKey
// types
type SavedRow = { id: string; idea_id: string; title: string; description?: string | null };
type Idea = { id: string; title: string; description?: string };

const DEFAULT_PARAMS = {
  platform: "shorts",
  durationSec: 45,
  tone: undefined,
  format: undefined,
  pov: undefined,
  ctaStyle: undefined,
  seed: 0,
};

export default function IdeaDetailPage() {
  const router = useRouter();
  const { id: ideaId } = useParams<{ id: string }>();

  // resolve idea (title/description) from client caches
  const { idea } = useMemo(() => findIdeaByIdClient(ideaId), [ideaId]);

  const [preview, setPreview] = useState<string | null>(null);
  const [script, setScript] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedRow, setSavedRow] = useState<SavedRow | null>(null);
  const [loginModal, setLoginModal] = useState(false);

  // Optional: params drawer later; for now use defaults
  const params = DEFAULT_PARAMS;

  // local session cache keys
  const paramsKey = useMemo(() => clientHash({ ideaId, params }), [ideaId, params]);

  // Load preview first (client cache → server)
  useEffect(() => {
    if (!idea) return;
    setError(null);

    // session cache
    try {
      const cached = sessionStorage.getItem(`preview:${ideaId}:${paramsKey}`);
      if (cached) {
        setPreview(JSON.parse(cached));
        return;
      }
    } catch {}

    // fetch from API
    (async () => {
      setLoadingPreview(true);
      try {
        const res = await fetchJson<any>("/api/script", {
          method: "POST",
          body: JSON.stringify({
            id: ideaId,
            title: idea.title,
            description: idea.description,
            params,
            expand: "preview",
          }),
        });
        if (res.preview) {
          setPreview(res.preview);
          sessionStorage.setItem(`preview:${ideaId}:${paramsKey}`, JSON.stringify(res.preview));
        }
        if (res.script) {
          setScript(res.script);
          sessionStorage.setItem(`script:${ideaId}:${paramsKey}`, JSON.stringify(res.script));
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load preview");
      } finally {
        setLoadingPreview(false);
      }
    })();
  }, [ideaId, idea, paramsKey]);

  // Saved status (unchanged)
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

  const generateScript = async () => {
    if (!idea || loadingScript) return;
    setError(null);
    setLoadingScript(true);
    try {
      const res = await fetchJson<any>("/api/script", {
        method: "POST",
        body: JSON.stringify({
          id: ideaId,
          title: idea.title,
          description: idea.description,
          params,
          expand: "script",
        }),
      });
      if (res.script) {
        setScript(res.script);
        sessionStorage.setItem(`script:${ideaId}:${paramsKey}`, JSON.stringify(res.script));
      }
      if (!preview && res.preview) {
        setPreview(res.preview);
        sessionStorage.setItem(`preview:${ideaId}:${paramsKey}`, JSON.stringify(res.preview));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to generate script");
    } finally {
      setLoadingScript(false);
    }
  };

  if (!idea) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Idea not found</h1>
        <p className="text-sm text-gray-600 mb-6">Open this from your recent results to view details.</p>
        <Button variant="secondary" onClick={() => router.push("/")}>← Back to Search</Button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="mb-6 grid grid-cols-[1fr_auto] items-start gap-3">
        <h1 className="text-3xl font-bold text-primary">📹 {idea.title}</h1>

        {/* Save button (unchanged) */}
        {/* ... your existing save/unsave button here ... */}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Preview section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Preview</h2>
        {loadingPreview ? (
          <div className="animate-pulse h-20 rounded-lg bg-gray-100" />
        ) : preview ? (
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{preview}</p>
        ) : (
          <p className="text-gray-500">No preview yet.</p>
        )}
      </section>

      {/* Script controls */}
      {!script && (
        <div className="mb-8">
          <Button onClick={generateScript} disabled={loadingScript} className="bg-primary text-white">
            {loadingScript ? "Generating script…" : "Generate full script"}
          </Button>
          <p className="mt-2 text-xs text-gray-500">~700 tokens estimated. Caches for a week.</p>
        </div>
      )}

      {/* Script render */}
      {script && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Script</h2>
          {Array.isArray(script.sections) ? (
            <div className="space-y-3">
              {script.sections.map((s: any, i: number) => (
                <div key={i} className="rounded-lg border p-3">
                  {s.on_screen_text && <div className="text-xs font-semibold mb-1">Text: {s.on_screen_text}</div>}
                  <div className="text-gray-900 whitespace-pre-wrap">{s.voiceover}</div>
                  {s.broll && <div className="mt-1 text-sm text-gray-600">B-roll: {s.broll}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No script content.</p>
          )}
        </section>
      )}

      {/* Login modal unchanged */}
      {/* ... your existing Dialog for login ... */}
    </main>
  );
}
