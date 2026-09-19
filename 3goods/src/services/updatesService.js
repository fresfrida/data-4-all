/**
 * Notification feed ("Updates" screen). `userId` is a demo user id or an
 * organisation id (organisations act as their own notification target in
 * this prototype — see needsService/updatesService). No dependency on
 * requestsService — see chatService.js for why that matters.
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

function fromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    params: row.params ?? {},
    linkItemId: row.link_item_id ?? undefined,
    linkRequestId: row.link_request_id ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}

/** @returns {Promise<import('../data/types.js').UpdateNotification[]>} newest first */
export async function getUpdates(userId) {
  const rows = (await getAll("updates")).map(fromRow);
  return rows
    .filter((u) => u.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * @param {{userId: string, type: string, params?: Object, linkItemId?: string, linkRequestId?: string}} payload
 * `type` must match a key under `notifications.*` in both locale files.
 */
export async function pushUpdate({ userId, type, params, linkItemId, linkRequestId }) {
  const row = await insert(
    "updates",
    {
      user_id: userId,
      type,
      params: params ?? {},
      link_item_id: linkItemId ?? null,
      link_request_id: linkRequestId ?? null,
      read: false,
      created_at: new Date().toISOString(),
    },
    "update",
  );
  return fromRow(row);
}

export async function markUpdateRead(updateId) {
  const row = await dbUpdate("updates", updateId, { read: true });
  return row ? fromRow(row) : null;
}
