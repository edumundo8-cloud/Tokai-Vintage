import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Set in Netlify: Site settings → Environment variables.
//   RESEND_API_KEY     — API key from resend.com (free tier is enough)
//   ORDER_NOTIFY_EMAIL — optional override; defaults to Carlos's own inbox
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL || 'edumundo8@gmail.com';

// Formats a Stripe shipping address object into a single display line, e.g.
// "221B Baker St, Apt 4, Springfield, MO 65801, US". Skips any missing parts.
function formatAddress(address) {
  if (!address) return null;
  const { line1, line2, city, state, postal_code: postalCode, country } = address;
  const cityLine = [city, state, postalCode].filter(Boolean).join(', ');
  return [line1, line2, cityLine, country].filter(Boolean).join(', ');
}

// Emails Carlos the order details (watch, amount, buyer email, shipping
// address) via Resend's HTTP API. Runs on Netlify Edge Functions (Deno), so
// this uses fetch rather than an SMTP library — no raw sockets available
// there. Best-effort: a failure here never breaks the webhook response.
async function sendOrderNotification(session) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set — skipping order notification email.');
    return;
  }

  const shipping =
    session.collected_information?.shipping_details ?? session.shipping_details ?? null;
  const watchName =
    session.line_items?.data?.[0]?.description ?? session.metadata?.watchId ?? 'a watch';
  const amount = session.amount_total != null ? (session.amount_total / 100).toFixed(2) : null;
  const buyerEmail = session.customer_details?.email ?? 'unknown';
  const shippingAddress = formatAddress(shipping?.address);

  const html = `
    <div style="font-family: Georgia, 'Iowan Old Style', serif; color:#211f1c; max-width:480px; margin:0 auto;">
      <p style="letter-spacing:0.12em; text-transform:uppercase; font-size:11px; color:#6e9583; margin:0 0 8px;">
        New order &middot; Tokai Vintage
      </p>
      <h2 style="font-weight:500; margin:0 0 16px;">${watchName}</h2>
      <p style="margin:0 0 8px;"><strong>Amount charged:</strong> ${
        amount != null ? `$${amount} ${session.currency?.toUpperCase() ?? ''}` : 'n/a'
      }</p>
      <p style="margin:0 0 8px;"><strong>Buyer email:</strong> ${buyerEmail}</p>
      <p style="margin:0 0 8px;"><strong>Shipping to:</strong><br/>
        ${shipping?.name ? `${shipping.name}<br/>` : ''}
        ${shippingAddress ?? 'No shipping address on file'}
      </p>
      <p style="margin:16px 0 0; font-size:11px; color:#8a8479;">Stripe session: ${session.id}</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tokai Vintage Orders <orders@resend.dev>',
        to: [NOTIFY_EMAIL],
        subject: `New order: ${watchName}${amount ? ` — $${amount}` : ''}`,
        html,
      }),
    });

    if (!response.ok) {
      console.error('Resend order email failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Resend order email error:', error);
  }
}

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
    const baseSession = event.data.object;
    // The order is paid at this point (or will be shortly, for delayed
    // payment methods — check session.payment_status if that matters here).
    // `watchId` comes from the metadata set in create-checkout-session, so
    // this line tells you exactly which entry in src/data/watches.ts to flip
    // to `status: 'sold'`. (create-checkout-session also refuses a second
    // paid session for the same watchId, so the storefront is safe until
    // that redeploy lands.)
    console.log('Checkout completed — mark this watch sold:', {
      watchId: baseSession.metadata?.watchId ?? baseSession.client_reference_id ?? 'unknown',
      sessionId: baseSession.id,
      customerEmail: baseSession.customer_details?.email,
      amountTotal: baseSession.amount_total,
      currency: baseSession.currency,
    });

    // The webhook payload's session object doesn't reliably carry expanded
    // line items or shipping details across API versions, so re-fetch the
    // full session before emailing the order notification.
    try {
      const fullSession = await stripe.checkout.sessions.retrieve(baseSession.id, {
        expand: ['line_items'],
      });
      await sendOrderNotification(fullSession);
    } catch (error) {
      console.error('Failed to load full session for order email:', error);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  path: '/.netlify/functions/stripe-webhook',
};
