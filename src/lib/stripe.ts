import type { Watch } from '@/data/watches';

/**
 * Tokai Vintage checkout strategy
 * -------------------------------
 * This is a static front-end with no server, so real card payments go
 * through Stripe Payment Links — a no-code, no-backend way to take a
 * real payment that you set up once per watch in the Stripe Dashboard.
 * See STRIPE_SETUP.md at the project root for the exact steps
 * (including how to attach the $15 flat USPS shipping rate and
 * restrict shipping to the United States).
 *
 * Until a watch has a `stripePaymentLink` configured, the purchase
 * review falls back to eBay / email inquiry so there's never a dead
 * end for a buyer.
 */

export function hasStripeCheckout(watch: Watch): boolean {
  return Boolean(watch.stripePaymentLink);
}

export function goToStripeCheckout(watch: Watch) {
  if (!watch.stripePaymentLink) return;
  window.open(watch.stripePaymentLink, '_blank', 'noopener,noreferrer');
}

export function buildInquiryMailto(watch: Watch): string {
  const subject = encodeURIComponent(`Inquiry: ${watch.name}`);
  const body = encodeURIComponent(
    `Hi Tokai Vintage,\n\nI'm interested in the ${watch.name} ($${watch.price}).\n\nCould you tell me more about availability and next steps?\n\nThanks!`
  );
  return `mailto:edumundo8@gmail.com?subject=${subject}&body=${body}`;
}
