import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getConversationById, getMessages, sendMessage } from "../services/chatService.js";
import { getRequestById, updateRequestStatus } from "../services/requestsService.js";
import { getItemById } from "../services/itemsService.js";
import { getOrganisationById } from "../services/organisationsService.js";
import { getMessageText } from "../lib/messageText.js";
import { useSession } from "../context/SessionContext.jsx";
import { useUnreadChats } from "../context/UnreadChatsContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { StatusBadge } from "../components/status/StatusBadge.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadChatDetail(chatId) {
  const conversation = await getConversationById(chatId);
  if (!conversation) return { conversation: null };
  const [messages, request, organisation] = await Promise.all([
    getMessages(chatId),
    conversation.requestId ? getRequestById(conversation.requestId) : null,
    getOrganisationById(conversation.organisationId),
  ]);
  const item = request ? await getItemById(request.itemId) : null;
  return { conversation, messages, request, item, organisation };
}

/** One conversation's messages + collection-progress controls. */
export function ChatDetail() {
  const { chatId } = useParams();
  const { role, identity, isLoggedIn, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const { status, data, error, reload } = useAsync(() => loadChatDetail(chatId), [chatId]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { markSeen } = useUnreadChats();

  // Whatever is on screen has been seen: clears this conversation's unread mark (and the nav badge) for this viewer.
  const newestMessageAt = data?.messages?.length ? data.messages[data.messages.length - 1].createdAt : null;
  useEffect(() => {
    if (newestMessageAt) markSeen(chatId, newestMessageAt);
  }, [chatId, newestMessageAt, markSeen]);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <EmptyState
          title={t("screens.guestBrowsingTitle")}
          hint={t("demo.notSecure")}
          action={
            <button
              type="button"
              onClick={() => requireLogin(() => {})}
              className="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
            >
              {t("demo.loginPrompt")}
            </button>
          }
        />
      </div>
    );
  }

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;
  if (!data.conversation) return <ErrorState message={t("screens.conversationNoLongerExists")} />;

  const { conversation, messages, request, item, organisation } = data;
  const senderId = identity?.id;

  const partnerName = role === "organisation" ? t("screens.chatPartnerDonor") : organisation?.name[locale] ?? organisation?.name.en;
  const partnerType = role === "organisation" ? "donor" : "organisation";
  const partnerId = role === "organisation" ? conversation.donorId : organisation?.id;

  const onSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendMessage({ conversationId: chatId, senderId, senderRole: role, text: draft });
      setDraft("");
      reload();
    } finally {
      setSending(false);
    }
  };

  const onAdvance = async (nextStatus) => {
    await updateRequestStatus(request.id, nextStatus);
    reload();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex h-[72dvh] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-card border border-ink-600/10 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Avatar name={partnerName} id={partnerId} type={partnerType} size="md" />
          <div>
            <span className="text-sm font-bold text-ink-800">{partnerName}</span>
            {item && (
              <p className="text-xs text-ink-600">
                Item:{" "}
                <Link to={ROUTES.item(item.id)} className="font-semibold text-accent-600 hover:underline">
                  {item.title}
                </Link>
              </p>
            )}
          </div>
        </div>
        {request && <StatusBadge status={request.status} />}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-card border border-ink-600/10 bg-white p-4 shadow-xs">
        {messages.length === 0 && <p className="py-6 text-center text-sm text-ink-600">{t("screens.chatNoMessages")}</p>}
        {messages.map((message) => {
          if (message.senderId === "system") {
            return (
              <div key={message.id} className="mx-auto max-w-[85%] rounded-full bg-cream-200/80 px-4 py-1.5 text-center text-xs font-medium text-ink-700 border border-ink-600/10">
                {getMessageText(message, t)}
              </div>
            );
          }

          const isSelf = message.senderRole === role;

          return (
            <div key={message.id} className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
              {!isSelf && (
                <Avatar name={partnerName} id={partnerId} type={partnerType} size="xs" />
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                  isSelf ? "bg-accent-500 text-white rounded-br-none shadow-xs" : "bg-cream-100 text-ink-900 border border-ink-600/10 rounded-bl-none"
                }`}
              >
                {getMessageText(message, t)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advancement Controls */}
      {request && (request.status === "accepted" || request.status === "arranging_collection") && (
        <div className="flex gap-2">
          {request.status === "accepted" && (
            <button
              type="button"
              onClick={() => onAdvance("arranging_collection")}
              className="rounded-full border border-accent-500 px-4 py-2 text-xs font-bold text-accent-700 hover:bg-accent-50 transition-all"
            >
              {t("actions.markArranging")}
            </button>
          )}
          {request.status === "arranging_collection" && (
            <button
              type="button"
              onClick={() => onAdvance("completed")}
              className="rounded-full border border-good-600 bg-good-100 px-4 py-2 text-xs font-bold text-good-600 hover:bg-good-100/80 transition-all"
            >
              {t("actions.markCompleted")}
            </button>
          )}
        </div>
      )}

      {/* Send Message Input */}
      <form onSubmit={onSend} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("fields.messagePlaceholder")}
          className="flex-1 rounded-full border border-ink-600/20 bg-white px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none shadow-xs"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-50 transition-all shadow-xs"
        >
          {t("actions.send")}
        </button>
      </form>
    </div>
  );
}
