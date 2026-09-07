# Connecting Stripe (no backend required)

This site is a static front end — there's no server here to talk to Stripe's
API directly, and no Stripe account is connected in this project. The
practical way to take real card payments from a static site like this is
**Stripe Payment Links**, which is entirely no-code and lives in your Stripe
Dashboard.

## One-time setup, per watch

1. Log in to your Stripe Dashboard → **Payment links** → **New**.
2. Add a product for the watch (name + the same price shown on the site,
   e.g. $169 for the Seiko 5).
3. Under **Shipping**, add a shipping rate: flat $15 USD, and restrict
   shipping to the **United States** only (matches the site's shipping
   policy).
4. Turn on **Automatic tax** if you want Stripe to calculate sales tax at
   checkout (the site's "total before tax" note assumes tax is added at
   this step).
5. Save, and copy the generated link (looks like
   `https://buy.stripe.com/xxxxxxxx`).

## Wiring it into the site

Open `src/data/watches.ts` and add the link to the matching watch:

```ts
{
  id: 'seiko-5-7s26-blue',
  ...
  stripePaymentLink: 'https://buy.stripe.com/xxxxxxxx',
}
```

That's it — the "Review purchase" button in the product modal will
automatically switch from the email-inquiry fallback to "Review purchase —
pay with Stripe" and open that Payment Link in a new tab. A watch with no
`stripePaymentLink` configured keeps showing the inquiry/eBay fallback, so
there's never a dead end for a buyer.

## If you outgrow Payment Links later

Payment Links cover single-item, fixed-price checkout well, which matches
this catalog. If you later want a fully custom checkout (multiple items in
one cart, dynamic pricing, etc.) you'd need a small server endpoint (e.g. a
Vercel serverless function) that creates a Stripe Checkout Session with your
**secret** key — that key must never live in this front-end code. Happy to
help set that up when/if you need it.
