/**
 * Organisation "we currently need" lists.
 */

import { getAll, insert, update as dbUpdate, remove as dbRemove } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

/**
 * @param {Object} [filters]
 * @param {string} [filters.organisationId]
 * @param {string} [filters.category]
 * @returns {Promise<import('../data/types.js').Need[]>}
 */
export async function getNeeds(filters = {}) {
  let rows = await getAll("needs");
  if (filters.organisationId) {
    rows = rows.filter((need) => need.organisationId === filters.organisationId);
  }
  if (filters.category) {
    rows = rows.filter((need) => need.category === filters.category);
  }
  return rows.sort((a, b) => Number(b.priority) - Number(a.priority));
}

/**
 * @param {{organisationId: string, category: string, tag: string, priority?: boolean}} payload
 * @returns {Promise<import('../data/types.js').Need>}
 */
export async function createNeed(payload) {
  if (!payload.organisationId) throw new AppError("organisationIdRequired");
  if (!payload.category) throw new AppError("categoryRequired");
  if (!payload.tag) throw new AppError("needTagRequired");

  return insert(
    "needs",
    {
      organisationId: payload.organisationId,
      category: payload.category,
      tag: payload.tag,
      priority: Boolean(payload.priority),
      createdAt: new Date().toISOString(),
    },
    "need",
  );
}

export async function setNeedPriority(needId, priority) {
  return dbUpdate("needs", needId, { priority: Boolean(priority) });
}

/**
 * There's no soft-delete concept for needs (unlike items, which use an
 * "unavailable" status) — removing a need tag is a hard delete via db.js's
 * shared `remove` primitive, so the in-memory cache stays correct for any
 * screen that reads needs afterward.
 */
export async function removeNeed(needId) {
  return dbRemove("needs", needId);
}
