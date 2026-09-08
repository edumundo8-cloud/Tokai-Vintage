import { useState } from 'react';
import type { Watch } from '@/data/watches';
import { SHIPPING } from '@/data/watches';
import { formatUsd } from '@/lib/format';
import { buildInquiryMailto, goToStripeCheckout, hasStripeCheckout } from '@/lib/stripe';

export default function PurchaseReview({ watch }: { watch: Watch }) {
  const total = watch.price + SHIPPING.flatRateUsd;
  const stripeReady = hasStripeCheckout(watch);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout() {
    setCheckoutError(null);
    setIsRedirecting(true);
    try {
      await goToStripeCheckout(watch);
      // On success the browser navigates away to Stripe, so there's
      // nothing more to do here.
    } catch (error) {
      setIsRedirecting(false);
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to start checkout. Please try again.'
      );
    }
  }

  return (
    <div className="border border-charcoal/12 bg-ivory-dim/40 p-5 md:p-6">
      <h3 className="font-serif text-lg text-charcoal">Purchase review</h3>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-charcoal-soft/80">Watch</dt>
          <dd className="text-charcoal">{formatUsd(watch.price)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-charcoal-soft/80">Shipping ({SHIPPING.carrier}, {SHIPPING.region})</dt>
          <dd className="text-charcoal">{formatUsd(SHIPPING.flatRateUsd)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-charcoal/12 pt-2 font-medium">
          <dt className="text-charcoal">Total before tax</dt>
          <dd className="text-charcoal">{formatUsd(total)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-charcoal-soft/70">
        Flat-rate {SHIPPING.carrier} shipping, {SHIPPING.region.toLowerCase()}. {SHIPPING.note}
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        {stripeReady ? (
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isRedirecting}
            className="inline-flex items-center justify-center gap-2 border border-forest bg-forest px-5 py-3 text-sm font-medium uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-forest-light disabled:cursor-wait disabled:opacity-70"
          >
            {isRedirecting ? 'Redirecting to checkout…' : 'Review purchase — pay with Stripe'}
          </button>
        ) : (
          <a
            href={buildInquiryMailto(watch)}
            className="inline-flex items-center justify-center gap-2 border border-forest bg-forest px-5 py-3 text-sm font-medium uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-forest-light"
          >
            Inquire about this watch
          </a>
        )}

        {watch.ebayListingUrl && (
          <a
            href={watch.ebayListingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-charcoal/25 px-5 py-3 text-sm font-medium uppercase tracking-[0.1em] text-charcoal/80 transition-colors hover:border-forest hover:text-forest"
          >
            See current eBay listings
          </a>
        )}
      </div>

      {checkoutError && (
        <p className="mt-3 text-xs leading-relaxed text-red-700">{checkoutError}</p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-charcoal-soft/60">
        eBay listings may reflect different prices and shipping terms than this website.
        {!stripeReady && ' Card checkout is being finalized — reach out and we\'ll walk you through availability and next steps.'}
      </p>
    </div>
  );
}
