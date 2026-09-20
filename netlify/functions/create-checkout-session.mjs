import Stripe from 'stripe';
import { watches } from '../../src/data/watches.ts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Canonical site origin. Netlify sets `URL` to the primary domain in
// production; `DEPLOY_PRIME_URL` covers branch/deploy-preview contexts.
const SITE_URL =
  process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://tokaivintage.com';

// Single source of truth: the sellable catalogue is derived straight from
// src/data/watches.ts, so a watch flipped to `status: 'sold'` (or without a
// Stripe price) can no longer be checked out. No second list to keep in sync.
const PRICE_TO_WATCH = new Map(
  watches
    .filter((w) => w.stripePriceId && w.status !== 'sold')
    .map((w) => [w.stripePriceId, w.id])
);

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// Best-effort check that this exact watch hasn't already been paid for, so we
// don't double-sell a one-of-one piece. Uses Stripe itself as the datastore —
// both Checkout Sessions and their PaymentIntents carry `watchId` in metadata.
//
// Two lookups, because each covers the other's blind spot:
//
//   1. The 100 most recent Checkout Sessions. Exact and current, with no
//      indexing delay, but 100 is Stripe's maximum page size and abandoned
//      sessions count toward it — so an older paid session eventually falls
//      out of this window.
//   2. A PaymentIntent search on `metadata['watchId']`. Unbounded by age, but
//      Stripe's search index lags object creation by up to a minute, so it can
//      miss a payment that just completed.
//
// Together they cover both the recent minute and the long tail. Either one
// matching is enough to block the sale.
//
// Only *live-mode* payments count. Sessions created with a test-mode key come
// back with `livemode: false`, and a test-card purchase must never permanently
// lock a real watch out of sale. A live key only ever sees live objects, so
// this is belt-and-braces rather than load-bearing.
//
// This remains a stopgap for the window between payment and marking the watch
// `status: 'sold'` in src/data/watches.ts. Do that promptly after each sale —
// it is the only check with no failure mode at all.
async function alreadySold(watchId) {
  const recentlyPaid = async () => {
    const { data } = await stripe.checkout.sessions.list({ limit: 100 });
    return data.some(
      (s) => s.metadata?.watchId === watchId && s.payment_status === 'paid' && s.livemode
    );
  };

  const everPaid = async () => {
    const { data } = await stripe.paymentIntents.search({
      query: `metadata['watchId']:'${watchId}' AND status:'succeeded'`,
      limit: 1,
    });
    return data.some((pi) => pi.livemode);
  };

  // Run both, and treat an individual failure as "no match" rather than
  // letting it veto the other check.
  const results = await Promise.allSettled([recentlyPaid(), everPaid()]);
  for (const r of results) {
    if (r.status === 'rejected') {
      console.error('alreadySold lookup failed (ignoring this one):', r.reason);
    } else if (r.value) {
      return true;
    }
  }
  return false;
}

export default async function createCheckoutSession(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let priceId;
  try {
    ({ priceId } = await request.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (typeof priceId !== 'string' || !PRICE_TO_WATCH.has(priceId)) {
    return json({ error: 'Unknown or missing priceId' }, 400);
  }

  const watchId = PRICE_TO_WATCH.get(priceId);

  if (await alreadySold(watchId)) {
    return json(
      { error: 'Sorry — this watch has just been sold. It is one of a kind.' },
      409
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      // --- Configured in Checkout Studio ---
      ui_mode: 'hosted_page',
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: 'auto',
      integration_identifier: 'hosted_web_0001',
      origin_context: 'web',
      // payment_method_collection is intentionally omitted: it applies to
      // `subscription` mode only, and this is a one-time payment.
      // --- End Checkout Studio ---
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: watchId,
      metadata: { watchId },
      // Stripe does not copy session metadata onto the PaymentIntent, so set
      // it explicitly — the PaymentIntent search in alreadySold() reads it.
      payment_intent_data: { metadata: { watchId } },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1500, currency: 'usd' },
            display_name: 'Standard shipping',
          },
        },
      ],
      success_url: `${SITE_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/?checkout=cancelled`,
    });

    return json({ url: session.url });
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return json({ error: 'Unable to start checkout' }, 500);
  }
}

export const config = {
  path: '/.netlify/functions/create-checkout-session',
};
