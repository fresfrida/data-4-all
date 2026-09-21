/**
 * Organisation directory. Organisation records themselves are seed-only in
 * this prototype (no "edit organisation profile" flow yet) — needs are
 * edited via needsService, not here.
 *
 * The live `organisations` table's `name`/`description` are plain text, not
 * this app's bilingual `{en, vi}` shape, and `city` replaces the old
 * `areaId` — `fromRow` bridges both (see DECISIONS.md D-042).
 */

import { getAll, getById } from "../lib/db.js";

function fromRow(row) {
  return {
    id: row.id,
    name: { en: row.name, vi: row.name_vi || row.name },
    mission: { en: row.description ?? "", vi: row.description_vi || row.description || "" },
    areaId: row.city ?? "",
    // Optional exact position (D-073); the columns may not exist yet on a database that hasn't had the migration.
    location: row.lat != null && row.lng != null ? { lat: Number(row.lat), lng: Number(row.lng) } : null,
    verified: row.verified ?? false,
    isDemo: row.is_demo ?? false,
    pastReceivedItemIds: row.past_received_item_ids ?? [],
  };
}

/**
 * @param {Object} [filters]
 * @param {string} [filters.areaId]
 * @returns {Promise<import('../data/types.js').Organisation[]>}
 */
export async function getOrganisations(filters = {}) {
  const rows = (await getAll("organisations")).map(fromRow);
  if (filters.areaId) {
    return rows.filter((org) => org.areaId === filters.areaId);
  }
  return rows;
}

/** @returns {Promise<import('../data/types.js').Organisation|null>} */
export async function getOrganisationById(id) {
  const row = await getById("organisations", id);
  return row ? fromRow(row) : null;
}
