/**
 * @typedef {import('./types.js').Conversation} Conversation
 * A conversation is created automatically when a request is accepted
 * (requestsService.acceptRequest — see DECISIONS.md). This seed conversation
 * pairs with request-001 / item-001.
 */

/** @type {Conversation[]} */
export const CONVERSATIONS = [
  {
    id: "conversation-001",
    requestId: "request-001",
    donorId: "user-donor-demo",
    organisationId: "org-hanoi-pantry",
  },
];
