import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Collection', href: '#collection' },
  { label: 'Our Story', href: '#our-story' },
  { label: 'Shipping', href: '#shipping' },
  { label: 'eBay', href: 'https://www.ebay.com/usr/tokai-vintage', external: true },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || menuOpen ? 'bg-ivory/95 shadow-[0_1px_0_0_rgba(38,54,44,0.08)] backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a
          href="#top"
          className="flex items-center gap-2.5"
          aria-label="Tokai Vintage home"
        >
          <img
            src="/images/brand/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.25)] md:h-10 md:w-10"
          />
          <span
            className={`font-serif text-xl tracking-[0.14em] transition-colors duration-300 md:text-2xl ${
              scrolled || menuOpen ? 'text-charcoal' : 'text-ivory drop-shadow-sm'
            }`}
          >
            TOKAI VINTAGE
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className={`text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                scrolled || menuOpen
                  ? 'text-charcoal/80 hover:text-forest'
                  : 'text-ivory/90 drop-shadow-sm hover:text-ivory'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center transition-colors md:hidden ${
            scrolled || menuOpen ? 'text-charcoal' : 'text-ivory drop-shadow-sm'
          }`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-200 ${
                menuOpen ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-px w-6 bg-current transition-opacity duration-200 ${
                menuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-px w-6 bg-current transition-transform duration-200 ${
                menuOpen ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={`overflow-hidden transition-[max-height] duration-300 md:hidden ${
          menuOpen ? 'max-h-64' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-1 border-t border-charcoal/10 px-5 pb-5 pt-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 text-sm font-medium uppercase tracking-[0.12em] text-charcoal/80 transition-colors hover:text-forest"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
