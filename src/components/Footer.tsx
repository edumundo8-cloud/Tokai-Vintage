export default function Footer() {
  return (
    <footer className="relative border-t border-charcoal/10 bg-forest-dim text-ivory/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-14 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <div className="flex items-center gap-2.5">
          <img src="/images/brand/logo-mark.png" alt="" aria-hidden="true" className="h-7 w-7 rounded-full" />
          <span className="font-serif text-lg tracking-[0.14em] text-ivory">TOKAI VINTAGE</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs uppercase tracking-[0.12em] text-ivory/65">
          <a href="#collection" className="hover:text-ivory">Collection</a>
          <a href="#our-story" className="hover:text-ivory">Our Story</a>
          <a href="#shipping" className="hover:text-ivory">Shipping</a>
          <a
            href="https://www.ebay.com/usr/tokai-vintage"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ivory"
          >
            eBay
          </a>
        </nav>

        <p className="text-xs text-ivory/45">
          © {new Date().getFullYear()} Tokai Vintage. Shipping within the United States only.
        </p>
      </div>
    </footer>
  );
}
