// Bakes a real HTML file for every listing URL after the Vite build.
//
// The site is a single-page app: without this step every /w/<slug> URL is
// served the same generic index.html, so a shared link previews as the
// homepage and crawlers that don't run JavaScript see no product at all.
// Here we clone dist/index.html once per watch, swap the block between the
// seo:start / seo:end markers for that watch's title, description, canonical,
// Open Graph tags and Product structured data, and drop a <noscript> copy of
// the listing text into the body. React still takes over and renders the
// modal as usual once the bundle loads.
//
// It also writes two standalone pages that don't load the app: /returns (the
// return policy that the structured data and Google Merchant Center link to)
// and 404.html, which Netlify serves with a real 404 status for unknown URLs.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { RETURNS, SHIPPING, watches } from '../src/data/watches.ts';
import { CONTACT_EMAIL, RETURNS_PATH, SITE_NAME, SITE_URL } from '../src/lib/site.ts';
import { formatUsd } from '../src/lib/format.ts';
import {
  collectionJsonLd,
  storeJsonLd,
  watchBreadcrumbJsonLd,
  watchDescription,
  watchImageUrl,
  watchProductJsonLd,
  watchTitle,
  watchUrl,
} from '../src/lib/seo.ts';

const START = '<!-- seo:start -->';
const END = '<!-- seo:end -->';
const ROOT_DIV = '<div id="root"></div>';

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** JSON-LD script tag; `<` is escaped so page content can never close it. */
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\u003c')}</script>`;

const template = await readFile('dist/index.html', 'utf8');
if (!template.includes(START) || !template.includes(END)) {
  throw new Error('dist/index.html is missing the seo:start / seo:end markers');
}

function replaceSeoBlock(html, block) {
  const head = html.slice(0, html.indexOf(START));
  const tail = html.slice(html.indexOf(END) + END.length);
  return `${head}${START}\n${block}\n    ${END}${tail}`;
}

function watchHead(watch) {
  const title = esc(watchTitle(watch));
  const description = esc(watchDescription(watch));
  const url = watchUrl(watch);
  const image = watchImageUrl(watch);
  const availability = watch.status === 'available' ? 'in stock' : 'out of stock';

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
    `<link rel="canonical" href="${url}" />`,
    '<meta name="theme-color" content="#26362C" />',
    '<meta property="og:type" content="product" />',
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${esc(watch.name)}" />`,
    `<meta property="product:price:amount" content="${watch.price}" />`,
    `<meta property="product:price:currency" content="${watch.currency}" />`,
    `<meta property="product:availability" content="${availability}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    jsonLd(watchProductJsonLd(watch)),
    jsonLd(watchBreadcrumbJsonLd(watch)),
  ]
    .map((line) => `    ${line}`)
    .join('\n');
}

/**
 * Plain-HTML version of the listing for crawlers (and readers) without
 * JavaScript. React replaces #root on mount, so this lives outside it and is
 * hidden from anyone who does have the app running.
 */
function watchNoscript(watch) {
  const specs = watch.specs
    .map((s) => `<dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd>`)
    .join('');
  const condition = watch.condition.map((line) => `<li>${esc(line)}</li>`).join('');
  const price = watch.status === 'sold' ? 'Sold' : formatUsd(watch.price);

  return `<noscript>
      <article>
        <h1>${esc(watch.name)}</h1>
        <p>${esc(price)} — ${esc(watch.shortDescription)}</p>
        <img src="${esc(watch.images[0] ?? '/og-image.jpg')}" alt="${esc(watch.name)}" width="600" />
        <h2>Technical specifications</h2>
        <dl>${specs}</dl>
        <h2>Condition &amp; honesty notes</h2>
        <ul>${condition}</ul>
        <p>Service: ${esc(watch.service)}</p>
        <p>Water resistance: ${esc(watch.waterResistance)}</p>
        <p><a href="/">See the rest of the ${esc(SITE_NAME)} collection</a></p>
      </article>
    </noscript>
    `;
}

const listed = watches.filter((w) => w.status !== 'coming-soon');

// Homepage: keep its own head, add the store and the collection list so
// search engines can see every listing (and its price) from the entry point.
await writeFile(
  'dist/index.html',
  template.replace(
    END,
    `${jsonLd(storeJsonLd())}\n    ${jsonLd(collectionJsonLd(listed))}\n    ${END}`
  ),
  'utf8'
);

for (const watch of listed) {
  const html = replaceSeoBlock(template, watchHead(watch)).replace(
    ROOT_DIV,
    `${ROOT_DIV}\n    ${watchNoscript(watch)}`
  );

  // Both spellings are written so the URL resolves with or without a
  // trailing slash, whichever way Netlify matches it first.
  await mkdir(`dist/w/${watch.slug}`, { recursive: true });
  await writeFile(`dist/w/${watch.slug}/index.html`, html, 'utf8');
  await writeFile(`dist/w/${watch.slug}.html`, html, 'utf8');
}

/**
 * A plain page in the site's colours and fonts, without the React bundle —
 * served as-is so it can never fall back to rendering the homepage.
 */
function staticPage({ title, description, canonical, robots, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="${robots}" />
    ${canonical ? `<link rel="canonical" href="${canonical}" />` : ''}
    <meta name="theme-color" content="#26362C" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Work+Sans:wght@400;500&display=swap" rel="stylesheet" />
    <style>
      body { margin: 0; background: #f6f1e4; color: #211f1c; font: 16px/1.7 'Work Sans', system-ui, sans-serif; }
      header, footer { background: #1a261f; color: #f6f1e4; padding: 18px 20px; }
      header a { color: #f6f1e4; text-decoration: none; font-family: 'Cormorant Garamond', serif; font-size: 20px; letter-spacing: 0.14em; }
      main { max-width: 680px; margin: 0 auto; padding: 48px 20px 64px; }
      h1, h2 { font-family: 'Cormorant Garamond', serif; font-weight: 500; line-height: 1.2; }
      h1 { font-size: 40px; margin: 0 0 16px; }
      h2 { font-size: 26px; margin: 36px 0 8px; }
      a { color: #3e5544; }
      .eyebrow { color: #6e9583; font-size: 12px; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase; margin: 0 0 8px; }
      footer { font-size: 13px; text-align: center; color: rgba(246, 241, 228, 0.6); }
    </style>
  </head>
  <body>
    <header><a href="/">TOKAI VINTAGE</a></header>
    <main>
${body}
    </main>
    <footer>© ${new Date().getFullYear()} ${esc(SITE_NAME)}. Shipping within the United States only.</footer>
  </body>
</html>
`;
}

const mailto = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
const returnsHtml = staticPage({
  title: `Shipping & Returns | ${SITE_NAME}`,
  description: `${RETURNS.windowDays}-day returns on every watch. Flat $${SHIPPING.flatRateUsd} ${SHIPPING.carrier} shipping within the United States.`,
  canonical: `${SITE_URL}${RETURNS_PATH}`,
  robots: 'index, follow',
  body: `      <p class="eyebrow">Policies</p>
      <h1>Shipping &amp; Returns</h1>

      <h2>Returns</h2>
      <p>You can return any watch within <strong>${RETURNS.windowDays} days of delivery</strong> for a refund.</p>
      <ul>
        <li>Email ${mailto} with your order details before sending anything back, and we'll reply with the return address.</li>
        <li>The watch must come back in the condition it was sent, with everything that came with it (box, papers, spare links). Please don't open, adjust or service it.</li>
        <li>${RETURNS.buyerPaysReturnShipping ? 'Return shipping is paid by the buyer. Please ship it insured and with tracking.' : 'Return shipping is on us — we will send you a prepaid label.'}</li>
        <li>Once the watch arrives and we've checked it, the purchase price is refunded to your original payment method within ${RETURNS.refundBusinessDays} business days. The original shipping charge is not refunded.</li>
        <li>If a watch arrives not as described, we cover the return shipping and refund the full amount, shipping included.</li>
      </ul>

      <h2>Shipping</h2>
      <p>Every watch ships via ${SHIPPING.carrier} for a flat $${SHIPPING.flatRateUsd}, ${SHIPPING.region}. ${SHIPPING.note}</p>

      <h2>Contact</h2>
      <p>Questions about a watch, an order or a return: ${mailto}.</p>

      <p><a href="/">← Back to the collection</a></p>`,
});
await mkdir(`dist${RETURNS_PATH}`, { recursive: true });
await writeFile(`dist${RETURNS_PATH}/index.html`, returnsHtml, 'utf8');
await writeFile(`dist${RETURNS_PATH}.html`, returnsHtml, 'utf8');

await writeFile(
  'dist/404.html',
  staticPage({
    title: `Page not found | ${SITE_NAME}`,
    description: 'This page does not exist.',
    robots: 'noindex',
    body: `      <p class="eyebrow">404</p>
      <h1>This page doesn't exist</h1>
      <p>The link may be old, or the watch it pointed to is no longer listed.</p>
      <p><a href="/">← See the collection</a></p>`,
  }),
  'utf8'
);

console.log(`prerender: ${listed.length} listing pages + homepage, /returns, 404`);
