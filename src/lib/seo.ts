// Per-listing SEO metadata, shared by the runtime app (ProductModal updates
// the live document head) and by scripts/prerender.mjs (which bakes the same
// tags into a static HTML file for every /w/<slug> URL at build time).
//
// Keeping both paths on one source means a crawler that executes JavaScript
// and one that only reads the raw HTML see exactly the same thing.
import { RETURNS, SHIPPING, type Watch } from '../data/watches.ts';
import { formatUsd } from './format.ts';
import { CONTACT_EMAIL, RETURNS_PATH, SITE_NAME, SITE_URL } from './site.ts';
import {
  CHANNEL_NAME,
  CHANNEL_URL,
  embedUrl,
  isoDuration,
  thumbnailUrl,
  VIDEOS_PATH,
  videoUrl,
  type Video,
} from './video.ts';

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

/** The store's return policy, shared by every Offer and the store itself. */
export function returnPolicyJsonLd(): Record<string, unknown> {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'US',
    returnPolicyCountry: 'US',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: RETURNS.windowDays,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: RETURNS.buyerPaysReturnShipping
      ? 'https://schema.org/ReturnFeesCustomerResponsibility'
      : 'https://schema.org/FreeReturn',
    merchantReturnLink: `${SITE_URL}${RETURNS_PATH}`,
  };
}

function shippingDetailsJsonLd(): Record<string, unknown> {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: SHIPPING.flatRateUsd, currency: 'USD' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
  };
}

/** Homepage description of the store itself. */
export function storeJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#store`,
    name: SITE_NAME,
    description:
      'Vintage Japanese and Swiss watches, chosen with care and described plainly, good and bad.',
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/og-image.jpg`,
    logo: `${SITE_URL}/images/brand/logo-mark.png`,
    email: CONTACT_EMAIL,
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card',
    areaServed: { '@type': 'Country', name: 'United States' },
    hasMerchantReturnPolicy: returnPolicyJsonLd(),
    sameAs: ['https://www.ebay.com/usr/tokai-vintage', 'https://www.youtube.com/@TimeNPower'],
  };
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
      shippingDetails: shippingDetailsJsonLd(),
      hasMerchantReturnPolicy: returnPolicyJsonLd(),
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

/**
 * VideoObject for a /videos/<slug> page. Chapters become Clips, which is what
 * lets Google show "key moments" — each Clip URL opens the page's player at
 * that second (the page reads ?t=).
 */
export function videoJsonLd(video: Video): Record<string, unknown> {
  const url = videoUrl(video);
  const clips = video.chapters.map((chapter, i) => ({
    '@type': 'Clip',
    name: chapter.label,
    startOffset: chapter.seconds,
    endOffset: video.chapters[i + 1]?.seconds ?? video.durationSeconds,
    url: `${url}?t=${chapter.seconds}`,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${url}#video`,
    name: video.title,
    description: video.summary.join(' ') || video.title,
    thumbnailUrl: [thumbnailUrl(video, 'maxres'), thumbnailUrl(video, 'mq')],
    uploadDate: video.uploadDate,
    duration: isoDuration(video.durationSeconds),
    embedUrl: embedUrl(video),
    url,
    inLanguage: 'en',
    author: { '@type': 'Organization', name: CHANNEL_NAME, url: CHANNEL_URL },
    publisher: { '@type': 'Organization', '@id': `${SITE_URL}/#store`, name: SITE_NAME },
    ...(clips.length > 0 ? { hasPart: clips } : {}),
  };
}

export function videoBreadcrumbJsonLd(video: Video): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Videos', item: `${SITE_URL}${VIDEOS_PATH}` },
      { '@type': 'ListItem', position: 3, name: video.title, item: videoUrl(video) },
    ],
  };
}

/** The /videos index: a summary list pointing at each video's own page. */
export function videoListJsonLd(videos: Video[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${CHANNEL_NAME} — watch history documentaries`,
    numberOfItems: videos.length,
    itemListElement: videos.map((video, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: videoUrl(video),
      name: video.title,
    })),
  };
}
