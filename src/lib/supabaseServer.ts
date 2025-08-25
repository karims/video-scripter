import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
