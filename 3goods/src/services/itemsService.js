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
    status: "available",
    donor_id: payload.donorId,
    created_at: new Date().toISOString(),
  };
}

/**
 * What an item should *show* (D-067). `status` is what is stored: available / reserved / unavailable.
 * A reserved item whose accepted request has reached "completed" was actually collected, so it is shown as
 * "donated"; a reserved one still being arranged stays "reserved". Withdrawn listings stay "unavailable".
 * @returns {"available"|"reserved"|"donated"|"unavailable"}
 */
function deriveItemDisplayStatus(item, acceptedRequest) {
  if (item.status === "available") return "available";
  if (item.status === "unavailable") return "unavailable";
  return acceptedRequest?.status === "completed" ? "donated" : "reserved";
}

/** Browse order: available first, then reserved, then donated, then withdrawn; newest first inside each group. */
const DISPLAY_ORDER = { available: 0, reserved: 1, donated: 2, unavailable: 3 };

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
  const [rawRows, usersById, requestRows] = await Promise.all([getAll("items"), loadUsersById(), getAll("requests")]);
  const requestsById = new Map(requestRows.map((r) => [r.id, r]));
  let rows = await Promise.all(
    rawRows.map(async (row) => {
      const item = await fromRow(row, usersById);
      return { ...item, displayStatus: deriveItemDisplayStatus(item, requestsById.get(row.accepted_request_id)) };
    }),
  );

  if (filters.donorId) {
    rows = rows.filter((item) => item.donorId === filters.donorId);
  } else if (filters.status) {
    rows = rows.filter((item) => item.status === filters.status);
  }
  // No status filter: items stay listed once accepted (D-067), they just sort below the available ones.

  if (filters.category) {
    rows = rows.filter((item) => item.category === filters.category || item.secondaryCategory === filters.category);
  }
  if (filters.areaId) {
    rows = rows.filter((item) => item.areaId === filters.areaId);
  }
  if (filters.deliveryOption) {
    rows = rows.filter((item) => item.deliveryOption === filters.deliveryOption);
  }

  // A donor's own list ("Me") keeps plain newest-first; the browse list sorts by display status first.
  const rank = (item) => (filters.donorId ? 0 : DISPLAY_ORDER[item.displayStatus]);
  return rows.sort((a, b) => rank(a) - rank(b) || (a.createdAt < b.createdAt ? 1 : -1));
}

/** @returns {Promise<import('../data/types.js').Item|null>} */
export async function getItemById(id) {
  const row = await getById("items", id);
  if (!row) return null;
  const usersById = await loadUsersById();
  const item = await fromRow(row, usersById);
  const acceptedRequest = row.accepted_request_id ? await getById("requests", row.accepted_request_id) : null;
  return { ...item, displayStatus: deriveItemDisplayStatus(item, acceptedRequest) };
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

/** Donor withdraws their own listing. */
export async function markItemUnavailable(itemId) {
  const row = await update("items", itemId, { status: "unavailable" });
  return row ? fromRow(row, await loadUsersById()) : null;
}

/** Restore item status back to available (Undo availability). */
export async function reopenItemAvailability(itemId) {
  const row = await update("items", itemId, { status: "available", accepted_request_id: null });
  return row ? fromRow(row, await loadUsersById()) : null;
}

/** Internal — used by requestsService when a request is accepted. */
export async function _markItemReserved(itemId, requestId) {
  return update("items", itemId, { status: "reserved", accepted_request_id: requestId });
}
