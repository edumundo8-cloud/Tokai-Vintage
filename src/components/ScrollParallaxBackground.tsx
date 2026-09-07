import { useEffect, useRef } from 'react';

/**
 * A fixed, full-viewport Mount Fuji scene that sits behind the hero,
 * collection, and story sections. On scroll it drifts gently for a
 * subtle parallax effect, and fades out once the user scrolls well
 * past the story section.
 *
 * Respects prefers-reduced-motion: the scroll listener is skipped
 * entirely and the artwork stays static.
 *
 * The artwork itself (public/images/bg/fuji-scene.jpg) is the
 * client-supplied Mount Fuji illustration -- lake, pines, mist, and
 * the rising sun -- upscaled and lightly sharpened for use as a
 * high-resolution background.
 */
export default function ScrollParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const scrollY = window.scrollY;
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(scrollY / docHeight, 1);

      img.style.transform = `translate3d(0, ${scrollY * -0.12}px, 0) scale(1.08)`;

      const fadeStart = 0.55;
      let opacity = 1;
      if (progress > fadeStart) {
        opacity = Math.max(1 - (progress - fadeStart) / (1 - fadeStart), 0.08);
      }
      container.style.opacity = String(opacity);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-700 ease-out"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 76%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 10%, black 76%, transparent 100%)',
      }}
    >
      <img
        ref={imgRef}
        src="/images/bg/fuji-scene.jpg"
        alt=""
        aria-hidden="true"
        className="h-full w-full scale-105 object-cover opacity-[0.55] md:opacity-[0.6]"
      />
    </div>
  );
}
