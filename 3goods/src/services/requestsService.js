/**
 * Requests are where 3goods' central business rule lives: an item can have
 * multiple pending requests, but only one accepted organisation per listing
 * (DECISIONS.md D-009). This file is the *only* place that rule is enforced —
 * screens never re-implement it.
 *
 * Two separate statuses (D-075), each stored in exactly one place and read
 * directly by every screen:
 *   - request.status: pending -> accepted | declined. Only says whether this
 *     organisation was chosen.
 *   - item.status (itemsService.updateItemStatus): available -> reserved ->
 *     collected. Tracks the physical handover.
 *
 * Accepting a request reserves the item, marks that request accepted and
 * *actually declines* every other pending request on the item in the
 * database, so there is nothing left to derive at display time. Each change
 * of status is one database transaction: `accept_request` (D-076),
 * `undo_acceptance` and `mark_item_collected` (D-077); the notification that
 * follows is a separate JS call, so a lost notification never undoes a change.
 * The one way a request becomes declined is through another request's
 * acceptance, which is what lets `undoAcceptance` put them back exactly.
 *
 * Making a request does not start a conversation: a chat only exists once
 * someone sends its first message (chatService.startConversation, D-075).
 *
 * The live `requests` table has no `updated_at` column (see DECISIONS.md
 * D-042) — this file just stops writing/reading it rather than restoring it,
 * since nothing displays it.
 */

import { getAll, getById, insert, rpc } from "../lib/db.js";
import { getItemById } from "./itemsService.js";
import { pushUpdate } from "./updatesService.js";
import { AppError } from "../lib/errors.js";
import { ITEM_STATUS, REQUEST_STATUS } from "../lib/constants.js";

function fromRow(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    organisationId: row.org_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * @param {Object} [filters]
 * @param {string} [filters.itemId]
 * @param {string} [filters.organisationId]
 * @param {string} [filters.status]
 * @returns {Promise<import('../data/types.js').DonationRequest[]>}
 */
export async function getRequests(filters = {}) {
  let rows = (await getAll("requests")).map(fromRow);
  if (filters.itemId) rows = rows.filter((r) => r.itemId === filters.itemId);
  if (filters.organisationId) rows = rows.filter((r) => r.organisationId === filters.organisationId);
  if (filters.status) rows = rows.filter((r) => r.status === filters.status);
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getRequestById(id) {
  const row = await getById("requests", id);
  return row ? fromRow(row) : null;
}

/**
 * Requests are always allowed while an item is "available" — even if other
 * requests are already pending on it (D-009). Rejected if the item is
 * missing, reserved, collected, or withdrawn.
 */
export async function createRequest({ itemId, organisationId }) {
  const item = await getItemById(itemId);
  if (!item) throw new AppError("itemNotFound");
  if (item.status !== ITEM_STATUS.available) throw new AppError("itemNotAvailable");

  const row = await insert(
    "requests",
    {
      item_id: itemId,
      org_id: organisationId,
      status: REQUEST_STATUS.pending,
      created_at: new Date().toISOString(),
    },
    "request",
  );
  const request = fromRow(row);

  // The donor hears about the request; the requesting organisation gets its
  // own confirmation entry in its Updates feed (organisations are their own
  // notification target — see updatesService.js).
  await Promise.all([
    pushUpdate({
      userId: item.donorId,
      type: "item_requested",
      params: { itemTitle: item.title },
      linkItemId: item.id,
      linkRequestId: request.id,
    }),
    pushUpdate({
      userId: organisationId,
      type: "request_submitted",
      params: { itemTitle: item.title },
      linkItemId: item.id,
      linkRequestId: request.id,
    }),
  ]);

  return request;
}

/**
 * Rule violations the status functions raise. The database error message is the code; it becomes an `AppError` so the screen shows
 * a translated message (anything else is a real failure and is rethrown as is).
 */
const RULE_ERROR_CODES = [
  "requestNotFound",
  "itemForRequestNotFound",
  "itemNotFound",
  "requestNotPending",
  "itemAlreadyReserved",
  "itemStatusChangeInvalid",
];

/** Calls one of the status functions (supabase/schema.sql) and returns its `{changed, request, item}` result. */
async function callStatusFunction(name, args) {
  try {
    return await rpc(name, args);
  } catch (err) {
    throw RULE_ERROR_CODES.includes(err?.message) ? new AppError(err.message) : err;
  }
}

/**
 * The one place "only one accepted organisation per listing" is enforced
 * (D-009): reserves the item for this request, marks the request accepted,
 * and declines every other pending request on the item, all in one database
 * transaction (`accept_request`, D-076), so a failure part-way cannot leave
 * the item and its requests disagreeing. The organisation is notified
 * afterwards, separately.
 *
 * Throws rather than silently no-op-ing if the item is not available (another
 * organisation was accepted from a second tab, the listing was withdrawn) or
 * the request was already declined, so the UI shows that error instead of
 * pretending it worked. Accepting a request that is already accepted is a
 * no-op, so a stale tap can't notify the organisation twice.
 */
export async function acceptRequest(requestId) {
  const result = await callStatusFunction("accept_request", { p_request_id: requestId });
  const request = fromRow(result.request);
  if (!result.changed) return request;

  await pushUpdate({
    userId: request.organisationId,
    type: "request_accepted",
    params: { itemTitle: result.item.title },
    linkItemId: request.itemId,
    linkRequestId: requestId,
  });
  return request;
}

/**
 * Undoes an acceptance while the goods have not been collected yet, in one
 * database transaction (`undo_acceptance`, D-077): the item is available again,
 * this request is pending again, and the requests that accepting it declined go
 * back to pending (declined only ever comes from an acceptance, so on this item
 * that is all of them). A collected item cannot be undone (`itemStatusChangeInvalid`);
 * undoing a request that is not accepted changes nothing.
 */
export async function undoAcceptance(requestId) {
  const result = await callStatusFunction("undo_acceptance", { p_request_id: requestId });
  return fromRow(result.request);
}

/**
 * The goods have been handed over: the item goes reserved -> collected in one
 * database transaction (`mark_item_collected`, D-077), which also adds the item to
 * the accepted organisation's past-received list (shown on its profile). The
 * accepted request stays "accepted" — it already recorded which organisation
 * was chosen. Then the donor is notified. Marking an already-collected item
 * changes nothing (no second notification); an item that is not reserved is refused.
 */
export async function markItemCollected(itemId) {
  const result = await callStatusFunction("mark_item_collected", { p_item_id: itemId });
  if (!result.changed) return;

  await pushUpdate({
    userId: result.item.donor_id,
    type: "donation_completed",
    params: { itemTitle: result.item.title },
    linkItemId: itemId,
    linkRequestId: result.request?.id ?? undefined,
  });
}
