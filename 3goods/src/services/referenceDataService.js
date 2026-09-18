/**
 * Static reference data (areas, categories, need tags), plus the live
 * `categories` table id lookups other services need.
 *
 * Areas/need-tag metadata (labels, icons) still comes from the static
 * src/data/*.js lists — the live DB doesn't carry i18n label data for
 * these, only the category *names*. `items`/`needs` foreign-key to a
 * `category_id` uuid that Supabase generated when the categories table was
 * first seeded (so it can't be hardcoded here) — see DECISIONS.md D-042.
 * `getCategoryDbId`/`getCategorySlugFromDbId` are how the rest of the
 * service layer translates between the app's stable category slug (e.g.
 * "Rice", matching CATEGORIES ids) and that live uuid, case-insensitively
 * matching on `categories.name`.
 */

import { AREAS, getAreaById as _getAreaById } from "../data/areas.js";
import {
  CATEGORIES,
  NEED_TAGS_BY_CATEGORY,
  getCategoryById as _getCategoryById,
  getTagsForCategory as _getTagsForCategory,
} from "../data/categories.js";
import { getAll } from "../lib/db.js";

export async function getAreas() {
  return AREAS;
}

export async function getAreaById(id) {
  return _getAreaById(id);
}

export async function getCategories() {
  return CATEGORIES;
}

export async function getCategoryById(id) {
  return _getCategoryById(id);
}

export async function getTagsForCategory(categoryId) {
  return _getTagsForCategory(categoryId);
}

export async function getAllNeedTagsByCategory() {
  return NEED_TAGS_BY_CATEGORY;
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
