// src/components/login-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function LoginForm() {
  const { signInWithPassword, signInWithGoogle, loading } = useUser();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const search = useSearchParams();
  useEffect(() => {
    const err = search.get("error");
    if (err) setMsg(err);
  }, [search]);

  const onEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg("Please enter email and password");
      return;
    }
    try {
      setSubmitting(true);
      await signInWithPassword(email, password); // redirects on success
    } catch (err: any) {
      setMsg(err?.message ?? "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleLogin = async () => {
    setMsg(null);
    try {
      setSubmitting(true);
      await signInWithGoogle("/"); // redirects → /auth/callback → /
    } catch (err: any) {
      setMsg(err?.message ?? "Google sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[#0F172A1A] bg-white p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-[#0F172A]">Welcome back</h1>
      <p className="mt-1 text-sm text-[#0F172A]/60">
        Login with your Google account or email
      </p>

      {msg && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {msg}
        </div>
      )}

      {/* Google first */}
      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={submitting || loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F172A1A] px-4 py-2.5 text-[#0F172A] font-medium hover:bg-[#0F172A0A] disabled:opacity-60 transition"
      >
        <GoogleIcon />
        Login with Google
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <span className="h-px w-full bg-[#0F172A14]" />
        <span className="shrink-0 text-xs uppercase tracking-wide text-[#0F172A66]">
          Or continue with
        </span>
        <span className="h-px w-full bg-[#0F172A14]" />
      </div>

      {/* Email / Password form */}
      <form onSubmit={onEmailLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold text-[#0F172A]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="m@example.com"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#0F172A1A] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-[#0F172A66] outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-[#0F172A]">
              Password
            </label>
            <a
              href="/reset"
              className="text-sm text-[#0F172A] underline underline-offset-2 opacity-60 hover:opacity-90"
            >
              Forgot your password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="••••••••"
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[#0F172A1A] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-[#0F172A66] outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-2 w-full rounded-xl bg-[#0B1220] px-4 py-2.5 text-white font-medium shadow-sm hover:opacity-95 disabled:opacity-60 transition"
        >
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#0F172A99]">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-[#0F172A] underline underline-offset-2">
          Sign up
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-[#0F172A66]">
        By clicking continue, you agree to our{" "}
        <a href="/terms" className="underline">Terms of Service</a> and{" "}
        <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="48px" height="48px"><path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
    
  );
}