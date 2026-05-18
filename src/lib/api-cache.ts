/**
 * Simple TTL cache for Next.js API routes.
 * Reduces PocketBase calls on repeated requests.
 */

interface CacheEntry <T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 5000
): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data);
  }

  return fetcher().then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

export function invalidateApiCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
