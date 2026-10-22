// Custom next/image loader: Unsplash/Pexels resize on their own CDN, local files are served as-is.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const u = new URL(src);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(quality || 70));
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  }
  if (src.startsWith("https://images.pexels.com/")) {
    const u = new URL(src);
    u.searchParams.set("w", String(width));
    u.searchParams.set("auto", "compress");
    return u.toString();
  }
  return src;
}
