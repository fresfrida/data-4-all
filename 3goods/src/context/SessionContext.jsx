import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/localStorage.js";

/**
 * There are exactly three identity states: logged out (guest), logged in as
 * Donor, logged in as Organisation. `role` is derived from `identity.role`,
 * never stored independently — see DECISIONS.md D-045 (supersedes D-004,
 * which had `role` as separate freely-switchable state). This is the only
 * context that persists to localStorage besides LocaleContext; both go
 * through src/lib/localStorage.js, never touching window.localStorage
 * directly here either.
 */

const STORAGE_KEY = "3goods.session";

const SessionContext = createContext(null);

function readInitial() {
  const raw = safeGetItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.isLoggedIn && (parsed.identity?.role === "donor" || parsed.identity?.role === "organisation")) {
        return { isLoggedIn: true, identity: parsed.identity };
      }
    } catch {
      // fall through to default
    }
  }
  return { isLoggedIn: false, identity: null };
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(readInitial);
  const [loginPrompt, setLoginPrompt] = useState({ open: false });
  const role = session.identity?.role ?? null;

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  /** @param {import('../data/types.js').User} identity a seeded donor/organisation account, from usersService.getLoginIdentities() */
  const loginAs = (identity) => {
    setSession({ isLoggedIn: true, identity });
  };

  const logout = () => {
    // Returns everyone to the same neutral guest state — no role carries
    // over post-logout (D-045).
    setSession({ isLoggedIn: false, identity: null });
  };

  /**
   * The single gate for "posting, requesting, and editing needs should
   * prompt for demo login." Runs `action(identity)` immediately if already
   * logged in; otherwise opens the shared prompt and remembers `action` to
   * run once the user picks a demo identity, so the click isn't lost.
   *
   * `action` receives the resolved identity as its argument rather than
   * relying on the caller's own `identity` from `useSession()` — when the
   * prompt path runs, `loginAs()`'s `setSession` hasn't re-rendered yet, so
   * a caller's closed-over `identity` would still read `null` and crash
   * (found live-testing DonationForm's submit-while-logged-out path).
   */
  const requireLogin = (action) => {
    if (session.isLoggedIn) {
      action(session.identity);
      return;
    }
    setLoginPrompt({ open: true, pendingAction: action });
  };

  const resolveLoginPrompt = (identity) => {
    loginAs(identity);
    loginPrompt.pendingAction?.(identity);
    setLoginPrompt({ open: false });
  };

  const dismissLoginPrompt = () => setLoginPrompt({ open: false });

  const value = useMemo(
    () => ({
      ...session,
      role,
      loginAs,
      logout,
      requireLogin,
      loginPromptOpen: loginPrompt.open,
      resolveLoginPrompt,
      dismissLoginPrompt,
    }),
    [session, role, loginPrompt],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

/** Exposed for a future "clear demo data" debug affordance; not wired to any UI yet. */
export function __clearSessionStorage() {
  safeRemoveItem(STORAGE_KEY);
}
