import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// Returns a safe, minimal summary of a completed Checkout Session so the
// front-end can render a real order confirmation. Never exposes the full
// Stripe object.
export default async function getCheckoutSession(request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return json({ error: 'Missing or invalid session_id' }, 400);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    return json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      description: session.line_items?.data?.[0]?.description ?? null,
    });
  } catch (error) {
    console.error('get-checkout-session error:', error);
    return json({ error: 'Unable to load order' }, 404);
  }
}

export const config = {
  path: '/.netlify/functions/get-checkout-session',
};
