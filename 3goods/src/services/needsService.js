/**
 * Organisation "we currently need" lists.
 *
 * The live `needs` table's `priority` column is text (`'high'`/`'medium'`),
 * not the boolean this app models — `fromRow`/`toInsertRow` translate at
 * the boundary so the rest of the app keeps working with a boolean, same as
 * before Supabase's redesign (see DECISIONS.md D-042). A need is just
 * category + priority, and an organisation has at most one need per category (D-064).
 * The old `tag` column (D-059) and the `quantity`/`unit` columns (D-075: nothing ever
 * reduced a need's quantity when goods were collected, so it only drifted from the truth)
 * are left in the table but neither read nor written.
 */

import { getAll, insert, update as dbUpdate, remove as dbRemove } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { getCategoryDbId, getCategorySlugFromDbId } from "./referenceDataService.js";

async function fromRow(row) {
  return {
    id: row.id,
    organisationId: row.org_id,
    category: await getCategorySlugFromDbId(row.category_id),
    priority: row.priority === "high",
    createdAt: row.created_at,
  };
}

/**
 * @param {Object} [filters]
 * @param {string} [filters.organisationId]
 * @param {string} [filters.category]
 * @returns {Promise<import('../data/types.js').Need[]>}
 */
export async function getNeeds(filters = {}) {
  const rawRows = await getAll("needs");
  let rows = await Promise.all(rawRows.map(fromRow));
  if (filters.organisationId) {
    rows = rows.filter((need) => need.organisationId === filters.organisationId);
  }
  if (filters.category) {
    rows = rows.filter((need) => need.category === filters.category);
  }
  return rows.sort((a, b) => Number(b.priority) - Number(a.priority));
}

/**
 * @param {{organisationId: string, category: string, priority?: boolean}} payload
 * @returns {Promise<import('../data/types.js').Need>}
 */
export async function createNeed(payload) {
  if (!payload.organisationId) throw new AppError("organisationIdRequired");
  if (!payload.category) throw new AppError("categoryRequired");

  const categoryDbId = await getCategoryDbId(payload.category);
  const existing = (await getAll("needs")).some((row) => row.org_id === payload.organisationId && row.category_id === categoryDbId);
  if (existing) throw new AppError("needCategoryExists");

  const row = await insert(
    "needs",
    {
      org_id: payload.organisationId,
      category_id: categoryDbId,
      priority: payload.priority ? "high" : "medium",
      status: "open",
      created_at: new Date().toISOString(),
    },
    "need",
  );
  return fromRow(row);
}

export async function setNeedPriority(needId, priority) {
  const row = await dbUpdate("needs", needId, { priority: priority ? "high" : "medium" });
  return row ? fromRow(row) : null;
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
