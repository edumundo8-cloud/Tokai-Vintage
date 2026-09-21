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
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { watches } from '../src/data/watches.ts';
import { SITE_NAME } from '../src/lib/site.ts';
import { formatUsd } from '../src/lib/format.ts';
import {
  collectionJsonLd,
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

// Homepage: keep its own head, add the collection list so search engines can
// see every listing (and its price) from the entry point.
await writeFile(
  'dist/index.html',
  template.replace(END, `${jsonLd(collectionJsonLd(listed))}\n    ${END}`),
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

console.log(`prerender: ${listed.length} listing pages + homepage`);
