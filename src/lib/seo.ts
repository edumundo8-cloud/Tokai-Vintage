// Per-listing SEO metadata, shared by the runtime app (ProductModal updates
// the live document head) and by scripts/prerender.mjs (which bakes the same
// tags into a static HTML file for every /w/<slug> URL at build time).
//
// Keeping both paths on one source means a crawler that executes JavaScript
// and one that only reads the raw HTML see exactly the same thing.
import type { Watch } from '../data/watches.ts';
import { formatUsd } from './format.ts';
import { SITE_NAME, SITE_URL } from './site.ts';

const AVAILABILITY: Record<Watch['status'], string> = {
  available: 'https://schema.org/InStock',
  sold: 'https://schema.org/SoldOut',
  'coming-soon': 'https://schema.org/PreOrder',
};

export function watchUrl(watch: Watch): string {
  return `${SITE_URL}/w/${watch.slug}`;
}

/** Absolute URL of the listing's primary photograph. */
export function watchImageUrl(watch: Watch): string {
  return watch.images.length > 0
    ? `${SITE_URL}${watch.images[0]}`
    : `${SITE_URL}/og-image.jpg`;
}

export function watchTitle(watch: Watch): string {
  // The names already carry an em dash, so the price is set off with a middot.
  const suffix = watch.status === 'sold' ? ' (Sold)' : ` · ${formatUsd(watch.price)}`;
  return `${watch.name}${suffix} | ${SITE_NAME}`;
}

/**
 * Search-result description: what it is, what it costs, and the honest
 * one-line pitch — clipped to the ~160 characters Google tends to show.
 */
export function watchDescription(watch: Watch): string {
  const lead =
    watch.status === 'sold'
      ? 'Sold.'
      : `${formatUsd(watch.price)} + flat-rate USPS shipping in the US.`;
  const text = `${lead} ${watch.shortDescription}`.replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  // Clip on a word boundary so the snippet never ends mid-word.
  const clipped = text.slice(0, 157);
  const cut = clipped.lastIndexOf(' ');
  return `${(cut > 100 ? clipped.slice(0, cut) : clipped).replace(/[\s,;.—-]+$/, '')}…`;
}

export function watchProductJsonLd(watch: Watch): Record<string, unknown> {
  const serial = watch.specs.find((s) => s.label === 'Serial')?.value;
  const model = watch.specs.find((s) => s.label === 'Model')?.value;
  const reference = watch.specs.find((s) => s.label === 'Reference')?.value;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${watchUrl(watch)}#product`,
    name: watch.name,
    url: watchUrl(watch),
    image: watch.images.map((src) => `${SITE_URL}${src}`),
    description: `${watch.shortDescription} ${watch.condition.join(' ')}`.trim(),
    brand: { '@type': 'Brand', name: watch.brand || SITE_NAME },
    category: 'Vintage wristwatches',
    itemCondition: 'https://schema.org/UsedCondition',
    ...(model ? { model } : {}),
    ...(reference ? { mpn: reference } : {}),
    ...(serial ? { sku: serial } : { sku: watch.id }),
    offers: {
      '@type': 'Offer',
      url: watchUrl(watch),
      priceCurrency: watch.currency,
      price: watch.price,
      itemCondition: 'https://schema.org/UsedCondition',
      availability: AVAILABILITY[watch.status],
      // One watch, one example of it — never restocked.
      inventoryLevel: { '@type': 'QuantitativeValue', value: watch.status === 'available' ? 1 : 0 },
      seller: { '@type': 'Organization', '@id': `${SITE_URL}/#store`, name: SITE_NAME },
    },
  };
}

export function watchBreadcrumbJsonLd(watch: Watch): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Collection', item: `${SITE_URL}/#collection` },
      { '@type': 'ListItem', position: 3, name: watch.name, item: watchUrl(watch) },
    ],
  };
}

/** Homepage list of everything currently catalogued, in grid order. */
export function collectionJsonLd(listed: Watch[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAME} — the collection`,
    numberOfItems: listed.length,
    itemListElement: listed.map((watch, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: watchUrl(watch),
      name: watch.name,
    })),
  };
}
