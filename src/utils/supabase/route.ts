import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseRouteClient(req: NextRequest) {
  let cookieResponse = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookieResponse = NextResponse.next({ request: { headers: req.headers } });
          for (const { name, value, options } of cookiesToSet) {
            cookieResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  return { supabase, cookieResponse };
}
