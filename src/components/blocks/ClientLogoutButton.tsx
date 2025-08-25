// src/components/blocks/ClientLogoutButton.tsx
"use client";

import { supabaseBrowser } from "@/lib/supabaseClient";

export default function ClientLogoutButton() {
  const supabase = supabaseBrowser();

  const signOut = async () => {
    // Global revocation (access + refresh) so middleware can’t “restore” the session
    await supabase.auth.signOut({ scope: "global" });
    // Hard navigate to a public route to avoid cached SSR content
    window.location.replace("/login");
  };

  return (
    <button
      onClick={signOut}
      className="underline hover:text-red-700"
      aria-label="Logout"
    >
      Logout
    </button>
  );
}
