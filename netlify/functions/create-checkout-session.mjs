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

// Best-effort check that this exact watch hasn't already been paid for in a
// previous Checkout Session. Uses Stripe as the datastore (sessions carry a
// `watchId` in metadata) so we don't double-sell a one-of-one piece.
//
// Only counts *live-mode* payments. Every session created with a test-mode
// secret key (as this whole project currently uses) comes back with
// `livemode: false` — a test card purchase (e.g. while trying out the
// checkout flow) must never permanently lock a real watch out of sale. Once
// this switches to a live secret key, real customer payments will have
// `livemode: true` and the one-of-one protection applies as intended.
async function alreadySold(watchId) {
  try {
    const { data } = await stripe.checkout.sessions.list({ limit: 100 });
    return data.some(
      (s) => s.metadata?.watchId === watchId && s.payment_status === 'paid' && s.livemode
    );
  } catch (error) {
    console.error('alreadySold check failed (allowing checkout):', error);
    return false;
  }
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
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: watchId,
      metadata: { watchId },
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
