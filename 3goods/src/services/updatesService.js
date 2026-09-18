/**
 * Notification feed ("Updates" screen). `userId` is a demo user id or an
 * organisation id (organisations act as their own notification target in
 * this prototype). No dependency on requestsService — see chatService.js
 * for why that matters.
 *
 * Notifications are stored as a language-independent `type` (a key under
 * `notifications.*` in `i18n/locales/*.json`) + `params`, never
 * pre-rendered text — see DECISIONS.md D-016. This is what lets a donor
 * and an organisation each see the same event in their own selected
 * language, and lets a later language switch re-render past notifications
 * correctly instead of leaving old ones stuck in whatever language was
 * active when they were created.
 */

import { getAll, insert, update as dbUpdate } from "../lib/db.js";

/** @returns {Promise<import('../data/types.js').UpdateNotification[]>} newest first */
export async function getUpdates(userId) {
  const rows = await getAll("updates");
  return rows
    .filter((u) => u.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * @param {{userId: string, type: string, params?: Object, linkItemId?: string, linkRequestId?: string}} payload
 * `type` must match a key under `notifications.*` in both locale files.
 */
export async function pushUpdate({ userId, type, params, linkItemId, linkRequestId }) {
  return insert(
    "updates",
    { userId, type, params: params ?? {}, linkItemId, linkRequestId, read: false, createdAt: new Date().toISOString() },
    "update",
  );
}

export async function markUpdateRead(updateId) {
  return dbUpdate("updates", updateId, { read: true });
}
