import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export function supabaseFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  // This client will use the token you send from the browser
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: auth ? { Authorization: auth } : {} },
      auth: { persistSession: false },
    }
  );
}
