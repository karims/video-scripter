import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/utils/supabase/route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { supabase, cookieResponse } = createSupabaseRouteClient(req);
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  const { data, error } = await supabase
    .from("saved_ideas")
    .select("id, idea_id, title, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    const res = NextResponse.json({ error: error.message }, { status: 400 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  const res = NextResponse.json({ items: data ?? [] }, { status: 200 });
  for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
  return res;
}

export async function POST(req: NextRequest) {
  const { supabase, cookieResponse } = createSupabaseRouteClient(req);
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  const body = await req.json().catch(() => null);
  const idea_id = body?.idea_id?.toString().trim();
  const title = body?.title?.toString().trim();
  const description = body?.description?.toString() ?? null;

  if (!idea_id || !title) {
    const res = NextResponse.json({ error: "Missing fields" }, { status: 400 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  const { data, error } = await supabase
    .from("saved_ideas")
    .insert({ user_id: user.id, idea_id, title, description })
    .select("id, idea_id, title, description, created_at")
    .single();

  if (error) {
    const res = NextResponse.json({ error: error.message }, { status: 400 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  const res = NextResponse.json({ item: data }, { status: 201 });
  for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
  return res;
}
