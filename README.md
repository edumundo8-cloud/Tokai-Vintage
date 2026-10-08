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
    seo.ts                ← per-listing title/meta/structured data (see SEO)
    site.ts               ← canonical site URL and name
    img.ts                ← srcset helpers for the generated WebP variants
  components/
    Header.tsx            ← nav + mobile menu
    Hero.tsx
    ScrollParallaxBackground.tsx  ← drives the Mount Fuji parallax layer
    FujiIllustration.tsx  ← the original Mount Fuji artwork (SVG)
    ProductGrid.tsx / ProductCard.tsx
    ProductModal.tsx      ← product detail modal
    ImageGallery.tsx      ← gallery + thumbnails + full-size lightbox
    ResponsiveImage.tsx   ← <picture> with WebP variants + JPEG fallback
    PurchaseReview.tsx    ← price/shipping/total + checkout buttons
    CheckoutNotice.tsx    ← banner shown on return from Stripe
    OurStory.tsx / ShippingInfo.tsx / EbaySection.tsx / Footer.tsx
public/images/
  <watch-slug>/           ← one folder of gallery photos per watch
  hero/                    ← hero photograph
netlify/functions/        ← checkout backend (see Checkout / Stripe)
scripts/                  ← build steps + the Stripe price helper
```

`scripts/gen-images.mjs` runs before every build and writes 480/960/1440px
WebP variants next to each gallery JPEG, so new photos only need the JPEG.

## Adding a new watch

Open `src/data/watches.ts` and add an object to the `watches` array (or
replace the `coming-soon` placeholder). Drop its photos into
`public/images/<slug>/` and reference them in the `images` array — the grid,
card, modal, and gallery all pick it up automatically, no other changes
needed.

To sell it by card rather than by inquiry, give it a live Stripe price:

```bash
node --env-file=.env scripts/create-stripe-price.mjs <watch-id>
```

## SEO

The site is a single-page app, so listing URLs need help to exist for
crawlers and link previews. Two build steps handle that, both driven by
`src/data/watches.ts` — adding a watch is still the only edit needed.

- `scripts/gen-sitemap.mjs` (prebuild) writes `public/sitemap.xml`, including
  an `<image:image>` entry per photograph so the watch photos can surface in
  Google Images.
- `scripts/prerender.mjs` (postbuild) writes a real HTML file for every
  `/w/<slug>` URL into `dist/`, carrying that watch's title, meta description,
  canonical, Open Graph tags, Product + BreadcrumbList structured data, and a
  `<noscript>` copy of the listing text. Without it, a link shared on a forum
  or in a message previews as the generic homepage. It also writes the
  standalone `/returns` page (policy text from `RETURNS` and `SHIPPING` in
  `watches.ts`) and `404.html`.

### Videos

The homepage "stories behind the watches" section and the `/videos` pages
come from `src/data/videos.json`, a copy of the public TIME & POWER channel.
After publishing a video, refresh it and commit the result:

```bash
npm run videos
```

The build itself never calls YouTube. Each `/videos/<slug>` page embeds the
video with its summary, chapters (as key-moment Clips in the VideoObject
data) and, when `content/transcripts/<videoId>.srt` exists, the full
transcript — drop the episode's SRT there to add one.

There is deliberately no catch-all `/* → /index.html` rewrite in
`netlify.toml`: every real URL is a file in `dist/`, and anything else gets
`404.html` with a real 404 status. A new route needs its own file.

The prerender works by swapping the block between the `<!-- seo:start -->` and
`<!-- seo:end -->` markers in `index.html` — leave those comments in place.
`src/lib/seo.ts` builds the tags and is shared with `ProductModal`, which
applies the same metadata to the live document when a watch is opened, so the
JavaScript and no-JavaScript views always agree.

Product cards are real `<a href="/w/…">` links (a plain click still opens the
modal in place), which gives every listing a crawlable internal link and lets
visitors open one in a new tab.

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
  stripe-webhook.mjs            ← handles checkout.session.completed, emails the order
  get-checkout-session.mjs      ← order summary for the confirmation banner
```

**Checkout is live.** It takes real payments on the production Stripe
account and has been verified end to end against tokaivintage.com.
[STRIPE_SETUP.md](STRIPE_SETUP.md) covers how it is wired and how to add a
price for a new watch;
[STRIPE_INTEGRATION_TODO.md](STRIPE_INTEGRATION_TODO.md) records what is
done and what is still open.

Netlify environment variables (Site settings → Environment variables), all
server-only:

- `STRIPE_SECRET_KEY` — the live secret key (`sk_live_…`).
- `STRIPE_WEBHOOK_SECRET` — the live signing secret for the endpoint at
  `https://tokaivintage.com/.netlify/functions/stripe-webhook`, listening
  for `checkout.session.completed`.
- `RESEND_API_KEY` — sends the order-notification email.
- `ORDER_NOTIFY_EMAIL` — optional; where order emails go.

Editing a variable does not rebuild the site — trigger a deploy afterwards.

The local `.env` also holds the **live** secret key (it is used by
`scripts/create-stripe-price.mjs`). Anything run against it — including
`netlify dev` — talks to the real account, so use a `sk_test_…` key when
you want to click through checkout locally.

## After each sale

Every watch is one of a kind. Once a watch sells, set `status: 'sold'` in
`src/data/watches.ts` and push. The checkout function also refuses a watch
that already has a paid session, but marking it sold is the real fix.

## Still open

- Send a webhook test event from the Stripe Dashboard to confirm
  `STRIPE_WEBHOOK_SECRET` matches (a mismatch fails silently — the buyer is
  charged, only the order email is lost).
- Decide whether to collect sales tax (`automatic_tax` is off).
- Order emails come from `orders@resend.dev`, Resend's shared sandbox
  domain; verify a tokaivintage.com sender for better deliverability.
- The inquiry-button fallback emails `edumundo8@gmail.com`
  (`src/lib/stripe.ts`) — change it if you want a dedicated business
  address.
- Fill in the "coming soon" slot when the next watch is ready.
