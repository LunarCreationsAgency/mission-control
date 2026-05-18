/**
 * React hook for stale-while-revalidate data fetching.
 * Returns cached data immediately, then refreshes in background.
 */

import { useState, useEffect, useCallback } from "react";
import { getCached, setCached, isStale, subscribe } from "./data-cache";

interface UseDataOptions {
  skip?: boolean;
  refreshInterval?: number;
}

export function useData<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options: UseDataOptions = {}
) {
  const { skip = false, refreshInterval } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
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
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
    }

    if (cached === undefined || isStale(endpoint)) {
      fetchData(cached !== undefined);
    }

    const unsubscribe = subscribe(endpoint, () => {
      const fresh = getCached<T>(endpoint);
      if (fresh !== undefined) setData(fresh);
    });

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
