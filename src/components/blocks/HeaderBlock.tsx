"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";

export default function HeaderBlock() {
  const { user, setUser } = useUser();

  const handleLogout = () => {
    sessionStorage.removeItem("userEmail");
    setUser(null);
  };

  return (
    <header className="w-full p-4 flex justify-between items-center border-b bg-white">
      <Link href="/" className="text-xl font-bold text-primary">
        🎬 VideoSpark
      </Link>

      {user?.email ? (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            href="/saved"
            className="text-sm font-medium hover:underline text-primary"
          >
            Saved Ideas
          </Link>

          <span>{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-black-500 underline hover:text-red-700"
          >
            Logout
          </button>
        </div>
      ) : (
        <Link href="/login" className="text-sm font-medium hover:underline">
          Login / Signup
        </Link>
      )}
    </header>
  );
}
