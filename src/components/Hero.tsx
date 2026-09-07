export default function Hero() {
  return (
    <section id="top" className="relative">
      <div className="relative h-[88vh] min-h-[560px] w-full overflow-hidden md:h-[94vh] md:min-h-[640px]">
        <img
          src="/images/hero/hero-editorial.jpg"
          alt="A collector pauses over coffee at a seaside café table, a vintage watch catching the light on his wrist, with a cliffside town across the water behind him"
          className="h-full w-full object-cover object-[90%_38%] md:object-[62%_38%]"
          loading="eager"
          fetchPriority="high"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-charcoal/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-charcoal/35 via-transparent to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-5 pb-12 md:px-8 md:pb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-verdigris-light md:mb-5">
              Japanese &amp; Swiss Vintage Watches
            </p>
            <h1 className="text-balance font-serif text-4xl leading-[1.08] text-ivory drop-shadow-sm sm:text-5xl md:text-6xl">
              A piece of history,
              <br />
              worn on your wrist.
            </h1>
            <p className="mt-6 max-w-md text-balance text-base leading-relaxed text-ivory/85 md:text-lg">
              Japanese and Swiss vintage watches, chosen with care.{' '}
              <span lang="ja" title="Wabi-sabi">
                侘寂
              </span>{' '}
              at heart.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#collection"
                className="inline-flex items-center gap-2 border border-ivory bg-ivory px-7 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-forest-dim transition-colors hover:bg-ivory-dim"
              >
                Explore the collection
              </a>
              <a
                href="#our-story"
                className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-ivory/80 transition-colors hover:text-ivory"
              >
                Our story
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
