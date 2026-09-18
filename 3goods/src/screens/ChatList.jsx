import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getConversations, getMessages } from "../services/chatService.js";
import { getOrganisationById } from "../services/organisationsService.js";
import { getMessageText } from "../lib/messageText.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadChatList(role, identity) {
  const filter = role === "organisation" ? { organisationId: identity?.organisationId } : { donorId: identity?.id };
  const conversations = await getConversations(filter);
  const rows = [];
  for (const conversation of conversations) {
    const messages = await getMessages(conversation.id);
    const org = await getOrganisationById(conversation.organisationId);
    rows.push({ conversation, lastMessage: messages[messages.length - 1], org });
  }
  return rows;
}

/** List of a donor's or organisation's active conversations. */
export function ChatList() {
  const { role, identity, isLoggedIn, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const { status, data, error, reload } = useAsync(() => loadChatList(role, identity), [role, identity?.id]);

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

  if (status === "loading" || !data) return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  if (data.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <EmptyState title={t("emptyStates.noConversations")} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-800">{t("nav.chat")}</h1>
      {data.map(({ conversation, lastMessage, org }) => {
        const partnerName = role === "organisation" ? t("screens.chatPartnerDonor") : org?.name[locale] ?? org?.name.en;
        const partnerType = role === "organisation" ? "donor" : "organisation";
        const partnerId = role === "organisation" ? conversation.donorId : org?.id;

        return (
          <Link
            key={conversation.id}
            to={ROUTES.chatDetail(conversation.id)}
            className="flex items-center gap-3.5 rounded-card border border-ink-600/10 bg-white p-4 shadow-xs hover:border-accent-400 hover:shadow-sm transition-all"
          >
            <Avatar name={partnerName} id={partnerId} type={partnerType} size="md" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-ink-800">{partnerName}</span>
              <span className="line-clamp-1 text-xs text-ink-600">{getMessageText(lastMessage, t)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
