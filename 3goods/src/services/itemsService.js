/**
 * Item listings. Components call these, never src/lib/db.js or src/data
 * directly. Backed by Supabase — see src/lib/db.js.
 *
 * The live `items` table's columns don't match this file's app-facing shape
 * 1:1 (uuid `category_id` instead of a plain-text `category`, a single
 * `image_base64` instead of a `photoPaths` array, no cached `donorName`,
 * etc. — see DECISIONS.md D-042). `fromRow`/`toRow` are the one place that
 * translation happens, so every other service/screen keeps using the same
 * camelCase `Item` shape (data/types.js) it always did.
 */

import { getAll, getById, insert, update } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { ITEM_STATUS } from "../lib/constants.js";
import { isValidQuantity } from "../lib/quantity.js";
import { getCategoryDbId, getCategorySlugFromDbId } from "./referenceDataService.js";

/** Multiple collection windows are joined into the single `collection_windows` text column. */
const WINDOW_SEP = " | ";

async function fromRow(row, usersById) {
  const donor = usersById?.get(row.donor_id);
  return {
    id: row.id,
    donorId: row.donor_id,
    donorName: donor?.name ?? "",
    title: row.title,
    titleVi: row.title_vi ?? undefined,
    category: await getCategorySlugFromDbId(row.category_id),
    secondaryCategory: (await getCategorySlugFromDbId(row.secondary_category_id)) ?? undefined,
    condition: row.condition ?? "",
    areaId: row.area ?? "",
    description: row.description ?? "",
    deliveryOption: row.delivery_option,
    collectionWindows: row.collection_windows ? row.collection_windows.split(WINDOW_SEP).filter(Boolean) : [],
    notes: row.notes ?? "",
    quantity: row.quantity ?? null,
    unit: row.unit ?? null,
    photoPaths: row.image_base64 ? [row.image_base64] : [],
    status: row.status,
    acceptedRequestId: row.accepted_request_id ?? undefined,
    createdAt: row.created_at,
  };
}

async function toInsertRow(payload) {
  const quantity = payload.quantity ?? null;
  return {
    // Only written when given: `items.quantity`/`unit` come from an additive SQL
    // migration (D-052), and a listing with no quantity must keep working
    // even against a database that hasn't had it applied yet.
    ...(quantity !== null && { quantity, unit: payload.unit || null }),
    title: payload.title.trim(),
    title_vi: payload.titleVi || null,
    category_id: await getCategoryDbId(payload.category),
    secondary_category_id: payload.secondaryCategory ? await getCategoryDbId(payload.secondaryCategory) : null,
    condition: payload.condition ?? "",
    area: payload.areaId,
    description: payload.description ?? "",
    delivery_option: payload.deliveryOption,
    collection_windows: (payload.collectionWindows ?? []).join(WINDOW_SEP),
    notes: payload.notes ?? "",
    image_base64: payload.photoPaths?.[0] ?? null,
    status: ITEM_STATUS.available,
    donor_id: payload.donorId,
    created_at: new Date().toISOString(),
  };
}

/** Browse order: available first, then reserved, then collected, then withdrawn; newest first inside each group. */
const STATUS_ORDER = {
  [ITEM_STATUS.available]: 0,
  [ITEM_STATUS.reserved]: 1,
  [ITEM_STATUS.collected]: 2,
  [ITEM_STATUS.unavailable]: 3,
};

async function loadUsersById() {
  const users = await getAll("users");
  return new Map(users.map((u) => [u.id, u]));
}

/**
 * @param {Object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.areaId]
 * @param {string} [filters.deliveryOption]
 * @param {string} [filters.status]              only this stored status; omitted = every status (D-067)
 * @param {string} [filters.donorId]              only this donor's items
 * @returns {Promise<import('../data/types.js').Item[]>}
 */
export async function getItems(filters = {}) {
  const [rawRows, usersById] = await Promise.all([getAll("items"), loadUsersById()]);
  let rows = await Promise.all(rawRows.map((row) => fromRow(row, usersById)));

  if (filters.donorId) {
    rows = rows.filter((item) => item.donorId === filters.donorId);
  } else if (filters.status) {
    rows = rows.filter((item) => item.status === filters.status);
  }
  // No status filter: items stay listed once reserved or collected (D-067), they just sort below the available ones.

  if (filters.category) {
    rows = rows.filter((item) => item.category === filters.category || item.secondaryCategory === filters.category);
  }
  if (filters.areaId) {
    rows = rows.filter((item) => item.areaId === filters.areaId);
  }
  if (filters.deliveryOption) {
    rows = rows.filter((item) => item.deliveryOption === filters.deliveryOption);
  }

  // A donor's own list ("Me") keeps plain newest-first; the browse list sorts by status first.
  const rank = (item) => (filters.donorId ? 0 : STATUS_ORDER[item.status] ?? 99);
  return rows.sort((a, b) => rank(a) - rank(b) || (a.createdAt < b.createdAt ? 1 : -1));
}

/** @returns {Promise<import('../data/types.js').Item|null>} */
export async function getItemById(id) {
  const row = await getById("items", id);
  if (!row) return null;
  return fromRow(row, await loadUsersById());
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
  if (!isValidQuantity(payload.quantity ?? null)) throw new AppError("quantityInvalid");

  const row = await insert("items", await toInsertRow(payload), "item");
  const usersById = await loadUsersById();
  return fromRow(row, usersById);
}

/**
 * Where an item may go from each status. This table is the whole state machine (D-075):
 * available -> reserved (a request is accepted) -> collected (goods handed over);
 * reserved -> available (the acceptance is undone); available <-> unavailable (the donor withdraws / relists).
 * `collected` is final.
 */
const TRANSITIONS = {
  [ITEM_STATUS.available]: [ITEM_STATUS.reserved, ITEM_STATUS.unavailable],
  [ITEM_STATUS.reserved]: [ITEM_STATUS.collected, ITEM_STATUS.available],
  [ITEM_STATUS.unavailable]: [ITEM_STATUS.available],
  [ITEM_STATUS.collected]: [],
};

/**
 * The only function that writes `items.status`. Every status change (accepting a request, undoing it, marking the goods
 * collected, withdrawing or relisting) goes through here, so an invalid jump throws instead of leaving the item in a state no
 * screen expects. `items.accepted_request_id` follows the status: set when reserving, kept once collected, cleared otherwise.
 *
 * @param {string} itemId
 * @param {"available"|"reserved"|"collected"|"unavailable"} nextStatus
 * @param {{acceptedRequestId?: string}} [options]  required when reserving
 */
export async function updateItemStatus(itemId, nextStatus, { acceptedRequestId } = {}) {
  const row = await getById("items", itemId);
  if (!row) throw new AppError("itemNotFound");
  if (!TRANSITIONS[row.status]?.includes(nextStatus)) throw new AppError("itemStatusChangeInvalid", { from: row.status, to: nextStatus });

  const patch = { status: nextStatus };
  if (nextStatus === ITEM_STATUS.reserved) {
    if (!acceptedRequestId) throw new AppError("requestNotFound");
    patch.accepted_request_id = acceptedRequestId;
  } else if (nextStatus !== ITEM_STATUS.collected) {
    patch.accepted_request_id = null;
  }
  return fromRow(await update("items", itemId, patch), await loadUsersById());
}

/** Donor withdraws their own listing (only while it is still available). */
export function markItemUnavailable(itemId) {
  return updateItemStatus(itemId, ITEM_STATUS.unavailable);
}

/** Donor relists a withdrawn listing. Not for releasing a reservation: that is requestsService.undoAcceptance. */
export async function reopenItemAvailability(itemId) {
  const item = await getItemById(itemId);
  if (item?.status !== ITEM_STATUS.unavailable) throw new AppError("itemStatusChangeInvalid", { from: item?.status, to: ITEM_STATUS.available });
  return updateItemStatus(itemId, ITEM_STATUS.available);
}
