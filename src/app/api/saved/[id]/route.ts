// src/app/api/saved/[id]/route.ts
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/utils/supabase/route";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, cookieResponse } = createSupabaseRouteClient(req);

  // Require auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  // Enforce ownership in the delete
  const { error } = await supabase
    .from("saved_ideas")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    const res = NextResponse.json({ error: error.message }, { status: 400 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  const res = new NextResponse(null, { status: 204 });
  for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
  return res;
}
