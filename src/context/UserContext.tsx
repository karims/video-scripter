// src/context/UserContext.tsx
"use client";

declare global {
  interface Window { __sbToken?: string }
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  is_subscribed: boolean;
  created_at: string;
  updated_at: string;
};

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signInWithPassword: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signInWithGoogle: () => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    meta?: { name?: string }
  ) => Promise<{ ok: true; requiresEmailConfirm: boolean } | { ok: false; message?: string }>;
};

const C = createContext<Ctx | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = supabaseBrowser(); // one browser client for the whole app

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,name,avatar_url,plan,is_subscribed,created_at,updated_at")
      .eq("id", uid)
      .single();
    if (error) {
      setError(error.message);
      setProfile(null);
    } else {
      setError(null);
      setProfile(data as Profile);
    }
  };

  const signInWithPassword: Ctx["signInWithPassword"] = async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  };

  const signInWithGoogle: Ctx["signInWithGoogle"] = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}` : undefined,
      },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  };

  const signOut: Ctx["signOut"] = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const signUp: Ctx["signUp"] = async (email, password, meta) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: meta?.name || null } },
      });
      if (error) return { ok: false, message: error.message };
      const requiresEmailConfirm = !data.session;
      return { ok: true, requiresEmailConfirm };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Sign up failed" };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  // remove OAuth params (?code, ?state, ?error_description) after session exchange
  const clearOAuthParams = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (
      url.searchParams.get("code") ||
      url.searchParams.get("state") ||
      url.searchParams.get("error_description")
    ) {
      window.history.replaceState({}, "", url.origin + url.pathname);
    }
  };

  // Boot & subscribe
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        if (typeof window !== "undefined") window.__sbToken = data.session?.access_token || undefined;
        if (data.session?.user?.id) await fetchProfile(data.session.user.id);
        clearOAuthParams();
      } finally {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evt: AuthChangeEvent, s: Session | null) => {
        setSession(s ?? null);
        setUser(s?.user ?? null);
        if (s?.user?.id) await fetchProfile(s.user.id);
        else setProfile(null);
        clearOAuthParams();
      }
    );

    return () => sub?.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      error,
      signInWithPassword,
      signInWithGoogle,
      signOut,
      refreshProfile,
      signUp,
    }),
    [session, user, profile, loading, error]
  );

  return <C.Provider value={value}>{children}</C.Provider>;
};

export const useUser = () => {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
