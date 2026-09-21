// Writes public/sitemap.xml from the watch catalogue so every listing URL is
// discoverable. Each listing also declares its photographs, which is how the
// watch photos get picked up for Google Images. Runs before each build.
import { writeFile } from 'node:fs/promises';
import { watches } from '../src/data/watches.ts';
import { SITE_URL } from '../src/lib/site.ts';

const today = new Date().toISOString().slice(0, 10);

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urls = [
  { loc: `${SITE_URL}/`, priority: '1.0', images: [] },
  ...watches
    .filter((w) => w.status !== 'coming-soon')
    .map((w) => ({
      loc: `${SITE_URL}/w/${w.slug}`,
      priority: '0.8',
      images: w.images.map((src) => ({ loc: `${SITE_URL}${src}`, title: w.name })),
    })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map((u) => {
    const images = u.images
      .map(
        (img) =>
          `\n    <image:image>\n      <image:loc>${img.loc}</image:loc>\n      <image:title>${esc(
            img.title
          )}</image:title>\n    </image:image>`
      )
      .join('');
    return `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>${images}\n  </url>`;
  })
  .join('\n')}
</urlset>
`;

await writeFile('public/sitemap.xml', xml, 'utf8');
console.log(
  `sitemap: ${urls.length} urls, ${urls.reduce((n, u) => n + u.images.length, 0)} images`
);
