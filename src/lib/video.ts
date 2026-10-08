// Helpers for the TIME & POWER videos, shared by the homepage section and by
// scripts/prerender.mjs (which writes the /videos pages). The list itself is
// src/data/videos.json, refreshed with `npm run videos`.
import { SITE_URL } from './site.ts';

export interface VideoChapter {
  seconds: number;
  label: string;
}

export interface Video {
  id: string;
  slug: string;
  title: string;
  summary: string[];
  chapters: VideoChapter[];
  uploadDate: string; // ISO 8601 with offset, as YouTube reports it
  durationSeconds: number;
}

export const VIDEOS_PATH = '/videos';
export const CHANNEL_NAME = 'TIME & POWER';
export const CHANNEL_URL = 'https://www.youtube.com/@TimeNPower';

export function videoPath(video: Video): string {
  return `${VIDEOS_PATH}/${video.slug}`;
}

export function videoUrl(video: Video): string {
  return `${SITE_URL}${videoPath(video)}`;
}

export function youtubeUrl(video: Video, startSeconds = 0): string {
  const start = startSeconds > 0 ? `&t=${startSeconds}s` : '';
  return `https://www.youtube.com/watch?v=${video.id}${start}`;
}

export function embedUrl(video: Video): string {
  return `https://www.youtube-nocookie.com/embed/${video.id}`;
}

/** 16:9 thumbnails, no letterboxing: mq is 320×180, maxres 1280×720. */
export function thumbnailUrl(video: Video, size: 'mq' | 'maxres' = 'maxres'): string {
  return `https://i.ytimg.com/vi/${video.id}/${size}default.jpg`;
}

/** 605 → "10:05" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** 605 → "PT10M5S", the ISO 8601 duration VideoObject expects. */
export function isoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

/** "Oct 3, 2026", in the channel's own time zone offset. */
export function formatUploadDate(video: Video): string {
  const [year, month, day] = video.uploadDate.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
