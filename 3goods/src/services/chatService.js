/**
 * Conversations + messages. Session-only "delivery" — sending a message
 * just persists it to Supabase via db.js; there is no real-time transport,
 * push notification, or read receipt from another device.
 *
 * Deliberately has no dependency on requestsService, so requestsService can
 * call into this file when a request is accepted without a circular import.
 *
 * The live `messages` table's `sender_id` is a `uuid` column, so a system
 * message (previously `senderId: "system"`) stores `sender_id: null`
 * instead — `fromMessageRow` maps that back to the `"system"` sentinel the
 * screens already check for (see DECISIONS.md D-042).
 */

import { getAll, insert } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

function fromConversationRow(row) {
  return {
    id: row.id,
    requestId: row.request_id ?? undefined,
    itemId: row.item_id ?? undefined,
    donorId: row.donor_id,
    organisationId: row.org_id,
  };
}

function fromMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id ?? "system",
    senderRole: row.sender_role ?? undefined,
    text: row.body ?? undefined,
    systemCode: row.system_code ?? undefined,
    params: row.params ?? {},
    createdAt: row.created_at,
  };
}

/**
 * @param {{donorId?: string, organisationId?: string}} [filters]
 * @returns {Promise<import('../data/types.js').Conversation[]>}
 */
export async function getConversations(filters = {}) {
  let rows = (await getAll("conversations")).map(fromConversationRow);
  if (filters.donorId) rows = rows.filter((c) => c.donorId === filters.donorId);
  if (filters.organisationId) rows = rows.filter((c) => c.organisationId === filters.organisationId);
  return rows;
}

export async function getConversationById(id) {
  const rows = (await getAll("conversations")).map(fromConversationRow);
  return rows.find((c) => c.id === id) ?? null;
}

/**
 * Idempotent — if a conversation already exists for this requestId, returns
 * it instead of creating a duplicate. Called when a request is *made*
 * (requestsService.createRequest) and again, as find-or-create, when it is
 * accepted. `request_id`/`item_id` are nullable on the table, so a
 * conversation with no request (e.g. a donor messaging a recommended
 * organisation directly) can reuse this shape later without restructuring.
 */
export async function ensureConversationForRequest({ requestId, itemId, donorId, organisationId }) {
  const rows = (await getAll("conversations")).map(fromConversationRow);
  const existing = rows.find((c) => c.requestId === requestId);
  if (existing) return existing;
  const row = await insert(
    "conversations",
    { item_id: itemId, donor_id: donorId, org_id: organisationId, request_id: requestId },
    "conversation",
  );
  return fromConversationRow(row);
}

/**
 * Conversations (for this viewer) that hold a message from the *other* party newer than what the viewer has seen.
 * System messages ("Request accepted.") are not chat messages and never count. `seen` maps conversationId -> ISO
 * timestamp of the newest message already looked at (src/lib/chatSeen.js). One conversations read + one messages read.
 * @param {{donorId?: string, organisationId?: string}} filter  whose conversations
 * @param {"donor"|"organisation"} viewerRole
 * @param {Record<string, string>} seen
 * @returns {Promise<Set<string>>} unread conversation ids
 */
export async function getUnreadConversationIds(filter, viewerRole, seen = {}) {
  const [conversations, messageRows] = await Promise.all([getConversations(filter), getAll("messages")]);
  const mine = new Set(conversations.map((c) => c.id));
  const unread = new Set();
  for (const row of messageRows) {
    if (!mine.has(row.conversation_id) || !row.sender_id) continue; // not this viewer's, or a system message
    if ((row.sender_role ?? "") === viewerRole) continue; // their own message
    if (row.created_at > (seen[row.conversation_id] ?? "")) unread.add(row.conversation_id);
  }
  return unread;
}

/** @returns {Promise<import('../data/types.js').Message[]>} sorted oldest-first */
export async function getMessages(conversationId) {
  const rows = (await getAll("messages")).map(fromMessageRow);
  return rows
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/**
 * @param {{conversationId: string, senderId: string, senderRole: "donor"|"organisation", text: string}} payload
 */
export async function sendMessage(payload) {
  if (!payload.text?.trim()) throw new AppError("messageTextRequired");
  const row = await insert(
    "messages",
    {
      conversation_id: payload.conversationId,
      sender_id: payload.senderId,
      sender_role: payload.senderRole,
      body: payload.text.trim(),
      created_at: new Date().toISOString(),
    },
    "message",
  );
  return fromMessageRow(row);
}

/**
 * A `senderId: "system"` message, e.g. the "Request accepted." status
 * change. Stored as `systemCode` + `params` (language-independent), never
 * literal text — see DECISIONS.md D-016. `systemCode` must match a key
 * under `systemMessages.*` in both locale files.
 */
export async function postSystemMessage(conversationId, systemCode, params = {}, systemRole = "organisation") {
  // A system message's only content is its code (`body` is null by design),
  // so a row without one would be genuinely blank — refuse to write it.
  if (!systemCode) throw new AppError("systemCodeRequired");
  const row = await insert(
    "messages",
    {
      conversation_id: conversationId,
      sender_id: null,
      sender_role: systemRole,
      system_code: systemCode,
      params,
      created_at: new Date().toISOString(),
    },
    "message",
  );
  return fromMessageRow(row);
}
