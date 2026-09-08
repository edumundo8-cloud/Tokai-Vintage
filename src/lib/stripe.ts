import type { Watch } from '@/data/watches';

export function hasStripeCheckout(watch: Watch): boolean {
  return Boolean(watch.stripePriceId);
}

/**
 * Creates a Stripe Checkout Session for this watch via the
 * create-checkout-session Netlify function, then redirects the browser to
 * Stripe's hosted checkout page. Throws if the watch has no Stripe price
 * configured, or if the session couldn't be created.
 */
export async function goToStripeCheckout(watch: Watch): Promise<void> {
  if (!watch.stripePriceId) return;

  const response = await fetch('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: watch.stripePriceId, watchId: watch.id }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // The function returns a human-readable `error` (e.g. the watch has
    // already sold); fall back to a generic message otherwise.
    throw new Error(
      data?.error || 'Unable to start checkout. Please try again in a moment.'
    );
  }

  if (!data?.url) {
    throw new Error('Unable to start checkout. Please try again in a moment.');
  }

  window.location.href = data.url;
}

export function buildInquiryMailto(watch: Watch): string {
  const subject = encodeURIComponent(`Inquiry: ${watch.name}`);
  const body = encodeURIComponent(
    `Hi Tokai Vintage,\n\nI'm interested in the ${watch.name} (${watch.price}).\n\nCould you tell me more about availability and next steps?\n\nThanks!`
  );
  return `mailto:edumundo8@gmail.com?subject=${subject}&body=${body}`;
}
