/**
 * @typedef {import('./types.js').Conversation} Conversation
 * A conversation exists only once someone has sent a message (D-075), so only the thread that has messages is seeded:
 * the accepted request-001's item (item-001) between the donor and Hanoi Community Pantry. The pending requests on
 * item-002 have no conversation until an organisation or the donor writes the first message.
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { CONVERSATION_IDS, ITEM_IDS, USER_IDS, ORG_IDS } from "./ids.js";

/** @type {Conversation[]} */
export const CONVERSATIONS = [
  {
    id: CONVERSATION_IDS.conversation001,
    itemId: ITEM_IDS.item001,
    donorId: USER_IDS.donorDemo,
    organisationId: ORG_IDS.hanoiPantry,
  },
];
