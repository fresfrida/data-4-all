/**
 * @typedef {import('./types.js').DonationRequest} DonationRequest
 *
 * `request-001` is the accepted one (paired with item-001, which is why
 * item-001.status is "reserved"). `request-002` and `request-003` are both
 * pending on the same still-available item-002, demonstrating that multiple
 * organisations can have open requests before a donor accepts one
 * (DECISIONS.md D-009).
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { REQUEST_IDS, ITEM_IDS, ORG_IDS } from "./ids.js";

/** @type {DonationRequest[]} */
export const REQUESTS = [
  {
    id: REQUEST_IDS.request001,
    itemId: ITEM_IDS.item001,
    organisationId: ORG_IDS.hanoiPantry,
    status: "arranging_collection",
    createdAt: "2026-09-09T04:00:00.000Z",
    updatedAt: "2026-09-10T07:00:00.000Z",
  },
  {
    id: REQUEST_IDS.request002,
    itemId: ITEM_IDS.item002,
    organisationId: ORG_IDS.foodShare,
    status: "requested",
    createdAt: "2026-09-10T02:00:00.000Z",
    updatedAt: "2026-09-10T02:00:00.000Z",
  },
  {
    id: REQUEST_IDS.request003,
    itemId: ITEM_IDS.item002,
    organisationId: ORG_IDS.warmHomes,
    status: "requested",
    createdAt: "2026-09-10T05:00:00.000Z",
    updatedAt: "2026-09-10T05:00:00.000Z",
  },
];
