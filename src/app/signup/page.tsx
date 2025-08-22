// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const busy = loading || submitting;

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <div className={cn("flex flex-col gap-6")}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Continue with Google or use your email</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6">
              {/* OAuth first */}
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setMsg(null);
                  setSubmitting(true);
                  const res = await signInWithGoogle();
                  setSubmitting(false);
                  if (!res.ok && res.message) setMsg(res.message);
                  // For OAuth redirects, a refresh after return keeps header in sync:
                  router.refresh();
                }}
              >
                {/* keep or remove the icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>

              {/* Email sign up */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMsg(null);
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const name = String(fd.get("name") || "").trim();
                  const email = String(fd.get("email") || "").trim();
                  const password = String(fd.get("password") || "");

                  if (!email.includes("@")) return setMsg("Please enter a valid email");
                  if (password.length < 6) return setMsg("Password must be at least 6 characters");

                  setSubmitting(true);
                  const res = await signUp(email, password, { name });
                  setSubmitting(false);

                  if (!res.ok) {
                    setMsg(res.message || "Sign up failed");
                    return;
                  }

                  if (res.requiresEmailConfirm) {
                    setMsg("We sent you a confirmation email. Please verify, then log in.");
                    router.push("/login");
                  } else {
                    router.push("/");
                    router.refresh();
                  }
                }}
              >
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Name (optional)</Label>
                    <Input id="name" name="name" placeholder="Jane Creator" />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>

                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Creating account…" : "Sign up"}
                  </Button>

                  {msg && <p className="text-sm text-red-600 -mt-2">{msg}</p>}

                  <p className="text-center text-sm">
                    Already have an account?{" "}
                    <Link className="underline underline-offset-4" href="/login">
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
          and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </main>
  );
}
