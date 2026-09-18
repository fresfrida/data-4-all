/**
 * @typedef {import('./types.js').DonationRequest} DonationRequest
 *
 * `request-001` is the accepted one (paired with item-001, which is why
 * item-001.status is "reserved"). `request-002` and `request-003` are both
 * pending on the same still-available item-002, demonstrating that multiple
 * organisations can have open requests before a donor accepts one
 * (DECISIONS.md D-009).
 */

/** @type {DonationRequest[]} */
export const REQUESTS = [
  {
    id: "request-001",
    itemId: "item-001",
    organisationId: "org-hanoi-pantry",
    status: "arranging_collection",
    createdAt: "2026-09-09T04:00:00.000Z",
    updatedAt: "2026-09-10T07:00:00.000Z",
  },
  {
    id: "request-002",
    itemId: "item-002",
    organisationId: "org-food-share",
    status: "requested",
    createdAt: "2026-09-10T02:00:00.000Z",
    updatedAt: "2026-09-10T02:00:00.000Z",
  },
  {
    id: "request-003",
    itemId: "item-002",
    organisationId: "org-warm-homes",
    status: "requested",
    createdAt: "2026-09-10T05:00:00.000Z",
    updatedAt: "2026-09-10T05:00:00.000Z",
  },
];
