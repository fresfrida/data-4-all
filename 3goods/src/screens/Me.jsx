import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { useRequestActions } from "../lib/useRequestActions.js";
import { translateError } from "../lib/errors.js";
import { getItems } from "../services/itemsService.js";
import { getRequests } from "../services/requestsService.js";
import { getOrganisations } from "../services/organisationsService.js";
import { getConversations } from "../services/chatService.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { StatusBadge } from "../components/status/StatusBadge.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { RequestRow } from "../components/requests/RequestRow.jsx";
import { Spinner } from "../components/feedback/Spinner.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadMyDonations(donorId) {
  const [items, organisations, conversations] = await Promise.all([
    getItems({ donorId }),
    getOrganisations(),
    getConversations({ donorId }),
  ]);
  const requestsByItem = {};
  for (const item of items) {
    requestsByItem[item.id] = await getRequests({ itemId: item.id });
  }
  return { donorId, items, organisations, requestsByItem, conversations };
}

/** Donor's own profile + donation/request tracking. */
export function Me() {
  const { role, isLoggedIn, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const donorId = identity?.id;
  const { status, data, error, reload, refresh } = useAsync(() => loadMyDonations(donorId), [donorId]);
  const { busy, error: actionError, accept, revert } = useRequestActions(refresh);

  if (!isLoggedIn) {
    return (
      <EmptyState
        title={t("screens.guestBrowsingTitle")}
        hint={t("demo.notSecure")}
        action={
          <button
            type="button"
            onClick={() => requireLogin(() => {})}
            className="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
          >
            {t("demo.loginAsDonor")}
          </button>
        }
      />
    );
  }

  if (role !== "donor") {
    return (
      <div className="rounded-card border border-dashed border-ink-600/20 bg-white/60 p-6 text-center text-sm text-ink-600">
        {t("screens.meRoleGate")}
      </div>
    );
  }

  // A refetch keeps the current content on screen (light inline indicator below);
  // the full-page spinner is only for the very first load or a different donor.
  const isRefreshing = status === "loading" && data?.donorId === donorId;
  if ((status === "loading" && !isRefreshing) || !data) return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const getOrg = (orgId) => data.organisations.find((o) => o.id === orgId);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div className="flex items-center gap-3 bg-white p-5 rounded-card border border-ink-600/10 shadow-xs">
        <Avatar name={identity.name} type="donor" size="lg" />
        <div>
          <h1 className="text-xl font-extrabold text-ink-800">{identity.name}</h1>
          <p className="text-xs text-ink-600 font-medium">
            Donor Account •{" "}
            <Link to={ROUTES.discoverNeeds} className="font-semibold text-accent-600 hover:underline">
              {t("nav.organisations")}
            </Link>
          </p>
        </div>
      </div>

      {actionError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{translateError(actionError, t)}</p>}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-ink-800">{t("screens.myDonationsHeading")}</h2>
          <span className="flex items-center gap-2 text-xs font-semibold text-ink-600">
            {isRefreshing && (
              <span role="status" className="flex items-center gap-1.5 font-medium text-accent-700">
                <Spinner /> {t("actions.updating")}
              </span>
            )}
            {data.items.length} items listed
          </span>
        </div>

        {data.items.length === 0 ? (
          <EmptyState title={t("emptyStates.noItems")} hint={t("screens.postFirstDonationHint")} />
        ) : (
          <div className="flex flex-col gap-4">
            {data.items.map((item) => {
              const requests = data.requestsByItem[item.id] || [];

              return (
                <div key={item.id} className="rounded-card border border-ink-600/10 bg-white p-5 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 border-b border-ink-600/5 pb-3">
                    <div>
                      <Link to={ROUTES.item(item.id)} className="text-sm font-bold text-ink-800 hover:text-accent-600 transition-colors">
                        {item.title}
                      </Link>
                      <p className="text-xs text-ink-600">Category: {item.category} • Area: {item.areaId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} kind="item" />
                    </div>
                  </div>

                  {requests.length > 0 ? (
                    <div className="flex flex-col gap-2.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600">{t("screens.orgRequestsHeading", { count: requests.length })}</span>
                      {requests.map((request) => (
                        <RequestRow
                          key={request.id}
                          request={request}
                          item={item}
                          organisation={getOrg(request.organisationId)}
                          conversation={data.conversations.find((c) => c.requestId === request.id)}
                          busy={busy}
                          onAccept={accept}
                          onRevert={revert}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-600 italic">{t("screens.noOrgRequests")}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
