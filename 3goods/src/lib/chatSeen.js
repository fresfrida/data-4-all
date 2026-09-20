/**
 * Which chat messages this browser has already looked at (D-069). There is no read-receipt column on `messages`, so
 * "unread" is per browser and per demo identity: for each conversation we remember the timestamp of the newest message
 * that was on screen. A message from the other party that is newer than that is unread. Goes through
 * src/lib/localStorage.js like every other stored value; if storage is unavailable everything simply counts as unread.
 */
import { safeGetItem, safeSetItem } from "./localStorage.js";

const keyFor = (identityId) => `3goods.chatSeen.${identityId}`;

/** @returns {Record<string, string>} conversationId -> ISO timestamp of the newest message seen */
export function readChatSeen(identityId) {
  if (!identityId) return {};
  try {
    return JSON.parse(safeGetItem(keyFor(identityId)) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

/** Records that everything up to `upToIso` in this conversation has been seen (never moves backwards). */
export function markChatSeen(identityId, conversationId, upToIso) {
  if (!identityId || !conversationId || !upToIso) return;
  const seen = readChatSeen(identityId);
  if (seen[conversationId] && seen[conversationId] >= upToIso) return;
  safeSetItem(keyFor(identityId), JSON.stringify({ ...seen, [conversationId]: upToIso }));
}
