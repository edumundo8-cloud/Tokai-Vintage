// Small HTML helpers shared by the build scripts that write static pages.
import { RETURNS_PATH, SITE_NAME } from '../src/lib/site.ts';
import { VIDEOS_PATH } from '../src/lib/video.ts';

export const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** JSON-LD script tag; `<` is escaped so page content can never close it. */
export const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/**
 * A plain page in the site's colours and fonts, without the React bundle —
 * served as-is so it can never fall back to rendering the homepage. `head`
 * is extra markup for <head> (Open Graph tags, structured data, scripts);
 * `wide` gives grid pages a wider column.
 */
export function staticPage({ title, description, canonical, robots, head = '', wide = false, body }) {
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
      header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; }
      header a { color: #f6f1e4; text-decoration: none; }
      header .brand { font-family: 'Cormorant Garamond', serif; font-size: 20px; letter-spacing: 0.14em; }
      header nav { display: flex; gap: 20px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
      header nav a { color: rgba(246, 241, 228, 0.7); }
      header nav a:hover { color: #f6f1e4; }
      main { max-width: 760px; margin: 0 auto; padding: 48px 20px 64px; }
      main.wide { max-width: 1080px; }
      h1, h2, h3 { font-family: 'Cormorant Garamond', serif; font-weight: 500; line-height: 1.2; }
      h1 { font-size: 40px; margin: 0 0 16px; }
      h2 { font-size: 26px; margin: 36px 0 8px; }
      h3 { font-size: 21px; margin: 10px 0 4px; }
      a { color: #3e5544; }
      img { max-width: 100%; height: auto; }
      .eyebrow { color: #6e9583; font-size: 12px; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase; margin: 0 0 8px; }
      .meta { color: rgba(33, 31, 28, 0.6); font-size: 14px; margin: 0 0 20px; }
      .player { position: relative; aspect-ratio: 16 / 9; background: #1a261f; margin: 0 0 28px; }
      .player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
      .chapters { list-style: none; padding: 0; margin: 0; }
      .chapters li { display: flex; gap: 14px; padding: 6px 0; border-bottom: 1px solid rgba(33, 31, 28, 0.08); }
      .chapters a { font-variant-numeric: tabular-nums; min-width: 3.5em; }
      details { border: 1px solid rgba(33, 31, 28, 0.12); padding: 12px 18px; background: rgba(236, 228, 209, 0.4); }
      summary { cursor: pointer; font-weight: 500; }
      .grid { display: grid; gap: 36px 28px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
      .card { text-decoration: none; color: inherit; display: block; }
      .card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #1a261f; }
      .card:hover h3 { text-decoration: underline; }
      .card p { margin: 4px 0 0; color: rgba(33, 31, 28, 0.75); font-size: 15px; }
      .shop { margin-top: 48px; padding: 24px; border: 1px solid rgba(33, 31, 28, 0.12); text-align: center; }
      footer { font-size: 13px; text-align: center; color: rgba(246, 241, 228, 0.6); }
    </style>
    ${head}
  </head>
  <body>
    <header>
      <a class="brand" href="/">TOKAI VINTAGE</a>
      <nav>
        <a href="/#collection">Collection</a>
        <a href="${VIDEOS_PATH}">Videos</a>
        <a href="${RETURNS_PATH}">Returns</a>
      </nav>
    </header>
    <main${wide ? ' class="wide"' : ''}>
${body}
    </main>
    <footer>© ${new Date().getFullYear()} ${esc(SITE_NAME)}. Shipping within the United States only.</footer>
  </body>
</html>
`;
}
