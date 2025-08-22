// src/lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
// import type { Database } from "@/types/supabase"; // optional

let _client:
  | ReturnType<typeof createBrowserClient>
  | null = null;

export function supabaseBrowser() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    _client = createBrowserClient(url, anon);
  }
  return _client;
}

// Or if you prefer a constant:
// export const supabase = createBrowserClient(url, anon);
