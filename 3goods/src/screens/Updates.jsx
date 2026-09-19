import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getUpdates, markUpdateRead } from "../services/updatesService.js";
import { useSession } from "../context/SessionContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { ROUTES } from "../lib/constants.js";

export function Updates() {
  const { role, identity, isLoggedIn, requireLogin } = useSession();
  const t = useTranslate();
  const userId = role === "organisation" ? identity?.organisationId : identity?.id;
  const { status, data, error, reload } = useAsync(() => getUpdates(userId), [userId]);

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

  const onOpen = (update) => {
    if (!update.read) markUpdateRead(update.id).then(reload);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-800">{t("nav.updates")}</h1>
        {role === "donor" && (
          <Link to={ROUTES.discoverNeeds} className="text-sm font-semibold text-accent-600 hover:underline">
            {t("nav.organisations")}
          </Link>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState title={t("emptyStates.noUpdates")} />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((update) => (
            <Link
              key={update.id}
              to={update.linkItemId ? ROUTES.item(update.linkItemId) : "#"}
              onClick={() => onOpen(update)}
              className={`rounded-card border p-3 text-sm ${
                update.read ? "border-ink-600/10 bg-white text-ink-600" : "border-accent-300 bg-accent-50 font-medium text-ink-800"
              }`}
            >
              {t(`notifications.${update.type}`, update.params ?? undefined)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
