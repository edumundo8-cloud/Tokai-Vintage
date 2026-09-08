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
    stripe.ts             ← Stripe Checkout Session + email-inquiry fallback logic
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

Checkout runs through **Stripe Checkout Sessions**, created dynamically by a
Netlify serverless function (not static Payment Links). The "Review
purchase" button calls `POST /.netlify/functions/create-checkout-session`
with the watch's `stripePriceId`, which creates a hosted Checkout Session
and redirects the browser to it. A watch with no `stripePriceId` configured
falls back to an email inquiry / the eBay listing instead.

```
netlify/functions/
  create-checkout-session.mjs  ← creates the Checkout Session (POST { priceId })
  stripe-webhook.mjs            ← handles checkout.session.completed
```

Required Netlify environment variables (Site settings → Environment
variables), from your Stripe Dashboard:

- `STRIPE_SECRET_KEY` — your Stripe secret key.
- `STRIPE_WEBHOOK_SECRET` — the signing secret for a webhook endpoint
  pointed at `https://tokaivintage.com/.netlify/functions/stripe-webhook`,
  listening for `checkout.session.completed`.

This project is currently wired up against a **Stripe test-mode** account.
Switch to live keys in Netlify's environment variables (and re-register the
webhook endpoint against the live account) when ready to accept real
payments.

## Before going live

- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to your **live** Stripe
  keys in Netlify, and register the live webhook endpoint (see above).
- The inquiry-button fallback currently emails `edumundo8@gmail.com`
  (`src/lib/stripe.ts`) — update it if you'd rather use a dedicated
  business address.
- Confirm the eBay profile URL in `src/data/watches.ts` and the
  Header/Footer nav.
- Fill in the two "coming soon" slots when new watches are ready.
