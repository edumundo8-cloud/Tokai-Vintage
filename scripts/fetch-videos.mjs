// Refreshes src/data/videos.json from the public TIME & POWER YouTube channel.
//
// Run by hand after publishing a video (`npm run videos`), then commit the
// result — the build never talks to YouTube, so a deploy can't break because
// YouTube changed its markup. The channel's RSS feed is unreliable, so this
// reads the public channel and watch pages instead.
//
// Slugs are kept from the previous videos.json, so a renamed video keeps its
// /videos/<slug> URL. Transcripts are not fetched: drop the episode's SRT in
// content/transcripts/<videoId>.srt and the prerender picks it up.
import { readFile, writeFile } from 'node:fs/promises';

const CHANNEL_VIDEOS_URL = 'https://www.youtube.com/@TimeNPower/videos';
const OUT = 'src/data/videos.json';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Description paragraphs that are channel boilerplate, not about the video.
const BOILERPLATE = [/^TIME & POWER explores/i, /^Watches\. Identity\. History\./i, /^#/];
// Where the summary ends: CHAPTERS, SOURCES, CREDITS… in any case.
const HEADING = /^(?:[A-Z][A-Z0-9 &/-]{2,}$|(?:chapters|sources|credits|footage|music|photos|images)\b)/i;
const CHAPTER = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+[-–—]?\s*(.+)$/;

async function fetchText(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.text();
}

function toSeconds(stamp) {
  return stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

function slugify(title) {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= 70) return slug;
  return slug.slice(0, 70).replace(/-[^-]*$/, '');
}

/** The opening paragraphs, up to the first CHAPTERS/SOURCES-style heading. */
function parseSummary(description) {
  const summary = [];
  for (const block of description.split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (HEADING.test(lines[0]) || CHAPTER.test(lines[0])) break;
    const text = lines.join(' ');
    if (!BOILERPLATE.some((re) => re.test(text))) summary.push(text);
  }
  return summary;
}

function parseChapters(description) {
  return description
    .split('\n')
    .map((line) => line.trim().match(CHAPTER))
    .filter(Boolean)
    .map(([, stamp, label]) => ({ seconds: toSeconds(stamp), label: label.trim() }));
}

const previous = await readFile(OUT, 'utf8')
  .then((text) => JSON.parse(text))
  .catch(() => []);
const knownSlugs = new Map(previous.map((v) => [v.id, v.slug]));

const channelHtml = await fetchText(CHANNEL_VIDEOS_URL);
// Newest first, as the channel's Videos tab lists them.
const ids = [...new Set([...channelHtml.matchAll(/"videoId":"([\w-]{11})"/g)].map((m) => m[1]))];
if (ids.length === 0) throw new Error('No videos found on the channel page — has the markup changed?');

const videos = [];
for (const id of ids) {
  const html = await fetchText(`https://www.youtube.com/watch?v=${id}`);
  const match = html.match(/var ytInitialPlayerResponse = (\{.*?\});(?:var|<\/script>)/s);
  if (!match) throw new Error(`No player data on the watch page for ${id}`);
  const player = JSON.parse(match[1]);
  const details = player.videoDetails;
  const micro = player.microformat?.playerMicroformatRenderer ?? {};
  if (details.isPrivate || micro.isUnlisted) continue;

  const description = details.shortDescription ?? '';
  videos.push({
    id,
    slug: knownSlugs.get(id) ?? slugify(details.title),
    title: details.title,
    summary: parseSummary(description),
    chapters: parseChapters(description),
    uploadDate: micro.uploadDate ?? micro.publishDate,
    durationSeconds: Number(details.lengthSeconds),
  });
}

await writeFile(OUT, `${JSON.stringify(videos, null, 2)}\n`, 'utf8');
console.log(`videos: ${videos.length} written to ${OUT}`);
for (const v of videos) console.log(`  ${v.uploadDate?.slice(0, 10)}  /videos/${v.slug}`);
