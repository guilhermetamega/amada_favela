import { useEffect, useRef } from "react";

const DEFAULT_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export function useRefreshOnVisible(
  refresh: () => void | Promise<void>,
  intervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
  const refreshRef = useRef(refresh);
  const lastRefreshAtRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    lastRefreshAtRef.current = Date.now();

    async function refreshIfNeeded() {
      if (document.visibilityState !== "visible" || refreshingRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastRefreshAtRef.current < intervalMs) return;

      lastRefreshAtRef.current = now;
      refreshingRef.current = true;

      try {
        await refreshRef.current();
      } finally {
        refreshingRef.current = false;
      }
    }

    function handleFocus() {
      void refreshIfNeeded();
    }

    function handleVisibilityChange() {
      void refreshIfNeeded();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs]);
}
