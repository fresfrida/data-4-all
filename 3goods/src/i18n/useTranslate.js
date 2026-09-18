import { useCallback } from "react";
import { useLocale } from "./LocaleContext.jsx";
import { translations } from "./translations.js";

const warnedKeys = new Set();

function lookup(dict, path) {
  return path.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dict);
}

/**
 * t(key, vars?) — dot-path lookup in the current locale, falling back to
 * English, falling back to the raw key. Never throws and never returns
 * undefined, so a missing translation shows as visible-but-ugly text
 * instead of a blank screen (safe failure behaviour). Missing keys are
 * warned once each, for observability during content authoring.
 */
export function useTranslate() {
  const { locale } = useLocale();

  return useCallback(
    (key, vars) => {
      let value = lookup(translations[locale], key);
      if (value === undefined && locale !== "en") {
        value = lookup(translations.en, key);
      }
      if (value === undefined) {
        if (!warnedKeys.has(key)) {
          console.warn(`[3goods] Missing translation for "${key}"`);
          warnedKeys.add(key);
        }
        return key;
      }
      if (vars) {
        return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{${k}}`, String(v)), value);
      }
      return value;
    },
    [locale],
  );
}
