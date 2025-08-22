// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper to extract current period end from the first subscription item
function getCurrentPeriodEndFromItems(sub: Stripe.Subscription): string | null {
  const firstItem = sub.items?.data?.[0];
  if (!firstItem) return null;
  const ts = (firstItem as any).current_period_end as number | undefined; // field lives on the item
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export async function POST(req: Request) {
  const hdrs = await headers(); // Next 15: headers() is async
  const sig = hdrs.get("stripe-signature");
  const raw = await req.text();

  let evt: Stripe.Event;
  try {
    evt = stripe.webhooks.constructEvent(
      raw,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (evt.type) {
      case "checkout.session.completed": {
        const session = evt.data.object as Stripe.Checkout.Session;
        const user_id = (session.metadata as any)?.user_id as string | undefined;
        const subscriptionId = session.subscription as string | undefined;

        // Defaults
        let status = "active";
        let plan = "pro";
        let current_period_end: string | null = null;

        if (subscriptionId) {
          const subResp = await stripe.subscriptions.retrieve(subscriptionId);
          const subscription = subResp as Stripe.Subscription;

          status = subscription.status;
          // price id (good as a “plan” reference for now)
          const priceId = subscription.items?.data?.[0]?.price?.id;
          if (priceId) plan = priceId;

          current_period_end = getCurrentPeriodEndFromItems(subscription);
        }

        if (user_id) {
          await supabaseAdmin.from("subscriptions").insert({
            user_id,
            plan,
            status,
            current_period_end,
            raw_payload: evt as any,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = evt.data.object as Stripe.Subscription;

        // You may store user_id in metadata when creating subs server-side.
        const user_id =
          (subscription.metadata as any)?.user_id ||
          (subscription as any).metadata?.user_id ||
          null;

        const status = subscription.status;
        const plan = subscription.items?.data?.[0]?.price?.id || "pro";
        const current_period_end = getCurrentPeriodEndFromItems(subscription);

        if (user_id) {
          await supabaseAdmin.from("subscriptions").insert({
            user_id,
            plan,
            status,
            current_period_end,
            raw_payload: evt as any,
          });
        }
        break;
      }

      default:
        // no-op for other events
        break;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
