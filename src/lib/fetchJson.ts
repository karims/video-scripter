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

export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);

  // Only set JSON header when we're actually sending a body
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Try to attach Supabase access token (if available)
  try {
    // If you have your own readSbAccessToken(), use it here first
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getSession();
    const access = data.session?.access_token;
    if (access && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${access}`);
    }
  } catch {
    // no-op: continue unauthenticated
  }

  const res = await fetch(input, { ...init, headers });

  // Read as text first (handles 204 No Content and non-JSON)
  const raw = await res.text();
  const hasBody = raw.length > 0;

  let data: any = null;
  if (hasBody) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw; // fall back to plain text
    }
  }

  if (!res.ok) {
    const err: any = new Error(
      (data && typeof data === "object" && (data.error || data.message)) ||
      `HTTP ${res.status}`
    );
    err.code = res.status;
    err.data = data;
    throw err;
  }

  // For 204/empty responses return null; otherwise parsed JSON or text
  return data as T;
}
