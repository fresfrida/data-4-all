/**
 * Conversations + messages. Session-only "delivery" — sending a message
 * just persists it to localStorage via db.js; there is no real-time
 * transport, push notification, or read receipt from another device.
 *
 * Deliberately has no dependency on requestsService, so requestsService can
 * call into this file when a request is accepted without a circular import.
 */

import { getAll, insert } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

/**
 * @param {{donorId?: string, organisationId?: string}} [filters]
 * @returns {Promise<import('../data/types.js').Conversation[]>}
 */
export async function getConversations(filters = {}) {
  let rows = await getAll("conversations");
  if (filters.donorId) rows = rows.filter((c) => c.donorId === filters.donorId);
  if (filters.organisationId) rows = rows.filter((c) => c.organisationId === filters.organisationId);
  return rows;
}

export async function getConversationById(id) {
  const rows = await getAll("conversations");
  return rows.find((c) => c.id === id) ?? null;
}

/**
 * Idempotent — if a conversation already exists for this requestId, returns
 * it instead of creating a duplicate.
 */
export async function ensureConversationForRequest({ requestId, donorId, organisationId }) {
  const rows = await getAll("conversations");
  const existing = rows.find((c) => c.requestId === requestId);
  if (existing) return existing;
  return insert("conversations", { requestId, donorId, organisationId }, "conversation");
}

/** @returns {Promise<import('../data/types.js').Message[]>} sorted oldest-first */
export async function getMessages(conversationId) {
  const rows = await getAll("messages");
  return rows
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/**
 * @param {{conversationId: string, senderId: string, senderRole: "donor"|"organisation", text: string}} payload
 */
export async function sendMessage(payload) {
  if (!payload.text?.trim()) throw new AppError("messageTextRequired");
  return insert(
    "messages",
    {
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      senderRole: payload.senderRole,
      text: payload.text.trim(),
      createdAt: new Date().toISOString(),
    },
    "message",
  );
}

/**
 * A "senderId: system" message, e.g. the "Request accepted." status change.
 * Stored as `systemCode` + `params` (language-independent), never literal
 * text — see DECISIONS.md D-016. `systemCode` must match a key under
 * `systemMessages.*` in both locale files.
 */
export async function postSystemMessage(conversationId, systemCode, params = {}, systemRole = "organisation") {
  return insert(
    "messages",
    { conversationId, senderId: "system", senderRole: systemRole, systemCode, params, createdAt: new Date().toISOString() },
    "message",
  );
}
