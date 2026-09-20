/**
 * @typedef {import('./types.js').Conversation} Conversation
 * A conversation is created automatically when a request is *made*
 * (requestsService.createRequest, DECISIONS.md D-058), so every seeded request
 * has one: request-001 (accepted) plus the two pending requests on item-002.
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
  {
    id: CONVERSATION_IDS.conversation002,
    requestId: REQUEST_IDS.request002,
    donorId: USER_IDS.donorDemo,
    organisationId: ORG_IDS.foodShare,
  },
  {
    id: CONVERSATION_IDS.conversation003,
    requestId: REQUEST_IDS.request003,
    donorId: USER_IDS.donorDemo,
    organisationId: ORG_IDS.warmHomes,
  },
];
