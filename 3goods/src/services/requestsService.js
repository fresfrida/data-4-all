/**
 * Requests are where 3goods' central business rule lives: an item can have
 * multiple pending requests, but only one accepted organisation per listing
 * (DECISIONS.md D-009). This file is the *only* place that rule is checked
 * — screens never re-implement it.
 *
 * Accepting a request also, in one place: reserves the item, ensures a
 * conversation exists, posts a system message, and pushes an update to the
 * organisation. A screen calling `acceptRequest` doesn't need to know any
 * of that happened — it just re-reads the item/request afterward.
 *
 * The live `requests` table has no `updated_at` column (see DECISIONS.md
 * D-042) — this file just stops writing/reading it rather than restoring it,
 * since nothing displays it.
 */

import { getAll, getById, insert, update as dbUpdate } from "../lib/db.js";
import { getItemById, _markItemReserved, reopenItemAvailability } from "./itemsService.js";
import { ensureConversationForRequest, postSystemMessage } from "./chatService.js";
import { pushUpdate } from "./updatesService.js";
import { AppError } from "../lib/errors.js";

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
 * requests are already pending on it (D-009). Rejected only if the item is
 * missing, already reserved, or withdrawn.
 */
export async function createRequest({ itemId, organisationId }) {
  const item = await getItemById(itemId);
  if (!item) throw new AppError("itemNotFound");
  if (item.status !== "available") {
    throw new AppError("itemNotAvailable");
  }

  const row = await insert(
    "requests",
    {
      item_id: itemId,
      org_id: organisationId,
      status: "requested",
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
 * (D-009). Throws `itemAlreadyReserved` rather than silently no-op-ing if the
 * item is already held by a *different* request — e.g. the donor accepted
 * another organisation from a second tab — so the UI shows that error instead
 * of pretending it worked. Accepting a request that has already moved past
 * "requested" (accepted / arranging / completed) is a no-op, so a stale tap
 * can't post a second "request accepted" message or regress its status.
 */
export async function acceptRequest(requestId) {
  const request = await getRequestById(requestId);
  if (!request) throw new AppError("requestNotFound");

  const item = await getItemById(request.itemId);
  if (!item) throw new AppError("itemForRequestNotFound");

  const heldByAnotherRequest = item.acceptedRequestId ? item.acceptedRequestId !== requestId : item.status === "reserved";
  if (heldByAnotherRequest) throw new AppError("itemAlreadyReserved");
  if (["accepted", "arranging_collection", "completed"].includes(request.status)) return request;

  // Independent writes go out together; the system message has to wait for
  // the conversation to exist. Fewer sequential round-trips = shorter wait
  // after the donor taps Accept.
  const [updatedRow] = await Promise.all([
    dbUpdate("requests", requestId, { status: "accepted" }),
    _markItemReserved(item.id, requestId),
  ]);

  const conversation = await ensureConversationForRequest({
    requestId,
    itemId: item.id,
    donorId: item.donorId,
    organisationId: request.organisationId,
  });
  await Promise.all([
    postSystemMessage(conversation.id, "request_accepted"),
    pushUpdate({
      userId: request.organisationId,
      type: "request_accepted",
      params: { itemTitle: item.title },
      linkItemId: item.id,
      linkRequestId: requestId,
    }),
  ]);

  return fromRow(updatedRow);
}

export async function declineRequest(requestId) {
  const row = await dbUpdate("requests", requestId, { status: "declined" });
  return row ? fromRow(row) : null;
}

/**
 * Reverts a specific request back to pending/requested status without
 * affecting other requests' own records. If this request was the one holding
 * the item, the item is released too (available again, no accepted request) —
 * otherwise it would stay reserved to a request that is no longer accepted,
 * and every sibling request would show "no longer available" with nobody able
 * to accept them.
 */
export async function revertRequestToPending(requestId) {
  const request = await getRequestById(requestId);
  if (!request) return null;
  const row = await dbUpdate("requests", requestId, { status: "requested" });
  const item = await getItemById(request.itemId);
  if (item?.acceptedRequestId === requestId) await reopenItemAvailability(item.id);
  return row ? fromRow(row) : null;
}

/**
 * Advances an already-accepted request: accepted → arranging_collection →
 * completed. On completion, also records it on the organisation's past-
 * received list so OrganisationProfile has something real to show later.
 */
export async function updateRequestStatus(requestId, status) {
  const updatedRow = await dbUpdate("requests", requestId, { status });
  if (!updatedRow) return null;
  const updated = fromRow(updatedRow);

  if (status === "completed") {
    const item = await getItemById(updated.itemId);
    if (item) {
      const { getOrganisationById } = await import("./organisationsService.js");
      const org = await getOrganisationById(updated.organisationId);
      if (org && !org.pastReceivedItemIds.includes(item.id)) {
        await dbUpdate("organisations", org.id, {
          past_received_item_ids: [...org.pastReceivedItemIds, item.id],
        });
      }
      await pushUpdate({
        userId: item.donorId,
        type: "donation_completed",
        params: { itemTitle: item.title },
        linkItemId: item.id,
        linkRequestId: requestId,
      });
    }
  }

  return updated;
}

/**
 * What a request should *show* right now (D-009). A pending request is never
 * mutated when a sibling is accepted — it's derived as "unavailable" while
 * the item is held by a different request, and goes back to plain "requested"
 * if that acceptance is undone. Every screen that shows or gates on a request's
 * status goes through this instead of reading `request.status` directly.
 */
export function deriveDisplayStatus(request, item) {
  if (request.status === "requested" && item?.acceptedRequestId && item.acceptedRequestId !== request.id) {
    return "unavailable";
  }
  return request.status;
}
