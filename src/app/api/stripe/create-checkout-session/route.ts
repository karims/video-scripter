import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteClient } from "@/utils/supabase/route";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_123";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  const { supabase, cookieResponse } = createSupabaseRouteClient(req);
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

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
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      payment_method_types: ["card"],
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
