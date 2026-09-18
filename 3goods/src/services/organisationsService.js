/**
 * Organisation directory. Organisation records themselves are seed-only in
 * this prototype (no "edit organisation profile" flow yet) — needs are
 * edited via needsService, not here.
 */

import { getAll, getById } from "../lib/db.js";

/**
 * @param {Object} [filters]
 * @param {string} [filters.areaId]
 * @returns {Promise<import('../data/types.js').Organisation[]>}
 */
export async function getOrganisations(filters = {}) {
  let rows = await getAll("organisations");
  if (filters.areaId) {
    rows = rows.filter((org) => org.areaId === filters.areaId);
  }
  return rows;
}

/** @returns {Promise<import('../data/types.js').Organisation|null>} */
export async function getOrganisationById(id) {
  return getById("organisations", id);
}
