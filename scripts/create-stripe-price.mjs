// Creates a Stripe Product + Price for one watch and writes the resulting
// price ID back into src/data/watches.ts.
//
//   STRIPE_SECRET_KEY=sk_... node scripts/create-stripe-price.mjs <watch-id>
//
// The secret key is read from the environment and never printed or stored.
// Whether the price lands in test or live mode is decided entirely by which
// key you pass: sk_test_... creates a test price, sk_live_... a real one.
//
// Re-running for a watch that already has a stripePriceId is refused, so a
// second run can't silently orphan the first price.
import { readFile, writeFile } from 'node:fs/promises';
import Stripe from 'stripe';
import { watches } from '../src/data/watches.ts';

const WATCHES_FILE = 'src/data/watches.ts';

const watchId = process.argv[2];
if (!watchId) {
  console.error('usage: node scripts/create-stripe-price.mjs <watch-id>');
  console.error('\navailable:');
  for (const w of watches.filter((w) => w.status !== 'coming-soon')) {
    const marker = w.stripePriceId ? '(has price)' : '';
    console.error(`  ${w.id}  $${w.price}  ${marker}`);
  }
  process.exit(1);
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY is not set.');
  console.error('Put it in .env (gitignored) or pass it inline for one command.');
  process.exit(1);
}

const watch = watches.find((w) => w.id === watchId);
if (!watch) {
  console.error(`No watch with id "${watchId}" in ${WATCHES_FILE}.`);
  process.exit(1);
}
if (watch.stripePriceId) {
  console.error(`"${watchId}" already has stripePriceId ${watch.stripePriceId}.`);
  console.error('Remove it first if you really mean to create a replacement.');
  process.exit(1);
}
if (watch.status === 'sold') {
  console.error(`"${watchId}" is marked sold — refusing to create a price for it.`);
  process.exit(1);
}

const mode = key.startsWith('sk_live_') ? 'LIVE' : 'test';
const stripe = new Stripe(key);

console.log(`Creating ${mode} price for "${watch.name}" at $${watch.price}…`);

const product = await stripe.products.create({
  name: watch.name,
  description: watch.shortDescription,
  metadata: { watchId: watch.id, slug: watch.slug },
});

const price = await stripe.prices.create({
  product: product.id,
  currency: watch.currency.toLowerCase(),
  unit_amount: watch.price * 100, // catalogue prices are whole dollars
});

// Append `stripePriceId` as the last field of this watch's object. Anchoring
// on the entry's closing brace (the first `\n  },` after its `id:` line) keeps
// this correct regardless of how the fields above are wrapped across lines.
const source = await readFile(WATCHES_FILE, 'utf8');
const idAnchor = source.indexOf(`id: '${watch.id}'`);
if (idAnchor === -1) throw new Error(`could not locate id: '${watch.id}' in ${WATCHES_FILE}`);
const objectEnd = source.indexOf('\n  },', idAnchor);
if (objectEnd === -1) {
  throw new Error(`could not locate the end of the ${watch.id} entry`);
}
const patched =
  source.slice(0, objectEnd) +
  `\n    stripePriceId: '${price.id}',` +
  source.slice(objectEnd);
await writeFile(WATCHES_FILE, patched, 'utf8');

console.log(`\n  product  ${product.id}`);
console.log(`  price    ${price.id}   (${mode} mode)`);
console.log(`\nWrote stripePriceId into ${WATCHES_FILE}. Commit and deploy to go live.`);
if (mode === 'test') {
  console.log('Test mode: checkout accepts card 4242 4242 4242 4242, any future expiry.');
}
