import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// Formats a Stripe shipping address object into a single display line, e.g.
// "221B Baker St, Apt 4, Springfield, MO 65801, US". Skips any missing parts.
function formatAddress(address) {
  if (!address) return null;
  const { line1, line2, city, state, postal_code: postalCode, country } = address;
  const cityLine = [city, state, postalCode].filter(Boolean).join(', ');
  return [line1, line2, cityLine, country].filter(Boolean).join(', ');
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

    // Stripe has moved shipping onto `collected_information.shipping_details`
    // in newer API versions but older ones (and some SDK/version combos)
    // still expose the same data at the top-level `shipping_details`. Check
    // both so this keeps working regardless of which one this account is on.
    const shipping =
      session.collected_information?.shipping_details ??
      session.shipping_details ??
      null;

    return json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      description: session.line_items?.data?.[0]?.description ?? null,
      shippingName: shipping?.name ?? null,
      shippingAddress: formatAddress(shipping?.address),
      orderRef: session.id.replace(/^cs_(test_|live_)?/, '').slice(0, 8).toUpperCase(),
    });
  } catch (error) {
    console.error('get-checkout-session error:', error);
    return json({ error: 'Unable to load order' }, 404);
  }
}

export const config = {
  path: '/.netlify/functions/get-checkout-session',
};
