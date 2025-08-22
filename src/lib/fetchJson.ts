// src/lib/fetchJson.ts
import { supabaseBrowser } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

/** Read the current Supabase access token directly from localStorage (sync). */
function readSbAccessToken(): string | undefined {
  try {
    if (typeof window === "undefined") return;
    // Supabase stores session in a key like: "sb-<ref>-auth-token"
    const key = Object.keys(window.localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!key) return;
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw); // shape: { currentSession: {...}, expiresAt, ... }
    const token = parsed?.currentSession?.access_token as string | undefined;
    return token;
  } catch {
    return;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // 1) Try fast sync path (no network)
  let accessToken = readSbAccessToken();

  // 2) Fallback: ask supabase (no aggressive timeout)
  if (!accessToken) {
    try {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      accessToken = data.session?.access_token;
    } catch {
      // continue unauthenticated
    }
  }

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let body: any = {};
    try { body = await res.json(); } catch {}
    const err: any = new Error(body.error || body.message || `HTTP ${res.status}`);
    err.code = res.status;
    err.body = body;
    throw err;
  }
  return res.json() as Promise<T>;
}
