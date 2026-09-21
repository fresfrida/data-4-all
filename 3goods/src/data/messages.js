/**
 * @typedef {import('./types.js').Message} Message
 * User-authored messages keep literal `text`, exactly as "typed," and are never translated. (System-generated messages use
 * `systemCode` + `params` instead, see types.js and DECISIONS.md D-016; none are seeded or written any more, D-075.)
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { MESSAGE_IDS, CONVERSATION_IDS, USER_IDS } from "./ids.js";

/** @type {Message[]} */
export const MESSAGES = [
  {
    id: MESSAGE_IDS.message002,
    conversationId: CONVERSATION_IDS.conversation001,
    senderId: USER_IDS.orgDemo,
    senderRole: "organisation",
    text: "Thank you! Can we collect this on Saturday?",
    createdAt: "2026-09-10T07:05:00.000Z",
  },
  {
    id: MESSAGE_IDS.message003,
    conversationId: CONVERSATION_IDS.conversation001,
    senderId: USER_IDS.donorDemo,
    senderRole: "donor",
    text: "Yes, pick-up in Hanoi works. Saturday morning is fine.",
    createdAt: "2026-09-10T07:20:00.000Z",
  },
];
