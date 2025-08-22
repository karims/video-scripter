"use client";
import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const goCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout-session", { method: "POST" });
    const { url, error } = await res.json();
    setLoading(false);
    if (error) alert(error);
    else window.location.href = url;
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upgrade to Pro</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Free</h2>
          <ul className="mt-3 text-sm text-muted-foreground space-y-2">
            <li>• 5 ideas/day</li>
            <li>• Save ideas</li>
          </ul>
        </div>
        <div className="border rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Pro</h2>
          <ul className="mt-3 text-sm text-muted-foreground space-y-2">
            <li>• Unlimited ideas</li>
            <li>• Priority quality & features</li>
          </ul>
          <button
            onClick={goCheckout}
            disabled={loading}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-60"
          >
            {loading ? "Redirecting..." : "Go Pro →"}
          </button>
        </div>
      </div>
    </main>
  );
}
