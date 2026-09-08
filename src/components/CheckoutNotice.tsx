import { useEffect, useRef, useState } from 'react';
import { formatUsd } from '@/lib/format';
import { useFocusTrap } from '@/lib/useFocusTrap';

type Outcome = 'success' | 'cancelled';

type SessionSummary = {
  status: string;
  paymentStatus: string;
  customerEmail: string | null;
  amountTotal: number | null;
  currency: string | null;
  description: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  orderRef: string | null;
};

/**
 * Shown when Stripe redirects back to `/?checkout=success` or
 * `/?checkout=cancelled`. On success it retrieves a safe summary of the
 * session for a proper confirmation; dismissing clears the query string.
 */
export default function CheckoutNotice() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('checkout');
  const outcome: Outcome | null =
    raw === 'success' ? 'success' : raw === 'cancelled' ? 'cancelled' : null;
  const sessionId = params.get('session_id');

  const [open, setOpen] = useState(outcome !== null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useFocusTrap(cardRef, open);

  useEffect(() => {
    if (outcome !== 'success' || !sessionId) return;
    let cancelled = false;
    fetch(`/.netlify/functions/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data as SessionSummary);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [outcome, sessionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !outcome) return null;

  function dismiss() {
    setOpen(false);
    window.history.replaceState({}, '', window.location.pathname);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-charcoal/70 px-4 py-8 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-notice-title"
        className="relative w-full max-w-md border border-charcoal/10 bg-ivory p-8 text-center shadow-2xl md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {outcome === 'success' ? (
          <>
            <img
              src="/images/brand/logo-mark.png"
              alt=""
              aria-hidden="true"
              className="mx-auto h-9 w-9 rounded-full opacity-90"
            />

            <p
              lang="ja"
              title="Wabi-sabi"
              className="mt-5 font-serif text-lg tracking-[0.04em] text-forest/70"
            >
              侘寂
            </p>

            <h2
              id="checkout-notice-title"
              className="mt-2 text-balance font-serif text-[1.75rem] leading-tight text-charcoal md:text-3xl"
            >
              It&apos;s yours now.
            </h2>

            <p className="mx-auto mt-3 max-w-xs text-balance font-serif text-base italic text-forest">
              Ready for its next chapter.
            </p>

            <WaveDivider />

            <p className="text-sm leading-relaxed text-charcoal-soft/90">
              {summary?.description ? (
                <>
                  Your <span className="font-medium text-charcoal">{summary.description}</span> has found a
                  new home.
                </>
              ) : (
                <>Your payment went through and this piece is officially yours.</>
              )}{' '}
              {summary?.amountTotal != null
                ? `You were charged ${formatUsd(summary.amountTotal / 100)}, shipping included. `
                : ''}
              We&apos;ll email you
              {summary?.customerEmail ? ` at ${summary.customerEmail}` : ''} the moment it&apos;s on its way.
            </p>

            {(summary?.orderRef || summary?.shippingAddress) && (
              <div className="mt-6 space-y-2 border-t border-charcoal/10 pt-5 text-left">
                {summary?.orderRef && (
                  <p className="flex items-baseline justify-between gap-4 text-xs uppercase tracking-[0.14em] text-charcoal/45">
                    <span>Order reference</span>
                    <span className="font-medium text-charcoal-soft">{summary.orderRef}</span>
                  </p>
                )}
                {summary?.shippingAddress && (
                  <p className="flex items-baseline justify-between gap-4 text-xs uppercase tracking-[0.14em] text-charcoal/45">
                    <span className="shrink-0">Shipping to</span>
                    <span className="text-right normal-case tracking-normal text-charcoal-soft">
                      {summary.shippingName ? `${summary.shippingName}, ` : ''}
                      {summary.shippingAddress}
                    </span>
                  </p>
                )}
              </div>
            )}

            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-charcoal/45">
              A hairline scratch, a story worth telling — enjoy wearing it.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-charcoal/45">
              Checkout cancelled
            </p>
            <h2
              id="checkout-notice-title"
              className="mt-3 font-serif text-2xl leading-tight text-charcoal"
            >
              No payment was taken.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal-soft/90">
              Your checkout was cancelled and nothing was charged. The piece is still available if you&apos;d
              like to try again.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="mt-8 inline-flex items-center justify-center border border-forest bg-forest px-6 py-3 text-sm font-medium uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-forest-light"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}

// A thin, hand-drawn-feeling wave — echoes the wave emblem in the header —
// used here as a quiet divider instead of a plain horizontal rule.
function WaveDivider() {
  return (
    <svg
      viewBox="0 0 200 16"
      aria-hidden="true"
      className="mx-auto my-5 h-4 w-32 text-verdigris/70"
    >
      <path
        d="M0 8c12-8 28-8 40 0s28 8 40 0 28-8 40 0 28 8 40 0 28-8 40 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
