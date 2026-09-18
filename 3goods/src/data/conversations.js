/**
 * @typedef {import('./types.js').Conversation} Conversation
 * A conversation is created automatically when a request is accepted
 * (requestsService.acceptRequest — see DECISIONS.md). This seed conversation
 * pairs with request-001 / item-001.
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { CONVERSATION_IDS, REQUEST_IDS, USER_IDS, ORG_IDS } from "./ids.js";

/** @type {Conversation[]} */
export const CONVERSATIONS = [
  {
    id: CONVERSATION_IDS.conversation001,
    requestId: REQUEST_IDS.request001,
    donorId: USER_IDS.donorDemo,
    organisationId: ORG_IDS.hanoiPantry,
  },
];
