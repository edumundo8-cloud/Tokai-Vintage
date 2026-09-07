import { useEffect, useRef } from 'react';
import type { Watch } from '@/data/watches';
import { formatUsd } from '@/lib/format';
import ImageGallery from './ImageGallery';
import PurchaseReview from './PurchaseReview';

export default function ProductModal({
  watch,
  onClose,
}: {
  watch: Watch;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 px-4 py-8 backdrop-blur-sm md:py-14"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="relative w-full max-w-4xl bg-ivory shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close watch details"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-charcoal/15 bg-ivory text-xl text-charcoal transition-colors hover:border-forest hover:text-forest"
        >
          ×
        </button>

        <div className="grid gap-8 p-5 md:grid-cols-2 md:gap-10 md:p-8">
          <div>
            <ImageGallery images={watch.images} altPrefix={watch.name} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-verdigris">
              {watch.brand}
            </p>
            <h2 id="product-modal-title" className="mt-2 font-serif text-2xl leading-tight text-charcoal md:text-3xl">
              {watch.name}
            </h2>
            <p className="mt-2 text-xl text-charcoal/80">{formatUsd(watch.price)}</p>

            <p className="mt-4 text-sm italic leading-relaxed text-charcoal-soft/80">
              {watch.authenticityNote}
            </p>

            <div className="mt-6">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-charcoal/60">
                Technical specifications
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                {watch.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-3 border-b border-charcoal/8 py-1.5 sm:flex-col sm:justify-start sm:border-none sm:py-0">
                    <dt className="text-charcoal-soft/70">{spec.label}</dt>
                    <dd className="text-right text-charcoal sm:text-left sm:font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-charcoal/60">
                Condition &amp; honesty notes
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-charcoal-soft/90">
                {watch.condition.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-1.5 border-t border-charcoal/10 pt-5 text-sm text-charcoal-soft/80">
              <p><span className="font-medium text-charcoal">Service: </span>{watch.service}</p>
              {watch.parts.length > 0 && (
                <p>
                  <span className="font-medium text-charcoal">Parts &amp; originality: </span>
                  {watch.parts.join('; ')}
                </p>
              )}
              <p><span className="font-medium text-charcoal">Water resistance: </span>{watch.waterResistance}</p>
            </div>

            <div className="mt-7">
              <PurchaseReview watch={watch} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
