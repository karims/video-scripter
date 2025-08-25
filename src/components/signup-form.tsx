"use client";

import { useState } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="48px" height="48px"><path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>

  );
}


export default function SignupForm() {
  const { signUpWithPassword, signInWithGoogle, loading } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onGoogle = async () => {
    setMsg(null);
    try {
      setSubmitting(true);
      await signInWithGoogle("/"); // same Google flow
    } catch (e: any) {
      setMsg(e?.message ?? "Google signup failed");
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg("Please enter email and password");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match");
      return;
    }
    try {
      setSubmitting(true);
      await signUpWithPassword(email, password); // redirects on success
    } catch (e: any) {
      setMsg(e?.message ?? "Sign up failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[#0F172A1A] bg-white p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-[#0F172A]">Create your account</h1>
      <p className="mt-1 text-sm text-[#0F172A]/60">Sign up with Google or email</p>

      {msg && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {msg}
        </div>
      )}

      <button
        type="button"
        onClick={onGoogle}
        disabled={submitting || loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F172A1A] px-4 py-2.5 text-[#0F172A] font-medium hover:bg-[#0F172A0A] disabled:opacity-60 transition"
      >
        <GoogleIcon/>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px w-full bg-[#0F172A14]" />
        <span className="shrink-0 text-xs uppercase tracking-wide text-[#0F172A66]">
          Or continue with
        </span>
        <span className="h-px w-full bg-[#0F172A14]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold text-[#0F172A]">Email</label>
          <input
            id="email" type="email" value={email} placeholder="m@example.com" autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#0F172A1A] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-[#0F172A66] outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-semibold text-[#0F172A]">Password</label>
          <input
            id="password" type="password" value={password} placeholder="••••••••" autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[#0F172A1A] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-[#0F172A66] outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="block text-sm font-semibold text-[#0F172A]">Confirm password</label>
          <input
            id="confirm" type="password" value={confirm} placeholder="••••••••" autoComplete="new-password"
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-[#0F172A1A] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-[#0F172A66] outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-2 w-full rounded-xl bg-[#0B1220] px-4 py-2.5 text-white font-medium shadow-sm hover:opacity-95 disabled:opacity-60 transition"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#0F172A99]">
        Already have an account?{" "}
        <a href="/login" className="text-[#0F172A] underline underline-offset-2">
          Log in
        </a>
      </div>
    </div>
  );
}
