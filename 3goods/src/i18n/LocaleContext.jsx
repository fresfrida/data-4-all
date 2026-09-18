import { createContext, useContext, useMemo, useState } from "react";
import { SUPPORTED_LOCALES } from "./translations.js";

const LocaleContext = createContext(null);

const STORAGE_KEY = "3goods.locale";

/**
 * Build-time default via `VITE_DEFAULT_LANGUAGE` (e.g. set in `.env.local`
 * as `VITE_DEFAULT_LANGUAGE=vi`) — falls back to "en" if unset or not one
 * of the supported locales. This only decides the *first-ever* language a
 * visitor sees; once they pick a language it's remembered in localStorage
 * and always wins over this default on later visits (see readInitialLocale).
 */
const ENV_DEFAULT_LOCALE = SUPPORTED_LOCALES.includes(import.meta.env.VITE_DEFAULT_LANGUAGE)
  ? import.meta.env.VITE_DEFAULT_LANGUAGE
  : "en";

function readInitialLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    // localStorage unavailable — fall through to the build-time default.
  }
  return ENV_DEFAULT_LOCALE;
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = (next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    // Only ever touches this one context's own state — never remounts the
    // component tree, so any in-progress form input elsewhere is untouched
    // by a language switch (requirement: "preserve their current form
    // inputs").
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal — locale just won't persist across reloads this session.
    }
  };

  const value = useMemo(() => ({ locale, setLocale, supportedLocales: SUPPORTED_LOCALES }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
