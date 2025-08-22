// app/api/ideas/route.ts
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import dayjs from "dayjs";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";

const DAILY_FREE = 5;
export const runtime = "nodejs"; // explicit (defensive) – route handlers default to Node, but this avoids Edge surprises

export async function POST(req: NextRequest) {
  try {
    // Build route-bound client (reads request cookies, records refreshed ones)
    const { supabase, cookieResponse } = createSupabaseRouteClient(req);

    // Read/refresh session (auth doesn't happen here; middleware + login do that)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // propagate any refreshed cookies (if set) to the client
      for (const cookie of cookieResponse.cookies.getAll()) res.cookies.set(cookie);
      return res;
    }

    // Parse body exactly once
    const body = await req.json().catch(() => null);
    const query = body?.query?.toString().trim();
    if (!query) {
      const res = NextResponse.json({ error: "Missing query" }, { status: 400 });
      for (const cookie of cookieResponse.cookies.getAll()) res.cookies.set(cookie);
      return res;
    }

    // Subscription / free quota check
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("is_subscribed")
      .eq("id", user.id)
      .single();

    if (pErr) {
      const res = NextResponse.json({ error: pErr.message }, { status: 500 });
      for (const cookie of cookieResponse.cookies.getAll()) res.cookies.set(cookie);
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
        for (const cookie of cookieResponse.cookies.getAll()) res.cookies.set(cookie);
        return res;
      }

      const used = (events || []).reduce((sum: number, e: any) => sum + (e.count ?? 0), 0);
      if (used >= DAILY_FREE) {
        const res = NextResponse.json({ error: "FREE_LIMIT_REACHED" }, { status: 402 });
        for (const cookie of cookieResponse.cookies.getAll()) res.cookies.set(cookie);
        return res;
      }
    }

    // === Idea generation ===
    // If you want OpenAI later, branch on process.env.OPENAI_API_KEY.
    // For now, return hardcoded ideas so the UI flow is testable end-to-end.
    const ideas = Array.from({ length: 10 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      title: `${i + 1}. ${query} — Idea`,
      description: `A compelling angle on "${query}" for influencers.`,
    }));

    // Log usage (RLS: user_id = auth.uid())
    await supabase
      .from("usage_events")
      .insert({ user_id: user.id, event: "generate_idea", count: 1 });

    const res = NextResponse.json({ ideas }, { status: 200 });
    // Attach any refreshed cookies collected by the route helper
    for (const cookie of cookieResponse.cookies.getAll()) res.cookies.set(cookie);
    return res;
  } catch (err: any) {
    const res = NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
    return res;
  }
}
