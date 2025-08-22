// src/components/blocks/HeaderBlock.tsx
"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";

export default function HeaderBlock() {
  const { user, profile, loading, signOut } = useUser();

  return (
    <header className="w-full px-4 py-3 flex justify-between items-center border-b bg-white">
      <Link href="/" className="text-xl font-bold text-primary">
        🎬 VideoSpark
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        <Link href="/pricing" className="hover:underline">Pricing</Link>
        {user && <Link href="/saved" className="hover:underline">Saved</Link>}

        {loading ? (
          <span className="text-muted-foreground">…</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="truncate max-w-[160px] text-muted-foreground">
              {profile?.name || user.email}
            </span>
            <button
              onClick={signOut}
              className="underline hover:text-red-700"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="font-medium hover:underline">
            Login / Signup
          </Link>
        )}
      </nav>
    </header>
  );
}
