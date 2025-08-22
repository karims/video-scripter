// src/lib/supabaseServer.ts
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Builds a Supabase server client that supports BOTH:
 * - Bearer token from Authorization header (client → API)
 * - Cookies (SSR / RSC / middleware)
 */
export async function createSupabaseServer(req?: NextRequest) {
  console.log("createSupabaseServer: ", req)
  const auth = req?.headers.get("authorization") || "";
  const hasBearer = auth.toLowerCase().startsWith("bearer ");
  const token = hasBearer ? auth.slice(7).trim() : null;

  if (token) {
    // Header-based client (no cookie dependency). RLS uses this JWT.
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.log("token: ", token)

    // Explicitly resolve the user from the token so callers don’t have to.
    const { data, error } = await supabase.auth.getUser(token);
    return { supabase, user: data?.user ?? null, token, error };
  }

  // Cookie-based server client (SSR flow)
  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: data?.user ?? null, token: null, error };
}

export function createSupabaseServerFromRequest(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = req.headers.get("authorization") ?? undefined;

  // We don’t rely on cookies here; we forward the Bearer to PostgREST
  return createServerClient(url, anon, {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}
