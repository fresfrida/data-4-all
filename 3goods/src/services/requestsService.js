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
 */

import { getAll, getById, insert, update as dbUpdate } from "../lib/db.js";
import { getItemById, _markItemReserved } from "./itemsService.js";
import { ensureConversationForRequest, postSystemMessage } from "./chatService.js";
import { pushUpdate } from "./updatesService.js";
import { AppError } from "../lib/errors.js";

/**
 * @param {Object} [filters]
 * @param {string} [filters.itemId]
 * @param {string} [filters.organisationId]
 * @param {string} [filters.status]
 * @returns {Promise<import('../data/types.js').DonationRequest[]>}
 */
export async function getRequests(filters = {}) {
  let rows = await getAll("requests");
  if (filters.itemId) rows = rows.filter((r) => r.itemId === filters.itemId);
  if (filters.organisationId) rows = rows.filter((r) => r.organisationId === filters.organisationId);
  if (filters.status) rows = rows.filter((r) => r.status === filters.status);
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getRequestById(id) {
  return getById("requests", id);
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

  const request = await insert(
    "requests",
    {
      itemId,
      organisationId,
      status: "requested",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    "request",
  );

  await pushUpdate({
    userId: item.donorId,
    type: "item_requested",
    params: { itemTitle: item.title },
    linkItemId: item.id,
    linkRequestId: request.id,
  });

  return request;
}

/**
 * The one place "only one accepted organisation per listing" is enforced.
 * Throws rather than silently no-op-ing if the item was already reserved by
 * a different request between the donor opening the screen and tapping
 * Accept — the UI should show that error, not pretend it worked.
 */
export async function acceptRequest(requestId) {
  const request = await getRequestById(requestId);
  if (!request) throw new AppError("requestNotFound");

  const item = await getItemById(request.itemId);
  if (!item) throw new AppError("itemForRequestNotFound");

  const updatedRequest = await dbUpdate("requests", requestId, {
    status: "accepted",
    updatedAt: new Date().toISOString(),
  });
  await _markItemReserved(item.id, requestId);

  const conversation = await ensureConversationForRequest({
    requestId,
    donorId: item.donorId,
    organisationId: request.organisationId,
  });
  await postSystemMessage(conversation.id, "request_accepted");

  await pushUpdate({
    userId: request.organisationId,
    type: "request_accepted",
    params: { itemTitle: item.title },
    linkItemId: item.id,
    linkRequestId: requestId,
  });

  return updatedRequest;
}

export async function declineRequest(requestId) {
  return dbUpdate("requests", requestId, { status: "declined", updatedAt: new Date().toISOString() });
}

/** Reverts a specific request back to pending/requested status without affecting other requests. */
export async function revertRequestToPending(requestId) {
  return dbUpdate("requests", requestId, { status: "requested", updatedAt: new Date().toISOString() });
}

/**
 * Advances an already-accepted request: accepted → arranging_collection →
 * completed. On completion, also records it on the organisation's past-
 * received list so OrganisationProfile has something real to show later.
 */
export async function updateRequestStatus(requestId, status) {
  const updated = await dbUpdate("requests", requestId, { status, updatedAt: new Date().toISOString() });
  if (!updated) return null;

  if (status === "completed") {
    const item = await getItemById(updated.itemId);
    if (item) {
      const { getOrganisationById } = await import("./organisationsService.js");
      const org = await getOrganisationById(updated.organisationId);
      if (org && !org.pastReceivedItemIds.includes(item.id)) {
        await dbUpdate("organisations", org.id, {
          pastReceivedItemIds: [...org.pastReceivedItemIds, item.id],
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
 * Multiple requests can coexist so donors can distribute items (e.g. 10kg rice).
 */
export function deriveDisplayStatus(request, item) {
  return request.status;
}
