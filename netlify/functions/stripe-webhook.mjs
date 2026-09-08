import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handleStripeWebhook(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // The order is paid at this point (or will be shortly, for delayed
    // payment methods — check session.payment_status if that matters here).
    // `watchId` comes from the metadata set in create-checkout-session, so
    // this line tells you exactly which entry in src/data/watches.ts to flip
    // to `status: 'sold'`. (create-checkout-session also refuses a second
    // paid session for the same watchId, so the storefront is safe until
    // that redeploy lands.) This is also where a confirmation email would go.
    console.log('Checkout completed — mark this watch sold:', {
      watchId: session.metadata?.watchId ?? session.client_reference_id ?? 'unknown',
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  path: '/.netlify/functions/stripe-webhook',
};
