/**
 * @typedef {import('./types.js').Message} Message
 * The system message uses `systemCode` + `params`, not `text` — see
 * types.js and DECISIONS.md D-016. The two user-authored messages below
 * keep literal `text`, exactly as "typed," and are never translated.
 */

/** @type {Message[]} */
export const MESSAGES = [
  {
    id: "message-001",
    conversationId: "conversation-001",
    senderId: "system",
    senderRole: "organisation",
    systemCode: "request_accepted",
    params: {},
    createdAt: "2026-09-10T07:00:00.000Z",
  },
  {
    id: "message-002",
    conversationId: "conversation-001",
    senderId: "org-hanoi-pantry",
    senderRole: "organisation",
    text: "Thank you! Can we collect this on Saturday?",
    createdAt: "2026-09-10T07:05:00.000Z",
  },
  {
    id: "message-003",
    conversationId: "conversation-001",
    senderId: "user-donor-demo",
    senderRole: "donor",
    text: "Yes, pick-up in Hanoi works. Saturday morning is fine.",
    createdAt: "2026-09-10T07:20:00.000Z",
  },
];
