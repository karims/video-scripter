// Server-side Supabase client for Server Components & Server Actions (Next 15)
// Uses the new cookie adapter (getAll/setAll) from @supabase/ssr docs.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  // In Next 15, cookies() can be async; await it to avoid TS issues.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // If your env uses ANON_KEY instead, swap to NEXT_PUBLIC_SUPABASE_ANON_KEY!
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Read all cookies for this request (auth session lives here)
        getAll() {
          return cookieStore.getAll();
        },
        // Attempt to write refreshed tokens; Server Components can't always set.
        // That's OK—our middleware will also refresh sessions.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore: Server Components can't mutate headers.
            // Middleware will keep sessions fresh by calling auth.getUser().
          }
        },
      },
    }
  );
}
