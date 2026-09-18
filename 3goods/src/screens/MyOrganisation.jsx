import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getOrganisationById } from "../services/organisationsService.js";
import { getRequests, deriveDisplayStatus } from "../services/requestsService.js";
import { getItemById } from "../services/itemsService.js";
import { getAreaById } from "../services/referenceDataService.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { StatusBadge } from "../components/status/StatusBadge.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadMyOrganisation(organisationId) {
  const [organisation, requests] = await Promise.all([
    getOrganisationById(organisationId),
    getRequests({ organisationId }),
  ]);
  const area = organisation ? await getAreaById(organisation.areaId) : null;
  const requestsWithItems = [];
  for (const request of requests) {
    const item = await getItemById(request.itemId);
    requestsWithItems.push({ request, item });
  }
  return { organisation, area, requestsWithItems };
}

export function MyOrganisation() {
  const { role, isLoggedIn, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const organisationId = identity?.organisationId;
  const { status, data, error, reload } = useAsync(() => loadMyOrganisation(organisationId), [organisationId]);

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
              {t("demo.loginAsOrganisation")}
            </button>
          }
        />
      </div>
    );
  }

  if (role !== "organisation") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-card border border-dashed border-ink-600/20 bg-white/60 p-6 text-center text-sm text-ink-600">
          {t("screens.myOrganisationRoleGate")}
        </div>
      </div>
    );
  }

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
              {t("demo.loginAsOrganisation")}
            </button>
          }
        />
      </div>
    );
  }

  if (status === "loading" || !data) return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const { organisation, area, requestsWithItems } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div className="rounded-card border border-ink-600/10 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-ink-800">{organisation.name[locale] ?? organisation.name.en}</h1>
          {organisation.verified && (
            <span className="rounded-full bg-good-100 px-2.5 py-0.5 text-[10px] font-semibold text-good-600">{t("screens.verifiedBadge")}</span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-ink-600">{organisation.mission[locale] ?? organisation.mission.en}</p>
        <p className="mt-1 text-xs text-ink-600">📍 {area?.[locale] ?? area?.en}</p>
        {organisation.isDemo && (
          <span className="mt-2.5 inline-block w-fit rounded-full bg-accent-50 px-2.5 py-0.5 text-[10px] font-medium text-accent-700 border border-accent-200/60">
            {t("screens.demoOrgBadge")}
          </span>
        )}
        <div className="mt-4">
          <Link
            to={ROUTES.needsManagement}
            className="inline-block rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-600 shadow-xs transition-all"
          >
            {t("actions.manageNeeds")}
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink-800">{t("screens.requestsMadeHeading")}</h2>
        {requestsWithItems.length === 0 ? (
          <EmptyState title={t("emptyStates.noRequests")} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {requestsWithItems.map(({ request, item }) => (
              <div key={request.id} className="flex items-center justify-between gap-2 rounded-card border border-ink-600/10 bg-white p-4 shadow-xs">
                <Link to={ROUTES.item(request.itemId)} className="text-sm font-bold text-ink-800 hover:text-accent-600 hover:underline">
                  {item?.title ?? t("screens.itemFallbackLabel")}
                </Link>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item ? deriveDisplayStatus(request, item) : request.status} />
                  {(request.status === "accepted" || request.status === "arranging_collection") && (
                    <Link
                      to={ROUTES.chatList}
                      className="rounded-full border border-ink-600/20 px-3.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-800/5 transition-colors"
                    >
                      {t("nav.chat")}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
