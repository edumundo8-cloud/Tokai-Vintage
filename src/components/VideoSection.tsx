import { videos } from '@/data/videos';
import {
  CHANNEL_NAME,
  CHANNEL_URL,
  formatDuration,
  thumbnailUrl,
  VIDEOS_PATH,
  videoPath,
} from '@/lib/video';

// The newest few; the rest live on /videos.
const SHOWN = 4;

export default function VideoSection() {
  if (videos.length === 0) return null;

  return (
    <section id="videos" className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-verdigris">
            {CHANNEL_NAME} · Our YouTube channel
          </p>
          <h2 className="text-balance font-serif text-3xl text-charcoal md:text-4xl">
            The stories behind the watches
          </h2>
          <p className="mt-4 text-balance leading-relaxed text-charcoal-soft/90">
            Short documentaries about the watches that changed history — who made them, why, and
            what the myths leave out.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <a
            href={VIDEOS_PATH}
            className="font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
          >
            All {videos.length} videos
          </a>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
          >
            Subscribe on YouTube
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {videos.slice(0, SHOWN).map((video) => (
          <a key={video.id} href={videoPath(video)} className="group block">
            <div className="relative aspect-video overflow-hidden bg-forest-dim">
              <img
                src={thumbnailUrl(video, 'mq')}
                srcSet={`${thumbnailUrl(video, 'mq')} 320w, ${thumbnailUrl(video, 'maxres')} 1280w`}
                sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 100vw"
                width={1280}
                height={720}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-2 right-2 bg-charcoal/80 px-1.5 py-0.5 text-xs tabular-nums text-ivory">
                {formatDuration(video.durationSeconds)}
              </span>
            </div>
            <h3 className="mt-4 text-balance font-serif text-xl leading-snug text-charcoal group-hover:text-forest">
              {video.title}
            </h3>
          </a>
        ))}
      </div>
    </section>
  );
}
