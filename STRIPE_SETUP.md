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

Everything above was originally set up against Stripe **test mode**, which
is safe to click through end-to-end (test card `4242 4242 4242 4242`, any
future expiry, any CVC). Switching to real payments is the sequence below.

**Do the steps in this order.** The ordering matters: the checkout function
reads its allow-list from `watches.ts` but its API key from the Netlify
environment. If a live price ID reaches production before the live secret
key does, the function holds a test key and Stripe rejects the live price —
buyers get "Unable to start checkout" until the key catches up. Setting the
environment first means the worst case is the harmless inquiry fallback.

### 1. Activate the Stripe account

Stripe will not process live charges until the account is fully activated:
business details, bank account for payouts, identity verification. Do this
first — the rest is wasted effort if activation is still pending.

### 2. Create the live Product + Price

Switch the Stripe Dashboard to **live mode** and copy the live secret key
(`sk_live_...`) from Developers → API keys. Then, for each watch that needs
a price:

```bash
STRIPE_SECRET_KEY=sk_live_... node scripts/create-stripe-price.mjs <watch-id>
```

The script prints `LIVE` when it is creating a real price, and writes the
new `stripePriceId` into `src/data/watches.ts`. **Do not commit yet.**

Test-mode price IDs already in `watches.ts` belong to watches marked `sold`,
which the allow-list filters out, so they are inert. If one of those watches
is ever put back on sale, delete its test price ID and re-run the script
against the live key — otherwise checkout for it will fail.

### 3. Create the live webhook endpoint

Still in live mode: Developers → Webhooks → Add endpoint.

- URL: `https://tokaivintage.com/.netlify/functions/stripe-webhook`
- Event: `checkout.session.completed`

Copy the signing secret (`whsec_...`) shown after creating it. A test-mode
signing secret will not verify live events, so this must be the live one.

### 4. Swap the Netlify environment variables

Site settings → Environment variables:

- `STRIPE_SECRET_KEY` → the `sk_live_...` key
- `STRIPE_WEBHOOK_SECRET` → the live `whsec_...` signing secret
- `RESEND_API_KEY` → required for order-notification emails; without it the
  webhook logs a warning and sends nothing, so a paid order would only be
  visible in the Stripe Dashboard.

Environment changes do not apply to an already-built deploy — the push in
step 5 rebuilds and picks them up.

### 5. Commit and push

```bash
git add src/data/watches.ts && git commit -m "Add live Stripe price for <watch>" && git push
```

Netlify rebuilds with both the live price ID and the live keys in place.

### 6. Verify

Open the listing and click through to Stripe. The hosted checkout page
should show the real amount and say **"Powered by Stripe"** without a test
banner. Completing a real purchase is the only true end-to-end test; the
cheapest way to do it is to buy from yourself and refund it in the Dashboard
(the Stripe fee on a refunded charge is not returned, so it costs a little).

After a real sale, flip the watch to `status: 'sold'` in `watches.ts` and
redeploy. Until that lands, `alreadySold()` in `create-checkout-session.mjs`
is what stops the same one-of-one piece selling twice — see the limitation
noted in that function before relying on it long-term.
