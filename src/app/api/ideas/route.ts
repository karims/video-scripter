import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import dayjs from "dayjs";
import { createSupabaseRouteClient } from "@/utils/supabase/route";

const DAILY_FREE = 5;                 // or 3..5 from your config
const ANON_COOKIE = "vs_free_ideas";  // name for anonymous quota cookie
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { supabase, cookieResponse } = createSupabaseRouteClient(req);

    // Try to read the logged-in user (may be null)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse body once
    const body = await req.json().catch(() => null);
    const query = body?.query?.toString().trim();
    if (!query) {
      const res = NextResponse.json({ error: "Missing query" }, { status: 400 });
      for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
      return res;
    }

    // =========================
    // Quota enforcement section
    // =========================
    if (!user) {
      // Anonymous user → enforce cookie-based daily limit
      const today = dayjs().format("YYYY-MM-DD");
      const existing = req.cookies.get(ANON_COOKIE)?.value;
      let state: { d: string; c: number } = { d: today, c: 0 };
      if (existing) {
        try { state = JSON.parse(existing); } catch {}
      }
      if (state.d !== today) state = { d: today, c: 0 };

      if (state.c >= DAILY_FREE) {
        const res = NextResponse.json({ error: "FREE_LIMIT_REACHED" }, { status: 402 });
        // re-set cookie (unchanged) so client can show proper state
        res.cookies.set(ANON_COOKIE, JSON.stringify(state), {
          httpOnly: false,
          sameSite: "lax",
          path: "/",
        });
        // propagate any supabase refresh cookies
        for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
        return res;
      }

      // increment and set cookie
      const updated = { d: today, c: state.c + 1 };
      // session cookie is fine; daily reset relies on date flip
      cookieResponse.cookies.set(ANON_COOKIE, JSON.stringify(updated), {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    } else {
      // Logged-in: check subscription, then DB-based quota if not subscribed
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

    // ======================
    // Idea generation (same)
    // ======================
    const ideas = Array.from({ length: 10 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      title: `${i + 1}. ${query} — Idea`,
      description: `A compelling angle on "${query}" for influencers.`,
    }));

    // Log usage for logged-in users only (respect RLS with auth.uid())
    if (user) {
      await supabase
        .from("usage_events")
        .insert({ user_id: user.id, event: "generate_idea", count: 1 });
    }

    const res = NextResponse.json({ ideas }, { status: 200 });
    // attach updated anon cookie (if any) and supabase refresh cookies
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
