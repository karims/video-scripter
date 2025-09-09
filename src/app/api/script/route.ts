// src/app/api/script/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LLM } from "@/config/llm";
import { getPrompt, renderTemplate } from "@/lib/prompts";
import { chatJson } from "@/lib/llm/openai";
import { stableId } from "@/lib/hash";
import { createSupabaseServerFromRequest } from "@/lib/supabaseServer";
import { withTimeout } from "@/lib/guards";

export const runtime = "nodejs";

const DEV = process.env.NODE_ENV !== "production";
const dlog = (...a: any[]) => { if (DEV) console.log("[/api/script]", ...a); };

type Params = {
  platform?: "shorts" | "tiktok" | "youtube" | "instagram";
  durationSec?: number;
  audience?: string;
  tone?: "warm" | "expert" | "hype" | "documentary" | "playful";
  format?: "listicle" | "tutorial" | "pov" | "story" | "myth-buster";
  pov?: "first" | "second" | "third";
  ctaStyle?: "soft" | "direct" | "community";
  seed?: number;
};

type CachePayload = {
  preview?: string;
  outline?: any;
  script?: any;
  usage?: any;
};

export async function POST(req: NextRequest) {
  try {
    // Supabase server client bound to this request (auth optional)
    const supabase = createSupabaseServerFromRequest(req);
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } as any }));

    // Body + validation
    const body = await req.json().catch(() => ({}));
    const { id, title, description, expand, params: rawParams } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id' (idea id)" }, { status: 400 });
    }
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Missing 'title'" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing 'description'" }, { status: 400 });
    }

    const expandKind: "preview" | "outline" | "script" =
      expand === "preview" || expand === "outline" || expand === "script" ? expand : "preview";

    // Normalize params / defaults
    const p: Params = {
      platform: rawParams?.platform ?? "shorts",
      durationSec: Math.min(120, Math.max(20, rawParams?.durationSec ?? 45)),
      audience: rawParams?.audience ?? "",
      tone: rawParams?.tone,
      format: rawParams?.format,
      pov: rawParams?.pov,
      ctaStyle: rawParams?.ctaStyle,
      seed: rawParams?.seed ?? 0,
    };

    dlog("in", { id, expand: expandKind, title: title.slice(0, 40) + (title.length > 40 ? "…" : "") });

    // Cache
    const cacheKey = stableId({ title, description, params: p });
    const { data: cachedRow, error: cacheReadErr } = await supabase
      .from("llm_cache")
      .select("payload")
      .eq("key", cacheKey)
      .maybeSingle();

    if (cacheReadErr) dlog("cache read error", cacheReadErr);

    let payload: CachePayload = (cachedRow?.payload as CachePayload) ?? {};

    const saveCache = async () => {
      const row = { key: cacheKey, payload };
      const { error } = await supabase.from("llm_cache").upsert(row, { onConflict: "key" });
      if (error) dlog("cache upsert error", error);
    };

    // --- PREVIEW ---
    if (expandKind === "preview" && !payload.preview) {
      try {
        const vars: Record<string, string | number> = {
          title,
          description,
          audience: p.audience ?? "",
          platform: p.platform ?? "shorts",
          durationSec: p.durationSec ?? 45,
          tone: p.tone ?? "",
          format: p.format ?? "",
          pov: p.pov ?? "",
          ctaStyle: p.ctaStyle ?? "",
          seed: p.seed ?? 0,
          maxTokens: 450,
        };

        const template = await getPrompt("preview");     // reads src/prompts/preview.prompt.txt
        const systemPrompt = renderTemplate(template, vars);

        const result = await withTimeout(
          chatJson<{ preview: string }>({
            model: LLM.IDEAS_MODEL,
            system: systemPrompt,
            user: "",
            temperature: 0.7,
            top_p: 0.9,
            max_output_tokens: 450,
          }),
          20000
        );

        const out = result?.data;                   // <-- use .data like in /api/ideas
        if (!out || typeof out.preview !== "string") {
        dlog("bad model response", result);
        return NextResponse.json({ error: "Bad preview response from model" }, { status: 502 });
        }

        payload.preview = out.preview.trim();
        await saveCache();
      } catch (e: any) {
        dlog("preview error", e?.message ?? e);
        return NextResponse.json({ error: e?.message ?? "Preview generation failed" }, { status: 502 });
      }
    }

    // --- OUTLINE (stub – fill later) ---
    if (expandKind === "outline" && !payload.outline) {
      // TODO: generate outline and set payload.outline
      await saveCache();
    }

    // --- SCRIPT (stub – fill later) ---
    if (expandKind === "script" && !payload.script) {
      // TODO: ensure outline exists or generate; then generate full script and set payload.script
      await saveCache();
    }

    return NextResponse.json({
      status: "ok",
      cached: !!cachedRow,
      idea: { id, title, description },
      params: p,
      preview: payload.preview ?? null,
      outline: payload.outline ?? null,
      script: payload.script ?? null,
    });
  } catch (e: any) {
    if (DEV) dlog("fatal", e?.message ?? e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
