// image-loader.ts
// Minimal custom loader: if NEXT_PUBLIC_CDN_BASE_URL is set, it will rewrite
// internal API image URLs to the CDN base and append width/quality params.

export default function imageLoader({ src, width, quality }: { src: string; width?: number; quality?: number | string }) {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  try {
    const parsed = new URL(src, process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000");
    if (cdnBase) {
      const cdn = new URL(cdnBase);
      // Preserve original path and query
      cdn.pathname = parsed.pathname;
      cdn.search = parsed.search;
      if (width) cdn.searchParams.set("w", String(width));
      if (quality) cdn.searchParams.set("q", String(quality));
      return cdn.toString();
    }
  } catch {
    // Fallback to original src if parsing fails
  }
  return src;
}
