import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SITE_URL = 'https://tokaivintage.com';

// Whitelist of Stripe Price IDs this store is allowed to sell. Keeping this
// list here (rather than trusting whatever priceId the client sends) stops
// someone from checking out an arbitrary/attacker-chosen Stripe price.
const ALLOWED_PRICE_IDS = new Set([
  'price_1UDCigFa8JIAy183lpyqM1oM', // Seiko 5 Automatic 7S26
  'price_1UDCj0Fa8JIAy183EJmBOF2A', // Seiko SKX007 "Pepsi" Diver
]);

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export default async function createCheckoutSession(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  let priceId;
  try {
    const body = await request.json();
    priceId = body.priceId;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (typeof priceId !== 'string' || !ALLOWED_PRICE_IDS.has(priceId)) {
    return new Response(JSON.stringify({ error: 'Unknown or missing priceId' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
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

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return new Response(JSON.stringify({ error: 'Unable to start checkout' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

export const config = {
  path: '/.netlify/functions/create-checkout-session',
};
