// src/context/UserContext.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

type Ctx = {
  user: User | null;
  loading: boolean;
  profile?: { name?: string } | null;
  signOut: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (next?: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
};

const UserCtx = createContext<Ctx | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [profile] = useState<{ name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) setUser(user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    init();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/login";
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // middleware will refresh cookies on next navigation/request
    window.location.href = "/";
  };

  const signInWithGoogle = async (next = "/") => {
    // Redirect-based OAuth flow; the code will return to /auth/callback
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    // control will redirect; no further action here
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const origin = window.location.origin;
    const emailRedirectTo = `${origin}/auth/callback?next=/`; // for confirm-email flows
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) throw error;

    // If email confirmations are required, data.session will be null.
    // Send user to a friendly message (or back to login) after sign-up.
    if (!data.session) {
      window.location.href = "/login?verify=1";
    } else {
      window.location.href = "/";
    }
  };


  const value = useMemo<Ctx>(() => ({
    user, loading, profile, signOut, signInWithPassword, signInWithGoogle, signUpWithPassword
  }), [user, loading, profile]);

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
