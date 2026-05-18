/**
 * React hook for stale-while-revalidate data fetching.
 * Returns cached data immediately, then refreshes in background.
 */

import { useState, useEffect, useCallback } from "react";
import { getCached, setCached, isStale, subscribe } from "./data-cache";

interface UseDataOptions {
  skip?: boolean;
  refreshInterval?: number; // ms
}

export function useData<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options: UseDataOptions = {}
) {
  const { skip = false, refreshInterval } = options;
  const [data, setData] = useState<T | null>(() => getCached<T>(endpoint));
  const [loading, setLoading] = useState(!getCached<T>(endpoint));
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (skip) return;
    if (!silent) setLoading(true);
    try {
      const result = await fetcher();
      setCached(endpoint, result);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [endpoint, fetcher, skip]);

  useEffect(() => {
    if (skip) return;

    const cached = getCached<T>(endpoint);
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    // Refetch if stale or no cache
    if (!cached || isStale(endpoint)) {
      fetchData(!!cached);
    }

    // Subscribe to cache updates
    const unsubscribe = subscribe(endpoint, () => {
      const fresh = getCached<T>(endpoint);
      if (fresh) setData(fresh);
    });

    // Optional polling
    let intervalId: ReturnType<typeof setInterval>;
    if (refreshInterval) {
      intervalId = setInterval(() => fetchData(true), refreshInterval);
    }

    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [endpoint, fetchData, skip, refreshInterval]);

  return { data, loading, error, refetch: () => fetchData(false) };
}
