import { useCallback, useEffect, useState } from "react";

/**
 * Standard loading/data/error pattern for calling async service functions
 * from a screen. Every screen that fetches data uses this instead of
 * hand-rolling its own useState/useEffect trio, so loading and error states
 * are never accidentally skipped (CLAUDE.md verification requirement).
 *
 * `deps` works like useEffect's dependency array — refetches when it
 * changes. `reload()` lets a screen refetch after a mutation.
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  const run = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    asyncFn()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[3goods] useAsync error:", error);
          setState({ status: "error", data: null, error });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, reload: run };
}
