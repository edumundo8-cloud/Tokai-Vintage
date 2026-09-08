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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/70 px-4 py-8 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-notice-title"
        className="relative w-full max-w-md border border-charcoal/10 bg-ivory p-7 text-center shadow-2xl md:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        {outcome === 'success' ? (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-verdigris">
              Order confirmed
            </p>
            <h2
              id="checkout-notice-title"
              className="mt-3 font-serif text-2xl leading-tight text-charcoal"
            >
              Thank you.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal-soft/90">
              {summary?.description ? (
                <>
                  Your order for the <span className="font-medium text-charcoal">{summary.description}</span> is
                  confirmed.
                </>
              ) : (
                <>Your payment went through and your order is confirmed.</>
              )}{' '}
              {summary?.amountTotal != null
                ? `You were charged ${formatUsd(summary.amountTotal / 100)}. `
                : ''}
              We&apos;ll email you
              {summary?.customerEmail ? ` at ${summary.customerEmail}` : ''} with tracking as soon as it
              ships.
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
          className="mt-7 inline-flex items-center justify-center border border-forest bg-forest px-6 py-3 text-sm font-medium uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-forest-light"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}
