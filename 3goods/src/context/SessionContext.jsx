import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/localStorage.js";
import { DEMO_DONOR_USER, DEMO_ORG_USER } from "../data/users.js";

/**
 * `role` (which nav/UI renders) and `session` (demo-logged-in identity) are
 * deliberately separate concerns — see DECISIONS.md D-004. This is the only
 * context that persists to localStorage besides LocaleContext; both go
 * through src/lib/localStorage.js, never touching window.localStorage
 * directly here either.
 */

const STORAGE_KEY = "3goods.session";
const DEMO_IDENTITY_BY_ROLE = { donor: DEMO_DONOR_USER, organisation: DEMO_ORG_USER };

const SessionContext = createContext(null);

function readInitial() {
  const raw = safeGetItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.role === "donor" || parsed.role === "organisation") return parsed;
    } catch {
      // fall through to default
    }
  }
  return { role: "donor", isLoggedIn: false, identity: null };
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(readInitial);
  const [loginPrompt, setLoginPrompt] = useState({ open: false });

  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const loginAs = (role) => {
    setSession({ role, isLoggedIn: true, identity: DEMO_IDENTITY_BY_ROLE[role] });
  };

  const logout = () => {
    // "Returns to a public browsing state" — identity clears, but the nav
    // keeps showing whichever role's view was last active (D-004).
    setSession((prev) => ({ role: prev.role, isLoggedIn: false, identity: null }));
  };

  const setRole = (role) => {
    setSession((prev) => ({
      role,
      isLoggedIn: prev.isLoggedIn,
      identity: prev.isLoggedIn ? DEMO_IDENTITY_BY_ROLE[role] : null,
    }));
  };

  /**
   * The single gate for "posting, requesting, and editing needs should
   * prompt for demo login." Runs `action` immediately if already logged in;
   * otherwise opens the shared prompt and remembers `action` to run once
   * the user picks a demo identity, so the click isn't lost.
   */
  const requireLogin = (action) => {
    if (session.isLoggedIn) {
      action();
      return;
    }
    setLoginPrompt({ open: true, pendingAction: action });
  };

  const resolveLoginPrompt = (role) => {
    loginAs(role);
    loginPrompt.pendingAction?.();
    setLoginPrompt({ open: false });
  };

  const dismissLoginPrompt = () => setLoginPrompt({ open: false });

  const value = useMemo(
    () => ({
      ...session,
      loginAs,
      logout,
      setRole,
      requireLogin,
      loginPromptOpen: loginPrompt.open,
      resolveLoginPrompt,
      dismissLoginPrompt,
    }),
    [session, loginPrompt],
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
