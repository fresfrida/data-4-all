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
 * database, so there is nothing left to derive at display time. The one way a
 * request becomes declined is through another request's acceptance, which is
 * what lets `undoAcceptance` put them back exactly.
 *
 * Making a request does not start a conversation: a chat only exists once
 * someone sends its first message (chatService.startConversation, D-075).
 *
 * The live `requests` table has no `updated_at` column (see DECISIONS.md
 * D-042) — this file just stops writing/reading it rather than restoring it,
 * since nothing displays it.
 */

import { getAll, getById, insert, update as dbUpdate, updateMany } from "../lib/db.js";
import { getItemById, updateItemStatus } from "./itemsService.js";
import { getOrganisationById } from "./organisationsService.js";
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
 * The one place "only one accepted organisation per listing" is enforced
 * (D-009): reserves the item for this request, marks the request accepted,
 * and declines every other pending request on the item.
 *
 * Throws rather than silently no-op-ing if the item is not available (another
 * organisation was accepted from a second tab, the listing was withdrawn) or
 * the request was already declined, so the UI shows that error instead of
 * pretending it worked. Accepting a request that is already accepted is a
 * no-op, so a stale tap can't notify the organisation twice.
 */
export async function acceptRequest(requestId) {
  const request = await getRequestById(requestId);
  if (!request) throw new AppError("requestNotFound");
  if (request.status === REQUEST_STATUS.accepted) return request;

  const item = await getItemById(request.itemId);
  if (!item) throw new AppError("itemForRequestNotFound");
  if (request.status !== REQUEST_STATUS.pending) throw new AppError("requestNotPending");
  if (item.status !== ITEM_STATUS.available) throw new AppError("itemAlreadyReserved");

  await updateItemStatus(item.id, ITEM_STATUS.reserved, { acceptedRequestId: requestId });
  const [acceptedRow] = await Promise.all([
    dbUpdate("requests", requestId, { status: REQUEST_STATUS.accepted }),
    updateMany("requests", { item_id: item.id, status: REQUEST_STATUS.pending }, { status: REQUEST_STATUS.declined }, requestId),
  ]);

  await pushUpdate({
    userId: request.organisationId,
    type: "request_accepted",
    params: { itemTitle: item.title },
    linkItemId: item.id,
    linkRequestId: requestId,
  });

  return fromRow(acceptedRow);
}

/**
 * Undoes an acceptance while the goods have not been collected yet: the item
 * is available again, this request is pending again, and the requests that
 * accepting it declined go back to pending (declined only ever comes from an
 * acceptance, so on this item that is all of them). A collected item cannot be
 * undone.
 */
export async function undoAcceptance(requestId) {
  const request = await getRequestById(requestId);
  if (!request) throw new AppError("requestNotFound");
  if (request.status !== REQUEST_STATUS.accepted) return request;

  await updateItemStatus(request.itemId, ITEM_STATUS.available);
  const [row] = await Promise.all([
    dbUpdate("requests", requestId, { status: REQUEST_STATUS.pending }),
    updateMany("requests", { item_id: request.itemId, status: REQUEST_STATUS.declined }, { status: REQUEST_STATUS.pending }),
  ]);
  return fromRow(row);
}

/**
 * The goods have been handed over: the item goes reserved -> collected. The
 * accepted request stays "accepted" — it already recorded which organisation
 * was chosen. Also records the item on that organisation's past-received list
 * (shown on its profile) and tells the donor.
 */
export async function markItemCollected(itemId) {
  const item = await getItemById(itemId);
  if (!item) throw new AppError("itemNotFound");
  const acceptedRequest = item.acceptedRequestId ? await getRequestById(item.acceptedRequestId) : null;

  const updated = await updateItemStatus(itemId, ITEM_STATUS.collected);

  const organisation = acceptedRequest ? await getOrganisationById(acceptedRequest.organisationId) : null;
  if (organisation && !organisation.pastReceivedItemIds.includes(item.id)) {
    await dbUpdate("organisations", organisation.id, {
      past_received_item_ids: [...organisation.pastReceivedItemIds, item.id],
    });
  }
  await pushUpdate({
    userId: item.donorId,
    type: "donation_completed",
    params: { itemTitle: item.title },
    linkItemId: item.id,
    linkRequestId: acceptedRequest?.id,
  });

  return updated;
}
