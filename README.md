# Tokai Vintage

A small, editorial e-commerce site for Tokai Vintage — Japanese and Swiss
vintage watches, wabi-sabi at heart. Built with React, TypeScript, Vite, and
Tailwind CSS.

## Running it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually `http://localhost:5173`).

To produce a production build:

```bash
npm run build
npm run preview   # serve the built site locally to check it
```

## Project structure

```
src/
  data/watches.ts       ← every watch lives here (add new ones by appending)
  lib/
    format.ts            ← price formatting
    stripe.ts             ← Stripe Payment Link + email-inquiry fallback logic
  components/
    Header.tsx            ← nav + mobile menu
    Hero.tsx
    ScrollParallaxBackground.tsx  ← drives the Mount Fuji parallax layer
    FujiIllustration.tsx  ← the original Mount Fuji artwork (SVG)
    ProductGrid.tsx / ProductCard.tsx
    ProductModal.tsx      ← product detail modal
    ImageGallery.tsx      ← gallery + thumbnails + full-size lightbox
    PurchaseReview.tsx    ← price/shipping/total + checkout buttons
    OurStory.tsx / ShippingInfo.tsx / EbaySection.tsx / Footer.tsx
public/images/
  seiko-5/                ← Seiko 5 gallery photos
  seiko-pepsi/             ← SKX007 Pepsi gallery photos
  hero/                    ← hero photograph
```

## Adding a new watch

Open `src/data/watches.ts` and add an object to the `watches` array (or
replace one of the two `coming-soon` placeholders). Drop its photos into
`public/images/<slug>/` and reference them in the `images` array — the grid,
card, modal, and gallery all pick it up automatically, no other changes
needed.

## Checkout / Stripe

There's no payment backend in this project. The "Review purchase" button
uses **Stripe Payment Links** (no-code, set up per watch in your Stripe
Dashboard) when a watch has a `stripePaymentLink` configured, and falls back
to an email inquiry / the eBay listing otherwise. See `STRIPE_SETUP.md` for
the exact steps.

## Before going live

- Add your real Stripe Payment Links (see `STRIPE_SETUP.md`).
- The inquiry-button fallback currently emails `edumundo8@gmail.com`
  (`src/lib/stripe.ts`) — update it if you'd rather use a dedicated
  business address.
- Confirm the eBay profile URL in `src/data/watches.ts` and the
  Header/Footer nav.
- Fill in the two "coming soon" slots when new watches are ready.
