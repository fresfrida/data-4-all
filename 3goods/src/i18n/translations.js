/**
 * Central translation dictionary. The actual content lives in
 * `src/i18n/locales/{en,vi}.json` — those two files are the single place
 * wording changes happen; nothing outside this folder should need editing
 * when copy changes. Keys are dot-paths, e.g. "nav.map". English is the
 * default and the fallback for any missing Vietnamese key (see
 * useTranslate.js) — this file should never be the reason a screen shows a
 * blank string.
 *
 * This covers interface text, validation messages, notifications, system
 * chat messages, and accessibility labels — plus seeded demo content
 * strings that are chosen from here (statuses; categories/tags are in
 * data/categories.js which already carries en/vi directly on each record).
 * User-typed content (e.g. a donor's own item title, a chat message someone
 * types) is never routed through this file or auto-translated — see
 * DECISIONS.md D-014/D-016.
 */
import en from "./locales/en.json";
import vi from "./locales/vi.json";

export const translations = { en, vi };
export const SUPPORTED_LOCALES = Object.keys(translations);
