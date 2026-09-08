import { webpSrcSet } from '@/lib/img';

type Props = {
  src: string;
  alt: string;
  /** Matches the `sizes` attribute — the rendered width at each breakpoint. */
  sizes: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Forwarded to the <img> (e.g. stopPropagation inside a lightbox). */
  onClick?: React.MouseEventHandler<HTMLImageElement>;
};

/**
 * <picture> with a WebP srcset + the original JPEG as fallback. `display:
 * contents` on the wrapper keeps the <img> participating directly in the
 * parent's layout, so existing `absolute inset-0` / `h-full w-full` styling
 * on `className` keeps working unchanged.
 */
export default function ResponsiveImage({
  src,
  alt,
  sizes,
  className,
  loading = 'lazy',
  fetchPriority,
  onClick,
}: Props) {
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet(src)} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onClick={onClick}
      />
    </picture>
  );
}
