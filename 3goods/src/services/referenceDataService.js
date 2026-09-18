/**
 * Static reference data (areas, categories, need tags). No persistence —
 * these are fixed enums for this prototype, not user-editable records — but
 * still routed through a service so the "components never import src/data
 * directly" rule has no exceptions (simpler to explain and to grep-verify).
 */

import { AREAS, getAreaById as _getAreaById } from "../data/areas.js";
import {
  CATEGORIES,
  NEED_TAGS_BY_CATEGORY,
  getCategoryById as _getCategoryById,
  getTagsForCategory as _getTagsForCategory,
} from "../data/categories.js";

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
