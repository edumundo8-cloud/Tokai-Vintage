// Writes /videos (every TIME & POWER documentary) and one /videos/<slug> page
// per video into dist/, from src/data/videos.json.
//
// Each video page is a proper "watch page" for Google: the embedded player is
// the main content, with the summary, chapters, the full transcript (from
// content/transcripts/<videoId>.srt when there is one) and VideoObject
// structured data. That is what lets the videos show up in Google's video
// results pointing at tokaivintage.com rather than only at YouTube.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { SITE_NAME, SITE_URL } from '../src/lib/site.ts';
import {
  CHANNEL_NAME,
  CHANNEL_URL,
  embedUrl,
  formatDuration,
  formatUploadDate,
  thumbnailUrl,
  VIDEOS_PATH,
  videoPath,
  videoUrl,
  youtubeUrl,
} from '../src/lib/video.ts';
import { videoBreadcrumbJsonLd, videoJsonLd, videoListJsonLd } from '../src/lib/seo.ts';
import { esc, jsonLd, staticPage } from './html.mjs';

const SENTENCE_END = /[.!?…"”')]$/;

/**
 * SRT → paragraphs. A pause of a second or more after a finished sentence
 * starts a new paragraph, which lines up with the narration's own breaks
 * (the pauses between chapters are longer still).
 */
export function srtToParagraphs(srt) {
  const toMs = (t) => {
    const [h, m, rest] = t.split(':');
    const [s, ms] = rest.split(/[,.]/);
    return ((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(ms);
  };

  const paragraphs = [];
  let current = '';
  let lastEnd = 0;
  for (const block of srt.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const timing = lines.findIndex((l) => l.includes('-->'));
    if (timing === -1) continue;
    const [start, end] = lines[timing].split('-->').map((t) => toMs(t.trim()));
    const text = lines.slice(timing + 1).join(' ').replace(/<[^>]+>/g, '');
    if (!text) continue;

    if (current && start - lastEnd >= 1000 && SENTENCE_END.test(current)) {
      paragraphs.push(current);
      current = '';
    }
    current = current ? `${current} ${text}` : text;
    lastEnd = end;
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

async function readTranscript(video) {
  try {
    return srtToParagraphs(await readFile(`content/transcripts/${video.id}.srt`, 'utf8'));
  } catch {
    return null;
  }
}

/** Meta description: the opening of the summary, clipped near 160 characters. */
function metaDescription(video) {
  const text = (video.summary[0] ?? video.title).replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  const clipped = text.slice(0, 157);
  return `${clipped.slice(0, clipped.lastIndexOf(' '))}…`;
}

function socialTags({ type, title, description, url, image }) {
  return [
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
}

function videoCard(video, headingLevel = 'h3') {
  return `<a class="card" href="${videoPath(video)}">
          <img src="${thumbnailUrl(video, 'mq')}" srcset="${thumbnailUrl(video, 'mq')} 320w, ${thumbnailUrl(video, 'maxres')} 1280w" sizes="(min-width: 1080px) 340px, (min-width: 640px) 45vw, 100vw" width="1280" height="720" alt="" loading="lazy" />
          <${headingLevel}>${esc(video.title)}</${headingLevel}>
          <p>${esc(formatUploadDate(video))} · ${formatDuration(video.durationSeconds)}</p>
        </a>`;
}

// Chapter links (and ?t= in the page URL, which the Clip structured data
// uses) restart the embedded player at that second instead of leaving for
// YouTube. Without JavaScript the links still open YouTube at that time.
const PLAYER_SCRIPT = `<script>
      (function () {
        var player = document.getElementById('player');
        if (!player) return;
        var base = player.getAttribute('data-src');
        function seek(seconds, autoplay) {
          player.src = base + '?start=' + seconds + (autoplay ? '&autoplay=1' : '');
        }
        var t = parseInt(new URLSearchParams(location.search).get('t'), 10);
        if (t > 0) seek(t, false);
        document.querySelectorAll('[data-seek]').forEach(function (link) {
          link.addEventListener('click', function (event) {
            event.preventDefault();
            seek(link.getAttribute('data-seek'), true);
            player.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        });
      })();
    </script>`;

function videoPage(video, transcript, others) {
  const description = metaDescription(video);
  const chapters = video.chapters.length
    ? `
      <h2>Chapters</h2>
      <ol class="chapters">
        ${video.chapters
          .map(
            (c) =>
              `<li><a href="${youtubeUrl(video, c.seconds)}" data-seek="${c.seconds}">${formatDuration(c.seconds)}</a><span>${esc(c.label)}</span></li>`
          )
          .join('\n        ')}
      </ol>`
    : '';
  const transcriptHtml = transcript
    ? `
      <h2>Transcript</h2>
      <details>
        <summary>Read the full transcript</summary>
        ${transcript.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
      </details>`
    : '';

  return staticPage({
    title: `${video.title} | ${CHANNEL_NAME} · ${SITE_NAME}`,
    description,
    canonical: videoUrl(video),
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    head: [
      socialTags({
        type: 'video.other',
        title: video.title,
        description,
        url: videoUrl(video),
        image: thumbnailUrl(video, 'maxres'),
      }),
      jsonLd(videoJsonLd(video)),
      jsonLd(videoBreadcrumbJsonLd(video)),
    ].join('\n    '),
    body: `      <p class="eyebrow"><a href="${VIDEOS_PATH}">${esc(CHANNEL_NAME)} · Videos</a></p>
      <h1>${esc(video.title)}</h1>
      <p class="meta">${esc(formatUploadDate(video))} · ${formatDuration(video.durationSeconds)}</p>
      <div class="player">
        <iframe id="player" src="${embedUrl(video)}" data-src="${embedUrl(video)}" title="${esc(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      ${video.summary.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <p><a href="${youtubeUrl(video)}" rel="noopener">Watch on YouTube</a> · <a href="${CHANNEL_URL}" rel="noopener">Subscribe to ${esc(CHANNEL_NAME)}</a></p>
${chapters}
${transcriptHtml}

      <div class="shop">
        <p>${esc(CHANNEL_NAME)} is made by ${esc(SITE_NAME)}, a small shop for vintage Japanese and Swiss watches.</p>
        <p><a href="/#collection">See what's in the shop now →</a></p>
      </div>

      <h2>More from ${esc(CHANNEL_NAME)}</h2>
      <div class="grid">
        ${others.map((v) => videoCard(v)).join('\n        ')}
      </div>
    ${PLAYER_SCRIPT}`,
  });
}

function indexPage(videos) {
  const description = `Short documentaries on the watches that shaped history — from the Rolex Submariner to the Seiko Astron — by ${CHANNEL_NAME}, the channel from ${SITE_NAME}.`;
  return staticPage({
    title: `Watch History Documentaries | ${CHANNEL_NAME} · ${SITE_NAME}`,
    description,
    canonical: `${SITE_URL}${VIDEOS_PATH}`,
    robots: 'index, follow, max-image-preview:large',
    wide: true,
    head: [
      socialTags({
        type: 'website',
        title: `${CHANNEL_NAME} — watch history documentaries`,
        description,
        url: `${SITE_URL}${VIDEOS_PATH}`,
        image: thumbnailUrl(videos[0], 'maxres'),
      }),
      jsonLd(videoListJsonLd(videos)),
    ].join('\n    '),
    body: `      <p class="eyebrow">${esc(CHANNEL_NAME)} · Our YouTube channel</p>
      <h1>The stories behind the watches</h1>
      <p>Short documentaries about the watches that changed history — who made them, why, and what the myths leave out. New episodes on <a href="${CHANNEL_URL}" rel="noopener">YouTube</a>.</p>
      <div class="grid" style="margin-top: 36px">
        ${videos.map((v) => videoCard(v, 'h2')).join('\n        ')}
      </div>`,
  });
}

/** Writes the pages; returns how many video pages were written. */
export async function writeVideoPages() {
  const videos = JSON.parse(await readFile('src/data/videos.json', 'utf8'));
  if (videos.length === 0) return 0;

  await mkdir(`dist${VIDEOS_PATH}`, { recursive: true });
  const index = indexPage(videos);
  await writeFile(`dist${VIDEOS_PATH}/index.html`, index, 'utf8');
  await writeFile(`dist${VIDEOS_PATH}.html`, index, 'utf8');

  for (const [i, video] of videos.entries()) {
    // The three that follow in the list, wrapping around, so every page
    // links on to different episodes.
    const others = [1, 2, 3].map((n) => videos[(i + n) % videos.length]).filter((v) => v !== video);
    const html = videoPage(video, await readTranscript(video), others);
    await mkdir(`dist${videoPath(video)}`, { recursive: true });
    await writeFile(`dist${videoPath(video)}/index.html`, html, 'utf8');
    await writeFile(`dist${videoPath(video)}.html`, html, 'utf8');
  }
  return videos.length;
}
