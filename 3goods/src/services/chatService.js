/**
 * Conversations + messages. Session-only "delivery" — sending a message
 * just persists it to Supabase via db.js; there is no real-time transport,
 * push notification, or read receipt from another device.
 *
 * A conversation is one thread per (item, organisation, donor) and does not
 * exist until its first message is sent: `startConversation` creates the
 * conversation row and that message together (D-075). Nothing else creates one,
 * so there is never an empty or blank conversation.
 *
 * The live `messages` table's `sender_id` is a `uuid` column, so a system
 * message stores `sender_id: null` — `fromMessageRow` maps that back to the
 * `"system"` sentinel the screens check for (see DECISIONS.md D-042). New
 * system messages are no longer written; old ones (e.g. "Request accepted.")
 * still render.
 */

import { getAll, insert, rpc } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

function fromConversationRow(row) {
  return {
    id: row.id,
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
 * The existing thread between this organisation and donor about this item, or null if no message has been sent yet.
 * @param {{itemId: string, organisationId: string, donorId: string}} thread
 */
export async function findConversation({ itemId, organisationId, donorId }) {
  const rows = (await getAll("conversations")).map(fromConversationRow);
  return rows.find((c) => c.itemId === itemId && c.organisationId === organisationId && c.donorId === donorId) ?? null;
}

/**
 * Sends the first message of a thread: creates the conversation row and the message together in one database
 * transaction (the `start_conversation` function in supabase/schema.sql), so a conversation can never exist without a
 * message. If the thread already has a conversation, the message is added to it.
 *
 * @param {{itemId: string, organisationId: string, donorId: string, senderId: string, senderRole: "donor"|"organisation", text: string}} payload
 * @returns {Promise<{conversation: import('../data/types.js').Conversation, message: import('../data/types.js').Message}>}
 */
export async function startConversation(payload) {
  if (!payload.text?.trim()) throw new AppError("messageTextRequired");
  const result = await rpc("start_conversation", {
    p_item_id: payload.itemId,
    p_org_id: payload.organisationId,
    p_donor_id: payload.donorId,
    p_sender_id: payload.senderId,
    p_sender_role: payload.senderRole,
    p_body: payload.text,
  });
  return { conversation: fromConversationRow(result.conversation), message: fromMessageRow(result.message) };
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
