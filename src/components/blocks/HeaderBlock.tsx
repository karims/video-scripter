"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function HeaderBlock() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) setUserEmail(email);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("userEmail");
    setUserEmail(null);
    router.push("/");
  };

  const isAuthPage = pathname === "/login";

  return (
    <header className="w-full px-4 py-4 border-b bg-white shadow-sm flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-primary">
        🎬 AI Video Idea Generator
      </Link>

      {!isAuthPage && (
        <div className="text-sm">
          {userEmail ? (
            <div className="flex items-center gap-2 text-gray-600">
              <span>Hi, {userEmail}</span>
              <button
                className="text-primary underline"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-primary font-medium px-4 py-2 border rounded-xl hover:bg-gray-100"
            >
              Log in / Sign up
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
