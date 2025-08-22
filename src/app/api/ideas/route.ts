// app/api/ideas/route.ts
import { NextResponse, type NextRequest } from "next/server";
import dayjs from "dayjs";
import { createSupabaseServerFromRequest } from "@/lib/supabaseServer";

const DAILY_FREE = 5;

export async function POST(req: NextRequest) {
  try {
    // Create the cookie-bound server client (your existing helper)
    const supabase = createSupabaseServerFromRequest(req);

    // Allow either: Authorization: Bearer <access_token> OR Supabase auth cookies
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // If we have a bearer token, verify that; otherwise fall back to cookie session
    const {
      data: { user },
      error: userErr,
    } = bearer
      ? await supabase.auth.getUser(bearer)
      : await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = await req.json().catch(() => null);
    const query = body?.query?.toString().trim();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Check subscription
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("is_subscribed")
      .eq("id", user.id)
      .single();

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    if (!profile?.is_subscribed) {
      // Count today's free usage
      const since = dayjs().startOf("day").toISOString();
      const { data: events, error: eErr } = await supabase
        .from("usage_events")
        .select("count, created_at")
        .eq("user_id", user.id)
        .eq("event", "generate_idea")
        .gte("created_at", since);

      if (eErr) {
        return NextResponse.json({ error: eErr.message }, { status: 500 });
      }

      const used = (events || []).reduce((sum, e: any) => sum + (e.count ?? 0), 0);
      if (used >= DAILY_FREE) {
        return NextResponse.json({ error: "FREE_LIMIT_REACHED" }, { status: 402 });
      }
    }

    // Mock ideas (replace with LLM later)
    const ideas = Array.from({ length: 10 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      title: `${i + 1}. ${query} — Idea`,
      description: `A compelling angle on "${query}" for influencers.`,
    }));

    // Log usage
    await supabase
      .from("usage_events")
      .insert({ user_id: user.id, event: "generate_idea", count: 1 });

    return NextResponse.json({ ideas });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
