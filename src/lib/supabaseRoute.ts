// Route-handler Supabase client (for app/api/*)
// Reads cookies from the request, records any refreshed cookies for the response.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseRouteClient(req: NextRequest) {
  // We'll collect any updated cookies here
  let cookieResponse = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // If you standardized on ANON_KEY, change this to NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // refresh our response and attach the updated cookies
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
