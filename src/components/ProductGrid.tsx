import { watches, type Watch } from '@/data/watches';
import ProductCard from './ProductCard';

export default function ProductGrid({ onOpen }: { onOpen: (watch: Watch) => void }) {
  return (
    <section id="collection" className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <div className="mb-12 max-w-xl md:mb-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-verdigris">
          The Collection
        </p>
        <h2 className="text-balance font-serif text-3xl text-charcoal md:text-4xl">
          Currently in the shop
        </h2>
        <p className="mt-4 text-balance leading-relaxed text-charcoal-soft/90">
          A small, changing selection. Each piece is chosen individually, photographed as it
          truly is, and described plainly — good and bad.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        {watches.map((watch, index) => (
          <ProductCard key={watch.id} watch={watch} index={index} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
