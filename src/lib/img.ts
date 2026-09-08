// Helpers for the responsive WebP variants produced by scripts/gen-images.mjs.
// For a source like "/images/seiko-5/seiko-5-1.jpg" the script writes
// "-480.webp", "-960.webp" and "-1440.webp" siblings; the original JPEG stays
// as the universal <img> fallback.

const WIDTHS = [480, 960, 1440] as const;

function stripExt(src: string): string {
  return src.replace(/\.(jpe?g|png)$/i, '');
}

/** `srcset` string for the WebP <source> of a <picture>. */
export function webpSrcSet(src: string): string {
  const base = stripExt(src);
  return WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
}

/** Smallest WebP variant — good enough for thumbnails and tiny previews. */
export function webpThumb(src: string): string {
  return `${stripExt(src)}-480.webp`;
}
