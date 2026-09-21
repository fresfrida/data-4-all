import { useEffect, useState } from "react";
import { translateError } from "../lib/errors.js";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getConversationById, findConversation, getMessages, sendMessage, startConversation } from "../services/chatService.js";
import { getRequests, markItemCollected } from "../services/requestsService.js";
import { getItemById } from "../services/itemsService.js";
import { getOrganisationById } from "../services/organisationsService.js";
import { getUserById } from "../services/usersService.js";
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
import { ROUTES, ITEM_STATUS } from "../lib/constants.js";

/**
 * A thread is one item + one organisation + that item's donor. It is opened either by conversation id (`/chat/:chatId`)
 * or, before anyone has said anything, by that key (`/chat/new/:itemId/:orgId/:donorId`) — in which case there is no
 * conversation row yet and `conversation` is null (D-075).
 */
async function loadChatDetail({ chatId, thread }) {
  const conversation = chatId ? await getConversationById(chatId) : await findConversation(thread);
  const key = conversation ?? thread;
  if (!key) return { key: null };
  const [messages, item, organisation, donor, requests] = await Promise.all([
    conversation ? getMessages(conversation.id) : [],
    key.itemId ? getItemById(key.itemId) : null,
    getOrganisationById(key.organisationId),
    getUserById(key.donorId),
    key.itemId ? getRequests({ itemId: key.itemId, organisationId: key.organisationId }) : [],
  ]);
  return { key, conversation, messages, item, organisation, donor, requests };
}

/** One thread's messages + the "mark as collected" control. Also the compose view for a thread with no messages yet. */
export function ChatDetail() {
  const { chatId, itemId, orgId, donorId } = useParams();
  const navigate = useNavigate();
  const { role, identity, isLoggedIn, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const { status, data, error, reload } = useAsync(
    () => loadChatDetail({ chatId, thread: itemId ? { itemId, organisationId: orgId, donorId } : null }),
    [chatId, itemId, orgId, donorId],
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [collecting, setCollecting] = useState(false);
  // Raw error object, translated at render time — see D-017.
  const [collectError, setCollectError] = useState(null);
  const { markSeen } = useUnreadChats();

  // Whatever is on screen has been seen: clears this conversation's unread mark (and the nav badge) for this viewer.
  const seenChatId = data?.conversation?.id;
  const newestMessageAt = data?.messages?.length ? data.messages[data.messages.length - 1].createdAt : null;
  useEffect(() => {
    if (seenChatId && newestMessageAt) markSeen(seenChatId, newestMessageAt);
  }, [seenChatId, newestMessageAt, markSeen]);

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
  const { key, conversation, messages, item, organisation, donor, requests } = data;
  const isParticipant = role === "donor" ? identity?.id === key?.donorId : identity?.organisationId === key?.organisationId;
  if (!key || !isParticipant) return <ErrorState message={t("screens.conversationNoLongerExists")} />;
  // Opened by key, but the thread already has a conversation: go to it.
  if (!chatId && conversation) return <Navigate to={ROUTES.chatDetail(conversation.id)} replace />;

  const senderId = identity?.id;

  const partnerName = role === "organisation" ? donor?.name ?? t("screens.chatPartnerDonor") : organisation?.name[locale] ?? organisation?.name.en;
  const partnerType = role === "organisation" ? "donor" : "organisation";
  const partnerId = role === "organisation" ? key.donorId : organisation?.id;

  // Handover is tracked on the item: this thread's organisation was accepted and the goods have not been collected yet.
  const canMarkCollected = item?.status === ITEM_STATUS.reserved && requests.some((r) => r.id === item.acceptedRequestId);

  const onSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      if (conversation) {
        await sendMessage({ conversationId: conversation.id, senderId, senderRole: role, text: draft });
        setDraft("");
        reload();
      } else {
        // First message: the conversation is created together with it, then this view continues on the real conversation.
        const started = await startConversation({ ...key, senderId, senderRole: role, text: draft });
        navigate(ROUTES.chatDetail(started.conversation.id), { replace: true });
      }
    } finally {
      setSending(false);
    }
  };

  const onMarkCollected = async () => {
    if (collecting) return;
    setCollecting(true);
    setCollectError(null);
    try {
      await markItemCollected(item.id);
    } catch (err) {
      setCollectError(err);
    } finally {
      // Refetch whether it worked or was refused (e.g. the item was already marked from another tab), so the header always shows the real status.
      reload();
      setCollecting(false);
    }
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
        {item && <StatusBadge status={item.status} kind="item" />}
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

      {/* Handover control: moves the item reserved -> collected */}
      {/* Outside the button's block on purpose: after a refused attempt the refetch hides the button, but the reason must stay visible. */}
      {collectError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{translateError(collectError, t)}</p>}
      {canMarkCollected && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMarkCollected}
            disabled={collecting}
            className="w-fit rounded-full border border-good-600 bg-good-100 px-4 py-2 text-xs font-bold text-good-600 hover:bg-good-100/80 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.markCollected")}
          </button>
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
