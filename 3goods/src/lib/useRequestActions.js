import { useState } from "react";
import { useSession } from "../context/SessionContext.jsx";
import { acceptRequest, undoAcceptance } from "../services/requestsService.js";

/**
 * Accept / undo actions on a request, shared by Me.jsx and ItemDetail.jsx.
 *
 * `busy` ({requestId, action}) is set synchronously on tap — before any
 * network call — and only cleared once the action *and* the screen's
 * refetch (`refresh`, which runs after a refused action too) have both finished, so the button can't flash back to
 * "Accept" with stale data, and can't be tapped twice (a double tap would
 * notify the organisation twice).
 *
 * @param {() => Promise<void>} refresh from useAsync
 */
export function useRequestActions(refresh) {
  const { requireLogin } = useSession();
  const [busy, setBusy] = useState(null);
  // Raw error object, translated at render time — see D-017.
  const [error, setError] = useState(null);

  const run = (requestId, action, work) => {
    if (busy) return;
    requireLogin(async () => {
      setBusy({ requestId, action });
      setError(null);
      try {
        await work();
      } catch (err) {
        setError(err);
      } finally {
        // Refetch whether the action worked or was refused (e.g. another tab already decided the request), so the rows on
        // screen always show the real state next to any error, instead of staying stale until a manual reload.
        await refresh();
        setBusy(null);
      }
    });
  };

  return {
    busy,
    error,
    accept: (requestId) => run(requestId, "accept", () => acceptRequest(requestId)),
    revert: (requestId) => run(requestId, "revert", () => undoAcceptance(requestId)),
  };
}
