import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "./SessionContext.jsx";
import { getUnreadConversationIds } from "../services/chatService.js";
import { markChatSeen, readChatSeen } from "../lib/chatSeen.js";

/**
 * The one shared "you have unread chat" state, for both roles (D-069). Both navigation bars show it on the Chat item,
 * the Chat list marks the conversations, and opening a conversation clears it. There is no push channel, so it is
 * re-checked when the route changes, when the tab regains focus, and every POLL_MS.
 */
const POLL_MS = 15000;
const UnreadChatsContext = createContext({ unreadIds: new Set(), count: 0, markSeen: () => {}, refresh: () => {} });

export function UnreadChatsProvider({ children }) {
  const { isLoggedIn, role, identity } = useSession();
  const { pathname } = useLocation();
  const [unreadIds, setUnreadIds] = useState(() => new Set());
  const latest = useRef(0);

  const identityId = identity?.id;
  const organisationId = identity?.organisationId;

  const refresh = useCallback(async () => {
    if (!isLoggedIn || !identityId || !role) {
      setUnreadIds(new Set());
      return;
    }
    const ticket = ++latest.current;
    try {
      const filter = role === "organisation" ? { organisationId } : { donorId: identityId };
      const ids = await getUnreadConversationIds(filter, role, readChatSeen(identityId));
      if (ticket === latest.current) setUnreadIds(ids);
    } catch {
      // A failed check just leaves the previous indicator in place; it is retried on the next poll.
    }
  }, [isLoggedIn, identityId, organisationId, role]);

  // Route changes and identity changes re-check straight away; the interval and focus cover a message arriving meanwhile.
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const timer = setInterval(refresh, POLL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [isLoggedIn, refresh]);

  const markSeen = useCallback(
    (conversationId, upToIso) => {
      markChatSeen(identityId, conversationId, upToIso);
      // A check already in flight was computed from the old "seen" state and would put this conversation back:
      // invalidate it (the next poll uses the new state).
      latest.current += 1;
      setUnreadIds((current) => {
        if (!current.has(conversationId)) return current;
        const next = new Set(current);
        next.delete(conversationId);
        return next;
      });
    },
    [identityId],
  );

  const value = useMemo(() => ({ unreadIds, count: unreadIds.size, markSeen, refresh }), [unreadIds, markSeen, refresh]);
  return <UnreadChatsContext.Provider value={value}>{children}</UnreadChatsContext.Provider>;
}

export const useUnreadChats = () => useContext(UnreadChatsContext);
