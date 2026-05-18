/**
 * Lightweight client-side data cache with stale-while-revalidate pattern.
 * Prevents redundant PocketBase fetches on every page navigation.
 */

const cache = new Map<string, { data: unknown; timestamp: number }>();
const STALE_MS = 30000; // 30 seconds before refetch
const subscribers = new Map<string, Set<() => void>>();

function getKey(endpoint: string) {
  return endpoint;
}

export function getCached<T>(endpoint: string): T | null {
  const entry = cache.get(getKey(endpoint));
  if (!entry) return null;
  return entry.data as T;
}

export function isStale(endpoint: string): boolean {
  const entry = cache.get(getKey(endpoint));
  if (!entry) return true;
  return Date.now() - entry.timestamp > STALE_MS;
}

export function setCached(endpoint: string, data: unknown) {
  cache.set(getKey(endpoint), { data, timestamp: Date.now() });
  // Notify subscribers
  const subs = subscribers.get(endpoint);
  if (subs) {
    subs.forEach((cb) => cb());
  }
}

export function invalidateCache(endpoint?: string) {
  if (endpoint) {
    cache.delete(getKey(endpoint));
  } else {
    cache.clear();
  }
}

export function subscribe(endpoint: string, callback: () => void) {
  if (!subscribers.has(endpoint)) {
    subscribers.set(endpoint, new Set());
  }
  subscribers.get(endpoint)!.add(callback);
  return () => {
    subscribers.get(endpoint)?.delete(callback);
  };
}
