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
  status: 'available' | 'coming-soon';
  brand: string;
  images: string[]; // ordered gallery, first image is primary/card image
  specs: WatchSpec[];
  condition: string[];
  service: string;
  parts: string[];
  waterResistance: string;
  authenticityNote: string;
  /**
   * Optional Stripe Payment Link for this exact watch (create one in the
   * Stripe Dashboard: Payment Links -> New, set price = watch price, and
   * enable "Add shipping rate" for the flat $15 USPS rate + USA-only
   * shipping + automatic tax if desired). See STRIPE_SETUP.md.
   * Leave undefined until it's configured — the UI falls back to the
   * eBay / inquiry options automatically.
   */
  stripePaymentLink?: string;
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
    status: 'available',
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
    ebayListingUrl: 'https://www.ebay.com/itm/336782550352',
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
  {
    id: 'coming-soon-2',
    slug: 'coming-soon-2',
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
