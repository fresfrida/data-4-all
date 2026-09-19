/**
 * @typedef {import('./types.js').UpdateNotification} UpdateNotification
 * `userId` is either a demo user id (user-donor-demo) or an organisation id
 * (organisations act as their own "user" for notification targeting in
 * this prototype — see needsService/updatesService). `type` + `params` are
 * language-independent — see types.js and DECISIONS.md D-016; the Updates
 * screen looks up `notifications.{type}` in the current locale and fills in
 * `params` at render time, rather than storing pre-rendered English text.
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { UPDATE_IDS, USER_IDS, ORG_IDS, ITEM_IDS, REQUEST_IDS } from "./ids.js";

/** @type {UpdateNotification[]} */
export const UPDATES = [
  {
    id: UPDATE_IDS.update001,
    userId: USER_IDS.donorDemo,
    type: "item_requested",
    params: { itemTitle: "10kg bag of rice" },
    linkItemId: ITEM_IDS.item001,
    linkRequestId: REQUEST_IDS.request001,
    read: true,
    createdAt: "2026-09-09T04:00:00.000Z",
  },
  {
    id: UPDATE_IDS.update002,
    userId: ORG_IDS.hanoiPantry,
    type: "request_accepted",
    params: { itemTitle: "10kg bag of rice" },
    linkItemId: ITEM_IDS.item001,
    linkRequestId: REQUEST_IDS.request001,
    read: true,
    createdAt: "2026-09-10T07:00:00.000Z",
  },
  {
    id: UPDATE_IDS.update003,
    userId: ORG_IDS.foodShare,
    type: "new_item_matching_needs",
    params: { itemTitle: "Box of canned food (mixed)" },
    linkItemId: ITEM_IDS.item002,
    read: false,
    createdAt: "2026-09-10T02:00:00.000Z",
  },
];
