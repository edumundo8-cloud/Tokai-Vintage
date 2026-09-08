// Central, database-ready watch inventory for Tokai Vintage.
// Add a new watch by appending an object to this array — every
// component (grid, card, modal, gallery, purchase review) reads
// from this single source of truth.

export interface WatchSpec {
  label: string;
  value: string;
}

export interface Watch {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number; // USD, whole dollars
  currency: 'USD';
  status: 'available' | 'coming-soon' | 'sold';
  brand: string;
  images: string[]; // ordered gallery, first image is primary/card image
  specs: WatchSpec[];
  condition: string[];
  service: string;
  parts: string[];
  waterResistance: string;
  authenticityNote: string;
  /**
   * Optional Stripe Price ID for this exact watch (create the Product +
   * Price in the Stripe Dashboard or API, matching the watch's price).
   * When set, "Review purchase" creates a dynamic Stripe Checkout Session
   * for this price via the create-checkout-session Netlify function.
   * Leave undefined until it's configured — the UI falls back to the
   * eBay / inquiry options automatically.
   */
  stripePriceId?: string;
  ebayListingUrl?: string;
}

export const watches: Watch[] = [
  {
    id: 'seiko-5-7s26-blue',
    slug: 'seiko-5-automatic-7s26-blue-striped-dial',
    name: 'Seiko 5 Automatic 7S26 — Rare Blue Striped Dial',
    shortDescription:
      'A quietly striking Seiko 5 with a rare blue striped dial and gold accents, recently serviced.',
    price: 169,
    currency: 'USD',
    status: 'available',
    brand: 'Seiko',
    images: [
      '/images/seiko-5/seiko-5-1.jpg',
      '/images/seiko-5/seiko-5-2.jpg',
      '/images/seiko-5/seiko-5-3.jpg',
      '/images/seiko-5/seiko-5-4.jpg',
      '/images/seiko-5/seiko-5-5.jpg',
      '/images/seiko-5/seiko-5-6.jpg',
    ],
    specs: [
      { label: 'Model', value: 'Seiko 5' },
      { label: 'Movement', value: '7S26 automatic' },
      { label: 'Case size', value: 'Approx. 36–37mm' },
      { label: 'Dial', value: 'Blue striped dial' },
      { label: 'Complication', value: 'Day / date display' },
      { label: 'Case', value: 'Polished stainless steel' },
      { label: 'Strap', value: 'Aftermarket blue leather' },
      { label: 'Crown', value: 'Operates normally; originality unverified' },
    ],
    condition: [
      'Crown originality has not been verified — it may be a replacement or aftermarket part.',
      'The crown operates normally according to our testing.',
      'Recently serviced and running well at the time of listing.',
      'Vintage scratches, scuffs, patina, and other surface marks consistent with age and wear.',
    ],
    service: 'Recently serviced and running well at the time of listing.',
    parts: ['Aftermarket blue leather strap', 'Crown may be replacement or aftermarket'],
    waterResistance: 'Not water resistant. Please keep this watch away from water and moisture.',
    authenticityNote:
      'Photographs show the actual, individual watch you will receive — not a stock or reference image.',
    stripePriceId: 'price_1UDCigFa8JIAy183lpyqM1oM',
    ebayListingUrl: 'https://www.ebay.com/itm/336782443092',
  },
  {
    id: 'seiko-skx007-pepsi',
    slug: 'seiko-skx007-pepsi-diver',
    name: 'Seiko SKX007 — Pepsi Diver',
    shortDescription:
      'The icon. Original aged dial, red-and-blue Pepsi bezel, and honest wear from a life well worn.',
    price: 299,
    currency: 'USD',
    status: 'sold',
    brand: 'Seiko',
    images: [
      '/images/seiko-pepsi/seiko-pepsi-1.jpg',
      '/images/seiko-pepsi/seiko-pepsi-2.jpg',
      '/images/seiko-pepsi/seiko-pepsi-3.jpg',
      '/images/seiko-pepsi/seiko-pepsi-4.jpg',
      '/images/seiko-pepsi/seiko-pepsi-5.jpg',
      '/images/seiko-pepsi/seiko-pepsi-6.jpg',
      '/images/seiko-pepsi/seiko-pepsi-7.jpg',
      '/images/seiko-pepsi/seiko-pepsi-8.jpg',
    ],
    specs: [
      { label: 'Model', value: 'Seiko SKX007' },
      { label: 'Movement', value: '7S26 automatic, 21 jewels' },
      { label: 'Case size', value: 'Approx. 42mm' },
      { label: 'Case', value: 'Original Seiko diver-style case' },
      { label: 'Dial', value: 'Original aged dial with patina and worn lume' },
      { label: 'Bezel', value: 'Red-and-blue rotating "Pepsi" bezel' },
      { label: 'Crystal', value: 'Mineral crystal' },
      { label: 'Crown', value: 'Replacement screw-down crown' },
      { label: 'Strap', value: 'Aftermarket black vented rubber' },
      { label: 'Complication', value: 'Day / date display' },
    ],
    condition: [
      'Original aged dial with genuine patina and worn lume plots.',
      'Crown has been replaced with a screw-down crown.',
      'Strap is an aftermarket black vented rubber, not original to the piece.',
      'Recently serviced and running at the time of listing.',
      'Vintage scratches, scuffs, and signs of wear consistent with a well-loved dive watch.',
    ],
    service: 'Recently serviced and running at the time of listing.',
    parts: ['Replacement screw-down crown', 'Aftermarket black vented rubber strap'],
    waterResistance:
      'Current water resistance has not been verified. Please do not assume the original depth rating still applies — we recommend treating this watch as splash resistant only until pressure tested.',
    authenticityNote:
      'Photographs show the actual, individual watch you will receive — not a stock or reference image.',
    stripePriceId: 'price_1UDCj0Fa8JIAy183EJmBOF2A',
    ebayListingUrl: 'https://www.ebay.com/itm/336782550352',
  },
  {
    id: 'king-seiko-vanac-5626-7140',
    slug: 'king-seiko-vanac-5626-7140-blue-dial',
    name: 'King Seiko Vanac 5626-7140 — Blue Sunburst Dial',
    shortDescription:
      'Seventies design at full volume. Faceted case, faceted crystal, and a deep blue sunburst dial under the King Seiko shield.',
    price: 699,
    currency: 'USD',
    status: 'sold',
    brand: 'Seiko',
    images: [
      '/images/king-seiko-vanac/king-seiko-vanac-1.jpg',
      '/images/king-seiko-vanac/king-seiko-vanac-2.jpg',
      '/images/king-seiko-vanac/king-seiko-vanac-3.jpg',
      '/images/king-seiko-vanac/king-seiko-vanac-4.jpg',
      '/images/king-seiko-vanac/king-seiko-vanac-5.jpg',
      '/images/king-seiko-vanac/king-seiko-vanac-6.jpg',
    ],
    specs: [
      { label: 'Model', value: 'King Seiko Vanac' },
      { label: 'Reference', value: '5626-7140' },
      { label: 'Movement', value: 'Seiko Cal. 5626, automatic' },
      { label: 'Case size', value: 'Approx. 36–37mm (excl. crown)' },
      { label: 'Case', value: 'Faceted stainless steel, mixed polished and brushed surfaces' },
      { label: 'Crystal', value: 'Faceted "cut" crystal' },
      { label: 'Dial', value: 'Blue sunburst with faceted mirror-cut indices' },
      { label: 'Complication', value: 'Day / date, bilingual day wheel' },
      { label: 'Crown', value: 'Signed "KS" crown' },
      { label: 'Bracelet', value: 'Aftermarket stainless steel bracelet' },
      { label: 'Era', value: 'Vintage, 1970s' },
      { label: 'Origin', value: 'Made in Japan' },
      { label: 'Serial', value: '341458' },
    ],
    condition: [
      'Vintage King Seiko Vanac from the 1970s; caseback stamped 5626-7140.',
      'The faceted case shows hairline scratches, light nicks, and polishing marks across the mirror-polished surfaces, consistent with age.',
      'Dial presents cleanly with a strong blue sunburst; hand lume has aged to a warm cream tone.',
      'Faceted crystal is intact, with the edge distortion that is characteristic of the Vanac.',
      'Bracelet is an aftermarket stainless steel replacement, not original to the watch.',
      'Running at the time of listing; full service history is unknown and the originality of internal parts has not been verified.',
    ],
    service:
      'Running at the time of listing. Full service history is unknown — we recommend a service before daily wear.',
    parts: ['Aftermarket stainless steel bracelet'],
    waterResistance:
      'The caseback is marked water resistant, but the original rating cannot be assumed after decades of age. Treat this watch as splash resistant only until it has been pressure tested.',
    authenticityNote:
      'Photographs show the actual, individual watch you will receive — not a stock or reference image.',
  },
  {
    id: 'coming-soon-1',
    slug: 'coming-soon-1',
    name: 'Coming soon',
    shortDescription: 'A new piece is being sourced and serviced for the collection.',
    price: 0,
    currency: 'USD',
    status: 'coming-soon',
    brand: '',
    images: [],
    specs: [],
    condition: [],
    service: '',
    parts: [],
    waterResistance: '',
    authenticityNote: '',
  },
];

export const SHIPPING = {
  flatRateUsd: 15,
  carrier: 'USPS',
  region: 'United States only',
  note: 'No international shipping at this time. Any applicable taxes are additional.',
};

export function getWatchBySlug(slug: string): Watch | undefined {
  return watches.find((w) => w.slug === slug);
}
