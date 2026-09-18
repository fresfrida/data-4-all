#!/usr/bin/env node
/**
 * Static check for requirement #6 ("a check for missing translation keys"):
 * fails the build/CI step if `en.json` and `vi.json` don't have exactly the
 * same set of dot-path keys. This catches a missing translation at author
 * time, on top of (not instead of) the runtime fallback + console.warn in
 * `useTranslate.js`, which only fires for a key a real screen actually asks
 * for during manual testing.
 *
 * Usage: node scripts/check-i18n-keys.mjs   (exit 0 = in sync, 1 = drifted)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "src", "i18n", "locales");

function flatten(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path_ = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flatten(value, path_));
    } else {
      keys.push(path_);
    }
  }
  return keys;
}

function loadKeys(locale) {
  const raw = readFileSync(path.join(localesDir, `${locale}.json`), "utf-8");
  return new Set(flatten(JSON.parse(raw)));
}

const en = loadKeys("en");
const vi = loadKeys("vi");

const missingInVi = [...en].filter((k) => !vi.has(k)).sort();
const missingInEn = [...vi].filter((k) => !en.has(k)).sort();

if (missingInVi.length === 0 && missingInEn.length === 0) {
  console.log(`i18n keys in sync: ${en.size} keys in both en.json and vi.json.`);
  process.exit(0);
}

if (missingInVi.length > 0) {
  console.error(`Missing in vi.json (${missingInVi.length}):`);
  for (const k of missingInVi) console.error(`  - ${k}`);
}
if (missingInEn.length > 0) {
  console.error(`Missing in en.json (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`  - ${k}`);
}
process.exit(1);
