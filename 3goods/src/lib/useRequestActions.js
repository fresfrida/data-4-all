import { useState } from "react";
import { useSession } from "../context/SessionContext.jsx";
import { acceptRequest, revertRequestToPending } from "../services/requestsService.js";

/**
 * Accept / undo actions on a request, shared by Me.jsx and ItemDetail.jsx.
 *
 * `busy` ({requestId, action}) is set synchronously on tap — before any
 * network call — and only cleared once the action *and* the screen's
 * refetch (`refresh`) have both finished, so the button can't flash back to
 * "Accept" with stale data, and can't be tapped twice (a double tap would
 * post the "request accepted" chat message twice).
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
        await refresh();
      } catch (err) {
        setError(err);
      } finally {
        setBusy(null);
      }
    });
  };

  return {
    busy,
    error,
    accept: (requestId) => run(requestId, "accept", () => acceptRequest(requestId)),
    revert: (requestId) => run(requestId, "revert", () => revertRequestToPending(requestId)),
  };
}
