/**
 * Reference data: areas (the live `provinces` table, all 63 provinces, DECISIONS.md D-062), categories (static list),
 * plus the live `categories` table id lookups other services need.
 *
 * Category metadata (labels, icons) still comes from the static
 * src/data/categories.js list — the live DB doesn't carry i18n label data for
 * categories, only the category *names*. `items`/`needs` foreign-key to a
 * `category_id` uuid that Supabase generated when the categories table was
 * first seeded (so it can't be hardcoded here) — see DECISIONS.md D-042.
 * `getCategoryDbId`/`getCategorySlugFromDbId` are how the rest of the
 * service layer translates between the app's stable category slug (e.g.
 * "Rice", matching CATEGORIES ids) and that live uuid, case-insensitively
 * matching on `categories.name`.
 */

import { CATEGORIES, getCategoryById as _getCategoryById } from "../data/categories.js";
import { getAll } from "../lib/db.js";

/**
 * An "area" is a province row from the live `provinces` table. `id` is the province `slug` (what
 * organisations.city / items.area store); `mapKey` is the province name as the map data spells it.
 * @typedef {{id: string, en: string, vi: string, mapKey: string, region: string|null}} Area
 */
function areaFromRow(row) {
  return { id: row.slug, en: row.name, vi: row.name_vi, mapKey: row.map_key, region: row.region ?? null };
}

/** Cached for the lifetime of the page — the province list is fixed reference data (a failed load is retried). */
let areasPromise = null;

function loadAreas() {
  if (!areasPromise) {
    areasPromise = getAll("provinces").then((rows) => rows.map(areaFromRow).sort((a, b) => a.en.localeCompare(b.en)));
    areasPromise.catch(() => {
      areasPromise = null;
    });
  }
  return areasPromise;
}

/** @returns {Promise<Area[]>} all 63 provinces, sorted by English name. */
export async function getAreas() {
  return loadAreas();
}

/** @returns {Promise<Area|null>} */
export async function getAreaById(id) {
  if (!id) return null;
  return (await loadAreas()).find((area) => area.id === id) ?? null;
}

/** @returns {Promise<Area|null>} the area for a map-data province name (e.g. "HàTĩnh"), or null. */
export async function getAreaByMapKey(mapKey) {
  if (!mapKey) return null;
  return (await loadAreas()).find((area) => area.mapKey === mapKey) ?? null;
}

export async function getCategories() {
  return CATEGORIES;
}

export async function getCategoryById(id) {
  return _getCategoryById(id);
}

/** Cached for the lifetime of the page — the live categories table is fixed reference data. */
let liveCategoriesPromise = null;

function loadLiveCategories() {
  if (!liveCategoriesPromise) liveCategoriesPromise = getAll("categories");
  return liveCategoriesPromise;
}

/** @returns {Promise<string>} the live `categories.id` uuid for an app category slug (e.g. "Rice"). */
export async function getCategoryDbId(slug) {
  if (!slug) return null;
  const rows = await loadLiveCategories();
  const match = rows.find((row) => row.name?.toLowerCase() === slug.toLowerCase());
  if (!match) {
    throw new Error(
      `No live "categories" row named "${slug}" — has the categories table been seeded in Supabase?`,
    );
  }
  return match.id;
}

/** @returns {Promise<string|null>} the app category slug (e.g. "Rice") for a live `categories.id` uuid. */
export async function getCategorySlugFromDbId(dbId) {
  if (!dbId) return null;
  const rows = await loadLiveCategories();
  const match = rows.find((row) => row.id === dbId);
  if (!match) return null;
  const category = CATEGORIES.find((c) => c.id.toLowerCase() === match.name?.toLowerCase());
  return category?.id ?? match.name;
}
