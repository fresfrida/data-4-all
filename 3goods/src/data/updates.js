/**
 * @typedef {import('./types.js').UpdateNotification} UpdateNotification
 * `userId` is either a demo user id (user-donor-demo) or an organisation id
 * (organisations act as their own "user" for notification targeting in
 * this prototype — see needsService/updatesService). `type` + `params` are
 * language-independent — see types.js and DECISIONS.md D-016; the Updates
 * screen looks up `notifications.{type}` in the current locale and fills in
 * `params` at render time, rather than storing pre-rendered English text.
 */

/** @type {UpdateNotification[]} */
export const UPDATES = [
  {
    id: "update-001",
    userId: "user-donor-demo",
    type: "item_requested",
    params: { itemTitle: "10kg bag of rice" },
    linkItemId: "item-001",
    linkRequestId: "request-001",
    read: true,
    createdAt: "2026-09-09T04:00:00.000Z",
  },
  {
    id: "update-002",
    userId: "org-hanoi-pantry",
    type: "request_accepted",
    params: { itemTitle: "10kg bag of rice" },
    linkItemId: "item-001",
    linkRequestId: "request-001",
    read: true,
    createdAt: "2026-09-10T07:00:00.000Z",
  },
  {
    id: "update-003",
    userId: "org-food-share",
    type: "new_item_matching_needs",
    params: { itemTitle: "Box of canned food (mixed)" },
    linkItemId: "item-002",
    read: false,
    createdAt: "2026-09-10T02:00:00.000Z",
  },
];
