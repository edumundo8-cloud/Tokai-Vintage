import { useEffect, useRef, useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
import { webpThumb } from '@/lib/img';
import { useFocusTrap } from '@/lib/useFocusTrap';

const MAIN_SIZES = '(min-width: 768px) 430px, 92vw';

export default function ImageGallery({
  images,
  altPrefix,
}: {
  images: string[];
  altPrefix: string;
}) {
  const [index, setIndex] = useState(0);
  const [fullSize, setFullSize] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIndex(0), [images]);

  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    if (!fullSize) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullSize(false);
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullSize, images.length]);

  useFocusTrap(lightboxRef, fullSize);

  if (images.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-ivory-dim">
        <ResponsiveImage
          src={images[index]}
          alt={`${altPrefix} — photo ${index + 1} of ${images.length}`}
          sizes={MAIN_SIZES}
          className="h-full w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-ivory/60 bg-charcoal/40 text-ivory backdrop-blur transition-colors hover:bg-charcoal/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-ivory/60 bg-charcoal/40 text-ivory backdrop-blur transition-colors hover:bg-charcoal/60"
            >
              ›
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setFullSize(true)}
          className="absolute bottom-3 right-3 border border-ivory/60 bg-charcoal/40 px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-ivory backdrop-blur transition-colors hover:bg-charcoal/60"
        >
          View full size
        </button>
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label={`${altPrefix} thumbnails`}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              onClick={() => setIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden border transition-colors ${
                i === index ? 'border-forest' : 'border-charcoal/15 hover:border-charcoal/40'
              }`}
            >
              <img
                src={webpThumb(src)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {fullSize && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${altPrefix} full size photo`}
          onClick={() => setFullSize(false)}
        >
          <button
            type="button"
            onClick={() => setFullSize(false)}
            aria-label="Close full size photo"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center border border-ivory/50 text-xl text-ivory"
          >
            ×
          </button>
          <ResponsiveImage
            src={images[index]}
            alt={`${altPrefix} — photo ${index + 1} of ${images.length}, full size`}
            sizes="100vw"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-ivory/50 text-2xl text-ivory"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-ivory/50 text-2xl text-ivory"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
