import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseFromRequest } from "@/lib/supabaseFromAuthHeader";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = supabaseFromRequest(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await supabase
    .from("saved_ideas")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
