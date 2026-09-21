import { useUnreadChats } from "../../context/UnreadChatsContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * The unread-chat count bubble for the Chat nav item (same for donors and organisations, D-069). Renders nothing when
 * there is nothing unread. `className` positions it (over the icon on the mobile bar, beside the label on desktop).
 */
export function UnreadBadge({ className = "" }) {
  const { count } = useUnreadChats();
  const t = useTranslate();
  if (count === 0) return null;
  return (
    <span
      data-testid="chat-unread-badge"
      className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ${className}`}
    >
      <span aria-hidden="true">{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{t("a11y.unreadChats", { count })}</span>
    </span>
  );
}
