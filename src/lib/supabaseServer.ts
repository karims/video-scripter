import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Matches the current docs / example: use getAll/setAll + try/catch
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In Server Components we might not be able to write headers.
            // Middleware refresh will handle cookie rotation.
          }
        },
      },
    }
  );
}

/**
 * For Route Handlers (/app/api/*) where you have access to NextRequest.
 * Also relies on middleware for session refresh; setAll is a no-op.
 */
export function createSupabaseServerFromRequest(req: NextRequest): SupabaseClient {
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        /* no-op (middleware handles refresh) */
      },
    },
  });
}
