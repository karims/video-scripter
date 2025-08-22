// app/api/stripe/create-checkout-session/route.ts
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";

export const runtime = "nodejs"; // defensive clarity (Stripe SDK expects Node)

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_123";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Initialize once per module
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // apiVersion: "2024-06-20", // optionally pin; or let it use default
});

export async function POST(req: NextRequest) {
  // Build route-bound Supabase client and capture any refreshed cookies
  const { supabase, cookieResponse } = createSupabaseRouteClient(req);

  // Read/refresh session
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  if (!STRIPE_SECRET_KEY) {
    const res = NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }

  try {
    // Create Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      // You can let Stripe pick the best methods automatically:
      // automatic_payment_methods: { enabled: true },
      payment_method_types: ["card"], // keep if you prefer explicit list
      customer_email: user.email || undefined,
      success_url: `${APP_URL}/pricing?success=1`,
      cancel_url: `${APP_URL}/pricing?canceled=1`,
      metadata: { user_id: user.id },
    });

    const res = NextResponse.json({ url: session.url }, { status: 200 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ error: e?.message ?? "Stripe error" }, { status: 400 });
    for (const c of cookieResponse.cookies.getAll()) res.cookies.set(c);
    return res;
  }
}
