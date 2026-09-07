export default function EbaySection() {
  return (
    <section id="ebay" className="relative mx-auto max-w-3xl px-5 pb-20 text-center md:px-8 md:pb-28">
      <p className="text-sm text-charcoal-soft/75">
        Also listing on eBay —{' '}
        <a
          href="https://www.ebay.com/usr/tokai-vintage"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
        >
          View Tokai Vintage on eBay
        </a>
        . Prices and shipping terms there may differ from this site.
      </p>
    </section>
  );
}
