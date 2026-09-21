import { useEffect, useRef } from 'react';
import type { Watch } from '@/data/watches';
import { formatUsd } from '@/lib/format';
import {
  watchBreadcrumbJsonLd,
  watchDescription,
  watchImageUrl,
  watchProductJsonLd,
  watchTitle,
  watchUrl,
} from '@/lib/seo';
import { useFocusTrap } from '@/lib/useFocusTrap';
import ImageGallery from './ImageGallery';
import PurchaseReview from './PurchaseReview';

/** Sets an existing <head> tag's attribute, returning the previous value. */
function swapAttr(selector: string, attr: string, value: string): () => void {
  const el = document.head.querySelector(selector);
  if (!el) return () => {};
  const previous = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => {
    if (previous !== null) el.setAttribute(attr, previous);
  };
}

export default function ProductModal({
  watch,
  onClose,
}: {
  watch: Watch;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, true);

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

  // Mirror the prerendered /w/<slug> page's metadata into the live document,
  // so a link shared from an open modal previews as this watch and a crawler
  // running JavaScript sees exactly what the static file says.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = watchTitle(watch);

    const description = watchDescription(watch);
    const url = watchUrl(watch);
    const image = watchImageUrl(watch);

    const restore = [
      swapAttr('link[rel="canonical"]', 'href', url),
      swapAttr('meta[name="description"]', 'content', description),
      swapAttr('meta[property="og:type"]', 'content', 'product'),
      swapAttr('meta[property="og:title"]', 'content', document.title),
      swapAttr('meta[property="og:description"]', 'content', description),
      swapAttr('meta[property="og:url"]', 'content', url),
      swapAttr('meta[property="og:image"]', 'content', image),
      swapAttr('meta[name="twitter:title"]', 'content', document.title),
      swapAttr('meta[name="twitter:description"]', 'content', description),
      swapAttr('meta[name="twitter:image"]', 'content', image),
    ];

    const scripts = [watchProductJsonLd(watch), watchBreadcrumbJsonLd(watch)].map((data) => {
      const ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.dataset.watch = watch.slug;
      ld.textContent = JSON.stringify(data);
      document.head.appendChild(ld);
      return ld;
    });

    return () => {
      document.title = previousTitle;
      restore.forEach((undo) => undo());
      scripts.forEach((ld) => ld.remove());
    };
  }, [watch]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 px-4 py-8 backdrop-blur-sm md:py-14"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
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
