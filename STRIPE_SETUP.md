# Connecting Stripe (Checkout Sessions)

This site now has a small serverless backend (Netlify Functions), so
checkout runs through real **Stripe Checkout Sessions** created on demand —
not static Payment Links. Two Stripe products/prices already exist in test
mode and are wired into `src/data/watches.ts`:

- Seiko 5 Automatic 7S26 — `price_1UDCigFa8JIAy183lpyqM1oM` ($169)
- Seiko SKX007 "Pepsi" Diver — `price_1UDCj0Fa8JIAy183EJmBOF2A` ($299)

## How it works

1. The "Review purchase — pay with Stripe" button calls
   `POST /.netlify/functions/create-checkout-session` with the watch's
   `stripePriceId`.
2. `netlify/functions/create-checkout-session.mjs` checks that price ID
   against a small allow-list, then creates a Stripe Checkout Session
   (one item, $15 flat-rate US shipping) and returns its URL.
3. The browser redirects to Stripe's hosted checkout page.
4. After payment, Stripe calls `netlify/functions/stripe-webhook.mjs` with a
   `checkout.session.completed` event, which is where order fulfillment
   logic (emails, marking a watch sold, etc.) can be added later.

## One-time setup in the Stripe Dashboard

1. **API keys** (Developers → API keys): copy the **Secret key**.
2. **Webhook** (Developers → Webhooks → Add endpoint):
   - Endpoint URL: `https://tokaivintage.com/.netlify/functions/stripe-webhook`
   - Events to send: `checkout.session.completed`
   - Copy the **Signing secret** shown after creating it.

## Wiring the keys into Netlify

In the Netlify dashboard: **Site settings → Environment variables**, add:

- `STRIPE_SECRET_KEY` — the secret key from step 1 above.
- `STRIPE_WEBHOOK_SECRET` — the signing secret from step 2 above.

Redeploy the site after saving these so the functions pick them up.

## Adding a new watch's price

Run the helper script with your Stripe secret key in the environment. It
reads the watch's name, description, and price straight out of
`src/data/watches.ts`, creates the matching Product + Price, and writes the
new `stripePriceId` back into the same file:

```bash
STRIPE_SECRET_KEY=sk_... node scripts/create-stripe-price.mjs seiko-5-7s26-president
```

Run it with no arguments to list the watch IDs and which ones already have a
price. The key is only read from the environment — it is never printed or
written anywhere. Whether you get a test price or a real one depends purely
on which key you pass (`sk_test_...` vs `sk_live_...`), and the script prints
which mode it used.

The script refuses to run for a watch that already has a `stripePriceId`, or
one marked `sold`, so a second run can't orphan an existing price.

To do it by hand instead, create the Product + Price in the Stripe Dashboard
and add the ID to the watch yourself:

```ts
{
  id: 'some-watch',
  ...
  stripePriceId: 'price_xxxxxxxxxxxxxxxx',
}
```

Either way there is no second list to update: the checkout function derives
its allow-list from `watches.ts` directly, so setting `stripePriceId` is all
that's needed to make a watch purchasable.

A watch with no `stripePriceId` configured keeps showing the email-inquiry
/ eBay fallback, so there's never a dead end for a buyer.

### Keeping the key out of git

`.env` and `.env.*` are gitignored. Putting the key in `.env` and loading it
with `node --env-file=.env` works too:

```bash
node --env-file=.env scripts/create-stripe-price.mjs seiko-5-7s26-president
```

## Going live

Everything above is currently set up against a Stripe **test-mode**
account, which is safe to click through end-to-end (use Stripe's test card
`4242 4242 4242 4242`, any future expiry, any CVC). When ready to accept
real payments: switch the Stripe Dashboard to **live mode**, create live
versions of the products/prices, get the live secret key + webhook signing
secret, and swap `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` in Netlify to
the live values.
