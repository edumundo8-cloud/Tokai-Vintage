# Stripe Integration — Remaining Steps

Generated after applying the Checkout Studio configuration. This file is the
single source of truth for what is left to do.

**Scenario A** applied: an existing Checkout Session call was found at
[netlify/functions/create-checkout-session.mjs](netlify/functions/create-checkout-session.mjs),
so only the parameters inside that call were changed. No new files, routes, or
infrastructure were added.

---

## Values to Replace

**Files containing placeholders:**

- [src/data/watches.ts](src/data/watches.ts)

The Checkout Session itself contains no placeholder values — `mode`,
`success_url`, `cancel_url`, and `line_items` all already carry real,
non-placeholder values and were preserved as-is. The only outstanding
placeholder is one missing Stripe Price ID in the catalogue.

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `watches[].stripePriceId` for `seiko-5-7s26-president` | *(absent)* | The live Stripe Price ID for the $439 Seiko 5 "President". Create it with `node --env-file=.env scripts/create-stripe-price.mjs seiko-5-7s26-president`, which writes it into `watches.ts` automatically. Until this is set, that listing shows the email-inquiry fallback instead of a pay button. |

### Not placeholders — do not change

These already hold real values and were deliberately left alone:

| Field | Current Value |
|-------|--------------|
| `mode` | `payment` — one-time charge for a single one-of-one watch, not a subscription |
| `success_url` | `https://tokaivintage.com/?checkout=success&session_id={CHECKOUT_SESSION_ID}` |
| `cancel_url` | `https://tokaivintage.com/?checkout=cancelled` |
| `line_items` | `[{ price: priceId, quantity: 1 }]` — `priceId` is resolved per-watch from `watches.ts` at request time |

Two test-mode price IDs remain in `watches.ts` for the Seiko 5 blue dial and
the SKX007 Pepsi. Both watches are `status: 'sold'`, so the allow-list filters
them out and they are inert. If either is ever put back on sale, delete its
test price ID and re-run the script against the live key first.

---

## Configured Parameters

These were configured in Checkout Studio and are now set correctly.

**Files containing these parameters:**

- [netlify/functions/create-checkout-session.mjs](netlify/functions/create-checkout-session.mjs)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `hosted_page` |
| `billing_address_collection` | `auto` |
| `phone_number_collection` | `{ enabled: false }` |
| `automatic_tax` | `{ enabled: false }` |
| `allow_promotion_codes` | `false` |
| `submit_type` | `auto` |
| `integration_identifier` | `hosted_web_0001` |
| `origin_context` | `web` |

`ui_mode` is version-dependent: SDK 21.0.0 and above use `hosted_page`, below
that use `hosted`. This project is on `stripe@22.6.1`, so `hosted_page` is
correct. All eight parameters, and the values `hosted_page`, `web`, and `auto`,
were verified against that installed SDK's type definitions before being added.

`payment_method_collection` was **omitted deliberately**. Checkout Studio
supplies `always`, but that parameter applies to `subscription` mode only and
this integration is `mode: 'payment'`.

---

## Parameters Kept Against the Spec — Read This

The Checkout Studio instructions said to remove any parameter absent from its
field list. Five such parameters exist in this call and **were kept**, because
removing them would break a live storefront that is days away from taking real
payments. Checkout Studio has no UI control for any of them, so their absence
from its list reflects what that tool manages, not a decision to turn them off.

| Parameter | What removing it would break |
|-----------|------------------------------|
| `shipping_address_collection` | Stripe would stop collecting a delivery address. These are physical watches shipped by USPS — there would be no address to ship to. |
| `shipping_options` | The $15 flat-rate shipping charge disappears. Every sale would silently under-collect by $15. |
| `metadata: { watchId }` | `alreadySold()` in this same file reads `s.metadata?.watchId` to stop a one-of-one watch selling twice. It would silently start returning `false` for every check. The order-notification email also loses the watch identity. |
| `client_reference_id` | The webhook's fallback for identifying which watch was bought (`metadata?.watchId ?? client_reference_id`). |
| `expires_at` | Abandoned checkout sessions would stop expiring after 30 minutes. |

If you genuinely intended to drop any of these — for example if you really did
turn off shipping address collection in Checkout Studio — say so and I will
remove them. Do not remove `metadata` without first replacing the double-sale
guard that depends on it.

---

## Setup

### Environment variables

Server-only, set in **Netlify → Site settings → Environment variables**. None
of these are browser-accessible and none take a `VITE_` prefix.

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | `sk_live_...` for real payments, `sk_test_...` for testing |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from the webhook endpoint. Must match the mode of the secret key. |
| `RESEND_API_KEY` | Order-notification emails. Without it the webhook logs a warning and sends nothing. |
| `ORDER_NOTIFY_EMAIL` | Optional. Defaults to the owner's inbox. |

Locally, `.env` holds `STRIPE_SECRET_KEY` for the price-creation script and is
gitignored. No publishable key is needed — this integration redirects to
Stripe's hosted page and never initialises Stripe.js in the browser.

Environment changes do not apply to an already-built deploy. Push or trigger a
redeploy after changing them.

### Dependencies

`stripe@22.6.1` is already installed. Nothing to add.

---

## Project Structure

No new files were created for the integration itself. The existing pieces:

```
netlify/functions/
  create-checkout-session.mjs   Creates the Checkout Session  ← modified
  stripe-webhook.mjs            Handles checkout.session.completed
  get-checkout-session.mjs      Renders the order confirmation
src/data/watches.ts             Catalogue; also the checkout allow-list
scripts/create-stripe-price.mjs Creates a Product + Price, writes the ID back
```

---

## How It Works

1. A buyer clicks **Review purchase** on a watch. The browser POSTs that
   watch's `stripePriceId` to `/.netlify/functions/create-checkout-session`.
2. The function checks the price against an allow-list derived directly from
   `watches.ts` — anything `sold` or without a price ID is rejected. There is
   no second list to keep in sync.
3. It then checks whether that `watchId` already has a paid session, so a
   one-of-one piece cannot sell twice.
4. It creates the Checkout Session with the parameters above and returns the
   hosted URL. The browser redirects to Stripe.
5. On payment, Stripe calls `stripe-webhook.mjs` with
   `checkout.session.completed`. That re-fetches the full session, emails the
   order details via Resend, and logs which watch to mark sold.
6. The buyer returns to `/?checkout=success&session_id=...`, and
   `get-checkout-session.mjs` returns a safe summary for the confirmation page.
7. **Manual step:** flip the watch to `status: 'sold'` in `watches.ts` and
   redeploy. Until that lands, step 3 is the only thing preventing a second sale
   — and it only scans the 100 most recent sessions, so do not delay it.

---

## Testing

With a `sk_test_` key, use Stripe's test cards — any future expiry, any CVC,
any postal code:

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Declined for insufficient funds |

Test and live modes are fully separate: test keys only see test prices, and a
test webhook secret will not verify live events. Mixing them is the most common
cause of a "No such price" error.

Going live is the six-step sequence in
[STRIPE_SETUP.md](STRIPE_SETUP.md#going-live). The order matters — set the
Netlify environment variables *before* pushing a live price ID, or buyers get a
hard checkout error instead of the harmless inquiry fallback.

---

## Next Steps

1. **Roll the exposed live secret key** if not already done, and confirm no
   unfamiliar activity in the Stripe Dashboard.
2. **Create the live price** for the Seiko 5 "President" (see Values to Replace).
3. **Create the live webhook endpoint** at
   `https://tokaivintage.com/.netlify/functions/stripe-webhook` for
   `checkout.session.completed`, and copy its signing secret.
4. **Set the three Netlify environment variables**, then push.
5. **Decide on tax.** `automatic_tax` is off. Whether you must collect depends
   on your jurisdiction and volume — an accountant question, not a code one.
6. **Consider a real domain for order emails.** The sender is currently
   `orders@resend.dev`, Stripe's shared sandbox domain, which has poor
   deliverability and is usually restricted to your own address.
7. **Harden the double-sale guard** if volume grows. See the limitation comment
   on `alreadySold()`.

---

## Resources

- Stripe Support — https://support.stripe.com
- Stripe MCP — https://docs.stripe.com/mcp
- Checkout Sessions API — https://docs.stripe.com/api/checkout/sessions
