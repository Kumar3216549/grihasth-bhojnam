// Tiny in-memory limiter (per server instance). Good enough to stop form spam on a small site.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length <= max;
}
