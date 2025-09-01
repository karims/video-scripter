// src/app/api/ideas/route.ts
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import dayjs from "dayjs";
import { LLM } from "@/config/llm";
import { createSupabaseRouteClient } from "@/utils/supabase/route";
import { getPrompt, renderTemplate } from "@/lib/prompts";
import { chatJson } from "@/lib/llm/openai";
import { ideaId } from "@/lib/hash";
import { dedupeAndDiversify } from "@/lib/ideas/postprocess";
import { validateQuery, denylist, rateLimitAnon, withTimeout, ipHash } from "@/lib/guards";

// ----- Config you already had -----
const DAILY_FREE = 5;                  // or pull from env/config if you prefer
const ANON_COOKIE = "vs_free_ideas";   // cookie for anonymous daily usage

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 0) Prepare Supabase (cookie-bound)
    const { supabase, cookieResponse } = createSupabaseRouteClient(req);

    // 1) Try to read logged-in user (may be null)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) {
      const res = NextResponse.json({ error: userErr.message }, { status: 401 });
      for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
      return res;
    }

    // 2) Parse & guard user input
    const body = await req.json().catch(() => null);
    const rawQuery = String(body?.query ?? "");
    const query = validateQuery(rawQuery);
    const blocked = denylist(query);
    if (blocked) {
      const res = NextResponse.json({ error: blocked }, { status: 400 });
      for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
      return res;
    }

    // Light IP rate-limit for anonymous bursts (in addition to your daily cookie limit)
    if (!user) {
      const fwd = req.headers.get("x-forwarded-for") || "";
      const ip = fwd.split(",")[0]?.trim() || "127.0.0.1";
      const allowed = rateLimitAnon(ip, 600_000 /*10m*/, 20 /*req*/);
      if (!allowed) {
        const res = NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
        for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
        return res;
      }
    }

    // 3) Enforce free quota (anonymous via cookie; authed via DB when not subscribed)
    if (!user) {
      const today = dayjs().format("YYYY-MM-DD");
      const existing = req.cookies.get(ANON_COOKIE)?.value;
      let state: { d: string; c: number } = { d: today, c: 0 };
      if (existing) {
        try { state = JSON.parse(existing); } catch {}
      }
      if (state.d !== today) state = { d: today, c: 0 };
      if (state.c >= DAILY_FREE) {
        const res = NextResponse.json({ error: "FREE_LIMIT_REACHED" }, { status: 402 });
        res.cookies.set(ANON_COOKIE, JSON.stringify(state), { httpOnly: false, sameSite: "lax", path: "/" });
        for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
        return res;
      }
      // Pre-increment; if call fails we won't persist any new ideas anyway
      cookieResponse.cookies.set(ANON_COOKIE, JSON.stringify({ d: today, c: state.c + 1 }), {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    } else {
      // Logged in: check plan, then DB-based quota for non-subscribed users
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", user.id)
        .single();

      if (pErr) {
        const res = NextResponse.json({ error: pErr.message }, { status: 500 });
        for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
        return res;
      }

      if (!profile?.is_subscribed) {
        const since = dayjs().startOf("day").toISOString();
        const { data: events, error: eErr } = await supabase
          .from("usage_events")
          .select("count, created_at")
          .eq("user_id", user.id)
          .eq("event", "generate_idea")
          .gte("created_at", since);

        if (eErr) {
          const res = NextResponse.json({ error: eErr.message }, { status: 500 });
          for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
          return res;
        }

        const used = (events || []).reduce((sum: number, e: any) => sum + (e.count ?? 0), 0);
        if (used >= DAILY_FREE) {
          const res = NextResponse.json({ error: "FREE_LIMIT_REACHED" }, { status: 402 });
          for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
          return res;
        }
      }
    }

    // =========================
    // 4) LLM generation (replaces your mock ideas block)
    // =========================

    // a) Load & render the user prompt from file
    const template = await getPrompt("ideas"); // reads src/prompts/ideas.prompt.txt
    const userPrompt = renderTemplate(template, {
      topic: query,
      count: LLM.IDEAS_COUNT_IN,
    });

    // b) Minimal system guidance (kept short on purpose)
    const systemPrompt =
      "You are a professional short-form video creative director. Return only valid JSON as instructed.";

    // c) Call OpenAI expecting JSON back
    type IdeasJson = { ideas?: Array<{ title: string; description?: string; hook?: string }> };

    const result = await withTimeout(
      chatJson<IdeasJson>({
        model: LLM.IDEAS_MODEL,
        system: systemPrompt,
        user: userPrompt,
        temperature: LLM.TEMPERATURE_IDEAS,
        top_p: LLM.TOP_P_IDEAS,
        max_output_tokens: 1200,
      }),
      LLM.IDEAS_TIMEOUT_MS
    );

    const rawIdeas = Array.isArray(result.data?.ideas) ? result.data!.ideas! : [];
    if (!rawIdeas.length) {
      const res = NextResponse.json({ error: "Upstream produced no ideas" }, { status: 502 });
      for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
      return res;
    }

    // d) Light post-process: dedupe + diversify, then stable IDs
    const picked = dedupeAndDiversify(rawIdeas, LLM.IDEAS_COUNT_OUT);
    const ideas = picked.map((i) => ({
      id: ideaId(i.title, i.description, i.hook),
      title: i.title,
      description: i.description,
      hook: i.hook,
    }));

    // e) Usage log for authed users (non-blocking)
    if (user) {
      void supabase
        .from("usage_events")
        .insert({ user_id: user.id, event: "generate_idea", count: 1 })
        .then(
          () => undefined,   // success: ignore
          () => undefined    // error: ignore
        );
    }


    const res = NextResponse.json({ ideas }, { status: 200 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;

    // =========================
    // End LLM generation block
    // =========================
  } catch (err: any) {
    // Surface friendly errors to client
    const msg = err?.message || "Internal error";
    const status = err?.status && Number.isFinite(err.status) ? err.status : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
