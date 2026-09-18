/**
 * Item listings. Components call these, never src/lib/db.js or src/data
 * directly. Backed by Supabase — see src/lib/db.js.
 */

import { getAll, getById, insert, update } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

/**
 * @param {Object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.areaId]
 * @param {string} [filters.deliveryOption]
 * @param {string} [filters.status]              defaults to only "available" if omitted
 * @param {string} [filters.donorId]              only this donor's items
 * @param {string[]} [filters.needTags]            item must include at least one of these tags
 * @returns {Promise<import('../data/types.js').Item[]>}
 */
export async function getItems(filters = {}) {
  let rows = await getAll("items");

  if (filters.donorId) {
    rows = rows.filter((item) => item.donorId === filters.donorId);
  } else if (filters.status) {
    rows = rows.filter((item) => item.status === filters.status);
  } else {
    // Default browsing view: only show what's still available unless the
    // caller explicitly asked for a specific status or "my own items".
    rows = rows.filter((item) => item.status === "available");
  }

  if (filters.category) {
    rows = rows.filter((item) => item.category === filters.category);
  }
  if (filters.areaId) {
    rows = rows.filter((item) => item.areaId === filters.areaId);
  }
  if (filters.deliveryOption) {
    rows = rows.filter((item) => item.deliveryOption === filters.deliveryOption);
  }
  if (filters.needTags?.length) {
    rows = rows.filter((item) => item.needTags.some((tag) => filters.needTags.includes(tag)));
  }

  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** @returns {Promise<import('../data/types.js').Item|null>} */
export async function getItemById(id) {
  return getById("items", id);
}

/**
 * @param {Object} payload
 * @returns {Promise<import('../data/types.js').Item>}
 */
export async function createDonation(payload) {
  if (!payload.title?.trim()) throw new AppError("itemTitleRequired");
  if (!payload.category) throw new AppError("categoryRequired");
  if (!payload.areaId) throw new AppError("areaRequired");
  if (!payload.deliveryOption) throw new AppError("deliveryOptionRequired");

  return insert(
    "items",
    {
      donorId: payload.donorId,
      donorName: payload.donorName,
      title: payload.title.trim(),
      category: payload.category,
      needTags: payload.needTags ?? [],
      condition: payload.condition ?? "",
      areaId: payload.areaId,
      description: payload.description ?? "",
      deliveryOption: payload.deliveryOption,
      collectionWindows: payload.collectionWindows ?? [],
      notes: payload.notes ?? "",
      photoPaths: payload.photoPaths ?? [],
      status: "available",
      createdAt: new Date().toISOString(),
    },
    "item",
  );
}

/** Donor withdraws their own listing. */
export async function markItemUnavailable(itemId) {
  return update("items", itemId, { status: "unavailable" });
}

/** Restore item status back to available (Undo availability). */
export async function reopenItemAvailability(itemId) {
  return update("items", itemId, { status: "available", acceptedRequestId: null });
}

/** Internal — used by requestsService when a request is accepted. */
export async function _markItemReserved(itemId, requestId) {
  return update("items", itemId, { status: "reserved", acceptedRequestId: requestId });
}
