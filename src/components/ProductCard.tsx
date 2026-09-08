import type { Watch } from '@/data/watches';
import { formatUsd } from '@/lib/format';

export default function ProductCard({
  watch,
  index,
  onOpen,
}: {
  watch: Watch;
  index: number;
  onOpen: (watch: Watch) => void;
}) {
  if (watch.status === 'coming-soon') {
    const number = String(index + 1).padStart(2, '0');
    return (
      <div className="group relative flex aspect-[3/4] flex-col items-center justify-center border border-dashed border-charcoal/20 bg-ivory-dim/40 text-center">
        <span className="font-serif text-5xl text-charcoal/15 md:text-6xl">{number}</span>
        <span className="mt-4 text-xs font-medium uppercase tracking-[0.28em] text-verdigris/80">
          Arriving soon
        </span>
        <span className="mt-3 max-w-[16rem] px-6 text-xs leading-relaxed text-charcoal/40">
          A new piece is being sourced and serviced for the collection.
        </span>
      </div>
    );
  }

  const isSold = watch.status === 'sold';

  return (
    <button
      type="button"
      onClick={() => onOpen(watch)}
      className="group block w-full text-left"
      aria-label={
        isSold
          ? `${watch.name} — sold, view details`
          : `Discover ${watch.name}, ${formatUsd(watch.price)}`
      }
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory-dim">
        <img
          src={watch.images[0]}
          alt={`${watch.name} — main product photograph`}
          className={
            isSold
              ? 'h-full w-full object-cover grayscale transition-transform duration-500 ease-out'
              : 'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]'
          }
          loading="lazy"
        />
        {isSold ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-charcoal/45">
            <span className="border border-ivory/80 px-5 py-2 text-xs font-medium uppercase tracking-[0.22em] text-ivory">
              Gone
            </span>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-charcoal/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="mb-5 border border-ivory/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-ivory">
              Discover this watch
            </span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3
          className={
            isSold
              ? 'font-serif text-lg leading-snug text-charcoal/50'
              : 'font-serif text-lg leading-snug text-charcoal group-hover:text-forest'
          }
        >
          {watch.name}
        </h3>
      </div>
      <p className={isSold ? 'mt-1 text-sm text-charcoal/40' : 'mt-1 text-sm text-charcoal/60'}>
        {isSold ? 'Sold' : formatUsd(watch.price)}
      </p>
    </button>
  );
}
