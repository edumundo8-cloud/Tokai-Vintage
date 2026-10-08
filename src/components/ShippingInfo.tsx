import { RETURNS, SHIPPING } from '@/data/watches';
import { RETURNS_PATH } from '@/lib/site';

export default function ShippingInfo() {
  return (
    <section id="shipping" className="relative mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
      <div className="border border-charcoal/12 bg-ivory-dim/40 p-7 text-center md:p-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-verdigris">
          Shipping
        </p>
        <h2 className="font-serif text-2xl text-charcoal md:text-3xl">
          Shipped carefully, within the United States
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance leading-relaxed text-charcoal-soft/85">
          Every watch ships via {SHIPPING.carrier} for a flat {SHIPPING.flatRateUsd
            ? `$${SHIPPING.flatRateUsd}`
            : ''}, {SHIPPING.region} at this time — no international shipping.
          {' '}
          {SHIPPING.note} Exact totals are always shown before you check out.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-balance leading-relaxed text-charcoal-soft/85">
          Changed your mind? Every watch can be returned within {RETURNS.windowDays} days of
          delivery.{' '}
          <a href={RETURNS_PATH} className="underline underline-offset-4 hover:text-forest">
            Read the return policy
          </a>
          .
        </p>
      </div>
    </section>
  );
}
