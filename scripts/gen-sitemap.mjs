// Writes public/sitemap.xml from the watch catalogue so every listing URL is
// discoverable. Runs before each build.
import { writeFile } from 'node:fs/promises';
import { watches } from '../src/data/watches.ts';
import { SITE_URL } from '../src/lib/site.ts';

const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: `${SITE_URL}/`, priority: '1.0' },
  ...watches
    .filter((w) => w.status !== 'coming-soon')
    .map((w) => ({ loc: `${SITE_URL}/w/${w.slug}`, priority: '0.8' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>
`;

await writeFile('public/sitemap.xml', xml, 'utf8');
console.log(`sitemap: ${urls.length} urls`);
