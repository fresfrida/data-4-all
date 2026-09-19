import { Link } from "react-router-dom";
import { deriveDisplayStatus } from "../../services/requestsService.js";
import { useLocale } from "../../i18n/LocaleContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";
import { StatusBadge } from "../status/StatusBadge.jsx";
import { Avatar } from "../common/Avatar.jsx";
import { Spinner } from "../feedback/Spinner.jsx";
import { ROUTES } from "../../lib/constants.js";

/**
 * One organisation's request on a donor's listing, with Chat / status /
 * Accept / Undo. Shared by Me.jsx and ItemDetail.jsx (the donor's view of
 * their own listing) so both offer exactly the same actions.
 *
 * `busy` is `{requestId, action}` from useRequestActions. Every button is
 * disabled while any action is in flight; only the tapped one shows the
 * spinner + "Accepting…".
 */
export function RequestRow({ request, item, organisation, conversation, busy, onAccept, onRevert }) {
  const { locale } = useLocale();
  const t = useTranslate();

  const orgName = organisation?.name[locale] ?? organisation?.name.en ?? request.organisationId;
  const isThisBusy = busy?.requestId === request.id;
  const disabled = Boolean(busy);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-cream-50 border border-ink-600/10">
      <div className="flex items-center gap-2.5">
        <Avatar name={orgName} id={request.organisationId} type="organisation" size="sm" />
        <div className="flex flex-col">
          <Link to={ROUTES.organisation(request.organisationId)} className="text-xs font-bold text-ink-800 hover:text-accent-600">
            {orgName}
          </Link>
          <span className="text-[10px] text-ink-600">
            {t("screens.requestedOn", { date: new Date(request.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB") })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
        {conversation && (
          <Link
            to={ROUTES.chatDetail(conversation.id)}
            className="rounded-full border border-accent-500 bg-white px-3.5 py-1 text-xs font-bold text-accent-700 hover:bg-accent-50 transition-all"
          >
            💬 {t("nav.chat")}
          </Link>
        )}

        <StatusBadge status={deriveDisplayStatus(request, item)} />

        {request.status === "requested" ? (
          <button
            type="button"
            onClick={() => onAccept(request.id)}
            disabled={disabled}
            aria-busy={isThisBusy && busy.action === "accept"}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-3.5 py-1 text-xs font-bold text-white hover:bg-accent-600 transition-all shadow-2xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThisBusy && busy.action === "accept" ? (
              <>
                <Spinner /> {t("actions.accepting")}
              </>
            ) : (
              t("actions.accept")
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRevert(request.id)}
            disabled={disabled}
            aria-busy={isThisBusy && busy.action === "revert"}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent-300 bg-accent-50 px-3 py-1 text-[11px] font-bold text-accent-700 hover:bg-accent-100 transition-all shadow-2xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThisBusy && busy.action === "revert" ? (
              <>
                <Spinner /> {t("actions.updating")}
              </>
            ) : request.status === "completed" ? (
              t("actions.reopen")
            ) : (
              t("actions.undo")
            )}
          </button>
        )}
      </div>
    </div>
  );
}
