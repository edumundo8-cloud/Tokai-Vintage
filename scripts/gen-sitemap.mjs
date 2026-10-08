// Writes public/sitemap.xml from the watch catalogue so every listing URL is
// discoverable. Each listing also declares its photographs, which is how the
// watch photos get picked up for Google Images, and each /videos/<slug> page
// declares its video (Google video sitemap extension). Runs before each build.
import { readFile, writeFile } from 'node:fs/promises';
import { watches } from '../src/data/watches.ts';
import { RETURNS_PATH, SITE_URL } from '../src/lib/site.ts';
import { embedUrl, thumbnailUrl, VIDEOS_PATH, videoUrl } from '../src/lib/video.ts';

const videos = JSON.parse(await readFile('src/data/videos.json', 'utf8'));

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
  { loc: `${SITE_URL}${RETURNS_PATH}`, priority: '0.3', images: [] },
  ...(videos.length > 0 ? [{ loc: `${SITE_URL}${VIDEOS_PATH}`, priority: '0.6', images: [] }] : []),
  ...videos.map((v) => ({
    loc: videoUrl(v),
    priority: '0.5',
    images: [],
    video: {
      thumbnail: thumbnailUrl(v, 'maxres'),
      title: v.title,
      description: v.summary.join(' ') || v.title,
      player: embedUrl(v),
      duration: v.durationSeconds,
      published: v.uploadDate,
    },
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
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
    const video = u.video
      ? `\n    <video:video>\n      <video:thumbnail_loc>${esc(u.video.thumbnail)}</video:thumbnail_loc>\n      <video:title>${esc(
          u.video.title
        )}</video:title>\n      <video:description>${esc(u.video.description.slice(0, 2048))}</video:description>\n      <video:player_loc>${esc(
          u.video.player
        )}</video:player_loc>\n      <video:duration>${u.video.duration}</video:duration>\n      <video:publication_date>${u.video.published}</video:publication_date>\n    </video:video>`
      : '';
    return `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>${images}${video}\n  </url>`;
  })
  .join('\n')}
</urlset>
`;

await writeFile('public/sitemap.xml', xml, 'utf8');
console.log(
  `sitemap: ${urls.length} urls, ${urls.reduce((n, u) => n + u.images.length, 0)} images, ${videos.length} videos`
);
